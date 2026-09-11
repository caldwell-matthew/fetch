# Mobile — test authoring reference

*What to consult while WRITING a test. Nothing here is coverage state.*

| file | question |
|---|---|
| `testing_checklist.md` | what is left to do, and what has run |
| `coverage.md` | what a green run proves |
| **`test_authoring.md`** | how to write a test without repeating a known mistake — fixtures, operational rules, tooling, the 31 traps |
| `bugs_found.md` | what the tests found in the app |
| `cleanup_spec.md` | test residue: what exists, what can be removed, never-touch fixtures |

🛑 **The traps are the load-bearing part.** Each is a mistake that has already cost at least one
run. Read the relevant trap *before* debugging a locator.

## Fixtures

| Fixture | Id | Used by | Must stay |
|---|---|---|---|
| Work order | `EYRpYJ9QYdQ1JFF10JtB0Q` | MOB.310–395 | crew `Admin`, status **`Ready`** (`MOB.320` restores it `always`; outside In Progress/On Hold/Ready it leaves the crew's list — bugs §25). `desc` owned by MOB.395, ends every run `DATADOG FIXTURE`. Holds ONE permanent condition (`Pump 0102 · Structural · Mounting/Support`, 1/2/3) and ONE failure (`MISSED`) — each the unique key's slot (bugs §40) |
| Work order | `RcdI0xcpc8NBV8VoRNNBYM` | MOB.302 | holds the photo `MOB.302` links to `Bypass Valve 0001` |
| Mobile job | `Z0EVwQcdJZhMURcBFkp0E0` "DATADOG MOBILE JOB" | MOB.500–590, 536, 537, 913 | crew `Admin`, `IN_PROGRESS`, exactly **2 assets** — `⚡ Tank 0000` (tag `0000`; the symbol is part of the stored name) and `A/C Motor 0002` (no tag) — neither verified. `reset_av_fixture.py --check` asserts it for 0 runs; match names by **containment** (trap 29) |
| Asset | `Pump 0102` | MOB.387, 389–391, 700, 710 | attached to the work order; `desc` owned by MOB.710, ends `DATADOG FIXTURE`. 🛑 **Never touch its attachments** (owner) |
| Asset | `Bypass Valve 0001` (`wFRo1MMwoAMkdxA4hVpIhB`) | MOB.302 | no photos at rest — `MOB.302` links one and unlinks it |
| Asset | `⚡ Building 0000` | MOB.721 | zero event readings |
| Asset type | `Actuator Tools` | MOB.600 | exists |
| Storeroom / item | `Central Storeroom` · `000-000-000 Adamantium` | MOB.850/860/870 | visible to `Admin`, `canAdjust` on |

Session role must be exactly **`Admin`** — the Datadog env also has `Admin (0000)`/`(0100)`
(test roles for `MOB.210`/`220`), which lack work create/update. On the wrong one the symptom is an
**absent control** (`CreateWorkButton` renders `null`), not a permission error — so every
login-bearing test asserts the role right after login.

## Operational rules

- **Navigate the way a user does — click through, do not force-route.** A `goToUrl` is a full
  page load that restarts the SPA and races whatever was loading. Deep-linking to an AV job gave
  an intermittently empty asset list that survived a 60s guard; clicking the job row works.
- **Deep-link only where the target queries by id on mount.** `WorkStageDetails` reads
  `useParams` and queries directly, so `/work/<id>` is safe. The AV detail page is `cache-only`
  (`Job.tsx` bails on a cold cache) — use `av_job_gate`. Work-order lookups are `cache-only` too,
  filled only by `prefetchWorkData` on the crew's list — visit `/work` before deep-linking.
- **Mutating tests self-restore to FIXED values, restore legs `always`.** Datadog can extract a
  value but not interpolate it into an XPath, so "put back how it was" is inexpressible.
- **Crew-scoped data is shared state.** `mobileJobsForCrew` and `workStages(crew: '<SESSION>')`
  are crew-scoped, so anything switching crews changes what other tests see — why `MOB.200` is in
  no suite.
- **The crew's work list grows with every create run** (≈5/day) and virtualises. Anchor on the
  fixture by id; on the list, narrow before measuring (trap 30).
- **Classify a test by what it leaves on the SERVER**: `read-only` (no server write; a restored
  sessionStorage toggle still counts), `self-restoring` (writes, puts it back), `leaves-residue`.
  Classify by reading the steps, not the message. ⚠️ Tags are applied inconsistently (47 leaves
  carry none), so never filter on them for safety — the checklist's suite table is the source of
  truth. Change tags in generator **and** JSON together (trap 19).
- **Deleting a test from Datadog requires un-wiring it first** — the API refuses a test used as a
  subtest. Remove the `playSubTest` step → `push` → delete.
- **Wire a new test last.** build → `push` (creates it) → `verify.py` until green → add to its
  suite → `wire_suite.py` → `push`. Any suite still holding `PENDING-WIRE-UP` makes every push
  fail, and `verify.py` refuses to run after a failed push.
- **`write` refuses to overwrite existing JSON without `DD_FORCE=1`** — the JSON is the source of
  truth for anything hand-authored (trap 12).
- 🛑 **Scheduling is settled: manual only. Do not propose it.** (All tests are `paused`; `push`
  omits `status`, so it cannot change that.)

## Tooling

| Command | Purpose |
|---|---|
| `preflight.py` | ⭐ every 0-run check in one command — wiring, local↔Datadog by content, drift, literals, bench, and the fixtures (AV job at rest, work order `Ready`, MOB.302's photo/asset, no MOB.390/391 leftovers). Run before any suite. Skips `drift` while a run is in flight |
| `verify.py <test>` | prove ONE test through the `MOB.999_Verify_Scratch` harness — 2 runs (3 when red: Datadog retries once) |
| `dd_tools.py push` | sync `dd_tests_mobile/` → Datadog. Exits non-zero on failure — chain with `&&` |
| `dd_tools.py pull <name>` | fetch a test back after a Datadog-UI edit |
| `dd_tools.py run <suite>` · `report <suite> [n]` | trigger + poll · per-step results with run age |
| `wire_suite.py` | fill in `subtestPublicId` once children exist. Re-run after any suite rebuild |
| `check_drift.py` | where a generator and its JSON disagree, changing nothing; names what a rebuild would LOSE. Run before any `DD_FORCE=1` |
| `check_literals.py` | every asserted literal still exists in the served app (`--self-test` after a rule change). Blind to a paraphrase whose words all exist — copy constants verbatim |
| `node check_js_assertions.js` | the bench: runs every `assertFromJavascript` in jsdom against a DOM modelled on the component source, each with a must-fail case (trap 27) |
| `audit_assertions.py` | assertions that pass without proving their name — TAUTOLOGY · GENERIC-COUNT · NAME-MISMATCH · VACUOUS-ABSENCE · LOADBEARING-OPT · CRITICAL-DIAG. A heuristic: every hit needs a human read. Exit 1 on any HIGH |
| `reset_av_fixture.py` | the AV fixture over GraphQL, 0 runs — `--check` asserts, dry run plans, `--apply` acts |
| `cleanup_residue.py` | prune residue by marker, delete by id — dry run by default (`cleanup_spec.md`) |
| `set_device.py` | pins every test to `chrome.tablet`, `_Phone_` tests to `chrome.mobile_small`; run after any build |
| `add_role_guard.py` · `add_crash_guard.py` | patch the shared login prefix (login → boot crash guard → shell → role is exactly `Admin`) into every login-bearing JSON. Builders copy the prefix from `MOB.000_Login_(Dev).json`, so a prefix change goes through these, never one builder |
| `fetch.py` `fetch(type="full", dir=…)` | back up every browser test. Names files by test name, so duplicate names overwrite — re-save those by `public_id`. Last full backup: `dd_tests_backup/2026-08-12_1543_pre-delete/` |

**`dd_tools` helpers** — shared so there is one copy; do not hand-roll local versions.

| helper | use |
|---|---|
| `step(…, optional=, soft=, always=)` | `optional` = `allowFailure`, non-critical · `soft` = `allowFailure` + critical (fails the test, the run continues) · `always` = `alwaysExecute` (runs after an earlier failure; for restore legs and state a later run needs) |
| `jsassert(name, body)` | a `Run JavaScript` assertion; the body is a function body that `return`s a boolean |
| `av_job_gate(job_id)` | **the** way into an AV job — clicks the row, gates on the asset ROWS, polls |
| `work_cache_warm(wait)` | warm the work lookup cache before a deep link; claims nothing else |
| `work_list_gate(wait, require_row)` | readiness where `loadedAll` matters (the map toggle). Its LOADEDALL checks cannot poll (trap 21) — prefer `require_row=True` |
| `work_view_ensure(to)` | switch Scheduled ↔ List only if the item is present (it exists only for a `SCHEDULED` role); persists across a suite — restore `always` |
| `open_filters_drawer()` | the Filters drawer with the re-click gate; gate on `Add Filter`, never the trigger |
| `upload_steps(url, picker=…)` | `[reveal, uploadFiles]`, reading the one working `uploadFiles` step out of `MOB.600`'s JSON (trap 12) |
| `reveal_file_button(scope=…)` | a Mantine `FileButton`'s hidden input; fails closed on an ambiguous match — always pass `scope` |
| `stash_record_count` / `prove_record_count` | count the innermost cards in the active panel containing every needle, reload, require exactly +1 — the server proof for optimistic adds (bugs §40) |
| `pick_visible_option_js` *(in `build_tab_tests.py`)* | click the ONE visible ListFilter option (`offsetParent !== null`) — closed dropdowns stay mounted (trap 3) |

---

## Locator & assertion traps

*1–17 are locator/assertion traps; 18–27 process traps (how tooling, fixtures or framing misled);
28–31 more locator and fixture traps.*

**1 · Never add a second `device_id`.** Datadog runs each device as a **concurrent** session, and
the mutating tests share one fixture, so two devices race (caught when a phone session walked the
work order while the tablet asserted its status). It hides itself: for runs one device died at
login and the suite looked clean. `set_device.py` enforces it. **The one exception:**
`MOB.984_Phone_Suite` (`_Phone_` tests) — ONE device each (`chrome.mobile_small`), READ-ONLY, run
on its own, never alongside a mutating tablet suite.

**2 · Never write a delete step unless the owner names the flow.** A delete code path existing
(e.g. the gear in `ui/Menu.tsx`) does not make it supported. **The named flows — only these:**
- `MOB.390`/`391` — `Delete Item` on the condition / failure card THIS run added (a key the
  fixture lacks; the premise proves it absent first; the guard shares a step with the gear click;
  a reload proves the original untouched).
- `MOB.302` — `Delete Photo` on `Bypass Valve 0001`'s Photos tab, never `Pump 0102`.

Read the server before trusting a delete: `Copy to asset` *links* the same attachment, and
`destroy` deletes the S3 file when exactly one reference is left. `MOB.302`'s guard (same step as
the gear click) requires the photo to be the one it just read on the work order, keeping the
reference count ≥ 2 — a guard written from the UI's word "copy" would have been wrong.

**3 · Mantine `keepMounted` produces duplicates.** Closed `Combobox` dropdowns and closed
`Accordion.Panel`s stay in the DOM, so locators match them and Datadog errors *"Multiple elements
found"* — or picks an invisible one. Ids are not unique either: an edit modal's `#tagNumber` and
the General Info form behind it both render (`MOB.537` run 1) — scope a modal's fields to
`mantine-Modal-content`. Scope to the item under test
(`(//*[contains(@class,"mantine-Accordion-item")])[1]//…`), or click the one visible option from
JS (`pick_visible_option_js`).
**Match Mantine parts by the EXACT class token** — `.mantine-Menu-item` in JS,
`contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")` in XPath. A substring
match (`[class*="mantine-Menu-item"]`) also hits each item's `itemLabel` and `itemSection`, so one
item counts as three (`MOB.626` run 1). Model those inner parts on the bench (trap 27).

**4 · Mantine `Modal` unmounts its children.** The mirror of 3: an element inside a closed modal
does not exist until it opens — why the collector's gallery input is index 3, not 1.

**5 · An assertion that cannot fail is indistinguishable from a passing test.**
`assertPageLacks "Submit"` was vacuously true on MOB.600 because the button reads "Create Asset".
Pair every absence with a **positive** assertion that fails loudly when its target is missing.

**5b · Page text cannot tell content from CHROME.** `ActiveFilters` echoes a filter as a pill,
so `assertPageContains "Pump 0102"` passes against **zero results**; the search box, sort label
and legend echo too. Scope to what you mean — a result row.

**6 · "The form closed" ≠ "the record was created."** It depends on the callback the close is
wired to — read the submit path, not the test name:

| pattern | proves |
|---|---|
| close inside Apollo `update()`, **no** `optimisticResponse`, default `errorPolicy` | server confirmed (MOB.300's create form) |
| close only when `result.data` is present | server confirmed (`StockAdjustments`, MOB.860/870) |
| close inside `update()` **with** an `optimisticResponse` | **nothing** — `update()` runs first on the optimistic result (`addToCollection`, `updateCollectionRecord` — bugs §40) |
| `.then` on a non-awaited `mutate` returning an optimistic value | **nothing** (MOB.600's `createAsset`) |

Where it proves nothing, read the record back **after a reload** (`prove_record_count`). Never
read back a row the client just prepended (bugs §34).

⚠️ **A reload is not a server read.** The app persists its Apollo cache to IndexedDB
(`apollo3-cache-persist`, saved on every cache write) and the work-order detail query is
`cache-first` with no refetch, so a reload of a page this run already visited renders the
**persisted cache**. That is still a proof for writes made through `optimisticResponse`: Apollo
persists only the base cache, and a refused write never reaches it. It is **no proof** for a write
the app makes straight into the cache before the mutation — `StatusMenuIcon`'s status
(`cache.modify`, then `mutate`) and `removeFromCollection`'s delete (`cache.modify`, then a
fire-and-forget `mutate`). Read the write path before trusting a reload; for a real server read use
a `network-only` surface (Asset Lookup, as `MOB.302` does) or a same-origin `/graphql` fetch
(checklist #32).

**7 · Toasts are transient, and some fire before the mutation.** `VerificationCheckbox` and
`AdHocForm` toast before `client.mutate` (bugs §11). Demote a toast to `optional` only after
replacing it with something stronger.

**8 · Submit on an invalid form does nothing.** `SubmitButton` is `type={isValid ? 'submit' : 'button'}`
— a soft-disabled "can submit now" gate: the tap never reaches `onSubmit` and no error shows on a
field nobody touched — so "clicked, no toast" is ambiguous. Required fields come from the **runtime** schema,
which can demand more than the model file (`unitPrice` broke MOB.380).

**9 · `placeholder` is an attribute, not page text.** Use
`//input[@placeholder="Find Mobile Job(s)"]`, not `assertPageContains`.

**10 · Self-degrading adds consume their own fixture.** A picker that hides what is attached
(`AdHocForm`, `ReassignWork`'s `notInCollection`) passes once, then fails *"No element found"*.
The SERVER can do it too, and then nothing fails at all: a unique key refuses the second insert
while an optimistic UI "succeeds" — `MOB.390`/`391` re-submitted their run-1 key for a month,
green, writing nothing (bugs §40). Before trusting a repeated add, find the model's
`static get unique()`, and prove the write after a reload.

**11 · Client-side lookup filters: check the comparison.** The served lookups lower-case both
sides (`MOB.389` guards it). A new lookup that lowers only the query reads as "record does not
exist" — check before blaming the fixture.

**12 · Hand-authored steps cannot be regenerated — but they CAN be copied.** `uploadFiles` carries
a `bucketKey` no API mints; `DD_FORCE=1` on its generator destroys it. The key **is portable**:
Datadog re-namespaces it to the receiving test on push, so `upload_steps()` copies MOB.600's
recipe (master copy in `dd_reference/`). Per FILE TYPE, though: a new type needs one hand-authored
step. `build_collector_tests.py` refuses to overwrite `MOB.600` while it holds `uploadFiles`.
Every file input here is hidden — pair with `reveal_file_button(scope=…)`.

**13 · Use a readiness gate, not a blind wait.** Assert each precondition in turn (title → list →
fixture row) so a failure names its cause. Every step polls to its timeout (an untimed one to
Datadog's 60s default), so a positive assertion never needs a `wait` in front of it.

**14 · FontAwesome icons render under their CANONICAL name — look it up, never guess.**

```
node -e "console.log(require('@fortawesome/pro-regular-svg-icons').faSync.iconName)"
```

Aliases are the nastiest case: an import that reads canonical resolves elsewhere
(`head -4 node_modules/@fortawesome/pro-regular-svg-icons/faLocation.js` shows the redirect).

| import | `data-icon` |
|---|---|
| `faSortAlt` | `arrow-down-arrow-up` |
| `faSync` | `arrows-rotate` |
| `faChevronDoubleLeft` | `chevrons-left` |
| `faLocation` | `location-crosshairs` |
| `faEdit` | `pen-to-square` |
| `faMagicWandSparkles` | `wand-magic-sparkles` |
| `faBarcodeRead` | `barcode-read` |
| `faUpload` | `upload` |

Icon-only buttons have no accessible name, so the icon *is* the locator — match both the
`data-icon` and the `fa-` class variants.

**15 · Measure indexes, never derive them.** Render order predicted file input 1; it was 3
(effects run depth-first). Measure against the real page and record that it was measured.

**16 · An input's value is a PROPERTY, not page text.** Mantine's `Select` shows its label as the
`<input>`'s value, invisible to `assertPageContains`. Prefer the persisted source of truth
(`MOB.810` reads `sessionStorage['mobile-MobileJob-sort']`), else a JS step reading `.value`.

**16b · A toast asserted after a long wait can never pass.** `react-toastify` closes at 5000ms.
Assert the toast ~2s after the action, then finish waiting — where the toast is the only
server-confirmed signal this is the difference between evidence and none.

**16c · A test whose proof depends on its previous run must bootstrap itself.** `MOB.550` asserts
a reading the last run wrote; on the first run that critical step aborted the steps that would
write it — failing forever. Put `always` on the steps that write state a later run needs.
`optional` means *this* step may fail and the test passes; `always` means the step runs after an
earlier failure and the test still fails.

**17 · `typeText` APPENDS.** Edit = click → `pressKey` `{"value": "a", "modifiers": ["Control"]}`
(Control — runners are Linux) → type. And re-typing the value a field already holds leaves
`isDirty` false, so the submit does nothing (trap 8) — use `{{ RUNID }}` for a value that differs.

**18 · A component can branch on VIEWPORT WIDTH.** `FormDetails.tsx` renders the desktop form
(`#apm-dv-tabpanel`) at `screen.availWidth >= 750` and `#senor-work-form` below; `chrome.tablet`
always takes the desktop branch. Grep a component for `availWidth`, `innerWidth`, `useMediaQuery`,
`visibleFrom`/`hiddenFrom` before writing locators, and write against the tablet branch. A
phone-only branch goes in `MOB.984_Phone_Suite` (trap 1's exception).

**19 · A generator and its JSON can disagree indefinitely.** `write` will not overwrite without
`DD_FORCE=1`, so a builder fix may never reach the test — a dropped suite child cannot fail, so the
suite stays green. Run `check_drift.py`; when a test fails on a locator you believe you fixed, diff
JSON against generator first.

**20 · A leaf's result history shows only direct triggers.** A subtest inside a suite has none;
its steps are in the parent's result. An empty leaf history is normal. To see whether a leaf runs,
find the suites that wire it and read `dd_tools.py report <suite>`.

**21 · An `assertPageLacks` gate cannot poll — it is a timer, and timers rot as data grows.** It is
true before loading starts, so only the `wait` in front gives it meaning. Gate on a POSITIVE
signal that polls instead.

**22 · A virtualised list mounts only what is on screen.** Never anchor on a named row or header;
assert the SET (e.g. count group headers), and compare POSITIONS, not "the first row is X".

**23 · When a test keeps failing, ask whether a smaller test captures most of the value.**
`MOB.134` (fill a form) failed five times on five causes; `MOB.355` (the form renders) was
available from attempt two and passed first time. Two failures are a signal about scope, not
locators. Prefer template-agnostic assertions where content is configurable, and state plainly
what the smaller test does NOT cover.

**24 · The results API lags a finished run.** A stale "latest" result does not mean the run never
fired. Trust `dd_tools.py run`'s own PASS/FAIL, compare against `date` (the API is UTC), and
**never re-trigger to resolve the ambiguity** — a duplicate mutating run races the first.

**25 · A recorded green is not a current green.** Read every run you trigger. Before quoting
coverage, pull each suite's latest result. A failing run produces a retry result ~5 minutes later,
and results from a superseded version can land after a fresh pass — check a failure's step names
against the local JSON before calling it a finding.

**26 · A component filename is not a feature name.** `ReassignWork.tsx` is `MOB.398` — its button
reads `Assign Work Stage`. Resolve the name to its rendered label, then grep the JSON, before
calling anything uncovered.

**27 · Run every `Run JavaScript` assertion on the bench before pushing.** Datadog reports a thrown
exception, a bad regex and a real defect identically: *"Custom assertion returned a falsy value."*
Classic defects: a raw Python string emitting a literal backslash; a regex over concatenated
`textContent` (React inserts no separator between siblings); a redeclared `const`. Build the DOM
model from the COMPONENT SOURCE, and assert both directions — realistic states pass, every defect
the assertion claims to catch returns false. jsdom quirk: its parser closes a `<p>` at a `<div>`.

**28 · A hidden input cannot be clicked by Datadog — `element.click()` from JS, and prove the
change IN THE SAME STEP.** Mantine renders checkbox and label as siblings, and the raw input is
"invisible". `HTMLElement.click()` fires React's `onChange` (writing `.checked` does not). Return
`after !== before` from the one step, and never make it `optional`. A working raw click elsewhere
(`MOB.510`'s `VerificationCheckbox`) says nothing about another component.

**29 · Never hardcode which of two records sorts first.** `MOB.580` asserted `A/C Motor 0002`
before `Tank 0000`; the fixture was renamed `⚡ Tank 0000`, which `localeCompare` puts first, and
the test went red against a correct app. Compute order with the app's own comparator. A fixture's
display name is not yours: use it with `contains`, never for equality, order or format. Cheap
triage: assert the app's own record of the pick (the sort key in `sessionStorage`) — green there
and red on order means the expectation is wrong.

**30 · A growing fixture eventually breaks every whole-list invariant.** The crew's list grows
every create run and virtualises, so ASC and DESC render different windows. Narrow with a search
first (the list sorts, then filters), and assert a pairwise invariant — every row present in BOTH
renders comes out reversed. Keep a floor: fewer than 2 rows in common must FAIL.

**31 · Read the property the code sets, not the attribute you expect.** `useFileDialog` sets
`input.capture = 'environment'` as a property; desktop Chrome does not reflect it, so
`getAttribute('capture')` read null. Read `el.capture` (attribute as fallback), and make the bench
model the non-reflecting case. When one step checks several facts, split it into `soft` steps so
the failure names the broken one.
