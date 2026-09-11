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
	// `window` too: MOB.123 carries ids between steps on it (MOB.470's `__ddSW` proved that
	// survives from one Datadog step to the next while the page does not navigate).
	// `location` and `navigator` for MOB.980, which reads the route and `navigator.onLine`.
	return new Function('document', 'sessionStorage', 'window', 'location', 'navigator',
		`return (function(){${code}})()`)(win.document, ss, win, win.location, win.navigator);
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

/* ===========================================================================================
 * MOB.123 - the map's `Switch Map` picker. Structure from ViewSelectButton.tsx (Mantine Modal >
 * FormFieldContainer "Select a map" > SelectInput) and @mantine/core 8.3.18: Select renders a
 * visible input plus Combobox.HiddenInput (value = the selected id); the portaled dropdown is
 * [role=listbox] > [role=option][value=id][aria-selected] > span(label) (OptionsDropdown.mjs,
 * withCheckIcon=false). The modal's close button carries `mantine-Modal-close`.
 * ========================================================================================= */
const MOB123 = 'MOB.123_Map_Switch_Map.json';
const M123 = {
	capture: bodyOf(MOB123, 'CAPTURE: `mobile-map-id` holds the map on screen'),
	open: bodyOf(MOB123, 'OPEN: the `Select a map` modal holds the STORED map'),
	options: bodyOf(MOB123, 'OPTIONS: at least 2 maps listed'),
	close: bodyOf(MOB123, 'Close the picker with its close button'),
	dismiss: bodyOf(MOB123, 'DISMISS: the picker is gone'),
	pickCapture: bodyOf(MOB123, 'CAPTURE: the first map that is NOT the current one'),
	switched: bodyOf(MOB123, 'SWITCHED: `mobile-map-id` now holds the PICKED map'),
	readback: bodyOf(MOB123, 'READBACK: the reopened picker holds the NEW map'),
	restore: bodyOf(MOB123, 'RESTORE: pick the original map back'),
	restored: bodyOf(MOB123, 'RESTORED: no picker is open'),
};
const MAPS = [['m1', 'Map 1- N Alexander Street'], ['m2', 'Map 2- Buildings'], ['m3', 'Map 3 - Superdome']];
function mapPage({ stored = 'm1', modal = false, selected = stored, shown = undefined,
	dropdown = false, maps = MAPS, checked = selected, closeBtn = true, rawStored = undefined } = {}) {
	const dom = new JSDOM('<body></body>', { url: 'https://dev.example/map' });
	const w = dom.window; const doc = w.document;
	if (rawStored !== undefined) w.sessionStorage.setItem('mobile-map-id', rawStored);
	else if (stored !== null) w.sessionStorage.setItem('mobile-map-id', JSON.stringify(stored));
	const btn = doc.createElement('button');
	btn.setAttribute('aria-label', 'Switch Map'); doc.body.appendChild(btn);
	if (modal) {
		const c = doc.createElement('section');
		c.className = 'm_1b7284a3 mantine-Modal-content mantine-Paper-root';
		if (closeBtn) {
			const x = doc.createElement('button');
			x.className = 'mantine-focus-auto mantine-CloseButton-root mantine-Modal-close';
			x.addEventListener('click', () => { c.remove(); });
			c.appendChild(x);
		}
		const lab = doc.createElement('label'); lab.textContent = 'Select a map'; c.appendChild(lab);
		const input = doc.createElement('input'); input.className = 'mantine-Select-input input';
		const hit = maps.find(([id]) => id === selected);
		input.value = shown !== undefined ? shown : (hit ? hit[1] : '');
		c.appendChild(input);
		const hidden = doc.createElement('input'); hidden.type = 'hidden';
		hidden.value = selected || ''; c.appendChild(hidden);
		doc.body.appendChild(c);
	}
	if (dropdown) {
		const lb = doc.createElement('div'); lb.setAttribute('role', 'listbox');
		for (const [id, label] of maps) {
			const o = doc.createElement('div'); o.setAttribute('role', 'option');
			o.setAttribute('value', id);
			o.setAttribute('aria-selected', String(id === checked));
			const sp = doc.createElement('span'); sp.textContent = label; o.appendChild(sp);
			o.addEventListener('click', () => { w.__clicked = id; });
			lb.appendChild(o);
		}
		doc.body.appendChild(lb);
	}
	return w;
}
console.log('\nMOB.123_Map_Switch_Map - switch, read back, restore; nothing hardcoded');
{
	const w = mapPage();
	check('capture - a stored JSON id is captured', runJs(M123.capture, w), true);
	check('capture - onto window', w.__ddMapBefore, 'm1');
	check('MUST FAIL: capture - nothing stored', runJs(M123.capture, mapPage({ stored: null })), false);
	check('MUST FAIL: capture - the empty default ("" when the session had not loaded)',
		runJs(M123.capture, mapPage({ stored: '' })), false);
	check('MUST FAIL: capture - not JSON (a raw id written by something else)',
		runJs(M123.capture, mapPage({ rawStored: 'm1' })), false);
}
const withVars = (w, vars) => Object.assign(w, vars);
check('open - modal holds the stored map by id, and names it',
	runJs(M123.open, withVars(mapPage({ modal: true }), { __ddMapBefore: 'm1' })), true);
check('MUST FAIL: open - the modal holds a different map',
	runJs(M123.open, withVars(mapPage({ modal: true, selected: 'm2' }), { __ddMapBefore: 'm1' })), false);
check('MUST FAIL: open - the Select shows no name (options arrived empty)',
	runJs(M123.open, withVars(mapPage({ modal: true, shown: '' }), { __ddMapBefore: 'm1' })), false);
check('MUST FAIL: open - no modal',
	runJs(M123.open, withVars(mapPage(), { __ddMapBefore: 'm1' })), false);
check('MUST FAIL: open - the capture never ran (window var missing)',
	runJs(M123.open, mapPage({ modal: true, selected: '' })), false);
check('options - 3 maps, the stored one checked and named in the input',
	runJs(M123.options, withVars(mapPage({ modal: true, dropdown: true }), { __ddMapBefore: 'm1' })), true);
check('MUST FAIL: options - one map only',
	runJs(M123.options, withVars(mapPage({ modal: true, dropdown: true, maps: [MAPS[0]] }), { __ddMapBefore: 'm1' })), false);
check('MUST FAIL: options - the checked option is not the stored map',
	runJs(M123.options, withVars(mapPage({ modal: true, dropdown: true, checked: 'm2' }), { __ddMapBefore: 'm1' })), false);
check('MUST FAIL: options - nothing checked',
	runJs(M123.options, withVars(mapPage({ modal: true, dropdown: true, checked: 'none' }), { __ddMapBefore: 'm1' })), false);
check('MUST FAIL: options - the input names a different map than the checked option',
	runJs(M123.options, withVars(mapPage({ modal: true, dropdown: true, shown: 'Map 2- Buildings' }), { __ddMapBefore: 'm1' })), false);
{
	const w = withVars(mapPage({ modal: true, dropdown: true }), { __ddMapBefore: 'm1' });
	check('close - the close button is found and clicked', runJs(M123.close, w), true);
	check('dismiss - modal gone, storage unchanged', runJs(M123.dismiss, w), true);
	check('MUST FAIL: close - no close button', runJs(M123.close, mapPage({ modal: true, closeBtn: false })), false);
}
check('MUST FAIL: dismiss - the modal is still open',
	runJs(M123.dismiss, withVars(mapPage({ modal: true }), { __ddMapBefore: 'm1' })), false);
check('MUST FAIL: dismiss - closing wrote a different map',
	runJs(M123.dismiss, withVars(mapPage({ stored: 'm2' }), { __ddMapBefore: 'm1' })), false);
{
	const w = withVars(mapPage({ modal: true, dropdown: true }), { __ddMapBefore: 'm1' });
	check('pick capture - the first unchecked map is captured', runJs(M123.pickCapture, w), true);
	check('pick capture - it is m2 (the one the xpath click will hit)', w.__ddMapPicked, 'm2');
	check('MUST FAIL: pick capture - every option is the current map',
		runJs(M123.pickCapture, withVars(mapPage({ dropdown: true, maps: [MAPS[0]] }), { __ddMapBefore: 'm1' })), false);
}
check('switched - storage holds the picked map, the picker closed',
	runJs(M123.switched, withVars(mapPage({ stored: 'm2' }), { __ddMapBefore: 'm1', __ddMapPicked: 'm2' })), true);
check('MUST FAIL: switched - storage still holds the original',
	runJs(M123.switched, withVars(mapPage({ stored: 'm1' }), { __ddMapBefore: 'm1', __ddMapPicked: 'm2' })), false);
check('MUST FAIL: switched - storage holds a THIRD map (not the one picked)',
	runJs(M123.switched, withVars(mapPage({ stored: 'm3' }), { __ddMapBefore: 'm1', __ddMapPicked: 'm2' })), false);
check('MUST FAIL: switched - stored, but the picker stayed open (no remount)',
	runJs(M123.switched, withVars(mapPage({ stored: 'm2', modal: true }), { __ddMapBefore: 'm1', __ddMapPicked: 'm2' })), false);
check('MUST FAIL: switched - the pick capture never ran',
	runJs(M123.switched, withVars(mapPage({ stored: 'm2' }), { __ddMapBefore: 'm1' })), false);
check('readback - reopened, the picker holds the new map',
	runJs(M123.readback, withVars(mapPage({ stored: 'm2', modal: true }), { __ddMapBefore: 'm1', __ddMapPicked: 'm2' })), true);
check('MUST FAIL: readback - the picker reopened on the ORIGINAL map (value not read back)',
	runJs(M123.readback, withVars(mapPage({ stored: 'm2', modal: true, selected: 'm1' }), { __ddMapBefore: 'm1', __ddMapPicked: 'm2' })), false);
{
	const w = withVars(mapPage({ stored: 'm2', modal: true, dropdown: true }), { __ddMapBefore: 'm1', __ddMapPicked: 'm2' });
	check('restore - the ORIGINAL option (by id) is clicked', runJs(M123.restore, w), true);
	check('restore - it was m1 that got the click', w.__clicked, 'm1');
	check('MUST FAIL: restore - the original map is not in the list',
		runJs(M123.restore, withVars(mapPage({ dropdown: true, maps: MAPS.slice(1) }), { __ddMapBefore: 'm1' })), false);
}
check('restored - no picker, storage is the original',
	runJs(M123.restored, withVars(mapPage({ stored: 'm1' }), { __ddMapBefore: 'm1' })), true);
check('MUST FAIL: restored - still on the picked map',
	runJs(M123.restored, withVars(mapPage({ stored: 'm2' }), { __ddMapBefore: 'm1' })), false);
check('MUST FAIL: restored - the capture never ran (undefined === undefined must not pass)',
	runJs(M123.restored, mapPage({ stored: null })), false);

/* ===========================================================================================
 * MOB.389 - the work-order asset lookups ignore case (bugs §1's regression guard). Structure
 * from ListFilter/index.tsx: TextInput#assetId inside a <span> that Combobox.Target clones with
 * aria-controls=<listbox id> while open (use-combobox-target-props.mjs:71); the listbox holds
 * [role=option] > .custom-option > .option-title, or Combobox.Empty "No results found".
 * ========================================================================================= */
const MOB389 = 'MOB.389_Work_Lookup_Case_Insensitive.json';
const M389 = {
	none: bodyOf(MOB389, 'CONDITION NO MATCH'),
	wrong: bodyOf(MOB389, 'CONDITION WRONG CASE'),
	noneF: bodyOf(MOB389, 'FAILURE NO MATCH'),
	wrongF: bodyOf(MOB389, 'FAILURE WRONG CASE'),
	type: bodyOf(MOB389, 'Type "ZZZZ-NO-SUCH-ASSET"'),
	close: bodyOf(MOB389, "Close the add form with the modal's close button"),
	closed: bodyOf(MOB389, 'CLOSED: the Condition form is unmounted'),
};
function lookupForm({ formId = 'work-condition-form', typed = '', titles = [], open = true,
	stale = [], linked = true, modal = true } = {}) {
	const dom = new JSDOM('<body></body>'); const w = dom.window; const doc = w.document;
	const content = doc.createElement('section');
	content.className = 'mantine-Modal-content mantine-Paper-root';
	const x = doc.createElement('button'); x.className = 'mantine-CloseButton-root mantine-Modal-close';
	x.addEventListener('click', () => content.remove());
	if (modal) content.appendChild(x);
	const form = doc.createElement('form'); form.id = formId;
	const span = doc.createElement('span');
	if (open && linked) span.setAttribute('aria-controls', 'lb-live');
	const wrap = doc.createElement('div'); wrap.className = 'mantine-TextInput-wrapper';
	const inp = doc.createElement('input'); inp.id = 'assetId'; inp.type = 'search'; inp.value = typed;
	wrap.appendChild(inp); span.appendChild(wrap); form.appendChild(span); content.appendChild(form);
	doc.body.appendChild(content);
	const listbox = (id, ts) => {
		const lb = doc.createElement('div'); lb.id = id; lb.setAttribute('role', 'listbox');
		for (const t of ts) {
			const o = doc.createElement('div'); o.setAttribute('role', 'option');
			o.innerHTML = `<div class="custom-option"><div class="option-title">${t}</div><div class="option-description"></div></div>`;
			lb.appendChild(o);
		}
		if (!ts.length) { const e = doc.createElement('div'); e.className = 'error'; e.textContent = 'No results found'; lb.appendChild(e); }
		doc.body.appendChild(lb);
	};
	if (stale.length) listbox('lb-stale', stale);        // a leftover dropdown from another field
	if (open) listbox('lb-live', titles);
	return w;
}
console.log('\nMOB.389_Work_Lookup_Case_Insensitive - a matched pair in the field\'s own dropdown');
check('no match - empty list and "No results found"',
	runJs(M389.none, lookupForm({ typed: 'ZZZZ-NO-SUCH-ASSET' })), true);
check('MUST FAIL: no match - the filter ignored the input and listed the asset',
	runJs(M389.none, lookupForm({ typed: 'ZZZZ-NO-SUCH-ASSET', titles: ['Pump 0102'] })), false);
check('MUST FAIL: no match - the dropdown is not open (no aria-controls)',
	runJs(M389.none, lookupForm({ typed: 'ZZZZ-NO-SUCH-ASSET', open: false })), false);
check('no match - a STALE dropdown elsewhere listing the asset cannot answer',
	runJs(M389.none, lookupForm({ typed: 'ZZZZ-NO-SUCH-ASSET', stale: ['Pump 0102'] })), true);
check('wrong case - "pUMP 0102" lists exactly Pump 0102',
	runJs(M389.wrong, lookupForm({ typed: 'pUMP 0102', titles: ['Pump 0102'] })), true);
check('MUST FAIL: wrong case - the pre-fix behaviour ("No results found")',
	runJs(M389.wrong, lookupForm({ typed: 'pUMP 0102', titles: [] })), false);
check('MUST FAIL: wrong case - the pre-fix list, with a STALE dropdown holding the asset',
	runJs(M389.wrong, lookupForm({ typed: 'pUMP 0102', titles: [], stale: ['Pump 0102'] })), false);
check('MUST FAIL: wrong case - the input holds the EXACT case (the probe degraded)',
	runJs(M389.wrong, lookupForm({ typed: 'Pump 0102', titles: ['Pump 0102'] })), false);
check('MUST FAIL: wrong case - two options (the filter is not filtering)',
	runJs(M389.wrong, lookupForm({ typed: 'pUMP 0102', titles: ['Pump 0102', 'Pump 0103'] })), false);
check('failure form - same pair, same verdicts',
	runJs(M389.noneF, lookupForm({ formId: 'work-failure-form', typed: 'ZZZZ-NO-SUCH-ASSET' }))
	&& runJs(M389.wrongF, lookupForm({ formId: 'work-failure-form', typed: 'pUMP 0102', titles: ['Pump 0102'] })), true);
check('MUST FAIL: failure form - pre-fix',
	runJs(M389.wrongF, lookupForm({ formId: 'work-failure-form', typed: 'pUMP 0102' })), false);
{
	const w = lookupForm({ typed: '' });
	const inp = w.document.getElementById('assetId');
	let events = 0; inp.addEventListener('input', () => events++);
	check('type - returns true and the input holds the term', runJs(M389.type, w) && inp.value === 'ZZZZ-NO-SUCH-ASSET', true);
	check('type - an input event fired, so ListFilter.onChange runs', events, 1);
	check('MUST FAIL: type - no #assetId on the page', runJs(M389.type, new JSDOM('<body></body>').window), false);
}
{
	const w = lookupForm({});
	check('close - the modal close button is clicked', runJs(M389.close, w), true);
	check('closed - the form is gone', runJs(M389.closed, w), true);
	check('MUST FAIL: closed - the form is still mounted', runJs(M389.closed, lookupForm({})), false);
	check('MUST FAIL: close - no close button', runJs(M389.close, lookupForm({ modal: false })), false);
}

/* ===========================================================================================
 * MOB.750 - the Tag Lookup menu. Mantine Menu: [role=menu] > [role=menuitem]. `Alphanumeric`'s
 * browser branch is `useFileDialog.open()` (@mantine/hooks use-file-dialog.mjs): remove the old
 * input, createInput(options) (type=file, accept, multiple, capture, display:none), append to
 * body, `.click()` it. The model below does exactly that, so the recorder meets the real path.
 * ========================================================================================= */
const MOB750 = 'MOB.750_AssetLookup_Tag_Lookup_Menu.json';
const M750 = {
	stub: bodyOf(MOB750, 'STUB: record file-input clicks'),
	menu: bodyOf(MOB750, 'MENU: exactly `Scan Barcode` then `Alphanumeric`'),
	one: bodyOf(MOB750, 'ALPHANUMERIC (browser): exactly ONE file dialog'),
	rear: bodyOf(MOB750, 'asking for the REAR camera'),
	img: bodyOf(MOB750, 'for images only, one file'),
	open: bodyOf(MOB750, 'and the menu STAYED OPEN'),
	sentinel: bodyOf(MOB750, 'SENTINEL (bugs §37)'),
	restore: bodyOf(MOB750, 'RESTORE: put `HTMLInputElement.prototype.click` back'),
	restored: bodyOf(MOB750, 'RESTORED: inputs click with the ORIGINAL'),
};
function tagMenuPage({ items = ['Scan Barcode', 'Alphanumeric'], menu = true, path = '/apm-mobile/asset-lookup' } = {}) {
	const dom = new JSDOM('<body></body>', { url: 'https://dev.example' + path });
	const w = dom.window; const doc = w.document;
	if (menu) {
		const m = doc.createElement('div'); m.setAttribute('role', 'menu');
		for (const t of items) {
			const b = doc.createElement('button'); b.setAttribute('role', 'menuitem');
			b.innerHTML = `<div>${t}</div><div></div>`; m.appendChild(b);
		}
		doc.body.appendChild(m);
	}
	w.__openDialog = (opts) => {           // useFileDialog.open()
		const i = doc.createElement('input'); i.type = 'file';
		if (opts.accept) i.accept = opts.accept;
		if (opts.multiple) i.multiple = true;
		// createInput sets `input.capture = ...` - a PROPERTY. Model a browser that does NOT
		// reflect it to an attribute (the first live run's lesson), unless asked to.
		if (opts.capture && opts.asAttr) i.setAttribute('capture', opts.capture);
		else if (opts.capture) Object.defineProperty(i, 'capture', { value: opts.capture });
		i.style.display = 'none'; doc.body.appendChild(i); i.click();
	};
	return w;
}
const ALPHA = { capture: 'environment', accept: 'image/*', multiple: false };
console.log('\nMOB.750_AssetLookup_Tag_Lookup_Menu - the Alphanumeric browser branch, via a click recorder');
{
	const w = tagMenuPage();
	const nativeClick = w.HTMLElement.prototype.click;
	check('stub - installs, empty record', runJs(M750.stub, w), true);
	check('stub - it SHADOWS the inherited click', Object.prototype.hasOwnProperty.call(w.HTMLInputElement.prototype, 'click'), true);
	check('stub - idempotent (a second run does not re-wrap or reset)', (w.__ddFileClicks.push('x'), runJs(M750.stub, w)), false);
	w.__ddFileClicks.length = 0;
	check('menu - exactly the two items in order', runJs(M750.menu, w), true);
	w.__openDialog(ALPHA);
	check('alphanumeric - one dialog', runJs(M750.one, w), true);
	check('alphanumeric - rear camera, read from the PROPERTY (not reflected to an attribute)', runJs(M750.rear, w), true);
	check('alphanumeric - images only, one file', runJs(M750.img, w), true);
	check('alphanumeric - the menu stayed open', runJs(M750.open, w), true);
	check('the recorded capture has NO attribute behind it (the case that failed live)',
		w.document.querySelector('input[type=file]').getAttribute('capture'), null);
	const btn = w.document.createElement('input'); btn.type = 'checkbox'; w.document.body.appendChild(btn);
	btn.click();
	check('stub - a NON-file input still really clicks', btn.checked, true);
	check('restore - returns true', runJs(M750.restore, w), true);
	check('restore - the shadowing property is DELETED, not reassigned', Object.prototype.hasOwnProperty.call(w.HTMLInputElement.prototype, 'click'), false);
	check('restored - original click is back', runJs(M750.restored, w), true);
	check('restored - inherited from HTMLElement again', w.HTMLInputElement.prototype.click === nativeClick, true);
	check('restored - the window vars are cleaned up', w.__ddFileClicks === undefined && w.__ddOrigClick === undefined, true);
}
{
	const w = tagMenuPage(); runJs(M750.stub, w);
	check('MUST FAIL: restored - the recorder is still installed', runJs(M750.restored, w), false);
}
const alphaAfter = (opts, menuOpen = true, times = 1) => {
	const w = tagMenuPage({ menu: menuOpen }); runJs(M750.stub, w);
	for (let k = 0; k < times; k++) w.__openDialog(opts);
	return runJs(M750.one, w) && runJs(M750.rear, w) && runJs(M750.img, w) && runJs(M750.open, w);
};
check('alphanumeric - a browser that DOES reflect capture to an attribute also passes',
	alphaAfter({ ...ALPHA, asAttr: true }), true);
check('MUST FAIL: alphanumeric - no dialog requested (the native branch, or a dead item)', alphaAfter(ALPHA, true, 0), false);
check('MUST FAIL: alphanumeric - two dialogs requested', alphaAfter(ALPHA, true, 2), false);
check('MUST FAIL: alphanumeric - the FRONT camera', alphaAfter({ ...ALPHA, capture: 'user' }), false);
check('MUST FAIL: alphanumeric - no capture (gallery picker, not the camera)', alphaAfter({ accept: 'image/*' }), false);
check('MUST FAIL: alphanumeric - any file type', alphaAfter({ ...ALPHA, accept: '*' }), false);
check('MUST FAIL: alphanumeric - multiple files', alphaAfter({ ...ALPHA, multiple: true }), false);
check('MUST FAIL: alphanumeric - the menu closed on click', alphaAfter(ALPHA, false), false);
check('MUST FAIL: menu - order swapped', runJs(M750.menu, tagMenuPage({ items: ['Alphanumeric', 'Scan Barcode'] })), false);
check('MUST FAIL: menu - a third item', runJs(M750.menu, tagMenuPage({ items: ['Scan Barcode', 'Alphanumeric', 'NFC'] })), false);
check('MUST FAIL: menu - not open', runJs(M750.menu, tagMenuPage({ menu: false })), false);
{
	const w = tagMenuPage({ menu: false }); w.__ddFileClicks = [{}];
	check('sentinel - menu closed, nothing shown, still on lookup', runJs(M750.sentinel, w), true);
	const t = w.document.createElement('div'); t.className = 'Toastify__toast'; w.document.body.appendChild(t);
	check('MUST FAIL: sentinel - a toast appeared (the fix)', runJs(M750.sentinel, w), false);
	const w2 = tagMenuPage({ menu: false, path: '/apm-mobile/scanner' }); w2.__ddFileClicks = [{}];
	check('MUST FAIL: sentinel - it navigated somewhere', runJs(M750.sentinel, w2), false);
}

/* ===========================================================================================
 * MOB.625 - the collector sort. Row structure from AssetCollector/index.tsx:171-205 and
 * AccordionControl.mjs:82: Accordion-item > Accordion-control > span.Accordion-label >
 * [Group(avatar, Stack(Group(TruncateText > Highlight(name))), desc)], [searchMatch Text],
 * Text("creator, date"). The label's LAST child is the creator line.
 * ========================================================================================= */
const MOB625 = 'MOB.625_Collector_List_Sort.json';
const M625 = {
	rendered: bodyOf(MOB625, 'The collected list rendered rows'),
	stash: bodyOf(MOB625, 'STASH: remember'),
	premise: bodyOf(MOB625, 'PREMISE (data)'),
	narrowed: bodyOf(MOB625, 'NARROWED: 2 to 15 rows'),
	caAsc: bodyOf(MOB625, 'CREATED AT ▲'),
	caDesc: bodyOf(MOB625, 'CREATED AT ▼'),
	nAsc: bodyOf(MOB625, 'NAME ▲'),
	nDesc: bodyOf(MOB625, 'NAME ▼'),
	mine: bodyOf(MOB625, 'COLLECTED BY ME: every rendered row has ONE creator'),
	removed: bodyOf(MOB625, 'and it REMOVED rows'),
	leakKey: bodyOf(MOB625, "the collector's pick was written to"),
	leakAv: bodyOf(MOB625, 'the JOB LIST now sorts by a Name'),
	restore: bodyOf(MOB625, 'RESTORE: put `mobile-MobileJob-sort` back'),
	restored: bodyOf(MOB625, 'RESTORED: `mobile-MobileJob-sort` holds'),
};
function collectorList(rows, { searchMatch = false, noCreator = false } = {}) {
	const dom = new JSDOM('<body></body>', { url: 'https://dev.example/apm-mobile/asset-collector' });
	const w = dom.window; const doc = w.document;
	for (const [name, creator, date] of rows) {
		const it = doc.createElement('div'); it.className = 'mantine-Accordion-item';
		const c = doc.createElement('span'); c.className = 'mantine-Accordion-control';
		c.innerHTML = '<span class="mantine-Accordion-chevron"></span>'
			+ '<span class="mantine-Accordion-label">'
			+ '<div class="mantine-Group-root"><div class="avatar"><img></div><div class="mantine-Stack-root">'
			+ `<div class="mantine-Group-root"><p class="mantine-Text-root"><span class="mantine-Highlight-root">${name}</span></p></div>`
			+ '<p class="mantine-Text-root">A description, with commas, 12</p></div></div>'
			+ (searchMatch ? '<p class="mantine-Text-root"><span>Desc: </span><span class="mantine-Highlight-root">snip</span></p>' : '')
			+ (noCreator ? '' : `<p class="mantine-Text-root">${creator}, ${date}</p>`)
			+ '</span>';
		it.appendChild(c); doc.body.appendChild(it);
	}
	return w;
}
// server order: createdAt DESC
const DD = [['DD SYNTHETIC MOBILE 43398722', 'Dev Eloper', 'Aug 24, 2026 6:35 PM'],
	['DD SYNTHETIC MOBILE 13783628', 'Dev Eloper', 'Aug 21, 2026 8:08 PM'],
	['DD SYNTHETIC MOBILE 45891525', 'Dev Eloper', 'Aug 11, 2026 2:00 AM'],
	['DD SYNTHETIC MOBILE 51362663', 'Dev Eloper', 'Aug 11, 2026 12:54 AM']];
const WIDE = [['⚡ Valve Group', 'Bruce Lee', 'Sep 3, 2026'], ['Diaphragm Pump', 'Bruce Lee', 'Sep 3, 2026'], ...DD.slice(0, 2),
	['Pipe 0000', 'Jimmy Maño', 'Aug 18, 2026']];
const withDefault = (rows) => { const w = collectorList(rows); runJs(M625.narrowed, (() => { const d = collectorList(DD); d.__ddDefault = undefined; return d; })()); return w; };
console.log('\nMOB.625_Collector_List_Sort - created-at vs server order, names vs localeCompare, a filter that is not a sort');
check('rendered - rows with names and creator lines', runJs(M625.rendered, collectorList(WIDE)), true);
check('rendered - a search-match line does not displace the creator line', runJs(M625.rendered, collectorList(WIDE, { searchMatch: true })), true);
check('MUST FAIL: rendered - a row without its creator line', runJs(M625.rendered, collectorList(WIDE, { noCreator: true })), false);
check('premise - 3 creators in the window', runJs(M625.premise, collectorList(WIDE)), true);
check('MUST FAIL: premise - every row is mine', runJs(M625.premise, collectorList(DD)), false);
{
	const w = collectorList(DD);
	check('narrowed - 4 of ours, captured', runJs(M625.narrowed, w), true);
	check('narrowed - the default order was captured', (w.__ddDefault || []).length, 4);
	const asc = [...DD].reverse();
	const at = (rows) => Object.assign(collectorList(rows), { __ddDefault: w.__ddDefault });
	check('created ▲ - reverse of the server order', runJs(M625.caAsc, at(asc)), true);
	check('MUST FAIL: created ▲ - still the server order (sort ignored)', runJs(M625.caAsc, at(DD)), false);
	check('MUST FAIL: created ▲ - sorted by NAME instead', runJs(M625.caAsc, at([...DD].sort((a, b) => a[0].localeCompare(b[0])))), false);
	check('created ▲ - a row that paged in between renders is not evidence (trap 30)',
		runJs(M625.caAsc, at([...asc, ['DD SYNTHETIC MOBILE 99999999', 'Dev Eloper', 'Sep 10, 2026']])), true);
	check('created ▼ - the server order', runJs(M625.caDesc, at(DD)), true);
	check('MUST FAIL: created ▼ - reversed', runJs(M625.caDesc, at(asc)), false);
	check('MUST FAIL: created ▼ - nothing in common with the default (floor)', runJs(M625.caDesc, at(WIDE.slice(0, 2))), false);
}
check('MUST FAIL: narrowed - a row that is not ours', runJs(M625.narrowed, collectorList([...DD, ['Pump 1234', 'Bruce Lee', 'x']])), false);
check('MUST FAIL: narrowed - one row only', runJs(M625.narrowed, collectorList(DD.slice(0, 1))), false);
check('MUST FAIL: narrowed - 16 rows (the narrowing stopped biting)',
	runJs(M625.narrowed, collectorList(Array.from({ length: 16 }, (_, k) => [`DD SYNTHETIC MOBILE ${k}`, 'Dev Eloper', `d${k}`]))), false);
const byName = [...DD].sort((a, b) => a[0].localeCompare(b[0]));
check('name ▲ - localeCompare order', runJs(M625.nAsc, collectorList(byName)), true);
check('MUST FAIL: name ▲ - server order', runJs(M625.nAsc, collectorList(DD)), false);
check('name ▼ - reversed', runJs(M625.nDesc, collectorList([...byName].reverse())), true);
check('MUST FAIL: name ▼ - ascending', runJs(M625.nDesc, collectorList(byName)), false);
check('name ▲ - the ⚡ symbol collates the way localeCompare says, not "A first" (trap 29)',
	runJs(M625.nAsc, collectorList([['⚡ Tank 0000', 'x', 'd'], ['A/C Motor 0002', 'x', 'd']].sort((a, b) => a[0].localeCompare(b[0])))), true);
{
	const before = ['Bruce Lee', 'Dev Eloper', 'Jimmy Maño'];
	const mine = (rows) => Object.assign(collectorList(rows), { __ddCreators: before });
	check('mine - one creator, ours, among the before-set', runJs(M625.mine, mine(DD)), true);
	check('mine - and creators were removed', runJs(M625.removed, mine(DD)), true);
	check('MUST FAIL: mine - the filter did nothing (still 3 creators)', runJs(M625.mine, mine(WIDE)), false);
	check('MUST FAIL: removed - the filter did nothing', runJs(M625.removed, mine(WIDE)), false);
	check('MUST FAIL: mine - one creator, but it is SOMEONE ELSE (no row of ours)',
		runJs(M625.mine, mine([['Pipe 0000', 'Jimmy Maño', 'd'], ['Pump 1', 'Jimmy Maño', 'd']])), false);
	check('MUST FAIL: mine - a creator never seen before the filter',
		runJs(M625.mine, mine([['DD SYNTHETIC MOBILE 1', 'Somebody Else', 'd']])), false);
}
{
	const w = collectorList(DD);
	check('leak key - name_DESC in the job key', (w.sessionStorage.setItem('mobile-MobileJob-sort', JSON.stringify({ id: 'name_DESC' })), runJs(M625.leakKey, w)), true);
	const w2 = collectorList(DD);
	check('MUST FAIL: leak key - the collector wrote its own key (the fix)', runJs(M625.leakKey, w2), false);
}
const avModal = (value) => {
	const dom = new JSDOM('<body></body>'); const doc = dom.window.document;
	const m = doc.createElement('section'); m.className = 'mantine-Modal-content';
	m.innerHTML = '<label>Sort Criteria</label><input class="mantine-Input-input mantine-Select-input input">';
	m.querySelector('input').value = value; doc.body.appendChild(m); return dom.window;
};
check('leak AV - the job list shows Mobile Job Name ▼', runJs(M625.leakAv, avModal('Mobile Job Name ▼')), true);
check('MUST FAIL: leak AV - its own default (Created At ▼)', runJs(M625.leakAv, avModal('Created At ▼')), false);
check('MUST FAIL: leak AV - ascending', runJs(M625.leakAv, avModal('Mobile Job Name ▲')), false);
{
	for (const prev of [null, JSON.stringify({ id: 'status_ASC' })]) {
		const w = collectorList(DD);
		if (prev !== null) w.sessionStorage.setItem('mobile-MobileJob-sort', prev);
		runJs(M625.stash, w);
		w.sessionStorage.setItem('mobile-MobileJob-sort', JSON.stringify({ id: 'name_DESC' }));   // the leak
		check(`restore (prior ${prev === null ? 'absent' : 'present'}) - returns true`, runJs(M625.restore, w), true);
		check(`restore (prior ${prev === null ? 'absent' : 'present'}) - key back as it was`, w.sessionStorage.getItem('mobile-MobileJob-sort'), prev);
		check(`restored (prior ${prev === null ? 'absent' : 'present'})`, runJs(M625.restored, w), true);
	}
	const w = collectorList(DD);
	runJs(M625.stash, w); w.sessionStorage.setItem('mobile-MobileJob-sort', 'x');
	check('stash - a second STASH does not overwrite the first', (runJs(M625.stash, w), JSON.parse(w.sessionStorage.getItem('__dd625_prevJobSort')).v), null);
	check('MUST FAIL: restored - the leaked value is still there', (w.__ddRestoredJobSort = null, runJs(M625.restored, w)), false);
	check('MUST FAIL: restore - no stash (the STASH step never ran)', runJs(M625.restore, collectorList(DD)), false);
}

/* ===========================================================================================
 * MOB.388 - the WO Attributes tab edit. DetailPage/Attributes renders each attribute as
 * div.form-group > label + input (inputs keyed by uuid, hence the LABEL match). The read must
 * find the group whose label STARTS with the name, so a longer label ("Heater Hz Max") elsewhere
 * cannot answer for it.
 * ========================================================================================= */
const MOB388 = 'MOB.388_Work_Attribute_Edit.json';
const M388 = {
	proof: bodyOf(MOB388, 'PROOF: after a reload "Heater Hz" is no longer the baseline'),
	restored: bodyOf(MOB388, 'RESTORED: "Heater Hz" is exactly "7" again'),
};
function attribForm(groups) {
	const dom = new JSDOM('<body><form id="mobile-attrib"></form></body>'); const doc = dom.window.document;
	for (const [label, value] of groups) {
		const g = doc.createElement('div'); g.className = 'form-group';
		g.innerHTML = `<label>${label}</label><div><input id="u-${Math.random()}"></div>`;
		g.querySelector('input').value = value; doc.querySelector('form').appendChild(g);
	}
	return dom.window;
}
console.log('\nMOB.388_Work_Attribute_Edit - a label-matched read of the attribute input');
check('proof - the marker is there', runJs(M388.proof, attribForm([['Heater Hz', 'DD SYNTHETIC EDIT 48120735']])), true);
check('MUST FAIL: proof - still the baseline (the write did nothing)', runJs(M388.proof, attribForm([['Heater Hz', '7']])), false);
check('MUST FAIL: proof - no Heater Hz field at all', runJs(M388.proof, attribForm([['Other', 'x']])), false);
check('restored - exactly 7', runJs(M388.restored, attribForm([['Heater Hz', '7']])), true);
check('restored - surrounding whitespace is not a difference', runJs(M388.restored, attribForm([['Heater Hz', ' 7 ']])), true);
check('MUST FAIL: restored - the marker is still there', runJs(M388.restored, attribForm([['Heater Hz', 'DD SYNTHETIC EDIT 1']])), false);
check('MUST FAIL: restored - typeText APPENDED (trap 17)', runJs(M388.restored, attribForm([['Heater Hz', 'DD SYNTHETIC EDIT 17']])), false);
check('restored - a LONGER label elsewhere does not answer for it',
	runJs(M388.restored, attribForm([['Max Heater', '99'], ['Heater Hz', '7']])), true);
check('MUST FAIL: restored - only a label that CONTAINS the name mid-string',
	runJs(M388.restored, attribForm([['Max Heater Hz', '7']])), false);

/* ===========================================================================================
 * MOB.301 - a photo in the new-work-order form. PhotoCarousel (ui/PhotoCarousel/index.tsx):
 * nothing at zero photos; otherwise Carousel-root > Carousel-slide > (Mantine Image = <img src>)
 * with src = reportLinkPreview = URL.createObjectURL(file) for a browser file. The button is
 * rendered only when canAddPhotos.
 * ========================================================================================= */
const MOB301 = 'MOB.301_Work_Create_Photo.json';
const M301 = {
	base: bodyOf(MOB301, 'BASELINE: no carousel yet'),
	one: bodyOf(MOB301, 'ONE photo in the form'),
	blob: bodyOf(MOB301, 'held LOCALLY'),
	label: bodyOf(MOB301, 'the button still reads `Add Work Order Photo`'),
	closed: bodyOf(MOB301, 'RESTORED: the form is unmounted'),
};
function woForm({ form = true, srcs = [], button = 'Add Work Order Photo' } = {}) {
	const dom = new JSDOM('<body></body>'); const doc = dom.window.document;
	if (form) {
		const f = doc.createElement('form'); f.id = 'workorder-insert-form';
		if (srcs.length) {
			const root = doc.createElement('div'); root.className = 'mantine-Carousel-root';
			for (const src of srcs) {
				const sl = doc.createElement('div'); sl.className = 'mantine-Carousel-slide';
				sl.innerHTML = `<div><img class="mantine-Image-root" src="${src}" alt="x.png"></div>`;
				root.appendChild(sl);
			}
			f.appendChild(root);
		}
		if (button) { const b = doc.createElement('button'); b.textContent = button; f.appendChild(b); }
		doc.body.appendChild(f);
	}
	return dom.window;
}
const BLOB = 'blob:https://dev.mentorapm.com/7f1c-uuid';
console.log('\nMOB.301_Work_Create_Photo - one local photo in the create form, never submitted');
check('baseline - no carousel, button offered', runJs(M301.base, woForm()), true);
check('MUST FAIL: baseline - no button (role lacks work.update)', runJs(M301.base, woForm({ button: null })), false);
check('MUST FAIL: baseline - a carousel already there', runJs(M301.base, woForm({ srcs: [BLOB] })), false);
check('one - exactly one slide', runJs(M301.one, woForm({ srcs: [BLOB] })), true);
check('MUST FAIL: one - nothing arrived', runJs(M301.one, woForm()), false);
check('MUST FAIL: one - two slides (the upload ran twice)', runJs(M301.one, woForm({ srcs: [BLOB, BLOB] })), false);
check('blob - a local object URL', runJs(M301.blob, woForm({ srcs: [BLOB] })), true);
check('MUST FAIL: blob - a SERVER link (uploaded before submit)', runJs(M301.blob, woForm({ srcs: ['/api/attachment/abc'] })), false);
check('MUST FAIL: blob - no image in the slide', runJs(M301.blob, woForm()), false);
check('label - unchanged', runJs(M301.label, woForm({ srcs: [BLOB] })), true);
check('MUST FAIL: label - flipped like the collector', runJs(M301.label, woForm({ srcs: [BLOB], button: 'Add More Photos' })), false);
check('closed - form gone', runJs(M301.closed, woForm({ form: false })), true);
check('MUST FAIL: closed - form still mounted', runJs(M301.closed, woForm()), false);

/* ===========================================================================================
 * MOB.807 - MultiValueSelector's enum + record branches. Mantine MultiSelect: the input
 * (Combobox.EventsTarget) carries aria-controls=<listbox id> while open; options are
 * [role=option] in that listbox. ActiveFilter = Pill-root > [label span][operator span][value span?].
 * ========================================================================================= */
const MOB807 = 'MOB.807_Search_MultiValue_Enum_Record.json';
const M807 = {
	capture: bodyOf(MOB807, 'CAPTURE: the unfiltered list'),
	enumBranch: bodyOf(MOB807, 'FAILURE CURVE: a MultiSelect rendered'),
	preloaded: bodyOf(MOB807, 'ENUM: the options are PRE-LOADED'),
	pickEnum: bodyOf(MOB807, 'Pick "flat" from the MultiSelect'),
	valid: bodyOf(MOB807, 'VALID: with one value chosen'),
	enumPill: bodyOf(MOB807, 'ENUM: the pill reads'),
	requeried: bodyOf(MOB807, 'ENUM: the list RE-QUERIED'),
	unfilteredAgain: bodyOf(MOB807, 'The list is unfiltered again'),
	recordOpts: bodyOf(MOB807, 'RECORD: the options arrived from the SERVER'),
	recPill: bodyOf(MOB807, 'SENTINEL (bugs §39): the pill reads'),
	recList: bodyOf(MOB807, 'and the list did NOT narrow'),
	restored: bodyOf(MOB807, 'RESTORED: no active filter pills remain'),
};
function lookupPage2({ rows = ['A', 'B', 'C', 'D'], multi = true, open = true, options = [], tags = false,
	value = false, pills = [], addType = 'button' } = {}) {
	const dom = new JSDOM('<body></body>'); const w = dom.window; const doc = w.document;
	for (const r of rows) {
		const it = doc.createElement('div'); it.className = 'mantine-Accordion-item';
		it.innerHTML = `<button class="mantine-Accordion-control">${r} description</button>`; doc.body.appendChild(it);
	}
	const drawer = doc.createElement('div'); drawer.className = 'mantine-Drawer-content';
	if (multi) {
		const i = doc.createElement('input'); i.setAttribute('placeholder', 'Choose values...');
		if (open) i.setAttribute('aria-controls', 'lb-ms'); drawer.appendChild(i);
	}
	if (tags) { const t = doc.createElement('input'); t.setAttribute('placeholder', 'Type and press Enter...'); drawer.appendChild(t); }
	if (value) { const v = doc.createElement('input'); v.id = 'value'; drawer.appendChild(v); }
	for (const [label, op, val] of pills) {
		const p = doc.createElement('div'); p.className = 'mantine-Pill-root';
		p.innerHTML = `<span class="mantine-Pill-label"><span>${label}</span> <span>${op}</span>${val ? ` <span>${val}</span>` : ''}</span><button class="mantine-Pill-remove"></button>`;
		drawer.appendChild(p);
	}
	const add = doc.createElement('button'); add.textContent = 'Add Filter'; add.type = addType; drawer.appendChild(add);
	doc.body.appendChild(drawer);
	// the stale listbox from the Field select (trap 3), and the MultiSelect's own
	const stale = doc.createElement('div'); stale.id = 'lb-field'; stale.setAttribute('role', 'listbox');
	stale.innerHTML = '<div role="option">Failure Curve</div><div role="option">flat</div>'; doc.body.appendChild(stale);
	const lb = doc.createElement('div'); lb.id = 'lb-ms'; lb.setAttribute('role', 'listbox');
	for (const o of options) { const d = doc.createElement('div'); d.setAttribute('role', 'option'); d.textContent = o; d.addEventListener('click', () => { w.__picked = o; }); lb.appendChild(d); }
	doc.body.appendChild(lb);
	return w;
}
const CURVES = ['flat', 'linear', 's-curve logistic model', 's-curve Weibull function'];
console.log('\nMOB.807_Search_MultiValue_Enum_Record - the two MultiSelect branches, and a record filter with no value');
{
	const w = lookupPage2();
	check('capture - 4 rows captured', runJs(M807.capture, w), true);
	check('MUST FAIL: capture - the list has not rendered', runJs(M807.capture, lookupPage2({ rows: ['A'] })), false);
	const same = Object.assign(lookupPage2(), { __ddUnfiltered: w.__ddUnfiltered });
	const diff = Object.assign(lookupPage2({ rows: ['C', 'X', 'Y'] }), { __ddUnfiltered: w.__ddUnfiltered });
	check('requeried - the window changed', runJs(M807.requeried, diff), true);
	check('MUST FAIL: requeried - the same window (filter did nothing)', runJs(M807.requeried, same), false);
	check('unfiltered again - same window', runJs(M807.unfilteredAgain, same), true);
	check('MUST FAIL: unfiltered again - still filtered', runJs(M807.unfilteredAgain, diff), false);
	check('record sentinel - list did NOT narrow', runJs(M807.recList, same), true);
	check('MUST FAIL: record sentinel - the list narrowed (the fix)', runJs(M807.recList, diff), false);
}
check('branch - a MultiSelect, no TagsInput, no #value', runJs(M807.enumBranch, lookupPage2()), true);
check('MUST FAIL: branch - the TagsInput (string branch)', runJs(M807.enumBranch, lookupPage2({ multi: false, tags: true })), false);
check('MUST FAIL: branch - both a MultiSelect and #value (an addition, not a swap)', runJs(M807.enumBranch, lookupPage2({ value: true })), false);
check('preloaded - several options incl. flat, in its OWN listbox', runJs(M807.preloaded, lookupPage2({ options: CURVES })), true);
check('MUST FAIL: preloaded - empty own listbox; "flat" only in a STALE one', runJs(M807.preloaded, lookupPage2({ options: [] })), false);
check('MUST FAIL: preloaded - dropdown not open (no aria-controls)', runJs(M807.preloaded, lookupPage2({ open: false, options: CURVES })), false);
{
	const w = lookupPage2({ options: CURVES });
	check('pick - flat clicked in its own listbox', runJs(M807.pickEnum, w) && w.__picked === 'flat', true);
}
check('valid - Add Filter is submit', runJs(M807.valid, lookupPage2({ addType: 'submit' })), true);
check('MUST FAIL: valid - still inert', runJs(M807.valid, lookupPage2()), false);
check('enum pill - "Failure Curve includes flat"', runJs(M807.enumPill, lookupPage2({ pills: [['Failure Curve', 'includes', 'flat']] })), true);
check('MUST FAIL: enum pill - no value', runJs(M807.enumPill, lookupPage2({ pills: [['Failure Curve', 'includes', '']] })), false);
check('MUST FAIL: enum pill - no pill', runJs(M807.enumPill, lookupPage2()), false);
{
	const w = lookupPage2({ options: ['Pump', 'Piping'] });
	check('record opts - captured the first server option', runJs(M807.recordOpts, w) && w.__ddRecordPick === 'Pump', true);
	check('MUST FAIL: record opts - nothing loaded', runJs(M807.recordOpts, lookupPage2({ options: [] })), false);
	const bug = Object.assign(lookupPage2({ pills: [['Asset Type', 'includes', '']] }), { __ddRecordPick: 'Pump' });
	check('record pill sentinel - "Asset Type includes" and nothing else', runJs(M807.recPill, bug), true);
	const fixed = Object.assign(lookupPage2({ pills: [['Asset Type', 'includes', 'Pump']] }), { __ddRecordPick: 'Pump' });
	check('MUST FAIL: record pill sentinel - the value shows (the fix)', runJs(M807.recPill, fixed), false);
}
check('restored - no pills', runJs(M807.restored, lookupPage2()), true);
check('MUST FAIL: restored - a pill left', runJs(M807.restored, lookupPage2({ pills: [['Failure Curve', 'includes', 'flat']] })), false);

/* ===========================================================================================
 * MOB.302 - Copy to asset, self-cleaning. `Copy to asset` LINKS the same attachment (server
 * `attachment/index.ts` copy = an association INSERT), so after it the asset lists the SOURCE's
 * id. Run 1 measured that; the old model here assumed a new id and was wrong. The delete GUARD
 * is the step that matters: it opens the gear only when the asset's one photo IS the source.
 * Carousel slide > Mantine Image <img src="…/api/attachment/<id>?org=…" alt="<fileName>">;
 * gear = [aria-label=Settings] inside the slide.
 * ========================================================================================= */
const MOB302 = 'MOB.302_Work_Photo_Copy_To_Asset.json';
const M302 = {
	premise: bodyOf(MOB302, 'PREMISE: Bypass Valve 0001 holds NO photos'),
	capture: bodyOf(MOB302, "CAPTURE: the work order's ONE photo"),
	form: bodyOf(MOB302, 'COPY FORM: names the source file'),
	closed: bodyOf(MOB302, 'THE COPY FORM CLOSED'),
	one: bodyOf(MOB302, 'now holds EXACTLY ONE photo'),
	guard: bodyOf(MOB302, 'GUARD + open the gear'),
	unlinked: bodyOf(MOB302, 'UNLINKED: Bypass Valve 0001 holds NO photos again'),
	source: bodyOf(MOB302, 'THE SOURCE IS UNTOUCHED'),
	file: bodyOf(MOB302, 'its FILE survived'),
};
const NAME = 'Screenshot 2024-12-11 at 3.23.50 PM.png';
const img = (id, name = NAME) => `<img class="mantine-Image-root" src="https://dev.mentorapm.com/api/attachment/${id}?org=SMCT2&imagePreview=true" alt="${name}">`;
function page302({ asset = true, photos = [], addPhoto = true, woPhotos = null, stash = {}, modal = null, loaded = true } = {}) {
	const dom = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/asset-lookup' });
	const w = dom.window; const doc = w.document;
	for (const [k, v] of Object.entries(stash)) w.sessionStorage.setItem(k, v);
	const slides = (list) => list.map(([id, name]) => `<div class="mantine-Carousel-slide"><div>${img(id, name)}<button aria-label="Settings" class="gear"></button></div></div>`).join('');
	if (asset) {
		const it = doc.createElement('div'); it.className = 'mantine-Accordion-item';
		it.innerHTML = '<span class="mantine-Accordion-control">⚡ Bypass Valve 0001</span>'
			+ '<div role="tablist"><button role="tab" aria-selected="true" aria-controls="ap">Photos</button></div>'
			+ `<div role="tabpanel" id="ap">${photos.length ? `<div class="mantine-Carousel-root">${slides(photos)}</div>` : ''}${addPhoto ? '<button>Add Photo</button>' : ''}</div>`;
		doc.body.appendChild(it);
	}
	if (woPhotos) {
		const d = doc.createElement('div');
		d.innerHTML = '<div role="tablist"><button role="tab" aria-selected="true" aria-controls="wp">Attachments</button></div>'
			+ `<div role="tabpanel" id="wp"><div class="mantine-Carousel-root">${slides(woPhotos)}</div></div>`;
		doc.body.appendChild(d);
	}
	if (modal) { const m = doc.createElement('section'); m.className = 'mantine-Modal-content'; m.innerHTML = modal; doc.body.appendChild(m); }
	// jsdom never decodes images: model load state as the browser reports it (a 404 = naturalWidth 0)
	doc.querySelectorAll('img').forEach(i => {
		Object.defineProperty(i, 'complete', { get: () => true });
		Object.defineProperty(i, 'naturalWidth', { get: () => (loaded ? 1200 : 0) });
	});
	w.__gearClicks = 0;
	doc.querySelectorAll('.gear').forEach(g => g.addEventListener('click', () => { w.__gearClicks++; }));
	return w;
}
const ST = { __dd302_srcId: 'SRC1', __dd302_srcName: NAME };
console.log('\nMOB.302_Work_Photo_Copy_To_Asset - 0 -> 1 (the SOURCE id, linked) -> 0, and a delete that only fires on that link');
check('premise - no photos, Add Photo shown', runJs(M302.premise, page302()), true);
check('MUST FAIL: premise - a leftover link', runJs(M302.premise, page302({ photos: [['SRC1', NAME]] })), false);
check('MUST FAIL: premise - the panel never rendered (no Add Photo)', runJs(M302.premise, page302({ addPhoto: false })), false);
{
	const w = page302({ asset: false, woPhotos: [['SRC1', NAME]] });
	check('capture - the WO photo id and name', runJs(M302.capture, w) && w.sessionStorage.getItem('__dd302_srcId') === 'SRC1' && w.sessionStorage.getItem('__dd302_srcName') === NAME, true);
	check('MUST FAIL: capture - two WO photos', runJs(M302.capture, page302({ asset: false, woPhotos: [['A', NAME], ['B', 'x']] })), false);
}
const FORM = (name, radios) => `<p>Copy attachment ${name}</p><div><label>Select an asset</label>${radios.map(([id, label, checked]) => `<input type="radio" id="${id}" ${checked ? 'checked' : ''}><label for="${id}">${label}</label>`).join('')}</div><button>Submit</button>`;
check('form - names the file, one radio, checked, Bypass Valve 0001', runJs(M302.form, page302({ stash: ST, modal: FORM(NAME, [['r1', 'Bypass Valve 0001', true]]) })), true);
check('MUST FAIL: form - a second asset offered', runJs(M302.form, page302({ stash: ST, modal: FORM(NAME, [['r1', 'Bypass Valve 0001', true], ['r2', 'Pump 0102', false]]) })), false);
check('MUST FAIL: form - a different file named', runJs(M302.form, page302({ stash: ST, modal: FORM('other.png', [['r1', 'Bypass Valve 0001', true]]) })), false);
check('closed - no copy form', runJs(M302.closed, page302()), true);
check('MUST FAIL: closed - the form is still open', runJs(M302.closed, page302({ modal: FORM(NAME, [['r1', 'Bypass Valve 0001', true]]) })), false);
check('one - exactly one, the SOURCE id and name (a link)', runJs(M302.one, page302({ photos: [['SRC1', NAME]], stash: ST })), true);
check('MUST FAIL: one - a different id (not the source)', runJs(M302.one, page302({ photos: [['OTHER', NAME]], stash: ST })), false);
check('MUST FAIL: one - two photos', runJs(M302.one, page302({ photos: [['SRC1', NAME], ['X', NAME]], stash: ST })), false);
check('MUST FAIL: one - a different file name', runJs(M302.one, page302({ photos: [['SRC1', 'real.jpg']], stash: ST })), false);
check('MUST FAIL: one - nothing linked', runJs(M302.one, page302({ stash: ST })), false);
check('MUST FAIL: one - no source captured', runJs(M302.one, page302({ photos: [['SRC1', NAME]] })), false);
{
	const w = page302({ photos: [['SRC1', NAME]], stash: ST });
	check('guard - the source link: gear clicked', runJs(M302.guard, w) && w.__gearClicks === 1, true);
}
for (const [label, opts] of [
	['a different id than the source', { photos: [['OTHER', NAME]], stash: ST }],
	['a real photo (different name)', { photos: [['SRC1', 'Pump (1).jpg']], stash: ST }],
	['two photos', { photos: [['SRC1', NAME], ['X', 'y.jpg']], stash: ST }],
	['no source captured', { photos: [['SRC1', NAME]], stash: {} }],
	['no source name captured', { photos: [['SRC1', NAME]], stash: { __dd302_srcId: 'SRC1' } }],
]) {
	const w = page302(opts);
	check(`MUST FAIL: guard - ${label}, and the gear is NOT clicked`, runJs(M302.guard, w) === false && w.__gearClicks === 0, true);
}
check('unlinked - 0 photos again', runJs(M302.unlinked, page302()), true);
check('MUST FAIL: unlinked - the link is still there', runJs(M302.unlinked, page302({ photos: [['SRC1', NAME]] })), false);
check('source - the WO still has SRC1', runJs(M302.source, page302({ asset: false, woPhotos: [['SRC1', NAME]], stash: ST })), true);
check('MUST FAIL: source - the WO photo is gone', runJs(M302.source, page302({ asset: false, woPhotos: [], stash: ST })), false);
check('MUST FAIL: source - a different photo', runJs(M302.source, page302({ asset: false, woPhotos: [['NEW', NAME]], stash: ST })), false);
check('file - the WO image loaded', runJs(M302.file, page302({ asset: false, woPhotos: [['SRC1', NAME]], stash: ST })), true);
check('MUST FAIL: file - the image 404s (naturalWidth 0)', runJs(M302.file, page302({ asset: false, woPhotos: [['SRC1', NAME]], stash: ST, loaded: false })), false);
check('MUST FAIL: file - a different photo loaded', runJs(M302.file, page302({ asset: false, woPhotos: [['NEW', NAME]], stash: ST })), false);

/* ===========================================================================================
 * MOB.980 - navigator.onLine override probe. The two outcome reads per route must be mutually
 * exclusive (ConnectionRequired vs the normal page), and neither may pass off the route.
 * ========================================================================================= */
const MOB980 = 'MOB.980_DIAG_OnLine_Override.json';
const M980 = {
	reachedA: bodyOf(MOB980, 'A ⭐ REACHED ConnectionRequired'),
	normalA: bodyOf(MOB980, 'A: the NORMAL Asset Lookup rendered'),
	restored: bodyOf(MOB980, 'RESTORED: navigator.onLine is true'),
};
function page980({ path = '/apm-mobile/asset-lookup', offline = false, online = true, tile = true } = {}) {
	const dom = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com' + path });
	const w = dom.window; const doc = w.document;
	doc.body.innerHTML = (offline ? '<div class="mantine-Paper-root"><p>This feature requires an internet connection.</p></div>'
		: '<form><input name="asset-search"></form>')
		+ (tile ? '<img alt="icon for Asset Lookup">' : '') + '<img alt="icon for Work Orders">';
	Object.defineProperty(w.navigator, 'onLine', { configurable: true, get: () => online });
	return w;
}
console.log('\nMOB.980_DIAG_OnLine_Override - outcome reads are exclusive; the restore gate can fail');
check('reached - ConnectionRequired on /asset-lookup', runJs(M980.reachedA, page980({ offline: true })), true);
check('MUST FAIL: reached - the normal page', runJs(M980.reachedA, page980()), false);
check('MUST FAIL: reached - the message, but not on /asset-lookup', runJs(M980.reachedA, page980({ offline: true, path: '/apm-mobile/' })), false);
check('normal - the search input on /asset-lookup', runJs(M980.normalA, page980()), true);
check('MUST FAIL: normal - ConnectionRequired', runJs(M980.normalA, page980({ offline: true })), false);
check('MUST FAIL: normal - off the route', runJs(M980.normalA, page980({ path: '/apm-mobile/' })), false);
check('restored - online and the tile is back', runJs(M980.restored, page980({ path: '/apm-mobile/' })), true);
check('MUST FAIL: restored - still reads offline', runJs(M980.restored, page980({ path: '/apm-mobile/', online: false })), false);
check('MUST FAIL: restored - the tile is missing', runJs(M980.restored, page980({ path: '/apm-mobile/', tile: false })), false);

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL PASS');
process.exit(failures ? 1 : 0);
