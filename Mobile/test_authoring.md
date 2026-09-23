# Mobile — test authoring reference

*What to consult while WRITING a test. Nothing here is coverage state.*

| file | question |
|---|---|
| `testing_checklist.md` | what is left to do, and what has run |
| `coverage.md` | what a green run proves |
| **`test_authoring.md`** | how to build a test and prove it (locally, then on Datadog) without repeating a known mistake — the loop, fixtures, operational rules, tooling, the 40 traps |
| `bugs_found.md` | what the tests found in the app |
| `cleanup_spec.md` | test residue: what exists, what can be removed, never-touch fixtures |

🛑 **The traps are the load-bearing part.** Each is a mistake that has already cost at least one
run. Read the relevant trap *before* debugging a locator.

## The loop — prove it locally, then confirm on Datadog

Datadog run credits are limited, so a test is finished locally: **steps 1–4 cost 0 runs**. Step 5
spends runs and waits for the owner's go-ahead — state the cost when asking.

| # | step | how | runs |
|---|---|---|---|
| 1 | Read the component on `origin/development` | `git show origin/development:client/mobile/…` — its branches, its submit path, what a closing modal really proves (traps 6, 8, 18) | 0 |
| 2 | Build | `build_*.py` → `set_device.py`. Replacing existing JSON needs `DD_FORCE=1`; run `check_drift.py` first (trap 19) | 0 |
| 3 | Static checks | `preflight.py` — or one at a time: the bench (a must-fail case for every new JS step, trap 27), `check_literals.py`, `check_drift.py` | 0 |
| 4 | Replay locally | `local_run.py <test>` until it passes, or is red only where designed (a `soft` bug proof). Before explaining a red, open its screenshot in `Mobile/local_runs/<test>/` | 0 |
| 5 | Confirm on Datadog | `verify.py <test>` — pushes only that test and the scratch harness, then runs it | 2 (3 when red) |
| 6 | Wire | add the child's id to its suite in `suite_plan.py` → `build_module_suites.py` (`DD_FORCE=1`) → `wire_suite.py` → `dd_tools.py push <suite>`. A suite holding `PENDING-WIRE-UP` makes every push fail, and `verify.py` refuses to run after a failed push | 0 |

- **A local pass is a pre-check, not a verdict.** Datadog's browser, location and timing differ;
  only step 5 goes into the checklist's 📊 RUN STATUS. A mutating replay writes what a Datadog run
  writes — `preflight.py` before and after.
- **Uploads replay with a stand-in file** — Datadog's bytes stay in its storage (trap 12), so `uploadFiles`
  sets a same-named file from `Mobile/local_fixtures/` (no such directory today, so in practice always
  the fallback) or a generated PNG/PDF, and really uploads it — *provided the step that opens the
  picker is itself replayable* (see the `userLocator` warning below).
  Replays take `local_runs/.replay.lock`, so two never run against the fixtures at once. ⚠️ That lock
  is why `local_timing` reads a suite's time from `local_run`'s own clock, not the subprocess wall.
- 🛑 **A STEP WITH NO `userLocator` CANNOT REPLAY AT ALL, AND THE TEST MAY STILL GO GREEN.**
  `local_run` needs an xpath; a recorded-element step has none and fails with `no xpath locator on
  this step`. `MOB.600`'s `Open the photo picker ("Add Asset Photo")` is exactly that, so a local
  MOB.600 attaches NO photo — and collecting without a photo persists, so its bugs §34 server proof
  **passes locally while the bug is live**. Measured 2026-09-15: local red at the picker with a green
  server proof; Datadog green at the picker with a red server proof. ➡️ Only Datadog exercises §34.
  Before trusting any local green, check the run for `no xpath locator` errors earlier in the test.
- **What a replay cannot show:** a click Playwright refuses as not actionable is retried forced and flagged, because Datadog clicks it —
  but a forced click on an element still animating can land without effect (`MOB.951`'s Forms tab at
  320px stayed on General Info). Read a flagged forced click before trusting the steps after it.
- **A suite replay shares local variables by name, as Datadog does** — the first definition wins
  (trap 17), so a clash shows locally too.
- **`--continue`** runs past a red step (Datadog stops there) — to see every red, or to time a suite.
- **When a red has a cause the steps cannot show, probe the app locally.** A scratch Playwright
  script can log in through `local_run` (`Run(page, variables, …).steps(login["steps"])`) and read what
  no test step can — network traffic, react-hook-form state, the page's Apollo client (reached through
  React's fiber props). That is how bugs §42 was isolated. Read the server over the API before and
  after, and restore anything the probe writes.

## Fixtures

| Fixture | Id | Used by | Must stay |
|---|---|---|---|
| Work order | `EYRpYJ9QYdQ1JFF10JtB0Q` | MOB.134, MOB.310–399, MOB.911/912, MOB.951 | crew `Admin`, status **`Ready`** (`MOB.320` restores it `always`; outside In Progress/On Hold/Ready it leaves the crew's list — bugs §25). `desc` owned by MOB.395, ends every run `DATADOG FIXTURE`. **No `project` — it must stay that way.** General Info resubmits every field, so referencing a project makes the server reject *any* save on this form, and every project on dev has a null account (bugs §46) (`preflight.py work` checks it). Holds ONE permanent condition (`Pump 0102 · Structural · Mounting/Support`, 1/2/3 — `MOB.386` edits Condition Left and restores 2) and ONE failure (`MISSED`) — each the unique key's slot (bugs §40). Its first form's first integer field is empty at rest (`MOB.134` writes `134` and clears it). Address/x/y owned by `MOB.352` (rest `230 North Alexander Street, New Orleans, LA 70119` · -90.1025785 · 29.9782827); its one asset link (`Pump 0102`, `Active`, sequence 1) owned by `MOB.353`; `MOB.354` adds and removes a `Bypass Valve 0001` link |
| Work order | `RcdI0xcpc8NBV8VoRNNBYM` | MOB.302 | holds the photo `MOB.302` links to `Bypass Valve 0001` |
| Work order | `xohY0klBZktB9VBRxc8k4J` (`20260910-16`, created by `MOB.396`) | MOB.363, MOB.364, MOB.365 | `Ready`; exactly 8 crews including `Admin`; no schedule entries; no attachments; one asset, `⚡ Tank 0000`; template `All Tabs` with `copyAttachmentToAsset` off. 3 forms at rest — `MOB.364` attaches one and deletes it |
| Mobile job | `Z0EVwQcdJZhMURcBFkp0E0` "DATADOG MOBILE JOB" | MOB.500–590, 536, 537, 913 | crew `Admin`, `IN_PROGRESS`, exactly **2 assets** — `⚡ Tank 0000` (tag `0000`; the symbol is part of the stored name) and `A/C Motor 0002` (no tag) — neither verified. `reset_av_fixture.py --check` asserts it for 0 runs; match names by **containment** (trap 29) |
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
  (`Job.tsx` bails on a cold cache) — use `av_job_gate`. Work-order lookups are `cache-only` too,
  filled only by `prefetchWorkData` on the crew's list — visit `/work` before deep-linking.
- **Mutating tests self-restore to FIXED values, restore legs `always`.** Datadog can extract a
  value but not interpolate it into an XPath, so "put back how it was" is inexpressible.
- **Crew-scoped data is shared state.** `mobileJobsForCrew` and `workStages(crew: '<SESSION>')`
  are crew-scoped, so anything switching crews changes what other tests see — why `MOB.200` is in
  no suite.
- **The crew's work list grows with every create run** (~4 work orders per full pass) and virtualises. Anchor on the
  fixture by id; on the list, narrow before measuring (trap 30).
- **Classify a test by what it leaves on the SERVER**: `read-only` (no server write; a restored
  sessionStorage toggle still counts), `self-restoring` (writes, puts it back), `leaves-residue`.
  Classify by reading the steps, not the message. ⚠️ Tags are applied inconsistently (some leaves
  carry none, others mix `read-only` with `class:*`), so never filter on them for safety — the checklist's suite table is the source of
  truth. Change tags in generator **and** JSON together (trap 19).
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

| Command | Purpose |
|---|---|
| `preflight.py [check …]` | ⭐ every 0-run check in one command, or the named ones — `wiring` (no `PENDING-WIRE-UP`) · `sync` (local↔Datadog by content, plus duplicate test names) · `drift` · `literals` · `bench` · `locals` (suite children declaring one local variable two ways, trap 17) · `av` (AV job at rest) · `work` (fixture work order `Ready`, in the crew's list, **carrying no `project`** — bugs §46) · `mob302` (MOB.302's photo/asset) · `mob39x` (no MOB.390/391 leftovers) · `docs` (no finished OPEN WORK row, no `#N` citing a missing row, Rows line and test counts current). Run before any suite. Skips `drift` while a run is in flight |
| `local_run.py <test>` | ⭐ **replay a test locally in Playwright — 0 Datadog runs** (the loop, step 4). The same step JSON with Datadog's rules — polling to each timeout, "Multiple elements found", `optional`/`soft`/`always` — globals read from the API, MOB.000's login prefixed, the test's own device (tablet 768×1020, phone 320×550). Headless by default; a failure saves its screenshot and error to `Mobile/local_runs/<test>/`. `--headed` to watch in a Chromium window · `--continue` past a red step · `--trace` for a replayable timeline (`python -m playwright show-trace`) · `--max-timeout` to iterate fast · `--device large_phone` (430×932, **local only** — no Datadog device) · `LOCAL_RUN_TESTS=<dir>` to replay a sandbox build. `--live` rewrites `local_runs/live.png` each step, but VS Code's image tab does not reload it — watch with `--headed`. Avoid `--slow-mo`: a forced click on a moving element misses |
| `local_timing.py [suite …]` | every suite locally, one at a time (`--continue`), into `local_runs/timing/summary.md` — runtimes for the weekly schedule (checklist #37). A suite's time comes from `local_run`'s own post-lock clock, because the subprocess wall also counts waiting for `.replay.lock` (measured 2026-09-15: MOB.981 walled 423s for a 313s run). `summary.md` is rebuilt from every stored log, so timing a few suites tops the file up instead of replacing it. Its `DATADOG_LAST` map holds the first full pass's Datadog times (2026-09-16), for a local/Datadog ratio |
| `full_pass.py [--dry-run] [--from MOB.9xx] [--stage 1\|2]` (`mobile.py pass`) | a manual full pass in the schedule's order: the read-only suites together, then each data-changing suite alone with the fixture checks before it, Session last. After a red it WAITS OUT Datadog's automatic retry — a second full run still editing the fixtures — and stops. The whole preflight must be clean first. ≈158 runs; summary to `local_runs/passes/` |
| `schedule_probe.py create\|report\|pause` (`mobile.py probe`) | the throwaway live test that measured how Datadog's scheduling windows behave (trap 40). Bills about one run per window while live |
| `verify.py <test>` | confirm ONE test on Datadog (the loop, step 5) through the `MOB.999_Verify_Scratch` harness — 2 runs (3 when red: Datadog retries once). Pushes only that test and the scratch harness |
| `dd_tools.py push <test …>` | push ONLY the tests being edited (owner rule) — refuses without names; `--all` is a deliberate full sync. Exits non-zero on failure — chain with `&&` |
| `dd_tools.py pull <name>` | fetch a test back after a Datadog-UI edit |
| `dd_tools.py run <suite>` · `report <suite> [n]` | trigger + poll — refuses a named test whose steps differ from Datadog (`--push` pushes the named tests first) · per-step results with run age |
| `suite_plan.py` | ⭐ **the only place suite membership is kept** — the 24 module suites (MOB.953–975, MOB.980, MOB.981), each child's run order, the standalone leaves (`STANDALONE`) and held-out leaves (`HELD`). `assert_complete()` fails if a leaf is in no suite or in two. `dd_tools.test()` tags every test `module:<slug>` from it |
| `build_module_suites.py` | writes the module suites from `suite_plan.py` (login once, then the children in order) |
| `wire_suite.py` | fill in `subtestPublicId` once children exist. Re-run after any suite rebuild |
| `check_drift.py` | where a generator and its JSON disagree, changing nothing; names what a rebuild would LOSE. Run before any `DD_FORCE=1` |
| `sweep_strings.py` | the rendered-string sweep: every JSX text child in `client/mobile` that no test's params contain — the source of new OPEN WORK rows. Catches TypeScript fragments too; every hit needs a read |
| `check_literals.py` | every asserted literal still exists in the served app (`--self-test` after a rule change). Blind to a paraphrase whose words all exist — copy constants verbatim |
| `node check_js_assertions.js` | the bench: runs every `assertFromJavascript` in jsdom against a DOM modelled on the component source, each with a must-fail case (trap 27) |
| `audit_assertions.py` | assertions that pass without proving their name — TAUTOLOGY · GENERIC-COUNT · NAME-MISMATCH · VACUOUS-ABSENCE · LOADBEARING-OPT · CRITICAL-DIAG. A heuristic: every hit needs a human read. Exit 1 on any HIGH |
| `reset_av_fixture.py` | the AV fixture over GraphQL, 0 runs — `--check` asserts, dry run plans, `--apply` acts |
| `cleanup_residue.py` | prune residue by marker, delete by id — dry run by default (`cleanup_spec.md`) |
| `set_device.py` | pins every test to `chrome.tablet`, `_Phone_` tests to `chrome.mobile_small`; run after any build |
| `add_role_guard.py` · `add_crash_guard.py` | patch the shared login prefix (login → boot crash guard → shell → role is exactly `Admin`) into every login-bearing JSON. Builders copy the prefix from `MOB.000_Login_(Dev).json`, so a prefix change goes through these, never one builder |
| `legacy/fetch.py` `fetch(type="full", dir=…)` | back up every browser test. Names files by test name, so duplicate names overwrite — re-save those by `public_id`. Last full backup: `legacy/dd_tests_backup/2026-08-12_1543_pre-delete/` |

**`dd_tools` helpers** — shared so there is one copy; do not hand-roll local versions.

| helper | use |
|---|---|
| `step(…, optional=, soft=, always=)` | `optional` = `allowFailure`, non-critical · `soft` = `allowFailure` + critical (fails the test, the run continues) · `always` = `alwaysExecute` (runs after an earlier failure; for restore legs and state a later run needs) |
| `jsassert(name, body)` | a `Run JavaScript` assertion; the body is a function body that `return`s a boolean |
| `server_assert(name, key, query, variables, predicate, soft=, always=)` | ⭐ **the server read** — one self-refreshing step POSTs a same-origin `/graphql` query and judges `data` with a JS predicate, then clears its `sessionStorage` keys. A predicate compares what the SERVER stores: the enum `NotCompleted`, not the badge's `Not Completed` |
| `av_job_gate(job_id)` | **the** way into an AV job — clicks the row, gates on the asset ROWS, polls |
| `work_cache_warm(wait=30)` | visits `/work`, asserts only that the page mounted, then waits blind — warms the work lookup cache before deep-linking a work order (`MOB.134`, `347`, `348`, `351`–`359`, `363`–`365`, `911`); proves no readiness. Anything that acts on the `/work` list, or needs its downloads finished, uses `work_list_gate` instead: the per-stage downloads outrun a blind wait (86s measured, see below). No hand-rolled blind 20s `/work` warm-up is left — the last seven (`MOB.302`, `389`, `393`, `394`, `397`, `398`, `399`) switched to `work_list_gate(require_row=False)` 2026-09-17 |
| `work_list_gate(wait=20, require_row=True)` | readiness for `/work` — use it before ANY interaction on the list page, not just where `loadedAll` gates a control. The per-stage detail downloads ran 86s locally on 2026-09-16 (304 `/graphql` requests; residue work orders grow it every pass, bugs §41), and a Datadog click taken during them timed out (`MOB.301`). `LOADEDALL 3/3` therefore waits up to 180s. `require_row=True` when the test needs a work order on the list; `require_row=False` when it only needs `/work` settled — e.g. to warm the lookups before opening the fixture |
| `work_view_ensure(to)` | switch Scheduled ↔ List only if the item is present (it exists only for a `SCHEDULED` role); persists across a suite — restore `always` |
| `open_filters_drawer()` | the Filters drawer with the re-click gate; gate on `Add Filter`, never the trigger |
| `pick_option(url, select_id, label, value)` | a Mantine Select option: open, GATE on the option being VISIBLE (re-opens the select if the click was lost), then pick by exact text. Re-clicks only if the option is STILL hidden 2.5s after the first poll, so a dropdown animating open is never clicked shut. Never click an option after a fixed wait — `MOB.800` failed exactly that way on Datadog under load (2026-09-16) |
| `menu_item_visible_js(trigger_xpath, item_text)` | the same gate for a Mantine **Menu** item: re-clicks the trigger if the item is still hidden 2.5s on. Use it in place of a presence check after opening a menu (`MOB.352`) |
| `toasts_gone(always)` | gate: no react-toastify toast is on screen. Put it before any click that follows a save — see trap 6b |
| `material_list_ready()` | gate for Material Lookup: an `N matches` line shows and no `LoadingOverlay` covers the page — a click before that lands on the overlay. Shared by `MOB.850`/`860`/`865`/`866` in place of a fixed wait |
| `upload_steps(url, picker=…)` | `[reveal, uploadFiles]`, reading the one working `uploadFiles` step out of `MOB.600`'s JSON (trap 12) |
| `reveal_file_button(scope=…)` | a Mantine `FileButton`'s hidden input; fails closed on an ambiguous match — always pass `scope` |
| `stash_record_count` / `prove_record_count` | count the innermost cards in the active panel containing every needle, reload, require exactly +1 — sound for `optimisticResponse` adds (bugs §40), not for writes made straight into the cache (trap 6) |
| `pick_visible_option_js` *(local copies in `build_tab_tests.py`, `build_condition_edit_save_test.py`, `build_failure_edit_save_test.py`, `build_work_reassign_test.py`)* | click the ONE visible ListFilter option (`offsetParent !== null`) — closed dropdowns stay mounted (trap 3) |

---

## Locator & assertion traps

*1–17 are locator/assertion traps; 18–27 process traps (how tooling, fixtures or framing misled);
28–40 more locator, fixture, offline and scheduling traps.*

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
read back a row the client just prepended (bugs §34).

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

**7 · Toasts are transient, and some fire before the mutation.** `VerificationCheckbox` and
`AdHocForm` toast before `client.mutate` (bugs §11). Demote a toast to `optional` only after
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

**39 · A gate can only wait for something that is coming.** The work order's Assets tab crashes when a
row is expanded before the Asset schema is cached (bugs §45), and nothing on `/work` guarantees to fetch
it. Gating on the rows' geolocate controls (which render only with that schema) would wait for a request
nobody makes. Prime it through the user's own path — open `Add Existing Asset`, whose picker queries the
schema, close it unused — THEN gate (`MOB.397`).

**40 · Datadog's scheduler, as measured.** Browser `tick_every` is 60–604800s — weekly at most.
`options.scheduling` is `{timezone, timeframes: [{day, from, to}]}`, **`day` is ISO (Monday = 1)**
(`schedule_probe.py`, 2026-09-17), and all of a test's windows must share ONE start time (`All start
times should be equal`). `retry.interval` is MILLISECONDS (our `300` is 0.3s). Live/paused is NOT in the
test body — it has its own endpoint, which `push` now calls. Scheduling is per test and nothing orders
them, so suites that share fixtures are kept apart by slot (`suite_plan.SLOTS`, `preflight.py
schedule`). Only suites are scheduled: a live leaf that is also a suite child bills twice.
