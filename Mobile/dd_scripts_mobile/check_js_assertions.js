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
};
function avatarPage({ modal = true, expanded = false, named = true, done = true, values = ['1', '2'],
	addPhoto = false, addFile = false, slides = 0, badge = '1' } = {}) {
	const dom = new JSDOM('<body></body>'); const doc = dom.window.document;
	const item = doc.createElement('div'); item.className = 'mantine-Accordion-item';
	const control = doc.createElement('span'); control.className = 'mantine-Accordion-control';
	control.setAttribute('aria-expanded', expanded ? 'true' : 'false');
	const ind = doc.createElement('div'); ind.className = 'mantine-Indicator-indicator'; ind.textContent = badge;
	control.appendChild(ind); control.appendChild(doc.createTextNode('DD SYNTHETIC MOBILE 43398722'));
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

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL PASS');
process.exit(failures ? 1 : 0);
