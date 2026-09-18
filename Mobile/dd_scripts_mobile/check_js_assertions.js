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

// jsdom, in order: this repo's own node_modules (`npm install` at the repo root — setup.sh does it), then a
// MentorTwo checkout's — $MENTORTWO_REPO, else the sibling layout this repo grew up in.
let JSDOM;
const JSDOM_FROM = [
	'jsdom',
	...(process.env.MENTORTWO_REPO ? [path.join(process.env.MENTORTWO_REPO, 'node_modules/jsdom')] : []),
	path.resolve(MOBILE, '../../MentorTwo/node_modules/jsdom'),
];
for (const where of JSDOM_FROM) {
	try { ({ JSDOM } = require(where)); break; } catch (e) { /* try the next */ }
}
if (!JSDOM) {
	// 🛑 Exits NON-ZERO on purpose. "Skipped" that reports success is how a check quietly
	// stops checking; the caller must be able to tell "passed" from "never ran".
	console.error('jsdom not found - VERIFIED NOTHING. Run `npm install` at the repo root (setup.sh does), '
		+ 'or set MENTORTWO_REPO to a MentorTwo checkout with node_modules.');
	process.exit(2);
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
// MutationObserver callbacks are microtasks, so the recorder cases (MOB.626/914) are async: each is
// pushed onto `pending`, awaits `flushObservers()` after a DOM change, and the tally waits for them all.
const pending = [];
const flushObservers = () => new Promise(r => setTimeout(r, 0));

const runJs = (code, win) => {
	let ss;
	try { ss = win.sessionStorage; } catch (e) { ss = undefined; }   // opaque-origin windows throw
	// `window` too: MOB.123 carries ids between steps on it (MOB.470's `__ddSW` proved that
	// survives from one Datadog step to the next while the page does not navigate).
	// `location` and `navigator` for MOB.912 (route, `navigator.onLine`); `getComputedStyle` for MOB.952;
	// `MutationObserver` for the MOB.626/914 flash recorders; `MouseEvent` for MOB.331, which dispatches a
	// click on an <svg> (it has no `.click()`).
	return new Function('document', 'sessionStorage', 'window', 'location', 'navigator', 'getComputedStyle', 'MutationObserver', 'MouseEvent',
		`return (function(){${code}})()`)(win.document, ss, win, win.location, win.navigator, win.getComputedStyle.bind(win), win.MutationObserver, win.MouseEvent);
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
	modalImg = false, roPhotos = null, roFiles = null, split = false, roButton = null } = {}) {
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
		if (split) { const h = doc.createElement('p'); h.textContent = 'Storeroom Item'; m.appendChild(h); }
		const btn = (label) => { const b = doc.createElement('button'); b.textContent = label; m.appendChild(b); };
		if (addPhoto) btn('Add Photo');
		if (addFile) btn('Add File');
		if (carousel) { const c = doc.createElement('div'); c.className = 'mantine-Carousel-root'; m.appendChild(c); }
		if (table) m.appendChild(doc.createElement('table'));
		if (modalImg) { const img = doc.createElement('img'); img.className = 'file-image'; m.appendChild(img); }
		// cd91ece65d: below the storeroom item's own panel, `ReadOnlyAttachments` shows the material
		// item's — a readOnly carousel (no add buttons) or `No photos`; a table or `No documents`
		const heading = (txt) => { const p = doc.createElement('p'); p.textContent = txt; m.appendChild(p); };
		if (roPhotos !== null || roFiles !== null) heading('Material Item (read only)');
		if (roPhotos === 'carousel') { const c = doc.createElement('div'); c.className = 'mantine-Carousel-root'; m.appendChild(c); }
		if (roPhotos === 'empty') heading('No photos');
		if (roFiles === 'table') m.appendChild(doc.createElement('table'));
		if (roFiles === 'empty') heading('No documents');
		if (roButton) { const b = doc.createElement('button'); b.textContent = roButton; m.appendChild(b); }
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
// the served build (cd91ece65d): storeroom panel + the material item's read-only section
check('photos (new DOM) - storeroom Add Photo + read-only material carousel', runJs(M865.photos, materialPage({ addPhoto: true, roPhotos: 'carousel' })), true);
check('photos (new DOM) - storeroom Add Photo + `No photos`', runJs(M865.photos, materialPage({ addPhoto: true, roPhotos: 'empty' })), true);
check('docs (new DOM) - storeroom Add File + read-only material table', runJs(M865.docs, materialPage({ addFile: true, roFiles: 'table' })), true);
check('docs (new DOM) - storeroom Add File + `No documents`', runJs(M865.docs, materialPage({ addFile: true, roFiles: 'empty' })), true);
// the SPLIT checks (checklist #39): Storeroom Item first, then a read-only tail with no add buttons
{
	const photosSplit = bodyOf(MOB865, 'PHOTOS SPLIT:'), docsSplit = bodyOf(MOB865, 'DOCS SPLIT:');
	check('split - photos: storeroom, then a read-only carousel', runJs(photosSplit, materialPage({ split: true, addPhoto: true, roPhotos: 'carousel' })), true);
	check('split - photos: storeroom, then `No photos`', runJs(photosSplit, materialPage({ split: true, addPhoto: true, roPhotos: 'empty' })), true);
	check('MUST FAIL: split - the read-only half offers Add Photo', runJs(photosSplit, materialPage({ split: true, addPhoto: true, roPhotos: 'carousel', roButton: 'Add Photo' })), false);
	check('MUST FAIL: split - the OLD single panel (no headings)', runJs(photosSplit, materialPage({ addPhoto: true, carousel: true })), false);
	check('MUST FAIL: split - read-only heading but neither a carousel nor `No photos`', runJs(photosSplit, materialPage({ split: true, addPhoto: true, roFiles: 'table' })), false);
	check('split - docs: storeroom, then a read-only table', runJs(docsSplit, materialPage({ split: true, addFile: true, roFiles: 'table' })), true);
	check('split - docs: storeroom, then `No documents`', runJs(docsSplit, materialPage({ split: true, addFile: true, roFiles: 'empty' })), true);
	check('MUST FAIL: split - the read-only half offers Add File', runJs(docsSplit, materialPage({ split: true, addFile: true, roFiles: 'table', roButton: 'Add File' })), false);
}
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

/**
 * The REAL WorkListItem shape (WorkListItem.tsx:41-107): a Paper whose FIRST child is the Group
 * holding `_workSequence`, whose SECOND is the name, and only THEN the display fields, the
 * "Description:" label and the description. MOB.345 keys a row on the first two, so a row's
 * identity does not move when a display field arrives or goes - `displayFields.filter(v =>
 * !!workStage[v.key])` (`:92`) renders NO LINE for a null field, so those lines come and go.
 *
 * A spec may be a bare sequence, or `{ seq, name, fields }` to vary the rest.
 */
function workRows(specs) {
	const dom = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/' });
	const doc = dom.window.document;
	const add = (parent, text) => {
		const d = doc.createElement('div'); d.textContent = text; parent.appendChild(d); return d;
	};
	for (const spec of specs) {
		const { seq, name = 'Inspection (No Permit)', fields = ['Assets: Valve Group'] } =
			typeof spec === 'string' ? { seq: spec } : spec;
		const p = doc.createElement('div'); p.className = 'mantine-Paper-root';
		add(p, seq);                                    // <Group> - _workSequence
		add(p, name);                                   // the name Highlight
		for (const f of fields) add(p, f);              // display fields - may be absent
		add(p, 'Description:');
		add(p, 'Inspection ...');
		doc.body.appendChild(p);
	}
	return dom.window;
}
const rowIdentity = (spec) => (typeof spec === 'string' ? spec : spec.seq) + ' | ' +
	(typeof spec === 'string' ? 'Inspection (No Permit)' : (spec.name || 'Inspection (No Permit)'));

console.log('\nMOB.345 - the narrowing guard (at least 2 rows, and tellable apart)');
{
	const narrowed = bodyOf('MOB.345_Work_Sort_Persist.json', 'NARROWED: at least 2 rows render');
	check('4 distinct rows', runJs(narrowed, workRows(['A-1', 'A-2', 'A-3', 'A-4'])), true);
	check('MUST FAIL: 1 row - an order over one row is vacuous (trap 5)', runJs(narrowed, workRows(['A-1'])), false);
	check('MUST FAIL: 0 rows - the term matched nothing', runJs(narrowed, workRows([])), false);
	// ⭐ 2026-09-15: the old guard capped this at 15 to keep the list inside one Virtuoso
	// window. It never could - the dev list has outgrown any search term - so `scroll_to_end`
	// carries the proof instead and a long list is no longer a failure.
	check('⭐ 16 rows PASS now - scroll_to_end handles a list longer than the window',
		runJs(narrowed, workRows(Array.from({ length: 16 }, (_, i) => `A-${i}`))), true);
	check('MUST FAIL: two rows share a sequence AND a name - they cannot be told apart',
		runJs(narrowed, workRows(['SAME', 'SAME', 'OTHER'])), false);
	check('MUST FAIL: identity ignores the display fields - same sequence, different Address, still a duplicate',
		runJs(narrowed, workRows([{ seq: 'A-1', fields: ['Address: one'] },
			{ seq: 'A-1', fields: ['Address: two'] }])), false);
	check('⭐ a row that GAINED an Address line keeps the identity of one that has none',
		runJs(narrowed, workRows([{ seq: 'A-1', fields: [] }, { seq: 'A-2', fields: ['Address: x'] }])), true);
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

console.log('\nMOB.345 - the reversal proof, and the overlap it needs');
{
	const proof = bodyOf('MOB.345_Work_Sort_Persist.json', 'every row rendered in BOTH orders');
	const overlap = bodyOf('MOB.345_Work_Sort_Persist.json', 'the two captures OVERLAP');
	const page = (specs, stash) => {
		const win = workRows(specs);
		try { win.sessionStorage.setItem('__dd345_asc', JSON.stringify(stash.map(rowIdentity))); }
		catch (e) { /* opaque origin */ }
		return win;
	};
	check('plain reversal', runJs(proof, page(['C', 'B', 'A'], ['A', 'B', 'C'])), true);
	// ⭐ THE CASE scroll_to_end EXISTS FOR. Ascending was captured at the TOP (A,B,C) and
	// descending at the END of a longer list, so the descending window is the ascending head
	// reversed with older rows below it. They overlap; the common rows reverse.
	check('⭐ descending captured at the END of a longer list - the head still reverses',
		runJs(proof, page(['C', 'B', 'A', 'z-1', 'z-2'], ['A', 'B', 'C'])), true);
	// the 2026-09-10 case: a row paged in between the two reads and another scrolled out
	check('a row ARRIVED and another LEFT - the common rows are still reversed',
		runJs(proof, page(['6', 'C', 'B'], ['A', 'B', 'C'])), true);
	check('MUST FAIL: the common rows are in the SAME order (no sort happened)',
		runJs(proof, page(['B', 'C', '6'], ['A', 'B', 'C'])), false);
	check('MUST FAIL: only one row in common - proves nothing',
		runJs(proof, page(['C', '7', '8'], ['A', 'B', 'C'])), false);
	// ⭐ 2026-09-15 MEASURED: ascending held 20260910-1/2/3-001 and descending held
	// 20260913-1-001, 20260911-1-001, 20260910-6-001 - two disjoint windows of one filtered
	// list. The proof correctly returns false; the OVERLAP diag is what names the reason.
	check('MUST FAIL: nothing in common at all (two disjoint Virtuoso windows)',
		runJs(proof, page(['X', 'Y', 'Z'], ['A', 'B', 'C'])), false);
	check('MUST FAIL: no captured order to compare against',
		runJs(proof, page(['C', 'B', 'A'], [])), false);

	check('overlap diag: 3 rows in common', runJs(overlap, page(['C', 'B', 'A'], ['A', 'B', 'C'])), true);
	check('overlap diag: 2 in common is enough', runJs(overlap, page(['C', 'B', '9'], ['A', 'B', 'C'])), true);
	check('MUST FAIL: overlap diag - only 1 row in common',
		runJs(overlap, page(['C', '7', '8'], ['A', 'B', 'C'])), false);
	check('⭐ MUST FAIL: overlap diag - the disjoint-window case it was written to name',
		runJs(overlap, page(['X', 'Y', 'Z'], ['A', 'B', 'C'])), false);
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
 * MOB.390 / MOB.391 - add (a key the fixture does not hold), prove after a reload, delete THAT
 * card. DOM modelled on ConditionDetails.tsx / FailureDetails.tsx + CollapsableSection.tsx: the
 * card is a Paper (toggle button + rightContent + Collapse); cards sit under an asset Paper whose
 * first Text is the asset name. Gear = ActionIcon aria-label="Menu" in the card.
 * ========================================================================================= */
const MOB390 = 'MOB.390_Work_Add_Condition.json';
const MOB391 = 'MOB.391_Work_Add_Failure.json';
const M390 = {
	premise: bodyOf(MOB390, 'PREMISE: no condition'),
	proof: bodyOf(MOB390, 'SERVER PROOF: exactly ONE condition'),
	guard: bodyOf(MOB390, 'GUARD + open its gear'),
	cleaned: bodyOf(MOB390, 'CLEANED: no condition'),
};
const M391 = {
	premise: bodyOf(MOB391, 'PREMISE: no failure'),
	proof: bodyOf(MOB391, 'SERVER PROOF: exactly ONE failure'),
	guard: bodyOf(MOB391, 'GUARD + open its gear'),
	cleaned: bodyOf(MOB391, 'CLEANED: no failure'),
};
const condCard = ([el, group, f, sc, st]) => `<div class="mantine-Paper-root"><div class="mantine-Group-root"><button><span><p class="mantine-Text-root">${el}</p></span></button>`
	+ `<div class="mantine-ButtonGroup-root"><div class="mantine-Pill-root"><span class="mantine-Pill-label">${group}</span></div><button aria-label="Menu" class="gear"></button></div></div>`
	+ `<div class="mantine-Collapse-root"><ul><li><p class="mantine-Text-root">Condition Found: <span class="mantine-Pill-root">${f}</span></p></li>`
	+ `<li><p class="mantine-Text-root">Condition Score: <span class="mantine-Pill-root">${sc}</span></p></li>`
	+ `<li><p class="mantine-Text-root">Stress Score: <span class="mantine-Pill-root">${st}</span></p></li>`
	+ `<li><p class="mantine-Text-root">Stress Decision Score: <span class="mantine-Pill-root"></span></p></li><li><div>Notes: <p class="mantine-Text-root"></p></div></li></ul></div></div>`;
const failCard = ([ft, rep, root]) => `<div class="mantine-Paper-root"><div class="mantine-Group-root"><button><span><p class="mantine-Text-root">  </p></span></button><button aria-label="Menu" class="gear"></button></div>`
	+ `<div class="mantine-Collapse-root"><table><tbody><tr><td>Failure Type</td><td> ${ft} </td></tr><tr><td>Root Cause</td><td> ${root} </td></tr>`
	+ `<tr><td>Repair Type</td><td> ${rep} </td></tr><tr><td>Discovery Code</td><td>  </td></tr></tbody></table></div></div>`;
function page39x({ groups = [], add = true, stash = {} } = {}, card) {
	const dom = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q' });
	const w = dom.window; const doc = w.document;
	for (const [k, v] of Object.entries(stash)) w.sessionStorage.setItem(k, v);
	doc.body.innerHTML = (add ? '<button>Add</button>' : '') + groups.map(([asset, cards]) =>
		`<div class="mantine-Paper-root"><p class="mantine-Text-root">${asset}</p><div class="mantine-Box-root">${cards.map(card).join('')}</div></div>`).join('');
	w.__gearClicks = 0;
	doc.querySelectorAll('.gear').forEach(g => g.addEventListener('click', () => { w.__gearClicks++; }));
	return w;
}
const c39 = (o) => page39x(o, condCard);
const f39 = (o) => page39x(o, failCard);
const ORIG_C = ['Mounting/Support', 'Structural', 1, 2, 3];
const MINE_C = ['Pump Body', 'Structural', 1, 2, 3];
const ORIG_F = ['BELT (R-L1)', 'MISSED', 'TIME'];
const MINE_F = ['BELT (R-L1)', 'ADJUST', 'TIME'];
const K = '__dd39x_origCount';
{
	// The exact score pick: ListFilter options (option-title + option-description), Mantine keeps
	// closed dropdowns mounted and hidden. jsdom has no layout, so visibility is modelled on
	// offsetParent - the property the step reads.
	const pick1 = bodyOf(MOB390, 'Pick 1 — the one VISIBLE option');
	const opt = (v, hid) => `<div role="option" data-v="${v}" data-hid="${hid ? 1 : 0}"><div class="custom-option"><div class="option-title">${v}</div><div class="option-description">d</div></div></div>`;
	const page = (list) => {
		const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/work/x' }).window;
		w.document.body.innerHTML = list.map(([v, hid]) => opt(v, hid)).join('');
		w.__picked = [];
		w.document.querySelectorAll('[role="option"]').forEach(o => {
			Object.defineProperty(o, 'offsetParent', { get: () => (o.dataset.hid === '1' ? null : w.document.body) });
			o.addEventListener('click', () => w.__picked.push(o.dataset.v + (o.dataset.hid === '1' ? ':hidden' : ':visible')));
		});
		return w;
	};
	console.log('\nMOB.390 exact score pick - the one VISIBLE option, never a hidden twin');
	{
		const w = page([['1', true], ['2', true], ['1', false], ['2', false], ['10', false]]);
		check('pick - clicks the visible "1", not the hidden twin nor "10"', runJs(pick1, w) && w.__picked.join() === '1:visible', true);
	}
	{
		const w = page([['1', true], ['2', true]]);
		check('MUST FAIL: pick - no visible "1" (dropdown closed), nothing clicked', runJs(pick1, w) === false && w.__picked.length === 0, true);
	}
	{
		const w = page([['1', false], ['1', false]]);
		check('MUST FAIL: pick - two visible "1"s, nothing clicked', runJs(pick1, w) === false && w.__picked.length === 0, true);
	}
	{
		const w = page([['10', false], ['11', false]]);
		check('MUST FAIL: pick - only "10"/"11" visible, nothing clicked', runJs(pick1, w) === false && w.__picked.length === 0, true);
	}
}
console.log('\nMOB.390_Work_Add_Condition - a new key, proved after reload, then only THAT card deleted');
{
	const w = c39({ groups: [['Pump 0102', [ORIG_C]]] });
	check('premise - no Pump Body card, original counted', runJs(M390.premise, w) && w.sessionStorage.getItem(K) === '1', true);
}
check('MUST FAIL: premise - a leftover Pump Body card', runJs(M390.premise, c39({ groups: [['Pump 0102', [ORIG_C, MINE_C]]] })), false);
check('MUST FAIL: premise - the tab never rendered (no Add button)', runJs(M390.premise, c39({ add: false, groups: [['Pump 0102', [ORIG_C]]] })), false);
check('proof - exactly one Pump Body card with 1/2/3', runJs(M390.proof, c39({ groups: [['Pump 0102', [ORIG_C, MINE_C]]] })), true);
check('MUST FAIL: proof - the add was refused (no card)', runJs(M390.proof, c39({ groups: [['Pump 0102', [ORIG_C]]] })), false);
check('MUST FAIL: proof - wrong scores', runJs(M390.proof, c39({ groups: [['Pump 0102', [ORIG_C, ['Pump Body', 'Structural', 1, 2, 4]]]] })), false);
check('MUST FAIL: proof - Pump Body under ANOTHER asset', runJs(M390.proof, c39({ groups: [['Pump 0102', [ORIG_C]], ['Tank 0000', [MINE_C]]] })), false);
check('MUST FAIL: proof - two Pump Body cards', runJs(M390.proof, c39({ groups: [['Pump 0102', [ORIG_C, MINE_C, MINE_C]]] })), false);
{
	const w = c39({ groups: [['Pump 0102', [ORIG_C, MINE_C]]] });
	check('guard - one Pump Body card: exactly one gear clicked', runJs(M390.guard, w) && w.__gearClicks === 1, true);
}
for (const [label, groups] of [
	['no Pump Body card (the add failed)', [['Pump 0102', [ORIG_C]]]],
	['two Pump Body cards', [['Pump 0102', [ORIG_C, MINE_C, MINE_C]]]],
	['a Pump Body card under a DIFFERENT asset', [['Tank 0000', [MINE_C]]]],
]) {
	const w = c39({ groups });
	check(`MUST FAIL: guard - ${label}, and NO gear is clicked`, runJs(M390.guard, w) === false && w.__gearClicks === 0, true);
}
{
	// the guard must click the Pump Body card's gear, never the original's
	const w = c39({ groups: [['Pump 0102', [ORIG_C, MINE_C]]] });
	const gears = [...w.document.querySelectorAll('.gear')]; let hit = -1;
	gears.forEach((g, i) => g.addEventListener('click', () => { hit = i; }));
	runJs(M390.guard, w);
	check('guard - the clicked gear belongs to the Pump Body card', hit === 1, true);
}
check('cleaned - Pump Body gone, original count unchanged', runJs(M390.cleaned, c39({ groups: [['Pump 0102', [ORIG_C]]], stash: { [K]: '1' } })), true);
check('MUST FAIL: cleaned - Pump Body still there', runJs(M390.cleaned, c39({ groups: [['Pump 0102', [ORIG_C, MINE_C]]], stash: { [K]: '1' } })), false);
check('MUST FAIL: cleaned - the ORIGINAL was deleted', runJs(M390.cleaned, c39({ groups: [], stash: { [K]: '1' } })), false);
check('MUST FAIL: cleaned - no baseline captured', runJs(M390.cleaned, c39({ groups: [['Pump 0102', [ORIG_C]]] })), false);

console.log('\nMOB.391_Work_Add_Failure - a new key, proved after reload, then only THAT card deleted');
{
	const w = f39({ groups: [['Pump 0102', [ORIG_F]]] });
	check('premise - no ADJUST card, original counted', runJs(M391.premise, w) && w.sessionStorage.getItem(K) === '1', true);
}
check('MUST FAIL: premise - a leftover ADJUST card', runJs(M391.premise, f39({ groups: [['Pump 0102', [ORIG_F, MINE_F]]] })), false);
check('proof - exactly one BELT/ADJUST/TIME card', runJs(M391.proof, f39({ groups: [['Pump 0102', [ORIG_F, MINE_F]]] })), true);
check('MUST FAIL: proof - the add was refused', runJs(M391.proof, f39({ groups: [['Pump 0102', [ORIG_F]]] })), false);
check('MUST FAIL: proof - a different root cause', runJs(M391.proof, f39({ groups: [['Pump 0102', [ORIG_F, ['BELT (R-L1)', 'ADJUST', 'DAMAGE']]]] })), false);
{
	const w = f39({ groups: [['Pump 0102', [ORIG_F, MINE_F]]] });
	const gears = [...w.document.querySelectorAll('.gear')]; let hit = -1;
	gears.forEach((g, i) => g.addEventListener('click', () => { hit = i; }));
	check('guard - the ADJUST card\'s gear clicked, not the original\'s', runJs(M391.guard, w) && hit === 1, true);
}
for (const [label, groups] of [
	['no ADJUST card', [['Pump 0102', [ORIG_F]]]],
	['two ADJUST cards', [['Pump 0102', [ORIG_F, MINE_F, MINE_F]]]],
]) {
	const w = f39({ groups });
	check(`MUST FAIL: guard - ${label}, and NO gear is clicked`, runJs(M391.guard, w) === false && w.__gearClicks === 0, true);
}
check('cleaned - ADJUST gone, original unchanged', runJs(M391.cleaned, f39({ groups: [['Pump 0102', [ORIG_F]]], stash: { [K]: '1' } })), true);
check('MUST FAIL: cleaned - the ORIGINAL was deleted', runJs(M391.cleaned, f39({ groups: [['Pump 0102', [MINE_F]]], stash: { [K]: '1' } })), false);

/* ===========================================================================================
 * MOB.912 - screens that read navigator.onLine itself. Each leg pairs the online screen with the
 * offline one; the halves must be mutually exclusive, and neither may pass off its route/panel.
 * Material panel: MaterialCharges.tsx - online = SegmentedControl (labels CHARGES/ESTIMATES) +
 * Add; offline = <Box>Internet Connection is required to make a material charge</Box>.
 * ========================================================================================= */
const MOB912 = 'MOB.912_Offline_Connection_Screens.json';
const M912 = {
	lookupOn: bodyOf(MOB912, 'ONLINE HALF: Asset Lookup renders its search'),
	homeAgain: bodyOf(MOB912, 'Home again, still the same page session'),
	lookupOff: bodyOf(MOB912, 'OFFLINE HALF: ConnectionRequired'),
	matOn: bodyOf(MOB912, 'ONLINE HALF: the Material panel'),
	matOff: bodyOf(MOB912, 'OFFLINE HALF: the panel reads'),
};
const MAT_ONLINE = '<div class="mantine-SegmentedControl-root"><label>CHARGES</label><label>ESTIMATES</label></div><button>Add</button>';
const MAT_OFFLINE = '<div>Internet Connection is required to make a material charge</div>';
function page912({ path = '/apm-mobile/asset-lookup', body = '', panel = null, tile = true } = {}) {
	const dom = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com' + path });
	const w = dom.window; const doc = w.document;
	doc.body.innerHTML = body + (tile ? '<img alt="icon for Asset Lookup">' : '')
		+ (panel === null ? '' : '<div role="tablist"><button role="tab" aria-selected="true" aria-controls="mp">Material</button><button role="tab">Notes</button></div>'
			+ `<div role="tabpanel" id="mp">${panel}</div><div role="tabpanel" style="display:none">${MAT_ONLINE}</div>`);
	return w;
}
const SEARCH_IN = '<form><input name="asset-search"></form>';
const CR = '<div class="mantine-Paper-root"><p>This feature requires an internet connection.</p></div>';
console.log('\nMOB.912_Offline_Connection_Screens - each screen online, then offline, same session');
check('lookup online - search, no ConnectionRequired', runJs(M912.lookupOn, page912({ body: SEARCH_IN })), true);
check('MUST FAIL: lookup online - ConnectionRequired showing', runJs(M912.lookupOn, page912({ body: CR })), false);
check('MUST FAIL: lookup online - not on /asset-lookup', runJs(M912.lookupOn, page912({ path: '/apm-mobile/', body: SEARCH_IN })), false);
check('home again - off the route, tile present', runJs(M912.homeAgain, page912({ path: '/apm-mobile/' })), true);
check('MUST FAIL: home again - history.back() did not leave Asset Lookup', runJs(M912.homeAgain, page912({ body: SEARCH_IN })), false);
check('lookup offline - ConnectionRequired, no search', runJs(M912.lookupOff, page912({ body: CR })), true);
check('MUST FAIL: lookup offline - the normal page (override unseen)', runJs(M912.lookupOff, page912({ body: SEARCH_IN })), false);
check('MUST FAIL: lookup offline - message AND search (both)', runJs(M912.lookupOff, page912({ body: CR + SEARCH_IN })), false);
check('material online - CHARGES/ESTIMATES, no message', runJs(M912.matOn, page912({ path: '/apm-mobile/work/x', panel: MAT_ONLINE })), true);
check('MUST FAIL: material online - the offline message', runJs(M912.matOn, page912({ path: '/apm-mobile/work/x', panel: MAT_OFFLINE })), false);
check('material offline - the message, no CHARGES', runJs(M912.matOff, page912({ path: '/apm-mobile/work/x', panel: MAT_OFFLINE })), true);
check('MUST FAIL: material offline - the normal panel (override unseen)', runJs(M912.matOff, page912({ path: '/apm-mobile/work/x', panel: MAT_ONLINE })), false);
check('MUST FAIL: material offline - no tab panel at all', runJs(M912.matOff, page912({ path: '/apm-mobile/work/x' })), false);

/* ===========================================================================================
 * MOB.913 - the offline queue. Header: TransactionStatus renders NOTHING at count 0, else a
 * Mantine Indicator (label = count) around the faUpload icon (data-icon="upload"). The list:
 * PendingTransactionLogs - Title "Pending Transactions", each op's operationName and
 * JSON.stringify(variables, null, 2) (so `"verified": true`, with a space).
 * ========================================================================================= */
const MOB913 = 'MOB.913_Offline_Transaction_Queue.json';
const M913 = {
	baseline: bodyOf(MOB913, 'BASELINE (leg 1): no pending-transactions indicator'),
	queued: bodyOf(MOB913, 'QUEUED (leg 1): the pending indicator reads 2'),
	held: bodyOf(MOB913, 'HELD (leg 1): still 2 pending'),
	listed: bodyOf(MOB913, 'LISTED: `Pending Transactions` shows BOTH held operations'),
	drained: bodyOf(MOB913, 'DRAINED: the pending indicator is gone'),
	restore: bodyOf(MOB913, 'RESTORE (leg 1): unverify every checked asset'),
};
function page913({ count = 0, wifi = 'wifi', modal = null, checked = false, checked2 = false } = {}) {
	const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/asset-verify/Z0EVwQcdJZhMURcBFkp0E0' }).window;
	const doc = w.document;
	const status = count ? `<div class="mantine-Indicator-root"><div class="mantine-Indicator-indicator">${count}</div><svg data-icon="upload"></svg></div>` : '';
	// another Indicator on the page (JobStatusIcon's dot) must not be read as the pending count
	doc.body.innerHTML = `<header><svg data-icon="${wifi}"></svg>${status}</header>`
		+ '<div class="mantine-Indicator-root"><div class="mantine-Indicator-indicator">7</div><span>job status</span></div>'
		+ (modal ? `<section class="mantine-Modal-content">${modal}</section>` : '')
		+ `<input type="checkbox" ${checked ? 'checked' : ''}><input type="checkbox" ${checked2 ? 'checked' : ''}>`;
	w.__clicks = 0; w.__clicked = [];
	doc.querySelectorAll('input[type="checkbox"]').forEach((b, i) => b.addEventListener('click', () => { w.__clicks++; w.__clicked.push(i); }));
	return w;
}
const LIST = (op, vars) => `<h3>Pending Transactions</h3><div class="mantine-Paper-root"><p>abc123</p><p>${op}</p><p>${JSON.stringify(vars, null, 2)}</p></div>`;
console.log('\nMOB.913_Offline_Transaction_Queue - held, counted, listed, drained; restore unverifies only when checked');
check('baseline - nothing pending, wifi icon', runJs(M913.baseline, page913()), true);
check('MUST FAIL: baseline - 1 pending already', runJs(M913.baseline, page913({ count: 1 })), false);
{
	// the list kept open through the drain, refreshed: `Pending Transactions` Box > Group > Title, Refresh
	const emptied = bodyOf(MOB913, 'EMPTIED: the still-open list, refreshed');
	const listPage = (rows, extra = '') => {
		const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/asset-verify/Z0EVwQcdJZhMURcBFkp0E0' }).window;
		w.document.body.innerHTML = `<div class="box"><div class="group"><h3>Pending Transactions</h3><div><button>Refresh</button></div></div><div class="scroll">${rows}</div></div>${extra}`;
		w.__refresh = 0; w.document.querySelector('button').addEventListener('click', () => w.__refresh++);
		return w;
	};
	check('913 emptied - the refreshed list reads No logs found.', runJs(emptied, listPage('<p>No logs found.</p>')), true);
	{
		const w = listPage(LIST('VERIFY_ASSET', { id: 'x', verified: true }).replace('<h3>Pending Transactions</h3>', ''));
		const first = runJs(emptied, w), second = runJs(emptied, w);
		check('MUST FAIL: 913 emptied - the stale list still shows VERIFY_ASSET: refreshes once, not twice within 2s', !first && !second && w.__refresh === 1, true);
	}
	check('MUST FAIL: 913 emptied - no list is open', runJs(emptied, listPage('').window ? listPage('') : (() => { const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/x' }).window; return w; })()), false);
	check('MUST FAIL: 913 emptied - `No logs found.` outside the list while it still shows VERIFY_ASSET',
		runJs(emptied, listPage('<p>VERIFY_ASSET</p>', '<p>No logs found.</p>')), false);
	check('MUST FAIL: 913 emptied - the verify drained but the status recompute is still listed',
		runJs(emptied, listPage('<p>No logs found.</p><p>UPDATE_MOBILE_JOB_STATUS</p>')), false);
}
check('MUST FAIL: baseline - the header never rendered (no wifi icon)', runJs(M913.baseline, page913({ wifi: 'none' })), false);
// One click is TWO operations: VERIFY_ASSET, plus the UPDATE_MOBILE_JOB_STATUS that
// VerificationCheckbox.update() recomputes (the fixture rests READY, so 1 of 2 is IN_PROGRESS).
const BOTH_OPS = LIST('VERIFY_ASSET', { id: 'x', verified: true })
	+ LIST('UPDATE_MOBILE_JOB_STATUS', { jobId: 'x', status: 'IN_PROGRESS' }).replace('<h3>Pending Transactions</h3>', '');
check('queued - the upload indicator reads 2', runJs(M913.queued, page913({ count: 2, wifi: 'wifi-slash' })), true);
check('MUST FAIL: queued - nothing pending (the mutations went straight out)', runJs(M913.queued, page913({ wifi: 'wifi-slash' })), false);
check('MUST FAIL: queued - only 1 pending (the status recompute never queued)', runJs(M913.queued, page913({ count: 1, wifi: 'wifi-slash' })), false);
check('MUST FAIL: queued - 3 pending', runJs(M913.queued, page913({ count: 3 })), false);
check('held - still 2', runJs(M913.held, page913({ count: 2 })), true);
check('MUST FAIL: held - down to 1 (one of them left)', runJs(M913.held, page913({ count: 1 })), false);
check('listed - both ops, pretty-printed', runJs(M913.listed, page913({ count: 2, modal: BOTH_OPS })), true);
check('MUST FAIL: listed - the verify alone (no status recompute queued)', runJs(M913.listed, page913({ count: 2, modal: LIST('VERIFY_ASSET', { id: 'x', verified: true }) })), false);
check('MUST FAIL: listed - the status update alone', runJs(M913.listed, page913({ count: 2, modal: LIST('UPDATE_MOBILE_JOB_STATUS', { jobId: 'x', status: 'IN_PROGRESS' }) })), false);
check('MUST FAIL: listed - an unverify (verified: false)', runJs(M913.listed, page913({ count: 2, modal: BOTH_OPS.replace('"verified": true', '"verified": false') })), false);
check('MUST FAIL: listed - the status recompute went the wrong way (READY)', runJs(M913.listed, page913({ count: 2, modal: BOTH_OPS.replace('"IN_PROGRESS"', '"READY"') })), false);
check('MUST FAIL: listed - a different operation', runJs(M913.listed, page913({ count: 2, modal: LIST('UPDATE_ASSET', { verified: true }) })), false);
check('MUST FAIL: listed - the list never opened', runJs(M913.listed, page913({ count: 2 })), false);
check('drained - nothing pending (the job-status Indicator is not mistaken for it)', runJs(M913.drained, page913()), true);
check('MUST FAIL: drained - still 1 pending', runJs(M913.drained, page913({ count: 1 })), false);
{
	const w = page913({ checked: true });
	check('restore - the first box is checked: clicked once', runJs(M913.restore, w) && w.__clicks === 1, true);
}
{
	const w = page913({ checked: false });
	check('restore - not checked: NOT clicked (never verifies by accident)', runJs(M913.restore, w) && w.__clicks === 0, true);
}
{
	// the case the old restore missed: the verify landed on another row, the first box is clear
	const w = page913({ checked: false, checked2: true });
	check('restore - only the SECOND box is checked: that one is clicked', runJs(M913.restore, w) && w.__clicks === 1 && w.__clicked[0] === 1, true);
}
{
	const w = page913({ checked: true, checked2: true });
	check('restore - both checked: both clicked, once each', runJs(M913.restore, w) && w.__clicks === 2, true);
}

/* ===========================================================================================
 * Record-add SERVER PROOF (dd_tools.record_count_js) - MOB.350/360/370/380/392. Counts INNERMOST
 * Papers in the ACTIVE panel carrying every needle. DOM from EquipmentCharges.tsx (a Paper per
 * charge: name, qty, "Charged created on <date>"; estimates: name + qty, no dated line).
 * ========================================================================================= */
{
	const M350 = {
		stash: bodyOf('MOB.350_Work_Add_Equipment_Charge.json', 'BEFORE: count the equipment charge cards'),
		proof: bodyOf('MOB.350_Work_Add_Equipment_Charge.json', 'SERVER PROOF: after a RELOAD there is exactly ONE more equipment'),
	};
	const M392proof = bodyOf('MOB.392_Work_Add_Note.json', 'SERVER PROOF: after a RELOAD there is exactly ONE more note');
	const charge = (name) => `<div class="mantine-Paper-root"><div><p class="mantine-Text-root">${name}</p><p class="mantine-Text-root">1 Each</p></div><div><p class="mantine-Text-root">Charged created on 09/11/2026</p></div></div>`;
	const estimate = (name) => `<div class="mantine-Paper-root"><div><p class="mantine-Text-root">${name}</p><p class="mantine-Text-root">2 Each</p></div></div>`;
	const panelPage = (cards, stash) => {
		const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q' }).window;
		for (const [k, v] of Object.entries(stash || {})) w.sessionStorage.setItem(k, v);
		w.document.body.innerHTML = '<div role="tablist"><button role="tab" aria-selected="true" aria-controls="eq">Equipment</button><button role="tab" aria-controls="lab">Labor</button></div>'
			+ `<div role="tabpanel" id="eq"><div class="mantine-Paper-root wrapper">${cards.join('')}</div></div>`
			+ `<div role="tabpanel" id="lab" style="display:none">${charge('AC Adapter')}${charge('AC Adapter')}</div>`;
		return w;
	};
	console.log('\nRecord-add SERVER PROOF - count own cards (innermost, active panel), reload, exactly +1');
	{
		const w = panelPage([charge('AC Adapter'), charge('AC Adapter'), estimate('AC Adapter'), charge('Backhoe')]);
		check('stash - counts 2 own charges: not the estimate, not Backhoe, not the wrapper, not the hidden tab',
			runJs(M350.stash, w) && w.sessionStorage.getItem('__dd35x_before') === '2', true);
	}
	const K = { __dd35x_before: '2' };
	check('proof - 3 after reload (2 + 1)', runJs(M350.proof, panelPage([charge('AC Adapter'), charge('AC Adapter'), charge('AC Adapter'), estimate('AC Adapter')], K)), true);
	check('MUST FAIL: proof - still 2 (the add was refused)', runJs(M350.proof, panelPage([charge('AC Adapter'), charge('AC Adapter')], K)), false);
	check('MUST FAIL: proof - 4 (two added, or a double submit)', runJs(M350.proof, panelPage([charge('AC Adapter'), charge('AC Adapter'), charge('AC Adapter'), charge('AC Adapter')], K)), false);
	check('MUST FAIL: proof - an ESTIMATE appeared, not a charge', runJs(M350.proof, panelPage([charge('AC Adapter'), charge('AC Adapter'), estimate('AC Adapter')], K)), false);
	check('MUST FAIL: proof - no baseline stashed', runJs(M350.proof, panelPage([charge('AC Adapter'), charge('AC Adapter'), charge('AC Adapter')], {})), false);
	const note = (txt) => `<div class="mantine-Paper-root"><p class="mantine-Text-root">New Note 2026-09-11 17:00</p><div class="mantine-Spoiler-root"><p>${txt}</p></div></div>`;
	const NT = 'This is a note - DD SYNTHETIC MOBILE';
	check('note proof - 1 -> 2', runJs(M392proof, panelPage([note(NT), note(NT), note('someone else')], { __dd392_before: '1' })), true);
	check('MUST FAIL: note proof - still 1', runJs(M392proof, panelPage([note(NT), note('someone else')], { __dd392_before: '1' })), false);
}

/* ===========================================================================================
 * MOB.721 - Readings empty state, scoped to the target row's ACTIVE panel.
 * ========================================================================================= */
{
	const tabOk = bodyOf('MOB.721_AssetLookup_Readings_Empty.json', 'The ACTIVE tab of the Building 0000 row is `Readings`');
	const empty = bodyOf('MOB.721_AssetLookup_Readings_Empty.json', 'EMPTY STATE: the panel reads');
	const row = (name, tab, body) => `<div class="mantine-Accordion-item"><button class="mantine-Accordion-control">${name}</button>`
		+ `<div role="tablist"><button role="tab" ${tab === 'Readings' ? 'aria-selected="true"' : ''} aria-controls="${name.length}r">Readings</button>`
		+ `<button role="tab" ${tab === 'General' ? 'aria-selected="true"' : ''} aria-controls="${name.length}g">General Info</button></div>`
		+ `<div role="tabpanel" id="${name.length}r">${tab === 'Readings' ? body : ''}</div><div role="tabpanel" id="${name.length}g">${tab === 'General' ? '<p>desc</p>' : ''}</div></div>`;
	const pg = (html) => { const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/asset-lookup' }).window; w.document.body.innerHTML = html; return w; };
	const E = '<p class="mantine-Text-root">No readings recorded for this asset.</p>';
	console.log('\nMOB.721_AssetLookup_Readings_Empty - the empty state, in the target row only');
	check('tab - Building row, Readings active', runJs(tabOk, pg(row('⚡ Building 0000', 'Readings', E))), true);
	check('MUST FAIL: tab - General Info active', runJs(tabOk, pg(row('⚡ Building 0000', 'General', E))), false);
	check('empty - the message in the Building row', runJs(empty, pg(row('⚡ Building 0000', 'Readings', E))), true);
	check('MUST FAIL: empty - the row has readings', runJs(empty, pg(row('⚡ Building 0000', 'Readings', '<form><input name="reading"></form>'))), false);
	check('MUST FAIL: empty - the message is in ANOTHER row', runJs(empty, pg(row('Pump 0102', 'Readings', E) + row('⚡ Building 0000', 'Readings', '<form></form>'))), false);
}

/* ===========================================================================================
 * MOB.626 - capture menus (CaptureImageOptions.tsx): Menu.Label + items; browser branch.
 * ========================================================================================= */
{
	const F = 'MOB.626_Collector_Capture_Options.json';
	const tagOne = bodyOf(F, 'TAG menu, browser branch');
	const withPhoto = bodyOf(F, 'DESCRIPTION menu with a photo');
	const closed = bodyOf(F, 'The capture menu is closed');
	const open = bodyOf(F, 'Open the tag capture menu');
	// Mantine 8 MenuItem.mjs: the item holds an itemSection (icon) and an itemLabel - a loose
	// `[class*="mantine-Menu-item"]` matches all three, which is what sank run 1
	const menu = (items) => `<div class="mantine-Menu-dropdown"><div class="mantine-Menu-label">Hello, what would you like to do?</div>${items.map(i => `<button class="mantine-Menu-item"><div class="mantine-Menu-itemSection"><svg></svg></div><div class="mantine-Menu-itemLabel">${i}</div></button>`).join('')}</div>`;
	const pg = (html) => { const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/asset-collector' }).window; w.document.body.innerHTML = html; return w; };
	console.log('\nMOB.626_Collector_Capture_Options - the browser branch, exactly');
	check('tag - exactly Add Asset Photo', runJs(tagOne, pg(menu(['Add Asset Photo']))), true);
	check('MUST FAIL: tag - the NATIVE branch (Take Photo, Select From Gallery)', runJs(tagOne, pg(menu(['Take Photo', 'Select From Gallery']))), false);
	check('MUST FAIL: tag - Use photo… without a photo', runJs(tagOne, pg(menu(['Add Asset Photo', 'Use photo selected above']))), false);
	check('MUST FAIL: tag - the menu never opened', runJs(tagOne, pg('<form id="asset-collector"></form>')), false);
	check('with photo - both items, in order', runJs(withPhoto, pg(menu(['Add Asset Photo', 'Use photo selected above']))), true);
	check('MUST FAIL: with photo - Use photo… missing', runJs(withPhoto, pg(menu(['Add Asset Photo']))), false);
	check('closed - no labelled dropdown, form still open', runJs(closed, pg('<form id="asset-collector"></form><div class="mantine-Menu-dropdown"><button class="mantine-Menu-item">Other</button></div>')), true);
	check('MUST FAIL: closed - the capture menu is still open', runJs(closed, pg('<form id="asset-collector"></form>' + menu(['Add Asset Photo']))), false);
	check('MUST FAIL: closed - the FORM is gone too (Escape discarded it - bugs §13)', runJs(closed, pg('')), false);
	{
		const w = pg('<form id="asset-collector"><label>Tag</label><button type="button" class="ab"><svg data-icon="barcode-read"></svg></button><button type="button" class="cd"><svg data-icon="wand-magic-sparkles"></svg></button></form>');
		let hit = null; w.document.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { hit = b.className; }));
		check('open - clicks the button holding the barcode-read icon', runJs(open, w) && hit === 'ab', true);
	}
	check('MUST FAIL: open - icon renamed (no barcode-read)', runJs(open, pg('<form id="asset-collector"><button><svg data-icon="barcode"></svg></button></form>')), false);
}

/* ===========================================================================================
 * MOB.320 - the status badge read EXACTLY (StatusMenuIcon.tsx:131 `Status: <Badge>{label}</Badge>`).
 * ========================================================================================= */
{
	const F = 'MOB.320_Work_Status_Update.json';
	const isComplete = bodyOf(F, 'Test the status badge now reads exactly "Complete"');
	const serverReady = bodyOf(F, 'After a reload the badge reads "Ready"');
	const pg = (label) => { const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/work/x' }).window;
		// no <p> wrapper: the HTML PARSER closes a <p> at a <div>, moving the badge out of the span - React never does
		w.document.body.innerHTML = `<div><span>Status: <div class="mantine-Badge-root"><span class="mantine-Badge-label">${label}</span></div></span></div>`; return w; };
	console.log('\nMOB.320_Work_Status_Update - the badge, exactly');
	check('Complete reads Complete', runJs(isComplete, pg('Complete')), true);
	check('MUST FAIL: "Not Completed" is not "Complete" (the old `contains` passed here)', runJs(isComplete, pg('Not Completed')), false);
	check('Ready after reload', runJs(serverReady, pg('Ready')), true);
	check('MUST FAIL: Canceled is not Ready', runJs(serverReady, pg('Canceled')), false);
}

/* ===========================================================================================
 * MOB.387 - Edit Item prefill: the six inputs hold exactly the card's values.
 * ========================================================================================= */
{
	const F = 'MOB.387_Work_Condition_Edit_Prefill.json';
	const prefill = bodyOf(F, 'PREFILLED from the card');
	const premise = bodyOf(F, 'PREMISE: exactly one `Pump 0102 · Mounting/Support` card');
	const form = (v) => { const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/work/x' }).window;
		w.document.body.innerHTML = '<form id="work-condition-form">' + Object.entries(v).map(([k, x]) => `<input id="${k}" value="${x}">`).join('') + '</form>'; return w; };
	const OK = { assetId: 'Pump 0102', assetStandardDetailId: 'Structural', inspectionElementId: 'Mounting/Support', conditionFound: '1', conditionScore: '2', stressScore: '3' };
	console.log('\nMOB.387_Work_Condition_Edit_Prefill - the form holds the card, exactly');
	check('prefill - all six', runJs(prefill, form(OK)), true);
	check('MUST FAIL: prefill - an empty form (defaultValues never resolved)', runJs(prefill, form({ ...OK, assetId: '', inspectionElementId: '' })), false);
	check('MUST FAIL: prefill - a score off by one', runJs(prefill, form({ ...OK, stressScore: '4' })), false);
	check('MUST FAIL: prefill - a field missing', runJs(prefill, form({ assetId: 'Pump 0102' })), false);
	const card = (el, f, sc, st) => `<div class="mantine-Paper-root"><button><p class="mantine-Text-root">${el}</p></button><button aria-label="Menu"></button><ul><li>Condition Found: <span>${f}</span></li><li>Condition Score: <span>${sc}</span></li><li>Stress Score: <span>${st}</span></li></ul></div>`;
	const pg = (cards) => { const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/work/x' }).window;
		w.document.body.innerHTML = `<div class="mantine-Paper-root"><p class="mantine-Text-root">Pump 0102</p>${cards.join('')}</div>`; return w; };
	check('premise - one Mounting/Support 1/2/3', runJs(premise, pg([card('Mounting/Support', 1, 2, 3), card('Pump Body', 1, 2, 3)])), true);
	check('MUST FAIL: premise - its scores changed', runJs(premise, pg([card('Mounting/Support', 1, 2, 4)])), false);
	check('MUST FAIL: premise - two Mounting/Support cards', runJs(premise, pg([card('Mounting/Support', 1, 2, 3), card('Mounting/Support', 1, 2, 3)])), false);
}

/* ===========================================================================================
 * MOB.536 / MOB.537 - AV header: job status menu items; `Tag ID: {tagNumber ?? 'None'}` and its button.
 * ========================================================================================= */
{
	const F6 = 'MOB.536_AssetVerify_Job_Status_Menu.json', F7 = 'MOB.537_AssetVerify_Header_Tag.json';
	// The exits NAME the status: three items means READY (the menu never draws the current status,
	// and never draws READY at all), COMPLETED + CANCELED means IN PROGRESS.
	const menuReady = bodyOf(F6, "MENU: exactly READY's three exits");
	const menuInProgress = bodyOf(F6, "the menu offers exactly IN PROGRESS's exits");
	const filterAll = bodyOf(F6, 'Put the asset filter on All');
	const restoreOpen = bodyOf(F6, 'RESTORE: if the job still reads canceled');
	const none = bodyOf(F7, '`Tag ID: None`');
	const base = bodyOf(F7, '`Tag ID: 0000` — Tank 0000');
	const openEdit = bodyOf(F7, 'Open the Tag ID edit button');
	const pg = (html) => { const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/asset-verify/x' }).window; w.document.body.innerHTML = html; return w; };
	// Mantine 8 MenuItem: itemSection + itemLabel inside the item - so a loose selector triple-counts
	const items = (xs) => `<div class="mantine-Menu-dropdown">${xs.map(x => `<button class="mantine-Menu-item"><div class="mantine-Menu-itemSection"><svg></svg></div><div class="mantine-Menu-itemLabel">${x}</div></button>`).join('')}</div>`;
	const header = (tag) => `<div class="mantine-Group-root"><p class="mantine-Text-root"><strong>Tag ID: </strong>${tag}</p><button type="button" class="edit"><svg data-icon="pen-to-square"></svg></button></div>`
		+ `<div class="mantine-Group-root"><p class="mantine-Text-root"><strong>Desc: </strong>x</p><button type="button" class="desc"></button></div>`;
	const job = (canceled) => `<div class="mantine-Flex-root"><div class="mantine-Indicator-root dot"></div><h3 class="mantine-Title-root">DATADOG MOBILE JOB</h3></div>` + (canceled ? '<div>This verification job has been canceled.</div>' : '');
	console.log('\nMOB.536 / MOB.537 - the AV header');
	const READY_ITEMS = ['Mark as IN PROGRESS', 'Mark as COMPLETED', 'Mark as CANCELED'];
	check('READY - all three exits', runJs(menuReady, pg(items(READY_ITEMS))), true);
	check('MUST FAIL: READY - only two exits (the job is IN PROGRESS)', runJs(menuReady, pg(items(['Mark as COMPLETED', 'Mark as CANCELED']))), false);
	check('MUST FAIL: READY - a fourth item appears', runJs(menuReady, pg(items(READY_ITEMS.concat(['Mark as READY'])))), false);
	check('MUST FAIL: READY - three items, but the wrong ones', runJs(menuReady, pg(items(['Mark as READY', 'Mark as COMPLETED', 'Mark as CANCELED']))), false);
	check('IN PROGRESS - exactly COMPLETED + CANCELED', runJs(menuInProgress, pg(items(['Mark as COMPLETED', 'Mark as CANCELED']))), true);
	check('MUST FAIL: IN PROGRESS - the READY menu (three exits)', runJs(menuInProgress, pg(items(READY_ITEMS))), false);
	check('MUST FAIL: IN PROGRESS - the current status offered', runJs(menuInProgress, pg(items(['Mark as IN PROGRESS', 'Mark as CANCELED']))), false);
	{
		// The restore leg needs the All filter: the Verified tab would not list an unverified row.
		const w = pg('<label><input type="radio"><span>All</span></label><label><input type="radio"><span>Verified</span></label>');
		let hit = null; w.document.querySelectorAll('label').forEach(l => l.addEventListener('click', () => { hit = l.textContent.trim(); }));
		check('filter - clicks All, not Verified', runJs(filterAll, w) && hit === 'All', true);
	}
	check('filter - no filter on the page: true, no throw', runJs(filterAll, pg('<div></div>')), true);
	{
		const w = pg(job(false)); let n = 0; w.document.querySelector('.dot').addEventListener('click', () => n++);
		check('restore - not canceled: the menu is NOT opened', runJs(restoreOpen, w) && n === 0, true);
	}
	{
		const w = pg(job(true)); let n = 0; w.document.querySelector('.dot').addEventListener('click', () => n++);
		check('restore - canceled: the status dot is clicked', runJs(restoreOpen, w) && n === 1, true);
	}
	check('tag - None branch', runJs(none, pg(header('None'))), true);
	check('MUST FAIL: tag - None expected, a tag present', runJs(none, pg(header('0000'))), false);
	check('tag - 0000', runJs(base, pg(header('0000'))), true);
	check('MUST FAIL: tag - the leftover marker', runJs(base, pg(header('DD-TAG-EDIT'))), false);
	{
		const w = pg(header('0000')); let hit = null; w.document.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { hit = b.className; }));
		check('open edit - the Tag ID group\'s button, not the Desc one', runJs(openEdit, w) && hit === 'edit', true);
	}
	// the page's General Info form renders its OWN #tagNumber behind the modal (run 1: two matches)
	const closedEdit = bodyOf(F7, 'The edit form closed');
	const gi = '<form id="mobile-genInfo"><input id="tagNumber" value="0000"></form>';
	check('edit closed - modal gone, General Info #tagNumber still on the page', runJs(closedEdit, pg(gi)), true);
	check('MUST FAIL: edit closed - the modal still holds its #tagNumber',
		runJs(closedEdit, pg(gi + '<div class="mantine-Modal-content"><input id="tagNumber" value="DD-TAG-EDIT"></div>')), false);
}

/* ===========================================================================================
 * MOB.951 / MOB.952 - phone width: the mobile form branch; the crew shortcut hidden by design.
 * ========================================================================================= */
{
	const branch = bodyOf('MOB.951_Phone_Form_Branch.json', 'THE MOBILE FORM BRANCH');
	const sentinel = bodyOf('MOB.952_Phone_Header_And_List.json', 'BY DESIGN: the header crew shortcut');
	const pg = (html) => { const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/work/x/form/y' }).window; w.document.body.innerHTML = html; return w; };
	console.log('\nMOB.951 / MOB.952 - phone width');
	check('branch - #senor-work-form, no desktop panel', runJs(branch, pg('<form id="senor-work-form"></form>')), true);
	check('MUST FAIL: branch - the DESKTOP form (tablet)', runJs(branch, pg('<div id="apm-dv-tabpanel"></div>')), false);
	check('MUST FAIL: branch - both (impossible, but must not pass)', runJs(branch, pg('<form id="senor-work-form"></form><div id="apm-dv-tabpanel"></div>')), false);
	{
		const gate = bodyOf('MOB.951_Phone_Form_Branch.json', 'GATE: the Forms tab is SELECTED');
		const tabs = (sel) => { const w = pg(`<button role="tab" aria-selected="false">General Info</button><button role="tab" aria-selected="${sel}">Forms</button>`);
			w.__n = 0; w.document.querySelectorAll('[role="tab"]')[1].addEventListener('click', () => w.__n++); return w; };
		{ const w = tabs('true'); check('951 gate - Forms already selected: passes without clicking', runJs(gate, w) && w.__n === 0, true); }
		{ const w = tabs('false'); const a = runJs(gate, w), b = runJs(gate, w);
		  check('MUST FAIL: 951 gate - Forms not selected: re-clicks once, not again within 3s', !a && !b && w.__n === 1, true); }
		check('MUST FAIL: 951 gate - no Forms tab at all', runJs(gate, pg('<button role="tab" aria-selected="true">General Info</button>')), false);

		const img = bodyOf('MOB.951_Phone_Form_Branch.json', 'IMAGE FIELD (server)');
		const sync = (v) => ({ then(f) { try { const r = f(v); return r && r.then ? r : sync(r); } catch (e) { return fail(e); } }, catch() { return this; } });
		const fail = (e) => ({ then() { return this; }, catch(f) { f(e); return sync(undefined); } });
		const srv = (html, types, formId = 'y') => { const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/work/x/form/y' }).window;
			w.document.body.innerHTML = html;
			const answer = { data: { workStage: { forms: [{ id: formId, fields: types.map(t => ({ __typename: 'WorkStageFormDetail', attributeTypeId: { type: t } })) }] } } };
			w.fetch = () => sync({ json: () => sync(answer) }); return w; };
		const twice = (body, w) => { runJs(body, w); return runJs(body, w); };
		const FORM = '<form id="senor-work-form"></form>', BTN = '<button><span>Upload Photo</span></button>';
		check('951 image - an image field and its Upload Photo button', twice(img, srv(FORM + BTN, ['string', 'image'])), true);
		check('951 image - no image field and no button', twice(img, srv(FORM, ['string', 'integer'])), true);
		check('MUST FAIL: 951 image - an image field but no Upload Photo button', twice(img, srv(FORM, ['image'])), false);
		check('MUST FAIL: 951 image - an Upload Photo button with no image field', twice(img, srv(FORM + BTN, ['string'])), false);
		check('MUST FAIL: 951 image - the mobile form is not on the page', twice(img, srv(BTN, ['image'])), false);
		check('MUST FAIL: 951 image - the form on screen is not in the answer', twice(img, srv(FORM + BTN, ['image'], 'OTHER')), false);
	}
	check('by design - .mobile-crew present and display:none', runJs(sentinel, pg('<style>.mobile-crew{display:none}</style><div class="mobile-crew">Admin</div>')), true);
	check('MUST FAIL: by design - shown (the design changed)', runJs(sentinel, pg('<div class="mobile-crew">Admin</div>')), false);
	check('MUST FAIL: by design - absent altogether', runJs(sentinel, pg('<div></div>')), false);
	// jsdom has no layout: give every element a phone-sized on-screen rect, so only the SELECTOR is on trial
	const search = bodyOf('MOB.952_Phone_Header_And_List.json', "search control is ON SCREEN");
	const laid = (html) => { const w = pg(html); w.innerWidth = 320; w.innerHeight = 550;
		w.Element.prototype.getBoundingClientRect = () => ({ left: 10, right: 220, top: 330, bottom: 366, width: 210, height: 36 }); return w; };
	check('search - the list\'s own SearchInput (Find Workstage(s))', runJs(search, laid('<input placeholder="Find Workstage(s)">')), true);
	check('MUST FAIL: search - only a type=search input (run 1\'s guess)', runJs(search, laid('<input type="search">')), false);
	{
		const w = laid('<input placeholder="Find Workstage(s)">');
		w.Element.prototype.getBoundingClientRect = () => ({ left: 10, right: 400, top: 330, bottom: 366, width: 390, height: 36 });
		check('MUST FAIL: search - wider than the phone (off screen right)', runJs(search, w), false);
	}
}

/* ===========================================================================================
 * MOB.358 offline leg - AssetGeolocate.tsx:272 OfflineGeolocateForm vs the online AssetLocationForm.
 * ========================================================================================= */
{
	const off = bodyOf('MOB.358_Work_Asset_Geolocate.json', 'OFFLINE FORM:');
	const pg = (html) => { const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/work/x' }).window; w.document.body.innerHTML = html; return w; };
	const OFF = '<form id="mobile-geolocate-offline"><p>Location details are unavailable offline.</p><p>Submit to update latitude/longitude.</p></form>';
	console.log('\nMOB.358 offline leg - the offline geolocate form, not the online one');
	check('offline form rendered', runJs(off, pg(OFF)), true);
	check('MUST FAIL: the ONLINE form (override unseen)', runJs(off, pg('<form id="mobile-geolocate"><input name="address"></form>')), false);
	check('MUST FAIL: the message outside the offline form', runJs(off, pg('<p>Location details are unavailable offline.</p><p>Submit to update latitude/longitude.</p>')), false);
}

/* ===========================================================================================
 * dd_tools.server_assert - a GENUINE server read (trap 6): POST /graphql, stored, judged, re-asked.
 * Used where a reload would read the app's own persisted cache write: MOB.320's status,
 * MOB.390/391's add and post-delete.
 * ========================================================================================= */
{
	const S320 = bodyOf('MOB.320_Work_Status_Update.json', 'SERVER: `workStage.status` is `NotCompleted`');
	const S390gone = bodyOf('MOB.390_Work_Add_Condition.json', "SERVER: the run's condition is gone");
	const S391one = bodyOf('MOB.391_Work_Add_Failure.json', 'SERVER: exactly ONE failure');
	// a synchronous thenable, so one runJs call can fire the request AND store its answer
	const sync = (v) => ({ then(f) { try { const r = f(v); return r && r.then ? r : sync(r); } catch (e) { return fail(e); } }, catch() { return this; } });
	const fail = (e) => ({ then() { return this; }, catch(f) { f(e); return sync(undefined); } });
	const page = (answer) => {
		const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/work/x' }).window;
		w.__calls = [];
		w.fetch = (url, opts) => {
			w.__calls.push({ url, opts });
			const a = typeof answer === 'function' ? answer(w.__calls.length) : answer;
			return a instanceof Error ? fail(a) : sync({ json: () => sync(a) });
		};
		return w;
	};
	const twice = (body, w) => { runJs(body, w); return runJs(body, w); };
	console.log('\nserver_assert - a /graphql read, not the persisted cache (MOB.320, MOB.390, MOB.391)');
	{
		const w = page({ data: { workStage: { status: 'NotCompleted' } } });
		const first = runJs(S320, w), second = runJs(S320, w);
		check('status - the first poll asks, a later poll judges', first === false && second === true, true);
		const c = w.__calls[0], body = JSON.parse(c.opts.body);
		check('request - POST /graphql, same-origin cookie, apollo-require-preflight, the fixture id',
			c.url === '/graphql' && c.opts.method === 'POST' && c.opts.credentials === 'same-origin'
			&& c.opts.headers['apollo-require-preflight'] === '*' && /workStage/.test(body.query)
			&& body.variables.id === 'EYRpYJ9QYdQ1JFF10JtB0Q', true);
	}
	{
		const w = page({ data: { workStage: { status: 'Complete' } } });
		check('MUST FAIL: status - the server says Complete', twice(S320, w), false);
		check('MUST FAIL: status - the UI LABEL "Not Completed" (local run 1: the server holds the enum)', twice(S320, page({ data: { workStage: { status: 'Not Completed' } } })), false);
		check('a wrong answer is not re-asked within 2s (no request storm)', w.__calls.length === 1, true);
	}
	{
		const w = page((n) => ({ data: { workStage: { status: n === 1 ? 'OnHold' : 'NotCompleted' } } }));
		twice(S320, w);                                     // stale answer judged false and discarded
		w.sessionStorage.setItem('__dd320_status:at', '0'); // ...2s later
		runJs(S320, w);                                     // asks again
		check('stale answer - discarded, re-asked, then true', runJs(S320, w) === true && w.__calls.length === 2, true);
	}
	check('MUST FAIL: GraphQL errors', twice(S320, page({ errors: [{ message: 'nope' }] })), false);
	check('MUST FAIL: workStage null (a throw counts as false)', twice(S320, page({ data: { workStage: null } })), false);
	check('MUST FAIL: the request itself fails', twice(S320, page(new Error('offline'))), false);
	const cond = (...names) => ({ data: { workStage: { condition: names.map(n => ({ inspectionElementId: { name: n } })) } } });
	const withOrig = (w, n) => { w.sessionStorage.setItem('__dd39x_origCount', String(n)); return w; };
	check('cleaned - Pump Body gone from the server, Mounting/Support still there', twice(S390gone, withOrig(page(cond('Mounting/Support')), 1)), true);
	check('MUST FAIL: cleaned - the server still holds Pump Body (the cache said gone)', twice(S390gone, withOrig(page(cond('Mounting/Support', 'Pump Body')), 1)), false);
	check('MUST FAIL: cleaned - the original went with it', twice(S390gone, withOrig(page(cond()), 1)), false);
	const fl = (...reps) => ({ data: { workStage: { failures: reps.map(r => ({ failureTypeId: { name: 'BELT (R-L1)' }, repairTypeId: { name: r }, rootCauseTypeId: { name: 'TIME' } })) } } });
	check('failure add - exactly one ADJUST beside the MISSED original', twice(S391one, page(fl('MISSED', 'ADJUST'))), true);
	check('MUST FAIL: failure add - none (the server refused it, bugs §40)', twice(S391one, page(fl('MISSED'))), false);
	check('MUST FAIL: failure add - two', twice(S391one, page(fl('MISSED', 'ADJUST', 'ADJUST'))), false);
}

/* ===========================================================================================
 * build_tab_tests.submit_and_assert - the ARMED gate: click Submit only once SubmitButton is
 * `type="submit"` (`type={isValid ? 'submit' : 'button'}`, trap 8). MOB.390 Datadog run 1 clicked
 * the inert `type="button"` with every field filled; its retry passed.
 * ========================================================================================= */
{
	const armedC = bodyOf('MOB.390_Work_Add_Condition.json', 'Submit is ARMED');
	const armedF = bodyOf('MOB.391_Work_Add_Failure.json', 'Submit is ARMED');
	const pg = (html) => { const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/work/x' }).window; w.document.body.innerHTML = html; return w; };
	console.log('\nsubmit_and_assert - the ARMED gate (MOB.390, MOB.391)');
	check('condition - armed: type="submit"', runJs(armedC, pg('<form id="work-condition-form"></form><button form="work-condition-form" type="submit">Submit</button>')), true);
	check('MUST FAIL: condition - still validating: type="button" (the race run 1 lost)', runJs(armedC, pg('<button form="work-condition-form" type="button">Submit</button>')), false);
	check('MUST FAIL: condition - no submit button at all', runJs(armedC, pg('<div></div>')), false);
	check('MUST FAIL: condition - only the FAILURE form is armed', runJs(armedC, pg('<button form="work-failure-form" type="submit">Submit</button>')), false);
	check('failure - armed: type="submit"', runJs(armedF, pg('<button form="work-failure-form" type="submit">Submit</button>')), true);
	check('MUST FAIL: failure - type="button"', runJs(armedF, pg('<button form="work-failure-form" type="button">Submit</button>')), false);
}

/* ===========================================================================================
 * Checklist #38/#40 - offline messages (MOB.626 collector leg, MOB.914 Asset Lookup) and the
 * condition/failure card labels (MOB.387). The GUARDED clicks must refuse online: there the
 * click opens a native file dialog (Add Asset Photo) or posts to the AI route (Get Description).
 * ========================================================================================= */
{
	const MSG = 'This feature requires an internet connection.';
	const pg = (html, url = 'https://dev.mentorapm.com/apm-mobile/asset-collector') => { const w = new JSDOM('<body></body>', { url }).window; w.document.body.innerHTML = html; return w; };
	const OFF = '<svg data-icon="wifi-slash"></svg>', ON = '<svg data-icon="wifi"></svg>';
	console.log('\nChecklist #38/#40 - offline messages and card labels (MOB.626, MOB.914, MOB.387)');

	// MOB.626 - the guarded `Add Asset Photo` click and its popover
	const guard626 = bodyOf('MOB.626_Collector_Capture_Options.json', 'GUARD + record + click `Add Asset Photo`');
	const pop626 = bodyOf('MOB.626_Collector_Capture_Options.json', 'OFFLINE: `Add Asset Photo` rendered OFFLINE_FEATURE_MESSAGE');
	const menu626 = '<div class="mantine-Menu-dropdown"><div>Hello, what would you like to do?</div><button class="mantine-Menu-item">Add Asset Photo</button></div>';
	{
		const w = pg(OFF + menu626); let clicked = 0; w.document.querySelector('.mantine-Menu-item').addEventListener('click', () => clicked++);
		check('626 guard - offline: Add Asset Photo is clicked once', runJs(guard626, w) && clicked === 1, true);
	}
	{
		const w = pg(ON + menu626); let clicked = 0; w.document.querySelector('.mantine-Menu-item').addEventListener('click', () => clicked++);
		check('MUST FAIL: 626 guard - ONLINE: refuses, and never clicks (a file dialog would open)', !runJs(guard626, w) && clicked === 0, true);
	}
	// the recorder: the guard installs an observer, the popover FLASHES in and out, the check reads the record
	pending.push((async () => {
		const w = pg(OFF + menu626); runJs(guard626, w);
		const p = w.document.createElement('div'); p.className = 'mantine-Popover-dropdown'; p.textContent = MSG; w.document.body.appendChild(p);
		await flushObservers(); p.remove(); await flushObservers();
		check('626 recorder - a message that flashed in and out is recorded', runJs(pop626, w), true);
	})());
	pending.push((async () => {
		const w = pg(OFF + menu626); runJs(guard626, w);
		const p = w.document.createElement('div'); p.textContent = 'Choose a file'; w.document.body.appendChild(p); await flushObservers();
		check('MUST FAIL: 626 recorder - the DOM changed but the message never rendered', runJs(pop626, w), false);
	})());

	// MOB.914 - Asset Lookup: the named row's ACTIVE panel, and the guarded Get Description
	const W = 'https://dev.mentorapm.com/apm-mobile/asset-lookup';
	const row = (name, tabLabel, panel, other = '') => `<div class="mantine-Accordion-item"><div class="mantine-Accordion-control">⚡ ${name}</div>`
		+ `<div role="tab" aria-selected="true" aria-controls="p-${tabLabel.replace(' ', '')}">${tabLabel}</div>`
		+ `<div role="tabpanel" id="p-${tabLabel.replace(' ', '')}">${panel}</div></div>${other}`;
	const readings = bodyOf('MOB.914_Offline_Feature_Messages.json', 'READINGS OFFLINE:');
	const history = bodyOf('MOB.914_Offline_Feature_Messages.json', 'WORK HISTORY OFFLINE:');
	check('914 readings - the tab is the offline message', runJs(readings, pg(row('Building 0000', 'Readings', `<p>${MSG}</p>`), W)), true);
	check('MUST FAIL: 914 readings - the ONLINE empty state (the event never landed)', runJs(readings, pg(row('Building 0000', 'Readings', '<p>No readings recorded for this asset.</p>'), W)), false);
	check('MUST FAIL: 914 readings - the message sits in ANOTHER row', runJs(readings, pg(row('Building 0000', 'Readings', '<p>No readings recorded for this asset.</p>', row('Tank 0000', 'Readings', `<p>${MSG}</p>`)), W)), false);
	check('914 work history - the tab is the offline message', runJs(history, pg(row('Building 0000', 'Work History', `<p>${MSG}</p>`), W)), true);
	check('MUST FAIL: 914 work history - the active tab is Readings, not Work History', runJs(history, pg(row('Building 0000', 'Readings', `<p>${MSG}</p>`), W)), false);
	const guard914 = bodyOf('MOB.914_Offline_Feature_Messages.json', 'GUARD + record + click `Get Description`');
	const seen914 = bodyOf('MOB.914_Offline_Feature_Messages.json', 'GET DESCRIPTION OFFLINE:');
	const menu914 = (styled) => `<div class="mantine-Menu-dropdown"><button class="mantine-Menu-item"${styled ? ' style="opacity: 0.6; cursor: default;"' : ''}>Get Description</button><button class="mantine-Menu-item">Delete Photo</button></div>`;
	{
		const w = pg(OFF + menu914(true), W); const clicks = []; w.document.querySelectorAll('.mantine-Menu-item').forEach(b => b.addEventListener('click', () => clicks.push(b.textContent)));
		check('914 guard - offline + styled disabled: ONLY Get Description is clicked', runJs(guard914, w) && clicks.length === 1 && clicks[0] === 'Get Description', true);
	}
	{
		const w = pg(ON + menu914(true), W); let n = 0; w.document.querySelectorAll('.mantine-Menu-item').forEach(b => b.addEventListener('click', () => n++));
		check('MUST FAIL: 914 guard - ONLINE: refuses and clicks nothing (the AI route)', !runJs(guard914, w) && n === 0, true);
	}
	{
		const w = pg(OFF + menu914(false), W); let n = 0; w.document.querySelectorAll('.mantine-Menu-item').forEach(b => b.addEventListener('click', () => n++));
		check('MUST FAIL: 914 guard - offline icon but the item is NOT disabled: refuses', !runJs(guard914, w) && n === 0, true);
	}
	pending.push((async () => {
		const w = pg(OFF + menu914(true), W); runJs(guard914, w);
		const p = w.document.createElement('div'); p.textContent = MSG; w.document.body.appendChild(p);
		await flushObservers(); p.remove(); await flushObservers();
		check('914 recorder - the flashed message is recorded', runJs(seen914, w), true);
	})());
	pending.push((async () => {
		const w = pg(OFF + menu914(true), W); runJs(guard914, w);
		const p = w.document.createElement('div'); p.textContent = 'Describing…'; w.document.body.appendChild(p); await flushObservers();
		check('MUST FAIL: 914 recorder - the DOM changed but the message never rendered', runJs(seen914, w), false);
	})());

	// MOB.914 - Tank 0000's Readings: `Add reading types` offline opens the message popover (EventReadings.tsx:300)
	const rGuard = bodyOf('MOB.914_Offline_Feature_Messages.json', "FIXTURE GUARD: Tank 0000's Readings panel");
	const rClick = bodyOf('MOB.914_Offline_Feature_Messages.json', 'GUARD + click `Add reading types`');
	const rPop = bodyOf('MOB.914_Offline_Feature_Messages.json', 'ADD READING TYPES OFFLINE');
	const withReadings = '<p>0 of 2 recorded recently (in 24h)</p><button aria-label="Add reading types"></button>';
	check('914 readings guard - readings listed and the add-types button', runJs(rGuard, pg(row('Tank 0000', 'Readings', withReadings), W)), true);
	check('MUST FAIL: 914 readings guard - no readings: the tab is the offline message (`:240`)', runJs(rGuard, pg(row('Tank 0000', 'Readings', `<p>${MSG}</p>`), W)), false);
	check('MUST FAIL: 914 readings guard - readings but no button (no `canCreate`)', runJs(rGuard, pg(row('Tank 0000', 'Readings', '<p>0 of 2 recorded recently (in 24h)</p>'), W)), false);
	check('MUST FAIL: 914 readings guard - the button sits in ANOTHER row', runJs(rGuard, pg(row('Tank 0000', 'Readings', '<p>0 of 2 recorded recently (in 24h)</p>', row('Building 0000', 'Readings', withReadings)), W)), false);
	{
		const w = pg(OFF + row('Tank 0000', 'Readings', withReadings), W); let n = 0; w.document.querySelector('[aria-label="Add reading types"]').addEventListener('click', () => n++);
		check('914 add-types click - offline: clicked once', runJs(rClick, w) && n === 1, true);
	}
	{
		const w = pg(ON + row('Tank 0000', 'Readings', withReadings), W); let n = 0; w.document.querySelector('[aria-label="Add reading types"]').addEventListener('click', () => n++);
		check('MUST FAIL: 914 add-types click - ONLINE: refuses and never clicks (the modal would open)', !runJs(rClick, w) && n === 0, true);
	}
	check('914 add-types popover - the message in a Popover dropdown, no modal', runJs(rPop, pg(`<div class="mantine-Popover-dropdown"><p>${MSG}</p></div>`, W)), true);
	check('MUST FAIL: 914 add-types popover - the AddReadingTypes modal opened too', runJs(rPop, pg(`<div class="mantine-Popover-dropdown"><p>${MSG}</p></div><div class="mantine-Modal-content"></div>`, W)), false);
	check('MUST FAIL: 914 add-types popover - the message outside any popover', runJs(rPop, pg(`<p>${MSG}</p>`, W)), false);
	check('MUST FAIL: 914 add-types popover - only a substring class (the arrow), not the dropdown token', runJs(rPop, pg(`<div class="mantine-Popover-dropdownArrow"><p>${MSG}</p></div>`, W)), false);

	// MOB.387 - the condition card's always-rendered rows, and the failure table's Discovery Code
	const labels387 = bodyOf('MOB.387_Work_Condition_Edit_Prefill.json', 'also lists `Stress Decision Score:`');
	const disc387 = bodyOf('MOB.387_Work_Condition_Edit_Prefill.json', '`Discovery Code` row');
	const card = (extra) => `<div class="mantine-Paper-root"><p class="mantine-Text-root">Pump 0102</p><div class="mantine-Paper-root"><button><p>Mounting/Support</p></button>`
		+ `<ul><li>Condition Found: <span>1</span></li><li>Condition Score: <span>2</span></li><li>Stress Score: <span>3</span></li>${extra}</ul></div></div>`;
	const W2 = 'https://dev.mentorapm.com/apm-mobile/work/x';
	check('387 labels - Stress Decision Score: and Notes: rows', runJs(labels387, pg(card('<li>Stress Decision Score: <span></span></li><li><div>Notes: <p></p></div></li>'), W2)), true);
	check('MUST FAIL: 387 labels - Notes: missing', runJs(labels387, pg(card('<li>Stress Decision Score: <span></span></li>'), W2)), false);
	check('387 discovery - a Discovery Code cell in the visible panel', runJs(disc387, pg('<div role="tabpanel"><table><tr><td>Discovery Code</td><td></td></tr></table></div>', W2)), true);
	check('MUST FAIL: 387 discovery - only in a HIDDEN panel', runJs(disc387, pg('<div role="tabpanel" style="display: none;"><table><tr><td>Discovery Code</td></tr></table></div>', W2)), false);
}

/* ===========================================================================================
 * MOB.386 - Edit Item SAVE (checklist #36): the gear on exactly one card, the picked score held,
 * Submit armed (`isValid && isDirty` -> type="submit"). The server reads are server_assert's cases.
 * ========================================================================================= */
if (!fs.existsSync(path.join(TESTS, 'MOB.386_Work_Condition_Edit_Save.json'))) {
	console.log('\nMOB.386 - SKIPPED: MOB.386_Work_Condition_Edit_Save.json is not built yet');
} else {
	const F386 = 'MOB.386_Work_Condition_Edit_Save.json';
	const gear = bodyOf(F386, 'card\'s gear');
	const holds4 = bodyOf(F386, 'The form now holds Condition Left 4');
	const armed = bodyOf(F386, 'Submit is ARMED');
	const W = 'https://dev.mentorapm.com/apm-mobile/work/x';
	const pg = (html) => { const w = new JSDOM('<body></body>', { url: W }).window; w.document.body.innerHTML = html; return w; };
	const card = (el) => `<div class="mantine-Paper-root"><button>${el}</button><button aria-label="Menu"></button><ul><li>Condition Found: <span>1</span></li></ul></div>`;
	const asset = (...cards) => `<div class="mantine-Paper-root"><p class="mantine-Text-root">Pump 0102</p>${cards.join('')}</div>`;
	console.log('\nMOB.386 - Edit Item save: gear, held score, armed Submit');
	{
		const w = pg(asset(card('Mounting/Support'), card('Pump Body'))); let hit = 0;
		w.document.querySelectorAll('[aria-label="Menu"]')[0].addEventListener('click', () => hit++);
		w.document.querySelectorAll('[aria-label="Menu"]')[1].addEventListener('click', () => hit += 10);
		check('386 gear - clicks ONLY the Mounting/Support card\'s gear', runJs(gear, w) && hit === 1, true);
	}
	check('MUST FAIL: 386 gear - two Mounting/Support cards (never guess which)', runJs(gear, pg(asset(card('Mounting/Support'), card('Mounting/Support')))), false);
	check('386 holds - #conditionScore reads 4', runJs(holds4, pg('<input id="conditionScore" value="4">')), true);
	check('MUST FAIL: 386 holds - still the prefilled 2', runJs(holds4, pg('<input id="conditionScore" value="2">')), false);
	check('386 armed - button[form="work-condition-form"] type="submit"', runJs(armed, pg('<button form="work-condition-form" type="submit">Submit</button>')), true);
	check('MUST FAIL: 386 armed - type="button" (not yet valid AND dirty)', runJs(armed, pg('<button form="work-condition-form" type="button">Submit</button>')), false);
}

/* ===========================================================================================
 * MOB.134 - a work form's integer field (checklist #42). The guard tags ONLY the first visible
 * `mantine-NumberInput-input` that the server calls this form's empty integer field; the proof and
 * the restore read that field back. jsdom has no layout, so `offsetParent` is modelled per input.
 * ========================================================================================= */
{
	const G134 = bodyOf('MOB.134_Work_Form_Fill.json', 'FIELD GUARD (server)');
	const H134 = bodyOf('MOB.134_Work_Form_Fill.json', 'SERVER: the field holds 134');
	const R134 = bodyOf('MOB.134_Work_Form_Fill.json', 'RESTORED (server): the field holds no value');
	const B134 = bodyOf('MOB.134_Work_Form_Fill.json', "The input holds '134' BEFORE the blur");
	const sync = (v) => ({ then(f) { try { const r = f(v); return r && r.then ? r : sync(r); } catch (e) { return fail(e); } }, catch() { return this; } });
	const fail = (e) => ({ then() { return this; }, catch(f) { f(e); return sync(undefined); } });
	const page = (html, answer) => {
		const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q/form/F1' }).window;
		w.document.body.innerHTML = html;
		w.document.querySelectorAll('input').forEach(e => Object.defineProperty(e, 'offsetParent', { get: () => (e.hasAttribute('data-hidden') ? null : e.parentNode) }));
		w.fetch = () => sync({ json: () => sync(answer) });
		return w;
	};
	const twice = (body, w) => { runJs(body, w); return runJs(body, w); };
	const num = (id, hidden) => `<input id="${id}" class="mantine-NumberInput-input"${hidden ? ' data-hidden' : ''}>`;
	const panel = (...inputs) => `<div id="apm-dv-tabpanel">${inputs.join('')}</div>`;
	const form = (fields, id = 'F1') => ({ data: { workStage: { forms: [{ id, fields }] } } });
	const fd = (id, type, value = null) => ({ __typename: 'WorkStageFormDetail', id, value, attributeTypeId: { type } });
	const stored = (w) => { w.sessionStorage.setItem('__dd134_field', 'I1'); return w; };
	console.log('\nMOB.134 - the work form field fill: guard, proof, restore');
	{
		const w = page(panel(num('I1')), form([fd('I1', 'integer')]));
		check('134 guard - the first number input is an empty integer field: tagged, id stored',
			twice(G134, w) && w.document.getElementById('I1').getAttribute('data-dd134') === 'target' && w.sessionStorage.getItem('__dd134_field') === 'I1', true);
	}
	check("134 guard - it holds this test's own 134 (a run died before its restore): accepted", twice(G134, page(panel(num('I1')), form([fd('I1', 'integer', '134')]))), true);
	check('134 guard - a hidden number input first, the visible integer field after it', twice(G134, page(panel(num('X', true), num('I1')), form([fd('I1', 'integer')]))), true);
	{
		const w = page(panel(num('F9')), form([fd('F9', 'float')]));
		check('MUST FAIL: 134 guard - the first number input is a FLOAT field, and nothing is tagged', !twice(G134, w) && !w.document.querySelector('[data-dd134]'), true);
	}
	{
		const w = page(panel(num('I1')), form([fd('I1', 'integer', '7')]));
		check('MUST FAIL: 134 guard - the integer field holds a REAL value, and nothing is tagged', !twice(G134, w) && !w.document.querySelector('[data-dd134]'), true);
	}
	check('MUST FAIL: 134 guard - the form on screen is not in the answer', twice(G134, page(panel(num('I1')), form([fd('I1', 'integer')], 'OTHER'))), false);
	check('MUST FAIL: 134 guard - the visible input is not a field of this form', twice(G134, page(panel(num('ZZ')), form([fd('I1', 'integer')]))), false);
	check('MUST FAIL: 134 guard - only a substring class (the wrapper), no input token (trap 3)', twice(G134, page(panel('<input id="I1" class="mantine-NumberInput-inputWrapper">'), form([fd('I1', 'integer')]))), false);
	check('134 proof - the server holds "134"', twice(H134, stored(page('', form([fd('I1', 'integer', '134')])))), true);
	check('134 proof - the server holds the number 134', twice(H134, stored(page('', form([fd('I1', 'integer', 134)])))), true);
	check('MUST FAIL: 134 proof - still empty (the blur saved nothing)', twice(H134, stored(page('', form([fd('I1', 'integer')])))), false);
	check('MUST FAIL: 134 proof - no stored field id (the guard never tagged one)', twice(H134, page('', form([fd('I1', 'integer', '134')]))), false);
	check('134 restored - null', twice(R134, stored(page('', form([fd('I1', 'integer')])))), true);
	check('134 restored - empty string', twice(R134, stored(page('', form([fd('I1', 'integer', '')])))), true);
	check('MUST FAIL: 134 restored - still 134', twice(R134, stored(page('', form([fd('I1', 'integer', '134')])))), false);
	check('MUST FAIL: 134 restored - the field is missing from the answer', twice(R134, stored(page('', form([fd('I2', 'integer')])))), false);
	check('134 before blur - the TAGGED input holds 134', runJs(B134, page('<input data-dd134="target" value="134">', {})), true);
	check('MUST FAIL: 134 before blur - 134 sits in an untagged input', runJs(B134, page('<input data-dd134="x"><input value="134">', {})), false);
	{
		const C134 = bodyOf('MOB.134_Work_Form_Fill.json', "Clear it as React sees a user's edit");
		const N134 = bodyOf('MOB.134_Work_Form_Fill.json', 'SAFETY NET (always)');
		{
			const w = page('<input data-dd134="target" value="134">', {}); let events = 0;
			w.document.querySelector('input').addEventListener('input', () => events++);
			check('134 clear - the tagged input is emptied and an input event fires', runJs(C134, w) && w.document.querySelector('input').value === '' && events === 1, true);
		}
		check('MUST FAIL: 134 clear - no tagged input', runJs(C134, page('<input value="134">', {})), false);
		const netPage = (stored) => { const w = page('', {}); w.__posts = []; w.fetch = (u, o) => { w.__posts.push(JSON.parse(o.body)); return { then() { return this; }, catch() { return this; } }; };
			if (stored) w.sessionStorage.setItem('__dd134_field', 'I1'); return w; };
		{
			const w = netPage(true); runJs(N134, w); runJs(N134, w);
			const p = w.__posts[0] || {};
			check('134 net - one mutation, the stored field set to null, not repeated', w.__posts.length === 1 && /updateWorkStageFormDetail/.test(p.query) && p.variables.id === 'I1' && p.variables.data.value === null, true);
		}
		{ const w = netPage(false); check('MUST FAIL: 134 net - nothing tagged: sends nothing', runJs(N134, w) && w.__posts.length === 0 ? false : true, false); }
	}
}

/* ===========================================================================================
 * MOB.399 - the Warranties tab's EMPTY state on MOB.302's work order (its asset has no warranty),
 * scoped to the ACTIVE panel; and the banner absent there.
 * ========================================================================================= */
{
	const empty = bodyOf('MOB.399_Work_Warranties.json', 'EMPTY STATE: the active Warranties panel');
	const noBanner = bodyOf('MOB.399_Work_Warranties.json', 'BANNER: absent on a work order with no warranty');
	const pg = (html) => { const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/work/RcdI0xcpc8NBV8VoRNNBYM' }).window; w.document.body.innerHTML = html; return w; };
	const tabs = (active) => ['Assets', 'Warranties'].map((n, i) => `<button role="tab"${n === active ? ' data-active="true"' : ''} aria-controls="p${i}">${n}</button>`).join('');
	const panels = (assets, warranties) => `<div role="tabpanel" id="p0">${assets}</div><div role="tabpanel" id="p1">${warranties}</div>`;
	const EMPTY = '<h4>Bypass Valve 0001</h4><p>No Warranties Found...</p>';
	console.log('\nMOB.399 - the Warranties empty state and the banner');
	check('399 empty - Bypass Valve 0001 with No Warranties Found... in the active panel', runJs(empty, pg(tabs('Warranties') + panels('', EMPTY))), true);
	check('MUST FAIL: 399 empty - warranty content renders too', runJs(empty, pg(tabs('Warranties') + panels('', EMPTY + '<p>Expiration Date</p>'))), false);
	check('MUST FAIL: 399 empty - the ACTIVE tab is Assets', runJs(empty, pg(tabs('Assets') + panels(EMPTY, EMPTY))), false);
	check('MUST FAIL: 399 empty - the empty text sits only in the inactive panel', runJs(empty, pg(tabs('Warranties') + panels(EMPTY, '<h4>Bypass Valve 0001</h4>'))), false);
	check('MUST FAIL: 399 empty - another asset', runJs(empty, pg(tabs('Warranties') + panels('', '<h4>Pump 0102</h4><p>No Warranties Found...</p>'))), false);
	check('399 banner - absent', runJs(noBanner, pg('<p>Status: READY</p>')), true);
	check('MUST FAIL: 399 banner - present', runJs(noBanner, pg('<div role="alert">Assets Related to the Work Order are under Warranty</div>')), false);
}

/* ===========================================================================================
 * MOB.385 (failure Edit Item save) + MOB.361 (job note edit + delete) - checklist #51/#52/#53.
 * DOM from FailureDetails.tsx / Failures/index.tsx (a table in a CollapsableSection Paper under an
 * asset Paper) and Notes.tsx (Paper > Group[name Text, Group[Pill, gear]] + Spoiler > rich text).
 * Server reads are server_read_js bodies, stubbed with a synchronous fetch.
 * ========================================================================================= */
{
	const F385 = 'MOB.385_Work_Failure_Edit_Save.json', F361 = 'MOB.361_Work_Note_Edit_Delete.json';
	const stepsOf = (f) => JSON.parse(fs.readFileSync(path.join(TESTS, f))).details.steps.filter(s => s.type === 'assertFromJavascript');
	const byName = (f, frag, nth = 0) => { const m = stepsOf(f).filter(s => s.name.includes(frag)); if (!m[nth]) throw new Error(`${f}: no JS step #${nth} matching "${frag}"`); return m[nth].params.code; };
	const sync = (v) => ({ then(f) { try { const r = f(v); return r && r.then ? r : sync(r); } catch (e) { return fail(e); } }, catch() { return this; } });
	const fail = (e) => ({ then() { return this; }, catch(f) { f(e); return sync(undefined); } });
	const W = 'https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q';
	const pg = (html, answer, stash = {}) => {
		const w = new JSDOM('<body></body>', { url: W }).window;
		w.document.body.innerHTML = html;
		for (const [k, v] of Object.entries(stash)) w.sessionStorage.setItem(k, v);
		w.__gear = [];
		w.document.querySelectorAll('[aria-label="Menu"]').forEach((g, i) => g.addEventListener('click', () => w.__gear.push(i)));
		w.document.querySelectorAll('[role="option"]').forEach(o => {
			Object.defineProperty(o, 'offsetParent', { get: () => (o.dataset.hid === '1' ? null : w.document.body) });
			o.addEventListener('click', () => { w.__picked = (w.__picked || []).concat(o.dataset.v + (o.dataset.hid === '1' ? ':hidden' : '')); });
		});
		w.fetch = () => sync({ json: () => sync(answer) });
		return w;
	};
	const twice = (body, w) => { runJs(body, w); return runJs(body, w); };

	// ---- MOB.385 ---------------------------------------------------------------------------
	const FID = 'YxYAgs5xtV5pQJFopUw5xN';
	const fcard = (rep, root = 'TIME', ft = 'BELT (R-L1)') => `<div class="mantine-Paper-root"><div class="mantine-Group-root"><button><span><p class="mantine-Text-root">  </p></span></button><button aria-label="Menu"></button></div>`
		+ `<div class="mantine-Collapse-root"><table><tbody><tr><td>Failure Type</td><td> ${ft} </td></tr><tr><td>Root Cause</td><td> ${root} </td></tr>`
		+ `<tr><td>Repair Type</td><td> ${rep} </td></tr><tr><td>Discovery Code</td><td>  </td></tr></tbody></table></div></div>`;
	const fasset = (name, ...cards) => `<div class="mantine-Paper-root"><p class="mantine-Text-root">${name}</p><div class="mantine-Box-root">${cards.join('')}</div></div>`;
	const premise = byName(F385, 'PREMISE: exactly one');
	const gearMissed = byName(F385, "card's gear — exactly one such card reading MISSED");
	const gearAny = stepsOf(F385).find(s => /card's gear — exactly one such card$/.test(s.name)).params.code;
	const prefill = byName(F385, 'opened PREFILLED from this card');
	const pickRepair = byName(F385, 'Pick REPAIR'), pickMissed = byName(F385, 'Pick MISSED');
	const holdsRepair = byName(F385, 'holds Repair Type REPAIR'), holdsMissed = byName(F385, 'holds Repair Type MISSED');
	const noCascade = byName(F385, 'no cascade cleared them');
	const armed385 = byName(F385, 'Submit is ARMED');
	const closed385 = byName(F385, 'The failure form is closed');
	const sPremise = byName(F385, 'PREMISE (server)'), sSaved = byName(F385, 'SERVER: the FIRST `Edit Item`'), sRestored = byName(F385, 'RESTORED (server)');
	const failure = (o = {}) => ({ id: FID, assetId: { name: 'Pump 0102' }, componentTypeId: null, failureTypeId: { name: 'BELT (R-L1)' }, repairTypeId: { name: 'MISSED' }, rootCauseTypeId: { name: 'TIME' }, discoveryCodeId: null, ...o });
	const fans = (...fs) => ({ data: { workStage: { failures: fs } } });
	console.log('\nMOB.385 - failure Edit Item save: the card, the prefill, the pick, the server reads');
	check('385 premise - one Pump 0102 BELT/MISSED/TIME card', runJs(premise, pg(fasset('Pump 0102', fcard('MISSED')))), true);
	check('MUST FAIL: 385 premise - the card reads REPAIR (a run died before its restore)', runJs(premise, pg(fasset('Pump 0102', fcard('REPAIR')))), false);
	check('MUST FAIL: 385 premise - two such cards', runJs(premise, pg(fasset('Pump 0102', fcard('MISSED'), fcard('MISSED')))), false);
	check('MUST FAIL: 385 premise - under another asset', runJs(premise, pg(fasset('Tank 0000', fcard('MISSED')))), false);
	{
		const w = pg(fasset('Pump 0102', fcard('ADJUST'), fcard('MISSED')));
		check('385 gear (edit) - clicks ONLY the MISSED card\'s gear, never MOB.391\'s ADJUST card', runJs(gearMissed, w) && w.__gear.join() === '1', true);
	}
	{
		const w = pg(fasset('Pump 0102', fcard('REPAIR')));
		check('MUST FAIL: 385 gear (edit) - the card reads REPAIR, and no gear is clicked', runJs(gearMissed, w) === false && w.__gear.length === 0, true);
	}
	{
		const w = pg(fasset('Pump 0102', fcard('REPAIR')));
		check('385 gear (restore) - finds the card while it reads REPAIR', runJs(gearAny, w) && w.__gear.join() === '0', true);
	}
	{
		const w = pg(fasset('Pump 0102', fcard('MISSED'), fcard('REPAIR')));
		check('MUST FAIL: 385 gear (restore) - two candidate cards, and no gear is clicked', runJs(gearAny, w) === false && w.__gear.length === 0, true);
	}
	{
		const w = pg(fasset('Pump 0102', fcard('ADJUST')));
		check('MUST FAIL: 385 gear (restore) - only MOB.391\'s ADJUST card, and no gear is clicked', runJs(gearAny, w) === false && w.__gear.length === 0, true);
	}
	const inputs = (ft, rep, root) => `<form id="work-failure-form"><input id="failureTypeId" value="${ft}"><input id="repairTypeId" value="${rep}"><input id="rootCauseTypeId" value="${root}"></form>`;
	check('385 prefill - BELT (R-L1) / MISSED / TIME', runJs(prefill, pg(inputs('BELT (R-L1)', 'MISSED', 'TIME'))), true);
	check('MUST FAIL: 385 prefill - an empty add form (no failure passed)', runJs(prefill, pg(inputs('', '', ''))), false);
	check('MUST FAIL: 385 prefill - repair already REPAIR', runJs(prefill, pg(inputs('BELT (R-L1)', 'REPAIR', 'TIME'))), false);
	const opt = (v, hid) => `<div role="option" data-v="${v}" data-hid="${hid ? 1 : 0}"><div class="custom-option"><div class="option-title">${v}</div><div class="option-description"></div></div></div>`;
	{
		const w = pg(opt('REPAIR', true) + opt('MISSED') + opt('REPLACE') + opt('REPAIR'));
		check('385 pick - the visible REPAIR, not its hidden twin nor REPLACE', runJs(pickRepair, w) && w.__picked.join() === 'REPAIR', true);
	}
	{
		const w = pg(opt('REPAIR', true) + opt('NOT LISTED'));
		check('MUST FAIL: 385 pick - REPAIR only in a closed dropdown, nothing clicked', runJs(pickRepair, w) === false && !w.__picked, true);
	}
	{
		const w = pg(opt('MISSED') + opt('MISSED'));
		check('MUST FAIL: 385 pick - two visible MISSED, nothing clicked', runJs(pickMissed, w) === false && !w.__picked, true);
	}
	check('385 pick MISSED - the one visible', runJs(pickMissed, pg(opt('MISSED') + opt('ADJUST'))), true);
	check('385 holds - #repairTypeId reads REPAIR', runJs(holdsRepair, pg(inputs('BELT (R-L1)', 'REPAIR', 'TIME'))), true);
	check('MUST FAIL: 385 holds - still MISSED', runJs(holdsRepair, pg(inputs('BELT (R-L1)', 'MISSED', 'TIME'))), false);
	check('385 holds MISSED', runJs(holdsMissed, pg(inputs('BELT (R-L1)', 'MISSED', 'TIME'))), true);
	check('MUST FAIL: 385 holds MISSED - reads REPAIR', runJs(holdsMissed, pg(inputs('BELT (R-L1)', 'REPAIR', 'TIME'))), false);
	check('385 no cascade - failure type and root cause kept', runJs(noCascade, pg(inputs('BELT (R-L1)', 'REPAIR', 'TIME'))), true);
	check('MUST FAIL: 385 no cascade - root cause cleared', runJs(noCascade, pg(inputs('BELT (R-L1)', 'REPAIR', ''))), false);
	check('385 armed - type="submit"', runJs(armed385, pg('<button form="work-failure-form" type="submit">Submit</button>')), true);
	check('MUST FAIL: 385 armed - type="button"', runJs(armed385, pg('<button form="work-failure-form" type="button">Submit</button>')), false);
	check('MUST FAIL: 385 armed - only the condition form is armed', runJs(armed385, pg('<button form="work-condition-form" type="submit">Submit</button>')), false);
	check('385 closed - no failure form', runJs(closed385, pg('<div></div>')), true);
	check('MUST FAIL: 385 closed - the form is still open', runJs(closed385, pg('<form id="work-failure-form"></form>')), false);
	check('385 server premise - one failure, MISSED', twice(sPremise, pg('', fans(failure()))), true);
	check('MUST FAIL: 385 server premise - it holds REPAIR', twice(sPremise, pg('', fans(failure({ repairTypeId: { name: 'REPAIR' } })))), false);
	check('MUST FAIL: 385 server premise - a second failure (MOB.391 leftover)', twice(sPremise, pg('', fans(failure(), failure({ id: 'X', repairTypeId: { name: 'ADJUST' } })))), false);
	check('MUST FAIL: 385 server premise - a discovery code is set', twice(sPremise, pg('', fans(failure({ discoveryCodeId: { id: 'd' } })))), false);
	check('385 server saved - the same id holds REPAIR', twice(sSaved, pg('', fans(failure({ repairTypeId: { name: 'REPAIR' } })))), true);
	check('MUST FAIL: 385 server saved - still MISSED (bugs §42: nothing sent)', twice(sSaved, pg('', fans(failure()))), false);
	check('MUST FAIL: 385 server saved - REPAIR on a DIFFERENT failure id', twice(sSaved, pg('', fans(failure({ id: 'OTHER', repairTypeId: { name: 'REPAIR' } })))), false);
	check('MUST FAIL: 385 server saved - REPAIR but root cause changed', twice(sSaved, pg('', fans(failure({ repairTypeId: { name: 'REPAIR' }, rootCauseTypeId: { name: 'DAMAGE' } })))), false);
	check('MUST FAIL: 385 server saved - GraphQL errors', twice(sSaved, pg('', { errors: [{ message: 'nope' }] })), false);
	check('385 server restored - MISSED again', twice(sRestored, pg('', fans(failure()))), true);
	check('MUST FAIL: 385 server restored - still REPAIR', twice(sRestored, pg('', fans(failure({ repairTypeId: { name: 'REPAIR' } })))), false);

	// ---- MOB.361 ---------------------------------------------------------------------------
	const KB = '__dd361_before', KI = '__dd361_id';
	const clear361 = byName(F361, 'Clear this test');
	const nPremise = byName(F361, 'PREMISE (server)'), nAdded = byName(F361, 'SERVER: exactly ONE note');
	const nEdited = byName(F361, "SERVER: the run's note"), nGone = byName(F361, 'SERVER: no note carries');
	const armed361 = byName(F361, 'Submit is ARMED');
	const gearEdit = byName(F361, 'Open the gear of the ONE card'), guardDel = byName(F361, 'GUARD + open its gear');
	const edPrefill = byName(F361, 'editor opened PREFILLED'), edEdited = byName(F361, 'editor now reads');
	const note = (text, name = 'New Note 2026-09-15 10:00') => `<div class="mantine-Paper-root"><div class="mantine-Group-root"><p class="mantine-Text-root">${name}</p><div class="mantine-Group-root"><div class="mantine-Pill-root">Mobile Note</div><button aria-label="Menu"></button></div></div>`
		+ `<div class="mantine-Spoiler-root"><div class="mantine-Spoiler-content"><div class="rich-text-display"><p>${text}</p></div></div><button>Show more</button></div></div>`;
	const R392 = 'This is a note - DD SYNTHETIC MOBILE', MINE = 'DD SYNTHETIC MOBILE 361 NOTE 48120735', EDITED = 'DD SYNTHETIC MOBILE 361 EDITED 48120735';
	const notesTab = (active, inactive = '') => '<button role="tab" aria-controls="p0">Assets</button><button role="tab" data-active="true" aria-controls="p1">Notes</button>'
		+ `<div role="tabpanel" id="p0" style="display: none;">${inactive}</div><div role="tabpanel" id="p1"><button>Add</button>${active}</div>`;
	const BEFORE = JSON.stringify(['A', 'B', 'C']);
	const nn = (id, desc) => ({ id, desc: `<p>${desc}</p>` });
	const nans = (...ns) => ({ data: { workStage: { jobNotes: ns } } });
	const REST = [nn('B', R392), nn('A', R392), nn('C', R392)];
	console.log('\nMOB.361 - job note edit + delete: the premise licence, the guarded gear, the server reads');
	{
		const w = pg('', null, { [KB]: BEFORE, [KI]: 'N1' });
		check('361 clear - both keys removed', runJs(clear361, w) && w.sessionStorage.getItem(KB) === null && w.sessionStorage.getItem(KI) === null, true);
	}
	{
		const w = pg('', nans(...REST));
		check('361 server premise - no marker note: the sorted ids are stored', twice(nPremise, w) && w.sessionStorage.getItem(KB) === BEFORE, true);
	}
	{
		const w = pg('', nans(...REST, nn('L', 'DD SYNTHETIC MOBILE 361 NOTE 11112222')));
		check('MUST FAIL: 361 server premise - a leftover marker note, and NO licence is stored', twice(nPremise, w) === false && w.sessionStorage.getItem(KB) === null, true);
	}
	{
		const w = pg('', nans(...REST, nn('N1', MINE)), { [KB]: BEFORE });
		check('361 server added - one new marker note with 8 digits: its id stored', twice(nAdded, w) && w.sessionStorage.getItem(KI) === 'N1', true);
	}
	check('MUST FAIL: 361 server added - nothing added', twice(nAdded, pg('', nans(...REST), { [KB]: BEFORE })), false);
	check('MUST FAIL: 361 server added - RUNID never expanded (literal braces)', twice(nAdded, pg('', nans(...REST, nn('N1', 'DD SYNTHETIC MOBILE 361 NOTE {{ RUNID }}')), { [KB]: BEFORE })), false);
	check('MUST FAIL: 361 server added - the marker note pre-dated the run (its id is in the baseline)', twice(nAdded, pg('', nans(nn('A', MINE), nn('B', R392), nn('C', R392), nn('D', R392)), { [KB]: BEFORE })), false);
	check('MUST FAIL: 361 server added - two marker notes', twice(nAdded, pg('', nans(...REST, nn('N1', MINE), nn('N2', MINE)), { [KB]: BEFORE })), false);
	check('MUST FAIL: 361 server added - no premise licence', twice(nAdded, pg('', nans(...REST, nn('N1', MINE)))), false);
	check('MUST FAIL: 361 server added - MOB.392\'s text only', twice(nAdded, pg('', nans(...REST, nn('N1', R392)), { [KB]: BEFORE })), false);
	check('361 server edited - the stored id holds EDITED', twice(nEdited, pg('', nans(...REST, nn('N1', EDITED)), { [KB]: BEFORE, [KI]: 'N1' })), true);
	check('MUST FAIL: 361 server edited - still NOTE (the edit never saved)', twice(nEdited, pg('', nans(...REST, nn('N1', MINE)), { [KB]: BEFORE, [KI]: 'N1' })), false);
	check('MUST FAIL: 361 server edited - EDITED appended to NOTE (select-all failed)', twice(nEdited, pg('', nans(...REST, nn('N1', MINE + EDITED)), { [KB]: BEFORE, [KI]: 'N1' })), false);
	check('MUST FAIL: 361 server edited - EDITED on a different id', twice(nEdited, pg('', nans(...REST, nn('N9', EDITED)), { [KB]: BEFORE, [KI]: 'N1' })), false);
	check('MUST FAIL: 361 server edited - no stored id', twice(nEdited, pg('', nans(...REST, nn('N1', EDITED)), { [KB]: BEFORE })), false);
	check('361 server gone - exactly the baseline ids, no marker', twice(nGone, pg('', nans(...REST), { [KB]: BEFORE })), true);
	check('MUST FAIL: 361 server gone - the marker note is still there (the cache said gone)', twice(nGone, pg('', nans(...REST, nn('N1', EDITED)), { [KB]: BEFORE })), false);
	check('MUST FAIL: 361 server gone - ANOTHER note was deleted too', twice(nGone, pg('', nans(nn('A', R392), nn('B', R392)), { [KB]: BEFORE })), false);
	check('MUST FAIL: 361 server gone - a different note replaced one', twice(nGone, pg('', nans(nn('A', R392), nn('B', R392), nn('Z', R392)), { [KB]: BEFORE })), false);
	check('MUST FAIL: 361 server gone - no baseline', twice(nGone, pg('', nans(...REST))), false);
	check('361 armed - type="submit"', runJs(armed361, pg('<button form="work-collection-form" type="submit">Submit</button>')), true);
	check('MUST FAIL: 361 armed - type="button" (not valid AND dirty)', runJs(armed361, pg('<button form="work-collection-form" type="button">Submit</button>')), false);
	for (const [label, body] of [['edit gear', gearEdit], ['delete guard', guardDel]]) {
		{
			const w = pg(notesTab(note(R392) + note(MINE) + note(R392)), null, { [KB]: BEFORE });
			check(`361 ${label} - licence set, one marker card: ONLY its gear clicked`, runJs(body, w) && w.__gear.join() === '1', true);
		}
		{
			const w = pg(notesTab(note(R392) + note(EDITED)), null, { [KB]: BEFORE });
			check(`361 ${label} - the EDITED marker card also counts as this run's`, runJs(body, w) && w.__gear.join() === '1', true);
		}
		for (const [why, html, stash] of [
			['no premise licence (a leftover stopped the premise)', notesTab(note(MINE)), {}],
			['two marker cards', notesTab(note(MINE) + note(EDITED)), { [KB]: BEFORE }],
			['only MOB.392\'s residue notes', notesTab(note(R392) + note(R392)), { [KB]: BEFORE }],
			['the marker card only in the INACTIVE panel', notesTab(note(R392), note(MINE)), { [KB]: BEFORE }],
		]) {
			const w = pg(html, null, stash);
			check(`MUST FAIL: 361 ${label} - ${why}, and NO gear is clicked`, runJs(body, w) === false && w.__gear.length === 0, true);
		}
	}
	const modal = (text, n = 1) => '<div class="mantine-Modal-content"><form id="work-collection-form">' + `<div class="ProseMirror" contenteditable="true"><p>${text}</p></div>`.repeat(n) + '</form></div>';
	check('361 editor prefill - the modal editor holds the NOTE marker', runJs(edPrefill, pg(modal(MINE))), true);
	check('MUST FAIL: 361 editor prefill - an empty editor (the add form, not the edit)', runJs(edPrefill, pg(modal(''))), false);
	check('MUST FAIL: 361 editor prefill - MOB.392\'s note', runJs(edPrefill, pg(modal(R392))), false);
	check('MUST FAIL: 361 editor prefill - two editors', runJs(edPrefill, pg(modal(MINE, 2))), false);
	check('MUST FAIL: 361 editor prefill - the marker only outside a modal', runJs(edPrefill, pg(`<div contenteditable="true"><p>${MINE}</p></div>`)), false);
	check('361 editor edited - reads EDITED only', runJs(edEdited, pg(modal(EDITED))), true);
	check('MUST FAIL: 361 editor edited - EDITED appended after NOTE', runJs(edEdited, pg(modal(MINE + EDITED))), false);
	check('MUST FAIL: 361 editor edited - unchanged', runJs(edEdited, pg(modal(MINE))), false);
}

/* ===========================================================================================
 * MOB.712 / MOB.722 - Asset Lookup writes on a `DD SYNTHETIC MOBILE` row (checklist #61, #62): the
 * throwaway-asset guard, MOB.712's `System` column tick/untick (localStorage), its `+ Create` option
 * and two /graphql predicates; MOB.722's ENSURE picker chain, the tagged reading input, the armed
 * Submit and its /graphql predicate. Own runner: the shared `runJs` does not pass `localStorage`.
 * ========================================================================================= */
if (!fs.existsSync(path.join(TESTS, 'MOB.712_AssetLookup_System_Create.json'))
	|| !fs.existsSync(path.join(TESTS, 'MOB.722_AssetLookup_Reading_Capture.json'))) {
	console.log('\nMOB.712/722 - SKIPPED: not built yet');
} else {
	const F712 = 'MOB.712_AssetLookup_System_Create.json', F722 = 'MOB.722_AssetLookup_Reading_Capture.json';
	const run7 = (code, w) => new Function('document', 'sessionStorage', 'localStorage', 'window', 'location', 'navigator',
		`return (function(){${code}})()`)(w.document, w.sessionStorage, w.localStorage, w, w.location, w.navigator);
	const twice7 = (body, w) => { run7(body, w); return run7(body, w); };
	const sync7 = (v) => ({ then(f) { const r = f(v); return r && r.then ? r : sync7(r); }, catch() { return this; } });
	const pg7 = (html, answer, ss = {}, ls = {}) => {
		const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/asset-lookup' }).window;
		w.document.body.innerHTML = html;
		if (answer !== undefined) w.fetch = () => sync7({ json: () => sync7(answer) });
		Object.entries(ss).forEach(([k, v]) => w.sessionStorage.setItem(k, v));
		Object.entries(ls).forEach(([k, v]) => w.localStorage.setItem(k, v));
		return w;
	};
	const A = 'DD SYNTHETIC MOBILE 13783628', N = 'DD SYNTHETIC MOBILE 71248120';
	const item = (name, inner = '', { expanded = true, desc = 'Created by Datadog Synthetics - safe to delete', nameCell = name } = {}) =>
		`<div class="mantine-Accordion-item"><button class="mantine-Accordion-control" aria-expanded="${expanded}"><p>${name}</p><p>${desc}</p></button>`
		+ `<div class="mantine-Accordion-panel"><table><tbody><tr><td><span><b>Name</b></span></td><td>${nameCell}</td></tr>`
		+ `<tr><td><span><b>Description</b></span></td><td>${desc}</td></tr></tbody></table>${inner}</div></div>`;

	console.log('\nMOB.712 - create a System: guard, column tick, + Create, server reads, restore');
	{
		const guard = bodyOf(F712, 'FIXTURE GUARD');
		{ const w = pg7(item(A)); check('712 guard - a marker row with an 8-digit name: stored', run7(guard, w) && w.sessionStorage.getItem('__dd712_asset') === A, true); }
		{ const w = pg7(item('Pump 0102', '', { desc: 'x' }) + item(A)); check('712 guard - a fixture row first, the marker row after it: the marker row', run7(guard, w) && w.sessionStorage.getItem('__dd712_asset') === A, true); }
		{ const w = pg7(item('Pump 0102', '', { desc: 'DD SYNTHETIC MOBILE in a desc' })); check('MUST FAIL: 712 guard - a FIXTURE whose desc carries the marker, and nothing stored', run7(guard, w) === false && w.sessionStorage.getItem('__dd712_asset') === null, true); }
		check('MUST FAIL: 712 guard - RUNID never expanded in the name', run7(guard, pg7(item('DD SYNTHETIC MOBILE {{ RUNID }}'))), false);
		check('MUST FAIL: 712 guard - a 4-digit suffix', run7(guard, pg7(item('DD SYNTHETIC MOBILE 1234'))), false);
		check('MUST FAIL: 712 guard - no marker row at all', run7(guard, pg7(item('Pump 0102', '', { desc: 'x' }))), false);

		const cols = bodyOf(F712, 'BEFORE: record the General Info column selection');
		const DEF = '{"name":true,"desc":true,"typeId":true,"tagId":true}';
		{ const w = pg7('', undefined, {}, { _assetlookup_generalinfo_cols_: DEF }); check('712 cols - the stored selection is recorded', run7(cols, w) && w.sessionStorage.getItem('__dd712_cols') === DEF, true); }
		check('MUST FAIL: 712 cols - no stored selection (the table never mounted)', run7(cols, pg7('')), false);
		check('MUST FAIL: 712 cols - unparseable JSON', run7(cols, pg7('', undefined, {}, { _assetlookup_generalinfo_cols_: '{bad' })), false);

		const tick = bodyOf(F712, 'Tick `System` in the picker');
		const untick = bodyOf(F712, 'RESTORE: untick `System`');
		const cb = (label, checked) => `<div class="mantine-Checkbox-root"><input type="checkbox" class="mantine-Checkbox-input"${checked ? ' checked' : ''}><label class="mantine-Checkbox-label">${label}</label></div>`;
		const menu = (...boxes) => `<div class="mantine-Menu-dropdown"><input placeholder="Find Column(s)">${boxes.join('')}</div>`;
		const clicks = (w) => { let n = 0; w.document.querySelectorAll('input[type=checkbox]').forEach(b => b.addEventListener('click', () => n++)); return () => n; };
		{ const w = pg7(menu(cb('Name', true), cb('System', false), cb('System Type', false))); const n = clicks(w);
			check('712 tick - unchecked: clicked ONCE across two polls, now checked', twice7(tick, w) && n() === 1, true); }
		{ const w = pg7(menu(cb('System', true))); const n = clicks(w); check('712 tick - already checked (a died run): passes, no click', run7(tick, w) && n() === 0, true); }
		{ const w = pg7(menu(cb('System', false))); w.document.querySelector('input[type=checkbox]').addEventListener('click', e => e.preventDefault()); const n = clicks(w);
			check('MUST FAIL: 712 tick - the click did not take, and no second click on the next poll', twice7(tick, w) === false && n() === 1, true); }
		{ const w = pg7(menu(cb('System', false), cb('System', false))); const n = clicks(w); check('MUST FAIL: 712 tick - two `System` boxes, none clicked', run7(tick, w) === false && n() === 0, true); }
		check('MUST FAIL: 712 tick - only `System Type` (a substring label)', run7(tick, pg7(menu(cb('System Type', false)))), false);
		check('MUST FAIL: 712 tick - a `System` box outside the open menu', run7(tick, pg7(cb('System', false))), false);
		{ const w = pg7(menu(cb('System', true))); const n = clicks(w); check('712 untick - checked: clicked ONCE, now unchecked', twice7(untick, w) && n() === 1, true); }
		{ const w = pg7(menu(cb('System', false))); const n = clicks(w); check('712 untick - already unchecked: passes, no click', run7(untick, w) && n() === 0, true); }
		check('MUST FAIL: 712 untick - no picker open', run7(untick, pg7(cb('System', true))), false);

		const holds = bodyOf(F712, 'The lookup holds');
		const modal = (v) => `<div class="mantine-Modal-content"><input id="systemId" value="${v}"></div>`;
		{ const w = pg7(modal(N)); check('712 holds - the modal lookup holds the marker + 8 digits: stored', run7(holds, w) && w.sessionStorage.getItem('__dd712_system') === N, true); }
		check('MUST FAIL: 712 holds - RUNID never expanded', run7(holds, pg7(modal('DD SYNTHETIC MOBILE {{ RUNID }}'))), false);
		check('MUST FAIL: 712 holds - appended to the old System (select-all failed)', run7(holds, pg7(modal('DD SYNTHETIC MOBILE 11112222' + N))), false);
		check('MUST FAIL: 712 holds - `#systemId` only outside a modal', run7(holds, pg7(`<input id="systemId" value="${N}">`)), false);

		const offer = bodyOf(F712, 'offers exactly ONE option');
		const opt = (t) => `<div role="option">${t}</div>`;
		const S = { __dd712_system: N };
		check("712 offer - `+ Create '<name>'` above the existing Systems", run7(offer, pg7(opt(`+ Create '${N}'`) + opt('Main System'), undefined, S)), true);
		check('MUST FAIL: 712 offer - no create option (the name matched an existing System)', run7(offer, pg7(opt(N), undefined, S)), false);
		check('MUST FAIL: 712 offer - the create option names other text (a stale input)', run7(offer, pg7(opt("+ Create 'DD SYNTHETIC MOBILE'"), undefined, S)), false);
		check('MUST FAIL: 712 offer - two create options', run7(offer, pg7(opt(`+ Create '${N}'`) + opt(`+ Create '${N}'`), undefined, S)), false);
		check('MUST FAIL: 712 offer - nothing recorded', run7(offer, pg7(opt(`+ Create '${N}'`))), false);

		const gone = bodyOf(F712, "System lookup's modal is gone");
		check('712 closed - no lookup modal, the row still expanded', run7(gone, pg7(item(A))), true);
		check('MUST FAIL: 712 closed - the lookup modal is still open', run7(gone, pg7(item(A) + modal(N))), false);
		check('MUST FAIL: 712 closed - a blank page (no row)', run7(gone, pg7('')), false);
		const left = bodyOf(F712, 'No System lookup modal is left open');
		check('712 left open - none, and the row is there', run7(left, pg7(item(A))), true);
		check('MUST FAIL: 712 left open - a blank page', run7(left, pg7('')), false);
		check('MUST FAIL: 712 left open - the modal is still up', run7(left, pg7(item(A) + modal(N))), false);

		const srvSys = bodyOf(F712, 'SERVER: exactly ONE System');
		const srvAsset = bodyOf(F712, 'SERVER: the asset');
		const SS = { __dd712_system: N, __dd712_asset: A };
		const sys = (...s) => s.map(([id, name]) => ({ id, name }));
		const ans = (assets, systems) => ({ data: { assets: { edges: assets }, systems: { edges: systems } } });
		check('712 server system - exactly one with the typed name', twice7(srvSys, pg7('', ans([], sys(['S1', N], ['S0', 'DD SYNTHETIC MOBILE 11112222'])), SS)), true);
		check('MUST FAIL: 712 server system - none (CREATE_SYSTEM never landed)', twice7(srvSys, pg7('', ans([], sys(['S0', 'Main'])), SS)), false);
		check('MUST FAIL: 712 server system - two with the name (created twice)', twice7(srvSys, pg7('', ans([], sys(['S1', N], ['S2', N])), SS)), false);
		check('MUST FAIL: 712 server system - nothing recorded', twice7(srvSys, pg7('', ans([], sys(['S1', N])))), false);
		check('MUST FAIL: 712 server system - a GraphQL error answer', twice7(srvSys, pg7('', { errors: [{ message: 'x' }] }, SS)), false);
		const as = (name, systemId) => ({ id: 'A-' + name, name, systemId });
		check('712 server asset - its systemId is that System by id and name', twice7(srvAsset, pg7('', ans([as(A, { id: 'S1', name: N }), as('DD SYNTHETIC MOBILE 43398722', null)], sys(['S1', N])), SS)), true);
		check('MUST FAIL: 712 server asset - systemId still null (UPDATE_ASSET never landed)', twice7(srvAsset, pg7('', ans([as(A, null)], sys(['S1', N])), SS)), false);
		check('MUST FAIL: 712 server asset - linked to ANOTHER System of the same name', twice7(srvAsset, pg7('', ans([as(A, { id: 'S9', name: N })], sys(['S1', N])), SS)), false);
		check('MUST FAIL: 712 server asset - a different marker asset holds it', twice7(srvAsset, pg7('', ans([as(A, null), as('DD SYNTHETIC MOBILE 43398722', { id: 'S1', name: N })], sys(['S1', N])), SS)), false);
		check('MUST FAIL: 712 server asset - the System is missing from the systems list', twice7(srvAsset, pg7('', ans([as(A, { id: 'S1', name: N })], []), SS)), false);
		check('MUST FAIL: 712 server asset - no asset recorded', twice7(srvAsset, pg7('', ans([as(A, { id: 'S1', name: N })], sys(['S1', N])), { __dd712_system: N })), false);

		const restored = bodyOf(F712, 'RESTORED: localStorage no longer shows');
		const L = (cur, before = DEF) => pg7('', undefined, before ? { __dd712_cols: before } : {}, cur ? { _assetlookup_generalinfo_cols_: cur } : {});
		check('712 restored - systemId false, the rest as recorded', run7(restored, L('{"name":true,"desc":true,"typeId":true,"tagId":true,"systemId":false}')), true);
		check('712 restored - systemId absent, the rest as recorded', run7(restored, L(DEF)), true);
		check('712 restored - nothing recorded (a run died early): systemId not shown is enough', run7(restored, L('{"name":true,"systemId":false}', null)), true);
		check('MUST FAIL: 712 restored - systemId still shown', run7(restored, L('{"name":true,"desc":true,"typeId":true,"tagId":true,"systemId":true}')), false);
		check('MUST FAIL: 712 restored - Description was unticked too', run7(restored, L('{"name":true,"desc":false,"typeId":true,"tagId":true,"systemId":false}')), false);
		check('MUST FAIL: 712 restored - another column was ticked', run7(restored, L('{"name":true,"desc":true,"typeId":true,"tagId":true,"address":true}')), false);
		check('MUST FAIL: 712 restored - no stored selection at all', run7(restored, L(null)), false);

		const collapsed = bodyOf(F712, 'RESTORED: the row reports itself collapsed');
		check('712 collapsed - aria-expanded false', run7(collapsed, pg7(item(A, '', { expanded: false }))), true);
		check('MUST FAIL: 712 collapsed - still expanded', run7(collapsed, pg7(item(A))), false);
		const clean = bodyOf(F712, 'CLEANUP: remove this test');
		{ const w = pg7('', undefined, { __dd712_asset: A, __dd712_system: N, __dd712_cols: DEF, asset_lookup_query: 'DD SYNTHETIC MOBILE' });
			check('712 cleanup - its keys and the persisted search are removed', run7(clean, w) && ['__dd712_asset', '__dd712_system', '__dd712_cols', 'asset_lookup_query'].every(k => w.sessionStorage.getItem(k) === null), true); }
	}

	console.log('\nMOB.722 - capture a reading: guard, ENSURE chain, tagged input, armed Submit, server read');
	{
		const guard = bodyOf(F722, 'FIXTURE GUARD');
		{ const w = pg7(item(A)); check('722 guard - a marker row: stored', run7(guard, w) && w.sessionStorage.getItem('__dd722_asset') === A, true); }
		check('MUST FAIL: 722 guard - a fixture whose desc carries the marker', run7(guard, pg7(item('Pump 0102', '', { desc: 'DD SYNTHETIC MOBILE' }))), false);
		check('MUST FAIL: 722 guard - no Name cell (the General Info table is not rendered)', run7(guard, pg7(`<div class="mantine-Accordion-item"><button class="mantine-Accordion-control">${A}</button></div>`)), false);

		const field = (type, prev = '', val = '') => `<div class="mantine-Box-root"><div class="mantine-Group-root"><p class="mantine-Text-root">${type}</p>`
			+ (prev ? `<div class="mantine-Group-root"><p class="mantine-Text-root">${prev}</p><p class="mantine-Text-root">09/15/2026 1:48 PM</p></div>` : '')
			+ `</div><div class="mantine-InputWrapper-root mantine-NumberInput-root"><div class="mantine-Input-wrapper"><input name="id-${type}" placeholder="Enter reading" value="${val}"></div></div></div>`;
		const panel = (fields, { add = '<button aria-label="Add reading types"></button>', submit = 'button', name = A } = {}) =>
			item(name, `<div role="tabpanel"><div class="mantine-Paper-root"><div class="mantine-Group-root">${add}</div>`
				+ `<form id="asset-lookup-readings-X"><div class="mantine-Stack-root">${fields}</div></form>`
				+ `<button form="asset-lookup-readings-X" type="${submit}">Submit</button></div></div>`);
		const picker = (pills = '', addDisabled = true) => '<div class="mantine-Modal-content"><div class="mantine-Paper-root"><p>Add Reading Types</p>'
			+ `<div>${pills}<input placeholder="Search reading types"></div><button${addDisabled ? ' disabled' : ''}>Add</button></div></div>`;
		const pill = (t) => `<div class="mantine-Pill-root"><span class="mantine-Pill-label">${t}</span></div>`;
		const opt = (t) => `<div role="option">${t}</div>`;
		const counter = (w, sel) => { let n = 0; w.document.querySelectorAll(sel).forEach(e => e.addEventListener('click', () => n++)); return () => n; };

		const e1 = bodyOf(F722, 'ENSURE 1/3');
		{ const w = pg7(panel(field('psi') + field('Test 1'))); const n = counter(w, '[aria-label="Add reading types"]'); check('722 ensure1 - the field exists: true, no click', run7(e1, w) && n() === 0, true); }
		{ const w = pg7(panel(field('psi')) + picker()); check('722 ensure1 - the picker is already open: true', run7(e1, w), true); }
		{ const w = pg7(panel('')); const n = counter(w, '[aria-label="Add reading types"]'); check('722 ensure1 - no field: `Add reading types` clicked ONCE across polls, still false', twice7(e1, w) === false && n() === 1, true); }
		{ const w = pg7(panel('', { add: '<button aria-label="Add reading types" data-loading="true" disabled></button>' })); const n = counter(w, '[aria-label="Add reading types"]');
			check('MUST FAIL: 722 ensure1 - the button is loading: no click', run7(e1, w) === false && n() === 0, true); }
		check('MUST FAIL: 722 ensure1 - only a `Test 10` field (label is exact), no button', run7(e1, pg7(panel(field('Test 10'), { add: '' }))), false);
		check('MUST FAIL: 722 ensure1 - `Test 1` only on ANOTHER row, no button on the marker row', run7(e1, pg7(panel(field('Test 1'), { name: 'Pump 0102', add: '' }).replace('Created by Datadog Synthetics - safe to delete', 'x') + panel('', { add: '' }))), false);

		const e2 = bodyOf(F722, 'ENSURE 2/3');
		check('722 ensure2 - the field exists: true', run7(e2, pg7(panel(field('Test 1')))), true);
		check('722 ensure2 - the picker holds a `Test 1` pill: true', run7(e2, pg7(panel('') + picker(pill('Test 1')))), true);
		{ const w = pg7(panel('') + picker() + opt('psi') + opt('Test 1')); const n = counter(w, '[role="option"]'); check('722 ensure2 - one `Test 1` option: clicked, false until the pill shows', run7(e2, w) === false && n() === 1, true); }
		{ const w = pg7(panel('') + picker() + opt('Test 1') + opt('Test 1')); const n = counter(w, '[role="option"]'); check('MUST FAIL: 722 ensure2 - two `Test 1` options: none clicked', run7(e2, w) === false && n() === 0, true); }
		check('MUST FAIL: 722 ensure2 - only a `Test 10` pill', run7(e2, pg7(panel('') + picker(pill('Test 10')))), false);
		check('MUST FAIL: 722 ensure2 - no field and no picker', run7(e2, pg7(panel(''))), false);

		const e3 = bodyOf(F722, 'ENSURE 3/3');
		{ const w = pg7(panel(field('psi') + field('Test 1')) + '<input data-dd722="reading" id="stale">');
			const tagged = () => [...w.document.querySelectorAll('[data-dd722]')];
			check('722 ensure3 - the field exists: ITS input is the only one tagged', run7(e3, w) && tagged().length === 1 && tagged()[0].name === 'id-Test 1', true); }
		{ const w = pg7(panel('') + picker(pill('Test 1'), false)); const n = counter(w, '.mantine-Modal-content button');
			check('722 ensure3 - picker with `Add` enabled: clicked ONCE across polls, false until the field shows', twice7(e3, w) === false && n() === 1, true); }
		{ const w = pg7(panel('') + picker('', true)); const n = counter(w, '.mantine-Modal-content button'); check('MUST FAIL: 722 ensure3 - `Add` disabled: no click', run7(e3, w) === false && n() === 0, true); }
		{ const w = pg7(panel(field('Test 10'))); check('MUST FAIL: 722 ensure3 - only `Test 10`, no picker: nothing tagged', run7(e3, w) === false && !w.document.querySelector('[data-dd722]'), true); }

		const holds = bodyOf(F722, 'The input holds `722`');
		const tagged = (v) => `<input data-dd722="reading" value="${v}">`;
		{ const w = pg7(tagged('72248120')); check('722 value - 722 + 5 digits: stored', run7(holds, w) && w.sessionStorage.getItem('__dd722_value') === '72248120', true); }
		check('MUST FAIL: 722 value - RUNID never expanded', run7(holds, pg7(tagged('722{{ RUNID }}'))), false);
		check('MUST FAIL: 722 value - the 722 prefix lost', run7(holds, pg7(tagged('48120'))), false);
		check('MUST FAIL: 722 value - typed twice (appended)', run7(holds, pg7(tagged('7224812072248120'))), false);
		check('MUST FAIL: 722 value - only an untagged input holds it', run7(holds, pg7('<input value="72248120">')), false);

		const armed = bodyOf(F722, 'Submit is ARMED');
		check('722 armed - the row\'s form button is type=submit', run7(armed, pg7(panel(field('Test 1'), { submit: 'submit' }))), true);
		check('MUST FAIL: 722 armed - type=button (filledInputs not recounted)', run7(armed, pg7(panel(field('Test 1')))), false);
		check('MUST FAIL: 722 armed - armed only on a non-marker row', run7(armed, pg7(panel(field('Test 1'), { submit: 'submit', name: 'Pump 0102' }).replace('Created by Datadog Synthetics - safe to delete', 'x') + panel(field('Test 1')))), false);

		const srv = bodyOf(F722, 'SERVER: the asset');
		const VS = { __dd722_asset: A, __dd722_value: '72248120' };
		const rd = (type, reading) => ({ id: 'E' + reading, reading, readingDate: '2026-09-15T20:48:00Z', readingType: { id: 'T-' + type, name: type } });
		const ra = (...edges) => ({ data: { assets: { edges: edges.map(([name, readings]) => ({ id: 'A-' + name, name, latestReadings: readings })) } } });
		check('722 server - the asset\'s latest Test 1 is the typed value', twice7(srv, pg7('', ra([A, [rd('psi', 5), rd('Test 1', 72248120)]], ['DD SYNTHETIC MOBILE 43398722', []]), VS)), true);
		check('MUST FAIL: 722 server - latest Test 1 is an older run\'s value', twice7(srv, pg7('', ra([A, [rd('Test 1', 72211111)]]), VS)), false);
		check('MUST FAIL: 722 server - no readings at all (CREATE_EVENT never landed)', twice7(srv, pg7('', ra([A, []]), VS)), false);
		check('MUST FAIL: 722 server - the value under `Test 10`', twice7(srv, pg7('', ra([A, [rd('Test 10', 72248120)]]), VS)), false);
		check('MUST FAIL: 722 server - the value on ANOTHER marker asset', twice7(srv, pg7('', ra([A, []], ['DD SYNTHETIC MOBILE 43398722', [rd('Test 1', 72248120)]]), VS)), false);
		check('MUST FAIL: 722 server - nothing recorded', twice7(srv, pg7('', ra([A, [rd('Test 1', 72248120)]]))), false);
		check('MUST FAIL: 722 server - a GraphQL error answer', twice7(srv, pg7('', { errors: [{ message: 'x' }] }, VS)), false);

		const prev = bodyOf(F722, 'now renders that value as its previous entry');
		const V = { __dd722_value: '72248120' };
		check('722 previous - the field renders the value beside its date', run7(prev, pg7(panel(field('Test 1', '72248120')), undefined, V)), true);
		check('MUST FAIL: 722 previous - an older value rendered', run7(prev, pg7(panel(field('Test 1', '72211111')), undefined, V)), false);
		check('MUST FAIL: 722 previous - the value only typed in the input, not rendered', run7(prev, pg7(panel(field('Test 1', '', '72248120')), undefined, V)), false);
		check('MUST FAIL: 722 previous - on another type\'s field', run7(prev, pg7(panel(field('psi', '72248120') + field('Test 1')), undefined, V)), false);

		const clean = bodyOf(F722, 'CLEANUP: remove this test');
		{ const w = pg7(tagged('1'), undefined, { __dd722_asset: A, __dd722_value: '72248120', asset_lookup_query: 'DD SYNTHETIC MOBILE' });
			check('722 cleanup - keys, persisted search and tag removed', run7(clean, w) && ['__dd722_asset', '__dd722_value', 'asset_lookup_query'].every(k => w.sessionStorage.getItem(k) === null) && !w.document.querySelector('[data-dd722]'), true); }
	}
}

/* ===========================================================================================
 * MOB.627 / MOB.628 - saved-photo writes (tags, avatar, delete) and the asset document add/delete,
 * on the collector's `DD SYNTHETIC MOBILE` row. DOM from AssetCollector/index.tsx (Accordion item >
 * control), AssetLookupDetails (Tabs), PhotoCarousel/index.tsx + PhotoMenu.tsx (slide > img + gear
 * aria-label=Settings + the `Edit Tags (n)` Badge), Tags/index.tsx + TagSearchCombobox.tsx (Modal >
 * PillsInput > Pill.root > Pill.label + Pill.remove; Combobox options role=option), and
 * DetailPage/Attachments.tsx AttachmentTable (table > tbody > tr > Checkbox input + Anchor
 * href=/api/attachment/<id>). Server reads are `dd_tools.server_read_js` against a stubbed fetch.
 * ========================================================================================= */
{
	const F627 = 'MOB.627_Collector_Saved_Photo_Writes.json';
	const F628 = 'MOB.628_Collector_Document_Add_Delete.json';
	const b7 = (n) => bodyOf(F627, n);
	const b8 = (n) => bodyOf(F628, n);
	const NAME = 'DD SYNTHETIC MOBILE 43398722';
	const sync = (v) => ({ then(f) { try { const r = f(v); return r && r.then ? r : sync(r); } catch (e) { return sync(undefined); } }, catch() { return this; } });
	// `answer` is the GraphQL body the stubbed /graphql returns; `ss` pre-fills sessionStorage.
	const win = (html = '', { answer = {}, ss = {} } = {}) => {
		const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/asset-collector' }).window;
		w.document.body.innerHTML = html;
		w.fetch = () => sync({ json: () => sync(answer) });
		for (const [k, v] of Object.entries(ss)) w.sessionStorage.setItem(k, v);
		return w;
	};
	const twice = (body, w) => { runJs(body, w); return runJs(body, w); };
	const control = (name = NAME, expanded = 'true') =>
		`<button class="mantine-Accordion-control" aria-expanded="${expanded}"><div class="mantine-Indicator-indicator">4</div>${name}Actuator Tools</button>`;
	const slide = (id, badge = 'Edit Tags (0)') =>
		`<div class="mantine-Carousel-slide"><div><img src="${id.startsWith('blob:') ? id : `/api/attachment/${id}?org=SMCT2`}">`
		+ `<button aria-label="Settings" data-slide="${id}"></button>`
		+ `<div class="mantine-Badge-root"><span class="mantine-Badge-label">${badge}</span></div></div></div>`;
	const row = (inner, name = NAME, expanded) =>
		`<div class="mantine-Accordion-item">${control(name, expanded)}<div class="mantine-Accordion-panel">${inner}</div></div>`;
	// a decoy row above ours (no marker) with its own slide + file input - scoping must skip it
	const decoy = `<div class="mantine-Accordion-item"><button class="mantine-Accordion-control">Pump 0102</button><div>${slide('DECOY')}</div></div>`;
	const edges = (atts, avatar = null, name = NAME) => ({ data: { assets: { edges: [{ id: 'A1', name, avatar, attachments: atts }] } } });
	const att = (id, tags = [], fileType = 'image/png', fileName = 'shot.png') => ({ id, fileName, fileType, tags });

	console.log('\nMOB.627 - saved-photo writes: stash, premise, upload id, tags, avatar, delete, cleanup');
	// ---- stash the row name
	{
		const S = b7("Stash the row's asset name");
		const w = win(decoy + row(''));
		check('627 name - the marker row\'s name + 8 digits is stashed (badge digits and type text around it)', runJs(S, w) && w.sessionStorage.getItem('__dd627_name') === NAME, true);
		check('MUST FAIL: 627 name - no marker row', runJs(S, win(decoy)), false);
		check('MUST FAIL: 627 name - marker without 8 digits', runJs(S, win(row('', 'DD SYNTHETIC MOBILE'))), false);
	}
	// ---- premise
	{
		const P = b7('PREMISE (server): exactly ONE asset');
		const w = win('', { answer: edges([att('X1'), att('X2')]), ss: { __dd627_name: NAME } });
		check('627 premise - one asset by name: BEFORE stashed', twice(P, w) && w.sessionStorage.getItem('__dd627_before') === '["X1","X2"]', true);
		const two = { data: { assets: { edges: [{ name: NAME, attachments: [] }, { name: NAME, attachments: [] }] } } };
		check('MUST FAIL: 627 premise - two assets share the name', twice(P, win('', { answer: two, ss: { __dd627_name: NAME } })), false);
		check('MUST FAIL: 627 premise - no stashed name', twice(P, win('', { answer: edges([]) })), false);
	}
	// ---- the upload's id off the last slide
	{
		const L = b7('UPLOAD LANDED: the last slide');
		const w = win(decoy + row(slide('OLD1') + slide('NEW1')));
		check('627 landed - the LAST slide\'s server URL id is stashed', runJs(L, w) && w.sessionStorage.getItem('__dd627_att') === 'NEW1', true);
		check('MUST FAIL: 627 landed - the last slide is still the blob: preview', runJs(L, win(row(slide('OLD1') + slide('blob:https://dev/1')))), false);
		check('MUST FAIL: 627 landed - no slide', runJs(L, win(row(''))), false);
	}
	const SS = { __dd627_name: NAME, __dd627_before: '["OLD1"]', __dd627_att: 'NEW1' };
	const srv = (fragment, answer, ss = SS) => twice(b7(fragment), win('', { answer, ss }));
	// ---- upload proof
	{
		const U = '⭐ SERVER: that id is the ONE new attachment';
		check('627 upload - NEW1 is the one new untagged image, OLD1 intact', srv(U, edges([att('OLD1'), att('NEW1')])), true);
		check('MUST FAIL: 627 upload - the stashed id was already there (in BEFORE)', srv(U, edges([att('OLD1'), att('NEW1')]), { ...SS, __dd627_att: 'OLD1' }), false);
		check('MUST FAIL: 627 upload - NEW1 absent', srv(U, edges([att('OLD1')])), false);
		check('MUST FAIL: 627 upload - an OLD attachment vanished', srv(U, edges([att('NEW1'), att('OTHER')])), false);
		check('MUST FAIL: 627 upload - two new attachments', srv(U, edges([att('OLD1'), att('NEW1'), att('NEW2')])), false);
		check('MUST FAIL: 627 upload - not an image', srv(U, edges([att('OLD1'), att('NEW1', [], 'application/pdf')])), false);
		check('MUST FAIL: 627 upload - already tagged', srv(U, edges([att('OLD1'), att('NEW1', [{ id: 't', name: 'Test Tag' }])])), false);
	}
	// ---- tag editor open
	{
		const O = b7("Open the tag editor from OUR slide's");
		const w = win(decoy + row(slide('OLD1') + slide('NEW1')), { ss: SS }); let hit = 0;
		const labels = w.document.querySelectorAll('.mantine-Badge-label');
		labels[labels.length - 1].addEventListener('click', () => hit++);
		check('627 editor - clicks OUR slide\'s `Edit Tags (0)`', runJs(O, w) && hit === 1, true);
		check('MUST FAIL: 627 editor - the last slide is not ours', runJs(O, win(row(slide('NEW1') + slide('OLD1')), { ss: SS })), false);
		check('MUST FAIL: 627 editor - our photo already carries a tag (`Edit Tags (1)` / names)', runJs(O, win(row(slide('NEW1', 'Test Tag')), { ss: SS })), false);
	}
	// ---- tag add / remove / create proofs
	const tag = (name) => ({ id: 'T-' + name, name });
	check('627 tag add - our photo carries Test Tag', srv('SERVER (ADD_TAG_TO_ATTACHMENT)', edges([att('OLD1'), att('NEW1', [tag('Test Tag')])])), true);
	check('MUST FAIL: 627 tag add - Test Tag only on ANOTHER photo', srv('SERVER (ADD_TAG_TO_ATTACHMENT)', edges([att('OLD1', [tag('Test Tag')]), att('NEW1', [tag('Test')])])), false);
	check('627 tag remove - our photo has no Test Tag', srv('SERVER (REMOVE_TAG_FROM_ATTACHMENT)', edges([att('OLD1'), att('NEW1', [tag('Test')])])), true);
	check('MUST FAIL: 627 tag remove - still tagged', srv('SERVER (REMOVE_TAG_FROM_ATTACHMENT)', edges([att('OLD1'), att('NEW1', [tag('Test Tag')])])), false);
	check('MUST FAIL: 627 tag remove - our photo is gone altogether (vacuous absence)', srv('SERVER (REMOVE_TAG_FROM_ATTACHMENT)', edges([att('OLD1')])), false);
	{
		const E = b7('…and the editor agrees');
		const modal = (pills) => `<section class="mantine-Modal-content"><p>Edit Attachment Tags</p><div>${pills}<input placeholder="Search tags..."></div></section>`;
		const pill = (n) => `<div class="mantine-Pill-root"><span class="mantine-Pill-label">${n}</span><button class="mantine-Pill-remove"></button></div>`;
		check('627 editor agrees - no Test Tag pill (another pill is fine)', runJs(E, win(modal(pill('Test')))), true);
		check('MUST FAIL: 627 editor agrees - the Test Tag pill is still there', runJs(E, win(modal(pill('Test Tag')))), false);
		check('MUST FAIL: 627 editor agrees - no tag editor open', runJs(E, win('<input placeholder="Search tags...">')), false);
	}
	{
		const T = b7('Stash the typed name');
		const pg = (v, ...opts) => {
			const w = win(`<input placeholder="Search tags...">${opts.map(o => `<div role="option">${o}</div>`).join('')}`);
			w.document.querySelector('input').value = v; w.__clicks = 0;
			w.document.querySelectorAll('[role="option"]').forEach(o => o.addEventListener('click', () => w.__clicks++));
			return w;
		};
		const w = pg('DD SYNTHETIC MOBILE 12345678', 'Test Tag', "+ Create Tag 'DD SYNTHETIC MOBILE 12345678'");
		check('627 new tag - name stashed and the ONE matching create option clicked once', runJs(T, w) && w.sessionStorage.getItem('__dd627_newtag') === 'DD SYNTHETIC MOBILE 12345678' && w.__clicks === 1, true);
		{ const w2 = pg('DD SYNTHETIC MOBILE {{ RUNID }}', "+ Create Tag 'DD SYNTHETIC MOBILE {{ RUNID }}'"); check('MUST FAIL: 627 new tag - {{ RUNID }} was not expanded, and nothing is created', !runJs(T, w2) && w2.__clicks === 0, true); }
		{ const w3 = pg('DD SYNTHETIC MOBILE 12345678', 'DD SYNTHETIC MOBILE 12345678'); check('MUST FAIL: 627 new tag - no create option (the name already exists), nothing clicked', !runJs(T, w3) && w3.__clicks === 0, true); }
		{ const w4 = pg('DD SYNTHETIC MOBILE 12345678', "+ Create Tag 'DD SYNTHETIC MOBILE 1234567'"); check('MUST FAIL: 627 new tag - the option offers a DIFFERENT name, nothing clicked', !runJs(T, w4) && w4.__clicks === 0, true); }
	}
	{
		const C = 'SERVER (CREATE_TAG)';
		const tags = (...names) => ({ data: { tags: { edges: names.map(tag) } } });
		const ss = { __dd627_newtag: 'DD SYNTHETIC MOBILE 12345678' };
		check('627 create - exactly one org tag with the typed name', srv(C, tags('DD SYNTHETIC MOBILE 1', 'DD SYNTHETIC MOBILE 12345678'), ss), true);
		check('MUST FAIL: 627 create - not created', srv(C, tags('DD SYNTHETIC MOBILE 1'), ss), false);
		check('MUST FAIL: 627 create - two with that name', srv(C, tags('DD SYNTHETIC MOBILE 12345678', 'DD SYNTHETIC MOBILE 12345678'), ss), false);
		const S2 = { ...SS, __dd627_newtag: 'DD SYNTHETIC MOBILE 12345678' };
		check('627 sentinel - the created tag is on our photo', srv('SENTINEL (optional): the CREATED tag', edges([att('OLD1'), att('NEW1', [tag('DD SYNTHETIC MOBILE 12345678')])]), S2), true);
		check('MUST FAIL: 627 sentinel - the created tag never reached our photo', srv('SENTINEL (optional): the CREATED tag', edges([att('OLD1'), att('NEW1')]), S2), false);
	}
	{
		const D = b7('The tag editor closed; our slide');
		check('627 editor closed - no search box, last slide ours', runJs(D, win(row(slide('OLD1') + slide('NEW1')), { ss: SS })), true);
		check('MUST FAIL: 627 editor closed - the search box is still mounted', runJs(D, win(row(slide('NEW1')) + '<input placeholder="Search tags...">', { ss: SS })), false);
	}
	// ---- the gear guard (the same body opens the gear for Set as Avatar and for Delete Photo)
	{
		const G = b7('the one new id');
		check('627 gear guard - the avatar and delete guards are ONE body', G === b7('the delete can hit nothing'), true);
		const w = win(decoy + row(slide('OLD1') + slide('NEW1')), { ss: SS }); const hits = [];
		w.document.querySelectorAll('[aria-label="Settings"]').forEach(g => g.addEventListener('click', () => hits.push(g.getAttribute('data-slide'))));
		check('627 gear guard - clicks ONLY our slide\'s gear', runJs(G, w) && hits.join() === 'NEW1', true);
		{
			const w2 = win(row(slide('NEW1') + slide('OLD1')), { ss: SS }); const h2 = [];
			w2.document.querySelectorAll('[aria-label="Settings"]').forEach(g => g.addEventListener('click', () => h2.push(1)));
			check('MUST FAIL: 627 gear guard - the last slide is an OLD photo, and no gear is clicked', !runJs(G, w2) && h2.length === 0, true);
		}
		check('MUST FAIL: 627 gear guard - the stashed id is in BEFORE (a pre-existing photo)', runJs(G, win(row(slide('OLD1')), { ss: { ...SS, __dd627_att: 'OLD1' } })), false);
		check('MUST FAIL: 627 gear guard - nothing stashed', runJs(G, win(row(slide('NEW1')))), false);
	}
	check('627 avatar - asset.avatar is our photo', srv('SERVER (SET_ATTACHMENT_AS_AVATAR)', edges([att('OLD1'), att('NEW1')], { id: 'NEW1' })), true);
	check('MUST FAIL: 627 avatar - avatar is another photo', srv('SERVER (SET_ATTACHMENT_AS_AVATAR)', edges([att('OLD1'), att('NEW1')], { id: 'OLD1' })), false);
	check('MUST FAIL: 627 avatar - no avatar', srv('SERVER (SET_ATTACHMENT_AS_AVATAR)', edges([att('OLD1'), att('NEW1')])), false);
	check('627 deleted - ours gone, exactly BEFORE left', srv('SERVER (REMOVE_ATTACHMENT): our photo is gone', edges([att('OLD1')])), true);
	check('MUST FAIL: 627 deleted - still there', srv('SERVER (REMOVE_ATTACHMENT): our photo is gone', edges([att('OLD1'), att('NEW1')])), false);
	check('MUST FAIL: 627 deleted - an OLD photo went with it', srv('SERVER (REMOVE_ATTACHMENT): our photo is gone', edges([])), false);
	check('627 avatar cleared - no avatar after the delete', srv('deleting the avatar photo CLEARED', edges([att('OLD1')])), true);
	check('MUST FAIL: 627 avatar cleared - a dangling avatar id', srv('deleting the avatar photo CLEARED', edges([att('OLD1')], { id: 'NEW1' })), false);
	{
		const A = b7('…and the carousel agrees');
		check('627 carousel - one slide (BEFORE had one), not ours', runJs(A, win(row(slide('OLD1')), { ss: SS })), true);
		check('MUST FAIL: 627 carousel - our slide is still there', runJs(A, win(row(slide('NEW1')), { ss: SS })), false);
		check('MUST FAIL: 627 carousel - a slide too few', runJs(A, win(row(''), { ss: SS })), false);
	}
	// ---- cleanup and restore
	{
		const X = b7('CLEANUP: close a tag editor');
		const w = win('<section class="mantine-Modal-content"><p>Edit Attachment Tags</p><button>Done</button></section>'); let done = 0;
		w.document.querySelector('button').addEventListener('click', () => done++);
		check('627 cleanup editor - an open tag editor gets its Done clicked', runJs(X, w) && done === 1, true);
		const w2 = win('<section class="mantine-Modal-content"><p>Are you sure you want to delete this image?</p><button>Done</button></section>'); let d2 = 0;
		w2.document.querySelector('button').addEventListener('click', () => d2++);
		check('MUST FAIL: 627 cleanup editor - another modal\'s button is never clicked', runJs(X, w2) && d2 === 1, false);
		const K = b7('CLEANUP: remove this test');
		const wk = win('', { ss: { ...SS, __dd627_newtag: 'x', other: 'keep' } });
		check('627 cleanup keys - all four removed, others kept', runJs(K, wk) && wk.sessionStorage.length === 1 && wk.sessionStorage.getItem('other') === 'keep', true);
		const R = b7('RESTORED: the row reports itself collapsed');
		check('627 restored - aria-expanded=false', runJs(R, win(row('', NAME, 'false'))), true);
		check('MUST FAIL: 627 restored - still expanded', runJs(R, win(row('', NAME, 'true'))), false);
		check('MUST FAIL: 627 restored - the row is gone', runJs(R, win(decoy)), false);
	}

	console.log('\nMOB.628 - asset document: stash, premise, reveal, file, row id, delete guards, proofs');
	const fileRow = (id, name, checked = false) =>
		`<tr><td><input type="checkbox" class="mantine-Checkbox-input"${checked ? ' checked' : ''} data-row="${id}"></td>`
		+ `<td><a href="/api/attachment/${id}"><p>${name}</p></a></td><td><p>pdf</p></td></tr>`;
	const docs = (rows, input = true) => row(`<table><thead><tr><th><button aria-label="Menu"></button></th></tr></thead><tbody>${rows}</tbody></table>`
		+ (input ? '<button>Add File</button><input type="file" accept="*/*" style="display:none">' : '<button>Add File</button>'));
	const PDF = 'dd_synthetic_mobile.pdf';
	const S8 = { __dd628_name: NAME, __dd628_before: '["OLD1"]', __dd628_att: 'NEW1', __dd628_file: PDF };
	{
		const S = b8("Stash the row's asset name");
		const w = win(decoy + docs(''));
		check('628 name - stashed', runJs(S, w) && w.sessionStorage.getItem('__dd628_name') === NAME, true);
		check('MUST FAIL: 628 name - no marker row', runJs(S, win(decoy)), false);
		const P = b8('PREMISE (server)');
		const wp = win('', { answer: edges([att('OLD1')]), ss: { __dd628_name: NAME } });
		check('628 premise - BEFORE stashed', twice(P, wp) && wp.sessionStorage.getItem('__dd628_before') === '["OLD1"]', true);
		check('MUST FAIL: 628 premise - no asset with that name', twice(P, win('', { answer: edges([], null, 'DD SYNTHETIC MOBILE 1'), ss: { __dd628_name: NAME } })), false);
	}
	{
		const V = b8("Reveal the row's hidden");
		const w = win(decoy + docs(''));
		check('628 reveal - the ONE accept=*/* input in the marker row is tagged and shown', runJs(V, w) && w.document.querySelector('input[type=file]').getAttribute('data-dd-upload') === '1', true);
		check('MUST FAIL: 628 reveal - a second */* input elsewhere on the page (ambiguous)', runJs(V, win(docs('') + '<input type="file" accept="*/*">')), false);
		check('MUST FAIL: 628 reveal - only image/* inputs', runJs(V, win(docs('', false) + '<input type="file" accept="image/*">')), false);
	}
	{
		const I = b8('The input holds exactly ONE file');
		const withFiles = (files) => { const w = win('<input type="file" data-dd-upload="1">'); Object.defineProperty(w.document.querySelector('input'), 'files', { get: () => files }); return w; };
		const w = withFiles([{ name: PDF, type: 'application/pdf' }]);
		check('628 file - one pdf, name stashed', runJs(I, w) && w.sessionStorage.getItem('__dd628_file') === PDF, true);
		check('MUST FAIL: 628 file - a PNG (the Docs filter would drop it)', runJs(I, withFiles([{ name: 'shot.png', type: 'image/png' }])), false);
		check('MUST FAIL: 628 file - two files', runJs(I, withFiles([{ name: PDF, type: 'application/pdf' }, { name: 'b.pdf', type: 'application/pdf' }])), false);
		check('MUST FAIL: 628 file - no files', runJs(I, withFiles([])), false);
	}
	{
		const R = b8('The file table shows exactly ONE row');
		const ss = { __dd628_file: PDF, __dd628_before: '["OLD1"]' };
		const w = win(decoy + docs(fileRow('OLD1', PDF) + fileRow('NEW1', PDF)), { ss });
		check('628 row - the one fresh row with the name (an old same-named PDF skipped): id stashed', runJs(R, w) && w.sessionStorage.getItem('__dd628_att') === 'NEW1', true);
		check('MUST FAIL: 628 row - two fresh rows with the name', runJs(R, win(docs(fileRow('NEW1', PDF) + fileRow('NEW2', PDF)), { ss })), false);
		check('MUST FAIL: 628 row - only the pre-existing row', runJs(R, win(docs(fileRow('OLD1', PDF)), { ss })), false);
	}
	{
		const U = (answer, ss = S8) => twice(b8('SERVER (CREATE_PENDING_ATTACHMENTS)'), win('', { answer, ss }));
		check('628 upload - NEW1 is the one new pdf', U(edges([att('OLD1'), att('NEW1', [], 'application/pdf', PDF)])), true);
		check('MUST FAIL: 628 upload - the new attachment is an image', U(edges([att('OLD1'), att('NEW1', [], 'image/png', PDF)])), false);
		check('MUST FAIL: 628 upload - another file name', U(edges([att('OLD1'), att('NEW1', [], 'application/pdf', 'other.pdf')])), false);
		check('MUST FAIL: 628 upload - an old attachment vanished', U(edges([att('NEW1', [], 'application/pdf', PDF)])), false);
	}
	{
		const C = b8('GUARD + check the box');
		const w = win(decoy + docs(fileRow('OLD1', PDF) + fileRow('NEW1', PDF)), { ss: S8 });
		const cbs = () => [...w.document.querySelectorAll('input[type=checkbox]')].filter(c => c.checked).map(c => c.getAttribute('data-row')).join();
		check('628 check - ONLY our row is checked', runJs(C, w) && cbs() === 'NEW1', true);
		check('628 check - polled again it does NOT untick ours', runJs(C, w) && cbs() === 'NEW1', true);
		{
			const w2 = win(docs(fileRow('OLD1', PDF, true) + fileRow('NEW1', PDF)), { ss: S8 });
			check('MUST FAIL: 628 check - another row is already checked, and ours stays unchecked', !runJs(C, w2) && !w2.document.querySelector('[data-row="NEW1"]').checked, true);
		}
		check('MUST FAIL: 628 check - our row is absent', runJs(C, win(docs(fileRow('OLD1', PDF)), { ss: S8 })), false);
		check('MUST FAIL: 628 check - the stashed id is in BEFORE', runJs(C, win(docs(fileRow('OLD1', PDF)), { ss: { ...S8, __dd628_att: 'OLD1' } })), false);
	}
	{
		const D = b8('GUARD + click `Delete File(s)`');
		const menu = '<div class="mantine-Menu-dropdown"><button class="mantine-Menu-item"><span class="mantine-Menu-itemLabel">Delete File(s)</span></button></div>';
		const pg = (rows, dd = menu) => { const w = win(docs(rows) + dd, { ss: S8 }); w.__del = 0; const i = w.document.querySelector('.mantine-Menu-item'); if (i) i.addEventListener('click', () => w.__del++); return w; };
		const w = pg(fileRow('OLD1', PDF) + fileRow('NEW1', PDF, true));
		check('628 delete - only ours checked: Delete File(s) clicked once', runJs(D, w) && w.__del === 1, true);
		{ const w2 = pg(fileRow('OLD1', PDF, true) + fileRow('NEW1', PDF, true)); check('MUST FAIL: 628 delete - two rows checked, and nothing is clicked', !runJs(D, w2) && w2.__del === 0, true); }
		{ const w3 = pg(fileRow('OLD1', PDF, true) + fileRow('NEW1', PDF)); check('MUST FAIL: 628 delete - the checked row is NOT ours, and nothing is clicked', !runJs(D, w3) && w3.__del === 0, true); }
		check('MUST FAIL: 628 delete - no dropdown open', runJs(D, pg(fileRow('NEW1', PDF, true), '')), false);
		check('MUST FAIL: 628 delete - two dropdowns open', runJs(D, pg(fileRow('NEW1', PDF, true), menu + menu)), false);
	}
	{
		const X = (answer) => twice(b8('SERVER (REMOVE_ATTACHMENT): the PDF is gone'), win('', { answer, ss: S8 }));
		check('628 deleted - gone, exactly BEFORE', X(edges([att('OLD1')])), true);
		check('MUST FAIL: 628 deleted - still there', X(edges([att('OLD1'), att('NEW1', [], 'application/pdf', PDF)])), false);
		check('MUST FAIL: 628 deleted - an old attachment went too', X(edges([])), false);
		const T = b8('…and the table agrees');
		check('628 table - no row with our id, Add File there', runJs(T, win(docs(fileRow('OLD1', PDF)), { ss: S8 })), true);
		check('MUST FAIL: 628 table - our row still listed', runJs(T, win(docs(fileRow('NEW1', PDF)), { ss: S8 })), false);
		check('MUST FAIL: 628 table - the panel lost Add File', runJs(T, win(row('<table><tbody></tbody></table>'), { ss: S8 })), false);
		const K = b8('CLEANUP: remove this test');
		const wk = win('', { ss: { ...S8, other: 'keep' } });
		check('628 cleanup keys - all four removed, others kept', runJs(K, wk) && wk.sessionStorage.length === 1, true);
		const R = b8('RESTORED: the row reports itself collapsed');
		check('628 restored - collapsed', runJs(R, win(row('', NAME, 'false'))), true);
		check('MUST FAIL: 628 restored - expanded', runJs(R, win(row('', NAME, 'true'))), false);
	}
}

/* ===========================================================================================
 * MOB.866 - the storeroom item's Photos / Docs: server premise, guarded uploads, server proofs, the
 * guarded photo and document deletes, the rest state. DOM from MaterialLookup/index.tsx (Modal) >
 * StockAdjustments.tsx (Box > SegmentedControl, <p>Storeroom Item</p>, the PhotoAttachments /
 * FileAttachments Box, <p>Material Item (read only)</p>, ReadOnlyAttachments), PhotoCarousel
 * (Carousel.Slide > Image img[alt=fileName][src=reportLinkPreview] + gear aria-label=Settings),
 * Attachments.tsx AttachmentTable (thead gear aria-label=Menu, disabled until a row is ticked; tbody tr >
 * Checkbox input + Anchor href=/api/attachment/<id>; FileButton's hidden accept-any-file input),
 * PhotoAttachments' DeletePhotoConfirmation (a @mantine/modals modal: its own .mantine-Modal-content) and
 * useFileDialog (inputs appended to <body>; the camera's `capture` a non-reflecting property, trap 31).
 * reportLinkPreview read over the API 2026-09-15: /api/attachment/<id>?org=SMCT2&imagePreview=true.
 * ========================================================================================= */
if (!fs.existsSync(path.join(TESTS, 'MOB.866_MaterialLookup_Item_Attachment_Delete.json'))) {
	console.log('\nMOB.866 - SKIPPED: not built yet');
} else {
	const F866 = 'MOB.866_MaterialLookup_Item_Attachment_Delete.json';
	const b6 = (n) => bodyOf(F866, n);
	const up6 = (f) => JSON.parse(fs.readFileSync(path.join(TESTS, f))).details.steps.filter(s => s.type === 'uploadFiles');
	const PHOTO = up6('MOB.600_Collector_Create_Asset.json')[0].params.files[0].name;
	const DOC = up6(F866)[1].params.files[0].name;
	const E = '__dd866_empty', M = '__dd866_mat', P = '__dd866_photo', D = '__dd866_doc';
	const READY = { [E]: '1', [M]: '0' };
	const sync6 = (v) => ({ then(f) { try { const r = f(v); return r && r.then ? r : sync6(r); } catch (e) { return sync6(undefined); } }, catch() { return this; } });
	const SRC = (id) => `https://dev.mentorapm.com/api/attachment/${id}?org=SMCT2&imagePreview=true`;
	const pg6 = ({ modal = true, seg = '3', slides = [], rows = [], roSlides = [], roRows = [], headings = true,
		wrongBtn = false, fileInputs = 1, menus = [], confirms = 0, confirmFirst = false, picker = null,
		answer = null, ss = {}, outsideInput = false } = {}) => {
		const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/material-lookup' }).window;
		const doc = w.document;
		w.__clicks = [];
		const hit = (t) => () => w.__clicks.push(t);
		const el = (tag, attrs = {}, ...kids) => {
			const e = doc.createElement(tag);
			for (const [k, v] of Object.entries(attrs)) {
				if (k === 'text') e.textContent = v; else if (k === 'click') e.addEventListener('click', v); else e.setAttribute(k, v);
			}
			kids.forEach(c => e.appendChild(c));
			return e;
		};
		const slide = (s, ro) => el('div', { class: 'mantine-Carousel-slide' }, el('div', {},
			el('img', { class: 'mantine-Image-root', alt: s.alt, src: s.src }),
			el('div', { class: 'mantine-Group-root' }, el('button', { class: 'mantine-ActionIcon-root', 'aria-label': 'Settings', click: hit('gear:' + (ro ? 'ro:' : '') + s.src) }))));
		const carousel = (list, ro) => el('div', { class: 'mantine-Carousel-root' }, el('div', { class: 'mantine-Carousel-viewport' },
			el('div', { class: 'mantine-Carousel-container' }, ...list.map(s => slide(s, ro)))));
		const table = (list, editable) => {
			const gear = el('button', { class: 'mantine-ActionIcon-root', 'aria-label': 'Menu', click: hit('menu-gear') });
			gear.disabled = !list.some(r => r.checked);
			const tr = (r) => {
				const cells = [];
				if (editable) {
					const box = el('input', { type: 'checkbox', class: 'mantine-Checkbox-input' });
					box.checked = !!r.checked;
					box.addEventListener('click', () => { w.__clicks.push('tick'); gear.disabled = ![...doc.querySelectorAll('input[type="checkbox"]')].some(x => x.checked); });
					cells.push(el('td', {}, el('div', { class: 'mantine-Checkbox-root' }, box)));
				}
				const a = el('a', r.href ? { class: 'mantine-Anchor-root', href: r.href } : { class: 'mantine-Anchor-root' }, el('p', { class: 'mantine-Text-root', text: r.name }));
				cells.push(el('td', {}, a), el('td', {}, el('p', { class: 'mantine-Text-root', text: 'pdf' })));
				return el('tr', {}, ...cells);
			};
			return el('div', { class: 'mantine-ScrollArea-root' }, el('table', { class: 'mantine-Table-table' },
				el('thead', {}, el('tr', {}, ...(editable ? [el('th', {}, gear)] : []), el('th', { text: 'Name' }), el('th', { text: 'Type' }))),
				el('tbody', {}, ...list.map(tr))));
		};
		const confirm = () => el('div', { class: 'mantine-Modal-content' },
			el('button', { class: 'mantine-Modal-close', click: hit('confirm-x') }),
			el('div', { class: 'mantine-Modal-body' }, el('div', {},
				el('p', { class: 'mantine-Text-root', text: 'Are you sure you want to delete this image?' }),
				el('div', {}, el('button', { text: 'Yes', click: hit('yes') }), el('button', { text: 'No', click: hit('no') })))));
		if (confirmFirst) for (let i = 0; i < confirms; i++) doc.body.appendChild(confirm());
		if (modal) {
			const box = el('div', { class: 'mantine-Box-root' });
			box.appendChild(segmentedControl(doc, 'mantine-seg866', ['1', '2', '3', '4'], seg));
			const photos = seg === '3';
			const att = el('div');
			if (photos) {
				if (slides.length) att.appendChild(carousel(slides));
				att.appendChild(el('button', { text: 'Add Photo' }));
				if (wrongBtn) att.appendChild(el('button', { text: 'Add File' }));
			} else {
				if (rows.length) att.appendChild(table(rows, true));
				att.appendChild(el('button', { text: 'Add File' }));
				for (let i = 0; i < fileInputs; i++) att.appendChild(el('input', { type: 'file', accept: '*/*', style: 'display:none' }));
				if (wrongBtn) att.appendChild(el('button', { text: 'Add Photo' }));
			}
			if (headings) box.appendChild(el('p', { class: 'mantine-Text-root', text: 'Storeroom Item' }));
			box.appendChild(el('div', { class: 'mantine-Box-root' }, att));
			if (headings) box.appendChild(el('p', { class: 'mantine-Text-root', text: 'Material Item (read only)' }));
			if (photos) box.appendChild(roSlides.length ? carousel(roSlides, true) : el('p', { class: 'mantine-Text-root', text: 'No photos' }));
			else box.appendChild(roRows.length ? table(roRows, false) : el('p', { class: 'mantine-Text-root', text: 'No documents' }));
			doc.body.appendChild(el('div', { class: 'mantine-Modal-content' },
				el('header', { class: 'mantine-Modal-header' }, el('h2', { class: 'mantine-Modal-title' }, el('p', { text: '000-000-000 Adamantium' })),
					el('button', { class: 'mantine-Modal-close', click: hit('item-x') })),
				el('div', { class: 'mantine-Modal-body' }, box)));
		}
		if (!confirmFirst) for (let i = 0; i < confirms; i++) doc.body.appendChild(confirm());
		for (const items of menus) doc.body.appendChild(el('div', { class: 'mantine-Menu-dropdown' },
			...items.map(t => el('button', { class: 'mantine-Menu-item', click: hit('item:' + t) },
				el('div', { class: 'mantine-Menu-itemSection' }), el('div', { class: 'mantine-Menu-itemLabel', text: t })))));
		if (picker) {
			doc.body.appendChild(el('div', { class: 'mantine-Modal-content' }, el('h2', { text: 'Select Photo Source' }), el('button', { class: 'mantine-Modal-close', click: hit('picker-x') })));
			if (picker.stale) doc.body.appendChild(el('div', { 'data-dd-upload': '1', id: 'stale' }));
			for (let i = 0; i < (picker.gallery ?? 1); i++) doc.body.appendChild(el('input', { type: 'file', accept: 'image/*', style: 'display:none', class: 'gallery' }));
			for (let i = 0; i < (picker.camera ?? 1); i++) {
				const c = el('input', { type: 'file', accept: 'image/*', style: 'display:none', class: 'camera' });
				Object.defineProperty(c, 'capture', { value: 'environment' });   // a property, no attribute (trap 31)
				doc.body.appendChild(c);
			}
		}
		if (outsideInput) doc.body.appendChild(el('input', { type: 'file', accept: '*/*', style: 'display:none', class: 'outside' }));
		if (answer) w.fetch = () => sync6({ json: () => sync6(answer) });
		for (const [k, v] of Object.entries(ss)) w.sessionStorage.setItem(k, v);
		return w;
	};
	const twice6 = (body, w) => { runJs(body, w); return runJs(body, w); };
	const ans = (s, m = []) => ({ data: { s: { edges: s }, m: { edges: m } } });
	const img = (id = 'P1', fileName = PHOTO, fileType = 'image/png') => ({ id, fileName, fileType });
	const pdf = (id = 'D1', fileName = DOC, fileType = 'application/pdf') => ({ id, fileName, fileType });
	const srv6 = (frag, answer, ss = {}) => { const w = pg6({ modal: false, answer, ss }); return [twice6(b6(frag), w), w]; };
	const clicks6 = (w) => w.__clicks.join();

	console.log('\nMOB.866 - storeroom item photo + PDF: premise, guarded uploads and deletes, server proofs, rest');
	{
		// index.tsx: `<Loading visible={loading && !previousData} />` + `{data?.results ? `${totalCount} matches` : ''}`
		const RD = b6('READY: the material list has loaded');
		const list = (count, overlay) => { const w = pg6({ modal: false }); const d = w.document;
			if (overlay) { const o = d.createElement('div'); o.className = 'm_9814e45f mantine-LoadingOverlay-overlay mantine-Overlay-root'; d.body.appendChild(o); }
			const p = d.createElement('p'); p.className = 'mantine-Text-root'; p.textContent = count; d.body.appendChild(p); return w; };
		check('866 ready - `996 matches` and no overlay', runJs(RD, list('996 matches', false)), true);
		check('866 ready - a thousands separator (`1,204 matches`)', runJs(RD, list('1,204 matches', false)), true);
		check('MUST FAIL: 866 ready - the loading overlay still covers the page (replay 1)', runJs(RD, list('996 matches', true)), false);
		check('MUST FAIL: 866 ready - no count yet (data.results absent)', runJs(RD, list('', false)), false);
		check('MUST FAIL: 866 ready - `matches` without a number', runJs(RD, list('matches', false)), false);
	}
	{
		const PR = 'PREMISE (server): the storeroom item holds NO attachment';
		{ const [r, w] = srv6(PR, ans([], [])); check('866 premise - empty: passes, flags the premise and records the material count 0', r && w.sessionStorage.getItem(E) === '1' && w.sessionStorage.getItem(M) === '0', true); }
		{ const [r, w] = srv6(PR, ans([], [{ id: 'X' }, { id: 'Y' }])); check("866 premise - the material item's 2 are recorded, not judged", r && w.sessionStorage.getItem(M) === '2', true); }
		{ const [r, w] = srv6(PR, ans([img('LEFT')])); check('MUST FAIL: 866 premise - a leftover attachment: false, and nothing flagged', r === false && w.sessionStorage.getItem(E) === null, true); }
		check('MUST FAIL: 866 premise - a GraphQL error answer', srv6(PR, { errors: [{ message: 'x' }] })[0], false);
		const K = b6("Remove the server read's sessionStorage keys");
		const wk = pg6({ modal: false, ss: { __dd866_server: '{}', '__dd866_server:inflight': '1', '__dd866_server:at': '1', ...READY, [P]: 'P1' } });
		check("866 server keys - the read's three keys go, the test's stash (premise flag, photo id) stays", runJs(K, wk) && wk.sessionStorage.getItem('__dd866_server') === null && wk.sessionStorage.getItem(E) === '1' && wk.sessionStorage.getItem(P) === 'P1', true);
		const C = b6("Clear this test's sessionStorage keys");
		const wc = pg6({ modal: false, ss: { ...READY, [P]: 'P1', [D]: 'D1', other: 'keep' } });
		check('866 clear - the four keys from an earlier run go, others stay', runJs(C, wc) && wc.sessionStorage.length === 1 && wc.sessionStorage.getItem('other') === 'keep', true);
	}
	{
		const LP = 'SERVER: the storeroom item holds exactly ONE attachment — the uploaded image';
		{ const [r, w] = srv6(LP, ans([img()]), READY); check('866 photo server - one image named as uploaded: id stashed', r && w.sessionStorage.getItem(P) === 'P1', true); }
		{ const [r, w] = srv6(LP, ans([img()]), { [M]: '0' }); check('MUST FAIL: 866 photo server - the premise never held: false, nothing stashed', r === false && w.sessionStorage.getItem(P) === null, true); }
		check('MUST FAIL: 866 photo server - two attachments', srv6(LP, ans([img(), img('P2')]), READY)[0], false);
		check('MUST FAIL: 866 photo server - none (the upload never landed)', srv6(LP, ans([]), READY)[0], false);
		check('MUST FAIL: 866 photo server - another file name', srv6(LP, ans([img('P1', 'Screenshot other.png')]), READY)[0], false);
		check('MUST FAIL: 866 photo server - named right but not an image', srv6(LP, ans([img('P1', PHOTO, 'application/pdf')]), READY)[0], false);
		check('MUST FAIL: 866 photo server - the material item gained one', srv6(LP, ans([img()], [{ id: 'X' }]), READY)[0], false);
		check('MUST FAIL: 866 photo server - no material count recorded', srv6(LP, ans([img()]), { [E]: '1' })[0], false);
		const LD = 'SERVER: the storeroom item holds exactly ONE attachment — the uploaded PDF';
		{ const [r, w] = srv6(LD, ans([pdf()]), READY); check('866 doc server - one PDF named as uploaded: id stashed', r && w.sessionStorage.getItem(D) === 'D1', true); }
		check('MUST FAIL: 866 doc server - an image under the PDF name', srv6(LD, ans([pdf('D1', DOC, 'image/png')]), READY)[0], false);
		check('MUST FAIL: 866 doc server - application/pdf with another name', srv6(LD, ans([pdf('D1', 'other.pdf')]), READY)[0], false);
		check('MUST FAIL: 866 doc server - the photo is still there too', srv6(LD, ans([img(), pdf()]), READY)[0], false);
		check('MUST FAIL: 866 doc server - the premise never held', srv6(LD, ans([pdf()]), { [M]: '0' })[0], false);
		const GP = 'SERVER: the photo is GONE', GD = 'SERVER: the PDF is GONE', RS = 'RESTED (server)';
		check('866 photo gone - stashed, storeroom empty, material unchanged', srv6(GP, ans([]), { ...READY, [P]: 'P1' })[0], true);
		check('MUST FAIL: 866 photo gone - still held', srv6(GP, ans([img()]), { ...READY, [P]: 'P1' })[0], false);
		check('MUST FAIL: 866 photo gone - nothing stashed (no upload: a vacuous absence)', srv6(GP, ans([]), READY)[0], false);
		check('MUST FAIL: 866 photo gone - the material item lost one', srv6(GP, ans([], []), { [E]: '1', [M]: '1', [P]: 'P1' })[0], false);
		check('866 doc gone - stashed, storeroom empty', srv6(GD, ans([]), { ...READY, [D]: 'D1' })[0], true);
		check('MUST FAIL: 866 doc gone - still held', srv6(GD, ans([pdf()]), { ...READY, [D]: 'D1' })[0], false);
		check('MUST FAIL: 866 doc gone - only the PHOTO id stashed', srv6(GD, ans([]), { ...READY, [P]: 'P1' })[0], false);
		check('866 rested - storeroom empty, material at its recorded count', srv6(RS, ans([], []), READY)[0], true);
		check('MUST FAIL: 866 rested - a leftover on the storeroom item', srv6(RS, ans([pdf()]), READY)[0], false);
		check('MUST FAIL: 866 rested - no material count recorded (the premise never ran)', srv6(RS, ans([]), {})[0], false);
	}
	{
		const S3 = b6('Switch to the "Photos" segment'), S4 = b6('Switch to the "Docs" segment');
		const C3 = b6('The "Photos" segment is the CHECKED'), C4 = b6('The "Docs" segment is the CHECKED');
		{ const w = pg6({ seg: '1', confirms: 1, confirmFirst: true }); check('866 switch - clicks radio 3 in THE item modal (a confirmation modal first in the DOM)', runJs(S3, w) && w.document.querySelector('input[value="3"]').checked, true); }
		{ const w = pg6({ seg: '3' }); check('866 switch - clicks radio 4', runJs(S4, w) && w.document.querySelector('input[value="4"]').checked, true); }
		check('MUST FAIL: 866 switch - no item modal (only a confirmation)', runJs(S3, pg6({ modal: false, confirms: 1 })), false);
		check('866 checked - Photos', runJs(C3, pg6({ seg: '3' })), true);
		check('MUST FAIL: 866 checked - still Quantity Adjustment', runJs(C3, pg6({ seg: '1' })), false);
		check('866 checked - Docs', runJs(C4, pg6({ seg: '4' })), true);
		check('MUST FAIL: 866 checked - Photos when Docs is wanted', runJs(C4, pg6({ seg: '3' })), false);
	}
	{
		const AR = b6('PHOTOS at rest'), DR = b6('DOCS at rest');
		check('866 at rest - the before and after checks are ONE body each', AR === b6('PHOTOS back at rest') && DR === b6('DOCS back at rest'), true);
		check('866 photos at rest - no slide, Add Photo', runJs(AR, pg6()), true);
		check("866 photos at rest - the material item's read-only carousel does not count", runJs(AR, pg6({ roSlides: [{ alt: PHOTO, src: SRC('M1') }] })), true);
		check('MUST FAIL: 866 photos at rest - a slide in the Storeroom Item section', runJs(AR, pg6({ slides: [{ alt: PHOTO, src: SRC('P1') }] })), false);
		check('MUST FAIL: 866 photos at rest - Add File offered too', runJs(AR, pg6({ wrongBtn: true })), false);
		check('MUST FAIL: 866 photos at rest - no section headings (the old single panel)', runJs(AR, pg6({ headings: false })), false);
		check('MUST FAIL: 866 photos at rest - the Docs view', runJs(AR, pg6({ seg: '4' })), false);
		check('866 docs at rest - no row, Add File', runJs(DR, pg6({ seg: '4' })), true);
		check("866 docs at rest - the material item's read-only table does not count", runJs(DR, pg6({ seg: '4', roRows: [{ name: 'spec.pdf', href: '/api/attachment/M1' }] })), true);
		check('MUST FAIL: 866 docs at rest - a row in the Storeroom Item section', runJs(DR, pg6({ seg: '4', rows: [{ name: DOC, href: '/api/attachment/D1' }] })), false);
		check('MUST FAIL: 866 docs at rest - the Photos view', runJs(DR, pg6()), false);
	}
	{
		const PP = b6('Reveal the gallery input'), DP = b6('Reveal the Storeroom Item section');
		{ const w = pg6({ picker: { stale: true }, ss: READY }); const g = w.document.querySelector('input.gallery');
			check('866 photo reveal - the ONE gallery input (not the camera) tagged and shown; a stale tag cleared', runJs(PP, w) && g.getAttribute('data-dd-upload') === '1' && g.style.display === 'block'
				&& !w.document.getElementById('stale').hasAttribute('data-dd-upload') && !w.document.querySelector('input.camera').hasAttribute('data-dd-upload'), true); }
		{ const w = pg6({ picker: {} }); check('MUST FAIL: 866 photo reveal - the premise never held: false, nothing tagged', runJs(PP, w) === false && !w.document.querySelector('[data-dd-upload]'), true); }
		check('MUST FAIL: 866 photo reveal - two gallery inputs (ambiguous)', runJs(PP, pg6({ picker: { gallery: 2 }, ss: READY })), false);
		check('MUST FAIL: 866 photo reveal - only the camera input', runJs(PP, pg6({ picker: { gallery: 0 }, ss: READY })), false);
		{ const w = pg6({ seg: '4', ss: READY }); const i = w.document.querySelector('input[accept="*/*"]');
			check("866 doc reveal - the section's ONE accept=*/* input tagged", runJs(DP, w) && i.getAttribute('data-dd-upload') === '1', true); }
		{ const w = pg6({ seg: '4' }); check('MUST FAIL: 866 doc reveal - the premise never held: nothing tagged', runJs(DP, w) === false && !w.document.querySelector('[data-dd-upload]'), true); }
		check('MUST FAIL: 866 doc reveal - two inputs in the section', runJs(DP, pg6({ seg: '4', fileInputs: 2, ss: READY })), false);
		{ const w = pg6({ seg: '4', fileInputs: 0, outsideInput: true, ss: READY });
			check('MUST FAIL: 866 doc reveal - the only */* input is OUTSIDE the section, and it is not tagged', runJs(DP, w) === false && !w.document.querySelector('.outside').hasAttribute('data-dd-upload'), true); }
	}
	{
		const PL = b6('PHOTO LANDED (UI');
		const one = [{ alt: PHOTO, src: SRC('P1') }];
		check('866 photo landed - one slide, named, a server URL', runJs(PL, pg6({ slides: one })), true);
		check('MUST FAIL: 866 photo landed - no slide yet', runJs(PL, pg6()), false);
		check('MUST FAIL: 866 photo landed - two slides', runJs(PL, pg6({ slides: [...one, { alt: PHOTO, src: SRC('P2') }] })), false);
		check('MUST FAIL: 866 photo landed - another name', runJs(PL, pg6({ slides: [{ alt: 'Attachment', src: SRC('P1') }] })), false);
		check('MUST FAIL: 866 photo landed - a blob: preview', runJs(PL, pg6({ slides: [{ alt: PHOTO, src: 'blob:https://dev.mentorapm.com/1' }] })), false);
		check("MUST FAIL: 866 photo landed - the slide is in the material item's read-only half", runJs(PL, pg6({ roSlides: one })), false);
		const DL = b6('DOCUMENT LANDED (UI');
		const row1 = [{ name: DOC, href: '/api/attachment/D1' }];
		check('866 doc landed - one row, named, linking to an attachment', runJs(DL, pg6({ seg: '4', rows: row1 })), true);
		check('MUST FAIL: 866 doc landed - no row', runJs(DL, pg6({ seg: '4' })), false);
		check('MUST FAIL: 866 doc landed - another name', runJs(DL, pg6({ seg: '4', rows: [{ name: 'other.pdf', href: '/api/attachment/D1' }] })), false);
		check('MUST FAIL: 866 doc landed - no link', runJs(DL, pg6({ seg: '4', rows: [{ name: DOC, href: null }] })), false);
		check('MUST FAIL: 866 doc landed - the row is in the read-only half', runJs(DL, pg6({ seg: '4', roRows: row1 })), false);
	}
	{
		const GG = b6('GUARD + open the gear: only on the ONE slide'), MS = b6('MENU SET on a storeroom item photo'), CY = b6('GUARD + confirm `Yes`');
		const SSP = { ...READY, [P]: 'P1' };
		const one = [{ alt: PHOTO, src: SRC('P1') }];
		{ const w = pg6({ slides: one, ss: SSP }); check('866 gear - the one slide carrying the stashed id: its gear clicked', runJs(GG, w) && clicks6(w) === 'gear:' + SRC('P1'), true); }
		{ const w = pg6({ slides: [{ alt: PHOTO, src: SRC('P10') }], ss: SSP }); check('MUST FAIL: 866 gear - the slide is P10, not P1 (an id prefix), nothing clicked', runJs(GG, w) === false && clicks6(w) === '', true); }
		{ const w = pg6({ slides: [{ alt: PHOTO, src: SRC('P2') }], ss: SSP }); check('MUST FAIL: 866 gear - another attachment, nothing clicked', runJs(GG, w) === false && clicks6(w) === '', true); }
		{ const w = pg6({ slides: one, ss: READY }); check('MUST FAIL: 866 gear - no id stashed, nothing clicked', runJs(GG, w) === false && clicks6(w) === '', true); }
		{ const w = pg6({ slides: one, ss: { [M]: '0', [P]: 'P1' } }); check('MUST FAIL: 866 gear - the premise flag is missing, nothing clicked', runJs(GG, w) === false && clicks6(w) === '', true); }
		{ const w = pg6({ slides: [...one, { alt: PHOTO, src: SRC('P2') }], ss: SSP }); check('MUST FAIL: 866 gear - two slides, nothing clicked', runJs(GG, w) === false && clicks6(w) === '', true); }
		{ const w = pg6({ slides: [{ alt: 'other.png', src: SRC('P1') }], ss: SSP }); check('MUST FAIL: 866 gear - the right id under another name, nothing clicked', runJs(GG, w) === false && clicks6(w) === '', true); }
		{ const w = pg6({ slides: one, menus: [['X']], ss: SSP }); check('MUST FAIL: 866 gear - a menu is already open (a click would toggle it), nothing clicked', runJs(GG, w) === false && clicks6(w) === '', true); }
		{ const w = pg6({ roSlides: one, ss: SSP }); check('MUST FAIL: 866 gear - the id only in the read-only half, nothing clicked', runJs(GG, w) === false && clicks6(w) === '', true); }
		const MENU4 = ['View in Fullscreen', 'Set as Avatar', 'Rotate Image', 'Delete Photo'];
		check('866 menu - the four, in order', runJs(MS, pg6({ menus: [MENU4] })), true);
		check("MUST FAIL: 866 menu - MOB.623's five (an asset's `Get Description`)", runJs(MS, pg6({ menus: [['View in Fullscreen', 'Get Description', 'Set as Avatar', 'Rotate Image', 'Delete Photo']] })), false);
		check('MUST FAIL: 866 menu - reordered', runJs(MS, pg6({ menus: [[...MENU4].reverse()] })), false);
		check('MUST FAIL: 866 menu - no dropdown', runJs(MS, pg6()), false);
		check('MUST FAIL: 866 menu - two dropdowns', runJs(MS, pg6({ menus: [MENU4, MENU4] })), false);
		{ const w = pg6({ slides: one, confirms: 1, ss: SSP }); check('866 yes - guard holds and the confirmation is open: `Yes` clicked once', runJs(CY, w) && clicks6(w) === 'yes', true); }
		{ const w = pg6({ slides: one, confirms: 1, confirmFirst: true, ss: SSP }); check('866 yes - the confirmation before the item modal in the DOM: still `Yes`', runJs(CY, w) && clicks6(w) === 'yes', true); }
		{ const w = pg6({ slides: one, ss: SSP }); check('MUST FAIL: 866 yes - no confirmation open', runJs(CY, w) === false && clicks6(w) === '', true); }
		{ const w = pg6({ slides: [{ alt: PHOTO, src: SRC('P2') }], confirms: 1, ss: SSP }); check('MUST FAIL: 866 yes - the slide is another attachment: `Yes` NOT clicked', runJs(CY, w) === false && clicks6(w) === '', true); }
		{ const w = pg6({ slides: one, confirms: 1, ss: READY }); check('MUST FAIL: 866 yes - no id stashed: `Yes` NOT clicked', runJs(CY, w) === false && clicks6(w) === '', true); }
		{ const w = pg6({ slides: one, confirms: 2, ss: SSP }); check('MUST FAIL: 866 yes - two confirmations: nothing clicked', runJs(CY, w) === false && clicks6(w) === '', true); }
	}
	{
		const TK = b6('GUARD + tick the row'), GT = b6("GUARD + open the table's gear"), DF = b6('GUARD + `Delete File(s)`');
		const SSD = { ...READY, [D]: 'D1' };
		const mine = (checked = false) => [{ name: DOC, href: '/api/attachment/D1', checked }];
		const boxOf = (w) => w.document.querySelector('input[type="checkbox"]');
		{ const w = pg6({ seg: '4', rows: mine(), ss: SSD }); check('866 tick - our one row: ticked', runJs(TK, w) && boxOf(w).checked, true); }
		{ const w = pg6({ seg: '4', rows: mine(true), ss: SSD }); check('866 tick - already ticked (a re-poll): stays ticked, no click', runJs(TK, w) && boxOf(w).checked && clicks6(w) === '', true); }
		{ const w = pg6({ seg: '4', rows: [{ name: DOC, href: '/api/attachment/D2' }], ss: SSD }); check('MUST FAIL: 866 tick - another attachment: false, unticked', runJs(TK, w) === false && !boxOf(w).checked, true); }
		{ const w = pg6({ seg: '4', rows: mine(), ss: READY }); check('MUST FAIL: 866 tick - no doc id stashed: unticked', runJs(TK, w) === false && !boxOf(w).checked, true); }
		{ const w = pg6({ seg: '4', rows: [...mine(), { name: 'other.pdf', href: '/api/attachment/D9' }], ss: SSD }); check('MUST FAIL: 866 tick - two rows: none ticked', runJs(TK, w) === false && clicks6(w) === '', true); }
		{ const w = pg6({ seg: '4', rows: [{ name: 'other.pdf', href: '/api/attachment/D1' }], ss: SSD }); check('MUST FAIL: 866 tick - the id under another name: unticked', runJs(TK, w) === false && !boxOf(w).checked, true); }
		{ const w = pg6({ seg: '4', rows: mine(true), ss: SSD }); check('866 table gear - ticked and enabled: clicked', runJs(GT, w) && clicks6(w) === 'menu-gear', true); }
		{ const w = pg6({ seg: '4', rows: mine(false), ss: SSD }); check('MUST FAIL: 866 table gear - not ticked: not clicked', runJs(GT, w) === false && clicks6(w) === '', true); }
		{ const w = pg6({ seg: '4', rows: mine(true), ss: SSD }); w.document.querySelector('[aria-label="Menu"]').disabled = true; check('MUST FAIL: 866 table gear - disabled: not clicked', runJs(GT, w) === false && clicks6(w) === '', true); }
		{ const w = pg6({ seg: '4', rows: mine(true), menus: [['Delete File(s)']], ss: SSD }); check('MUST FAIL: 866 table gear - its menu is already open: not clicked again', runJs(GT, w) === false && clicks6(w) === '', true); }
		{ const w = pg6({ seg: '4', rows: [{ name: DOC, href: '/api/attachment/D2', checked: true }], ss: SSD }); check('MUST FAIL: 866 table gear - the ticked row is another attachment', runJs(GT, w) === false && clicks6(w) === '', true); }
		const DEL = [['Delete File(s)']];
		{ const w = pg6({ seg: '4', rows: mine(true), menus: DEL, ss: SSD }); check('866 delete file - our one ticked row: `Delete File(s)` clicked once', runJs(DF, w) && clicks6(w) === 'item:Delete File(s)', true); }
		{ const w = pg6({ seg: '4', rows: mine(false), menus: DEL, ss: SSD }); check('MUST FAIL: 866 delete file - not ticked: nothing clicked', runJs(DF, w) === false && clicks6(w) === '', true); }
		{ const w = pg6({ seg: '4', rows: [{ name: DOC, href: '/api/attachment/D2', checked: true }], menus: DEL, ss: SSD }); check('MUST FAIL: 866 delete file - another attachment ticked: nothing clicked', runJs(DF, w) === false && clicks6(w) === '', true); }
		{ const w = pg6({ seg: '4', rows: mine(true), menus: DEL, ss: READY }); check('MUST FAIL: 866 delete file - no doc id stashed: nothing clicked', runJs(DF, w) === false && clicks6(w) === '', true); }
		{ const w = pg6({ seg: '4', rows: mine(true), menus: [...DEL, ...DEL], ss: SSD }); check('MUST FAIL: 866 delete file - two dropdowns: nothing clicked', runJs(DF, w) === false && clicks6(w) === '', true); }
		{ const w = pg6({ seg: '4', rows: mine(true), menus: [['View in Fullscreen', 'Set as Avatar', 'Rotate Image', 'Delete Photo']], ss: SSD }); check("MUST FAIL: 866 delete file - the open menu is a photo's: nothing clicked", runJs(DF, w) === false && clicks6(w) === '', true); }
	}
	{
		const CL = b6('CLEANUP: remove this test');
		const w = pg6({ modal: false, ss: { ...READY, [P]: 'P1', [D]: 'D1', other: 'keep' } });
		check('866 cleanup - the four keys removed, others kept', runJs(CL, w) && w.sessionStorage.length === 1, true);
		const CM = b6('Close any modal left over');
		{ const w2 = pg6({ confirms: 1, picker: {} }); check('866 close - the confirmation and the picker closed first, then the item modal', runJs(CM, w2) && clicks6(w2) === 'confirm-x,picker-x,item-x', true); }
		{ const w3 = pg6({ modal: false }); check('866 close - nothing open: passes, clicks nothing', runJs(CM, w3) && w3.__clicks.length === 0, true); }
		const RS = b6('RESTORED: no modal is left open');
		check('866 restored - no modal', runJs(RS, pg6({ modal: false })), true);
		check('MUST FAIL: 866 restored - the item modal still open', runJs(RS, pg6()), false);
	}
}

/* ===========================================================================================
 * MOB.363 / MOB.364 / MOB.365 - writes on the Datadog-created work order `20260910-16` (checklist
 * #58 / #59 / #60). DOM from WorkDetails.tsx (Tabs: role=tab aria-controls -> tabpanel; inactive
 * panels display:none), WorkStageAttachments.tsx + PhotoCarousel/index.tsx + PhotoMenu.tsx (slide >
 * img /api/attachment/<id> + gear aria-label=Settings; Menu.Dropdown > Menu.Item > itemSection +
 * itemLabel), AddPhotoOptions.tsx (useFileDialog: gallery accept=image/* and a camera twin whose
 * `capture` is a PROPERTY - trap 31), ListFilter (role=option > .custom-option > .option-title;
 * visibility on offsetParent), AdHocForm.tsx (#formId, button[form=adhoc-form]), ReassignWork.tsx
 * (#crewform, #crewId, react-switch input#keepAssignment, SubmitButton "SUBMIT").
 * Server reads are dd_tools.server_read_js against a stubbed fetch.
 * ========================================================================================= */
if (!['MOB.363_Work_Attachment_Upload_Delete.json', 'MOB.364_Work_Attach_Form.json', 'MOB.365_Work_Reassign_Stage.json']
	.every(f => fs.existsSync(path.join(TESTS, f)))) {
	console.log('\nMOB.363/364/365 - SKIPPED: not built yet');
} else {
	const F363 = 'MOB.363_Work_Attachment_Upload_Delete.json', F364 = 'MOB.364_Work_Attach_Form.json', F365 = 'MOB.365_Work_Reassign_Stage.json';
	const FIX = 'xohY0klBZktB9VBRxc8k4J', TANK = '8khYtoBRVNNs5d9cEt8NdY';
	const s36 = (v) => ({ then(f) { try { const r = f(v); return r && r.then ? r : s36(r); } catch (e) { return s36(undefined); } }, catch() { return this; } });
	const w36 = (html = '', { answer, ss = {} } = {}) => {
		const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/work/' + FIX }).window;
		w.document.body.innerHTML = html;
		w.__posts = [];
		w.fetch = (u, o) => { w.__posts.push(JSON.parse(o.body)); return s36({ json: () => s36(answer === undefined ? {} : answer) }); };
		Object.entries(ss).forEach(([k, v]) => w.sessionStorage.setItem(k, v));
		return w;
	};
	const t36 = (body, w) => { runJs(body, w); return runJs(body, w); };
	const opt = (t, hid = false) => `<div role="option" data-hid="${hid ? 1 : 0}"><div class="custom-option"><div class="option-title">${t}</div><div class="option-description">d</div></div></div>`;
	const options = (list) => {
		const w = w36(list.map(([t, h]) => opt(t, h)).join(''));
		w.__c = [];
		w.document.querySelectorAll('[role="option"]').forEach(o => {
			Object.defineProperty(o, 'offsetParent', { get: () => (o.dataset.hid === '1' ? null : w.document.body) });
			o.addEventListener('click', () => w.__c.push(o.querySelector('.option-title').textContent + (o.dataset.hid === '1' ? ':hidden' : '')));
		});
		return w;
	};
	const tabs = (panel, other = '') => '<button role="tab" aria-selected="true" aria-controls="pA">Active</button><button role="tab" aria-selected="false" aria-controls="pB">Other</button>'
		+ `<div role="tabpanel" id="pA">${panel}</div><div role="tabpanel" id="pB" style="display: none">${other}</div>`;

	console.log('\nMOB.364 - attach a form: premise names, the pick, armed, closed, server +1, card after reload');
	{
		const forms = (...names) => ({ data: { workStage: { id: FIX, forms: names.map((name, i) => ({ id: 'F' + i, name })) } } });
		const P = bodyOf(F364, 'PREMISE (server): read this stage');
		{ const w = w36('', { answer: forms('📊Datatype', ' ⚡Trigger '), ss: { __dd364_pick: 'stale' } });
			check('364 premise - names stashed trimmed, a killed run\'s pick cleared', t36(P, w) && w.sessionStorage.getItem('__dd364_before') === '["📊Datatype","⚡Trigger"]' && w.sessionStorage.getItem('__dd364_pick') === null, true); }
		check('MUST FAIL: 364 premise - another stage answered', t36(P, w36('', { answer: { data: { workStage: { id: 'EYRpYJ9QYdQ1JFF10JtB0Q', forms: [] } } } })), false);
		check('MUST FAIL: 364 premise - a GraphQL error', t36(P, w36('', { answer: { errors: [{ message: 'x' }] } })), false);

		const K = JSON.stringify(['📊Datatype', '⚡Trigger', '⚡Operating Status']);
		const pick = bodyOf(F364, 'FIXTURE GUARD + PICK');
		const pg = (list, ss = { __dd364_before: K }) => { const w = options(list); Object.entries(ss).forEach(([k, v]) => w.sessionStorage.setItem(k, v)); return w; };
		{ const w = pg([['📊Datatype'], ['🔎 Inspection', true], ['🔧 Repair'], ['📋General Form']]);
			check('364 pick - skips the held name and the hidden option: 🔧 Repair clicked once and kept', runJs(pick, w) && w.__c.join() === '🔧 Repair' && w.sessionStorage.getItem('__dd364_pick') === '🔧 Repair', true); }
		{ const w = pg([['📊Datatype'], ['⚡Trigger'], ['🔎 Inspection', true]]);
			check('MUST FAIL: 364 pick - only held names visible (the picker ran out - trap 10): nothing clicked or kept', runJs(pick, w) === false && w.__c.length === 0 && w.sessionStorage.getItem('__dd364_pick') === null, true); }
		{ const w = pg([]); check('MUST FAIL: 364 pick - no options at all', runJs(pick, w) === false, true); }
		{ const w = pg([['🔧 Repair']], {}); check('MUST FAIL: 364 pick - no premise names recorded: nothing clicked', runJs(pick, w) === false && w.__c.length === 0, true); }

		// cleanup (owner 2026-09-15): find this run's form, delete only it (one shot), ids back to the premise's
		{
			const fx = (list) => ({ data: { workStage: { id: FIX, forms: list.map(([id, name]) => ({ id, name })) } } });
			{ const P2 = bodyOf(F364, 'PREMISE (server): read this stage'); const w = w36('', { answer: fx([['F0', 'a'], ['F1', 'b']]), ss: { __dd364_new: 'OLD', __dd364_deleted: '1' } });
				check('364 premise - ids stashed, a killed run\'s delete licence cleared', t36(P2, w) && w.sessionStorage.getItem('__dd364_before_ids') === '["F0","F1"]' && w.sessionStorage.getItem('__dd364_new') === null && w.sessionStorage.getItem('__dd364_deleted') === null, true); }
			const IDS = { __dd364_before_ids: JSON.stringify(['F0', 'F1']), __dd364_pick: '🔧 Repair' };
			const FN = bodyOf(F364, 'CLEANUP (server): find the ONE form');
			{ const w = w36('', { answer: fx([['F0', 'a'], ['F1', 'b'], ['N9', '🔧 Repair']]), ss: IDS });
				check('364 find - the one new id named the pick is kept', t36(FN, w) && w.sessionStorage.getItem('__dd364_new') === 'N9', true); }
			{ const w = w36('', { answer: fx([['F0', 'a'], ['F1', 'b']]), ss: IDS });
				check('364 find - nothing attached: passes, nothing kept', t36(FN, w) && w.sessionStorage.getItem('__dd364_new') === null, true); }
			{ const w = w36('', { answer: fx([['F0', 'a'], ['F1', 'b'], ['N9', '🔎 Inspection']]), ss: IDS });
				check('MUST FAIL: 364 find - the new form is not the pick: nothing kept', t36(FN, w) === false && w.sessionStorage.getItem('__dd364_new') === null, true); }
			{ const w = w36('', { answer: fx([['F0', 'a'], ['N8', '🔧 Repair'], ['N9', '🔧 Repair']]), ss: IDS });
				check('MUST FAIL: 364 find - two new forms: nothing kept', t36(FN, w) === false && w.sessionStorage.getItem('__dd364_new') === null, true); }
			{ const w = w36('', { answer: fx([['N9', '🔧 Repair']]), ss: { __dd364_pick: '🔧 Repair' } });
				check('MUST FAIL: 364 find - no premise ids (no licence): nothing kept', t36(FN, w) === false && w.sessionStorage.getItem('__dd364_new') === null, true); }
			const DEL = bodyOf(F364, 'CLEANUP: delete THAT form');
			{ const w = w36('', { ss: { __dd364_new: 'N9', __dd364_before_ids: JSON.stringify(['F0', 'F1']) } });
				const ok = runJs(DEL, w);
				check('364 delete - one POST of deleteWorkStageForm for N9', ok && w.__posts.length === 1 && /deleteWorkStageForm/.test(w.__posts[0].query) && w.__posts[0].variables.id === 'N9', true);
				check('364 delete - a re-poll sends nothing more', runJs(DEL, w) && w.__posts.length === 1, true); }
			{ const w = w36('', { ss: { __dd364_before_ids: JSON.stringify(['F0']) } });
				check('364 delete - no new form kept: passes, sends nothing', runJs(DEL, w) && w.__posts.length === 0, true); }
			{ const w = w36('', { ss: { __dd364_new: 'F0', __dd364_before_ids: JSON.stringify(['F0', 'F1']) } });
				check('MUST FAIL: 364 delete - the id was on the stage before this run: nothing sent', runJs(DEL, w) === false && w.__posts.length === 0, true); }
			{ const w = w36('', { ss: { __dd364_new: 'N9' } });
				check('MUST FAIL: 364 delete - no premise ids: nothing sent', runJs(DEL, w) === false && w.__posts.length === 0, true); }
			const G = bodyOf(F364, '⭐ CLEANED (server)');
			const B = { __dd364_before_ids: JSON.stringify(['F0', 'F1']) };
			check('364 cleaned - ids exactly the premise\'s (any order)', t36(G, w36('', { answer: fx([['F1', 'b'], ['F0', 'a']]), ss: B })), true);
			check('MUST FAIL: 364 cleaned - this run\'s form still there', t36(G, w36('', { answer: fx([['F0', 'a'], ['F1', 'b'], ['N9', 'x']]), ss: B })), false);
			check('MUST FAIL: 364 cleaned - a form the stage held is gone', t36(G, w36('', { answer: fx([['F0', 'a']]), ss: B })), false);
			check('MUST FAIL: 364 cleaned - no premise ids', t36(G, w36('', { answer: fx([['F0', 'a'], ['F1', 'b']]) })), false);
		}
		const holds = bodyOf(F364, 'The picker now holds');
		const inp = (v) => `<div class="mantine-Modal-content"><input id="formId" value="${v}"></div>`;
		const R = { __dd364_pick: '🔧 Repair' };
		check('364 holds - #formId shows the picked name', runJs(holds, w36(inp('🔧 Repair'), { ss: R })), true);
		check('MUST FAIL: 364 holds - another form selected', runJs(holds, w36(inp('🔎 Inspection'), { ss: R })), false);
		check('MUST FAIL: 364 holds - nothing selected', runJs(holds, w36(inp(''), { ss: R })), false);
		check('MUST FAIL: 364 holds - no pick recorded', runJs(holds, w36(inp('🔧 Repair'))), false);

		const armed = bodyOf(F364, 'Submit is ARMED');
		check('364 armed - button[form=adhoc-form] type=submit', runJs(armed, w36('<form id="adhoc-form"></form><button form="adhoc-form" type="submit">Submit</button>')), true);
		check('MUST FAIL: 364 armed - type=button (nothing picked yet)', runJs(armed, w36('<button form="adhoc-form" type="button">Submit</button>')), false);
		check('MUST FAIL: 364 armed - only another form is armed', runJs(armed, w36('<button form="work-collection-form" type="submit">Submit</button>')), false);

		const closed = bodyOf(F364, 'The add-form modal closed');
		const ADD = '<button><span><svg></svg></span><span>Add</span></button>';
		check('364 closed - no #adhoc-form, the tab\'s Add is back', runJs(closed, w36(ADD)), true);
		check('MUST FAIL: 364 closed - the modal form is still mounted', runJs(closed, w36(ADD + '<form id="adhoc-form"></form>')), false);
		check('MUST FAIL: 364 closed - a blank page (no Add)', runJs(closed, w36('')), false);

		const proof = bodyOf(F364, 'SERVER: exactly ONE more form');
		const SS = { __dd364_before: K, __dd364_pick: '🔧 Repair' };
		const pr = (answer, ss = SS) => t36(proof, w36('', { answer, ss }));
		check('364 server - one more form, the picked one', pr(forms('🔧 Repair', '📊Datatype', '⚡Trigger', '⚡Operating Status')), true);
		check('MUST FAIL: 364 server - nothing added (the optimistic add was refused)', pr(forms('📊Datatype', '⚡Trigger', '⚡Operating Status')), false);
		check('MUST FAIL: 364 server - one more, but another template', pr(forms('🔎 Inspection', '📊Datatype', '⚡Trigger', '⚡Operating Status')), false);
		check('MUST FAIL: 364 server - the pick added twice', pr(forms('🔧 Repair', '🔧 Repair', '📊Datatype', '⚡Trigger', '⚡Operating Status')), false);
		check('MUST FAIL: 364 server - the pick is a name the stage already held', pr(forms('📊Datatype', '📊Datatype', '⚡Trigger', '⚡Operating Status'), { __dd364_before: K, __dd364_pick: '📊Datatype' }), false);
		check('MUST FAIL: 364 server - no premise recorded', pr(forms('🔧 Repair'), R), false);

		const card = bodyOf(F364, 'After a RELOAD the Forms tab');
		const paper = (t) => `<div class="mantine-Paper-root"><div><h1 class="mantine-Title-root">${t}</h1></div><p>desc</p></div>`;
		check('364 card - exactly one card titled with the pick in the active panel', runJs(card, w36(tabs(paper('🔧 Repair') + paper('📊Datatype')), { ss: R })), true);
		check('MUST FAIL: 364 card - absent after the reload', runJs(card, w36(tabs(paper('📊Datatype')), { ss: R })), false);
		check('MUST FAIL: 364 card - two cards with the name', runJs(card, w36(tabs(paper('🔧 Repair') + paper('🔧 Repair')), { ss: R })), false);
		check('MUST FAIL: 364 card - only in an INACTIVE panel', runJs(card, w36(tabs(paper('📊Datatype'), paper('🔧 Repair')), { ss: R })), false);
		check('MUST FAIL: 364 card - no pick recorded', runJs(card, w36(tabs(paper('🔧 Repair')))), false);

		const clean = bodyOf(F364, 'Remove this test');
		const wc = w36('', { ss: { __dd364_before: K, __dd364_pick: 'x', other: 'keep' } });
		check('364 cleanup - both keys removed, others kept', runJs(clean, wc) && wc.sessionStorage.length === 1 && wc.sessionStorage.getItem('other') === 'keep', true);
	}

	console.log('\nMOB.365 - reassign and restore: premise stamps, picks, keep toggle, armed, closed, server sets, the net');
	{
		const ADMIN = 'l4Jlk4ExMY005JZAF8hclQ', AE = 'thtNo1Nd9th9FRNNoAN5Il';
		const REST = ['l4Jlk4ExMY005JZAF8hclQ', 'cc5MgMoo1h9VJBZtB4ZNFR', '1ck5xMQ4IMV0BgRx0xsUdk', '5Ylk1wIhslMR8lsg8NAQxA', 'kkBtBwZoBlpcw84F4F9B8s', 'BVM9Bxkpox9BlEYd8sp0NR', 'cQVVNJU5cFEU9RwIhw0Aps', 'kx5sw1dVUFMYFs0UA08Z5M'];
		const FWD = REST.filter(i => i !== ADMIN).concat(AE), KEPT = REST.concat(AE);
		const crews = (ids, { x = [[AE, 'Account Executive']], sched = [] } = {}) => ({ data: { a: { edges: ids.map(id => ({ id, name: 'n-' + id })) }, x: { edges: x.map(([id, name]) => ({ id, name })) }, workStage: { id: FIX, scheduleDates: sched } } });
		const P = bodyOf(F365, 'PREMISE (server): the stage');
		{ const w = w36('', { answer: crews([...REST].reverse()), ss: { __dd365_net: '1', __dd365_keep: '1' } });
			check('365 premise - the rest set in any order, target offered, no schedule: stamped rest, a killed run\'s net/keep keys cleared', t36(P, w) && w.sessionStorage.getItem('__dd365_premise') === 'rest' && w.sessionStorage.getItem('__dd365_net') === null && w.sessionStorage.getItem('__dd365_keep') === null, true); }
		{ const w = w36('', { answer: crews(FWD, { x: [] }) });
			check('MUST FAIL: 365 premise - a died run left Admin off and the target on: red, stamped leftover for the net', t36(P, w) === false && w.sessionStorage.getItem('__dd365_premise') === 'leftover', true); }
		{ const w = w36('', { answer: crews(KEPT, { x: [] }) });
			check('MUST FAIL: 365 premise - the target still on beside Admin: red, stamped leftover', t36(P, w) === false && w.sessionStorage.getItem('__dd365_premise') === 'leftover', true); }
		{ const w = w36('', { answer: crews(REST.slice(1)) });
			check('MUST FAIL: 365 premise - a crew missing (a state this test never makes): red and NOT stamped', t36(P, w) === false && w.sessionStorage.getItem('__dd365_premise') === null, true); }
		check('MUST FAIL: 365 premise - a schedule entry the REMOVE would delete', t36(P, w36('', { answer: crews(REST, { sched: [{ id: 'E1' }] }) })), false);
		check('MUST FAIL: 365 premise - the picker search does not offer the target\'s id', t36(P, w36('', { answer: crews(REST, { x: [['OTHER', 'Account Executive']] }) })), false);

		const pickAE = bodyOf(F365, 'Pick "Account Executive"'), pickAd = bodyOf(F365, 'Pick "Admin"');
		{ const w = options([['Account Executive', true], ['Account Executive'], ['Accountant']]); check('365 pick - the VISIBLE Account Executive, not its hidden twin', runJs(pickAE, w) && w.__c.join() === 'Account Executive', true); }
		{ const w = options([['Administrator'], ['General Administrator'], ['Admin']]); check('365 pick - exactly `Admin`, not Administrator', runJs(pickAd, w) && w.__c.join() === 'Admin', true); }
		{ const w = options([['Administrator'], ['IT Administrator']]); check('MUST FAIL: 365 pick - no exact `Admin` (still assigned): nothing clicked', runJs(pickAd, w) === false && w.__c.length === 0, true); }
		{ const w = options([['Account Executive', true]]); check('MUST FAIL: 365 pick - only a hidden option (dropdown closed): nothing clicked', runJs(pickAE, w) === false && w.__c.length === 0, true); }
		const crewInput = (v) => `<form id="crewform"><input id="crewId" value="${v}"></form>`;
		const holdsAE = bodyOf(F365, 'The crew field now holds "Account Executive"');
		check('365 holds - #crewId shows Account Executive', runJs(holdsAE, w36(crewInput('Account Executive'))), true);
		check('MUST FAIL: 365 holds - still the typed search', runJs(holdsAE, w36(crewInput('Account Exec'))), false);
		check('MUST FAIL: 365 holds - Accountant', runJs(holdsAE, w36(crewInput('Accountant'))), false);
		const holdsAd = bodyOf(F365, 'The crew field now holds "Admin"');
		check('365 holds - #crewId shows Admin', runJs(holdsAd, w36(crewInput('Admin'))), true);
		check('MUST FAIL: 365 holds - Administrator', runJs(holdsAd, w36(crewInput('Administrator'))), false);

		const sw = (checked) => `<div class="react-switch"><div class="react-switch-bg"></div><input type="checkbox" role="switch" id="keepAssignment"${checked ? ' checked' : ''}></div>`;
		const off = bodyOf(F365, 'is OFF (the default)');
		check('365 keep off - unchecked', runJs(off, w36(sw(false))), true);
		check('MUST FAIL: 365 keep off - checked (the save would skip the REMOVE)', runJs(off, w36(sw(true))), false);
		check('MUST FAIL: 365 keep off - no switch rendered', runJs(off, w36('')), false);
		const on = bodyOf(F365, 'Turn "Keep local copy of work?" ON');
		const swc = (checked, block = false) => { const w = w36(sw(checked)); w.__n = 0; w.document.getElementById('keepAssignment').addEventListener('click', (e) => { w.__n++; if (block) e.preventDefault(); }); return w; };
		{ const w = swc(false); check('365 keep on - unchecked: clicked ONCE across two polls, now checked', t36(on, w) && w.__n === 1 && w.document.getElementById('keepAssignment').checked, true); }
		{ const w = swc(true); check('365 keep on - already on: no click', runJs(on, w) && w.__n === 0, true); }
		{ const w = swc(false, true); check('MUST FAIL: 365 keep on - the click did not take: false, and no second click on the next poll', t36(on, w) === false && w.__n === 1, true); }
		check('MUST FAIL: 365 keep on - no switch', runJs(on, w36('')), false);

		const armed = bodyOf(F365, 'SUBMIT is ARMED');
		const form = (type) => `<form id="crewform"><input id="crewId"><button type="${type}">SUBMIT</button></form>`;
		check('365 armed - the crew form\'s SUBMIT is type=submit', runJs(armed, w36(form('submit'))), true);
		check('MUST FAIL: 365 armed - type=button (no crew picked yet)', runJs(armed, w36(form('button'))), false);
		check('MUST FAIL: 365 armed - a SUBMIT outside #crewform', runJs(armed, w36('<form id="adhoc-form"><button type="submit">SUBMIT</button></form>')), false);

		const closed = bodyOf(F365, 'The crew modal closed');
		const ASSIGN = '<button><span><svg></svg></span><span>Assign Work Stage</span></button>';
		check('365 closed - no #crewform, Assign Work Stage back', runJs(closed, w36(ASSIGN)), true);
		check('MUST FAIL: 365 closed - the crew form still open', runJs(closed, w36(ASSIGN + form('submit'))), false);
		check('MUST FAIL: 365 closed - a blank page', runJs(closed, w36('')), false);

		const S = (frag, ids) => t36(bodyOf(F365, frag), w36('', { answer: crews(ids) }));
		check('365 saved - Admin off, the target on, the other 7 intact', S('SERVER: SAVED', FWD), true);
		check('MUST FAIL: 365 saved - the REMOVE never landed (Admin still on)', S('SERVER: SAVED', KEPT), false);
		check('MUST FAIL: 365 saved - the ADD never landed', S('SERVER: SAVED', REST.filter(i => i !== ADMIN)), false);
		check('MUST FAIL: 365 saved - another crew went too', S('SERVER: SAVED', FWD.slice(1)), false);
		check('365 UI restore - Admin back beside the kept target', S('RESTORE (UI, server)', KEPT), true);
		check('MUST FAIL: 365 UI restore - Admin not back', S('RESTORE (UI, server)', FWD), false);
		check('MUST FAIL: 365 UI restore - the target already gone (not what the keep path leaves)', S('RESTORE (UI, server)', REST), false);
		check('365 restored - exactly the rest set', S('RESTORED (server): the stage', REST), true);
		check('MUST FAIL: 365 restored - the target still on', S('RESTORED (server): the stage', KEPT), false);
		check('MUST FAIL: 365 restored - Admin still off', S('RESTORED (server): the stage', FWD), false);

		const net = bodyOf(F365, 'NET (always)');
		{ const w = w36('', { ss: { __dd365_premise: 'rest' } }); runJs(net, w); runJs(net, w); const p = w.__posts;
			check('365 net - stamped: ONE remove of the TARGET crew + ONE add of Admin on the fixture, not repeated on a re-poll',
				p.length === 2 && /removeWorkStageFromCrew/.test(p[0].query) && p[0].variables.crew === AE && JSON.stringify(p[0].variables.ids) === JSON.stringify([FIX])
				&& /addAssignmentToWorkStage/.test(p[1].query) && p[1].variables.data.roleId === ADMIN && p[1].variables.id === FIX, true); }
		{ const w = w36('', { ss: { __dd365_premise: 'leftover' } }); runJs(net, w); check('365 net - a leftover stamp restores too', w.__posts.length === 2, true); }
		{ const w = w36(''); runJs(net, w); check('MUST FAIL: 365 net - no premise stamp: any request is a bug', w.__posts.length > 0, false); }
		{ const w = w36('', { ss: { __dd365_premise: 'rest' } }); runJs(net, w); check('MUST FAIL: 365 net - it never removes Admin', w.__posts.some(p => /removeWorkStageFromCrew/.test(p.query) && p.variables.crew === ADMIN), false); }

		const clean = bodyOf(F365, 'Remove this test');
		const wc = w36('', { ss: { __dd365_premise: 'rest', __dd365_net: '1', __dd365_keep: '1', other: 'keep' } });
		check('365 cleanup - the three keys removed, others kept', runJs(clean, wc) && wc.sessionStorage.length === 1 && wc.sessionStorage.getItem('other') === 'keep', true);
	}

	console.log('\nMOB.363 - stage photo: premise, panel, strict reveal, landed, server stash, guarded gear, menu, gone');
	{
		const st = (atts, { copy = false, assets = [[TANK, '⚡ Tank 0000']], assetAtts = ['dt8l'], id = FIX } = {}) => ({ data: {
			workStage: { id, mobileTemplate: { copyAttachmentToAsset: copy }, assets: assets.map(([i, n]) => ({ assetId: { id: i, name: n } })),
				attachments: atts.map(([i, t]) => ({ id: i, fileName: 'shot.png', fileType: t || 'image/png' })) },
			asset: { id: TANK, attachments: assetAtts.map(i => ({ id: i })) } } });
		const P = bodyOf(F363, 'PREMISE (server): the stage holds NO attachments');
		{ const w = w36('', { answer: st([]), ss: { __dd363_id: 'STALE' } }); check('363 premise - none, no copy, the one Tank asset; a killed run\'s id cleared', t36(P, w) && w.sessionStorage.getItem('__dd363_id') === null, true); }
		check('MUST FAIL: 363 premise - a leftover photo from a died run', t36(P, w36('', { answer: st([['OLD']]) })), false);
		check('MUST FAIL: 363 premise - the template copies photos to the asset', t36(P, w36('', { answer: st([], { copy: true }) })), false);
		check('MUST FAIL: 363 premise - copyAttachmentToAsset null (not the measured false)', t36(P, w36('', { answer: st([], { copy: null }) })), false);
		check('MUST FAIL: 363 premise - a second asset', t36(P, w36('', { answer: st([], { assets: [[TANK, '⚡ Tank 0000'], ['oB5B', 'Pump 0102']] }) })), false);
		check('MUST FAIL: 363 premise - the one asset is Pump 0102', t36(P, w36('', { answer: st([], { assets: [['oB5B', 'Pump 0102']] }) })), false);
		check('MUST FAIL: 363 premise - another stage answered', t36(P, w36('', { answer: st([], { id: 'EYRpYJ9QYdQ1JFF10JtB0Q' }) })), false);

		const slide = (src) => `<div class="mantine-Carousel-slide"><div><img src="${src}" alt="shot.png"><div><button aria-label="Settings"></button></div></div></div>`;
		const url = (id) => `/api/attachment/${id}?org=SMCT2&t=1`;
		const panel = (slides, btns = '<button>Add Photo</button>') => tabs(`<div class="mantine-SegmentedControl-root"></div>${slides}${btns}`);
		const rest = bodyOf(F363, 'PHOTOS panel at rest');
		check('363 rest - Add Photo, no Add File, no slides', runJs(rest, w36(panel(''))), true);
		check('MUST FAIL: 363 rest - a slide already there', runJs(rest, w36(panel(slide(url('OLD'))))), false);
		check('MUST FAIL: 363 rest - the Docs segment (Add File)', runJs(rest, w36(panel('', '<button>Add File</button>'))), false);
		check('MUST FAIL: 363 rest - Add Photo only in an inactive panel', runJs(rest, w36(tabs('', '<button>Add Photo</button>'))), false);

		const reveal = bodyOf(F363, 'Reveal the ONE gallery input');
		const inputs = (w, list) => { list.forEach(([accept, cap]) => { const i = w.document.createElement('input'); i.type = 'file'; i.setAttribute('accept', accept); if (cap) i.capture = cap; w.document.body.appendChild(i); }); return w; };
		{ const w = inputs(w36('<input type="file" accept="*/*" data-dd-upload="1">'), [['image/*', 'environment'], ['image/*', null]]);
			const ok = runJs(reveal, w), tagged = [...w.document.querySelectorAll('[data-dd-upload]')];
			check('363 reveal - ONLY the gallery input is tagged (not the camera twin, whose capture is a property; the stale */* tag cleared)', ok && tagged.length === 1 && tagged[0].getAttribute('accept') === 'image/*' && !tagged[0].capture, true); }
		check('MUST FAIL: 363 reveal - picker not open (only the camera input)', runJs(reveal, inputs(w36(''), [['image/*', 'environment']])), false);
		check('MUST FAIL: 363 reveal - two gallery inputs (ambiguous)', runJs(reveal, inputs(w36(''), [['image/*', null], ['image/*', null]])), false);
		check('MUST FAIL: 363 reveal - only the Docs FileButton (*/*)', runJs(reveal, inputs(w36(''), [['*/*', null]])), false);

		const landed = bodyOf(F363, 'UPLOAD LANDED');
		check('363 landed - one slide on its server URL', runJs(landed, w36(panel(slide(url('NEW1'))))), true);
		check('MUST FAIL: 363 landed - still the blob: preview', runJs(landed, w36(panel(slide('blob:https://dev.mentorapm.com/abc')))), false);
		check('MUST FAIL: 363 landed - no slide', runJs(landed, w36(panel(''))), false);
		check('MUST FAIL: 363 landed - two slides', runJs(landed, w36(panel(slide(url('A')) + slide(url('B'))))), false);

		const stash = bodyOf(F363, 'SERVER: the stage holds exactly ONE attachment');
		{ const w = w36('', { answer: st([['NEW1']]) }); check('363 stash - one image, not on the asset: its id kept', t36(stash, w) && w.sessionStorage.getItem('__dd363_id') === 'NEW1', true); }
		{ const w = w36('', { answer: st([]) }); check('MUST FAIL: 363 stash - none (the upload never reached the server): nothing kept', t36(stash, w) === false && w.sessionStorage.getItem('__dd363_id') === null, true); }
		check('MUST FAIL: 363 stash - two attachments', t36(stash, w36('', { answer: st([['A'], ['B']]) })), false);
		check('MUST FAIL: 363 stash - not an image', t36(stash, w36('', { answer: st([['A', 'application/pdf']]) })), false);
		{ const w = w36('', { answer: st([['NEW1']], { assetAtts: ['dt8l', 'NEW1'] }) }); check('MUST FAIL: 363 stash - the asset holds it too (copied): nothing kept', t36(stash, w) === false && w.sessionStorage.getItem('__dd363_id') === null, true); }

		const guard = bodyOf(F363, 'GUARD + open the gear');
		const gw = (html, id = 'NEW1') => { const w = w36(html, { ss: id ? { __dd363_id: id } : {} }); w.__g = 0; w.document.querySelectorAll('[aria-label="Settings"]').forEach(g => g.addEventListener('click', () => w.__g++)); return w; };
		{ const w = gw(panel(slide(url('NEW1')))); check('363 guard - the one slide IS the kept id: its gear clicked once', runJs(guard, w) && w.__g === 1, true); }
		{ const w = gw(panel(slide(url('OTHER')))); check('MUST FAIL: 363 guard - the slide is another attachment: no gear clicked', runJs(guard, w) === false && w.__g === 0, true); }
		{ const w = gw(panel(slide(url('NEW1')) + slide(url('OTHER')))); check('MUST FAIL: 363 guard - two slides: no gear clicked', runJs(guard, w) === false && w.__g === 0, true); }
		{ const w = gw(panel(slide(url('NEW1'))), null); check('MUST FAIL: 363 guard - no id kept: no gear clicked', runJs(guard, w) === false && w.__g === 0, true); }
		{ const w = gw(tabs('', slide(url('NEW1')))); check('MUST FAIL: 363 guard - the slide only in an inactive panel: no gear clicked', runJs(guard, w) === false && w.__g === 0, true); }

		const menu = bodyOf(F363, 'MENU (stage photo)');
		const dd = (...items) => `<div class="mantine-Menu-dropdown">${items.map(t => `<button class="mantine-Menu-item"><div class="mantine-Menu-itemSection"><svg></svg></div><div class="mantine-Menu-itemLabel">${t}</div></button>`).join('')}</div>`;
		check('363 menu - View in Fullscreen · Copy to asset · Delete Photo', runJs(menu, w36(dd('View in Fullscreen', 'Copy to asset', 'Delete Photo'))), true);
		check('MUST FAIL: 363 menu - no stage items (a stage with no assets)', runJs(menu, w36(dd('View in Fullscreen'))), false);
		check('MUST FAIL: 363 menu - reordered', runJs(menu, w36(dd('View in Fullscreen', 'Delete Photo', 'Copy to asset'))), false);
		check('MUST FAIL: 363 menu - two dropdowns open', runJs(menu, w36(dd('View in Fullscreen', 'Copy to asset', 'Delete Photo') + dd('Edit Item'))), false);

		const gone = bodyOf(F363, "SERVER: the stage's attachments are back to NONE");
		const G = { __dd363_id: 'NEW1' };
		check('363 gone - no attachments, and the asset never held it', t36(gone, w36('', { answer: st([]), ss: G })), true);
		check('MUST FAIL: 363 gone - still there', t36(gone, w36('', { answer: st([['NEW1']]), ss: G })), false);
		check('MUST FAIL: 363 gone - on the asset (a copy survived)', t36(gone, w36('', { answer: st([], { assetAtts: ['NEW1'] }), ss: G })), false);
		check('MUST FAIL: 363 gone - no id kept (vacuous)', t36(gone, w36('', { answer: st([]) })), false);

		const empty = bodyOf(F363, 'The Photos panel shows no slides again');
		check('363 empty - no slides, Add Photo', runJs(empty, w36(panel(''))), true);
		check('MUST FAIL: 363 empty - the slide still shown', runJs(empty, w36(panel(slide(url('NEW1'))))), false);
		check('MUST FAIL: 363 empty - a blank panel (no Add Photo)', runJs(empty, w36(panel('', ''))), false);

		const clean = bodyOf(F363, "Remove this test's sessionStorage key");
		const wc = w36('', { ss: { __dd363_id: 'NEW1', other: 'keep' } });
		check('363 cleanup - the id key removed, others kept', runJs(clean, wc) && wc.sessionStorage.length === 1 && wc.sessionStorage.getItem('other') === 'keep', true);
	}
}

/* ===========================================================================================
 * MOB.352 / MOB.353 - self-restoring writes on the fixture work order (build_work_location_save_test.py,
 * build_asset_status_write_test.py).
 * MOB.352: LocationForm.tsx - `#address` TextInput, `#x`/`#y` NumberInputs and a `type="submit"` SUBMIT
 *   INSIDE `<form id="locationform">` (measured); the detail page's own form sits behind with an
 *   `#address` of its own and a `Submit` bound by `form="mobile-genInfo"` (trap 3).
 * MOB.353: AssetStatus.tsx - `Progress: <Badge>` is the Menu target (`aria-haspopup="menu"`,
 *   `aria-expanded`), items are `.mantine-Menu-item` buttons in `.mantine-Menu-dropdown`; the rows are
 *   Accordion items in the Assets tab's panel (Assets/index.tsx).
 * Both: server reads via dd_tools.server_read_js; the BACKSTOPs read first and send the fixed rest
 *   values only when the server is not at rest.
 * ========================================================================================= */
{
	const F352 = 'MOB.352_Work_Location_Save.json';
	const F353 = 'MOB.353_Work_Asset_Status_Write.json';
	const WO = 'EYRpYJ9QYdQ1JFF10JtB0Q';
	const sync = (v) => ({ then(f) { try { const r = f(v); return r && r.then ? r : sync(r); } catch (e) { return fail(e); } }, catch() { return this; } });
	const fail = (e) => ({ then() { return this; }, catch(f) { f(e); return sync(undefined); } });
	const pg = (html, { answers = [{ data: {} }], ss = {} } = {}) => {
		const w = new JSDOM('<body></body>', { url: `https://dev.mentorapm.com/apm-mobile/work/${WO}` }).window;
		w.document.body.innerHTML = html;
		for (const [k, v] of Object.entries(ss)) w.sessionStorage.setItem(k, v);
		w.__posts = [];
		w.fetch = (url, opts) => {
			w.__posts.push({ url, opts, body: JSON.parse(opts.body) });
			const a = answers[Math.min(w.__posts.length, answers.length) - 1];
			return a instanceof Error ? fail(a) : sync({ json: () => sync(a) });
		};
		return w;
	};
	const twice = (body, w) => { runJs(body, w); return runJs(body, w); };

	// ---- MOB.352 ----------------------------------------------------------------------------
	const RA = '230 North Alexander Street, New Orleans, LA 70119', RX = '-90.1025785', RY = '29.9782827';
	const MA = 'DD MOB.352 LOCATION SAVE', MX = '-90.0812', MY = '29.9511';
	const loc = ({ address = RA, x = RX, y = RY, submit = 'submit', form = true, tabs = true } = {}) =>
		(tabs ? '<button role="tab" data-active="true">General Info</button>' : '')
		+ '<form id="mobile-genInfo"><input id="address" value="GENINFO ADDRESS"><input id="x" value="1"></form><button type="button" form="mobile-genInfo">Submit</button>'
		+ (form ? `<section class="mantine-Modal-content"><form id="locationform"><label for="address">Address</label>`
			+ `<input id="address" class="mantine-TextInput-input" value="${address}"><input id="x" class="mantine-NumberInput-input" value="${x}">`
			+ `<input id="y" class="mantine-NumberInput-input" value="${y}"><button type="${submit}">SUBMIT</button></form></section>` : '');
	const L = {
		prefill: bodyOf(F352, 'PREFILLED with the rest values'),
		holdsMark: bodyOf(F352, 'now holds the marker values'),
		holdsRest: bodyOf(F352, 'now holds the rest values'),
		clearA: bodyOf(F352, "Clear the form's Address"),
		clearX: bodyOf(F352, "Clear the form's X"),
		clearY: bodyOf(F352, "Clear the form's Y"),
		armed: bodyOf(F352, 'Submit is ARMED'),
		closed: bodyOf(F352, 'location form is GONE'),
		premise: bodyOf(F352, 'PREMISE (server)'),
		mark: bodyOf(F352, 'SERVER: the stage now holds'),
		restored: bodyOf(F352, 'RESTORED (server)'),
		atRest: bodyOf(F352, 'AT REST (server)'),
		backstop: bodyOf(F352, 'BACKSTOP'),
	};
	const ws = (o = {}) => ({ data: { workStage: { id: WO, status: 'Ready', address: RA, x: Number(RX), y: Number(RY), ...o } } });
	console.log('\nMOB.352_Work_Location_Save - the form scoped to #locationform, the server reads and the backstop');
	check('352 prefill - the form holds the rest values', runJs(L.prefill, pg(loc())), true);
	check('MUST FAIL: 352 prefill - another address', runJs(L.prefill, pg(loc({ address: MA }))), false);
	check('MUST FAIL: 352 prefill - x differs', runJs(L.prefill, pg(loc({ x: MX }))), false);
	check('MUST FAIL: 352 prefill - y empty (Number("") is 0, must not pass)', runJs(L.prefill, pg(loc({ y: '' }))), false);
	check('MUST FAIL: 352 prefill - the form is not open', runJs(L.prefill, pg(loc({ form: false }))), false);
	check('352 holds marker - after typing', runJs(L.holdsMark, pg(loc({ address: MA, x: MX, y: MY }))), true);
	check('MUST FAIL: 352 holds marker - x still at rest (the type did not land)', runJs(L.holdsMark, pg(loc({ address: MA, y: MY }))), false);
	check('352 holds rest - after the restore typing', runJs(L.holdsRest, pg(loc())), true);
	check('MUST FAIL: 352 holds rest - the marker address remains', runJs(L.holdsRest, pg(loc({ address: MA }))), false);
	for (const [fid, body] of [['address', L.clearA], ['x', L.clearX], ['y', L.clearY]]) {
		const w = pg(loc());
		const el = w.document.getElementById('locationform').querySelector('#' + fid);
		let events = 0; el.addEventListener('input', () => events++);
		const behind = w.document.getElementById('mobile-genInfo').querySelector('#address').value;
		check(`352 clear ${fid} - the FORM's #${fid} is emptied with one input event; the page's own #address untouched`,
			runJs(body, w) && el.value === '' && events === 1 && w.document.getElementById('mobile-genInfo').querySelector('#address').value === behind, true);
	}
	check('MUST FAIL: 352 clear x - the location form is not open (only the page\'s #x exists)', runJs(L.clearX, pg(loc({ form: false }))), false);
	check('352 armed - SUBMIT type="submit" inside #locationform', runJs(L.armed, pg(loc())), true);
	check('MUST FAIL: 352 armed - SUBMIT is type="button" (invalid form)', runJs(L.armed, pg(loc({ submit: 'button' }))), false);
	check('MUST FAIL: 352 armed - only the page\'s own Submit (form closed)', runJs(L.armed, pg(loc({ form: false }))), false);
	check('352 closed - no #locationform, tabs alive', runJs(L.closed, pg(loc({ form: false }))), true);
	check('MUST FAIL: 352 closed - the form is still open', runJs(L.closed, pg(loc())), false);
	check('MUST FAIL: 352 closed - a blank page (no tabs)', runJs(L.closed, pg(loc({ form: false, tabs: false }))), false);
	check('352 premise - rest values and Ready', twice(L.premise, pg('', { answers: [ws()] })), true);
	check('MUST FAIL: 352 premise - status not Ready', twice(L.premise, pg('', { answers: [ws({ status: 'InProgress' })] })), false);
	check('MUST FAIL: 352 premise - a leftover marker address', twice(L.premise, pg('', { answers: [ws({ address: MA })] })), false);
	check('MUST FAIL: 352 premise - x null', twice(L.premise, pg('', { answers: [ws({ x: null })] })), false);
	check('352 mark - the server holds the marker', twice(L.mark, pg('', { answers: [ws({ address: MA, x: Number(MX), y: Number(MY) })] })), true);
	check('MUST FAIL: 352 mark - still at rest (the save never landed)', twice(L.mark, pg('', { answers: [ws()] })), false);
	check('MUST FAIL: 352 mark - address saved, y not', twice(L.mark, pg('', { answers: [ws({ address: MA, x: Number(MX) })] })), false);
	check('352 restored - rest values', twice(L.restored, pg('', { answers: [ws()] })), true);
	check('MUST FAIL: 352 restored - still the marker', twice(L.restored, pg('', { answers: [ws({ address: MA, x: Number(MX), y: Number(MY) })] })), false);
	check('352 at rest - rest values and Ready', twice(L.atRest, pg('', { answers: [ws()] })), true);
	check('MUST FAIL: 352 at rest - status changed', twice(L.atRest, pg('', { answers: [ws({ status: 'Complete' })] })), false);
	check('MUST FAIL: 352 at rest - GraphQL errors', twice(L.atRest, pg('', { answers: [{ errors: [{ message: 'nope' }] }] })), false);
	{
		const w = pg('', { answers: [ws()] });
		const first = runJs(L.backstop, w), second = runJs(L.backstop, w);
		check('352 backstop - at rest: asks once, sends NO mutation, then true', first === false && second === true && w.__posts.length === 1
			&& /workStage/.test(w.__posts[0].body.query) && w.__posts[0].body.variables.id === WO && !w.sessionStorage.getItem('__dd352_net:sent'), true);
	}
	{
		const w = pg('', { answers: [ws({ address: MA, x: Number(MX), y: Number(MY) }), { data: { updateWorkStage: { id: WO } } }] });
		runJs(L.backstop, w); const done = runJs(L.backstop, w); runJs(L.backstop, w);
		const m = (w.__posts[1] || {}).body || {};
		check('352 backstop - at the marker: ONE updateWorkStage with the fixed rest values, then true, never repeated',
			done === true && w.__posts.length === 2 && /updateWorkStage\(/.test(m.query) && m.variables.id === WO
			&& m.variables.data.address === RA && m.variables.data.x === Number(RX) && m.variables.data.y === Number(RY), true);
		check('MUST FAIL: 352 backstop - at rest it must not write (a write is the failure this case catches)',
			(() => { const v = pg('', { answers: [ws()] }); twice(L.backstop, v); return v.__posts.length !== 1; })(), false);
	}
	{
		const w = pg('', { answers: [{ data: { workStage: null } }, { data: {} }] });
		twice(L.backstop, w);
		check('352 backstop - the read came back empty: it still sends the rest values', w.__posts.length === 2 && /updateWorkStage\(/.test(w.__posts[1].body.query), true);
	}

	// ---- MOB.353 ----------------------------------------------------------------------------
	const COMMENT = 'Chemical dosing pump, model PDM 2000, plastic housing with digital control panel, horizontal mount.';
	const LINK = 'AE09h8JhBBhMtd1wIs98lQ';
	const assets = ({ rows = [['Pump 0102', 'Active', 'false']], active = 'Assets', menu = null } = {}) =>
		`<button role="tab" aria-selected="${active === 'General Info'}"${active === 'General Info' ? ' data-active="true"' : ''} aria-controls="pg">General Info</button>`
		+ `<button role="tab" aria-selected="${active === 'Assets'}"${active === 'Assets' ? ' data-active="true"' : ''} aria-controls="pa">Assets</button>`
		+ '<div role="tabpanel" id="pg"></div><div role="tabpanel" id="pa">'
		+ rows.map(([name, badge, exp]) => `<div class="mantine-Accordion-item"><span class="mantine-Accordion-control"><span class="mantine-Text-root">${name}</span>`
			+ `<span class="mantine-Text-root" aria-haspopup="menu" aria-expanded="${exp}">Progress: <div class="mantine-Badge-root"><span class="mantine-Badge-label">${badge}</span></div></span></span></div>`).join('')
		+ '</div>'
		+ (menu ? `<div class="mantine-Menu-dropdown">${menu.map(t => `<button class="mantine-Menu-item"><div class="mantine-Menu-itemSection"></div><div class="mantine-Menu-itemLabel">${t}</div></button>`).join('')}</div>` : '');
	const FROM_ACTIVE = ['Mark as No Status', 'Mark as Completed', 'Mark as Not Completed', 'Mark as Canceled'];
	const FROM_COMPLETED = ['Mark as No Status', 'Mark as Active', 'Mark as Not Completed', 'Mark as Canceled'];
	const S = {
		rowActive: bodyOf(F353, 'with the badge `Active`'),
		rowCompleted: bodyOf(F353, 'with the badge `Completed`'),
		guardWrite: bodyOf(F353, 'the badge reads `Active`) and offers'),
		guardRestore: bodyOf(F353, 'the badge reads `Completed`) and offers'),
		cacheCompleted: bodyOf(F353, 'badge now reads `Completed`'),
		premise: bodyOf(F353, 'PREMISE (server)'),
		completed: bodyOf(F353, 'is now `Completed`'),
		restored: bodyOf(F353, 'RESTORED (server)'),
		atRest: bodyOf(F353, 'AT REST (server)'),
		backstop: bodyOf(F353, 'BACKSTOP'),
	};
	const link = (o = {}, stage = 'Ready', extra = []) => ({ data: { workStage: { id: WO, status: stage, assets: [
		{ id: LINK, status: 'Active', sequence: 1, comment: COMMENT, asset: { id: 'oB5BUN1Es1Jctw8FVYwYBh', name: 'Pump 0102' }, ...o }, ...extra] } } });
	console.log('\nMOB.353_Work_Asset_Status_Write - the one row, the guard before a no-confirm write, the server reads and the backstop');
	check('353 row - one Pump 0102 row, badge Active, Assets active', runJs(S.rowActive, pg(assets())), true);
	check('MUST FAIL: 353 row - badge Completed', runJs(S.rowActive, pg(assets({ rows: [['Pump 0102', 'Completed', 'false']] }))), false);
	check('MUST FAIL: 353 row - a second asset row (a leftover link)', runJs(S.rowActive, pg(assets({ rows: [['Bypass Valve 0001', 'Active', 'false'], ['Pump 0102', 'Active', 'false']] }))), false);
	check('MUST FAIL: 353 row - the one row is another asset', runJs(S.rowActive, pg(assets({ rows: [['Bypass Valve 0001', 'Active', 'false']] }))), false);
	check('MUST FAIL: 353 row - the Assets tab is not the active one', runJs(S.rowActive, pg(assets({ active: 'General Info' }))), false);
	check('353 row completed - badge Completed', runJs(S.rowCompleted, pg(assets({ rows: [['Pump 0102', 'Completed', 'false']] }))), true);
	check('353 cache - badge now Completed', runJs(S.cacheCompleted, pg(assets({ rows: [['Pump 0102', 'Completed', 'false']] }))), true);
	check('MUST FAIL: 353 cache - badge still Active', runJs(S.cacheCompleted, pg(assets())), false);
	check('353 guard write - Pump 0102\'s menu open from Active, offers Mark as Completed', runJs(S.guardWrite, pg(assets({ rows: [['Pump 0102', 'Active', 'true']], menu: FROM_ACTIVE }))), true);
	check('MUST FAIL: 353 guard write - the target is not expanded (the open menu is not this row\'s)', runJs(S.guardWrite, pg(assets({ rows: [['Pump 0102', 'Active', 'false']], menu: FROM_ACTIVE }))), false);
	check('MUST FAIL: 353 guard write - no menu open', runJs(S.guardWrite, pg(assets({ rows: [['Pump 0102', 'Active', 'true']] }))), false);
	check('MUST FAIL: 353 guard write - the menu offers Mark as Active (it is a menu from another status)', runJs(S.guardWrite, pg(assets({ rows: [['Pump 0102', 'Active', 'true']], menu: FROM_COMPLETED }))), false);
	check('MUST FAIL: 353 guard write - two rows', runJs(S.guardWrite, pg(assets({ rows: [['Pump 0102', 'Active', 'true'], ['Bypass Valve 0001', 'Active', 'false']], menu: FROM_ACTIVE }))), false);
	check('353 guard restore - from Completed, offers Mark as Active', runJs(S.guardRestore, pg(assets({ rows: [['Pump 0102', 'Completed', 'true']], menu: FROM_COMPLETED }))), true);
	check('MUST FAIL: 353 guard restore - the badge still reads Active', runJs(S.guardRestore, pg(assets({ rows: [['Pump 0102', 'Active', 'true']], menu: FROM_ACTIVE }))), false);
	check('353 premise - Active, 1, the comment, stage Ready', twice(S.premise, pg('', { answers: [link()] })), true);
	check('MUST FAIL: 353 premise - a changed comment', twice(S.premise, pg('', { answers: [link({ comment: 'x' })] })), false);
	check('MUST FAIL: 353 premise - sequence 2', twice(S.premise, pg('', { answers: [link({ sequence: 2 })] })), false);
	check('MUST FAIL: 353 premise - already Completed (a leftover)', twice(S.premise, pg('', { answers: [link({ status: 'Completed' })] })), false);
	check('MUST FAIL: 353 premise - the stage is not Ready', twice(S.premise, pg('', { answers: [link({}, 'InProgress')] })), false);
	check('MUST FAIL: 353 premise - Pump 0102 under ANOTHER link id', twice(S.premise, pg('', { answers: [link({ id: 'OTHER' })] })), false);
	check('353 completed - the server holds Completed', twice(S.completed, pg('', { answers: [link({ status: 'Completed' })] })), true);
	check('MUST FAIL: 353 completed - the server still says Active (only the cache moved)', twice(S.completed, pg('', { answers: [link()] })), false);
	check('353 restored - Active again', twice(S.restored, pg('', { answers: [link()] })), true);
	check('MUST FAIL: 353 restored - still Completed', twice(S.restored, pg('', { answers: [link({ status: 'Completed' })] })), false);
	check('353 at rest - Active, 1, the comment, Ready', twice(S.atRest, pg('', { answers: [link()] })), true);
	check('MUST FAIL: 353 at rest - the comment was nulled', twice(S.atRest, pg('', { answers: [link({ comment: null })] })), false);
	{
		const w = pg('', { answers: [link()] });
		const first = runJs(S.backstop, w), second = runJs(S.backstop, w);
		check('353 backstop - at rest: one read, NO mutation, then true', first === false && second === true && w.__posts.length === 1 && w.__posts[0].body.variables.id === WO, true);
	}
	{
		const w = pg('', { answers: [link({ status: 'Completed' }), { data: {} }] });
		runJs(S.backstop, w); const done = runJs(S.backstop, w); runJs(S.backstop, w);
		const m = (w.__posts[1] || {}).body || {};
		check('353 backstop - Completed: ONE updateWorkStageAsset(link, status Active), then true, never repeated',
			done === true && w.__posts.length === 2 && /updateWorkStageAsset\(/.test(m.query) && m.variables.id === LINK
			&& JSON.stringify(m.variables.data) === '{"status":"Active"}', true);
	}
	check('MUST FAIL: 353 backstop - at rest it must not write',
		(() => { const v = pg('', { answers: [link()] }); twice(S.backstop, v); return v.__posts.length !== 1; })(), false);
	{
		const w = pg('', { answers: [new Error('offline'), { data: {} }] });
		twice(S.backstop, w);
		check('353 backstop - the read failed: it gives up without writing blind (the final server read stays red)', w.__posts.length === 1 && w.sessionStorage.getItem('__dd353_net') === 'done', true);
	}
}

/* ===========================================================================================
 * MOB.354 / MOB.359 - the fixture work order's Assets tab (build_work_asset_link_test.py,
 * build_asset_geolocate_submit_test.py).
 * MOB.354: rows are Accordion items in the Assets panel (Assets/index.tsx) - control (a span) with the
 *   asset name, AssetGeolocate's ActionIcon (renders only once the Asset schema is cached), the chevron;
 *   an expanded panel holds WorkCollectionMenu's gear (`aria-label="Menu"`). The picker
 *   (NewAssetForm.tsx -> AssetLookup) is a Modal with `input[name="asset-search"]`, rows whose control
 *   (a button) carries the name and a Checkbox input, and a footer `Add N Asset(s)` (measured by probe).
 * MOB.359: AssetLocationForm (`form#mobile-geolocate`, `input#includeGis`/`#includeAddress` checkboxes,
 *   Submit outside the form bound by `form=`), the Mapbox/geolocation stubs, the asset server reads.
 * ========================================================================================= */
{
	const WO = 'EYRpYJ9QYdQ1JFF10JtB0Q';
	const sync = (v) => ({ then(f) { try { const r = f(v); return r && r.then ? r : sync(r); } catch (e) { return fail(e); } }, catch() { return this; } });
	const fail = (e) => ({ then() { return this; }, catch(f) { f(e); return sync(undefined); } });
	const pg = (html, { answers = [{ data: {} }], ss = {} } = {}) => {
		const w = new JSDOM('<body></body>', { url: `https://dev.mentorapm.com/apm-mobile/work/${WO}` }).window;
		w.document.body.innerHTML = html;
		for (const [k, v] of Object.entries(ss)) w.sessionStorage.setItem(k, v);
		w.__posts = [];
		w.fetch = (url, opts) => {
			w.__posts.push({ url, opts, body: JSON.parse(opts.body) });
			const a = answers[Math.min(w.__posts.length, answers.length) - 1];
			return a instanceof Error ? fail(a) : sync({ json: () => sync(a) });
		};
		return w;
	};
	const twice = (body, w) => { runJs(body, w); return runJs(body, w); };
	const safe = (f) => { try { return f(); } catch (e) { return false; } };
	const RA = '230 North Alexander Street, New Orleans, LA 70119';
	const COMMENT = 'Chemical dosing pump, model PDM 2000, plastic housing with digital control panel, horizontal mount.';
	const LINK = 'AE09h8JhBBhMtd1wIs98lQ', PUMP = 'Pump 0102', PUMP_ID = 'oB5BUN1Es1Jctw8FVYwYBh';
	const BV = 'Bypass Valve 0001', BV_ID = 'wFRo1MMwoAMkdxA4hVpIhB';

	// ---- MOB.354 ----------------------------------------------------------------------------
	const F354 = 'MOB.354_Work_Asset_Add_Remove.json';
	const A = {
		premise: bodyOf(F354, 'PREMISE (server)'), mark: bodyOf(F354, 'PREMISE PASSED'), stash: bodyOf(F354, 'STASH the persisted'),
		one: bodyOf(F354, 'lists ONE row'), pick0: bodyOf(F354, 'picker lists exactly one'), pick1: bodyOf(F354, 'is CHECKED and the footer'),
		pickClosed: bodyOf(F354, 'picker closed and the page'), added: bodyOf(F354, 'SERVER: the stage now links'),
		two: bodyOf(F354, 'now lists Bypass Valve 0001 beside'), schema: bodyOf(F354, 'GATE ('), expanded: bodyOf(F354, 'row expanded'),
		guard: bodyOf(F354, 'GUARD + open its gear'), gone: bodyOf(F354, 'SERVER: no Bypass Valve 0001 link remains'),
		onlyPump: bodyOf(F354, 'lists only Pump 0102 again'), restoreQ: bodyOf(F354, 'RESTORE the persisted'),
		backstop: bodyOf(F354, 'BACKSTOP'), atRest: bodyOf(F354, 'AT REST (server)'),
	};
	const woRow = ([name, { geo = true, gears = 0 } = {}]) => `<div class="mantine-Accordion-item"><span class="mantine-Accordion-control"><span class="mantine-Text-root">${name}</span>`
		+ (geo ? '<span class="mantine-ActionIcon-root"><svg data-icon="location-crosshairs"></svg></span>' : '') + '<span class="mantine-Accordion-chevron"></span></span>'
		+ `<div class="mantine-Accordion-panel">${'<button aria-label="Menu" class="gear"></button>'.repeat(gears)}</div></div>`;
	const woAssets = (rows, { active = 'Assets', ss = {} } = {}) => {
		const w = pg(`<button role="tab" aria-selected="${active === 'General Info'}" aria-controls="pg">General Info</button>`
			+ `<button role="tab" aria-selected="${active === 'Assets'}"${active === 'Assets' ? ' data-active="true"' : ''} aria-controls="pa">Assets</button>`
			+ `<div role="tabpanel" id="pg"></div><div role="tabpanel" id="pa">${rows.map(woRow).join('')}</div>`, { ss });
		w.__g = [];
		w.document.querySelectorAll('.gear').forEach(g => g.addEventListener('click', () => w.__g.push(g.closest('.mantine-Accordion-item').querySelector('.mantine-Text-root').textContent)));
		return w;
	};
	const picker = ({ rows = [[BV, false]], footer = null, open = true } = {}) => '<button role="tab" data-active="true">Assets</button>'
		+ (open ? '<section class="mantine-Modal-content"><input name="asset-search">'
			+ rows.map(([n, c]) => `<div class="mantine-Accordion-item"><button class="mantine-Accordion-control">${n}<input type="checkbox" class="mantine-Checkbox-input"${c ? ' checked' : ''}></button></div>`).join('')
			+ `<button>Add ${footer === null ? rows.filter(r => r[1]).length : footer} Asset(s)</button></section>` : '');
	const PL = { id: LINK, status: 'Active', sequence: 1, comment: COMMENT, asset: { id: PUMP_ID, name: PUMP } };
	const BL = { id: 'NEWLINK', status: 'Active', sequence: null, comment: null, asset: { id: BV_ID, name: BV } };
	const stage = ({ assets = [PL], cond = ['C1'], fl = ['F1'], ...o } = {}) => ({ data: { workStage: { id: WO, status: 'Ready', address: RA, x: -90.1025785, y: 29.9782827,
		condition: cond.map(id => ({ id })), failures: fl.map(id => ({ id })), assets, ...o } } });
	const CF = { __dd354_cf: JSON.stringify([['C1'], ['F1']]) };
	console.log('\nMOB.354_Work_Asset_Add_Remove - the picker, the proofs, a delete guarded to THIS run\'s link, and the backstop');
	{
		const w = pg('', { answers: [stage()] });
		check('354 premise - only Pump 0102\'s link, at rest; records the condition/failure ids', twice(A.premise, w) && w.sessionStorage.getItem('__dd354_cf') === CF.__dd354_cf, true);
	}
	check('MUST FAIL: 354 premise - a leftover Bypass Valve link', twice(A.premise, pg('', { answers: [stage({ assets: [PL, BL] })] })), false);
	check('MUST FAIL: 354 premise - Pump 0102\'s link not at rest', twice(A.premise, pg('', { answers: [stage({ assets: [{ ...PL, status: 'Completed' }] })] })), false);
	check('MUST FAIL: 354 premise - the stage address moved', twice(A.premise, pg('', { answers: [stage({ address: 'DD MOB.352 LOCATION SAVE' })] })), false);
	{ const w = pg(''); check('354 mark - sets the premise key', runJs(A.mark, w) && w.sessionStorage.getItem('__dd354_premise') === '1', true); }
	{
		const w = pg('');
		runJs(A.stash, w); w.sessionStorage.setItem('asset_lookup_query', '"Bypass Valve 0001"'); runJs(A.stash, w);
		check('354 stash+restore - no query before: the picker\'s query is REMOVED again', runJs(A.restoreQ, w) && w.sessionStorage.getItem('asset_lookup_query') === null && w.sessionStorage.getItem('__dd354_prevQuery') === null, true);
	}
	{
		const w = pg('', { ss: { asset_lookup_query: '"Pump"' } });
		runJs(A.stash, w); w.sessionStorage.setItem('asset_lookup_query', '"Bypass Valve 0001"');
		check('354 stash+restore - a prior query is put back exactly', runJs(A.restoreQ, w) && w.sessionStorage.getItem('asset_lookup_query') === '"Pump"', true);
	}
	{
		const w = pg('', { ss: { asset_lookup_query: '"Pump"' } });
		check('354 restore - never stashed: leaves the query alone', runJs(A.restoreQ, w) && w.sessionStorage.getItem('asset_lookup_query') === '"Pump"', true);
		check('MUST FAIL: 354 stash - a second stash must not overwrite the first (it would stash the picker\'s own query)',
			(() => { const v = pg('', { ss: { asset_lookup_query: '"Pump"' } }); runJs(A.stash, v); v.sessionStorage.setItem('asset_lookup_query', '"X"'); runJs(A.stash, v); return JSON.parse(v.sessionStorage.getItem('__dd354_prevQuery')) !== 'null' && JSON.parse(v.sessionStorage.getItem('__dd354_prevQuery')) !== '"Pump"'; })(), false);
	}
	check('354 one - one Pump row, no Bypass Valve', runJs(A.one, woAssets([[PUMP]])), true);
	check('MUST FAIL: 354 one - a leftover Bypass Valve row', runJs(A.one, woAssets([[BV], [PUMP]])), false);
	check('MUST FAIL: 354 one - the Assets tab is not active', runJs(A.one, woAssets([[PUMP]], { active: 'General Info' })), false);
	check('354 picker - one Bypass Valve row, unchecked, Add 0', runJs(A.pick0, pg(picker())), true);
	check('MUST FAIL: 354 picker - the search found nothing', runJs(A.pick0, pg(picker({ rows: [] }))), false);
	check('MUST FAIL: 354 picker - two Bypass Valve rows', runJs(A.pick0, pg(picker({ rows: [[BV, false], [BV, false]] }))), false);
	check('MUST FAIL: 354 picker - already checked', runJs(A.pick0, pg(picker({ rows: [[BV, true]] }))), false);
	check('MUST FAIL: 354 picker - the modal is not open', runJs(A.pick0, pg(picker({ open: false }))), false);
	{
		const loaded = bodyOf(F354, 'picker finished its first load');
		const withOverlay = picker().replace('<input name="asset-search">', '<input name="asset-search"><div class="mantine-LoadingOverlay-root"><div class="mantine-LoadingOverlay-overlay"></div></div>');
		check('354 loaded - rows rendered, no overlay', runJs(loaded, pg(picker())), true);
		check('354 loaded - `No Results` rendered, no overlay', runJs(loaded, pg(picker({ rows: [] }).replace('<button>Add', '<h1>No Results</h1><button>Add'))), true);
		check('MUST FAIL: 354 loaded - the LoadingOverlay still covers the picker (local replay 1\'s forced click)', runJs(loaded, pg(withOverlay)), false);
		check('MUST FAIL: 354 loaded - no rows and no `No Results` yet', runJs(loaded, pg(picker({ rows: [] }))), false);
		check('MUST FAIL: 354 loaded - the picker is not open', runJs(loaded, pg(picker({ open: false }))), false);
	}
	check('354 checked - checked and Add 1', runJs(A.pick1, pg(picker({ rows: [[BV, true]] }))), true);
	check('MUST FAIL: 354 checked - the click did not land', runJs(A.pick1, pg(picker())), false);
	check('MUST FAIL: 354 checked - checked but the footer still counts 0 (the pick is not in state)', runJs(A.pick1, pg(picker({ rows: [[BV, true]], footer: 0 }))), false);
	check('354 picker closed - no search box, tabs alive', runJs(A.pickClosed, pg(picker({ open: false }))), true);
	check('MUST FAIL: 354 picker closed - still open', runJs(A.pickClosed, pg(picker())), false);
	check('354 added - Bypass Valve linked beside an untouched Pump link, location unchanged', twice(A.added, pg('', { answers: [stage({ assets: [PL, BL] })] })), true);
	check('MUST FAIL: 354 added - the server never linked it', twice(A.added, pg('', { answers: [stage()] })), false);
	check('MUST FAIL: 354 added - the stage took the asset\'s location (x changed)', twice(A.added, pg('', { answers: [stage({ assets: [PL, BL], x: null })] })), false);
	check('MUST FAIL: 354 added - Pump\'s link changed', twice(A.added, pg('', { answers: [stage({ assets: [{ ...PL, sequence: null }, BL] })] })), false);
	check('354 two rows - Pump and Bypass Valve', runJs(A.two, woAssets([[BV], [PUMP]])), true);
	check('MUST FAIL: 354 two rows - only Pump (the list never refreshed)', runJs(A.two, woAssets([[PUMP]])), false);
	check('354 schema gate - both rows render the geolocate control', runJs(A.schema, woAssets([[BV], [PUMP]])), true);
	check('MUST FAIL: 354 schema gate - no geolocate controls (the Asset schema is not cached: expanding would crash)', runJs(A.schema, woAssets([[BV, { geo: false }], [PUMP, { geo: false }]])), false);
	check('354 expanded - the Bypass Valve panel holds one gear', runJs(A.expanded, woAssets([[BV, { gears: 1 }], [PUMP]])), true);
	check('MUST FAIL: 354 expanded - not expanded (no gear)', runJs(A.expanded, woAssets([[BV], [PUMP, { gears: 1 }]])), false);
	{
		const w = woAssets([[BV, { gears: 1 }], [PUMP, { gears: 1 }]], { ss: { __dd354_premise: '1' } });
		check('354 guard - clicks exactly ONE gear, the Bypass Valve row\'s', runJs(A.guard, w) && w.__g.join() === BV, true);
	}
	for (const [label, rows, ss] of [
		['the premise never passed', [[BV, { gears: 1 }], [PUMP]], {}],
		['only the Pump row (the add failed)', [[PUMP, { gears: 1 }]], { __dd354_premise: '1' }],
		['three rows', [[BV, { gears: 1 }], [PUMP], ['Tank 0000']], { __dd354_premise: '1' }],
		['two Bypass Valve rows', [[BV, { gears: 1 }], [BV, { gears: 1 }]], { __dd354_premise: '1' }],
		['the Bypass Valve row is not expanded', [[BV], [PUMP, { gears: 1 }]], { __dd354_premise: '1' }],
		['two gears in its panel', [[BV, { gears: 2 }], [PUMP]], { __dd354_premise: '1' }],
		['a row named for BOTH assets', [[`${BV} ${PUMP}`, { gears: 1 }], [PUMP]], { __dd354_premise: '1' }],
	]) {
		const w = woAssets(rows, { ss });
		check(`MUST FAIL: 354 guard - ${label}, and NO gear is clicked`, runJs(A.guard, w) === false && w.__g.length === 0, true);
	}
	check('354 gone - only Pump\'s link, same condition/failure ids', twice(A.gone, pg('', { answers: [stage()], ss: CF })), true);
	check('MUST FAIL: 354 gone - the server still links Bypass Valve (the cache said gone)', twice(A.gone, pg('', { answers: [stage({ assets: [PL, BL] })], ss: CF })), false);
	check('MUST FAIL: 354 gone - Pump\'s link went too', twice(A.gone, pg('', { answers: [stage({ assets: [] })], ss: CF })), false);
	check('MUST FAIL: 354 gone - the fixture\'s condition was deleted', twice(A.gone, pg('', { answers: [stage({ cond: [] })], ss: CF })), false);
	check('MUST FAIL: 354 gone - no recorded ids (vacuous)', twice(A.gone, pg('', { answers: [stage()] })), false);
	check('354 at rest - the same proof, always', twice(A.atRest, pg('', { answers: [stage()], ss: CF })), true);
	check('MUST FAIL: 354 at rest - a leftover link', twice(A.atRest, pg('', { answers: [stage({ assets: [PL, BL] })], ss: CF })), false);
	check('354 only Pump - one row', runJs(A.onlyPump, woAssets([[PUMP]])), true);
	check('MUST FAIL: 354 only Pump - Bypass Valve still listed', runJs(A.onlyPump, woAssets([[BV], [PUMP]])), false);
	{
		const w = pg('', { answers: [stage({ assets: [PL, BL] })] });
		check('354 backstop - no premise mark: true at once, NOTHING asked or sent', runJs(A.backstop, w) === true && w.__posts.length === 0, true);
	}
	{
		const w = pg('', { answers: [stage()], ss: { __dd354_premise: '1' } });
		const first = runJs(A.backstop, w), second = runJs(A.backstop, w);
		check('354 backstop - at rest: one read, no removal', first === false && second === true && w.__posts.length === 1, true);
	}
	{
		const w = pg('', { answers: [stage({ assets: [PL, BL] }), { data: { removeWorkStageAssetLinks: 1 } }], ss: { __dd354_premise: '1' } });
		runJs(A.backstop, w); const done = runJs(A.backstop, w); runJs(A.backstop, w);
		const m = (w.__posts[1] || {}).body || {};
		check('354 backstop - a leftover link: ONE removal of THAT link id only, parent the fixture, never repeated',
			done === true && w.__posts.length === 2 && /removeWorkStageAssetLinks\(/.test(m.query) && JSON.stringify(m.variables.ids) === '["NEWLINK"]' && m.variables.parentId === WO, true);
	}
	for (const [label, assets] of [
		['two Bypass Valve links', [PL, BL, { ...BL, id: 'NEWLINK2' }]],
		['the only Bypass Valve link carries Pump\'s link id', [{ ...BL, id: LINK }]],
	]) {
		const w = pg('', { answers: [stage({ assets })], ss: { __dd354_premise: '1' } });
		twice(A.backstop, w);
		check(`354 backstop - ${label}: sends nothing`, w.__posts.length === 1, true);
	}

	// ---- MOB.359 ----------------------------------------------------------------------------
	const F359 = 'MOB.359_Work_Asset_Geolocate_Submit.json';
	const G = {
		premise: bodyOf(F359, 'PREMISE (server)'), warmClosed: bodyOf(F359, 'SCHEMA WARM: the picker closed'),
		installW: bodyOf(F359, 'geocode answers the written address'), installR: bodyOf(F359, 'geocode answers the rest address'),
		holdsW: bodyOf(F359, 'stubbed written address'), holdsR: bodyOf(F359, 'stubbed rest address'),
		gisOff: bodyOf(F359, 'Untick `Include GIS`'), armed: bodyOf(F359, 'Submit is ARMED'), closed: bodyOf(F359, 'location form is GONE'),
		written: bodyOf(F359, 'SERVER: Pump 0102 now holds'), restored: bodyOf(F359, 'RESTORED (server)'),
		removeStubs: bodyOf(F359, 'both stubs removed'), backstop: bodyOf(F359, 'BACKSTOP'), atRest: bodyOf(F359, 'AT REST (server)'),
	};
	const REST_V = ['230 North Alexander Street', 'New Orleans', 'LA', 'US', '70119'];
	const WRITE_V = ['359 DD MOB Test Street', 'Metairie', 'LA', 'US', '70001'];
	const geoForm = (vals, { gis = true, adr = true, submit = 'submit', form = true } = {}) => '<button role="tab" data-active="true">Assets</button>'
		+ (form ? `<form id="mobile-geolocate">${vals.map(v => `<input value="${v}">`).join('')}`
			+ `<input type="checkbox" id="includeGis"${gis ? ' checked' : ''}><input type="checkbox" id="includeAddress"${adr ? ' checked' : ''}></form>`
			+ `<button form="mobile-geolocate" type="${submit}">Submit</button>` : '');
	const assetA = (o = {}) => ({ data: { asset: { id: PUMP_ID, name: PUMP, address: '230 North Alexander Street', city: 'New Orleans', postalCode: '70119',
		latitude: 29.9782827, longitude: -90.1025785, state: { id: 'LA' }, countryCode: { id: 'US' }, ...o } } });
	const WR = { address: '359 DD MOB Test Street', city: 'Metairie', postalCode: '70001' };
	console.log('\nMOB.359_Work_Asset_Geolocate_Submit - stubs, the form, GIS off, address-only server proofs and the backstop');
	{
		const w = pg('');
		let origCalls = 0; const origFetch = () => { origCalls++; return 'ORIG'; }; w.fetch = origFetch;
		const origGeo = () => {};
		Object.defineProperty(w.navigator, 'geolocation', { value: { getCurrentPosition: origGeo }, configurable: true });
		const ok = runJs(G.installW, w);
		let pos = null; w.navigator.geolocation.getCurrentPosition(p => { pos = p; });
		const pass = w.fetch('/graphql', {});
		const mb = w.fetch('https://api.mapbox.com/geocoding/v5/mapbox.places/-90.1025785,29.9782827.json?access_token=x');
		check('359 install - written features; the position is Pump 0102\'s own; /graphql passes through; Mapbox is stubbed',
			ok === true && w.__dd359Features[0].address === '359' && pos && pos.coords.latitude === 29.9782827 && pos.coords.longitude === -90.1025785
			&& pass === 'ORIG' && origCalls === 1 && !!mb && typeof mb.then === 'function', true);
		pending.push(Promise.resolve(mb).then(r => r.json()).then(j => check('359 install - the Mapbox answer maps to Metairie / US-LA / 70001',
			j.features[0].text === 'DD MOB Test Street' && j.features[1].text === 'Metairie' && j.features[2].properties.short_code === 'US-LA' && j.features[4].text === '70001', true))
			.catch(() => check('359 install - the Mapbox answer maps to Metairie / US-LA / 70001', false, true)));
		check('359 install rest - swaps the features and keeps the ORIGINAL fetch (no stub of a stub)', runJs(G.installR, w) && w.__dd359Features[0].address === '230' && w.__ddOrigFetch === origFetch, true);
		check('359 remove stubs - fetch and geolocation are the originals again', runJs(G.removeStubs, w) && w.fetch === origFetch && w.navigator.geolocation.getCurrentPosition === origGeo, true);
		check('MUST FAIL: 359 install - no geolocation object (a throw is a red step)', safe(() => runJs(G.installW, pg(''))), false);
	}
	check('359 warm closed - no picker, tabs alive', runJs(G.warmClosed, pg('<button role="tab">Assets</button>')), true);
	check('MUST FAIL: 359 warm closed - the picker is still open', runJs(G.warmClosed, pg('<button role="tab">Assets</button><input name="asset-search">')), false);
	check('359 holds written', runJs(G.holdsW, pg(geoForm(WRITE_V))), true);
	check('MUST FAIL: 359 holds written - MOB.358\'s Chicago stub', runJs(G.holdsW, pg(geoForm(['1600 Main Street', 'Chicago', 'IL', 'US', '60601']))), false);
	check('MUST FAIL: 359 holds written - the rest address (the stub swap did not happen)', runJs(G.holdsW, pg(geoForm(REST_V))), false);
	check('MUST FAIL: 359 holds written - no form', runJs(G.holdsW, pg(geoForm(WRITE_V, { form: false }))), false);
	check('359 holds rest', runJs(G.holdsR, pg(geoForm(REST_V))), true);
	check('MUST FAIL: 359 holds rest - city missing', runJs(G.holdsR, pg(geoForm(['230 North Alexander Street', 'LA', 'US', '70119']))), false);
	{ const w = pg(geoForm(WRITE_V)); check('359 GIS off - GIS on -> clicked off; Address stays on', runJs(G.gisOff, w) && !w.document.getElementById('includeGis').checked, true); }
	check('359 GIS off - already off (a non-GIS type): not toggled back on', (() => { const w = pg(geoForm(WRITE_V, { gis: false })); return runJs(G.gisOff, w) && !w.document.getElementById('includeGis').checked; })(), true);
	check('MUST FAIL: 359 GIS off - Include Address is off (the submit would write nothing)', runJs(G.gisOff, pg(geoForm(WRITE_V, { adr: false }))), false);
	{
		const w = pg(geoForm(WRITE_V));
		w.document.getElementById('includeGis').addEventListener('click', e => e.preventDefault());
		check('MUST FAIL: 359 GIS off - the click did not take (GIS still on)', runJs(G.gisOff, w), false);
	}
	check('MUST FAIL: 359 GIS off - the field ids changed', runJs(G.gisOff, pg(geoForm(WRITE_V).replace('id="includeGis"', 'id="gis"'))), false);
	check('359 armed - submit, GIS off, Address on', runJs(G.armed, pg(geoForm(WRITE_V, { gis: false }))), true);
	check('MUST FAIL: 359 armed - Submit is type="button"', runJs(G.armed, pg(geoForm(WRITE_V, { gis: false, submit: 'button' }))), false);
	check('MUST FAIL: 359 armed - GIS still on', runJs(G.armed, pg(geoForm(WRITE_V))), false);
	check('359 closed - form gone, tabs alive', runJs(G.closed, pg(geoForm([], { form: false }))), true);
	check('MUST FAIL: 359 closed - form still open', runJs(G.closed, pg(geoForm(WRITE_V))), false);
	check('359 premise - rest fields and coordinates', twice(G.premise, pg('', { answers: [assetA()] })), true);
	check('MUST FAIL: 359 premise - a leftover written address', twice(G.premise, pg('', { answers: [assetA(WR)] })), false);
	check('MUST FAIL: 359 premise - latitude moved', twice(G.premise, pg('', { answers: [assetA({ latitude: 29.95 })] })), false);
	check('MUST FAIL: 359 premise - longitude null', twice(G.premise, pg('', { answers: [assetA({ longitude: null })] })), false);
	check('MUST FAIL: 359 premise - state IL', twice(G.premise, pg('', { answers: [assetA({ state: { id: 'IL' } })] })), false);
	check('359 written - address/city/postal written, coordinates unchanged', twice(G.written, pg('', { answers: [assetA(WR)] })), true);
	check('MUST FAIL: 359 written - still at rest (only the optimistic UI moved)', twice(G.written, pg('', { answers: [assetA()] })), false);
	check('MUST FAIL: 359 written - GIS was written too (latitude moved)', twice(G.written, pg('', { answers: [assetA({ ...WR, latitude: 29.9511 })] })), false);
	check('MUST FAIL: 359 written - city not written', twice(G.written, pg('', { answers: [assetA({ ...WR, city: 'New Orleans' })] })), false);
	check('359 restored - rest', twice(G.restored, pg('', { answers: [assetA()] })), true);
	check('MUST FAIL: 359 restored - still written', twice(G.restored, pg('', { answers: [assetA(WR)] })), false);
	check('359 at rest', twice(G.atRest, pg('', { answers: [assetA()] })), true);
	check('MUST FAIL: 359 at rest - country cleared', twice(G.atRest, pg('', { answers: [assetA({ countryCode: null })] })), false);
	{
		const w = pg('', { answers: [assetA()] });
		const first = runJs(G.backstop, w), second = runJs(G.backstop, w);
		check('359 backstop - at rest: one read, no write', first === false && second === true && w.__posts.length === 1 && w.__posts[0].body.variables.id === PUMP_ID, true);
	}
	{
		const w = pg('', { answers: [assetA(WR), { data: {} }] });
		runJs(G.backstop, w); const done = runJs(G.backstop, w); runJs(G.backstop, w);
		const m = (w.__posts[1] || {}).body || {};
		check('359 backstop - written: ONE updateAsset with exactly the rest address fields (no coordinates), never repeated',
			done === true && w.__posts.length === 2 && /updateAsset\(/.test(m.query) && m.variables.id === PUMP_ID
			&& JSON.stringify(m.variables.data) === JSON.stringify({ address: '230 North Alexander Street', city: 'New Orleans', postalCode: '70119', state: 'LA', countryCode: 'US' }), true);
	}
	{
		const w = pg('', { answers: [assetA({ latitude: 29.95 })] });
		twice(G.backstop, w);
		check('359 backstop - only the coordinates drifted: it never writes coordinates (the final read stays red)', w.__posts.length === 1, true);
	}
}

/* ===========================================================================================
 * MOB.622 - a MentorLens tag's description `?`. LensTags renders each tag as Checkbox.Card
 * (role="checkbox" aria-checked) holding its name in a <p> and, when it has a desc, an ActionIcon
 * `aria-label="Show MentorLens tag description"`. The desc modal closes itself after 3s, so a recorder
 * lists NEW modal bodies; the assertions read that list and the pre-existing set.
 * ========================================================================================= */
{
	const F = 'MOB.622_Collector_Photo_Carousel.json';
	const THERMO = 'Lens: Thermography', COND = 'Lens: Condition Assessment';
	const D1 = 'Used in MentorLens for thermographic analysis', D2 = 'Used in MentorLens for condition assessment';
	const ready = bodyOf(F, "`Lens: Thermography` is a lens card, UNCHECKED");
	const clickQ = bodyOf(F, "Click `Lens: Thermography`'s `?`");
	const shown1 = bodyOf(F, "showed `Lens: Thermography`'s desc");
	const shown2 = bodyOf(F, "showed `Lens: Condition Assessment`'s desc");
	const closed = bodyOf(F, 'CLOSED ITSELF');
	const still = bodyOf(F, "`Lens: Thermography` is STILL unchecked");
	// The real card is a <button> (UnstyledButton) with the ? <button> INSIDE it — React builds that with DOM
	// calls, but an HTML string cannot: the parser closes the outer button when the inner one opens, and the ?
	// lands BESIDE the card. The selectors only read [role="checkbox"], so the model uses a <div> for the card.
	const card = (name, checked = false, q = true) =>
		`<div role="checkbox" aria-checked="${checked}"><p>${name}</p>${q ? '<button aria-label="Show MentorLens tag description">?</button>' : ''}</div>`;
	const pg = (html) => { const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/asset-collector' }).window; w.document.body.innerHTML = html; return w; };
	console.log('\nMOB.622 - a MentorLens tag description');
	check('ready - the Thermography card, unchecked, with its ?', runJs(ready, pg(card(COND) + card(THERMO))), true);
	check('MUST FAIL: ready - the card is already CHECKED (the tag is assigned)', runJs(ready, pg(card(THERMO, true))), false);
	check('MUST FAIL: ready - no ? on it (no desc)', runJs(ready, pg(card(THERMO, false, false))), false);
	check('MUST FAIL: ready - a name that only CONTAINS it', runJs(ready, pg(card('Lens: Thermography (old)'))), false);
	{
		const w = pg(card(COND) + card(THERMO));
		let hit = null; w.document.querySelectorAll('[aria-label="Show MentorLens tag description"]').forEach(b => b.addEventListener('click', () => { hit = b.parentElement.querySelector('p').textContent; }));
		check('click - the ? on THERMOGRAPHY, not the first card\'s', runJs(clickQ, w) && hit === THERMO, true);
	}
	const withDesc = (list) => { const w = pg(''); w.__dd622Desc = list; return w; };
	check('shown - exactly the Thermography desc', runJs(shown1, withDesc([D1])), true);
	check('MUST FAIL: shown - another tag\'s desc', runJs(shown1, withDesc([D2])), false);
	check('MUST FAIL: shown - nothing recorded (the modal never opened)', runJs(shown1, withDesc([])), false);
	check('MUST FAIL: shown - a stray modal body recorded too', runJs(shown1, withDesc([D1, 'Get New Asset …'])), false);
	check('shown 2 - both, in click order', runJs(shown2, withDesc([D1, D2])), true);
	check('MUST FAIL: shown 2 - the second modal repeated the FIRST desc', runJs(shown2, withDesc([D1])), false);
	{
		const w = pg('<div class="mantine-Modal-body">editor</div><div class="mantine-Modal-body">form</div>');
		w.__dd622Old = new w.Set(w.document.querySelectorAll('.mantine-Modal-body'));
		check('closed - only the modals that were open before remain', runJs(closed, w), true);
		const extra = w.document.createElement('div'); extra.className = 'mantine-Modal-body'; extra.textContent = D1;
		w.document.body.appendChild(extra);
		check('MUST FAIL: closed - the desc modal is still up', runJs(closed, w), false);
	}
	check('still - unchecked after the ?', runJs(still, pg(card(THERMO))), true);
	check('MUST FAIL: still - the ? ASSIGNED the tag', runJs(still, pg(card(THERMO, true))), false);
}

/* ===========================================================================================
 * MOB.740 - a work-history row's `Assigned to:` (WorkListItem.tsx:94-102): a <div> per display field
 * holding <strong>{label}: </strong> + the value, filtered out when the value is empty. The step stashes the
 * FIRST row's value (a server read compares it); it must skip the modal's own Papers.
 * ========================================================================================= */
{
	const stash = bodyOf('MOB.740_AssetLookup_Work_History.json', 'The first history row reads `Assigned to:');
	const row = (assigned) => `<div class="mantine-Paper-root"><p>☢️ Datadog Test</p>`
		+ (assigned === null ? '' : `<div><strong>Assigned to: </strong><span>${assigned}</span></div>`)
		+ `<p>Description:</p></div>`;
	const pg = (html) => { const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/asset-lookup' }).window; w.document.body.innerHTML = html; return w; };
	console.log('\nMOB.740 - a work history row\'s Assigned to');
	{
		const w = pg(row('Admin') + row('Other'));
		check('stash - the FIRST row\'s value', runJs(stash, w) && w.sessionStorage.getItem('__dd740_assigned') === 'Admin', true);
	}
	check('MUST FAIL: stash - the first row has no Assigned to (empty value is filtered out)', runJs(stash, pg(row(null) + row('Admin'))), false);
	check('MUST FAIL: stash - the label with an empty value', runJs(stash, pg(row(''))), false);
	check('MUST FAIL: stash - no history rows at all', runJs(stash, pg('<p>No History Found</p>')), false);
	{
		const w = pg(`<div class="mantine-Modal-content">${row('FromModal')}</div>` + row('Admin'));
		check('stash - a Paper inside the modal is not a history row', runJs(stash, w) && w.sessionStorage.getItem('__dd740_assigned') === 'Admin', true);
	}
}

/* ===========================================================================================
 * MOB.331 - the value arrow (MultiLineLabel) beside General Info's multiline fields. FormFieldContainer:
 * div.form-group > label[for=id] + div(labelRightSection) + the input; the arrow renders only for a
 * non-empty value, and its onClick is on the <svg>.
 * ========================================================================================= */
{
	const F = 'MOB.331_Work_GenInfo_Value_Modal.json';
	const bic = bodyOf(F, 'The value arrow renders beside Stage Notes');
	const clickA = bodyOf(F, "Click Stage Notes' arrow");
	const shown = bodyOf(F, "A modal opened showing the field's VALUE");
	// type="button" as Mantine renders it (UnstyledButton.mjs:53) — without it the button defaults to SUBMIT,
	// and the click bubbling from the svg would submit General Info (in the model; not in the app).
	const ARROW = '<div><button type="button" aria-label="Settings"><svg data-icon="square-arrow-up-right"></svg></button></div>';
	const grp = (id, label, value, arrow) => `<div class="form-group"><label for="${id}">${label}</label>${arrow ? ARROW : ''}`
		+ `<div class="mantine-InputWrapper-root"><textarea id="${id}">${value}</textarea></div></div>`;
	const pg = (html) => { const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/work/x' }).window; w.document.body.innerHTML = `<form id="mobile-genInfo">${html}</form>`; return w; };
	console.log('\nMOB.331 - the General Info value arrow');
	check('arrow - beside Stage Notes, not beside the empty Problem Description', runJs(bic, pg(grp('desc', 'Stage Notes', 'DATADOG FIXTURE', true) + grp('problemDesc', 'Problem Description', '', false))), true);
	check('MUST FAIL: arrow - drawn beside the EMPTY field too', runJs(bic, pg(grp('desc', 'Stage Notes', 'DATADOG FIXTURE', true) + grp('problemDesc', 'Problem Description', '', true))), false);
	check('MUST FAIL: arrow - missing beside Stage Notes', runJs(bic, pg(grp('desc', 'Stage Notes', 'DATADOG FIXTURE', false) + grp('problemDesc', 'Problem Description', '', false))), false);
	check('MUST FAIL: arrow - Problem Description is not on the form (the negative leg would be vacuous)', runJs(bic, pg(grp('desc', 'Stage Notes', 'DATADOG FIXTURE', true))), false);
	{
		const w = pg(grp('desc', 'Stage Notes', 'DATADOG FIXTURE', true) + grp('problemDesc', 'Problem Description', '', false));
		let hit = false; w.document.querySelector('svg').addEventListener('click', () => { hit = true; });
		check('click - dispatched on the SVG (its onClick), not the Settings button', runJs(clickA, w) && hit, true);
	}
	const modal = (body) => { const w = pg(''); w.document.body.insertAdjacentHTML('beforeend', `<div class="mantine-Modal-content"><div class="mantine-Modal-body">${body}</div></div>`); return w; };
	check('shown - a modal holding exactly the value', runJs(shown, modal('DATADOG FIXTURE')), true);
	check('MUST FAIL: shown - the modal holds the LABEL, not the value', runJs(shown, modal('Stage Notes')), false);
	check('MUST FAIL: shown - no modal', runJs(shown, pg('')), false);
}

/* ===========================================================================================
 * MOB.135 - the tablet's signature cell in the desktop grid (FormDetails.renderSignature ->
 * MobileSignatureField): div.mobile-signature-cell > label + a button titled `Add Signature`; its pad is a
 * Mantine Modal holding a canvas and a `Clear` control.
 * ========================================================================================= */
{
	const F = 'MOB.135_Work_Form_Signature_Pad.json';
	const cellOk = bodyOf(F, 'The grid draws it with the MOBILE control');
	const opened = bodyOf(F, 'The pad opened in a modal');
	const LABEL = 'Add a signature label';
	const cell = (btnText = 'Add Signature', img = false, label = LABEL) => `<div class="mobile-signature-cell"><label>${label}</label>`
		+ (img ? '<img data-testid="signature-image">' : '') + `<button title="Add Signature">${btnText}</button></div>`;
	const pg = (html) => { const w = new JSDOM('<body></body>', { url: 'https://dev.mentorapm.com/apm-mobile/work/x/form/y' }).window; w.document.body.innerHTML = `<div id="apm-dv-tabpanel">${html}</div>`; return w; };
	console.log('\nMOB.135 - the tablet signature cell');
	check('cell - one mobile cell, labelled, `Add Signature`, unsigned', runJs(cellOk, pg(cell())), true);
	check('MUST FAIL: cell - already signed (an image, `Update Signature`)', runJs(cellOk, pg(cell('Update Signature', true))), false);
	check('MUST FAIL: cell - two signature cells', runJs(cellOk, pg(cell() + cell())), false);
	check('MUST FAIL: cell - a different field\'s label', runJs(cellOk, pg(cell('Add Signature', false, 'Supervisor'))), false);
	check('MUST FAIL: cell - outside the desktop grid (the phone branch)', runJs(cellOk, (() => { const w = pg(''); w.document.body.insertAdjacentHTML('beforeend', cell()); return w; })()), false);
	const modal = (inner) => { const w = pg(cell()); w.document.body.insertAdjacentHTML('beforeend', `<div class="mantine-Modal-content">${inner}</div>`); return w; };
	check('pad - a modal with a canvas and Clear', runJs(opened, modal('<canvas></canvas><button title="Clear"></button>')), true);
	check('MUST FAIL: pad - a modal with no canvas', runJs(opened, modal('<button title="Clear"></button>')), false);
	check('MUST FAIL: pad - no modal', runJs(opened, pg(cell())), false);
}

Promise.all(pending).then(() => {
	console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL PASS');
	process.exit(failures ? 1 : 0);
});
