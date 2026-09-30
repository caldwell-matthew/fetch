# Mobile — test authoring reference

*What to consult while WRITING a test. Nothing here is coverage state.*

| file | question |
|---|---|
| `testing_checklist.md` | what is left to do, and what has run |
| `coverage.md` | what a green run proves |
| **`test_authoring.md`** | how to build a test and prove it locally without repeating a known mistake — the loop, fixtures, operational rules, tooling, the 58 traps |
| `bugs_found.md` | what the tests found in the app |
| `cleanup_spec.md` | test residue: what exists, what can be removed, never-touch fixtures |

🛑 **The traps are the load-bearing part.** Each is a mistake that has already cost at least one
run. Read the relevant trap *before* debugging a locator.

## The loop — build it in Playwright, prove it locally

The TypeScript in `e2e/mobile/tests/` and `e2e/mobile/suites/` is the source; local runs are free but touch dev's shared
data, so they run headless, and a data-changing one starts from fixtures at rest. ⛔ Datadog is paused (2026-09-18):
nothing is pushed or run there, and its tools live in `legacy/` (not used).

| # | step | how |
|---|---|---|
| 1 | Read the component on `origin/development` — its branches, its submit path, what a closing modal really proves (traps 6, 8, 18) | `git -C "$MENTORTWO_REPO" show origin/development:client/mobile/…` |
| 2 | Write the test in `tests/MOB.<n>_<Name>.ts` (an exported `mob<n>(page)` — or `(browser)` when it needs its own browser), and call it from its suite in `suites/`; a new suite also goes into `tools/suites.json` (`writes`, `order`, `after` when it must be reset) | fixture ids from `support/fixtures.ts`, URLs from `appUrl()` — never literals |
| 3 | Type-check | `cd e2e && npx tsc --noEmit` |
| 4 | The static checks — every new page-side JS body needs a bench case with a must-fail twin (trap 27) | `node e2e/mobile/tools/check_js_assertions.js` · `.venv/bin/python e2e/mobile/tools/check_literals.py` |
| 5 | Fixtures at rest, then run it until it is green — or red only where it pins a bug — **twice** | `.venv/bin/python e2e/mobile/tools/fixtures.py` · `cd e2e && npx playwright test mobile/suites/MOB.9xx… -g "MOB.<n>"` |
| 6 | Read its evidence before describing it: the screenshot it saves in `e2e/results/`, the trace on a red (trap 45) | `npx playwright show-trace e2e/results/artifacts/…/trace.zip` |
| 7 | Update the docs in place (checklist row, coverage, traps, bugs) | `.venv/bin/python e2e/mobile/tools/check_docs.py` · `source_coverage.py --write` |

- **A write is proven by a server read** (`serverRead`), never by a toast or a closed modal (trap 6). A read-only test
  proves it sent nothing: a route that stops mutations and counts them (`MOB.930`, `MOB.332`).
- **A test that changes its browser's state gets its own browser** — offline, routes that answer or refuse requests,
  a cleared local store, a moved clock: `freshSession(browser, { touch? })` inside the test, closed in `finally`.
- **Refusals and empty states are made in the browser, never on dev:** `failOperation` refuses one mutation
  (`support/network.ts`); a route that passes the real answer through with one field changed fakes a rare state
  (`MOB.946`, `MOB.544`). Refusing one mutation does not make a test read-only (trap 52).
- **A bug the app has is pinned, not worked around silently:** the test returns the symptom, and the suite calls
  `test.fail(true, 'bugs §N: …')` and throws when it appears — green by itself once the bug is fixed (`MOB.124`, `MOB.129`).
- **A pass** is `playwright_pass.py`: the read-only suites, then each data-changing suite alone with the fixture checks
  before it (and its `after`, e.g. `MOB.985`'s AV reset). Its report and evidence land in `e2e/results/passes/mobile/`.
- **Probes** — throwaway diagnostics that read what no test does (network, component state, the page's Apollo client or
  Mapbox map through React's fiber) — go in `mobile/probe/`, run with `E2E_PROBE=1 npx playwright test mobile/probe/<name>`,
  and are deleted when done unless a bug entry cites one.

## Fixtures

| Fixture | Id | Used by | Must stay |
|---|---|---|---|
| Work order | `EYRpYJ9QYdQ1JFF10JtB0Q` | MOB.134, MOB.310–399, MOB.911/912, MOB.951 | crew `Admin`, status **`Ready`** (`MOB.320` restores it `always`; outside In Progress/On Hold/Ready it leaves the crew's list — bugs §25). `desc` owned by MOB.395, ends every run `DATADOG FIXTURE`. **No `project` — it must stay that way.** General Info resubmits every field, so referencing a project makes the server reject *any* save on this form, and every project on dev has a null account (bugs §46) (`preflight.py work` checks it). Holds ONE permanent condition (`Pump 0102 · Structural · Mounting/Support`, 1/2/3 — `MOB.386` edits Condition Left and restores 2) and ONE failure (`MISSED`) — each the unique key's slot (bugs §40). Its first form's first integer field is empty at rest (`MOB.134` writes `134` and clears it). Address/x/y owned by `MOB.352` (rest `230 North Alexander Street, New Orleans, LA 70119` · -90.1025785 · 29.9782827); its one asset link (`Pump 0102`, `Active`, sequence 1) owned by `MOB.353`; `MOB.354` adds and removes a `Bypass Valve 0001` link |
| Work order | `RcdI0xcpc8NBV8VoRNNBYM` | MOB.302 | holds the photo `MOB.302` links to `Bypass Valve 0001` |
| Work order | `xohY0klBZktB9VBRxc8k4J` (`20260910-16`, created by `MOB.396`) | MOB.363, MOB.364, MOB.365 | `Ready`; exactly 8 crews including `Admin`; no schedule entries; no attachments; one asset, `⚡ Tank 0000`; template `All Tabs` with `copyAttachmentToAsset` off. 3 forms at rest — `MOB.364` attaches one and deletes it |
| Second work order | `Vg5Qd9VddQJIYNR48Yhk9l` (`20260929-19-001`) | MOB.342, MOB.357 | made by `setup_second_fixture.py` (2026-09-29): a `Datadog Test` work order described `DATADOG FIXTURE 2 …` (no residue marker), **`In Progress`** — the crew's list's second status — holding `DATADOG FIXTURE REQUIRED FORM`, whose one field (`🔢1`) is required and UNFILLED. `fixtures.py second` checks it |
| PM route stage | `58JgBIYA1cBQxoQVwJ5FRw` (`20260929-18-001`) | MOB.366 | made by `setup_pm_route.py` (2026-09-29): `pmRoute`, `Ready`, its three routed assets (Pump 0144 · 1, Pump 0066 · 2, Pump 0101); its workflow stage's template has `showAssetStatus` OFF. Its trigger is inactive and fired once — re-running the script makes nothing. Read it, never write to it |
| Mobile job | `Z0EVwQcdJZhMURcBFkp0E0` "DATADOG MOBILE JOB" | MOB.500–590, 536, 537, 913; MOB.513/514 grow it (`MOB.985`, reset after) | crew `Admin`, `READY`, exactly **2 assets** — `⚡ Tank 0000` (tag `0000`; the symbol is part of the stored name) and `A/C Motor 0002` (no tag) — neither verified. `reset_av_fixture.py --check` asserts it for 0 runs; match names by **containment** (trap 29) |
| Asset | `Pump 0102` | MOB.387, 389–391, 700, 710 | attached to the work order; `desc` owned by MOB.710, ends `DATADOG FIXTURE`. 🛑 **Never touch its attachments** (owner). Address, city and postal code owned by `MOB.359` (restored `always`; lat/long never written) |
| Asset | `Bypass Valve 0001` (`wFRo1MMwoAMkdxA4hVpIhB`) | MOB.302, MOB.354 | no photos at rest — `MOB.302` links one and unlinks it; no location, and never left linked to a work order (`MOB.354`) |
| Asset | `⚡ Building 0000` | MOB.721, MOB.914 | zero event readings |
| Asset | `⚡ Tank 0000` (the mobile job's asset) | MOB.546, MOB.914 | at least one photo with a gear — `MOB.914`'s fixture guard |
| Asset type | `Actuator Tools` | MOB.600 | exists |
| Datadog test | `MOB.PDF_Upload_Recording` (`nz9-uj4-5jd`) | MOB.628, MOB.866 | 🛑 **never delete** — its one recorded `uploadFiles` step stores the PDF they upload (`dd_tools.RECORDED_PDF`, trap 12). Paused, no local JSON (`preflight.py sync` ignores it) |
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
  (`Job.tsx` bails on a cold cache) — go through the job list and click the row (`MOB.928`'s way). Work-order lookups are `cache-only` too,
  filled only by `prefetchWorkData` on the crew's list — visit `/work` before deep-linking.
- **Mutating tests self-restore, in `finally` / `always` legs.** A Playwright test reads the value first and puts it
  back (`MOB.136`'s signature, `MOB.930`'s layers); the converted tests restore FIXED values, because Datadog could not
  interpolate a read value into a step.
- **Crew-scoped data is shared state.** `mobileJobsForCrew` and `workStages(crew: '<SESSION>')`
  are crew-scoped, so anything switching crews changes what other tests see — why `MOB.200` is in
  no suite.
- **The crew's work list grows with every create run** (~4 work orders per full pass) and virtualises. Anchor on the
  fixture by id; on the list, narrow before measuring (trap 30).
- **Classify a test by what it leaves on the SERVER**: `read-only` (no server write; a restored
  sessionStorage toggle still counts), `self-restoring` (writes, puts it back), `leaves-residue`, or `reset after`
  (its suite's `after`). Classify by reading the code, not the name; `tools/suites.json`'s `writes` and `about` are the
  record.

**Datadog only** (paused 2026-09-18 — these apply if it resumes):
- **Deleting a test from Datadog requires un-wiring it first** — the API refuses a test used as a
  subtest. Remove the `playSubTest` step → `push` → delete.
- **Push and pull only the tests being edited** (owner). `dd_tools.py push` takes test names and refuses
  without them; never sync everything as a side effect, and never rebuild a test only to tidy its description.
- **`write` refuses to overwrite existing JSON without `DD_FORCE=1`** — the JSON is the source of
  truth for anything hand-authored (trap 12).
- **Scheduling: manual today; weekly Datadog runs are the owner's late-game plan, once no more
  tests are being made** (checklist #37); every suite's local runtime is in `local_runs/timing/summary.md`, its Datadog runtime in the checklist's suite table. All tests are `paused`, and `push` omits `status`, so enabling a schedule needs a
  deliberate push change — suites only, staggered (trap 1).

## Tooling

All in `e2e/mobile/tools/`, run from the repo root with `.venv/bin/python` (0 Datadog runs).

| Command | Purpose |
|---|---|
| `playwright_pass.py [--dry-run] [--stage 1\|2] [--from MOB.9xx] [--keep-going]` | ⭐ a full pass in the safe order (trap 1): read-only suites together, then each data-changing suite alone, `fixtures.py` before each and at the end, a suite's `after` straight after it. Stops at the first red |
| `suites.json` | ⭐ the suites: spec, children, `writes`, `order`, `held`, `after`, and what each does to dev's data |
| `fixtures.py [av work mob302 mob39x second pmroute]` | are the shared fixtures at rest? Read-only |
| `check_docs.py` | OPEN WORK rows open, `#N` citations resolve, the counts current — after any doc or test change |
| `node check_js_assertions.js` | the bench: every `assertFromJavascript` body run in jsdom against a DOM modelled on the component source, each with a must-fail case (trap 27); `${…}` of a `support/fixtures.ts` constant is filled in, any other refused |
| `check_literals.py` | every asserted literal still exists in the served app |
| `coverage_report.py` | the coverage page — each test passed / failed / pinned with its evidence, the checklist's gaps, the open bugs, the code reached; `--open` shows it |
| `sweep_strings.py` | the app's on-screen text no test contains — each hit read by hand; a gap becomes an OPEN WORK row |
| `source_coverage.py [--write]` | which `.tsx` files a test reaches, by module (`docs/source_coverage.md`); `UNREACHABLE` lists the dead ones |
| `tighten_waits.py` | drops a fixed wait that only precedes a check which polls anyway |
| `reset_av_fixture.py [--check\|--apply]` | the Asset Verify fixture job back to rest — `MOB.985`'s `after` |
| `setup_second_fixture.py [--apply]` · `setup_pm_route.py [--apply]` | make the second fixture work order / the PM route stage — dry run by default, idempotent |
| `cleanup_residue.py [--apply]` | prune test residue by marker, delete by id, org SMCT2 only — dry run by default (`cleanup_spec.md`) |

**Helpers** — shared so there is one copy; do not hand-roll local versions.

| helper | use |
|---|---|
| `support/fixtures.ts` | every fixture id — the one place a move changes |
| `appUrl(path)` · `freshSession(browser, { touch?, device?, clock? })` · `serverRead` · `serverReadDirect` · `persistedCacheHas` (`support/session.ts`) | a URL on the configured host · a logged-in throwaway browser · a `/graphql` read with the page's session (`Direct`: from Playwright, works while the page is offline) · whether the persisted Apollo cache holds something yet (trap 41) |
| `failOperation(page, { field \| operation, variables? }, failure)` · `watchOperations` (`../support/network.ts`) | refuse one GraphQL call in the browser (match a mutation by its FIELD, trap 43) and count the hits · record which operations went out |
| `waitForPrefetch(page, { ignore? })` (`support/prefetch.ts`) | the list pages' lookup prefetch and downloads finished — before a form that needs cached schemas (bugs §42) |
| `openAssetCard` · `openWorkStageCard` · `openChangeAsset` · `setLayer` / `shownLayers` / `readMapId` · `attachMap` / `mapView` (`support/map.ts`) | a map card the way a user opens it · a work layer switched and proven over `/graphql` · the page's Mapbox instance and its zoom, pitch and centre (trap 55) |
| `Sequence` / `run.step(name, { allow, always })` · `assertFromJavascript` … (`../support/dd.ts`) | the converted tests' step runner: `allow: 'ignore'` an optional step, `'soft'` a critical one the test continues past, `always` a restore leg that runs after a failure |

---

## Locator & assertion traps

*1–17 are locator/assertion traps; 18–27 process traps (how tooling, fixtures or framing misled);
28–58 more locator, fixture, offline, map, API and scheduling traps.*

**1 · Never add a second `device_id`.** Datadog runs each device as a **concurrent** session, and
the mutating tests share one fixture, so two devices race (caught when a phone session walked the
work order while the tablet asserted its status). It hides itself: on some runs one device died at
login and the suite looked clean. `set_device.py` enforces it. **The one exception:**
`MOB.975_Phone_Suite` (the `_Phone_` tests) — ONE device (`chrome.mobile_small`), READ-ONLY, never
alongside a mutating tablet suite.
🛑 **The on-demand concurrency cap stays at 1.** (`GET/POST /api/v2/synthetics/settings/on_demand_concurrency_cap`). Raising it does not change billed RUNS, but Datadog bills every **Parallel Testing Slot** by the month, on its own invoice line: with the cap at 10, September 2026 billed 5 slots, $513 by the 18th and $1,026 projected for the month. Never raise it without the owner's and their manager's say-so. At 1, suites named together in one `dd_tools.run` queue and run one after another. Only READ-ONLY suites may share a trigger or a slot; writing suites run one at a time and never beside a read-only one (they read the fixtures the writers change); `MOB.973` runs alone. Ten logins at once made the app shell mount past the old 60s gate — `MOB.000`'s `Test authenticated mobile shell rendered` is 120s for that reason; do not shorten it.

**2 · Never write a delete step unless the owner names the flow.** A delete code path existing
(e.g. the gear in `ui/Menu.tsx`) does not make it supported. **The named flows — only these:**
- `MOB.390`/`391` — `Delete Item` on the condition / failure card THIS run added (a key the
  fixture lacks; the premise proves it absent first; the guard shares a step with the gear click;
  a reload proves the original untouched).
- `MOB.302` — `Delete Photo` on `Bypass Valve 0001`'s Photos tab, never `Pump 0102`.
- `MOB.361` — `Delete Item` on the job note it added this run (owner 2026-09-15). The premise
  asserts over `/graphql` that no note carries `DD SYNTHETIC MOBILE 361`, and stashes the ids the
  server held, so only this run's note can be the target.
- `MOB.363` — `Delete Photo` on the photo it just uploaded to work order `20260910-16` (owner
  2026-09-15). Asserts the menu set first and clicks `Delete Photo`, **never** `Copy to asset`.
- `MOB.364` — `deleteWorkStageForm` over `/graphql`, because mobile has no remove for an attached
  form (owner 2026-09-15). One shot; it refuses any id the stage already held before this run.
- `MOB.627` — `Delete Photo` on its own upload only (owner 2026-09-15); the guard requires the
  last carousel slide to BE our photo. ⚠️ Its created org tag is permanent — mobile cannot delete
  one, so that is residue, not a delete.
- `MOB.628` — `Delete File(s)` on its own PDF (owner 2026-09-15). `deleteFiles` removes EVERY
  selected row, so the guard is that the only checked row is ours.
- `MOB.866` — both deletes are on the storeroom item's own uploads (owner 2026-09-15); the server
  step proves the item holds exactly one attachment and stashes its id for the guard.
- **Add an asset to a work order from a map card** (`MOB.929`) — remove the ONE `workstageasset` link this run
  added (owner 2026-09-23). The picker cannot reach the fixtures (bugs §50), so the link goes on a test-made work
  order; the test reads the stage's assets first, adds one, proves it over `/graphql`, removes exactly that link,
  and proves the stage is back to what it read.
- **Attachment types** (`MOB.933`–`MOB.936`) — delete only what
  THIS run uploaded, on the records the attachment tests already use, never `Pump 0102` (owner 2026-09-23).
- **Asset attributes** (`MOB.944`) — `Remove Attribute` → `Yes` on the ONE attribute this run added, on a
  `DD SYNTHETIC MOBILE` test asset only (owner 2026-09-28). The test reads the asset's attributes first; a route
  refuses any `removeAttributeFromAsset` whose ids are not exactly that one attribute's.
- **Replace a work stage's assets from the map** (`MOB.128`/`MOB.129`) — `Replace existing assets.` → `Use Map` →
  `Confirm` removes EVERY asset link on the stage, so only on a Ready `DD SYNTHETIC MOBILE` work order the test
  account made, never a fixture (owner 2026-09-29). A route lets through only the replace's own four mutations on
  that stage; the stage ends linked to the picked asset alone, moved back beside it.

**Not a test's delete — the reset:** `MOB.513`/`514` add assets to the Asset Verify fixture job and leave them;
`reset_av_fixture.py --apply` unlinks them and deletes the `DD SYNTHETIC MOBILE AV …` one, run by `playwright_pass.py`
as `MOB.985`'s `after` (owner 2026-09-29: run, then reset).

**Not a delete, decided 2026-09-23:** `MOB.930` opens the change-asset popup (`Replace existing assets` — "cannot
be undone") on the fixture work order and cancels it; the map's drawing tools may **create** work orders and
assets, marked `DD SYNTHETIC MOBILE`, left as residue for `cleanup_residue.py`.

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

**6b · A TOAST SWALLOWS DATADOG'S NEXT CLICK.** Datadog clicks at the element's coordinates and does not wait for it to be actionable; Playwright (`local_run`) waits, so a local replay hides this. react-toastify's container is `top-center` and covers the page-title controls for its 5s `autoClose`. Measured 2026-09-16: after `MOB.352`'s save, `Work stage location has been updated` lay over the MapLink globe — the local click waited 4s and passed, the Datadog click hit the toast and the menu never opened (red twice, same step). After a save, gate with `toasts_gone()` before clicking anything near the top of the page.

**6 · "The form closed" ≠ "the record was created."** It depends on the callback the close is
wired to — read the submit path, not the test name:

| pattern | proves |
|---|---|
| close inside Apollo `update()`, **no** `optimisticResponse`, default `errorPolicy` | server confirmed (MOB.300's create form) |
| close only when `result.data` is present | server confirmed (`StockAdjustments`, MOB.860/870) |
| close inside `update()` **with** an `optimisticResponse` | **nothing** — `update()` runs first on the optimistic result (`addToCollection`, `updateCollectionRecord` — bugs §40) |
| `.then` on a non-awaited `mutate` returning an optimistic value | **nothing** (MOB.600's `createAsset`) |

Where it proves nothing, read the record back **after a reload** (`prove_record_count`). Never
read back a row the client just prepended (the collector prepends its new asset before the server answers).

⚠️ **A reload is not a server read.** The app persists its Apollo cache to IndexedDB
(`apollo3-cache-persist`, saved on every cache write) and the work-order detail query is
`cache-first` with no refetch, so a reload of a page this run already visited renders the
**persisted cache**. That is still a proof for writes made through `optimisticResponse`: Apollo
persists only the base cache, and a refused write never reaches it. It is **no proof** for a write
the app makes straight into the cache before the mutation — `StatusMenuIcon`'s status
(`cache.modify`, then `mutate`) and `removeFromCollection`'s delete (`cache.modify`, then a
fire-and-forget `mutate`). Read the write path before trusting a reload; for a real server read use
a `network-only` surface (Asset Lookup, as `MOB.302` does) or `dd_tools.server_assert` (a same-origin
`/graphql` read — `MOB.320`, `MOB.390`/`391`, `MOB.386`).

**7 · Toasts are transient, and some fire before the mutation.** `NewItemForm` toasts `Item added` before the
server answers (bugs §48). `AdHocForm`, `VerificationCheckbox` and the event-readings form wait for the server when
online, but offline they toast at once — the queue holds the mutation open — so even there a toast says
only that the server answered or that the change was queued. Demote a toast to `optional` only after
replacing it with something stronger.

**8 · Submit on an invalid form does nothing.** `SubmitButton` is `type={isValid ? 'submit' : 'button'}`
— a soft-disabled "can submit now" gate: the tap never reaches `onSubmit` and no error shows on a
field nobody touched — so "clicked, no toast" is ambiguous. Required fields come from the **runtime** schema,
which can demand more than the model file (`unitPrice` broke MOB.380).
**An ARMED Submit is not a save either.** Wait for `button[form=…]` to be `type="submit"` before the
click (`MOB.390`'s Datadog run 1 clicked it while still inert), then prove the save on the server: a
zod schema built before its fields load is empty — always valid — and strips every value, so the
submit handler's guard returns without a request (bugs §42, `MOB.386`).

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
(Control — runners are Linux; `local_run.py` sends ⌘ on macOS) → type. And re-typing the value a field already holds leaves
`isDirty` false, so the submit does nothing (trap 8) — use `{{ RUNID }}` for a value that differs. On Datadog, `pressKey Delete` after a select-all did NOT clear a
Mantine `NumberInput` (`MOB.134`; the local replay did): clear through the native value setter and an `input` event.
🛑 **A SUITE'S CHILDREN SHARE LOCAL VARIABLES BY NAME — the first definition wins.** Inside `MOB.980`, `MOB.722`'s `RUNID` (`{{ numeric(5) }}`) received `MOB.710`'s 8 digits and its `722` + five-digit guard went red on Datadog (2026-09-16) after passing solo. `local_run` shares them the same way, so a local replay shows it too. Give a local variable a name no sibling in the suite declares differently (`MOB.722` uses `RUNID722`); `preflight.py locals` fails on a clash for 0 runs.

**18 · A component can branch on VIEWPORT WIDTH.** `FormDetails.tsx` renders the desktop form
(`#apm-dv-tabpanel`) at `screen.availWidth >= 750` and `#senor-work-form` below; `chrome.tablet`
always takes the desktop branch. Grep a component for `availWidth`, `innerWidth`, `useMediaQuery`,
`visibleFrom`/`hiddenFrom` before writing locators, and write against the tablet branch. A
phone-only branch goes in `MOB.975_Phone_Suite` (trap 1's exception).

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
locators — but probe before archiving: `MOB.134`'s last cause was the VALUE (letters typed into a
`NumberInput`, which drops them), and it passed locally once it typed digits (`build_form_fill_test.py`). Prefer template-agnostic assertions where content is configurable, and state plainly
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

**32 · A message that flashes cannot be polled — record it before the action.** Mantine's `Menu.Item`
closes its menu on click even after the handler calls `preventDefault`, so an offline popover inside
the dropdown mounts and unmounts within ~200ms (bugs §43); an assertion after the click polls an empty
page. In the SAME step as the click, install a `MutationObserver` that counts the message
(`window.__dd626Seen`), guard the click (offline icon present — online it opens a file dialog or posts
to the AI route), then assert the count. On the bench, pass `MutationObserver` into the step and await
a macrotask after each DOM change — observer callbacks are asynchronous.

**33 · A dispatched `offline` reaches only what is already mounted.** Mantine's `useNetwork` (8.3.18)
starts `online: true` and copies `navigator.onLine` on mount — which a dispatched event does not change
— so only instances mounted before the window `offline` event flip. The same event closes the app's
`QueueLink`, so a query fired after it hangs: a loading overlay, not the offline message. Open the
panel online, then go offline (`MOB.914`'s Readings); a panel that must mount offline needs a second
dispatch after it mounts (its Work History).

**34 · A modal that closes itself must be recorded — and the recorder must skip what was already open.**
A MentorLens tag's description modal closes after 3s (`LensTags.tsx`, `DESC_MODAL_AUTO_CLOSE_MS`); Datadog's
step overhead makes "click, then read it next step" a race. Install a `MutationObserver` before the click
(trap 32) — but snapshot the modal bodies ALREADY mounted and record only new ones: filtering by text caught
the `Get New Asset` form behind the editor, whose carousel keeps mutating (`MOB.622`, local replay 1). Then
assert the self-close too: only the snapshot's bodies remain.

**35 · Click what carries the handler — from JS when it sits inside something that writes.**
- A button inside a clickable card: the `?` beside a MentorLens tag stops propagation, but the card's own
  onClick ASSIGNS the tag (a server write) and Datadog clicks by coordinates (trap 6b). `.click()` the
  icon itself from JS and read the card back unchanged (`aria-checked`) — `MOB.622`.
- `GeoLocateButton` is `<ActionIcon component="span">`: `closest('button')` finds nothing. Click the
  `mantine-ActionIcon-root` (`MOB.629`, as `MOB.358`/`911`).
- `MultiLineLabel` puts `onClick` on the `<svg>` inside an `ActionIcon aria-label="Settings"` that does
  nothing. An `<svg>` has no `.click()` — dispatch `new MouseEvent('click', {bubbles: true})` on it (`MOB.331`).

**36 · A form field's label section sits BESIDE its input's wrapper.** `FormFieldContainer` renders
`div.form-group > label[for] + div(labelRightSection) + the input`, so anything drawn beside a label (the
value arrow) is a sibling of the Mantine `InputWrapper`, not inside it: scope to `.form-group` (`MOB.331`).
On the bench, model markup faithfully: an HTML string cannot nest `<button>` in `<button>` (the parser
closes the outer one — React builds it with DOM calls; model the outer as a `div` with the same `role`),
and a model `<button>` needs its real `type` — typeless inside a `<form>`, it SUBMITS it (Mantine renders
`type="button"`, `UnstyledButton.mjs:53`).

**37 · A field can be null on the server and set in the cache.** `mobileJob.assetsVerified` exists on the
type, but the server returns `null` — it is filled in client-side off the job list. A `/graphql` proof
read it as 0 and failed (`MOB.510`, local replay 1). Count what the server stores (`assets { verified }`).

**38 · One click can queue more than one mutation — and the count belongs to the fixture.**
`VerificationCheckbox.update()` runs off the optimistic response, offline too, and recomputes the job
status; verifying from `READY` therefore queues `VERIFY_ASSET` AND `UPDATE_MOBILE_JOB_STATUS`. `MOB.913`
read 1 pending while the fixture rested `IN_PROGRESS` and needed 2 once it rested `READY` — it went red
on Datadog though no step of it named a status. When a fixture's rest state moves, re-read every test
that COUNTS something about it, not only those that assert the state.

**39 · A gate can only wait for something that is coming.** A gate on a control that renders only once some data is
cached waits forever when nothing on the page asks for that data. Before gating, find what requests it; if nothing on
the path does, prime it through the user's own path (a picker whose query loads it, closed unused) — THEN gate.

**40 · Datadog's scheduler, as measured.** Browser `tick_every` is 60–604800s — weekly at most.
`options.scheduling` is `{timezone, timeframes: [{day, from, to}]}`, **`day` is ISO (Monday = 1)**
(`schedule_probe.py`, 2026-09-17), and all of a test's windows must share ONE start time (`All start
times should be equal`). `retry.interval` is MILLISECONDS (our `300` is 0.3s). Live/paused is NOT in the
test body — it has its own endpoint, which `push` now calls. Scheduling is per test and nothing orders
them, so suites that share fixtures are kept apart by slot (`suite_plan.SLOTS`, `preflight.py
schedule`). Only suites are scheduled: a live leaf that is also a suite child bills twice.

**41 · The persisted cache is written a moment AFTER it changes.** The mobile app keeps its Apollo cache in
IndexedDB (`persistCache`, `apollo-cache-persist`), and the write is debounced. A test that reloads the instant a
change lands reloads from the OLD cache, and the change looks lost: `MOB.927` saw a synced note vanish after a
reload one second after the sync — and survive the same reload fifteen seconds later (measured 2026-09-23; a
false bug nearly filed). Before reloading to check that something persisted, wait for it:
`persistedCacheHas(page, needle)` in `e2e/mobile/support/session.ts`.

**42 · The map opens a card on a TOUCH, and only for an icon it drew.** `Map/MapGL/index.tsx:99` selects features
on `touchend` alone — a mouse click on the canvas does nothing, so a test that taps the map needs a context with
`hasTouch` (`freshSession(browser, { touch: true })`) and `page.touchscreen.tap`. "View in Map" opens the card by
itself (`Map/index.tsx:139-186`), but only for an asset whose icon is RENDERED, looked up on a source event: Pump
0102's spot is covered by Tank 0040's icon at every zoom, so Pump 0102's card never opens, and even Tank 0040's
sometimes does not (the icon drawn after the last event). `MOB.929` waits, then taps just below the purple marker.

**43 · The operation name the app SENDS is not always its generated document's name.** The add-asset mutation is
`ADD_ASSET_TO_WORKSTAGEDocument` in the source and goes out as `MOBILE_WORK_ADD_ASSET` (measured 2026-09-23). A
route that matches on the generated name never fires — a guard built that way guards nothing. Match a mutation
on its FIELD in the query text (`addWorkStageAssetLink`) — `failOperation(page, { field: … })` in `support/network.ts`
does — and assert the route was hit.

**45 · Playwright's failure screenshot is of ITS page, not yours.** A test that opens its own browser
(`freshSession`) or runs on a suite's shared page fails with a screenshot and `error-context.md` of the unused `page`
fixture — a blank or home screen that says nothing. Such a test catches its own failure, saves
`page.screenshot({ path: 'results/MOB.9xx-failure.png' })`, and rethrows (`MOB.930`, `MOB.933`–`MOB.935`).

**46 · A test-made record's NAME is an interface.** Older tests pick "the first collected row containing
`DD SYNTHETIC MOBILE`" and then require exactly `DD SYNTHETIC MOBILE <8 digits>`. `MOB.932`'s map asset
(`DD SYNTHETIC MOBILE MAP <8 digits>`) sorts first and would have turned them red; they now skip `… MAP` rows, and
new tests match `/DD SYNTHETIC MOBILE \d{8}/`. A new kind of test-made record gets a name no existing selector takes
for its own — and keeps the `DD SYNTHETIC MOBILE` prefix so `cleanup_residue.py` prunes it.

**47 · A video is not a photo in the carousel.** Its slide is a `Play <file name>` button over its preview
(`ui/PhotoCarousel/Video.tsx:38-51`) — no `<img>` carries its attachment id — and its menu says `Delete Video`, not
`Delete Photo`. Find it by its file name (`MOB.933`).

**48 · A failed final check hides the first failure.** An `expect` in `finally` that fails replaces the error that
got there. Check the end state AFTER the `try`, and in a `catch` add what was left behind to the original message
(`MOB.933`–`MOB.935`).

**49 · A fixed `wait` is for a step that cannot wait for itself.** Every `assert…` helper and `click` polls until its
timeout, so a sleep in front of a positive check only adds time. Keep one before `assertPageLacks` or an
`assertFromJavascript` that can pass at once (a check that something did NOT happen), before typing into a form that
re-renders, and before a server read. Wait for the app's prefetch with `waitForPrefetch` (`support/prefetch.ts`, the
app's own loading bars), not a sleep — on the work list pass `ignore: WORKSTAGE_DOWNLOADS`, or it waits minutes for
every assigned stage's details. `tools/tighten_waits.py <suite>` applies both rules to a converted suite: 1,088 waits
went to 559 and a full local pass from 140 to 100 min (2026-09-24), every suite green twice after.
The work list's full-download gate (`LOADEDALL 3/3` and its 10s idle check) is only for a test that opens work
orders other than the fixture: they render from those downloads. The list's own controls work while the downloads
run — the app gates only sorting and the prefetch on `loadedAll` (`WorkOrders/index.tsx:70-164`) — so `MOB.300`,
`MOB.301` and `MOB.937` click the create button after the lookups alone (2026-09-25). A test that leaves the list for
the fixture waits for the lookups only — the full wait cost 141s in `MOB.135` with 502 stages, and it grows: the crew's list gains about 29 `Ready`
stages a day from dev's scheduled PM job ("Application Job": 573 of 600 on 2026-09-28, 546 of them from the `High Score
Maintenance Strategy`'s two daily triggers — `🔧 Repair` and `🗓️ Monthly PM Inspection`), far more than test residue.
Those two were set inactive on 2026-09-29 (owner; `kJMkQFZNJBFYRV8AxA5twl`, `5cU1xslBNUl1RxUA4ZwVNF` — `active: true`
undoes it); the ~600 stages they made stay in the list. `MOB.349` (record cycling) waits for every download itself; `MOB.397` keeps its gate (`NEEDS_ALL_DOWNLOADS`
in the tool). With that and the login's 10s sleep replaced by a wait for the shell, the pass went to 83 min.

**50 · A list read returns ONE page — 500 rows by default.** `workStages(crew: "<SESSION>")` with no `params` returns
the first 500; the test crew passed 500 stages on 2026-09-24, and `fixtures.py` then read the fixture
work order (at 501) as "not in the crew's list" when it was. Pass `params: { limit: 1000 }` (a limit of 5000 silently
comes back as 500) and compare `pageInfo.totalCount` with the rows read. The list grew about 29 stages a day from
dev's scheduled PM job until its two main triggers were set inactive (trap 49); watch it against the 1000.

**51 · A status change can email people.** Moving a work stage to a status fires its **department's** work
notifications (`server/…/statusUpdate/deptNotifications.ts`: every active user in the named role, whatever their email
setting) and, once per stage, its forms' `SEND_NOTIFICATION` triggers (`fireFormTriggers/actions/sendAlerts.ts`). The
fixtures sit in the `Admin` department, whose `Complete` notification ("Test Role Trigger") emailed all 14 Admin users
every time `MOB.320` completed the fixture work order and `MOB.511`'s job completion completed `20260715-9-001`. Since
2026-09-25 it goes to the role **`Test Notifications Only`** (`dgQh4IMBgwFgYxdVQFMcxA`), which exists only to receive it:
**keep that role empty**, and never point it back at a role people hold. It is also a crew since 2026-09-29 (`crew: true`),
so the create form's `Assign to Crew` offers it: `MOB.303` assigns its work order there, reaching no one. A new test that moves a stage in another
department, or to another status, reads that department's `departmentWorkNotifications` first. The `Trigger Test` form
template (the fixture's `⚡Trigger` form) still names `Admin` in two `SEND_NOTIFICATION` triggers: they fire on a stage
that newly holds the form and reaches `Complete`, which no test does today.

**52 · Refusing one mutation does not make a test read-only.** A mutation's `update` runs on its optimistic answer
too, before the server has said anything, and some send writes of their own from there. `VerificationCheckbox`
(`AssetVerification/VerificationCheckbox.tsx:40-66`) sends `UPDATE_MOBILE_JOB_STATUS` from its `update`: `MOB.940`
refused the verify in the browser, and its first run still moved the fixture job to `IN_PROGRESS` on dev (2026-09-25).
Before calling a refusal test read-only, read the mutation's `update` and `onCompleted` for further `mutate` calls,
refuse those too, and assert over `/graphql` that nothing changed — `watchOperations` (`support/network.ts`) shows
what the page actually sent.

**53 · A form's on/off field is a `react-switch`, not a Mantine `Switch`.** `FormField type="boolean"`
(`helper-components/MentorInputs/BooleanInput`) renders `react-switch` inside a full-width `div.boolean-switch`: the
`<input id="<field>">` sits under the styled switch and takes no click, and the wrapper's centre is empty space. Tap
`.react-switch-bg` inside it, and assert the input's checked state; when a picker is open, the first tap may only close
it — retry until the state changes (`MOB.944`). `MOB.365` clicks the input from page JavaScript instead.

**54 · An empty element is "hidden" to Playwright.** `toBeVisible()` fails on a 0px-tall element that is plainly in
the page: an asset with no reading types renders its Readings form with no field (`No readings recorded for this
asset.`), and `MOB.722`'s "form mounted" check went red the day the newest test asset was a fresh one (2026-09-28). For
a container that may be empty, assert it is PRESENT (`toHaveCount(1)`), then assert what should be in it.

**55 · A map icon is pixels on a canvas, and icons hide each other.** To tap an asset or a work stage, find its pixel
from the page's Mapbox instance: walk React's fiber up from `.mapboxgl-map` to the object with `project` and
`queryRenderedFeatures` (`support/map.ts`'s `attachMap`; `mapView` reads zoom, pitch and centre — `MOB.121`/`124`), project the feature's coordinates, and keep a pixel only if
`queryRenderedFeatures(point)` — what the app runs on `touchend` — holds what the tap should select and
`elementFromPoint` is the canvas (the purple "View in Map" marker, the overlay and the controls sit on top). Tap with a
touch session; zoom with the map's own `+`/`-` buttons. Icons are not drawn at every zoom (Tank 0040's is absent at 15),
and Mapbox drops a symbol that collides with one above it: a work stage's icon (work layers sit above asset layers) on
or next to an asset hides the asset's icon. Two replaced work orders left ON Tank 0040 hid it from `MOB.128` on
2026-09-29 — a test that moves a stage onto an asset moves it off again.

**56 · Some list conditions are ignored on dev.** `TableQuery` conditions go to the server as given, and some columns are
silently dropped — the answer is the unfiltered list, not an error: `EQ` on an asset's `name`, on a user's `roleId`, and
on a work's `workflowTitleId` / `defaultAssetId` all came back unfiltered (2026-09-29). `CONTAINS` on `name` does filter.
Match the name exactly on the client after a `CONTAINS`, and find a record through something that names it (a
schedule's `lastWorkOrder`, the crew's list) rather than trusting a filter. `setup_pm_route.py` fired its trigger's check
twice before this was found.

**57 · A hidden tab panel is `display: none`, not `hidden`.** Mantine renders every tab's panel and hides the inactive ones
with a style, so `[role=tabpanel]:not([hidden])` is simply the FIRST panel. `MOB.351` looked there for estimate cards and
reported "none" for weeks while each tab showed its estimate (2026-09-29). Use Playwright's `[role="tabpanel"]:visible`, or
in page JavaScript the panel whose computed `display` is not `none`.

**58 · A modal that is still fading in already counts as visible.** Playwright's `toBeVisible` does not look at opacity,
and a Mantine modal fades in: `MOB.441` found the logout question visible, read its text and buttons, and its screenshot
showed the Home screen with no dialog (2026-09-30). Before a screenshot — or a click that must land on the finished
dialog — wait for `toHaveCSS('opacity', '1')` on the modal's content.
