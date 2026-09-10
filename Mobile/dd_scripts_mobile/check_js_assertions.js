/**
 * check_js_assertions.js - run our `assertFromJavascript` bodies against a DOM built to match
 * the REAL component source, on the bench, before spending a Datadog run on them.
 *
 *     node Mobile/dd_scripts_mobile/check_js_assertions.js
 *
 * WHY THIS EXISTS
 *   A jsassert body is the only part of a test that Datadog cannot check until it runs, and a
 *   wrong one fails identically to a genuine defect - `false` either way, with no clue which.
 *   MOB.351 burned TWO runs across four tabs on a locator that was wrong for a reason the
 *   component's own source states plainly, and the second attempt was not a fix: it moved the
 *   locator further from its target while looking like a correction. This file is the answer
 *   to that. A run is a measurement of the APP; it should never be spent measuring my guess
 *   about a UI library that ships its source in node_modules.
 *
 * TWO RULES THAT MAKE IT WORTH TRUSTING
 *   1. ⭐ THE CODE UNDER TEST IS EXTRACTED FROM THE GENERATED JSON, never retyped here. A
 *      harness that tests a retyped copy proves nothing about what ships (trap 19), and a
 *      passing bench with a red Datadog run is worse than no bench at all.
 *   2. ⭐ EVERY ASSERTION NEEDS A MUST-FAIL CASE. A check that only ever feeds the happy DOM
 *      cannot tell a real assertion from `return true` (trap 5). Each case below states the
 *      expected verdict in both directions.
 *
 * ⚠️ WHAT IT CANNOT DO. jsdom is not Chrome and this DOM is hand-built from a source read, so
 * it proves the LOGIC is right about the structure it was told about. It cannot prove the
 * structure - only that a stated structure yields a stated verdict. If the app is upgraded,
 * re-read the component and update the builder here FIRST; a green bench against a stale
 * model is exactly the stale-green this suite exists to avoid (trap 25).
 *
 * Covers so far: MOB.351_Work_Charge_Estimates (Mantine SegmentedControl).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const MOBILE = path.dirname(__dirname);
const TESTS = path.join(MOBILE, 'dd_tests_mobile');

let JSDOM;
try {
	({ JSDOM } = require('jsdom'));
} catch (e) {
	try {
		({ JSDOM } = require(path.resolve(
			MOBILE, '../../MentorTwo/node_modules/jsdom')));
	} catch (e2) {
		// 🛑 Exits NON-ZERO on purpose. "Skipped" that reports success is how a check quietly
		// stops checking; the caller must be able to tell "passed" from "never ran".
		console.error('jsdom not found - VERIFIED NOTHING. `npm i jsdom`, or check out '
			+ 'MentorTwo beside this repo.');
		process.exit(2);
	}
}

let failures = 0;
function check(label, got, want) {
	const ok = got === want;
	if (!ok) failures++;
	console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${ok ? '' : `   got ${got}, want ${want}`}`);
}

/** Pull a step's JS body out of the built JSON, by a fragment of its step name. */
function bodyOf(testFile, nameFragment) {
	const j = JSON.parse(fs.readFileSync(path.join(TESTS, testFile)));
	const s = j.details.steps.find(
		st => st.type === 'assertFromJavascript' && st.name.includes(nameFragment));
	if (!s) throw new Error(`${testFile}: no assertFromJavascript step matching `
		+ `"${nameFragment}" - the step was renamed and this check went stale`);
	return s.params.code;
}

// `sessionStorage` is passed alongside `document` because MOB.623 carries a value between steps
// through it; jsdom only provides one when the window has a URL.
const runJs = (code, win) => {
	let ss;
	try { ss = win.sessionStorage; } catch (e) { ss = undefined; }   // opaque-origin windows throw
	return new Function('document', 'sessionStorage', `return (function(){${code}})()`)(
		win.document, ss);
};

/* ===========================================================================================
 * MOB.351 - Mantine SegmentedControl
 * Structure quoted from @mantine/core 8.3.18 esm/components/SegmentedControl/
 * SegmentedControl.mjs: root[role=radiogroup] > div.control > (input[type=radio][name=uuid]
 * + label[for=`${uuid}-${value}`] > span). The input is a SIBLING of the label, and every
 * option of one control shares `name`.
 * ========================================================================================= */
function segmentedControl(doc, uuid, values, checkedValue) {
	const root = doc.createElement('div');
	root.setAttribute('role', 'radiogroup');
	root.className = `mantine-SegmentedControl-root m-${uuid}`;
	const indicator = doc.createElement('span');
	indicator.className = 'mantine-SegmentedControl-indicator';
	root.appendChild(indicator);
	for (const v of values) {
		const ctl = doc.createElement('div');
		ctl.className = 'mantine-SegmentedControl-control';   // ⚠️ shares root's prefix
		const input = doc.createElement('input');
		input.type = 'radio';
		input.name = uuid;
		input.value = v;
		input.id = `${uuid}-${v}`;
		if (v === checkedValue) input.checked = true;
		const label = doc.createElement('label');
		label.className = 'mantine-SegmentedControl-label';   // ⚠️ so does the label's
		label.setAttribute('for', `${uuid}-${v}`);
		const span = doc.createElement('span');
		span.textContent = v;
		label.appendChild(span);
		ctl.appendChild(input);
		ctl.appendChild(label);
		root.appendChild(ctl);
	}
	return root;
}

/** The work-detail page as it really is: the charge control AND the nav footer's. */
function chargePage({ values = ['CHARGES', 'ESTIMATES'], checked = 'CHARGES', nav = true } = {}) {
	const dom = new JSDOM('<body></body>');
	const doc = dom.window.document;
	// NavFooter.tsx:45 renders a second SegmentedControl, always mounted, outside the tab
	// system. It is here so that anything counting page-wide is caught being wrong.
	if (nav) doc.body.appendChild(
		segmentedControl(doc, 'mantine-navf00', ['Work', 'Assets', 'Materials'], 'Work'));
	doc.body.appendChild(segmentedControl(doc, 'mantine-chg42', values, checked));
	return dom.window;
}

console.log('MOB.351_Work_Charge_Estimates - SegmentedControl option set + checked state');
const COUNT = bodyOf('MOB.351_Work_Charge_Estimates.json', 'offers EXACTLY');
const CHECKED = bodyOf('MOB.351_Work_Charge_Estimates.json', 'CHECKED option of the group');

const cases = [
	// label                                    options                            checked      count  checked
	['baseline, CHARGES selected', ['CHARGES', 'ESTIMATES'], 'CHARGES', true, false],
	['after switching to ESTIMATES', ['CHARGES', 'ESTIMATES'], 'ESTIMATES', true, true],
	// ⭐ the must-fail cases. Without these the count assertion could be `return true`.
	['MUST FAIL: a third section appears', ['CHARGES', 'ESTIMATES', 'QUOTES'], 'CHARGES', false, false],
	['MUST FAIL: a section is removed', ['CHARGES'], 'CHARGES', false, false],
	['MUST FAIL: ESTIMATES renamed', ['CHARGES', 'ESTIMATE'], 'CHARGES', false, false],
];
for (const [label, values, checked, wantCount, wantChecked] of cases) {
	const win = chargePage({ values, checked });
	check(`${label} - option set`, runJs(COUNT, win) === true, wantCount);
	check(`${label} - checked is ESTIMATES`, runJs(CHECKED, win) === true, wantChecked);
}

// The tab never mounted: both must return false rather than throw. A thrown error and a
// false both go red on Datadog, but only one of them is the assertion doing its job.
{
	const win = new JSDOM('<body><div>nothing here</div></body>').window;
	check('control absent - option set returns false, no throw', runJs(COUNT, win), false);
	check('control absent - checked returns false, no throw', runJs(CHECKED, win), false);
}

/* 🛑 REGRESSION GUARD for two locators that already cost four Datadog runs. They are pinned
 * FAILING here so that anyone "simplifying" the assertion back into either one is stopped on
 * the bench. Do not delete these because they look like they test nothing - that is the point:
 * they test that the obvious-looking approach does not work. */
{
	const doc = chargePage().window.document;
	const lbl = [...doc.querySelectorAll('label')]
		.find(e => (e.textContent || '').trim() === 'CHARGES');

	// run 1: the label's parent is the wrapper around ONE option, so it holds one label.
	check('run 1 - parentElement sees 1 label, never 2',
		[...lbl.parentElement.querySelectorAll('label')].length, 1);

	// run 2: `closest` starts at the element itself and the label's OWN class matches, so it
	// never walked anywhere - 0 nested labels. It was not a nearer ancestor; it was none.
	const closestEl = lbl.closest('[class*="SegmentedControl"]');
	check('run 2 - closest([class*=SegmentedControl]) returns the label ITSELF',
		closestEl === lbl, true);
	check('run 2 - so it sees 0 nested labels', [...closestEl.querySelectorAll('label')].length, 0);

	// The selector that WOULD have worked, kept as the counter-example.
	check('[class*=SegmentedControl-root] does reach the root',
		[...lbl.closest('[class*="SegmentedControl-root"]').querySelectorAll('label')].length, 2);

	// And the page-wide count, which was the other tempting shortcut: the nav footer's three
	// options are in the DOM at the same time, so "exactly two labels" is false for a reason
	// that has nothing to do with charges. `keepMounted={false}` does not cover the nav.
	check('page-wide label count is contaminated by NavFooter',
		[...doc.querySelectorAll('label')].length, 5);
}

/* ===========================================================================================
 * MOB.623 - the collector list: Mantine Accordion item > control (with the avatar Indicator)
 * + panel > Tabs (role=tab / role=tabpanel) > PhotoAttachments (Carousel slide > img, gear
 * aria-label=Settings, `Add Photo`) or FileAttachments (`Add File`) or RecordAttributeTable.
 * The PhotoMenu dropdown portals to <body> as .mantine-Menu-dropdown > button.mantine-Menu-item.
 * Structure read from AssetCollector/index.tsx, AssetAvatarWithModal.tsx, DetailPage/*.tsx,
 * PhotoCarousel/PhotoMenu.tsx and @mantine/core 8.3.18 (Accordion, Indicator, Menu).
 * ========================================================================================= */
const MOB623 = 'MOB.623_Collector_Saved_Photo_Menu.json';
const M623 = {
	photos: bodyOf(MOB623, '⭐ PHOTOS panel'),
	docs: bodyOf(MOB623, 'DOCS panel'),
	menu: bodyOf(MOB623, 'MENU SET'),
	attrs: bodyOf(MOB623, 'ATTRIBUTES panel'),
	record: bodyOf(MOB623, 'ROTATE 1/4: record'),
	landed: bodyOf(MOB623, 'UPLOAD LANDED'),
	changed: bodyOf(MOB623, 'ROTATE 1/4: the src changed'),
	tabs: bodyOf(MOB623, 'SIX tabs'),
};
const FULL_MENU = ['View in Fullscreen', 'Get Description', 'Set as Avatar', 'Rotate Image', 'Delete Photo'];

/** One collector row. `marker`/`badge` shape the control; `panel` is one of the three tabs. */
function collectorPage({ marker = 'DD SYNTHETIC MOBILE 12345678', badge = '0', panel = 'photos',
	src = '/api/attachment/abc?x=1', lastSrc, addFile = false, addPhoto = true, slides = 1, tabs = 6,
	attrRows = 0, attrEmpty = false, menu = null, extraRows = true } = {}) {
	const dom = new JSDOM('<body></body>', { url: 'http://localhost/' });
	const doc = dom.window.document;
	const row = (name, b) => {
		const item = doc.createElement('div');
		item.className = 'mantine-Accordion-item';
		const control = doc.createElement('span');
		control.className = 'mantine-Accordion-control';
		control.setAttribute('aria-expanded', 'false');
		const ind = doc.createElement('div');
		ind.className = 'mantine-Indicator-indicator';
		ind.textContent = b;
		control.appendChild(ind);
		control.appendChild(doc.createTextNode(name));
		item.appendChild(control);
		return item;
	};
	// a decoy row ABOVE ours that does NOT carry the marker (ours must be the FIRST marker row)
	if (extraRows) doc.body.appendChild(row('Pump 0102', '3'));
	const item = row(marker, badge);
	doc.body.appendChild(item);
	// Mantine renders EVERY panel as role=tabpanel; inactive ones are empty and display:none, and
	// each tab carries aria-selected + aria-controls -> its panel's id (Tab.mjs / TabsPanel.mjs).
	const names = ['General Info', 'Attributes', 'Photos', 'Docs', 'Work History', 'Readings'];
	const activeName = { photos: 'Photos', docs: 'Docs', attrs: 'Attributes' }[panel];
	let p = null;
	for (let i = 0; i < tabs; i++) {
		const t = doc.createElement('button');
		t.setAttribute('role', 'tab');
		t.textContent = names[i] || `T${i}`;
		t.setAttribute('aria-controls', `panel-${i}`);
		t.setAttribute('aria-selected', t.textContent === activeName ? 'true' : 'false');
		item.appendChild(t);
	}
	for (let i = 0; i < tabs; i++) {
		const pane = doc.createElement('div');
		pane.setAttribute('role', 'tabpanel');
		pane.id = `panel-${i}`;
		if (names[i] !== activeName) pane.style.display = 'none';
		else p = pane;
		item.appendChild(pane);
	}
	if (!p) { p = doc.createElement('div'); p.setAttribute('role', 'tabpanel'); item.appendChild(p); }
	const btn = (label) => { const b = doc.createElement('button'); b.textContent = label; p.appendChild(b); };
	if (panel === 'photos') {
		for (let i = 0; i < slides; i++) {
			const s = doc.createElement('div');
			s.className = 'mantine-Carousel-slide m-abc';
			const img = doc.createElement('img');
			const thisSrc = (i === slides - 1 && lastSrc !== undefined) ? lastSrc : src;
			if (thisSrc !== null) img.setAttribute('src', thisSrc);
			s.appendChild(img);
			const gear = doc.createElement('button');
			gear.setAttribute('aria-label', 'Settings');
			s.appendChild(gear);
			p.appendChild(s);
		}
		if (addPhoto) btn('Add Photo');
		if (addFile) btn('Add File');
	} else if (panel === 'docs') {
		if (addFile) btn('Add File');
		if (addPhoto) btn('Add Photo');
		for (let i = 0; i < slides; i++) {
			const s = doc.createElement('div'); s.className = 'mantine-Carousel-slide'; p.appendChild(s);
		}
	} else if (panel === 'attrs') {
		if (attrEmpty) { const t = doc.createElement('p'); t.textContent = 'No Attributes Found'; p.appendChild(t); }
		if (attrRows) {
			const table = doc.createElement('table');
			for (let i = 0; i < attrRows; i++) {
				const tr = doc.createElement('tr'); const td = doc.createElement('td');
				const b = doc.createElement('b'); b.textContent = `Attr ${i}`; td.appendChild(b); tr.appendChild(td); table.appendChild(tr);
			}
			p.appendChild(table);
		}
	}
	if (menu) {
		for (const items of menu) {   // an array of dropdowns, each an array of labels
			const dd = doc.createElement('div');
			dd.className = 'mantine-Menu-dropdown';
			for (const label of items) {
				const b = doc.createElement('button');
				b.className = 'mantine-Menu-item';
				const span = doc.createElement('span'); span.className = 'mantine-Menu-itemLabel';
				span.textContent = label;
				b.appendChild(span);
				dd.appendChild(b);
			}
			doc.body.appendChild(dd);
		}
	}
	return dom.window;
}

console.log('\nMOB.623_Collector_Saved_Photo_Menu - item scoping, panels, menu set, rotate proof');
// ---- item resolution: the guard must skip the decoy rows, in every assertion
check('scoping - the non-marker row above ours is skipped', runJs(M623.tabs, collectorPage()), true);
check('MUST FAIL: no row carries the marker', runJs(M623.tabs, collectorPage({ marker: 'Tank 0000' })), false);
check('MUST FAIL: five tabs', runJs(M623.tabs, collectorPage({ tabs: 5 })), false);

// ---- Photos / Docs biconditional
check('photos panel - carousel + Add Photo, no Add File', runJs(M623.photos, collectorPage()), true);
check('MUST FAIL: photos panel with Add File too', runJs(M623.photos, collectorPage({ addFile: true })), false);
check('MUST FAIL: photos panel with no slide', runJs(M623.photos, collectorPage({ slides: 0 })), false);
check('MUST FAIL: photos panel with no Add Photo', runJs(M623.photos, collectorPage({ addPhoto: false })), false);
check('docs panel - Add File, no Add Photo, no carousel', runJs(M623.docs, collectorPage({ panel: 'docs', addFile: true, addPhoto: false, slides: 0 })), true);
check('MUST FAIL: docs panel with a carousel', runJs(M623.docs, collectorPage({ panel: 'docs', addFile: true, addPhoto: false, slides: 1 })), false);
check('MUST FAIL: docs panel with Add Photo', runJs(M623.docs, collectorPage({ panel: 'docs', addFile: true, addPhoto: true, slides: 0 })), false);
check('MUST FAIL: docs panel without Add File', runJs(M623.docs, collectorPage({ panel: 'docs', addFile: false, addPhoto: false, slides: 0 })), false);
// the photos body against the docs DOM and vice versa - the two must disagree
check('cross: photos body on the docs DOM is false', runJs(M623.photos, collectorPage({ panel: 'docs', addFile: true, addPhoto: false, slides: 0 })), false);
check('cross: docs body on the photos DOM is false', runJs(M623.docs, collectorPage()), false);

// ---- Attributes XOR
check('attrs - empty state only', runJs(M623.attrs, collectorPage({ panel: 'attrs', attrEmpty: true })), true);
check('attrs - rows only', runJs(M623.attrs, collectorPage({ panel: 'attrs', attrRows: 2 })), true);
check('MUST FAIL: attrs - both', runJs(M623.attrs, collectorPage({ panel: 'attrs', attrEmpty: true, attrRows: 1 })), false);
check('MUST FAIL: attrs - neither', runJs(M623.attrs, collectorPage({ panel: 'attrs' })), false);
// 🛑 REGRESSION GUARD - the shape that cost a run: the FIRST tabpanel in the row is General Info's
// empty shell, so reading it sees neither branch. The active-panel body must still find the rows.
check('attrs - the empty General Info shell before it does not fool the active-panel lookup',
	(() => { const w = collectorPage({ panel: 'attrs', attrEmpty: true }); return w.document.querySelector('[role="tabpanel"]').textContent === '' && runJs(M623.attrs, w); })(), true);

// ---- Menu set: exact, ordered, one dropdown
check('menu - the composed five, in order', runJs(M623.menu, collectorPage({ menu: [FULL_MENU] })), true);
check('MUST FAIL: Rotate Image missing', runJs(M623.menu, collectorPage({ menu: [FULL_MENU.filter(x => x !== 'Rotate Image')] })), false);
check('MUST FAIL: an extra item', runJs(M623.menu, collectorPage({ menu: [[...FULL_MENU, 'Open Image Editor']] })), false);
check('MUST FAIL: reordered', runJs(M623.menu, collectorPage({ menu: [[...FULL_MENU].reverse()] })), false);
check('MUST FAIL: Delete Video (a video, not the PNG MOB.600 uploads)', runJs(M623.menu, collectorPage({ menu: [FULL_MENU.map(x => x === 'Delete Photo' ? 'Delete Video' : x)] })), false);
check('MUST FAIL: two dropdowns open', runJs(M623.menu, collectorPage({ menu: [FULL_MENU, FULL_MENU] })), false);
check('MUST FAIL: no dropdown', runJs(M623.menu, collectorPage()), false);

// ---- Upload landed: the LAST slide's src must be a server URL, not the optimistic preview
check('landed - server URL on the last slide', runJs(M623.landed, collectorPage()), true);
check('MUST FAIL: last slide still shows the blob: preview', runJs(M623.landed, collectorPage({ slides: 2, lastSrc: 'blob:https://dev.mentorapm.com/1234' })), false);
check('MUST FAIL: data: URL', runJs(M623.landed, collectorPage({ lastSrc: 'data:image/png;base64,AAAA' })), false);
check('MUST FAIL: no slide at all', runJs(M623.landed, collectorPage({ slides: 0 })), false);
check('MUST FAIL: img without src', runJs(M623.landed, collectorPage({ src: null })), false);
check('only the LAST slide is read - an earlier blob: slide does not matter', runJs(M623.landed, collectorPage({ slides: 2, src: 'blob:x', lastSrc: '/api/attachment/def?x=1' })), true);

// ---- Rotate: record, then require a DIFFERENT src carrying t= - on the LAST slide
{
	const two = collectorPage({ slides: 2, src: '/api/attachment/first?x=1', lastSrc: '/api/attachment/last?x=1' });
	check('rotate - records the LAST slide', runJs(M623.record, two), true);
	check('MUST FAIL: the FIRST slide changing is not our photo', (() => {
		two.document.querySelector('.mantine-Carousel-slide img').setAttribute('src', '/api/attachment/first?x=1&t=999');
		return runJs(M623.changed, two);
	})(), false);
	const imgs = two.document.querySelectorAll('.mantine-Carousel-slide img');
	imgs[imgs.length - 1].setAttribute('src', '/api/attachment/last?x=1&t=999');
	check('rotate - the LAST slide changing with t= passes', runJs(M623.changed, two), true);
}
{
	const win = collectorPage({ src: '/api/attachment/abc?x=1&t=111' });   // a stale t= from an old run
	check('rotate - record the current src', runJs(M623.record, win), true);
	check('MUST FAIL: src unchanged (even though it already carries a stale t=)', runJs(M623.changed, win), false);
	win.document.querySelector('.mantine-Carousel-slide img').setAttribute('src', '/api/attachment/abc?x=1');
	check('MUST FAIL: src changed but lost its t=', runJs(M623.changed, win), false);
	win.document.querySelector('.mantine-Carousel-slide img').setAttribute('src', '/api/attachment/abc?x=1&t=222');
	check('rotate - a different src with a fresh t= passes', runJs(M623.changed, win), true);
	const bare = collectorPage({ src: null });
	check('MUST FAIL: record with no src returns false, no throw', runJs(M623.record, bare), false);
	const fresh = collectorPage({ src: '/api/attachment/abc?x=1&t=333' });
	check('MUST FAIL: changed-check with nothing recorded returns false, no throw', runJs(M623.changed, fresh), false);
}

/* ===========================================================================================
 * MOB.865 - the Material Lookup item modal: a Mantine SegmentedControl (same structure as
 * MOB.351's, reused via segmentedControl()) above a Photos or Docs panel, plus the list row with
 * or without its `View <name> image` button. Structure from MaterialLookup/index.tsx,
 * StockAdjustments.tsx and DetailPage/Attachments.tsx.
 * ========================================================================================= */
const MOB865 = 'MOB.865_MaterialLookup_Item_Attachments.json';
const M865 = {
	segments: bodyOf(MOB865, 'SEGMENTS: exactly'),
	photos: bodyOf(MOB865, 'PHOTOS: `Add Photo`'),
	docs: bodyOf(MOB865, 'DOCS: `Add File`'),
	avatarClick: bodyOf(MOB865, 'AVATAR: click'),
	avatarXor: bodyOf(MOB865, 'AVATAR: EXACTLY ONE'),
	checked3: bodyOf(MOB865, '"Photos" segment is the CHECKED one'),
};
const SEG_LABELS = ['Quantity Adjustment', 'Stock Item', 'Photos', 'Docs'];

function materialPage({ modal = true, values = ['1', '2', '3', '4'], labels = SEG_LABELS, checked = '1',
	addPhoto = false, addFile = false, carousel = false, table = false, rowButton = false,
	modalImg = false } = {}) {
	const dom = new JSDOM('<body></body>', { url: 'http://localhost/' });
	const doc = dom.window.document;
	const tr = doc.createElement('tr');
	tr.textContent = '000-000-000 Adamantium 12 EA';
	if (rowButton) {
		const b = doc.createElement('button');
		b.setAttribute('aria-label', 'View 000-000-000 Adamantium image');
		b.addEventListener('click', () => { dom.window.__clicked = true; });
		tr.appendChild(b);
	}
	doc.body.appendChild(tr);
	if (modal) {
		const m = doc.createElement('div');
		m.className = 'mantine-Modal-content';
		const sc = segmentedControl(doc, 'mantine-seg865', values, checked);
		// relabel: MOB.351's helper writes the value as the label text
		[...sc.querySelectorAll('label span')].forEach((sp, i) => { sp.textContent = labels[i] ?? sp.textContent; });
		m.appendChild(sc);
		const btn = (label) => { const b = doc.createElement('button'); b.textContent = label; m.appendChild(b); };
		if (addPhoto) btn('Add Photo');
		if (addFile) btn('Add File');
		if (carousel) { const c = doc.createElement('div'); c.className = 'mantine-Carousel-root'; m.appendChild(c); }
		if (table) m.appendChild(doc.createElement('table'));
		if (modalImg) { const img = doc.createElement('img'); img.className = 'file-image'; m.appendChild(img); }
		doc.body.appendChild(m);
	}
	return dom.window;
}

console.log('\nMOB.865_MaterialLookup_Item_Attachments - segment set, Photos/Docs, avatar XOR');
check('segments - the four, by value and label', runJs(M865.segments, materialPage()), true);
check('MUST FAIL: a fifth segment', runJs(M865.segments, materialPage({ values: ['1','2','3','4','5'], labels: [...SEG_LABELS, 'History'] })), false);
check('MUST FAIL: Docs renamed', runJs(M865.segments, materialPage({ labels: ['Quantity Adjustment','Stock Item','Photos','Files'] })), false);
check('MUST FAIL: reordered values', runJs(M865.segments, materialPage({ values: ['1','2','4','3'] })), false);
check('MUST FAIL: no modal', runJs(M865.segments, materialPage({ modal: false })), false);
check('checked - Photos (3) selected', runJs(M865.checked3, materialPage({ checked: '3' })), true);
check('MUST FAIL: checked - still on Quantity Adjustment', runJs(M865.checked3, materialPage({ checked: '1' })), false);
check('photos - Add Photo, no Add File', runJs(M865.photos, materialPage({ addPhoto: true })), true);
check('MUST FAIL: photos with Add File', runJs(M865.photos, materialPage({ addPhoto: true, addFile: true })), false);
check('MUST FAIL: photos without Add Photo', runJs(M865.photos, materialPage()), false);
check('docs - Add File, no Add Photo, no carousel', runJs(M865.docs, materialPage({ addFile: true, table: true })), true);
check('MUST FAIL: docs with a carousel', runJs(M865.docs, materialPage({ addFile: true, carousel: true })), false);
check('MUST FAIL: docs with Add Photo', runJs(M865.docs, materialPage({ addFile: true, addPhoto: true })), false);
check('cross: photos body on the docs DOM', runJs(M865.photos, materialPage({ addFile: true })), false);
check('cross: docs body on the photos DOM', runJs(M865.docs, materialPage({ addPhoto: true, carousel: true })), false);
// avatar XOR - branch recorded by the click step, judged by the next
{
	const none = materialPage({ modal: false });
	check('avatar - no button: click step records "none"', runJs(M865.avatarClick, none) && none.sessionStorage.getItem('__dd865_avatar') === 'none', true);
	check('avatar - no button and no modal passes', runJs(M865.avatarXor, none), true);
	const noneButModal = materialPage({ modalImg: true });
	runJs(M865.avatarClick, noneButModal);
	check('MUST FAIL: no button but a modal with an image is open', runJs(M865.avatarXor, noneButModal), false);
	const withBtn = materialPage({ modal: false, rowButton: true });
	check('avatar - button: click step clicks it and records "button"', runJs(M865.avatarClick, withBtn) && withBtn.__clicked === true && withBtn.sessionStorage.getItem('__dd865_avatar') === 'button', true);
	check('MUST FAIL: button clicked but no modal opened', runJs(M865.avatarXor, withBtn), false);
	const withBtnOpened = materialPage({ rowButton: true, modalImg: true });
	runJs(M865.avatarClick, withBtnOpened);
	check('avatar - button and an open modal with img.file-image passes', runJs(M865.avatarXor, withBtnOpened), true);
	const withBtnWrongModal = materialPage({ rowButton: true, addPhoto: true });
	runJs(M865.avatarClick, withBtnWrongModal);
	check('MUST FAIL: button, but the open modal has no image (the adjust view)', runJs(M865.avatarXor, withBtnWrongModal), false);
	const nothingRecorded = materialPage({ modal: false });
	check('MUST FAIL: judged with nothing recorded returns false, no throw', runJs(M865.avatarXor, nothingRecorded), false);
}

/* ===========================================================================================
 * MOB.855 - the Material Lookup table: thead th > button > (Text label + optional FontAwesome
 * chevron with data-icon), tbody rows with an optional leading action column (canAdjust), and
 * `${totalCount} matches` text above. Structure from MaterialLookup/index.tsx.
 * ========================================================================================= */
const MOB855 = 'MOB.855_MaterialLookup_Column_Sort.json';
const M855 = {
	guard: bodyOf(MOB855, 'FIXTURE GUARD'),
	matches: bodyOf(MOB855, 'MATCH COUNT'),
	baseline: bodyOf(MOB855, 'BASELINE'),
	asc: bodyOf(MOB855, 'ASC: the chevron'),
	desc: bodyOf(MOB855, 'DESC: the chevron'),
};

function materialTable({ qtys = [3, 12, 1200], sortOn = 'Material Item', dir = 'up', action = true,
	matches, extraChevron = false } = {}) {
	const dom = new JSDOM('<body></body>', { url: 'http://localhost/' });
	const doc = dom.window.document;
	const count = doc.createElement('p');
	count.textContent = `${matches === undefined ? qtys.length : matches} matches`;
	doc.body.appendChild(count);
	const table = doc.createElement('table');
	const thead = doc.createElement('thead'); const hr = doc.createElement('tr');
	const heads = [...(action ? [''] : []), 'Material Item', 'Qty', 'UOI', 'Bins'];
	for (const h of heads) {
		const th = doc.createElement('th');
		if (h) {
			const b = doc.createElement('button');
			const t = doc.createElement('p'); t.textContent = h; b.appendChild(t);
			if (h === sortOn || (extraChevron && h === 'UOI')) {
				const svg = doc.createElement('svg'); svg.setAttribute('data-icon', `chevron-${dir}`); b.appendChild(svg);
			}
			th.appendChild(b);
		}
		hr.appendChild(th);
	}
	thead.appendChild(hr); table.appendChild(thead);
	const tbody = doc.createElement('tbody');
	for (const q of qtys) {
		const tr = doc.createElement('tr');
		const cells = [...(action ? ['*'] : []), '000-000-000 Adamantium', q.toLocaleString('en-US'), 'EA', 'No Bin'];
		for (const c of cells) { const td = doc.createElement('td'); td.textContent = c; tr.appendChild(td); }
		tbody.appendChild(tr);
	}
	table.appendChild(tbody); doc.body.appendChild(table);
	return dom.window;
}

console.log('\nMOB.855_MaterialLookup_Column_Sort - guard, match count, chevron + order');
check('guard - 3 rows, 3 distinct', runJs(M855.guard, materialTable()), true);
check('MUST FAIL: guard - all quantities equal', runJs(M855.guard, materialTable({ qtys: [5, 5, 5] })), false);
check('MUST FAIL: guard - one row', runJs(M855.guard, materialTable({ qtys: [5] })), false);
check('matches - count equals rendered rows', runJs(M855.matches, materialTable()), true);
check('matches - above the cap: 500 rows under `996 matches` (the measured case)', runJs(M855.matches, materialTable({ qtys: new Array(500).fill(1).map((_, i) => i), matches: 996 })), true);
check('matches - thousands separator in the count is parsed', runJs(M855.matches, materialTable({ qtys: new Array(500).fill(1).map((_, i) => i), matches: '1,200' })), true);
check('MUST FAIL: matches - count disagrees with rows below the cap', runJs(M855.matches, materialTable({ matches: 7 })), false);
check('MUST FAIL: matches - above the cap but fewer than 500 rows rendered', runJs(M855.matches, materialTable({ qtys: new Array(499).fill(1).map((_, i) => i), matches: 996 })), false);
check('baseline - chevron up on Material Item', runJs(M855.baseline, materialTable()), true);
check('MUST FAIL: baseline - chevron on Qty', runJs(M855.baseline, materialTable({ sortOn: 'Qty' })), false);
check('MUST FAIL: baseline - a second header also shows a chevron', runJs(M855.baseline, materialTable({ extraChevron: true })), false);
check('asc - chevron up on Qty and non-decreasing (with the action column)', runJs(M855.asc, materialTable({ sortOn: 'Qty', qtys: [1, 12, 1200] })), true);
check('asc - same without the action column (Qty index moves)', runJs(M855.asc, materialTable({ sortOn: 'Qty', qtys: [1, 12, 1200], action: false })), true);
check('asc - ties are allowed', runJs(M855.asc, materialTable({ sortOn: 'Qty', qtys: [1, 1, 12] })), true);
check('MUST FAIL: asc - chevron right, order wrong', runJs(M855.asc, materialTable({ sortOn: 'Qty', qtys: [12, 1, 1200] })), false);
check('MUST FAIL: asc - order right, chevron pointing down', runJs(M855.asc, materialTable({ sortOn: 'Qty', dir: 'down', qtys: [1, 12, 1200] })), false);
check('MUST FAIL: asc - order right, chevron on Material Item', runJs(M855.asc, materialTable({ qtys: [1, 12, 1200] })), false);
check('desc - chevron down on Qty and non-increasing (1,200 parsed past its comma)', runJs(M855.desc, materialTable({ sortOn: 'Qty', dir: 'down', qtys: [1200, 12, 1] })), true);
check('MUST FAIL: desc - ascending data', runJs(M855.desc, materialTable({ sortOn: 'Qty', dir: 'down', qtys: [1, 12, 1200] })), false);
check('MUST FAIL: no table', runJs(M855.asc, new JSDOM('<body><p>3 matches</p></body>').window), false);

/* ===========================================================================================
 * MOB.551 - AssetReadingTimeline's popover: one portaled .mantine-Popover-dropdown holding a
 * heading, an ActionIcon <button>, optional status text, and EITHER a Mantine Timeline root
 * (with 0..n items) OR a recharts container. From EventReadings/Timeline.tsx.
 * ========================================================================================= */
const MOB551 = 'MOB.551_AssetVerify_Reading_History.json';
const M551 = {
	resolved: bodyOf(MOB551, 'RESOLVED: EXACTLY ONE'),
	view1: bodyOf(MOB551, 'VIEW 1'),
	view2: bodyOf(MOB551, 'VIEW 2'),
	offline: bodyOf(MOB551, 'OFFLINE: the dropdown'),
	open: bodyOf(MOB551, 'OPEN: exactly one dropdown'),
};
function popoverPage({ dropdowns = 1, loading = false, empty = false, items = 2, view = 'timeline', offline = false } = {}) {
	const dom = new JSDOM('<body></body>'); const doc = dom.window.document;
	for (let n = 0; n < dropdowns; n++) {
		const d = doc.createElement('div'); d.className = 'mantine-Popover-dropdown';
		const h = doc.createElement('p'); h.textContent = 'Hours'; d.appendChild(h);
		d.appendChild(doc.createElement('button'));
		if (offline) { const t = doc.createElement('p'); t.textContent = 'This feature requires an internet connection.'; d.appendChild(t); }
		if (loading) { const t = doc.createElement('p'); t.textContent = 'Loading history...'; d.appendChild(t); }
		if (empty) { const t = doc.createElement('p'); t.textContent = 'No readings recorded.'; d.appendChild(t); }
		if (view === 'timeline') {
			const tl = doc.createElement('div'); tl.className = 'm_abc mantine-Timeline-root';
			for (let i = 0; i < items; i++) { const it = doc.createElement('div'); it.className = 'mantine-Timeline-item'; tl.appendChild(it); }
			d.appendChild(tl);
		} else { const c = doc.createElement('div'); c.className = 'recharts-responsive-container'; d.appendChild(c); }
		doc.body.appendChild(d);
	}
	return dom.window;
}
console.log('\nMOB.551_AssetVerify_Reading_History - popover states, toggle, offline');
check('open - one dropdown with a heading', runJs(M551.open, popoverPage()), true);
check('MUST FAIL: open - no dropdown', runJs(M551.open, popoverPage({ dropdowns: 0 })), false);
check('MUST FAIL: open - two dropdowns', runJs(M551.open, popoverPage({ dropdowns: 2 })), false);
check('resolved - items present', runJs(M551.resolved, popoverPage({ items: 2 })), true);
check('resolved - empty state', runJs(M551.resolved, popoverPage({ items: 0, empty: true })), true);
check('MUST FAIL: resolved - still loading', runJs(M551.resolved, popoverPage({ items: 0, loading: true })), false);
check('MUST FAIL: resolved - neither (0 items, no empty text)', runJs(M551.resolved, popoverPage({ items: 0 })), false);
check('MUST FAIL: resolved - both', runJs(M551.resolved, popoverPage({ items: 1, empty: true })), false);
check('view1 - timeline, no chart', runJs(M551.view1, popoverPage()), true);
check('MUST FAIL: view1 on the chart DOM', runJs(M551.view1, popoverPage({ view: 'chart' })), false);
check('view2 - chart, no timeline', runJs(M551.view2, popoverPage({ view: 'chart' })), true);
check('MUST FAIL: view2 on the timeline DOM', runJs(M551.view2, popoverPage()), false);
check('offline - message present', runJs(M551.offline, popoverPage({ offline: true })), true);
check('MUST FAIL: offline - message absent', runJs(M551.offline, popoverPage()), false);

/* ===========================================================================================
 * MOB.624 - the collector row (Accordion control with aria-expanded) and the fullscreen
 * attachments modal: name text, SegmentedControl (values 1/2), Photos or Docs panel, Done.
 * ========================================================================================= */
const MOB624 = 'MOB.624_Collector_Row_Avatar_Modal.json';
const M624 = {
	opened: bodyOf(MOB624, 'The modal opened'),
	segments: bodyOf(MOB624, 'SEGMENTS: exactly two'),
	photos: bodyOf(MOB624, 'PHOTOS: a carousel'),
	docs: bodyOf(MOB624, 'DOCS: `Add File`'),
	restored: bodyOf(MOB624, 'RESTORED: no modal'),
	badge: bodyOf(MOB624, 'badge (image/video'),
	gone: bodyOf(MOB624, 'The modal is gone'),
	sentinel: bodyOf(MOB624, 'SENTINEL (bugs §35)'),
	restore: bodyOf(MOB624, 'RESTORE: collapse the row'),
};
function avatarPage({ modal = true, expanded = false, named = true, done = true, values = ['1', '2'],
	addPhoto = false, addFile = false, slides = 0, badge = '1', marker = true } = {}) {
	const dom = new JSDOM('<body></body>'); const doc = dom.window.document;
	const item = doc.createElement('div'); item.className = 'mantine-Accordion-item';
	const control = doc.createElement('span'); control.className = 'mantine-Accordion-control';
	control.setAttribute('aria-expanded', expanded ? 'true' : 'false');
	const ind = doc.createElement('div'); ind.className = 'mantine-Indicator-indicator'; ind.textContent = badge;
	control.appendChild(ind);
	control.appendChild(doc.createTextNode(marker ? 'DD SYNTHETIC MOBILE 43398722' : 'Pipe Group 0010'));
	item.appendChild(control); doc.body.appendChild(item);
	if (modal) {
		const m = doc.createElement('div'); m.className = 'mantine-Modal-content';
		if (named) { const p = doc.createElement('p'); p.textContent = 'DD SYNTHETIC MOBILE 43398722'; m.appendChild(p); }
		m.appendChild(segmentedControl(doc, 'mantine-seg624', values, '1'));
		for (let i = 0; i < slides; i++) { const s = doc.createElement('div'); s.className = 'mantine-Carousel-slide'; m.appendChild(s); }
		const btn = (l) => { const b = doc.createElement('button'); b.textContent = l; m.appendChild(b); };
		if (addPhoto) btn('Add Photo'); if (addFile) btn('Add File'); if (done) btn('Done');
		doc.body.appendChild(m);
	}
	return dom.window;
}
console.log('\nMOB.624_Collector_Row_Avatar_Modal - badge, open, segments, Photos/Docs, restore');
check('badge - non-zero', runJs(M624.badge, avatarPage({ modal: false })), true);
check('MUST FAIL: badge - 0', runJs(M624.badge, avatarPage({ modal: false, badge: '0' })), false);
check('opened - named, Done, row still collapsed', runJs(M624.opened, avatarPage()), true);
check('MUST FAIL: opened - the accordion expanded too', runJs(M624.opened, avatarPage({ expanded: true })), false);
check('MUST FAIL: opened - no Done', runJs(M624.opened, avatarPage({ done: false })), false);
check('MUST FAIL: opened - wrong asset named', runJs(M624.opened, avatarPage({ named: false })), false);
check('segments - 1 and 2', runJs(M624.segments, avatarPage()), true);
check('MUST FAIL: segments - a third', runJs(M624.segments, avatarPage({ values: ['1', '2', '3'] })), false);
check('photos - slide + Add Photo, no Add File', runJs(M624.photos, avatarPage({ slides: 1, addPhoto: true })), true);
check('MUST FAIL: photos - no slide', runJs(M624.photos, avatarPage({ addPhoto: true })), false);
check('MUST FAIL: photos - Add File too', runJs(M624.photos, avatarPage({ slides: 1, addPhoto: true, addFile: true })), false);
check('docs - Add File, no Add Photo, no carousel', runJs(M624.docs, avatarPage({ addFile: true })), true);
check('MUST FAIL: docs - a carousel', runJs(M624.docs, avatarPage({ addFile: true, slides: 1 })), false);
check('cross: photos body on docs DOM', runJs(M624.photos, avatarPage({ addFile: true })), false);
check('restored - no modal, collapsed', runJs(M624.restored, avatarPage({ modal: false })), true);
check('MUST FAIL: restored - modal still open', runJs(M624.restored, avatarPage()), false);
check('MUST FAIL: restored - row expanded', runJs(M624.restored, avatarPage({ modal: false, expanded: true })), false);
check('gone - no modal', runJs(M624.gone, avatarPage({ modal: false })), true);
check('MUST FAIL: gone - modal still up', runJs(M624.gone, avatarPage()), false);
// bugs §35 sentinel: true while the in-modal clicks still toggle the row, ERR once it is fixed.
check('sentinel - row expanded (the §35 state)', runJs(M624.sentinel, avatarPage({ modal: false, expanded: true })), true);
check('sentinel - row collapsed (§35 fixed)', runJs(M624.sentinel, avatarPage({ modal: false })), false);
// The restore body has a SIDE EFFECT - it clicks the control when the row is open. Prove the
// click really fires, not just that the body returns true.
{
	const w = avatarPage({ modal: false, expanded: true });
	const c = w.document.querySelector('.mantine-Accordion-control');
	c.addEventListener('click', () => c.setAttribute('aria-expanded', 'false'));
	check('restore - returns true', runJs(M624.restore, w), true);
	check('restore - the click really collapsed the row', c.getAttribute('aria-expanded'), 'false');
	check('restore - and RESTORED now holds', runJs(M624.restored, w), true);
}
check('restore - no-op when already collapsed', runJs(M624.restore, avatarPage({ modal: false })), true);
check('MUST FAIL: restore - the row is gone entirely', runJs(M624.restore, avatarPage({ modal: false, marker: false })), false);

/* ===========================================================================================
 * MOB.800 - self-healing Filters drawer gate (StructuredQuery/index.tsx:267,279)
 * The body has a SIDE EFFECT: when "Add Filter" is absent it clicks the trigger. The bench
 * proves both halves - truthy only when the drawer is up, and the re-click really fires.
 * ========================================================================================= */
const MOB800 = 'MOB.800_Search_StructuredQuery.json';
const M800 = { open: bodyOf(MOB800, 'drawer opened (re-clicks') };
function lookupPage({ drawer = false, trigger = true, label = 'Add Filter' } = {}) {
	const dom = new JSDOM('<body></body>'); const doc = dom.window.document;
	let clicks = 0;
	if (trigger) {
		const b = doc.createElement('button'); b.className = 'asset-lookup-filter-button';
		b.textContent = 'Filters (0)'; b.addEventListener('click', () => { clicks++; });
		doc.body.appendChild(b);
	}
	if (drawer) { const a = doc.createElement('button'); a.textContent = label; doc.body.appendChild(a); }
	dom.window.__clicks = () => clicks;
	return dom.window;
}
console.log('\nMOB.800_Search_StructuredQuery - drawer gate heals');
{
	const w = lookupPage({ drawer: true });
	check('drawer up - true, no re-click', runJs(M800.open, w), true);
	check('drawer up - trigger untouched', w.__clicks(), 0);
	const w2 = lookupPage();
	check('MUST FAIL: drawer down', runJs(M800.open, w2), false);
	check('drawer down - trigger was re-clicked', w2.__clicks(), 1);
	check('MUST FAIL: trigger reads "Filters (0)" only (trap 5)', runJs(M800.open, lookupPage({ drawer: true, label: 'Filters (0)' })), false);
	check('MUST FAIL: "Update Filter" is the edit state, not a fresh drawer', runJs(M800.open, lookupPage({ drawer: true, label: 'Update Filter' })), false);
	check('MUST FAIL: no trigger, no drawer', runJs(M800.open, lookupPage({ trigger: false })), false);
}

/* ===========================================================================================
 * MOB.396 - state-aware workflow unfilter (InsertForm/index.tsx; Mantine Switch renders
 * input#id + label[for=id]). jsdom implements label activation, so label.click() toggles
 * the input exactly as the browser does.
 * ========================================================================================= */
const MOB396 = 'MOB.396_Work_Create_From_Asset.json';
const M396 = { unfilter: bodyOf(MOB396, 'Turn OFF whichever'), off: bodyOf(MOB396, 'now OFF') };
function insertForm({ byAsset = true, byPM = true, present = ['filterWorkflowByAsset', 'filterWorkflowByPMField'] } = {}) {
	const dom = new JSDOM('<body></body>'); const doc = dom.window.document;
	const state = { filterWorkflowByAsset: byAsset, filterWorkflowByPMField: byPM };
	for (const id of present) {
		const i = doc.createElement('input'); i.type = 'checkbox'; i.id = id; i.checked = state[id];
		const l = doc.createElement('label'); l.htmlFor = id; l.textContent = id;
		doc.body.appendChild(i); doc.body.appendChild(l);
	}
	return dom.window;
}
console.log('\nMOB.396_Work_Create_From_Asset - unfilter is state-aware');
{
	const w = insertForm();                                  // both ON (the 2026-09-09 state)
	check('both ON - body ran (both inputs found)', runJs(M396.unfilter, w), true);
	check('both ON - after one pass both are OFF', runJs(M396.off, w), true);
	const w2 = insertForm({ byAsset: false });               // the pre-2026-09-09 state
	check('asset OFF, PM ON - body ran', runJs(M396.unfilter, w2), true);
	check('asset OFF, PM ON - the OFF one was NOT flipped back on (blind-click trap)', runJs(M396.off, w2), true);
	const w3 = insertForm({ byAsset: false, byPM: false });
	runJs(M396.unfilter, w3);
	check('both OFF - untouched', runJs(M396.off, w3), true);
	check('MUST FAIL: one input missing (form not mounted)', runJs(M396.unfilter, insertForm({ present: ['filterWorkflowByPMField'] })), false);
	check('MUST FAIL: OFF-check with one still ON', runJs(M396.off, insertForm({ byAsset: false })), false);
	check('MUST FAIL: OFF-check with no form', runJs(M396.off, insertForm({ present: [] })), false);
}

/* ===========================================================================================
 * MOB.580 - the AV asset list really comes out in the chosen order.
 * The bench exists because version 1 of this test hardcoded "A/C Motor 0002 before Tank 0000"
 * and the fixture was renamed to `⚡ Tank 0000`, whose leading symbol collates BEFORE `A`.
 * The rows below use the REAL current name, so a return to a hardcoded pair fails here first.
 * ========================================================================================= */
const MOB580 = 'MOB.580_AssetVerify_Sort_Ordering.json';
const M580 = {
	asc: bodyOf(MOB580, 'PROOF (ascending)'),
	desc: bodyOf(MOB580, 'PROOF (descending)'),
	restored: bodyOf(MOB580, 'RESTORED: ascending'),
	diag: bodyOf(MOB580, 'DIAG: the app stored the "Name ▲"'),
};
function avList(names, { underline = true, sortValue = undefined, blankRow = false } = {}) {
	// a real URL, so jsdom gives the window a usable sessionStorage for the DIAG body
	const dom = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/' });
	const doc = dom.window.document;
	if (blankRow) {
		const item = doc.createElement('div'); item.className = 'mantine-Accordion-item';
		const control = doc.createElement('span'); control.className = 'mantine-Accordion-control';
		item.appendChild(control); doc.body.appendChild(item);       // a row with no name in it
	}
	for (const name of names) {
		const item = doc.createElement('div'); item.className = 'mantine-Accordion-item';
		const control = doc.createElement('span'); control.className = 'mantine-Accordion-control';
		const el = doc.createElement('span');
		if (underline) el.setAttribute('style', 'color: blue; text-decoration: underline; cursor: pointer;');
		else el.className = 'mantine-Text-root';
		el.textContent = name;
		control.appendChild(el);
		// the created-by line - a SECOND Text in the same control, which is why the name
		// selector has to be specific rather than "the first text in the row"
		const meta = doc.createElement('p'); meta.className = 'mantine-Text-root';
		meta.textContent = 'Dev Eloper, Aug 6, 2026, 3:15 PM';
		control.appendChild(meta);
		item.appendChild(control); doc.body.appendChild(item);
	}
	if (sortValue !== undefined) {
		try { dom.window.sessionStorage.setItem('mobile-Asset-sort', sortValue); } catch (e) { /* opaque origin */ }
	}
	return dom.window;
}
const TANK = '⚡ Tank 0000', MOTOR = 'A/C Motor 0002';
console.log('\nMOB.580_AssetVerify_Sort_Ordering - order is computed, never hardcoded');
check('ASC - the app order for the CURRENT names (Tank first, because ⚡ collates before A)',
	runJs(M580.asc, avList([TANK, MOTOR])), true);
check('MUST FAIL: ASC - the pre-rename arrangement, which is now unsorted',
	runJs(M580.asc, avList([MOTOR, TANK])), false);
check('DESC - the exact reverse', runJs(M580.desc, avList([MOTOR, TANK])), true);
check('MUST FAIL: DESC - given the ASC order', runJs(M580.desc, avList([TANK, MOTOR])), false);
check('ASC survives a rename: plain names sort the other way and still pass',
	runJs(M580.asc, avList([MOTOR, 'Tank 0000'])), true);
check('restored - same body as ASC', runJs(M580.restored, avList([TANK, MOTOR])), true);
check('MUST FAIL: only one row rendered (trap 5)', runJs(M580.asc, avList([TANK])), false);
check('MUST FAIL: two rows but the fixture asset is missing',
	runJs(M580.asc, avList([TANK, 'Pipe Group 0010'])), false);
check('the underline selector is not load-bearing alone - the class fallback reads it too',
	runJs(M580.asc, avList([TANK, MOTOR], { underline: false })), true);
check('MUST FAIL: a row carries no readable name at all',
	runJs(M580.asc, avList([TANK, MOTOR], { blankRow: true })), false);
check('diag - reads the stored SortValue id',
	runJs(M580.diag, avList([TANK, MOTOR], { sortValue: JSON.stringify({ id: 'name_ASC', column: 'name', dir: 'ASC' }) })), true);
check('MUST FAIL: diag - a different sort is stored',
	runJs(M580.diag, avList([TANK, MOTOR], { sortValue: JSON.stringify({ id: 'createdAt_DESC' }) })), false);
check('MUST FAIL: diag - nothing stored', runJs(M580.diag, avList([TANK, MOTOR])), false);

/* ===========================================================================================
 * DRIFT GUARD - every test that opens the Filters drawer must carry the SAME healed gate.
 * `MOB.800` was repaired on 2026-09-09 and the three siblings were not, so `MOB.996` went red
 * at `MOB.806` on the identical swallowed click one day later. The gate now lives in
 * `dd_tools.open_filters_drawer`; this fails the moment a copy drifts back out of it.
 * ========================================================================================= */
console.log('\nFilters drawer - one gate, four tests');
{
	const owners = ['MOB.800_Search_StructuredQuery.json', 'MOB.805_Search_Filter_Edit.json',
		'MOB.806_Search_MultiValue.json', 'MOB.820_Search_Filter_Then_Search.json'];
	const canonical = bodyOf(owners[0], 'drawer opened (re-clicks');
	for (const f of owners.slice(1)) {
		check(`${f.replace('.json', '')} carries the identical gate`,
			bodyOf(f, 'drawer opened (re-clicks') === canonical, true);
	}
	// and the gate itself still heals: closed drawer -> false AND the trigger gets clicked
	const drawerPage = ({ open }) => {
		const dom = new JSDOM('<body></body>'); const doc = dom.window.document;
		const trigger = doc.createElement('button');
		trigger.className = 'asset-lookup-filter-button';
		trigger.textContent = 'Filters (0)';          // reads the same open or shut (trap 5)
		let clicks = 0; trigger.addEventListener('click', () => clicks++);
		doc.body.appendChild(trigger);
		if (open) { const b = doc.createElement('button'); b.textContent = 'Add Filter'; doc.body.appendChild(b); }
		return { win: dom.window, clicks: () => clicks };
	};
	const up = drawerPage({ open: true });
	check('drawer up - true, and the trigger is NOT re-clicked', runJs(canonical, up.win), true);
	check('drawer up - click count still 0', up.clicks(), 0);
	const down = drawerPage({ open: false });
	check('MUST FAIL: drawer down', runJs(canonical, down.win), false);
	check('drawer down - the trigger was re-clicked exactly once', down.clicks(), 1);
}

/* ===========================================================================================
 * MOB.345 - which work view is RENDERED, read from the DOM.
 * The first fix asserted `sessionStorage['toggle_mobile_v_work'] !== 'true'` and went red on a
 * session that was in the list view the whole time: the key defaults to `true`, and the app
 * renders `role.mobileDownloadMode === 'SCHEDULED' && scheduledView`. Half a condition.
 * ========================================================================================= */
const M345 = { view: bodyOf('MOB.345_Work_Sort_Persist.json', 'VIEW: the work list is rendering') };
function workList({ rows = 2, groups = false, flag = 'true' } = {}) {
	const dom = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/' });
	const doc = dom.window.document;
	if (groups) for (const g of ['Past Due (2)', 'Today (1)', 'Future (3)']) {
		const b = doc.createElement('button'); b.textContent = g; doc.body.appendChild(b);
	}
	for (let i = 0; i < rows; i++) {
		const p = doc.createElement('div'); p.className = 'mantine-Paper-root';
		p.textContent = `WO-${i} Description: something`; doc.body.appendChild(p);
	}
	try { dom.window.sessionStorage.setItem('toggle_mobile_v_work', flag); } catch (e) { /* opaque */ }
	return dom.window;
}
console.log('\nMOB.345_Work_Sort_Persist - the rendered view, not the flag');
check('list view - rows, no group headers', runJs(M345.view, workList()), true);
check('⭐ list view still true with the flag stuck at "true" (the ASSIGNED-role state)',
	runJs(M345.view, workList({ flag: 'true' })), true);
check('MUST FAIL: scheduled view - group headers present',
	runJs(M345.view, workList({ groups: true })), false);
check('MUST FAIL: empty page - absence alone must not pass (trap 5)',
	runJs(M345.view, workList({ rows: 0 })), false);
check('MUST FAIL: group headers and no rows', runJs(M345.view, workList({ rows: 0, groups: true })), false);

console.log('\nMOB.345 - the narrowing guard (the reversal invariant needs a whole list)');
{
	const narrowed = bodyOf('MOB.345_Work_Sort_Persist.json', 'NARROWED: between 2 and 15');
	const rows = (texts) => {
		const dom = new JSDOM('<body></body>'); const doc = dom.window.document;
		for (const t of texts) {
			const p = doc.createElement('div'); p.className = 'mantine-Paper-root';
			p.textContent = `${t} Description: x`; doc.body.appendChild(p);
		}
		return dom.window;
	};
	check('4 distinct rows - narrowed', runJs(narrowed, rows(['A-1', 'A-2', 'A-3', 'A-4'])), true);
	check('MUST FAIL: 1 row - an order over one row is vacuous (trap 5)', runJs(narrowed, rows(['A-1'])), false);
	check('MUST FAIL: 0 rows - the term matched nothing', runJs(narrowed, rows([])), false);
	check('MUST FAIL: 16 rows - the filter did not bite, so Virtuoso may be windowing',
		runJs(narrowed, rows(Array.from({ length: 16 }, (_, i) => `A-${i}`))), false);
	check('MUST FAIL: duplicate row text - the rows cannot be told apart',
		runJs(narrowed, rows(['SAME', 'SAME', 'OTHER'])), false);
}

/* ===========================================================================================
 * MOB.546 - the AV asset detail's Attachments tab. `InfiniteTabs` sets keepMounted={false},
 * so exactly ONE [role=tabpanel] is mounted - the opposite of the collector's tabs, where the
 * inactive panels linger as empty display:none shells and cost MOB.623 a run. Both facts are
 * modelled here so the difference is pinned rather than remembered.
 * ========================================================================================= */
const MOB546 = 'MOB.546_AssetVerify_Asset_Attachments.json';
const M546 = {
	one: bodyOf(MOB546, 'The ACTIVE panel holds the attachments UI'),
	segments: bodyOf(MOB546, 'SEGMENTS: exactly two'),
	photos: bodyOf(MOB546, 'PHOTOS: a carousel'),
	docs: bodyOf(MOB546, 'DOCS: a real download row'),
	restored: bodyOf(MOB546, 'RESTORED: the "General Info" tab'),
};
/**
 * The REAL Mantine shape, read from TabsPanel.mjs:24,32 - every tab keeps a
 * <div role="tabpanel">, the inactive ones carry display:none and, under keepMounted={false},
 * no children at all. `shells` is how many of those empties sit beside the live panel.
 */
function detailPage({ live = true, shells = 5, values = ['1', '2'], slides = 0, files = 0,
	addPhoto = false, addFile = false, selectedTab = 'General Info', segmented = true,
	linkPanel = true, extraFilled = 0 } = {}) {
	const dom = new JSDOM('<body></body>'); const doc = dom.window.document;
	const tab = doc.createElement('button');
	tab.setAttribute('role', 'tab'); tab.setAttribute('aria-selected', 'true');
	tab.textContent = selectedTab;
	if (linkPanel) tab.setAttribute('aria-controls', 'panel-live');
	doc.body.appendChild(tab);
	for (let i = 0; i < shells; i++) {                       // empty display:none siblings
		const sh = doc.createElement('div');
		sh.setAttribute('role', 'tabpanel'); sh.setAttribute('id', `panel-shell${i}`);
		sh.style.display = 'none';
		if (i < extraFilled) sh.textContent = 'leftover content';   // the keepMounted regression
		doc.body.appendChild(sh);
	}
	if (live) {
		const p = doc.createElement('div');
		p.setAttribute('role', 'tabpanel'); p.setAttribute('id', 'panel-live');
		if (segmented) p.appendChild(segmentedControl(doc, 'mantine-att', values, '1'));
		for (let n = 0; n < slides; n++) {
			const sl = doc.createElement('div'); sl.className = 'mantine-Carousel-slide'; p.appendChild(sl);
		}
		for (let n = 0; n < files; n++) {
			const a = doc.createElement('a'); a.setAttribute('href', `/api/attachment/abc${n}`);
			a.textContent = `doc-${n}.pdf`; p.appendChild(a);
		}
		const btn = (l) => { const b = doc.createElement('button'); b.textContent = l; p.appendChild(b); };
		if (addPhoto) btn('Add Photo'); if (addFile) btn('Add File');
		doc.body.appendChild(p);
	}
	return dom.window;
}
console.log('\nMOB.546_AssetVerify_Asset_Attachments - one mounted panel, Photos/Docs both real');
check('the live panel among 5 empty shells', runJs(M546.one, detailPage()), true);
check('found via display:none fallback when the tab has no aria-controls',
	runJs(M546.one, detailPage({ linkPanel: false })), true);
check('MUST FAIL: no live panel at all', runJs(M546.one, detailPage({ live: false })), false);
check('MUST FAIL: a shell kept its content too (keepMounted regression)',
	runJs(M546.one, detailPage({ extraFilled: 1 })), false);
check('MUST FAIL: the live panel has no segmented control (wrong tab open)',
	runJs(M546.one, detailPage({ segmented: false })), false);
check('MUST FAIL: a single panel with no siblings - not this page',
	runJs(M546.one, detailPage({ shells: 0 })), false);
check('segments - 1 and 2', runJs(M546.segments, detailPage()), true);
check('MUST FAIL: segments - a third', runJs(M546.segments, detailPage({ values: ['1', '2', '3'] })), false);
check('photos - slide + Add Photo, no Add File',
	runJs(M546.photos, detailPage({ slides: 3, addPhoto: true })), true);
check('MUST FAIL: photos - Add Photo but no slide', runJs(M546.photos, detailPage({ addPhoto: true })), false);
check('MUST FAIL: photos - Add File is showing too',
	runJs(M546.photos, detailPage({ slides: 1, addPhoto: true, addFile: true })), false);
check('docs - a download anchor + Add File, no carousel, no Add Photo',
	runJs(M546.docs, detailPage({ files: 1, addFile: true })), true);
check('MUST FAIL: docs - the panel is empty of files (an empty Docs tab must not pass, trap 5)',
	runJs(M546.docs, detailPage({ addFile: true })), false);
check('MUST FAIL: docs - a carousel is still up (the segment did not switch)',
	runJs(M546.docs, detailPage({ files: 1, addFile: true, slides: 1 })), false);
check('cross: the photos body on the docs DOM', runJs(M546.photos, detailPage({ files: 1, addFile: true })), false);
check('restored - General Info is selected', runJs(M546.restored, detailPage()), true);
check('MUST FAIL: restored - still on Attachments',
	runJs(M546.restored, detailPage({ selectedTab: 'Attachments' })), false);

console.log('\nMOB.345 - the reversal proof survives rows arriving mid-test');
{
	const proof = bodyOf('MOB.345_Work_Sort_Persist.json', 'every row rendered in BOTH orders');
	const page = (texts, stash) => {
		const dom = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/' });
		const doc = dom.window.document;
		for (const t of texts) {
			const p = doc.createElement('div'); p.className = 'mantine-Paper-root';
			p.textContent = `${t} Description: x`; doc.body.appendChild(p);
		}
		try { dom.window.sessionStorage.setItem('__dd345_asc', JSON.stringify(stash.map(t => `${t} Description: x`))); } catch (e) { /* opaque */ }
		return dom.window;
	};
	check('plain reversal', runJs(proof, page(['C', 'B', 'A'], ['A', 'B', 'C'])), true);
	// ⭐ the 2026-09-10 case: '6' paged in between the two reads, and '1' scrolled out
	check('⭐ a row ARRIVED and another LEFT - the common rows are still reversed',
		runJs(proof, page(['6', 'C', 'B'], ['A', 'B', 'C'])), true);
	check('MUST FAIL: the common rows are in the SAME order (no sort happened)',
		runJs(proof, page(['B', 'C', '6'], ['A', 'B', 'C'])), false);
	check('MUST FAIL: only one row in common - proves nothing, and means narrowing stopped',
		runJs(proof, page(['C', '7', '8'], ['A', 'B', 'C'])), false);
	check('MUST FAIL: nothing in common at all (two disjoint Virtuoso windows)',
		runJs(proof, page(['X', 'Y', 'Z'], ['A', 'B', 'C'])), false);
	check('MUST FAIL: no captured order to compare against',
		runJs(proof, page(['C', 'B', 'A'], [])), false);
}

/* ===========================================================================================
 * MOB.547 - the tag search create button. The rule became "no EXACT match" (Tags/reducer.ts:
 * 46-57), so a PARTIAL term shows results AND the create option - the case the old rule made
 * impossible, and the one worth pinning.
 * ========================================================================================= */
const MOB547 = 'MOB.547_AssetVerify_Photo_Tag_Search.json';
const M547 = {
	partial: bodyOf(MOB547, 'PARTIAL: "Batter"'),
	exact: bodyOf(MOB547, 'EXACT: "  cUSTOM  "'),
	none: bodyOf(MOB547, 'NO MATCH: no tag options'),
	type: bodyOf(MOB547, 'Type the partial term'),
	badge: bodyOf(MOB547, "Open the tag editor from the carousel's tag badge"),
};
function tagDropdown({ tags = [], create = null } = {}) {
	const dom = new JSDOM('<body></body>'); const doc = dom.window.document;
	const input = doc.createElement('input');
	input.setAttribute('placeholder', 'Search tags...'); doc.body.appendChild(input);
	for (const t of tags) {
		const o = doc.createElement('div'); o.setAttribute('role', 'option');
		o.textContent = t; doc.body.appendChild(o);
	}
	if (create !== null) {
		const o = doc.createElement('div'); o.setAttribute('role', 'option');
		o.textContent = `+ Create Tag '${create}'`; doc.body.appendChild(o);
	}
	return dom.window;
}
console.log('\nMOB.547_AssetVerify_Photo_Tag_Search - create is an XOR with an exact match');
check('partial - Battery Pack listed AND create offered',
	runJs(M547.partial, tagDropdown({ tags: ['Battery Pack'], create: 'Batter' })), true);
check('MUST FAIL: partial - the old rule (results, so no create button)',
	runJs(M547.partial, tagDropdown({ tags: ['Battery Pack'] })), false);
check('MUST FAIL: partial - create offered but the match is missing',
	runJs(M547.partial, tagDropdown({ create: 'Batter' })), false);
check('exact - two options, none of them a create entry',
	runJs(M547.exact, tagDropdown({ tags: ['Custom', 'Custom 4-21'] })), true);
check('MUST FAIL: exact - a create button is still showing',
	runJs(M547.exact, tagDropdown({ tags: ['Custom', 'Custom 4-21'], create: 'cUSTOM' })), false);
check('MUST FAIL: exact - only the prefixed tag matched, not the exact one',
	runJs(M547.exact, tagDropdown({ tags: ['Custom 4-21', 'Customised'] })), false);
check('MUST FAIL: exact - one option only (the second is what makes results/create independent)',
	runJs(M547.exact, tagDropdown({ tags: ['Custom'] })), false);
check('no match - zero tags, create offered',
	runJs(M547.none, tagDropdown({ create: 'ZZZZ-NO-SUCH-TAG' })), true);
check('MUST FAIL: no match - a tag slipped through',
	runJs(M547.none, tagDropdown({ tags: ['Battery Pack'], create: 'ZZZZ-NO-SUCH-TAG' })), false);
check('MUST FAIL: no match - nothing offered at all (dropdown never opened)',
	runJs(M547.none, tagDropdown({})), false);
// The typing step must go through React's value setter, not `el.value = x`.
{
	const w = tagDropdown({});
	const el = w.document.querySelector('input');
	let events = 0; el.addEventListener('input', () => events++);
	check('type - returns true', runJs(M547.type, w), true);
	check('type - the input really holds the term', el.value, 'Batter');
	check('type - an input event fired, so React sees it', events, 1);
	check('MUST FAIL: type - no search input on the page', runJs(M547.type, tagDropdown({}).document ? new JSDOM('<body></body>').window : null), false);
}
// The badge opener: a NAME badge with the component's green outline must be clickable.
{
	const dom = new JSDOM('<body></body>'); const doc = dom.window.document;
	const tabEl = doc.createElement('button');
	tabEl.setAttribute('role', 'tab'); tabEl.setAttribute('aria-selected', 'true');
	tabEl.setAttribute('aria-controls', 'p1'); doc.body.appendChild(tabEl);
	const panel = doc.createElement('div');
	panel.setAttribute('role', 'tabpanel'); panel.setAttribute('id', 'p1');
	const badge = doc.createElement('span');
	badge.className = 'mantine-Badge-root';
	// ⚠️ the browser SERIALISES the component's `#8dc63f` as rgb() - model what Chrome
	// actually returns from getAttribute('style'), not what the source was written as.
	badge.setAttribute('style', 'outline: 1px solid rgb(141, 198, 63); cursor: pointer;');
	badge.textContent = 'LENS: NAMEPLATE EXTRACTION';       // the fixture photo's real badge
	let clicks = 0; badge.addEventListener('click', () => clicks++);
	panel.appendChild(badge); doc.body.appendChild(panel);
	check('badge - a NAME badge (not "Edit Tags") is found and clicked', runJs(M547.badge, dom.window), true);
	check('badge - the click really fired', clicks, 1);
}
// the same badge with ONLY the serialised colour (no cursor rule) must still be found
{
	const dom = new JSDOM('<body></body>'); const doc = dom.window.document;
	const tabEl = doc.createElement('button');
	tabEl.setAttribute('role', 'tab'); tabEl.setAttribute('aria-selected', 'true');
	tabEl.setAttribute('aria-controls', 'p1'); doc.body.appendChild(tabEl);
	const panel = doc.createElement('div');
	panel.setAttribute('role', 'tabpanel'); panel.setAttribute('id', 'p1');
	const badge = doc.createElement('span');
	badge.className = 'mantine-Badge-root';
	badge.setAttribute('style', 'outline: 1px solid rgb(141, 198, 63);');
	badge.textContent = 'Project';
	let clicks = 0; badge.addEventListener('click', () => clicks++);
	panel.appendChild(badge); doc.body.appendChild(panel);
	check('badge - found by the serialised rgb() colour alone', runJs(M547.badge, dom.window), true);
	check('badge - and clicked', clicks, 1);
}
{
	const dom = new JSDOM('<body></body>'); const doc = dom.window.document;
	const tabEl = doc.createElement('button');
	tabEl.setAttribute('role', 'tab'); tabEl.setAttribute('aria-selected', 'true');
	tabEl.setAttribute('aria-controls', 'p1'); doc.body.appendChild(tabEl);
	const panel = doc.createElement('div');
	panel.setAttribute('role', 'tabpanel'); panel.setAttribute('id', 'p1');
	const other = doc.createElement('span');
	other.className = 'mantine-Badge-root'; other.textContent = '5';   // an Indicator-style badge
	panel.appendChild(other); doc.body.appendChild(panel);
	check('MUST FAIL: badge - only an unrelated badge, no tag overlay', runJs(M547.badge, dom.window), false);
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL PASS');
process.exit(failures ? 1 : 0);
