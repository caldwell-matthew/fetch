# Mobile App — Test Plan

> **State, not stories.** A row records what is covered and what blocks it — no run logs, dates
> or debugging history. When something ships, flip its box and cite the test.
>
> **▶ OPEN WORK holds only work not yet done.** When an item's build is finished, delete its row in
> the same change: its coverage goes to its T-section row, anything still owed to Datadog to 📊 RUN
> STATUS's awaiting list, and a leftover gap to a new row. Row numbers are never reused; a deleted
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
| **Last synced** | `c63586256a` — no `client/mobile` change since `1c3a2e8abe` (last `client/mobile` change `cbabfa40f6`); **no asserted literal moved** (`check_literals` clean) |
| **Literal scan** | `check_literals.py` clean against this build |

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
| Tests | **125 leaf tests · 16 suites** · 3824 steps · 120 subtest slots (+ `MOB.999_Verify_Scratch`, a harness) |
| Local ↔ remote | every local test matches Datadog by content — `preflight.py sync` compares step names and subtest ids (it prints the first 5). `MOB.711` is archived locally only |
| Device | `chrome.tablet`, except the read-only phone suite `MOB.984` on `chrome.mobile_small` (trap 1) |
| Rows | 148 `[x]` · 13 `[~]` · 1 `[ ]` · 36 `[-]` — 198 rows. Counts describe *this file*, not the app |
| Cost of one full pass | ~133 billed runs (each suite once) — a subtest bills as its own run |
| Scheduling | Manual today. **Owner's plan: weekly Datadog runs — late game, once no more tests are being made** (▶ OPEN WORK #37) |

### Suites — children, and what they leave behind

| suite | children | class |
|---|---|---|
| `MOB.983_AssetVerify_Extra` | 3 | self-restoring |
| `MOB.984_Phone_Suite` | 2 | read-only · `chrome.mobile_small` · **run on its own** |
| `MOB.985_WorkDetail` | 12 | read-only |
| `MOB.986_WorkOrders_Extra` | 13 | residue (`MOB.122`/`396`/`397`) · `MOB.302` self-cleaning |
| `MOB.987_EventReadings` | 2 | residue (`MOB.550`) |
| `MOB.988_WorkOrders_Records` | 6 | residue (charges) · `MOB.390`/`391` self-cleaning, red whenever bugs §42's race is lost (`soft`) |
| `MOB.989_FieldEdit` | 6 | self-restoring · `MOB.386` red whenever bugs §42's race is lost (`soft`) |
| `MOB.990_Smoke` | 14 | read-only |
| `MOB.991_WorkOrders` | 7 | residue (`MOB.300`, `MOB.392`) · `MOB.320` self-restoring |
| `MOB.992_Menu` | 7 | read-only |
| `MOB.993_AssetVerify` | 14 | self-restoring |
| `MOB.994_Collector` | 9 | residue (`MOB.600`, `MOB.623`) |
| `MOB.995_AssetLookup` | 10 | read-only |
| `MOB.996_Search` | 8 | read-only |
| `MOB.997_Session` | 2 | self-restoring · **never run concurrently** — mutates the session crew |
| `MOB.998_MaterialLookup` | 5 | residue (`MOB.870` only) |

**Standalone:** `MOB.000_Login` · `MOB.200_Crew_Switch` (mutates) · `MOB.346_Work_Scheduled_View`
(blocked) · `MOB.440_Logout` (ends the session) · `MOB.978` diagnostic (kept while the work-list
fixture is in flux).

### Proving a test — locally, then on Datadog

The loop and its costs live in `test_authoring.md` → **The loop**: build → static checks →
`local_run.py` (0 runs) → `verify.py` (2 runs; 3 when red) → wire. What bears on planning:

- **Datadog runs wait for the owner's go-ahead** — credits are limited. A verify costs 2, a suite
  `1 + children`. A local pass is a pre-check, not a RUN STATUS entry.
- A solo pass is strong evidence (a fresh session inherits no sort, filter or crew). The risk runs
  the other way — passing *inside* a suite because an earlier child left state — so run suites
  occasionally as an integration check, not as the way to prove a test.

## 📊 RUN STATUS — what is actually proven

*"Passed when last run" on Datadog — runs are manual. Re-run a suite when its area changes.*

| suite | status |
|---|---|
| `MOB.983_AssetVerify_Extra` | ⏳ never run as a suite · all three ✅ solo on the current build — `MOB.537` (with `Desc:`), `MOB.913` (its drained list refreshes to `No logs found.`), `MOB.536` |
| `MOB.984_Phone_Suite` | ✅ 2/2 · 150s · current build (`MOB.951`'s Forms gate and `Upload Photo`) · `chrome.mobile_small`, run on its own |
| `MOB.985_WorkDetail` | ✅ 9/9 last run · now 12 children — `MOB.389`, `MOB.387`, `MOB.912` and `MOB.358`'s offline leg ✅ solo, not yet run in the suite |
| `MOB.986_WorkOrders_Extra` | 10/11 last run — red only at `MOB.345`, since fixed ✅ solo · `MOB.301` ✅ and `MOB.302` ✅ solo, not yet run in the suite · `MOB.122` ✅ and `MOB.399` ✅ (its empty-state leg) solo on the current build |
| `MOB.987_EventReadings` | ❌ not run for ≥ 3 weeks · `MOB.551` ✅ solo |
| `MOB.988_WorkOrders_Records` | ⏳ never run as a suite · `MOB.350`/`360`/`370`/`380` ✅ solo (+1 after a reload) · `MOB.390` 🛑 red on 2 of 3 Datadog runs (the third passed end to end), `MOB.391` 🛑 red on 3 of 3 — each red whenever the first add after a page load loses bugs §42's race |
| `MOB.989_FieldEdit` | ✅ 3/3 last run · now 6 children — `MOB.388` ✅ solo · `MOB.134` ✅ solo · `MOB.386` 🛑 red on Datadog (bugs §42's race) · none of the three yet run in the suite |
| `MOB.990_Smoke` | ✅ 13/13 · current build · `MOB.123` ✅ solo, not yet run in the suite · `MOB.121` ✅ solo with its `Layers` heading |
| `MOB.991_WorkOrders` | ⏳ not run in its 7-child shape (last green was the old 13-child suite — a green that hid bugs §40) · `MOB.392` ✅ solo with its +1 proof · `MOB.320` ✅ solo with the full walk |
| `MOB.992_Menu` | ✅ 7/7 · `MOB.430` ✅ solo on its current build (the offline description) |
| `MOB.993_AssetVerify` | ✅ 12/12 · current build · `MOB.546` ✅ and `MOB.547` ✅ solo, not yet run in the suite |
| `MOB.994_Collector` | 🛑 **red by design** at `MOB.600`'s server proof (bugs §34; `soft`, so later children run) · `MOB.622` ✅ solo with `MentorLens Tags` · `MOB.623`, `624`, `625` ✅ solo · `MOB.626` ✅ solo with its offline leg · none yet run in the suite |
| `MOB.995_AssetLookup` | ✅ 7/7 last run · now 10 children — `MOB.750`, `MOB.721` and `MOB.914` ✅ solo, not yet run in the suite |
| `MOB.996_Search` | ✅ 7/7 · current build · `MOB.807` ✅ solo, not yet run in the suite · `MOB.820` ✅ solo with its select-all fix |
| `MOB.997_Session` | ✅ 2/2 · current build |
| `MOB.998_MaterialLookup` | ✅ 3/3 · current build · `MOB.855` ✅ and `MOB.865` ✅ solo (its storeroom/material split), not yet run in the suite |
| `MOB.346_Work_Scheduled_View` | 🛑 cannot pass — see 🟡 BLOCKED |


The shared login prefix carries a boot crash guard (`add_crash_guard.py`) in every suite,
`MOB.000`/`200`/`440`, the diagnostic and the scratch.

## ▶ OPEN WORK — the only "what's next" section

### 🟢 BUILDABLE — ranked by yield

| # | item | state |
|---|---|---|
| **31** | **Suite runtimes, locally** — `local_timing.py` runs each suite one at a time (0 runs) to find the ones near Datadog's execution ceiling (Appendix F) and restructure them before a Datadog suite pass. Late game, like #37: time the suites once no more tests are being made (owner). A partial pass exists — 7 of 16 suites, provisional (`local_runs/timing/summary.md`) | late game · once no more tests are being made |
| **37** | **Weekly schedule on Datadog** (owner) — the late-game item, once no more tests are being made. ~133 runs per full pass (16 suites + 117 children) ≈ 575/month. Schedule the **16 suites only** (a child also scheduled bills twice); **stagger** them — the mutating suites share fixtures (trap 1), `MOB.997` and `MOB.984` must run alone; give each a failure notification. Needs `dd_tools.push` to send `status` + a weekly `tick_every` for suites (`BODY_KEYS` omits `status`). Residue grows ~4 work orders per pass until bugs §41 | late game · suite runtimes first (#31) |

**Finding the next ones:** `sweep_strings.py` (🔧 check 6) — JSX text children no test's params contain,
not attributes. Last sweep: `origin/development@e1db362a53` — 194 strings, 127 asserted; each of the 67 others (some
still TypeScript the regex caught) is a row above or classified (⚪ / 🔴 / 🟡 / `[-]`).

### 🟡 BLOCKED — decisions, fixtures and backend

| item | needs | kind |
|---|---|---|
| **`MOB.346_Work_Scheduled_View`** | settled: `mobileDownloadMode` stays `ASSIGNED` so the crew keeps its work orders; a `SCHEDULED` role sees only stages with a `scheduledevent` within ±7 days (bugs §25 rule 4). The scheduled view, `WO_SCHEDULED_SORT` and `ScheduleTimeline` are unreachable. Standalone; restore only when the role changes **and** its work is scheduled | settled |
| Verify-all → `COMPLETED` · verify status update (job list) · add a NEW / EXISTING asset to the job · Add Work | `reset_av_fixture.py` can put the fixture back for 0 runs (`cleanup_spec.md` §4). The owner accepts the **run → reset** chore and Add Work's residue, then the five tests get built | decision |
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

### 🔧 MAINTENANCE — eleven standing checks, none costs a run

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
| 10 | **the work-order fixture** | `EYRpYJ9QYdQ1JFF10JtB0Q` must be `Ready` — outside In Progress/On Hold/Ready it leaves the crew's list (bugs §25). `MOB.320` restores it `always`; `preflight.py work` reads it |
| 11 | **the docs' own consistency** | `preflight.py docs` — no finished row in ▶ OPEN WORK, no `#N` citing a row that does not exist, the Rows line and the test counts match their sources |

Checks 1–4 watch the tests; 5, 6 and 8 the app; 9 and 10 the fixtures; 11 the docs themselves.

**Other hygiene:**
- **Tags** are inconsistent — 38 of 125 leaves carry no class tag, and the residue tags vary
  (`residue`, `self-cleaning`, `self-restoring`). Classify by `test_authoring.md`'s rule and change
  generator **and** JSON together (trap 19). Until then the suite table above is the truth.
- 🧹 **Residue** — `cleanup_residue.py` (dry run by default): 190 marked work orders (blocked by
  bugs §41), 3 notes (a prune keeps 1), charges excluded by the owner (`cleanup_spec.md` §2).
- **`audit_assertions.py`** — 120 suspects (2 HIGH · 37 MED · 81 LOW). HIGH: `MOB.913`'s two RESTORE
  steps click every checked box and return `true` — actions, not claims; nothing in `MOB.913` reads
  the restore back (`preflight.py av` does). MED and LOW were last all read at 59 suspects and have
  grown since — re-read before quoting them. It cannot see an assertion the APP turned vacuous —
  check 5 does.

# Tier 1 — Mobile-specific risks

## T1.1 Offline & the transaction queue

- [x] Mutate while offline → the operation is HELD, not failed *(MOB.913)* — a browser `offline` event closes the queue; pending reads 1, and still 1 after 6s
- [x] Reconnect → the queue drains *(MOB.913)* — `online` → the indicator clears and, after a reload, the server has the verify
- [x] Queue survives an app reload *(MOB.913)* — reloaded while held; `PersistedQueueLink` re-sent it from IndexedDB on startup
- [x] Pending-transaction count and list *(MOB.913)* — 0 → 1 → 0; `Pending Transactions` lists `VERIFY_ASSET` with its variables. Observed: while unsent, the job's `N out of 2` counter does NOT move (it reads the server's count) though the checkbox shows verified
- [x] `OFFLINE_FEATURE_MESSAGE` on connection-dependent controls *(MOB.910 flips the header icon, Home tile and menu item; MOB.911/912 and MOB.358 cover three messages; the per-control messages, `EventReadings`' `Add reading types` popover included — `MOB.626`, `MOB.914`, `MOB.430`)*
- [x] Offline notice does **not** appear while online *(MOB.900)* — paired with a positive control
- [x] `ConnectionRequired` *(MOB.912)* — Asset Lookup's whole-screen block reads `window.navigator.onLine`; a step-defined getter reaches it. Paired: search input online → ConnectionRequired offline
- [-] `useWorkAssignmentSubscription` — live work assignment push (`Layout/Auth.tsx`); needs a server-side event
- [x] Transaction Log lists entries *(MOB.131)* — makes a verify/unverify first; the log reads `gql_log` and a fresh session has nothing
- [x] Transaction Log search *(MOB.132, in `MOB.993`)* — filters to zero and restores the same row count
- [-] Logout clears pending queues — not observable; the obvious test asserts something false

## T1.2 Uploads & attachments

- [~] Attach a file *(MOB.600)* — 🛑 the collect never reaches the server when a photo is attached (bugs §34); red until fixed
- [x] A photo reaches the carousel without submitting *(MOB.621)* — local reducer, discarded unsent
- [x] Work-stage attachments panel and its image filter *(MOB.741)* — an image through `Add File` is rejected with a toast, zero residue
- [x] Add a photo to an EXISTING asset through the panel's `Add Photo` *(MOB.623)* · residue — polls for the `blob:` preview to become a server URL
- [x] `PhotoMenu` on a saved photo *(MOB.623)* — the five items exactly and in order; `Rotate Image` ×4 with the src read back (self-restoring at 360°)
- [~] `Set as Avatar` · `Get Description` · `Delete Photo` — asserted present *(MOB.623)*; `Get Description` clicked only offline, for its connection message *(MOB.914)*; the others never clicked (write / trap 2)
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
- [x] Phone form branch `#senor-work-form` renders below `availWidth` 750, the desktop panel does not *(MOB.951, in `MOB.984`)*; its image field shows `Upload Photo` exactly when the form has one
- [x] The list's search control, the affixed create button and the burger are on screen at phone width *(MOB.952)*
- [x] Crew switching at phone width — the burger's `Switch Crews` (the login prefix reads the role there, `MOB.984`); the header shortcut `.mobile-crew` is hidden under 450px **by design** *(MOB.952, `optional`)*. Common phones are 393–430px, so the shortcut shows only on tablets and in landscape — a product call

## T1.5 Service worker & app updates

- [x] Service worker registers and controls the page *(MOB.470)*
- [-] Update prompt — there is none (bugs §31: a deploy takes over silently)
- [-] Stale cache does not survive an update — needs two builds to observe

## T1.6 Geolocation

- [x] Geolocate populates address/lat/long — `ProximityMenu` *(MOB.731)* and the work-asset form *(MOB.358)*
- [x] Geolocate messaged when offline *(MOB.911, in `MOB.985`)* — `GeolocateButton`'s popover
- [x] The geolocate form's offline state *(MOB.358)* — `navigator.onLine` overridden: `Location details are unavailable offline.`; closed unsubmitted, getter removed
- [-] Real device GPS — a stub proves the app's handling of a result, never the device

## T1.7 Native shell bridge

- [-] Haptics · native upload · anything gated on `window.ReactNativeWebView` — Expo shell only

# Tier 2 — Module functionality

## T2.1 Work Orders

### Create — entry points

- [x] From the Work Order module *(MOB.300)* — affixed `+` → workflow lookup → submit (a server answer: no `optimisticResponse`)
- [x] From the Mobile Map *(MOB.122)* — geocoder popup → `Add Work`
- [x] From a Mobile Job asset *(MOB.396)*
- [x] Assign follow-up work *(MOB.397)*
- [x] Photos on the insert form *(MOB.301)* — one upload lands as exactly one slide, a `blob:` URL (nothing uploaded before submit); closed with its X, never submitted

### Read

- [x] Open a work order and render its detail *(MOB.310)*

### Change status

- [x] Every assignable status — Pending · In Progress · On Hold · Requested · Not Completed · Complete · Canceled · back to Ready *(MOB.320)* · self-restoring — the badge read exactly, and the server read over `/graphql` for `NotCompleted` and the restored `Ready`; Ready restored `always`
- [x] Status notes branch — not applicable to this fixture's template (`requireStatusNotes` off)
- [-] The status-notes modal — deliberately not covered (repo owner)

### ELMO charges

- [x] Equipment *(MOB.350)* · labor *(MOB.360)* · material *(MOB.370, type Return so stock is not decremented)* · other *(MOB.380, `unitPrice` required at runtime — trap 8)* · residue — each proved by exactly +1 of its own record after a reload
- [x] Invalid charge form does NOT submit — all four *(MOB.356)*
- [x] The `ESTIMATES` section on all four tabs *(MOB.351)* — pins `{section === 'CHARGES' && InsertForm}` both ways; the fixture has no estimate cards
- [x] `Internet Connection is required to make a material charge` *(MOB.912)* — paired: CHARGES online → the message offline

### Tabs & forms

- [x] Detail tabs render and switch *(MOB.330)*
- [x] General Info — edit a field *(MOB.395)* · self-restoring (`DATADOG FIXTURE`)
- [x] Attributes tab edit *(MOB.388)* — `Heater Hz`, marker → reload → `7` → reload (`UPDATE_WORKSTAGE_ATTRIBUTE`)
- [x] Assets tab and its status controls *(MOB.347)* — `Mark as …` asserted, never clicked
- [x] Attachments *(MOB.741)*
- [x] `Copy to asset` *(MOB.302)* · self-cleaning — links the stage photo to `Bypass Valve 0001` (the same attachment id), proves it on Asset Lookup, unlinks it (trap 2, guarded to unlink only), proves the asset back to 0 and the work order's image still loading
- [~] Add failure *(MOB.391)* · self-cleaning — 🛑 red whenever the first add after a page load loses bugs §42's race (3 of 3 Datadog runs; `soft` from that check on); key `BELT (R-L1) · ADJUST · TIME`; proved after a RELOAD and over `/graphql`, deleted from its own card (trap 2); then the server holds none of the key and the fixture's `MISSED` failure is untouched
- [~] Add condition score *(MOB.390)* · self-cleaning — 🛑 red whenever the first add after a page load loses bugs §42's race (2 of 3 Datadog runs; `soft` from that check on); key `Pump Body`; proved after a RELOAD and over `/graphql`, deleted from its own card (trap 2); then the server holds none of the key and the fixture's `Mounting/Support` is untouched
- [x] `Edit Item` opens the form filled from its card *(MOB.387)* — the six inputs hold the card's values; closed unsaved, the card unchanged after a reload; the card also lists `Stress Decision Score:`/`Notes:` and the failure table a `Discovery Code` row
- [~] `Edit Item` **saves** *(MOB.386)* · self-restoring — 🛑 red whenever the first open after a page load loses bugs §42's race; proved over `/graphql`, restored to 2
- [x] Condition and Failure asset lookups ignore case *(MOB.389)* — `ZZZZ-NO-SUCH-ASSET` → `No results found`, `pUMP 0102` → exactly `Pump 0102`
- [x] Add-form picker *(MOB.393)* — read-only: the modal opens and the picker offers forms; nothing is attached
- [x] Form render *(MOB.355)* — desktop branch on tablet; the mobile branch on phone *(MOB.951)*
- [x] Fill out an inserted form *(MOB.134)* · self-restoring — the form's integer field: `134` saved on blur, proved over `/graphql`, cleared and proved empty
- [-] Signature widget — freehand canvas (its `MobileSignatureField` host renders in `MOB.951`'s branch)
- [x] `FormMetrics` *(MOB.357)* — every card reads `0 of 0` until the fixture has a required field
- [x] Permits tab *(MOB.394)* — read-only
- [x] Add job note *(MOB.392)* · residue — tiptap editor; proved by exactly +1 note after a reload
- [x] Warranties tab and the warranty alert banner *(MOB.399)*; the empty state `No Warranties Found...` on `MOB.302`'s work order, whose asset has none
- [~] Assign work stage *(MOB.398)* — opens the crew modal, proves the form, cancels
- [x] `MapLink` on the title *(MOB.348)* — `View in Map` and `Edit Location`
- [x] Record cycling *(MOB.349)*

### Work list

- [x] Search bar opens; Sort Criteria modal opens *(MOB.340)* · search filters the list *(MOB.343)*
- [x] Map view toggle *(MOB.341)*
- [x] Status ring + clickable legend *(MOB.342)*
- [x] Tapping a row opens its work order *(MOB.344)*
- [x] Sort applies, persists, and really reverses *(MOB.345)*
- [x] Scheduled view, `WO_SCHEDULED_SORT`, group headers *(MOB.346)* — 🛑 blocked, see 🟡
- [-] `Created` stages on the ring — the crew query never returns one (bugs §25 rule 2)

## T2.2 Asset Verification

### Verification behaviour

- [x] Verify · moves to the Verified tab · counter increments · unverify decrements *(MOB.510)*
- [x] Unverified tab shows the asset; Verified tab empty at rest *(MOB.500)*
- [x] Verified asset does not show on Unverified *(MOB.590)* · self-restoring
- [ ] Verify status update (job list) — 🟡 reset decision
- [x] Job status menu *(MOB.536)* · self-restoring — exactly `Mark as COMPLETED`/`CANCELED` from IN PROGRESS; CANCELED shows `This verification job has been canceled.`; back to IN PROGRESS, proved after a reload

### Status filters, sort, cards

- [x] Status filter Ready / Canceled / Completed / In Progress *(MOB.530)* — fixture is `IN_PROGRESS`, so `Ready` must hide it
- [x] Filter All / Verified / Unverified *(MOB.500)*
- [x] Asset card caret expands and collapses *(MOB.520)*
- [x] Sort opens and dismisses *(MOB.530)* · ordering really holds *(MOB.535, MOB.580)*
- [x] Left / right asset cycling with wrap-around *(MOB.570)*
- [-] Status badge colour — assert the label; `MOB.342` shows the `getComputedStyle` route

### Add assets

- [-] Add a new / an existing asset to a job — 🟡 reset decision (Appendix A)

### Map view

- [x] Map view toggle on the job asset list *(MOB.585)*
- [-] Markers carry verification state — canvas, no DOM

### Asset data tabs

- [x] Accordion tabs render and switch — General Info · Attributes · Photos · Docs · Work History *(MOB.520)*; Readings *(MOB.720)*
- [x] Photos / Docs / Attributes panel content *(MOB.623)* — collector call site of the same `AssetLookupDetails`
- [x] General Info — edit a field *(MOB.710)* — the per-field pencil, all three entry points
- [x] Failures and Condition forms open on the full-page detail *(MOB.575)* — read-only
- [x] Attributes — edit *(MOB.545)* — `Year Of Manufacture`, self-restoring
- [x] Header `Tag ID` and its edit button *(MOB.537)* · self-restoring — `None` (A/C Motor) and `0000` (Tank); `0000` → `DD-TAG-EDIT` → back, each proved after a reload; `Desc:`
- [x] Event Readings — capture *(MOB.550)* · residue
- [x] Full-page `Attachments` tab (Photos/Docs segmented) *(MOB.546)* — one live panel, Photos↔Docs biconditional
- [~] Attachments — **AT**

### Counts & cross-platform

- [x] Job count · statuses · asset count · legend arithmetic *(MOB.560)*
- [-] Change all statuses · verify all assets — one-way to `COMPLETED` (bugs §10) — 🟡 reset decision
- [x] Asset search inside a job *(MOB.531)*
- [x] **SB** search bar *(MOB.530)*

## T2.3 Collector / Lens

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
- [x] Tag search: the create button is an exclusive-or with an exact match *(MOB.547)* — partial ⇒ results + create; `  cUSTOM  ` ⇒ results, no create; no match ⇒ create
- [x] Row avatar modal *(MOB.624)* — opens without expanding the row; Photos↔Docs; `Done` closes. Clicks inside toggle the row behind (bugs §35), sentinelled
- [x] Edit asset fields *(MOB.710)*
- [-] `/asset-collector/:assetId` — orphan route
- [-] Multiple attachments · HEIC · video — **AT**

## T2.4 Asset Lookup

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
- [x] `AssetReadingTimeline` popover *(MOB.551, in `MOB.987`)* — resolved state exclusive-or, timeline↔chart biconditional, offline message
- [-] `CopyAttributesConfirmation` — dead from mobile
- [-] Editing Asset Type on the AV detail — renders as plain text

## T2.5 Material Lookup

- [x] Storeroom dropdown *(MOB.850)* — `Central Storeroom` loads its list
- [x] Material search — matched pair *(MOB.850)*
- [x] Cycle count `+1` then `-1`, reason `Error Correction` *(MOB.860)* — self-restoring by construction, not by assertion
- [x] Stocking *(MOB.870)* · residue (+1 per run)
- [x] `Photos` / `Docs` segments and the row avatar image modal *(MOB.865)* — the storeroom item's (editable) above the material item's (read only), with `No photos`/`No documents`
- [x] Column-header sort really reorders; `N matches` vs rows *(MOB.855)* — bugs §33
- [-] Issue / return — these are work-order material charges (`MOB.370`)
- [-] Transfers · reorder notifications — controls do not exist

## T2.6 The Map

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

## T2.7 Home screen

- [x] Welcome banner names the user and org *(MOB.180)*
- [x] Six module tiles render; `Work Orders` navigates *(MOB.180)*
- [x] Tile permission gating and `No valid permissions` *(MOB.210)*
- [x] Asset Lookup tile hidden when offline *(MOB.910)*
- [-] Trial-mode tile disabling — needs a trial org

# Tier 3 — Navigation & chrome

## T3.1 Routes

- [x] Login landing *(MOB.000)* · `/` Home *(MOB.180)*
- [x] Collector *(MOB.160)* · Asset Lookup *(MOB.100)* · Material Lookup *(MOB.110)* · Work Orders *(MOB.150)* · Map *(MOB.120)* · Transaction Log *(MOB.130)*
- [x] Mobile Jobs *(MOB.140)* — page title; `Find Mobile Job(s)` check is critical (Appendix D)
- [x] Dev Logs *(MOB.170)* — hidden unless env is `development`/`development2`; contents *(MOB.171)* · self-restoring (`log_level`)
- [x] `/work/:workStageId/form/:formId` — render level *(MOB.355, MOB.951)*
- [-] `/asset-collector/:assetId` — orphan route
- [x] Filling a work form *(MOB.134)* — see T2.1

## T3.2 Hamburger menu

- [x] Open / close *(MOB.400)* · ReSync *(MOB.410)* · Transaction Log *(MOB.420)*
- [x] Switch Crews *(MOB.200, MOB.430)* · Cancel *(MOB.430)* · the modal's offline description *(MOB.430)*
- [x] Log Out · confirm · Take Me Back *(MOB.440)*
- [~] Module resync timestamp *(MOB.460)* — resync leaves no durable difference; proves the control and its timestamp
- [x] Toggle Work Order List / Scheduled View *(MOB.346)* — blocked with it; the item exists only for a `SCHEDULED` role
- [x] Asset Lookup item hidden when offline *(MOB.910)*
- [-] Switch Crews close button — does not exist

### Header status icons

- [x] Version string *(MOB.470)* — `Version: ` + a real `shortVersion`
- [x] `NetworkStatusIcon` — online *(MOB.470)*, offline *(MOB.910)*
- [x] `TransactionStatus` pending count — `!count` online *(MOB.470)*; counted, and the `PendingTransactionLogs` list *(MOB.913)*; drained with the list open, Refresh reads `No logs found.`
- [-] `UploadStatusIcon` — Expo only
- [x] The crew shortcut `.mobile-crew` opens `RoleSelection` *(MOB.470)*

## T3.3 Global

- [x] Back arrow lands on the specific previous route *(MOB.450)*
- [~] **SB** — proven on the mobile job list *(MOB.530)*; other modules rely on that instance
- [x] Search vs. filter interaction *(MOB.820)* — submitting the search box discards active filters (bugs §20)
- [x] `StructuredQuery` filter builder *(MOB.800)* · edit *(MOB.805)* · multi-value *(MOB.806)*
- [x] `enum` multi-value branch *(MOB.807)* — `Failure Curve includes flat`, the list re-queried
- [x] `record` multi-value branch *(MOB.807)* — `Asset Type`: options load from the server
- 🟡 A record `includes` filter is saved with no value — bugs §39, `MOB.807` sentinels it
- [x] Offline geolocate branch *(MOB.911)*

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

**Datadog's maximum test execution time is a hard ceiling.** `MOB.991` ran green at 474s with 13
children; one more 70-step child took it past the limit. A timeout names no step — compare runtime
with the last green run before hunting a locator. `MOB.991` was split (its record-adding children
are `MOB.988`); measure a suite's runtime after adding to it.

**Every step polls until its timeout; an untimed one until Datadog's 60s default.** A positive
assertion never needs a blind `wait` in front of it — only absence checks do (trap 21).

Runtime ≈ explicit `wait` seconds + ~1s per step.
- Replace blind waits with a `timeout` on the next **positive** assertion — except a wait before
  `assertPageLacks`, before `goToUrl`, and `av_list_gate`'s 25s (two absence checks depend on it).
- Tests that wait 20s on `/work` to warm the lookup cache have no positive readiness signal —
  leave those waits.
- `work_list_gate` costs ~23s and warms a per-session cache — gate on the first leg only.
- Screenshots are on for every step; keep them on assertions.
- Independent read-only suites can run in parallel (`dd_tools.run` takes several names); never
  the mutating ones (trap 1).
- A red `verify.py` run bills **3**: Datadog retries the scratch once.
- Measure locally first: `local_timing.py` times every suite for 0 runs (#31). Local seconds are an
  estimate — compare with the last Datadog runtime before restructuring a suite.
- The same test takes ~1.2–2× as long on Datadog as locally (short tests show the biggest ratio) —
  scale a local suite time up before comparing it with the ceiling.
