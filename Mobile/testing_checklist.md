# Mobile App — Test Plan

> **State, not stories.** A row records what is covered and what blocks it — no run logs, dates
> or debugging history. When something ships, flip its box and cite the test.
>
> **▶ OPEN WORK holds only work not yet done.** When an item's build is finished, delete its row in
> the same change: its coverage goes to its route row, anything still owed to Datadog to 📊 RUN
> STATUS, and a leftover gap to a new row. Row numbers are never reused; a deleted
> row's citations are reworded. `preflight.py docs` fails on a finished row, a dangling `#N` and a stale count.
>
> | information | its one home |
> |---|---|
> | what is left to do, and the state of each item | **this file** |
> | what a green run actually proves | `coverage.md` |
> | how to build a test and prove it — locally, then on Datadog — without repeating a known mistake | `test_authoring.md` (the loop, the 33 traps) |
> | product defects the tests found | `bugs_found.md` |
> | test residue, cleanup, the AV fixture reset | `cleanup_spec.md` |
> | why a specific test is built the way it is | its `build_*.py` docstring |

> **Legend** — `[x]` automated · `[~]` partial · `[ ]` not yet · `[-]` not automatable in
> Synthetics. Row tags: `· residue` leaves data behind · `· self-restoring` puts itself back ·
> `· self-cleaning` deletes what it added. **(trap N)** → `test_authoring.md`.

## Codebase sync

*When this file and the codebase disagree, the codebase wins — update the row.*

| | |
|---|---|
| **Serves the tests** | `origin/development` → dev.mentorapm.com. Read source with `git show origin/development:client/mobile/…`, never the working tree; `git fetch origin development` first |
| **Last synced** | `9d80ad499c` (2026-09-17). Since `4da480a68f`, 15 `client/mobile` commits: **bugs §10 fixed** — job status is recomputed from the verified count (`154e7627c8`, PR #4175; see #72); the startup splash animation removed; a new `role="alert"` startup-error banner in `Layout/Auth.tsx`; Asset Lookup's page `Loading` overlay removed (no test waits on it); tablets sign a form's signature field inside the desktop grid, saved when the pad closes (#73); StructuredQuery's operator effect now also runs on operator change (resets only an operator invalid for the field); lazy-loaded routes added then rolled back; lint/Jest. No asserted literal moved. ⚠️ Deployment to dev.mentorapm.com not confirmed — the page redirects to login, so its bundle name was not readable |
| **Literal scan** | `check_literals.py` clean against `9d80ad499c` — 2420 literals, 0 MISSING. `sweep_strings.py`: 195 JSX text strings, 133 asserted, 62 in no test |

```bash
cd ~/GitHub/MentorAPM/MentorTwo && git fetch origin development
git log --oneline <LAST-SHA>..origin/development -- client/mobile   # then record the new SHA
```

Nothing goes red when a feature ships untested — the `client/mobile` diff is the only check that
sees it.

**Session model:** no silent refresh. An expired session or a `LOGOUT` from anywhere redirects
to login, so logging the test account out kills an in-flight suite.

**Watch every diff for new `sessionStorage` writes** — a suite shares one browser session. Known
keys: the two map toggles, `toggle_mobile_v_work`, `mobile-asset-ver-filter`,
`asset_lookup_query`, `asset_lookup_proximity_radius`, `mobile-<Model>-sort`, `storeroomId`,
`log_level`, and the column picker's `selectedColumns` (`localStorage` — outlives the session).

## Coverage at a glance

| | |
|---|---|
| Status | **First Datadog pass complete** — 23 of the 24 module suites ✅ on the current build (2026-09-16); `MOB.967` held out while bugs §34 is open. The old suites are retired, on Datadog and locally |
| Tests | **139 leaf tests · 24 suites** · 4723 steps · 134 subtest slots (+ `MOB.999_Verify_Scratch`, a harness; `MOB.978_DIAG_WorkList_Probe`, a diagnostic; `MOB.PDF_Upload_Recording`, which exists only on Datadog — never delete it) |
| Local ↔ remote | every local test matches Datadog by content — `preflight.py sync` compares step names and subtest ids (it prints the first 5). `MOB.711` is archived locally only |
| Device | `chrome.tablet`, except the phone tests `MOB.951`/`MOB.952` and their suite `MOB.975_Phone_Suite`, on `chrome.mobile_small` (trap 1) |
| Rows | 172 `[x]` · 10 `[~]` · 4 `[ ]` · 35 `[-]` — 221 rows. Counts describe *this file*, not the app |
| Cost of one full pass | **158 billed runs** — the 24 module suites plus their 134 children; a subtest bills as its own run |
| Scheduling | Manual today. On-demand runs may use 10 at once (concurrency cap raised 1 → 10; it does not change billed runs). **Owner's plan: weekly Datadog runs** (▶ OPEN WORK #37) |

### Suites — children, and what they leave behind

*The module suites — membership lives only in `dd_scripts_mobile/suite_plan.py`; `build_module_suites.py` writes them. Each is kept well under Datadog's execution ceiling (Appendix F); read-only and writing suites are separate so a schedule can run read-only ones side by side and chain the writing ones.* `local` is a measured local replay; `est. Datadog` is 1.2–2× that (Appendix F); `Datadog` is the first-pass runtime on the current build (2026-09-16), against the ~1071s ceiling — `MOB.959` and `MOB.953` sit closest to it.

| module | suite | children (run order) | class | local | est. Datadog | Datadog |
|---|---|---|---|---|---|---|
| Work Orders | `MOB.953_WorkOrders_1_List_Suite` | 150 300 301 340 341 343 344 342 345 | writes | 443s | 532–886s | 634s |
| Work Orders | `MOB.954_WorkOrders_2_Detail_Open_Tabs_Suite` | 310 330 393 394 399 348 349 | read-only | 190s | 228–380s | 294s |
| Work Orders | `MOB.981_WorkOrders_3_Detail_Charges_Offline_Suite` | 357 356 351 398 911 912 | read-only | 313s | 376–626s | 453s |
| Work Orders | `MOB.955_WorkOrders_4_Detail_Assets_Records_Read_Suite` | 347 389 387 741 731 358 | read-only | 239s | 287–478s | 351s |
| Work Orders | `MOB.956_WorkOrders_5_Records_Suite` | 350 360 370 380 390 391 392 361 | writes | 462s | 554–924s | 623s |
| Work Orders | `MOB.957_WorkOrders_6_Status_Field_Edits_Suite` | 320 395 388 386 385 | writes | 377s | 452–754s | 581s |
| Work Orders | `MOB.958_WorkOrders_7_Assets_Location_Edits_Suite` | 352 353 354 359 | writes | 215s | 258–430s | 356s |
| Work Orders | `MOB.959_WorkOrders_8_Stage_Writes_Create_Suite` | 396 397 302 363 365 364 | writes | 434s | 521–868s | 682s |
| Work Orders | `MOB.960_WorkOrders_9_Forms_Suite` | 355 134 | writes | 119s | 143–238s | 191s |
| Asset Verify | `MOB.961_AssetVerify_1_Jobs_List_Suite` | 140 530 560 580 810 535 | read-only | 235s | 282–470s | 322s |
| Asset Verify | `MOB.962_AssetVerify_2_Job_Assets_Read_Suite` | 500 520 585 531 547 551 | read-only | 305s | 366–610s | 429s |
| Asset Verify | `MOB.963_AssetVerify_3_Verify_Status_Queue_Suite` | 510 590 913 536 | writes | 430s | 516–860s | 500s |
| Asset Verify | `MOB.964_AssetVerify_4_Asset_Detail_Read_Suite` | 570 575 546 | read-only | 166s | 199–332s | 263s |
| Asset Verify | `MOB.965_AssetVerify_5_Asset_Detail_Edits_Suite` | 537 545 550 | writes | 340s | 408–680s | 438s |
| Asset Collector | `MOB.966_AssetCollector_1_Capture_Suite` | 160 620 621 622 626 610 624 625 | read-only | 240s | 288–480s | 356s |
| Asset Collector | `MOB.967_AssetCollector_2_Saved_Asset_Suite` | 600 623 627 628 | writes | 379s ❌ | 455–758s | held out — bugs §34 |
| Asset Lookup | `MOB.968_AssetLookup_1_Rows_Tabs_Suite` | 100 700 750 720 721 914 740 735 730 | read-only | 216s | 259–432s | 324s |
| Asset Lookup | `MOB.969_AssetLookup_2_Filters_Sort_Suite` | 800 805 806 807 820 | read-only | 185s | 222–370s | 307s |
| Asset Lookup | `MOB.980_AssetLookup_3_Edits_Suite` | 710 712 722 | writes | 109s | 131–218s | 179s |
| Material Lookup | `MOB.970_MaterialLookup_Suite` | 110 850 860 870 855 865 866 | writes | 283s | 340–566s | 368s |
| Map | `MOB.971_Map_Suite` | 120 121 123 122 | writes | 107s | 128–214s | 156s |
| App shell | `MOB.972_AppShell_Suite` | 180 900 910 170 171 130 131 132 400 410 420 430 450 460 470 | writes | 236s | 283–472s | 378s |
| Session | `MOB.973_Session_RunAlone_Suite` | 210 220 | writes · **run alone** | 157s | 188–314s | 215s |
| Phone | `MOB.975_Phone_Suite` | 951 952 | read-only · `chrome.mobile_small` | 88s | 106–176s | 129s |

`MOB.969`'s name says `Sort` though nothing in it sorts (`MOB.810` sorts the MOBILE JOB list, so it is in `MOB.961`); the name stays because `push` matches on NAME.

**In no scheduled suite:** `MOB.000_Login` (the login itself — every suite already runs it first) · `MOB.200_Crew_Switch` (switches the session's crew; crew-scoped data changes under any suite) · `MOB.346_Work_Scheduled_View` (blocked: the scheduled view is unreachable for this crew, bugs §25) · `MOB.440_Logout` (logs out, which kills any suite running at the time) · `MOB.978` diagnostic (kept while the work-list fixture is in flux).

### Proving a test — locally, then on Datadog

The loop and its costs live in `test_authoring.md` → **The loop**: build → static checks →
`local_run.py` (0 runs) → `verify.py` (2 runs; 3 when red) → wire. What bears on planning:

- **Datadog runs wait for the owner's go-ahead** — credits are limited. A verify costs 2, a suite
  `1 + children`. A local pass is a pre-check, not a RUN STATUS entry.
- A solo pass is strong evidence (a fresh session inherits no sort, filter or crew). The risk runs
  the other way — passing *inside* a suite because an earlier child left state — so run suites
  occasionally as an integration check, not as the way to prove a test.

## 📊 RUN STATUS — what is actually proven

*"Passed when last run" on Datadog — runs are manual. Re-run a suite when its area changes (trap 25).*

| run as | suites · Datadog time | result |
|---|---|---|
| read-only, 10 at once | `954` 294s · `981` 453s · `955` 351s · `961` 322s · `962` 429s · `964` 263s · `966` 356s · `968` 324s · `969` 307s · `975` 129s | ✅ 10/10 · current build · 2026-09-16 |
| writes, one at a time | `953` 634s · `971` 156s · `970` 368s · `980` 179s · `958` 356s · `960` 191s · `959` 682s · `965` 438s · `972` 378s · `963` 500s · `956` 623s · `957` 581s | ✅ 12/12 · current build · 2026-09-16 |
| alone | `973` 215s | ✅ · current build · 2026-09-16 |
| held out | `967` | 🛑 not run — its `MOB.600` is red on Datadog while bugs §34 is open (confirmed 2026-09-15). A LOCAL replay of `MOB.600` is a false negative: it cannot drive the photo picker |

- ⚠️ `956` and `957` pass their bugs §42 sentinels NOT because §42 is fixed (its forms are unchanged on `9d80ad499c`): their children wait for `/work`'s prefetch, which loads `WorkStageCondition`/`WorkStageFailure` (`prefetchData.ts:26-36`) before the form opens. §42 still hits a user who opens a work order before that prefetch; no test reproduces it (▶ #71).
- `MOB.346_Work_Scheduled_View` cannot pass — see 🟡 BLOCKED.

The shared login prefix carries a boot crash guard (`add_crash_guard.py`) in every suite,
`MOB.000`/`200`/`440`, the diagnostic and the scratch.

## ▶ OPEN WORK — the only "what's next" section

**Next up — the candidates on the table, in a suggested order (the owner decides):**
1. **#72** — confirm whether the bugs §10 fix is live on dev; the AV fixture's rest state changes with it.
2. **#71** a bugs §42 repro test — nothing detects §42 now.
3. **#69**, then the **#47** / **#50** builds and **#49**'s fixture-field confirmation.
4. **#73** the new untested UI from the sync.
5. **#37** the weekly schedule.
6. Re-verify `MOB.967` once bugs §34 is fixed (🟡 BLOCKED).

### 🟢 BUILDABLE — ranked by yield

| # | item | state |
|---|---|---|
| **71** | **A bugs §42 repro test** — `Conditions/Form.tsx`, `Failures/Form.tsx` and `hooks/index.ts` are unchanged on `9d80ad499c`, but `MOB.956`/`957`'s children now wait for `/work`'s prefetch, so no test reproduces §42. Deep-link the fixture work order without warming `/work` and open the condition/failure form | deferred by the owner ("look at later") · buildable |
| **37** | **Weekly schedule on Datadog** (owner). **158 runs per full pass** (24 module suites + 134 children; ~153 without `MOB.967`) ≈ 632/month weekly. Schedule the **24 module suites only** (a child also scheduled bills twice); **stagger** them — the writing suites share fixtures (trap 1), `MOB.973_Session_RunAlone` must run alone and `MOB.975_Phone` runs on its own device; give each a failure notification. Consider holding `MOB.967` out until bugs §34 is fixed: 5 runs a pass to re-confirm a filed bug. Runtimes are measured on Datadog — the longest are `MOB.959` 682s and `MOB.953` 634s, both clear of the ~1071s ceiling. Needs `dd_tools.push` to send `status` + a weekly `tick_every` for suites (`BODY_KEYS` omits `status`). Residue grows ~4 work orders per pass until bugs §41 — and it is not free: every `/work` visit downloads each listed stage's detail (86s locally, measured 2026-09-16), so `MOB.953` creeps toward the ceiling each pass. On-demand runs may use 10 at once (the read-only suites passed that way); whether a SCHEDULE shares that cap is unchecked | late game |
| **69** | **The fixed 20s `/work` warm-up in 7 more tests** — `MOB.302`, `389`, `393`, `394`, `397`, `398`, `399` still leave `/work` after a blind 20s, before its prefetch may have filled the cache-only lookups; on a cold Datadog session that left `MOB.350`'s `AC Adapter` option absent. All 7 pass in their suites (`954`, `955`, `959`, `981`) on the current build. Switch each to `work_list_gate(require_row=False)`, as `MOB.350`–`395` use, and re-run its suite | buildable · test hardening |
| **72** | **AV fixture rest state after the bugs §10 fix** — `154e7627c8` recomputes a mobile job's status on every verify toggle: 0 verified → `READY`, all → `COMPLETED`, otherwise `IN_PROGRESS`. The fixture `Z0EVwQcdJZhMURcBFkp0E0` rests at `IN_PROGRESS` with 0 verified, so once the fix is served, `MOB.510`, `MOB.131` and `MOB.963`'s verify→unverify leave it `READY` and `preflight.py av` fails. When it is served: move the rest state to `READY` (`reset_av_fixture.py` `WANT_STATUS` and its forward-only docstring, `cleanup_spec.md` §4), re-check the status expectations in `MOB.510`/`536`/`560`, then delete bugs §10 | blocked · on deploy |
| **73** | **New UI since the sync, untested** — the tablet signature control inside the desktop form grid (`Forms/FormDetails.tsx` `renderSignature`; saved on close, `SignatureField.tsx`), and the startup-error banner (`Layout/Auth.tsx`, `role="alert"`, six messages passed through `setStartupError`, so `sweep_strings.py` cannot see them) | investigate |
| **47** | **A MentorLens tag's description** (`LensTags.tsx:58-72`, modal `:89-103`) — the `?` (`aria-label="Show MentorLens tag description"`) beside a tag opens a small MODAL with its `desc` and a close button. All 9 lens tags on dev carry a `desc` (read over `/graphql` 2026-09-16) — e.g. `Lens: Thermography` → "Used in MentorLens for thermographic analysis" — so no fixture is needed; read-only, fits `MOB.622`'s tag editor | buildable · read-only |
| **49** | **The value modal** (`DetailPage/utils/MultiLineLabel.tsx`) — an arrow icon beside a `multiline` / `richtext` field opens a modal showing the field's full VALUE (not its label), and renders only when the value is non-empty. Used by General Info (`GeneralInfo.tsx:99`), the work form (`ui/Form.tsx:90`), stage forms (`FormDetails.tsx:189`) and the create form's `address`/`desc` (`InsertForm/index.tsx:248,267`). ⚠️ Its `onClick` is on the ICON, not the `ActionIcon`, and the button's `aria-label` is `Settings` — click the icon. Candidate: the fixture's General Info `desc` (`DATADOG FIXTURE`), once its template type is confirmed multiline | investigate · read-only |
| **50** | **Work History rows' `Assigned to`** (`WorkHistory.tsx:18`) — one label on a screen `MOB.740` already opens | buildable · read-only |

**Finding the next ones:** `sweep_strings.py` (🔧 check 6) — JSX text children no test's params contain,
not attributes. Last sweep: `origin/development@e1db362a53` — 194 strings, 127 asserted; each of the 67 others (some
still TypeScript the regex caught) is a row above or classified (⚪ / 🔴 / 🟡 / `[-]`).

### 🟡 BLOCKED — decisions, fixtures and backend

| item | needs | kind |
|---|---|---|
| **`MOB.346_Work_Scheduled_View`** | settled: `mobileDownloadMode` stays `ASSIGNED` so the crew keeps its work orders; a `SCHEDULED` role sees only stages with a `scheduledevent` within ±7 days (bugs §25 rule 4). The scheduled view, `WO_SCHEDULED_SORT` and `ScheduleTimeline` are unreachable. Standalone; restore only when the role changes **and** its work is scheduled | settled |
| Verify-all → `COMPLETED` · verify status update (job list) · add a NEW / EXISTING asset to the job · Add Work | `reset_av_fixture.py` can put the fixture back for 0 runs (`cleanup_spec.md` §4). The owner accepts the **run → reset** chore and Add Work's residue, then the five tests get built | decision |
| Re-verify `MOB.967_AssetCollector_2_Saved_Asset_Suite` (5 runs) | bugs §34 fixed — until then its `MOB.600` is red on Datadog; a local replay cannot show it | backend |
| Pruning work-order residue | bugs §41 — `deleteWorkOrders` rolls back on every test-created work order. `cleanup_residue.py --apply` resumes once fixed | backend |
| `MOB.357`'s non-zero path | a form template with a **required field**; every card reads `0 of 0` | fixture |
| `MOB.342` exclusion leg | a second status in the crew's list — read the legend before asking | fixture |
| `MOB.351`'s estimate rows | an estimate on the fixture work order | fixture |
| Session/JWT expiry | cookie-authenticated; a client cannot expire it | backend |
| **AT** — attachment types beyond PNG | ⏸️ deferred by the owner, do not re-raise | fixture |
| Trial-mode tile disabling | a trial org | fixture |
| Asset Type on the AV detail — characterization test | owner decision: it now renders as plain text; pin that or not | decision |
| `Component:` on a failure card (`MOB.387`) | a fixture failure WITH a component — the fixture's has none | fixture |
| Dev Logs' `Error:` column · its `No logs found.` | a log entry carrying an error · a session with no log entries | fixture |
| An AV job asset's `An asset standard needs to exist…`, `A failure profile need to exist…` and `No asset attributes found.` | an asset on a fixture job with no asset standard, failure profile or attributes — both of `DATADOG MOBILE JOB`'s assets have all three | fixture |
| `Your organization has not configured their map settings.` (`Map/index.tsx:405`) | an org without map settings | fixture |
| **#43 — a local-only Playwright tier** for what Datadog cannot do: genuinely offline (`context.set_offline`), network interception for error states, file choosers, clock control (`SessionReauthentication`). Outside the weekly Datadog schedule | ⏸️ deferred by the owner — may revisit | decision |

### ⚪ NOT A GAP

`CopyAttributesConfirmation` (dead: `typeId` is `allowUpdate: false`) · material transfers /
issue-return / reorder (controls do not exist) · Switch-Crews close button
(`withCloseButton: false`) · status-change form triggers (desktop → Appendix B) · the status-notes
modal (deliberate; enabling it reworks `MOB.320`) · `typeId` on the AV detail (no longer editable)
· logout clearing queues (the obvious test asserts something false) · status badge colour
(`MOB.342` reads it via `getComputedStyle`) · Failures/Condition placeholders (`Tank 0000` has
both) · real device GPS ·
`UploadStatusIcon` (Expo only) · forcing `ErrorBoundary` to trip (poisons the shared session) ·
`/asset-collector/:assetId` (orphan route) · `MaterialLookup/SearchResults.tsx` (imported nowhere)
· `AddAssetToWorkInsertForm` (imported only by its Jest test) · `UploadLogs` (under
`UploadStatusIcon`, Expo only) · Transaction Log column sort (`onSort` is `console.log`) · the Home summary widgets (`AssetVerificationSummary`,
`WorkOrderSummary` — exported, never imported) · loading placeholders (`Loading history...`, `Loading form…`,
`...loading` — transient).

### 🔴 HARNESS — needs a different tool

Upload **transport** (tus resume, unauthorized retry, `UploadStatusIcon`) · camera / barcode ·
map canvas drawing and what only a marker tap opens (the work map card's `Address:`) · native shell · the browser genuinely offline (the offline shell page).
**Within reach of a local Playwright tier** (#43, ⏸️ deferred): genuinely offline, network-error states, the
capture file choosers, the session re-auth clock. Expo/native shell, map canvas and tus stay out. The
queue's link classes in isolation are a **Jest** job, being done outside this suite; the queue end
to end is `MOB.913`.

### 🔧 MAINTENANCE — twelve standing checks, none costs a run

**Run them all: `python3 dd_scripts_mobile/preflight.py`** (exit 1 = fix before spending runs).
It skips `drift` while a run is in flight.

| # | check | how |
|---|---|---|
| 1 | generator vs JSON (trap 19) | `check_drift.py` — clean except the known `MOB.200` role guard (25 → 28 steps) |
| 2 | local vs remote **by content** (step names + subtest ids, not names) | `preflight.py sync` — prints the first 5 differences |
| 3 | latest result per suite, and which build it ran | 📊 RUN STATUS (trap 25) |
| 4 | every test cited exists, and every test that exists is cited | `MOB.711` is cited on purpose (archived) |
| 5 | **stale-literal scan** — every asserted literal still exists in the app | `check_literals.py` (`--self-test` after a rule change). `@data-icon` excluded (trap 14). ⚠️ Blind to a paraphrase whose every word exists — copy constants verbatim from `constants.ts` |
| 6 | **rendered-string sweep** — UI text in no test | `sweep_strings.py` — JSX text children, not attributes; every hit needs a read (see 🟢) |
| 7 | **`assertFromJavascript` bodies on the bench** | `node check_js_assertions.js` — each against a DOM modelled on the component source, with a must-fail case (trap 27); includes the Filters-drawer drift guard. Re-read the component after a dependency bump |
| 8 | **`bugs_found.md` vs the served code** | re-read each open row's named source line; a fixed row is **deleted** and its citations reworded |
| 9 | **the AV fixture** | `reset_av_fixture.py --check` — the job `IN_PROGRESS` with two unverified links, and the assets' exact stored names (trap 29). Before blaming a red AV test on the app |
| 10 | **the work-order fixture** | `EYRpYJ9QYdQ1JFF10JtB0Q` must be `Ready` — outside In Progress/On Hold/Ready it leaves the crew's list (bugs §25). `MOB.320` restores it `always`; `preflight.py work` reads it. It must also carry **no `project`**, or every General Info save on it is rejected (bugs §46) |
| 11 | **the docs' own consistency** | `preflight.py docs` — no finished row in ▶ OPEN WORK, no `#N` citing a row that does not exist, the Rows line and the test counts match their sources |
| 12 | **suite children's local variables** | `preflight.py locals` — no two children of one suite declare a variable of the same NAME differently (on Datadog they share it, first definition wins) |

Checks 1–4 and 12 watch the tests; 5, 6 and 8 the app; 9 and 10 the fixtures; 11 the docs themselves.

**Other hygiene:**
- **Tags** are inconsistent — 38 of 139 leaves carry no class tag, and the residue tags vary
  (`residue`, `self-cleaning`, `self-restoring`). Classify by `test_authoring.md`'s rule and change
  generator **and** JSON together (trap 19). Until then the suite table above is the truth.
- 🧹 **Residue** — `cleanup_residue.py` (dry run by default): 190 marked work orders (blocked by
  bugs §41), 3 notes (a prune keeps 1), charges excluded by the owner (`cleanup_spec.md` §2).
- **`audit_assertions.py`** — 194 suspects (2 HIGH · 44 MED · 148 LOW). HIGH: `MOB.913`'s two RESTORE
  steps click every checked box and return `true` — actions, not claims; nothing in `MOB.913` reads
  the restore back (`preflight.py av` does). MED and LOW were last all read at 59 suspects and have
  grown since — re-read before quoting them. It cannot see an assertion the APP turned vacuous —
  check 5 does.

# Tier 1 — Mobile-specific risks, across routes

## T1.1 Offline & the transaction queue

- [x] Mutate while offline → the operation is HELD, not failed *(MOB.913)* — a browser `offline` event closes the queue; pending reads 1, and still 1 after 6s
- [x] Reconnect → the queue drains *(MOB.913)* — `online` → the indicator clears and, after a reload, the server has the verify
- [x] Queue survives an app reload *(MOB.913)* — reloaded while held; `PersistedQueueLink` re-sent it from IndexedDB on startup
- [x] Pending-transaction count and list *(MOB.913)* — 0 → 1 → 0; `Pending Transactions` lists `VERIFY_ASSET` with its variables. Observed: while unsent, the job's `N out of 2` counter does NOT move (it reads the server's count) though the checkbox shows verified
- [x] `OFFLINE_FEATURE_MESSAGE` on connection-dependent controls *(MOB.910 flips the header icon, Home tile and menu item; MOB.911/912 and MOB.358 cover three messages; the per-control messages, `EventReadings`' `Add reading types` popover included — `MOB.626`, `MOB.914`, `MOB.430`)*
- [x] Offline notice does **not** appear while online *(MOB.900)* — paired with a positive control
- [x] `ConnectionRequired` *(MOB.912)* — Asset Lookup's whole-screen block reads `window.navigator.onLine`; a step-defined getter reaches it. Paired: search input online → ConnectionRequired offline
- [-] `useWorkAssignmentSubscription` — live work assignment push (`Layout/Auth.tsx`); needs a server-side event
- [-] Logout clears pending queues — not observable; the obvious test asserts something false

## T1.2 Uploads & attachments

- [~] Attach a file *(MOB.600)* — 🛑 the collect never reaches the server when a photo is attached (bugs §34); red until fixed
- [x] A photo reaches the carousel without submitting *(MOB.621)* — local reducer, discarded unsent
- [x] Work-stage attachments panel and its image filter *(MOB.741)* — an image through `Add File` is rejected with a toast, zero residue
- [x] Add a photo to an EXISTING asset through the panel's `Add Photo` *(MOB.623)* · residue — polls for the `blob:` preview to become a server URL
- [x] `PhotoMenu` on a saved photo *(MOB.623)* — the five items exactly and in order; `Rotate Image` ×4 with the src read back (self-restoring at 360°)
- [~] `Set as Avatar` · `Get Description` · `Delete Photo` — asserted present *(MOB.623)*; `Set as Avatar` and `Delete Photo` clicked on the run's own upload *(MOB.627)*; `Get Description` clicked only offline, for its connection message *(MOB.914)* — never online (AI route)
- [-] Upload status icon reflects in-flight uploads — Expo shell only
- [-] Upload resumes after interruption (tus)
- [-] Unauthorized upload retries after token refresh
- [-] Capture from camera (photo/video/HEIC) — native file dialog; asserted, never clicked *(MOB.620)*
- [~] **AT** — all attachment types (Reusable blocks)

## T1.3 Session, auth & crew

- [x] Login via `/login/sso` environment picker *(MOB.000)*
- [x] Switch crew and revert, Admin → Operator → Admin *(MOB.200)*
- [x] Crew switcher opens and dismisses without mutating *(MOB.430)*
- [x] Log out, including the "Take Me Back" escape hatch *(MOB.440)*
- [-] Session/JWT expiry — needs a backend-issued short-lived token
- [x] Role permissions gate menu items *(MOB.210)* — `Admin (0000)` hides `Work Orders` and every tile; restores to `Admin`
- [x] Crew switch changes the visible work/mobile-job set *(MOB.220)*

## T1.4 Responsive / viewport

- [x] Tablet width (`chrome.tablet`) — all tests but the phone suite
- [x] Phone form branch `#senor-work-form` renders below `availWidth` 750, the desktop panel does not *(MOB.951, in `MOB.975`)*; its image field shows `Upload Photo` exactly when the form has one
- [x] The list's search control, the affixed create button and the burger are on screen at phone width *(MOB.952)*
- [x] Crew switching at phone width — the burger's `Switch Crews` (the login prefix reads the role there, `MOB.975`); the header shortcut `.mobile-crew` is hidden under 450px **by design** *(MOB.952, `optional`)*. Common phones are 393–430px, so the shortcut shows only on tablets and in landscape — a product call

## T1.5 Service worker & app updates

- [x] Service worker registers and controls the page *(MOB.470)*
- [-] Update prompt — there is none (bugs §31: a deploy takes over silently)
- [-] Stale cache does not survive an update — needs two builds to observe

## T1.6 Geolocation

- [x] Geolocate populates address/lat/long — `ProximityMenu` *(MOB.731)* and the work-asset form *(MOB.358)*
- [x] Geolocate messaged when offline *(MOB.911, in `MOB.981`)* — `GeolocateButton`'s popover
- [x] The geolocate form's offline state *(MOB.358)* — `navigator.onLine` overridden: `Location details are unavailable offline.`; closed unsubmitted, getter removed
- [-] Real device GPS — a stub proves the app's handling of a result, never the device

## T1.7 Native shell bridge

- [-] Haptics · native upload · anything gated on `window.ReactNativeWebView` — Expo shell only

# Tier 2 — Every route, and what a user can do there

*The routes are `client/mobile/routing/index.tsx`; a row is an action on that route and names the test that covers
it (its suite: the suite table under Coverage at a glance). Rows were placed by where each test actually navigates. The former module sections
map here: T2.1 → the three `/work` routes · T2.2 → the three `/asset-verify` routes · T2.3 → `/asset-collector` ·
T2.4 → `/asset-lookup` · T2.5 → `/material-lookup` · T2.6 → `/map` · T2.7 → `/` · T3.1 → each route's first row ·
T3.2 and T3.3's back arrow → Every route · T3.3's search and filters → `/asset-lookup`.*

## `/` — Home

*`routing/Home.tsx` — the landing route after login*

- [x] Welcome banner names the user and org *(MOB.180)*
- [x] Six module tiles render; `Work Orders` navigates *(MOB.180)*
- [x] Tile permission gating and `No valid permissions` *(MOB.210)*
- [x] Asset Lookup tile hidden when offline *(MOB.910)*
- [-] Trial-mode tile disabling — needs a trial org
- [x] Login landing *(MOB.000)* · `/` Home *(MOB.180)*

## Every route — header, hamburger menu and back arrow

*`Layout/` — rendered around every route*

- [x] Open / close *(MOB.400)* · ReSync *(MOB.410)* · Transaction Log *(MOB.420)*
- [x] Switch Crews *(MOB.200, MOB.430)* · Cancel *(MOB.430)* · the modal's offline description *(MOB.430)*
- [x] Log Out · confirm · Take Me Back *(MOB.440)*
- [~] Module resync timestamp *(MOB.460)* — resync leaves no durable difference; proves the control and its timestamp
- [x] Toggle Work Order List / Scheduled View *(MOB.346)* — blocked with it; the item exists only for a `SCHEDULED` role
- [x] Asset Lookup item hidden when offline *(MOB.910)*
- [-] Switch Crews close button — does not exist
- [x] Version string *(MOB.470)* — `Version: ` + a real `shortVersion`
- [x] `NetworkStatusIcon` — online *(MOB.470)*, offline *(MOB.910)*
- [x] `TransactionStatus` pending count — `!count` online *(MOB.470)*; counted, and the `PendingTransactionLogs` list *(MOB.913)*; drained with the list open, Refresh reads `No logs found.`
- [-] `UploadStatusIcon` — Expo only
- [x] The crew shortcut `.mobile-crew` opens `RoleSelection` *(MOB.470)*
- [x] Back arrow lands on the specific previous route *(MOB.450)*

## `/work` — Work Orders list

*`WorkOrders/index.tsx`*

- [x] The route renders and titles itself *(MOB.150)*
- [x] From the Work Order module *(MOB.300)* — affixed `+` → workflow lookup → submit (a server answer: no `optimisticResponse`)
- [x] Photos on the insert form *(MOB.301)* — one upload lands as exactly one slide, a `blob:` URL (nothing uploaded before submit); closed with its X, never submitted
- [x] Search bar opens; Sort Criteria modal opens *(MOB.340)* · search filters the list *(MOB.343)*
- [x] Map view toggle *(MOB.341)*
- [x] Status ring + clickable legend *(MOB.342)*
- [x] Tapping a row opens its work order *(MOB.344)*
- [x] Sort applies, persists, and really reverses *(MOB.345)*
- [x] Scheduled view, `WO_SCHEDULED_SORT`, group headers *(MOB.346)* — 🛑 blocked, see 🟡
- [-] `Created` stages on the ring — the crew query never returns one (bugs §25 rule 2)

## `/work/:workStageId` — a work order

*`WorkOrders/WorkDetails.tsx`*

### Open, status and location

- [x] Open a work order and render its detail *(MOB.310)*
- [x] Every assignable status — Pending · In Progress · On Hold · Requested · Not Completed · Complete · Canceled · back to Ready *(MOB.320)* · self-restoring — the badge read exactly, and the server read over `/graphql` for `NotCompleted` and the restored `Ready`; Ready restored `always`
- [x] Status notes branch — not applicable to this fixture's template (`requireStatusNotes` off)
- [-] The status-notes modal — deliberately not covered (repo owner)
- [x] `MapLink` on the title *(MOB.348)* — `View in Map` and `Edit Location`
- [x] Record cycling *(MOB.349)*
- [x] Offline geolocate branch *(MOB.911)*
- [x] `Edit Location` saves *(MOB.352)* · self-restoring — a marker address and x/y through `UPDATE_WORK_STAGE`, proved over `/graphql`; the UI types the fixed rest values back `always`, with a `/graphql` backstop, and the final read requires them and `Ready`

### Charges (ELMO)

- [x] Equipment *(MOB.350)* · labor *(MOB.360)* · material *(MOB.370, type Return so stock is not decremented)* · other *(MOB.380, `unitPrice` required at runtime — trap 8)* · residue — each proved by exactly +1 of its own record after a reload
- [x] Invalid charge form does NOT submit — all four *(MOB.356)*
- [x] The `ESTIMATES` section on all four tabs *(MOB.351)* — pins `{section === 'CHARGES' && InsertForm}` both ways; the fixture has no estimate cards
- [x] `Internet Connection is required to make a material charge` *(MOB.912)* — paired: CHARGES online → the message offline

### Tabs, records and forms

- [x] Assign follow-up work *(MOB.397)*
- [x] Detail tabs render and switch *(MOB.330)*
- [x] General Info — edit a field *(MOB.395)* · self-restoring (`DATADOG FIXTURE`)
- [x] Attributes tab edit *(MOB.388)* — `Heater Hz`, marker → reload → `7` → reload (`UPDATE_WORKSTAGE_ATTRIBUTE`)
- [x] Assets tab and its status controls *(MOB.347)* — `Mark as …` asserted, never clicked
- [x] Attachments *(MOB.741)*
- [x] `Copy to asset` *(MOB.302)* · self-cleaning — links the stage photo to `Bypass Valve 0001` (the same attachment id), proves it on Asset Lookup, unlinks it (trap 2, guarded to unlink only), proves the asset back to 0 and the work order's image still loading
- [x] Add failure *(MOB.391)* · self-cleaning — key `BELT (R-L1) · ADJUST · TIME`; proved after a RELOAD and over `/graphql`, deleted from its own card (trap 2); then the server holds none of the key and the fixture's `MISSED` failure is untouched ⚠️ Does NOT detect bugs §42: in its suite the form opens after `/work`'s prefetch has cached the schema (#71).
- [x] Add condition score *(MOB.390)* · self-cleaning — key `Pump Body`; proved after a RELOAD and over `/graphql`, deleted from its own card (trap 2); then the server holds none of the key and the fixture's `Mounting/Support` is untouched ⚠️ Does NOT detect bugs §42: in its suite the form opens after `/work`'s prefetch has cached the schema (#71).
- [x] `Edit Item` opens the form filled from its card *(MOB.387)* — the six inputs hold the card's values; closed unsaved, the card unchanged after a reload; the card also lists `Stress Decision Score:`/`Notes:` and the failure table a `Discovery Code` row
- [x] `Edit Item` **saves** *(MOB.386)* · self-restoring — proved over `/graphql`, restored to 2 ⚠️ Does NOT detect bugs §42: in its suite the form opens after `/work`'s prefetch has cached the schema (#71).
- [x] Condition and Failure asset lookups ignore case *(MOB.389)* — `ZZZZ-NO-SUCH-ASSET` → `No results found`, `pUMP 0102` → exactly `Pump 0102`
- [x] Add-form picker *(MOB.393)* — read-only: the modal opens and the picker offers forms; nothing is attached
- [x] `FormMetrics` *(MOB.357)* — every card reads `0 of 0` until the fixture has a required field
- [x] Permits tab *(MOB.394)* — read-only
- [x] Add job note *(MOB.392)* · residue — tiptap editor; proved by exactly +1 note after a reload
- [x] Warranties tab and the warranty alert banner *(MOB.399)*; the empty state `No Warranties Found...` on `MOB.302`'s work order, whose asset has none
- [~] Assign work stage *(MOB.398)* — opens the crew modal, proves the form, cancels
- [ ] A field's label opens in a modal — the arrow icon beside it (`DetailPage/utils/MultiLineLabel.tsx`), used by General Info, the work form and the record forms (▶ #49)
- [x] `Edit Item` on a failure **saves** *(MOB.385)* · self-restoring — Repair Type `MISSED` → `REPAIR` on the first open after a page load, proved over `/graphql` on the failure's id; restored to `MISSED` `always` after a schema-priming open. 🛑 red whenever bugs §42's race is lost (locally 2 of 2) ⚠️ Does NOT detect bugs §42: in its suite the form opens after `/work`'s prefetch has cached the schema (#71).
- [x] Edit a job note *(MOB.361)* · self-cleaning — adds its own `DD SYNTHETIC MOBILE 361 NOTE {{ RUNID }}` note, edits it in the tiptap editor, proved over `/graphql` on that note's id
- [x] Delete a job note *(MOB.361)* · self-cleaning — owner-authorised (trap 2); `always`, guarded by a server premise (no marker note before the run) and exactly one marker card; the server then holds exactly the pre-run note ids
- [x] Add an existing asset from the Assets tab *(MOB.354)* · self-cleaning — `Bypass Valve 0001` through `Add Existing Asset`, the link proved over `/graphql` beside an untouched `Pump 0102` link, the stage's location unchanged
- [x] Remove an asset link from the Assets tab *(MOB.354)* · self-cleaning — owner-authorised (trap 2): only this run's `Bypass Valve 0001` link, guarded in the gear-click step; `Pump 0102`'s link and the condition/failure ids proved untouched
- [x] `Mark as …` on a work-order asset **writes** *(MOB.353)* · self-restoring — `Pump 0102` `Active` → `Completed` → `Active`, each proved over `/graphql` (the badge is written to the cache before the mutation); `/graphql` backstop `always`
- [x] The asset location form **submits** *(MOB.359)* · self-restoring — `Pump 0102`'s address, city and postal code from a stubbed geocode, proved over `/graphql`; `Include GIS` off so lat/long (read by `MOB.731`/`735`) are proved unchanged; restored `always`
- [x] Upload a photo to a work order's Attachments tab and delete it *(MOB.363)* · self-cleaning — on work order `20260910-16` (its template copies nothing to the asset); the server's one new image id kept, `Delete Photo` clicked only in the step proving the slide is that id (trap 2, owner-authorised); `/graphql`: back to no attachments, `⚡ Tank 0000` never held it
- [x] Attach a form *(MOB.364)* · self-cleaning — on work order `20260910-16`: the first template the stage does not hold; `/graphql`: exactly one more form, named the pick; its card after a reload and the page's ⟳ resync (a reload alone redraws the cached work order without a read, and the card was missing on 3 of 5 local replays; on Datadog, 1 of 1, it showed both before and after the reload — optional sentinels record it). Then deletes that form over `/graphql` (`deleteWorkStageForm`, owner 2026-09-15), `always`, and proves the stage's form ids back to the premise's
- [x] Reassign **saves** *(MOB.365)* · self-restoring — on work order `20260910-16`: → `Account Executive`, `Keep local copy` off; `/graphql`: `Admin` removed, the target added. Restore `always`: the UI re-adds `Admin` with `Keep local copy` on, a `/graphql` net un-assigns the target, the crews end exactly the 8 at rest

## `/work/:workStageId/form/:formId` — a work stage form

*`WorkOrders/components/Forms/FormDetails.tsx` — the desktop form at `availWidth >= 750`, `#senor-work-form` below*

- [x] Form render *(MOB.355)* — desktop branch on tablet; the mobile branch on phone *(MOB.951)*
- [x] Fill out an inserted form *(MOB.134)* · self-restoring — the form's integer field: `134` saved on blur, proved over `/graphql`, cleared and proved empty
- [-] Signature widget — freehand canvas (its `MobileSignatureField` host renders in `MOB.951`'s branch)

## `/asset-verify` — Mobile Jobs list

*`AssetVerification/index.tsx`*

- [ ] Verify status update (job list) — 🟡 reset decision
- [x] Status filter Ready / Canceled / Completed / In Progress *(MOB.530)* — fixture is `IN_PROGRESS`, so `Ready` must hide it
- [x] Sort opens and dismisses *(MOB.530)* · ordering really holds *(MOB.535, MOB.580)*
- [-] Status badge colour — assert the label; `MOB.342` shows the `getComputedStyle` route
- [x] Job count · statuses · asset count · legend arithmetic *(MOB.560)*
- [x] **SB** search bar *(MOB.530)*
- [x] Mobile Jobs *(MOB.140)* — page title; `Find Mobile Job(s)` check is critical (Appendix D)
- [~] **SB** — proven on the mobile job list *(MOB.530)*; other modules rely on that instance

## `/asset-verify/:jobId` — a mobile job's asset list

*`AssetVerification/Job.tsx` — each row expands into `AssetLookupDetails`*

- [x] From a Mobile Job asset *(MOB.396)*
- [x] Verify · moves to the Verified tab · counter increments · unverify decrements *(MOB.510)*
- [x] Unverified tab shows the asset; Verified tab empty at rest *(MOB.500)*
- [x] Verified asset does not show on Unverified *(MOB.590)* · self-restoring
- [x] Job status menu *(MOB.536)* · self-restoring — exactly `Mark as COMPLETED`/`CANCELED` from IN PROGRESS; CANCELED shows `This verification job has been canceled.`; back to IN PROGRESS, proved after a reload
- [x] Filter All / Verified / Unverified *(MOB.500)*
- [x] Asset card caret expands and collapses *(MOB.520)*
- [-] Add a new / an existing asset to a job — 🟡 reset decision (Appendix A)
- [x] Map view toggle on the job asset list *(MOB.585)*
- [-] Markers carry verification state — canvas, no DOM
- [x] Accordion tabs render and switch — General Info · Attributes · Photos · Docs · Work History *(MOB.520)*; Readings *(MOB.720)*
- [-] Change all statuses · verify all assets — one-way to `COMPLETED` (bugs §10) — 🟡 reset decision
- [x] Asset search inside a job *(MOB.531)*
- [x] Tag search: the create button is an exclusive-or with an exact match *(MOB.547)* — partial ⇒ results + create; `  cUSTOM  ` ⇒ results, no create; no match ⇒ create
- [x] `AssetReadingTimeline` popover *(MOB.551, in `MOB.962`)* — resolved state exclusive-or, timeline↔chart biconditional, offline message

## `/asset-verify/:jobId/asset/:verificationId` — full-page asset data

*`AssetVerification/AssetDetails.tsx`*

- [x] Left / right asset cycling with wrap-around *(MOB.570)*
- [x] Failures and Condition forms open on the full-page detail *(MOB.575)* — read-only
- [x] Attributes — edit *(MOB.545)* — `Year Of Manufacture`, self-restoring
- [x] Header `Tag ID` and its edit button *(MOB.537)* · self-restoring — `None` (A/C Motor) and `0000` (Tank); `0000` → `DD-TAG-EDIT` → back, each proved after a reload; `Desc:`
- [x] Event Readings — capture *(MOB.550)* · residue
- [x] Full-page `Attachments` tab (Photos/Docs segmented) *(MOB.546)* — one live panel, Photos↔Docs biconditional
- [~] Attachments — **AT**
- [-] Editing Asset Type on the AV detail — renders as plain text

## `/asset-collector` — Asset Collector / Lens

*`AssetCollector/index.tsx`*

- [x] The route renders and titles itself *(MOB.160)*
- [x] Photos / Docs / Attributes panel content *(MOB.623)* — collector call site of the same `AssetLookupDetails`
- [~] Create asset — name + desc + type, with a real photo *(MOB.600)* — 🛑 red by design: the server never receives it (bugs §34); ends with a network-only search for its own name
- [x] Add a photo without submitting *(MOB.621)*
- [x] The add-photo picker *(MOB.620)*
- [x] Carousel at one photo and at two; fullscreen; tag editor and its `MentorLens Tags` header *(MOB.622)*
- [x] Tag / description capture menus *(MOB.626)* — exactly `Add Asset Photo` in a browser; `Use photo selected above` (enabled) once the form holds a photo; offline, the wand's and `Add Asset Photo`'s connection messages (they flash, bugs §43); no item clicked online, form discarded unsent
- [x] Collector search *(MOB.610)*
- [x] Saved-photo menu, `Rotate Image`, and the three attachment panels on a collected asset *(MOB.623)* · residue
- [x] Collector sort *(MOB.625)* — on our own rows: `Created At` against the server's order, `Name` against `localeCompare`
- [x] `Collected By Me` *(MOB.625)* — a filter to the test account's rows
- 🟡 The collector's sort re-sorts the AV job list — bugs §38, `MOB.625` sentinels it
- [x] Row avatar modal *(MOB.624)* — opens without expanding the row; Photos↔Docs; `Done` closes. Clicks inside toggle the row behind (bugs §35), sentinelled
- [x] Edit asset fields *(MOB.710)*
- [-] Multiple attachments · HEIC · video — **AT**
- [ ] A MentorLens tag's description — the `?` beside a tag that has one opens it (`ui/PhotoCarousel/Tags/LensTags.tsx:58-72`); the tags come from the org's MentorLens tag data (▶ #47)
- [x] `Set as Avatar` **writes** *(MOB.627)* — on the run's own upload to a `DD SYNTHETIC MOBILE` asset, `asset.avatar.id` proved over `/graphql`; deleting that photo then clears the avatar on the server (`soft`)
- [x] Add, remove and create tags on a **saved** photo *(MOB.627)* · residue — the existing `Test Tag` added and removed, proved on the attachment; `+ Create Tag` leaves exactly one `DD SYNTHETIC MOBILE <RUNID>` org tag (one per run, permanent). The created tag does not reach the photo — an `optional` sentinel, red while bugs §44 is open
- [x] `Delete Photo` on a saved photo *(MOB.627)* · self-cleaning — owner-authorised (trap 2): only the run's own upload, its id re-checked in the same step as the gear click; the asset's attachment ids exactly as before
- [x] Upload a document and delete it *(MOB.628)* · self-cleaning — one PDF on a `DD SYNTHETIC MOBILE` asset's Docs, its row ticked and `Delete File(s)` clicked only while it is the one selected row; both ends over `/graphql`. its PDF is the owner-recorded upload (`MOB.PDF_Upload_Recording`); ✅ on Datadog

## `/asset-collector/:assetId`

*`AssetCollector/Details.tsx`*

- [-] `/asset-collector/:assetId` — orphan route

## `/asset-lookup` — Asset Lookup

*`AssetLookup/index.tsx` — each row expands into `AssetLookupDetails`*

### Search, rows and detail tabs

- [x] The route renders and titles itself *(MOB.100)*
- [x] General Info — edit a field *(MOB.710)* — the per-field pencil, all three entry points
- [x] Alphanumeric lookup *(MOB.700)* — server-side `CONTAINS`
- [x] Card caret and tab strip *(MOB.700)*
- [~] `Get Description` (MentorLens) — present in the menu *(MOB.623)*; offline, its connection message *(MOB.914)*; never clicked online (AI route)
- [x] Readings and Work History tabs offline — `OFFLINE_FEATURE_MESSAGE`; on an asset with readings, `Add reading types` offline opens it in a popover, not the add-types modal *(MOB.914)*
- [x] `Tag Lookup` menu *(MOB.750)* — exactly `Scan Barcode` then `Alphanumeric`
- [x] `Alphanumeric`'s browser branch *(MOB.750)* — one file dialog, `capture=environment`, images, one file; nothing uploaded
- [-] The capture itself — posts to `/api/upload/ai`; native scanner and camera are 🔴 HARNESS
- 🟡 `Scan Barcode` in a browser does nothing — bugs §37, `MOB.750` sentinels it
- [x] `View in Map` on an expanded row *(MOB.735)* — router state, not a URL
- [x] `Work History` tab — `WorkLookupDetails` *(MOB.740)*, also the map's `WorkCard`
- [x] Work-stage attachment panel and image filter *(MOB.741)*
- [x] "Near Me" proximity *(MOB.730)* and its radius *(MOB.731)*
- [x] The `Readings` tab *(MOB.720)*
- [x] Readings empty state — `No readings recorded for this asset.` on `⚡ Building 0000` *(MOB.721)*
- [-] `CopyAttributesConfirmation` — dead from mobile
- [ ] Work History rows' `Assigned to` field (`AssetLookup/AssetLookupDetails/WorkHistory.tsx:18`) (▶ #50)
- [x] Create a System from the System field *(MOB.712)* · residue — on a `DD SYNTHETIC MOBILE` asset: ticks `System` in the column picker (restored `always`), `+ Create '…'` → `CREATE_SYSTEM` + `UPDATE_ASSET`, both proved over `/graphql` (the modal closes before either is sent)
- [x] Capture a reading from Asset Lookup's Readings tab *(MOB.722)* · residue — `Test 1` on a `DD SYNTHETIC MOBILE` asset (added through `Add reading types` when absent), `CREATE_EVENT` proved over `/graphql`; `MOB.550` covers the AV container

### Filters and sort

- [x] Search vs. filter interaction *(MOB.820)* — submitting the search box discards active filters (bugs §20)
- [x] `StructuredQuery` filter builder *(MOB.800)* · edit *(MOB.805)* · multi-value *(MOB.806)*
- [x] `enum` multi-value branch *(MOB.807)* — `Failure Curve includes flat`, the list re-queried
- [x] `record` multi-value branch *(MOB.807)* — `Asset Type`: options load from the server
- 🟡 A record `includes` filter is saved with no value — bugs §39, `MOB.807` sentinels it

## `/material-lookup` — Material Lookup

*`MaterialLookup/index.tsx`*

- [x] The route renders and titles itself *(MOB.110)*
- [x] Storeroom dropdown *(MOB.850)* — `Central Storeroom` loads its list
- [x] Material search — matched pair *(MOB.850)*
- [x] Cycle count `+1` then `-1`, reason `Error Correction` *(MOB.860)* — self-restoring by construction, not by assertion
- [x] Stocking *(MOB.870)* · residue (+1 per run)
- [x] `Photos` / `Docs` segments and the row avatar image modal *(MOB.865)* — the storeroom item's (editable) above the material item's (read only), with `No photos`/`No documents`
- [x] Column-header sort really reorders; `N matches` vs rows *(MOB.855)* — bugs §33
- [-] Issue / return — these are work-order material charges (`MOB.370`)
- [-] Transfers · reorder notifications — controls do not exist
- [x] Storeroom item photo and PDF — upload, delete, each proved over `/graphql`, back at rest *(MOB.866)* · self-cleaning — the editable half is `StoreroomItem` (the material item stays read-only, its count unchanged); every destructive click re-checks the server's attachment id in the same step (trap 2, owner-authorised). its PDF is the owner-recorded upload (`MOB.PDF_Upload_Recording`); ✅ on Datadog

## `/map` — The Map

*`Map/index.tsx`*

- [x] The route renders and titles itself *(MOB.120)*
- [x] From the Mobile Map *(MOB.122)* — geocoder popup → `Add Work`
- [x] Map style · layers panel *(MOB.121)* — `data-tooltip-content` flips `Satellite`↔`Street`; the control's `Layers` heading
- [~] Zoom in/out *(MOB.121)* — Mapbox publishes no zoom to the DOM; proves the controls and that the canvas survives
- [x] `Switch Map` picker *(MOB.123)* — a pick writes `mobile-map-id` and remounts the map; reopening reads it back; switched back after. Enabled side only (dev has 3 maps)
- [-] 2D/3D toggle · Home — no DOM trace of the state change
- [x] Geocoder search → suggestion → fly + popup *(MOB.122)* — the popup's `Latitude`/`Longitude`
- [x] Create a work order from the map *(MOB.122)*
- [x] Feature sheet for an asset, reached by router state *(MOB.735)*
- [-] Add asset to work order — `ChangeAssetPopup` needs a tap on a rendered feature
- [-] Create asset / work order by lasso · marker · line · polygon
- [-] Get directions · street view — leave the app

## `/transactions` — Transaction Log

*`TransactionLog/index.tsx`*

- [x] The route renders and titles itself *(MOB.130)*
- [x] Transaction Log lists entries *(MOB.131)* — makes a verify/unverify first; the log reads `gql_log` and a fresh session has nothing
- [x] Transaction Log search *(MOB.132, in `MOB.972`)* — filters to zero and restores the same row count

## `/logz` — Dev Logs

*`DevLogs/index.tsx` — hidden unless the env is `development`/`development2`*

- [x] Dev Logs *(MOB.170)* — hidden unless env is `development`/`development2`; contents *(MOB.171)* · self-restoring (`log_level`)

# Reusable blocks

## SB — Standard search bar

*Referenced by 6 modules.*

- [x] Type a term · verify results *(MOB.530)*
- [x] Open Sort By, close the modal *(MOB.340, MOB.530)*
- [x] Sort options persist across a route change and flip *(MOB.810)* — labels `${column.label} ▲`/`▼`; reads `sessionStorage['mobile-MobileJob-sort']` (the label is an `<input>` value — trap 16)
- [x] Sort ordering really holds *(MOB.580)*

## AT — All attachment types

Each new file **type** needs one hand-authored `uploadFiles` step before `upload_steps()` can copy
it (trap 12). A successful upload writes a permanent attachment; the image path is free only
where a client-side filter rejects it (`MOB.741`).

- [x] Photo — `MOB.600` (attached) · `MOB.621` (unsent)
- [x] Image rejected by the Docs-tab filter — `MOB.741`
- [-] Video · HEIC · Document · Nameplate · Custom — ⏸️ deferred by the owner
- [-] Multiple attachments at once — the step carries the one file it was authored with
- [-] Capture from camera — native dialog

# Appendix A — Blocked on the AV reset decision

| Item | Why |
|---|---|
| **Add Work** from Asset Lookup / AV detail | a permanent work order through `MOB.300`'s form; the only new behaviour is `defaultAsset`. Its residue cannot be pruned until bugs §41 |
| **Add new / existing asset** to a job | grows the fixture job and breaks the `out of 2` assertions |
| **Verify all assets** | flips the job to `COMPLETED`, which mobile cannot walk back (bugs §10) |

`reset_av_fixture.py` puts all three back (`cleanup_spec.md` §4); what remains is the owner's
call — 🟡 BLOCKED.

# Appendix B — Out of scope: needs a desktop harness

| Item | Belongs in |
|---|---|
| Verify status / asset / mobile-job updates on desktop | desktop suite |
| Add mobile job on desktop → mobile list updates | cross-platform test |
| Asset Verification Job Template · Mobile Work Template | desktop admin pages |

The Mobile/Tablet halves of "Web / Mobile / Tablet" items are not extra `device_ids` (trap 1).

# Appendix C — Not automatable in Synthetics

| Area | Why |
|---|---|
| The browser genuinely offline | Synthetics cannot cut the network. What the app **reads** is reachable: `useNetwork` (window events — `MOB.910`), the queue's gate (window events — `MOB.913`), `navigator.onLine` (an own getter in a step — `MOB.912`) |
| Upload resume / tus retry | requires interrupting a transfer |
| Camera capture · barcode | device camera / native dialog; tag scan also calls OpenAI |
| Native shell bridge | Expo only |
| Map **canvas** interactions | features are hit-tested via `queryRenderedFeatures`, no DOM. Canvas, geocoder, style/layers/zoom are reachable |
| Signature widget | freehand canvas |
| Directions / street view | navigate out of the app |
| Colour assertions | assert the label; `getComputedStyle` where needed |

Before trusting a *not automatable* row, ask what the app actually **reads** — usually a
JS-reachable observable (`useNetwork`, `navigator.onLine`, `navigator.geolocation`,
`queryRenderedFeatures`) rather than the physical thing the row names. Hold a probe to the same
standard as a test.

# Appendix D — Open questions

| # | Question | Blocks |
|---|---|---|
| **1** | Should `MOB.140`'s "Find Mobile Job(s)" check be critical? Only if the test crew always has ≥1 mobile job | one step that can skip silently |
| **2** | File `removeFromCollection` in `bugs_found.md`? It drops the card from the cache, then fires the remove mutation with no error path or rollback (`WorkOrders/utils/removeFromCollection.ts:24-36`), so a refused `Delete Item` vanishes from the UI and stays gone across reloads while still on the server | owner's call |

# Appendix F — runtime

**Datadog's maximum test execution time is a hard ceiling (~1071s).** A suite that ran green at 474s with 13
children went past it with one more 70-step child. A timeout names no step — compare runtime
with the last green run before hunting a locator; measure a suite's runtime after adding to it.

**Every step polls until its timeout; an untimed one until Datadog's 60s default.** A positive
assertion never needs a blind `wait` in front of it — only absence checks do (trap 21).

Runtime ≈ explicit `wait` seconds + ~1s per step.
- Replace blind waits with a `timeout` on the next **positive** assertion — except a wait before
  `assertPageLacks`, before `goToUrl`, and `av_list_gate`'s 25s (two absence checks depend on it).
- The last fixed 20s `/work` warm-ups are being switched to `work_list_gate(require_row=False)` (▶ #69).
- `work_list_gate` warms a per-session cache — gate on the first leg only. Its `LOADEDALL 3/3` polls up to 180s:
  every listed stage's detail downloads first (86s locally on a cold session, measured 2026-09-16; it grows with residue, bugs §41).
- Screenshots are on for every step; keep them on assertions.
- Independent read-only suites can run in parallel (`dd_tools.run` takes several names; the on-demand cap is 10); never
  the writing ones (trap 1).
- A red `verify.py` run bills **3**: Datadog retries the scratch once.
- Measure locally first: `local_timing.py` times every suite for 0 runs. Local seconds are an
  estimate — compare with the last Datadog runtime before restructuring a suite. All 24 module
  suites are timed (`local_runs/timing/summary.md`, and the `local` column above).
- The same test takes ~1.2–2× as long on Datadog as locally — the first pass measured most suites at 1.4–1.6× —
  scale a local suite time up before comparing it with the ceiling.
