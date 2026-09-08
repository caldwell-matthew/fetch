# Mobile App — Test Plan

> **What is LEFT to do.** State, not stories. A row records what is covered and what blocks it;
> it does not accumulate run logs, dates, or the history of how a test was debugged.
>
> 🛑 **ONE FACT, ONE HOME.** This file grew to 2,363 lines because the same fact was written in
> three places and then drifted apart. Before adding anything, check it belongs here:
>
> | information | its one home |
> |---|---|
> | what is left to do, and the state of each item | **this file** — a row, one line |
> | what a green run actually proves | `coverage.md` |
> | how to write a test without repeating a known mistake | `test_authoring.md` (the 28 traps) |
> | product defects the tests found | `bugs_found.md` |
> | **why a specific test is built the way it is** | **its `build_*.py` docstring** |
>
> ➡️ **Test-design rationale goes in the generator, not here.** It sits next to the code,
> `check_drift.py` keeps it honest, and it cannot drift from a row nobody re-read. If you find
> yourself writing a paragraph about a test in this file, it belongs in `build_<that>.py`.

> **Legend** — `[x]` automated · `[~]` partial · `[ ]` not yet · `[-]` not automatable in
> Synthetics. Row tags: `· residue` leaves data behind · `· self-restoring` puts itself back.
> **(trap N)** refers to `test_authoring.md`.

## Codebase sync

*When this file and the codebase disagree, **the codebase wins** — update the row.*

| | |
|---|---|
| **Serves the tests** | `origin/development` → dev.mentorapm.com. Read source with `git show origin/development:client/mobile/…` or `git archive`, **never the working tree**. ⚠️ `origin/development` is a LOCAL ref — **`git fetch origin development` first**, or you are auditing whenever you last pulled |
| **Last synced** | `39ef2c0ef7` (2026-09-05) |

```bash
cd ~/GitHub/MentorAPM/MentorTwo && git fetch origin development
git log --oneline <LAST-SHA>..origin/development -- client/mobile   # then record the new SHA
```

> 🛑 **Nothing goes red when a feature ships untested**, because the test that would fail does
> not exist. A diff of `client/mobile` is the only thing that catches it. Demonstrated 2026-09-08:
> the app moved 17 commits over 11 days, three tests were broken the whole time, and every
> standing check was green — because they all watched the tests and none watched the app.

> ⚠️ **Session model** (`589f8635ea`): silent refresh is gone — an expired session now
> `redirectToMobileLogin()`s, so a mid-suite expiry bounces the run to the login page and every
> later step fails on a locator that is simply absent. `SESSION_SUBSCRIPTION` (`Auth.tsx`) also
> redirects on a `LOGOUT` event from **anywhere**, so logging the test account out kills an
> in-flight suite.
>
> ⚠️ **Watch every diff for new `sessionStorage` writes** — a suite shares one browser session,
> so anything persisted is inherited by every later child. Known: the two map toggles, the
> scheduled-view toggle, `asset_lookup_query`, `asset_lookup_proximity_radius`, and the column
> picker's `selectedColumns` (`localStorage`, so it outlives the session).

## Coverage at a glance

| | |
|---|---|
| Tests | **102 leaf tests · 13 suites** · 2685 steps · 92 subtest slots (+ `MOB.999_Verify_Scratch`, a harness, not coverage) |
| Local ↔ remote | **116 local · 118 remote · in sync**, verified by content 2026-09-08. The 2 extras are archived orphans `MOB.134` / `MOB.711` |
| Device | `chrome.tablet` **only** — load-bearing, trap 1 |
| Step flags | 201 `optional` · 358 `alwaysExecute` · 390 `assertFromJavascript` |
| Rows | 130 `[x]` · 11 `[~]` · 49 `[-]` · 7 open — 197 rows. ⚠️ Counts describe *this file*, not the app |
| Cost of one full pass | **~117 billed runs** — a subtest bills as its own run. Budget before proposing a re-run of everything |
| Scheduling | **Manual only — SETTLED. Do not propose scheduling.** |

### Suites — children, and what they leave behind

| suite | children | class |
|---|---|---|
| `MOB.985_WorkDetail` | 8 | read-only |
| `MOB.986_WorkOrders_Extra` | 11 | residue (`MOB.396`/`397`) |
| `MOB.987_EventReadings` | 1 | residue |
| `MOB.989_FieldEdit` | 3 | self-restoring |
| `MOB.990_Smoke` | 13 | read-only |
| `MOB.991_WorkOrders` | 13 | residue · **at the runtime ceiling** (Appendix F0) |
| `MOB.992_Menu` | 7 | read-only |
| `MOB.993_AssetVerify` | 12 | self-restoring |
| `MOB.994_Collector` | 5 | residue (`MOB.600` only) |
| `MOB.995_AssetLookup` | 7 | read-only |
| `MOB.996_Search` | 7 | read-only |
| `MOB.997_Session` | 2 | self-restoring · ⚠️ **never run concurrently** — mutates session crew |
| `MOB.998_MaterialLookup` | 3 | residue (`MOB.870` only) |

**Standalone:** `MOB.000_Login` · `MOB.200_Crew_Switch` (mutates) · `MOB.440_Logout` (ends the
session) · `MOB.974`–`MOB.979` diagnostics (delete each once its question is settled).

⭐ **`verify.py <test>` costs 2 billed runs instead of a suite's 6–15.** Iterate with it, then
run the real suite ONCE — a fresh session is a *harsher* environment than a suite, not merely a
different one (`MOB.730` proved this).

## 📊 RUN STATUS — what is actually PROVEN

*The authority on this question. A green suite means "passed when last run", and runs are manual.*

*Last session: 2026-09-08. Local ↔ remote **verified in sync by content** at the end of it, so
everything below is deployed — the only open question is whether it passes.*

| suite | current build | note |
|---|---|---|
| `MOB.990_Smoke` | ✅ **13/13** · 193s | ⭐ green after `MOB.346` was removed; `MOB.171`, `MOB.910`, `MOB.900` all executed and passed |
| `MOB.995_AssetLookup` | ✅ 7/7 · 268s | also clears `MOB.720` |
| `MOB.985_WorkDetail` | ✅ 8/8 · 478s | clears `MOB.356`/`347`/`348` |
| `MOB.987_EventReadings` | ✅ 36/36 · 112s | `MOB.550` sound — see its row |
| `MOB.974_DIAG_Geolocation` | ✅ standalone | |
| `MOB.994_Collector` | 🟡 **children fixed, suite unconfirmed** | `MOB.621` ✅ and `MOB.622` ✅ 49/49 (its first ever pass). `MOB.600` patched the same way but **its run was interrupted** — ⏳ **start here next session: `MOB.994`, 6 runs** |
| `MOB.986` `MOB.991` `MOB.992` `MOB.993` `MOB.996` `MOB.997` `MOB.998` `MOB.989` | ❌ not run | stale ≥ 3 weeks |
| `MOB.346_Work_Scheduled_View` | 🛑 **cannot pass** | standalone now; its subject is unreachable — see 🟡 BLOCKED |

**Never executed at all** — live, statically verified only: `MOB.976` · `MOB.358`.
*(`MOB.622` and `MOB.900` came off this list on 09-08.)*

**Next session, in order** — ~25 runs, not the ~117 a full pass costs:
`MOB.994` (6, confirm the `MOB.600` patch) → `MOB.991` (14, the largest untested area) →
`MOB.998` (4) → `MOB.976` (1).

> ⭐ **Use `verify.py <test>` (2 runs) to DIAGNOSE, and the suite only to CONFIRM.**
> 2026-09-08 cost ~95 runs, most of it re-running `MOB.990` (15) and `MOB.994` (6) three times
> each to chase single-child failures. The scratch path exists precisely for that and was
> reached for too late. A failing child costs 2 runs to iterate on, not 15.

### What 2026-09-08 found — four defects no standing check could see

*Kept short on purpose; each one's mechanics live in its generator docstring.*

1. **Radius rename** (`25 miles` → `25 mi`) broke `MOB.730`/`MOB.731`/`MOB.974`, and turned one
   `MOB.730` step **vacuous** — green forever, provable by nothing. → `check_literals.py`.
2. **`MOB.346`'s fixture gate was critical**, so its failure **aborted `MOB.990`** and reported
   `MOB.171` + `MOB.910` red **without executing them**. One problem read as three, for three
   runs. → `dd_tools.step(soft=)`, and the gate rule in 🟡 BLOCKED.
3. **`AddPhotoOptions` moved `close()` into `onDialogChange`** (a real app bug-fix: closing early
   destroyed the `<input>` the upload needs). Three tests clicked an X that no longer exists by
   then — `MOB.600`/`MOB.621`/`MOB.622`. They now assert the picker **closes itself**, which is
   the stronger claim. ⚠️ `MOB.620` was correctly untouched: it never uploads, so its picker
   stays open.
4. **`MOB.622`'s `//*[normalize-space(.)="…"]`** matched a button *and* its inner span → "Multiple
   elements found" (trap 3). Scoped to `mantine-Menu-item`.

⚠️ **`check_drift`, `audit_assertions`, `check_literals` and the citation check were ALL clean
while 1–4 were live.** Every one of them watches the tests; only a run, or the codebase diff,
watches the app.

## ▶ OPEN WORK — the only "what's next" section

**🟢 BUILDABLE 10 · 🟡 BLOCKED 8 · ⚪ NOT A GAP 14 · 🔴 HARNESS 19**

### 🟢 BUILDABLE — ranked by yield

| # | item | why |
|---|---|---|
| **5** | ⭐⭐ **`ESTIMATES` on all four charge tabs** | **Largest gap in the plan, and it had never been named.** Every charge tab is `SegmentedControl data={['CHARGES','ESTIMATES']}` (`ui/WorkChargeLayout.tsx:17`, plus `MaterialCharges.tsx:113`); `MOB.350`/`360`/`370`/`380`/`356` see one side only. Different data (`*Estimates`), and material estimates group by storeroom. Read-only, no fixture, no residue |
| **6** | ⭐ **`PhotoMenu`'s action set** | `MOB.622` proves the gear renders; nothing opens it on a **saved** photo. `Set as Avatar` · `Rotate Image` · `Get Description` across 3 parent types. `Rotate Image` is the strongest available test: real mutation, proof is the changed `?t=` URL, self-restoring every 4 clicks. `Delete Photo` is trap 2 |
| **7** | **Asset Lookup's `Photos`/`Docs`/`Attributes` tabs** | Opened by no test on any of the 8 `AssetLookupDetails` call sites. `MOB.700` defers to `MOB.520`, but `MOB.520` walks the AV accordion and stops at `Work History`. Three clicks on a panel `MOB.700` already has open |
| **4** | **A crash guard — `Something went wrong.` must NOT appear** | Cheapest item, improves every other test. `ErrorBoundary` wraps the app and is never exercised; when it trips, later steps fail on locators that are simply absent. Copy `MOB.900`'s shape into the shared login prefix |
| **8** | **`AssetReadingTimeline`'s popover** | Now fetches on open (`Timeline.tsx:53`) with three states: `Loading history...`, `No readings recorded.`, offline. An exclusive-or over the three cannot go vacuous |
| **9** | **Material Lookup `Photos`/`Docs` + row avatar modal** | Shipped 09-01; no test knows it exists. First `MaterialItem` use of `PhotoAttachments`. 🛑 No image filter here, so an upload really lands — start read-only |
| **1** | **`MultiValueSelector`'s `enum` + `record` branches** | `MOB.806` covers 1 of 3. ⏳ Gated on `MOB.976` — field types are runtime server schema; **do not guess a field name** (trap 15) |
| **2** | **Work-order `InsertForm` photos** | The third derived `buttonText`. `addImages` writes local state, so read-only until submit |
| **3** | **`Copy to asset`** (`WorkStageAttachments.tsx:150`) | Needs a work stage that already has a photo, and copying **writes** |
| **10** | **A `Created`-status guard on the work ring** | `WORK_STATUS_OPTIONS` gained `Created`; `StatusSummary`'s `statusMap` did not, so such a stage inflates `total` and shows in no segment. Product bug; ⏳ needs a `Created` stage |

> 🔬 **Find the next ones with the RENDERED-STRING sweep, not the attribute sweep.** Attributes
> (`placeholder=`/`aria-label=`) gave 75 strings / 35 unmatched; JSX text children gave **392 /
> 243** and yielded #5–#10. ⚠️ Exclude `__jest__` **by path** — `grep -rh` prints no filename, so
> a `| grep -v __jest__` filters nothing. Script: `🔧 MAINTENANCE` check 6.

### 🟡 BLOCKED — decisions and fixtures, not work

| item | needs | kind |
|---|---|---|
| **`MOB.346_Work_Scheduled_View`** | 🛑 **SETTLED 2026-09-08: `mobileDownloadMode` stays `ASSIGNED`** so the crew keeps its work orders (a `SCHEDULED` role only sees stages with a `scheduledevent` within ±7 days — §25 rule 4, which empties the list every other work test needs). **The scheduled view is therefore unreachable and this test cannot pass.** ✅ Acted on: **removed from `MOB.990`** and kept standalone, so it no longer aborts the smoke suite. It stays correct for a `SCHEDULED` org. ➡️ **Put it back the day the role changes AND its work orders are scheduled** — both, or the work-list tests break instead | **settled** |
| Verify status update (job list) | a **per-run desktop reset** — see `test_authoring.md` → the desktop cleanup chore. Unlocks this and all four Appendix A rows | **decision** |
| `MOB.357`'s non-zero path | a form template with a **required field**; every card reads `0 of 0` | **fixture** |
| `MOB.342` exclusion leg | a second status in the crew's list. ⭐ May already be unblocked — `Pending` now counts on mobile (`db98d77d63`); read the legend before asking | **fixture** |
| Session/JWT expiry | **backend** — HTTP GraphQL authenticates with a same-origin cookie; a client cannot expire it | **backend** |
| **AT** — attachment types beyond PNG | ⏸️ **deferred by the owner, do not re-raise.** One hand-authored upload step per file type (trap 12 is per-FILE) | **fixture** |
| Trial-mode tile disabling | a **trial org** | **fixture** |
| §26 characterization test | owner decision | **decision** |

### ⚪ NOT A GAP

`CopyAttributesConfirmation` (dead) · material transfers / issue-return / reorder (**controls do
not exist**) · Switch-Crews close button (`withCloseButton: false`) · status-change form triggers
(desktop → Appendix B) · the status-notes modal (deliberate; enabling it reworks `MOB.320`) ·
`typeId` (dead in mobile; the AV path is broken — §26) · adding an *existing* asset to a job
(Appendix A) · logout clearing queues (the obvious test asserts something false) · status badge
colour (`MOB.342` covers it via `getComputedStyle`) · Failures/Condition placeholders (`Tank 0000`
has both) · form FILLING (`MOB.134`, archived — the RENDER half is `MOB.355`) · real device GPS ·
`UploadStatusIcon` (Expo only) · forcing `ErrorBoundary` to trip (poisons the shared session).

### 🔴 HARNESS — needs a different tool

Offline queue (5) · uploads **transport only** (3: tus resume, unauthorized retry,
`UploadStatusIcon`) · camera / barcode (4) · map canvas drawing (4) · native shell · viewport (2).

> ⚠️ **The queue is the highest-risk surface in the app and is untested in BOTH harnesses**
> (§30). `graphql/links/` has 7 source files and 2 tested; **`QueueLink`, `PersistedQueueLink`,
> `SerializeLink` and `ErrorLink` have no tests anywhere** — 339 lines. `workers/` has none.
> **The fix is a Jest test, not a Datadog one**, and it costs no Synthetics credits.

### 🔧 MAINTENANCE — six standing checks, none costs a run

| # | check | command |
|---|---|---|
| 1 | generator vs JSON (trap 19) | `check_drift.py` — clean except the known `MOB.200` role guard |
| 2 | local vs remote **by content** (step names + subtest ids, not test names) | a name-only check once reported "nothing unpushed" while `MOB.996`'s children were all `PENDING-WIRE-UP` |
| 3 | latest result per suite, and **which build it ran against** | 📊 RUN STATUS |
| 4 | every test cited exists, and every test that exists is cited | clean 09-08 |
| 5 | **stale-literal scan** — every asserted literal still exists in the app | `check_literals.py` · `--self-test` after ANY rule change |
| 6 | **rendered-string sweep** — UI text that appears in no test | see 🔬 above |

⚠️ **Checks 1–4 were all clean while three tests were broken.** They watch the tests; 5 and 6
watch the app. `check_literals.py` has a `--self-test` because its first two versions reported the
known-broken suite **clean** — a tool nobody has exercised is not a working tool.

**Other hygiene:**
- **Tag hygiene** — 44 of 102 leaves carry no `read-only` tag. Mechanical, but touch generator
  **and** JSON together or the next `DD_FORCE=1` reverts it (trap 19).
- 🧹 **Desktop cleanup script** — ⏳ in definition: `cleanup_spec.md`, 6 open questions. Nothing
  prunes residue today. 🛑 It deletes real records on a shared box — dry-run first.
- **Delete settled diagnostics**: `MOB.977` · `MOB.979` · `MOB.975` · `MOB.974` · `MOB.976`.
  Keep `MOB.978` while the work-list fixture is in flux.
- 🔎 **`audit_assertions.py` triage — 131 suspects** (0 HIGH · 15 MED · 116 LOW): 92 `NO-TIMEOUT`
  (untimed assertion after a click — trap 21; fix in **batches with a run between**) · 13
  `VACUOUS-ABSENCE` · 15 `NAME-MISMATCH` · 11 `TAUTOLOGY`. ⚠️ It cannot see an assertion the APP
  turned vacuous — only check 5 catches that.
- 🗑 **Delete the archived orphans on Datadog**: `MOB.134`, `MOB.711`. Confirm with the owner.

# Tier 1 — Mobile-specific risks

## T1.1 Offline & the transaction queue

- [-] Mutate while offline → operation queues rather than failing
- [-] Reconnect → queue drains in order (`SerializeLink`)
- [-] Queue survives an app reload while offline (`PersistedQueueLink`)
- [-] Pending-transaction count increments/decrements correctly
- [~] `OFFLINE_FEATURE_MESSAGE` appears on connection-dependent controls when offline ✅ **The offline STATE is reachable** — `MOB.910_Offline_UI`,, which
- [~] Offline notice does **not** appear while online *(MOB.900)* ✅ **Strengthened.** It was two steps — navigate, then a lone `assertPageLacks` — which is
- [-] **`ConnectionRequired` — Asset Lookup's whole-screen offline block.** *No row until.* `AssetLookup/index.tsx:156` is `if (!window.navigator.onLine)
- [-] **`useWorkAssignmentSubscription` — live work assignment push.** *No row until; never mentioned anywhere in this file.* `Layout/Auth.tsx:20`
- [x] Transaction Log lists entries *(MOB.131)* — it has to **make** a mutation first: the log reads `gql_log`, a localforage store in the browser, and
- [x] **Transaction Log search** *(MOB.132, in `MOB.993`)* — the last untested `SearchInput` in mobile
- [-] Logout clears pending queues — **not observable, and the obvious test would assert something false.** Logout calls `clearPersistedTransactionQueues`

## T1.2 Uploads & attachments

- [x] Attach a file — **`MOB.600`** creates an asset with a real photo attached, 23/23 green
- [x] **`MOB.621`** a photo reaches the carousel without submitting — and the
- [x] **`MOB.741`** work-stage attachments: the Photos/Docs panel, and an
- [ ] 🟢 **What happens to a photo AFTER it is attached — `PhotoMenu`'s action set** *(BUILDABLE #6, added 09-08)*. ⚠️ **`coverage.md` says `MOB.994`
- [-] Upload status icon reflects in-flight uploads — **not reachable from a browser.** `TopHeader/index.tsx` renders it as `{!!window.ReactNativeWebView
- [-] Upload resumes after interruption (tus)
- [-] Unauthorized upload retries after token refresh
- [-] Capture from camera (photo/video/HEIC) — 🛑 the three capture buttons open a **native file dialog** Datadog cannot dismiss; asserted, never clicked
- [~] **AT** — all attachment types

## T1.3 Session, auth & crew

- [x] Login via `/login/sso` environment picker *(MOB.000)*
- [x] Switch crew and revert, Admin → Operator → Admin *(MOB.200)*
- [x] Crew switcher opens and dismisses without mutating *(MOB.430)*
- [x] Log out, including the "Take Me Back" escape hatch *(MOB.440)*
- [-] Session/JWT expiry — signed 60-day `mobileToken`; needs a backend-issued short-lived token. (Hard to test and corrupting tests *invalid* token
- [x] Role permissions gate menu items *(MOB.210)* — switches to `Admin (0000)` (CRUD all off) and asserts `Work Orders` **vanishes** from the menu, then
- [x] Crew switch actually changes the visible work/mobile-job set *(MOB.220)* — uses `Admin (0100)` (**read on**) so the list still loads; that isolates

## T1.4 Responsive / viewport

- [x] Tablet width (`chrome.tablet`) — all tests
- [-] Crew shortcut visible ≥450px / hidden below *(needs that read-only phone test; Bug §3 is currently unexercised)*
- [-] Sticky search row and affixed create button remain reachable at phone width *(same blocker)*

## T1.5 Service worker & app updates

- [x] **Service worker registers** *(MOB.470)*
- [-] ~~Update prompt appears and applies~~ — ⚪ **THERE IS NO UPDATE PROMPT
- [-] Stale cache does not survive an update — the LOGIC exists (`sw.js` activate deletes every `apm-mobile-*` cache except the current `CACHE_NAME`), but

## T1.6 Geolocation

- [x] Geolocate populates address/lat/long — **BOTH halves covered.** `ProximityMenu` is `MOB.731` (in `MOB.995`)
- [-] Geolocate disabled/messaged when offline — **now the most promising of the three.** `GeolocateButton.tsx:101` renders a `Popover` containing
- [-] Real device GPS behavior — **the only genuinely unreachable row of the three**, and it stays that way: a stub proves the app's handling of a

## T1.7 Native shell bridge

- [-] Haptics · native upload · anything gated on `window.ReactNativeWebView` — Expo shell only

# Tier 2 — Module functionality

## T2.1 Work Orders

### Create — entry points

- [x] From Work Order module *(MOB.300)* — affixed `+` → workflow lookup → submit
- [x] From the **Mobile Map** *(MOB.122)* — all four create entry points are now covered
- [x] From a **Mobile Job asset** *(MOB.396)*
- [x] From **Work Orders**: *assign follow-up work* *(MOB.397)*

### Read

- [x] Open a work order and render its detail *(MOB.310)*

### Change status

- [x] Pending · In Progress · On Hold · Complete · Canceled · Ready *(MOB.320)*
- [~] **Requested · Not Completed — offered by the menu, never walked**
- [x] Status notes branch — **confirmed not applicable** to this fixture's template

### ELMO charges

- [x] Add equipment charges *(MOB.350)*
- [x] Add labor charges *(MOB.360)* — needs `laborTypeId` + `qty`; the craft list belongs to the selected user, so it searches `Dev Eloper` explicitly
- [x] Add material charges *(MOB.370)* — uses type **Return**, not Issue: Issue is validated against stock on hand and each one decrements it, so an
- [x] Add other charges *(MOB.380)* — needs `unitPrice`, which the model file does not mark required but the runtime schema does (trap 8)
- [x] **Invalid charge form does NOT submit — all four, one test** *(MOB.356)*
- [ ] 🟢 **The `ESTIMATES` section — on ALL FOUR tabs** *(BUILDABLE #5)*
- [-] `Internet Connection is required to make a material charge` — `MaterialCharges.tsx:106` returns this **instead of the whole tab** when

### Tabs & forms

- [x] Warranties tab *(MOB.399)* — read-only; asserts real warranty content, not the empty state
- [x] Detail tabs render and switch *(MOB.330)* — template-agnostic, against Mantine `role="tab"` / `data-active`
- [x] Add condition score *(MOB.390)* — cascades asset → inspection group → inspection element
- [x] Add failure *(MOB.391)* — each lookup is fed by the **previous** selection: `repairTypes`/`rootCauseTypes` come from the chosen *failure type*, not a
- [x] Add job note *(MOB.392)* — Instructions is a **tiptap rich text editor**; the test types into `//div[@contenteditable="true"]`, which Datadog drives
- [x] Add form *(MOB.393)* — **one-shot, will now fail** until the fixture is cleaned from desktop (trap 10)
- [-] Fill out an inserted form — **NOT AUTOMATABLE**
- [x] **`FormMetrics` — the form-completion readout** *(MOB.357, in `MOB.985`)*
- [x] **Assets tab and its status controls** *(MOB.347, in `MOB.985`)*. *Never listed as an item until, though partly exercised.*
- [x] Permits tab *(MOB.394)* — read-only
- [~] Assign work stage *(MOB.398)* — **deliberately partial.** Opens the crew modal, proves the form renders, cancels
- [x] General Info tab — edit a field *(MOB.395)* — **SELF-RESTORING**: writes `DD SYNTHETIC EDIT <runid>` to `desc`, then writes `DATADOG FIXTURE` back
- [-] **Status-change FORM TRIGGERS, and they are NOT MOBILE BEHAVIOUR.**

### `requireStatusNotes` — the one real, uncovered branch here

- [-] **The status-notes modal — DELIBERATELY NOT COVERED** (repo owner)
- [-] Change status: permit — negative test · approve permit — **Permits are READ-ONLY data in mobile** (repo owner)
- [-] Submit form with signature widget — freehand canvas
- [x] **SB** — search bar *(MOB.340 opens it; **MOB.343** proves it filters)* — MOB.340 asserts the box holds a term and the Sort Criteria modal

### Work list

- [x] **Map view toggle** *(MOB.341)* — `WorkOrders/index.tsx:223` renders `ToggleMapViewButton`
- [x] **Status ring + legend** *(MOB.342)* — the analogue of `MOB.560` on the job list
- [x] **Search filters the list** *(MOB.343)* — see the SB row above
- [x] **Tapping a row opens its work order** *(MOB.344)* — the actual user path, which every other work-order test skips by deep-linking
- [x] **SCHEDULED WORK — a whole third view of this screen** *(MOB.346, in `MOB.990`)*
- [x] **`WO_SCHEDULED_SORT` — the scheduled view's own sort mode** *(MOB.346, read-only leg)*
- [x] **Work order record cycling** *(MOB.349, in `MOB.985`)*
- [x] **`MapLink` on the work order title** *(MOB.348, in `MOB.985`)* — a globe menu with **View in Map** and **Edit Location**; the latter opens
- [x] **The warranty alert banner** *(MOB.399)*
- [x] **Sort applies and persists, AND the ordering really reverses** *(MOB.345, in `MOB.986`)*

## T2.2 Asset Verification

### Verification behavior

- [x] Verify asset *(MOB.510)*
- [x] Verified asset displays on **Verified** tab *(MOB.510)*
- [x] Asset list counter increments on verify *(MOB.510)*
- [x] Unverify asset — counter decrements *(MOB.510)*
- [x] Unverified asset displays on **Unverified** tab *(MOB.500)*
- [x] Verified tab is empty at rest *(MOB.500)*
- [x] Verified asset does **not** display on **Unverified** tab *(MOB.590)* — **self-restoring**, and the restore legs are `alwaysExecute` so a failed
- [ ] Verify status update (job list) — blocked by the same one-way status problem

### Status filters, sort, cards

- [x] Status filter: Ready / Canceled / Completed / In Progress *(MOB.530)* — the fixture is `IN_PROGRESS`, so selecting `Ready` must **hide** it; that
- [x] Filter: All / Verified / Unverified *(MOB.500)*
- [x] **Asset card caret expand AND collapse** *(MOB.520)*
- [x] Sort: open / dismiss *(MOB.530)* **and the ordering really holds** *(MOB.535, in `MOB.996`)*
- [ ] Status badge color — *assert the label; color is not expressible*
- [x] Asset list left / right arrow navigation *(MOB.570)* — forward, **wrap-around** (2 assets, so forward twice returns to the start), and back

### Add assets

- [-] Add a **new** asset to a verification job — `NewAssetForm` (`Job.tsx:13`, as `NewAssetButton`). Appendix A
- [-] Add an **existing** asset to a verification job. Appendix A

### Map view

- [x] **Map view toggle** on the job asset list *(MOB.585)* — `Job.tsx:212` renders the same `ToggleMapViewButton` as the work list, and `:230` swaps the
- [-] **Asset markers carry verification state** — `JobAssetMap` colours each marker `verified ? 'green' : 'blue'` and only plots assets that have **both**

### Asset data tabs

- [x] All five tabs render and switch *(MOB.520)* — asserts the strip and each tab's `data-active`, not panel contents: what a panel shows depends on the
- [x] General Info — edit a field *(MOB.710)* — the per-field pencil, covered once for all three entry points (see the note below)
- [x] Failures — form opens on the asset detail *(MOB.575)* — READ-ONLY by design: MOB.391 already proves this form mutates, so this covers the new part
- [x] Condition — form opens on the asset detail *(MOB.575)* — same shape as Failures above: MOB.390 proves the mutation, this proves the entry point and
- [x] Attributes — edit *(MOB.545)* — **on the full-page asset detail, not the expanded row.** Edits `Year Of Manufacture` (a *string* attribute holding
- [x] Event Readings — capture *(MOB.550)*  · residue
- [~] Attachments — **AT**

### Counts & cross-platform

- [x] Mobile job count · statuses · asset count *(MOB.560)*
- [x] Total count matches pie chart *(MOB.560)* — the ring's arcs are not assertable, so it checks the **legend** and the per-card arithmetic (`X out of Y`
- [-] Change all statuses · verify all assets — one-way to `COMPLETED` (§10), consumes the fixture
- [x] **Asset search INSIDE a job** *(MOB.531, in `MOB.993`)* — `Job.tsx`'s `Find Asset(s)` box, a `SearchInput` nothing was proving
- [x] **SB** — search bar *(MOB.530)* — **the only place the SB block is actually proven.** Typing the fixture's own name matches; appending junk makes it
- [x] Mobile job search: status filter Ready, type name, verify results *(MOB.530)*

## T2.3 Collector / Lens

- [x] Create asset — minimum fields, no photo *(MOB.600)* — name + desc + type `Actuator Tools`
- [x] Create asset **with a photo** *(MOB.600)*
- [x] Add a photo without submitting *(MOB.621)* — `ADD_PHOTO` dispatches to a **local reducer** (`Form/index.tsx:162-165`); the attachment is created by
- [x] Collector asset search — `Find Asset(s)` *(MOB.610)*
- [x] The add-photo **picker** *(MOB.620)* — first coverage this component ever had
- [x] **The carousel's DISPLAY surface, at ONE photo and at TWO** *(MOB.622)*
- [x] Edit asset — edit fields *(MOB.710)* — the Collector's asset details renders `AssetLookupDetails` (`Details.tsx`), the same component and the same
- [-] **The `/asset-collector/:assetId` route** — ⚪ **NOT A GAP: an ORPHAN ROUTE.** Listed as 🟢 BUILDABLE on and **withdrawn the same day, before a test
- [-] Create asset with multiple attachments: Condition (3+) · Thermal (3+) · Nameplate (2) · Custom (2) · HEIC (2) · Video (1) — **no longer blocked, now
- [~] **AT** — all attachment types — **reopened**, see the `AT` block in Reusable Blocks

## T2.4 Asset Lookup

- [x] Alphanumeric lookup *(MOB.700)* — searches `Pump 0102`; server-side `CONTAINS`, so trap 11 does not apply here
- [x] Asset card caret *(MOB.700)* — expands the first result
- [x] Tabs render *(MOB.700)* — asserts the strip mounts and that **Work History** exists
- [ ] 🟢 **`Photos` · `Docs` · `Attributes` — opened by NO test** *(BUILDABLE #7)*. 🛑 **A coverage claim that does not hold, corrected 2026-09-08.**
- [ ] 🟢 **`Get Description` (MentorLens) on the Photos tab** — `index.tsx:148` prepends a **fourth** `PhotoMenu` item that exists only on this call site
- [-] **Tag Lookup / Scan Barcode** — one control, not two
- [x] **`View in Map` on an expanded row** *(MOB.735, in `MOB.995`)*
- [x] **The `Work History` tab's contents — `WorkLookupDetails`** *(MOB.740, in `MOB.995`)*
- [x] **The work-stage ATTACHMENT panel, and the image filter** *(MOB.741, in `MOB.995`)*

### The `typeId` edit branch, not as expected

- [-] **`CopyAttributesConfirmation` is DEAD CODE from mobile.** Nothing to click: `index.tsx:45-49` sets `allowUpdate: false` on `typeId`, and
- [-] **Editing Asset Type on the AV detail is BROKEN — `bugs_found.md` §26.** That screen uses a different component (`AssetGeneralInfo` →
- [x] **"Near Me" proximity search** *(MOB.730, in `MOB.995`)* — *NEW FEATURE, landed* (`21e388b5b7`, `AssetLookup/ProximityMenu.tsx`)
- [x] **"Near Me" — the LOCATION half** *(MOB.731)* — the half `MOB.730` could not reach, unlocked by `MOB.974` measuring that `navigator.geolocation`'s
- [x] **The `Readings` tab — the sixth tab** *(MOB.720)*

## T2.5 Material Lookup

- [x] Storeroom dropdown *(MOB.850)* — picking `Central Storeroom` loads its item list
- [x] Material search *(MOB.850)* — matched pair: `Adamantium` shows the fixture item, a non-matching term hides it
- [x] Cycle count *(MOB.860)* — `+1` then `-1` on `000-000-000 Adamantium`, reason `Error Correction`, so the item's quantity nets to zero change
- [ ] 🟢 **`Photos` / `Docs` tabs and the row avatar modal** *(BUILDABLE #9)* — shipped 2026-09-01, no coverage
- [-] **Material issue / return** — *not on this screen.* These are work-order material charges and `MOB.370` already covers them
- [-] **Transfers** — **this control does not exist** (zero matches across `client/mobile`)
- [-] **Reorder notifications** — **this control does not exist** (same)
- [x] Stocking *(MOB.870)*  · residue

## T2.6 The Map

- [x] Change map style · map layers *(MOB.121)* — the style button carries its state in `data-tooltip-content`, flipping `Satellite`↔`Street`, so clicking
- [~] Zoom in/out *(MOB.121)* — `[~]` on purpose: Mapbox does not publish the zoom level to the DOM, so this proves only that the controls exist and
- [x] Search (the geocoder) *(MOB.122)* — typing an address returns suggestions and picking one flies the map and opens its popup
- [x] Create a work order from the map *(MOB.122)*
- [-] Add asset to work order — **the popup is DOM, but reaching it is not.** `ChangeAssetPopup` ("Attach one or more assets to this work stage") only
- [-] Create asset: lasso · marker · line · polygon
- [-] Create work order: lasso · marker · line · polygon
- [-] Get directions · get street view — leave the app

## T2.7 Home screen

- [x] **Welcome banner** *(MOB.180)* — asserts `Welcome,`, then in JS that the greeting is **not** `Welcome, Friend!` and the org line is **not** `- No
- [x] **The six module tiles** render, and the `Work Orders` tile navigates *(MOB.180)* — six element checks plus a JS count, so a tile lost to a
- [x] **Tile permission gating** *(MOB.210)* — under `Admin (0000)` every tile must vanish
- [x] **`No valid permissions` empty state** *(MOB.210)* — the positive half of that proof
- [x] **Asset Lookup tile hidden when offline** *(MOB.910)* — gated on `permissions.asset.read && online`
- [-] **Trial-mode tile disabling** — `window.__mentorapm.isTrial` disables every tile except Asset Collector. Needs a trial org

# Tier 3 — Navigation & chrome

## T3.1 Routes

- [x] Mobile App / login landing *(MOB.000)*
- [x] **`/` — the Home route** *(MOB.180)*
- [x] Collector / Lens *(MOB.160)* · Asset Lookup *(MOB.100)* · Material Lookup *(MOB.110)*
- [-] **`/asset-collector/:assetId`** — ⚪ **NOT A GAP: an ORPHAN ROUTE.** Added to this list (it was missing entirely), then reclassified the same day
- [x] Work Orders *(MOB.150)* · The Map *(MOB.120)* · Transaction Log *(MOB.130)*
- [x] Dev Logs *(MOB.170)* — menu item hidden unless env is `development`/`development2`
- [x] **Dev Logs page contents** *(MOB.171, in `MOB.990`)*  · self-restoring
- [x] `/work/:workStageId/form/:formId` — **COVERED AT RENDER LEVEL** *(MOB.355, in `MOB.985`)*. ~~The last route in mobile with no passing test.~~
- [-] **FILLING a work form — not automatable from Synthetics.** by measurement, after five attempts and five distinct causes
- [x] Mobile Jobs / Asset Verification *(MOB.140)* — page title asserted, and the **"Find Mobile Job(s)" check is now CRITICAL** (30s polling), verified

## T3.2 Hamburger menu

- [x] Open / close *(MOB.400)*
- [x] ReSync from menu *(MOB.410)*
- [x] Transaction Log via menu *(MOB.420)*
- [x] Switch Crews *(MOB.200, MOB.430)*
- [x] Switch Crews — Cancel *(MOB.430)*
- [x] Log Out · confirm · Take Me Back *(MOB.440)*
- [~] Timestamp resync *(MOB.460)* — `[~]` on purpose: **resync leaves no durable observable difference.** Proves the control renders with its timestamp
- [x] **Toggle Work Order List / Scheduled View** *(MOB.346)* — *unlisted until.* `TopHeader/index.tsx:131` renders a menu item whose label **flips**
- [x] **Asset Lookup menu item hidden when offline** *(MOB.910)* — *unlisted until now.* `TopHeader` drops the item on `!permissions || !online`
- [-] Switch Crews — Close button — does not exist (`withCloseButton: false`); dismissal is Cancel or click-outside

### Header status icons

- [x] **Version string** *(MOB.470)* — `Version: ` + `window.__mentorapm.shortVersion`
- [x] **`NetworkStatusIcon`** *(MOB.470 + MOB.910)* — **both halves covered as of.** `MOB.470` has the online half: `wifi` present **and** `wifi-slash`
- [~] **`TransactionStatus` pending count** *(MOB.470)* — `[~]` on purpose
- [-] **`UploadStatusIcon`** — Expo shell only, see T1.2
- [x] **The crew shortcut `<span class="mobile-crew">`** *(MOB.470)* — opens the same `RoleSelection` modal as the menu item, which `MOB.430` only ever

## T3.3 Global

- [x] Back arrow *(MOB.450)* — builds real history (`/work` → `/asset-lookup`) then goes back, so the assertion is that we landed on the **specific**
- [~] **SB** — search bar — proven on the mobile job list *(MOB.530)*; the other five modules still rely on that one instance
- [x] Search vs. filter interaction *(MOB.820)*
- [x] `StructuredQuery` filter builder *(MOB.800)* — `name contains` shows the asset as a **result row**, a non-matching value hides it, and clearing
- [x] **Editing an existing filter** *(MOB.805, in `MOB.996`)* — the branch `MOB.800` never reaches
- [x] **The multi-value branch of the value input** *(MOB.806, in `MOB.996`)* — picking operator **`includes`** swaps `#value` for `MultiValueSelector`
- [x] Offline geolocate branch *(MOB.911, in `MOB.985`)*
# Reusable blocks

## SB — Standard search bar

*✅ All items resolved — sort **ordering** closed by MOB.580.*

*Referenced by 6 modules. **Collapsed from v1**, which enumerated every sort permutation per
module (~70 items) for low defect yield. Build once as a subtest, reference everywhere.*

- [x] Click search bar · type term · verify results *(MOB.530)*
- [x] Open **Sort By** dropdown, close modal *(MOB.340, MOB.530)*
- [x] Sort options, once *(MOB.810)* — picks `Created At ▲`, proves it persists across a
      route change and back, then switches to `Created At ▼`. NB the inherited labels were
      wrong: `SortDropdown` renders `${column.label} ▲` / `▼`, not "Ascending"/"Descending".
      Columns are per-module — WorkStage uses createdAt · status · _workSequence ·
      priority · targetDueDate
- [x] Sort **ordering** *(MOB.580)* — the rows really do
      come out in the chosen order. `A/C Motor 0002` precedes `Tank 0000` ascending and the
      order **reverses** descending. Compares POSITIONS and requires both assets to be found
      first, so it cannot pass on an empty or half-rendered list — *the first row is X* would
      pass when the second row is missing

> **The selected sort label is not page text.** Mantine's `Select` renders it as an
> `<input>` *value* — a DOM property, invisible to `assertPageContains`, which cost a run.
> `MOB.810` reads the source of truth instead, with a `Run JavaScript` assertion against
> `sessionStorage['mobile-MobileJob-sort']` (`SortDropdown.tsx:80` writes it as
> `JSON.stringify({id, column, dir, label})`). Unlike `uploadFiles`, JS assertion steps
> **are** generatable from our pipeline — their params are just `{"code": ...}` with no
> `bucketKey`, so trap 12 does not apply to them. Use `jsassert` in `dd_tools.py`.

## AT — All attachment types

*🟡 **REOPENED** — this block was closed as backend-blocked; both blockers are gone.*

> **Now ordinary work, not a blocker** (trap 12). The remaining cost is a **fixture** one:
> Datadog holds exactly one uploadable file, and **trap 12 applies per FILE** — each new type
> needs one hand-authored step before `upload_steps()` can copy it.
>
> 🛑 **Mind the residue per type.** The image path is only free where a client-side filter rejects
> it (`MOB.741`); an upload that *succeeds* writes a permanent attachment.

- [x] Photo — `MOB.600` (attached to a created asset) · `MOB.621` (into the carousel, unsent)
- [x] ⭐ Image **rejected** by the Docs-tab filter — `MOB.741`, a real upload with zero residue
- [-] Video · HEIC · Document · Nameplate · Custom — **needs one hand-authored step per type**
      (trap 12), then `upload_steps(source=…)` copies it. Fixture ask, not a blocker.
- [-] Multiple attachments at once — the inputs are `multiple`, but Datadog's step carries the
      one file it was authored with
- [-] Any capture-from-camera path — 🛑 still 🔴 HARNESS: a **native dialog** Datadog cannot
      dismiss (`MOB.620` asserts the three buttons and never clicks them)

---

---

# Appendix A — Deliberately not covered

*Decisions, not gaps. Recorded so they are not silently re-litigated, and kept out of the
open count so "open" means remaining work.*

| Item | Why not |
|---|---|
| **Add Work** from Asset Lookup (T2.4) | Creates a permanent work order and opens the same `WorkInsertForm` MOB.300 already covers. The only new behavior is the asset arriving as `defaultAsset` |
| **Add new asset** to a verification job (T2.2) | Non-revertible; permanently grows the fixture job and breaks the `out of 2` assertions MOB.500/510 depend on |
| **Add existing asset** to a verification job (T2.2) | Same |
| **Verify all assets** (T2.2) | Flips the job to `COMPLETED`, and the status can never be moved back (`bugs_found.md` §10). Consumes the fixture permanently |

⚠️ **These need a PER-RUN desktop reset, not a one-time throwaway fixture.** Verifying a job's
last asset flips it to `COMPLETED`, and mobile can never walk that back (§10) — so each run
consumes a job. Desktop *can* reset the status
(`work/mobileJob/details/index.tsx:75`), and the asset flags restore themselves, so the cost is
a recurring chore rather than an unbounded supply of jobs. **That is a decision about ongoing
upkeep, not a fixture build** — see 🟡 BLOCKED.

# Appendix B — Out of scope: needs a desktop harness

*Real coverage gaps, but not for a mobile Datadog suite. Listed so that "is this tested?"
has an honest answer — no, and here is where it belongs.*

| Item | From | Belongs in |
|---|---|---|
| Verify status update on desktop | T2.2 | desktop suite |
| Verify asset(s) update on Web | T2.2 | desktop suite |
| Verify mobile job status update on Web | T2.2 | desktop suite |
| Add mobile job on desktop → mobile list updates | T2.2 | cross-platform test |
| Asset Verification Job Template | T3.1 | `admin/mobilejobtemplate` — desktop page |
| Mobile Work Template | T3.1 | `admin/work-template` — desktop page |

The Mobile/Tablet halves of the "Web / Mobile / Tablet" items are **not** simply extra
`device_ids` — that is trap 1, and it would race the mutating suites.

# Appendix C — Not automatable in Synthetics

Marked `[-]` throughout. These need Playwright/Cypress or manual testing — they are not
"not yet".

| Area | Why |
|---|---|
| Offline **QUEUE** behaviour (T1.1) | `graphql/index.tsx:68` reads `navigator.onLine`, which a dispatched event does not change — so requests still go out and the queue cannot be exercised. ⚠️ **Jest does not cover it either**: `QueueLink`, `PersistedQueueLink`, `SerializeLink` and `ErrorLink` have **no tests anywhere**. Highest-risk surface in the app, unprotected in both harnesses — and the cheapest fix is a **Jest** test, not a Synthetics one |
| ~~Offline **UI**~~ | ✅ **NO LONGER TRUE — corrected and COVERED** by `MOB.910_Offline_UI` (green in `MOB.990`). Row kept struck-through, not deleted, because the reasoning that made it wrong is the lesson. See the note below Appendix C |
| Upload resume / tus retry (T1.2) | Requires interrupting a transfer |
| Camera capture (T1.2, T2.3, T2.4) | Requires device camera; tag scan also calls OpenAI |
| ~~Browser-originated attachments (T2.3)~~ | ✅ **NO LONGER TRUE — FIXED and COVERED.** `bugs_found.md` §14 (the server rolled back and threw `Unable to create attachments`) is resolved: `MOB.600` runs **23/23 green with a real `uploadFiles` step**, and `MOB.621`/`MOB.741` cover two more upload surfaces. Row kept struck-through rather than deleted — a blocker that was recorded twice and turned out to be false in both places is the lesson. See **T1.2** |
| Native shell bridge (T1.7) | Only active inside the Expo shell |
| Map **canvas interactions** (T2.6) | anything needing a tap on a rendered feature — the drawing tools, and `ChangeAssetPopup` (add asset to work stage). Features are hit-tested via `queryRenderedFeatures(event.point)` and have no DOM element. **The map itself IS reachable** — WebGL, canvas, geocoder, style/layers/zoom controls all work (probe + MOB.121/122) |
| Signature widget (T2.1) | Freehand canvas |
| Directions / street view (T2.6) | Navigate out of the app |
| Color assertions | Assert the label instead — though `getComputedStyle` reaches it from JS, which is how `MOB.342` proves status colour |

> ## 🔄 "NOT AUTOMATABLE" IS A CLAIM ABOUT THE HARNESS — AND IT AGES BADLY
>
> **The technique.** The app does not read the network; it reads `useNetwork` from
> `@mantine/hooks`, which is a `useWindowEvent("offline", …)`. So a `Run JavaScript` step can
> `window.dispatchEvent(new Event('offline'))` and flip every offline branch. Shipped as
> `MOB.910_Offline_UI`.
>
> ⚠️ **The limit matters as much as the unlock.** `navigator.onLine` stays **true**, so requests
> still go out. This proves *the UI reacts*; it can **never** prove the transaction queue queues,
> drains, or survives a reload. 🛑 **Do not let a green offline test be read as queue coverage.**
>
> **The general rule, from three cases** (offline · the map · geolocation — each inherited as
> unreachable, each reachable): before trusting a *not automatable* row, ask **what the app
> actually READS**. It is usually a JS-reachable observable (`useNetwork`,
> `navigator.geolocation`, `queryRenderedFeatures`) rather than the physical thing the row names.
>
> ⚠️ **The counter-rule**: the reflex is not free. `MOB.974` run 1's own click step was wrong,
> produced five red rows that read exactly like a finding, and cost a run. **Hold the probe to
> the same standard as a test.**

# Appendix D — Open questions

**Only 2 are still open.** Ask the repo owner — these are questions *for them*, not puzzles to
engineer around. Q7 sat open for days while tests were built to route around it; asking took
one sentence.

| # | Question | Blocks |
|---|---|---|
| **1** | Should `MOB.140`'s "Find Mobile Job(s)" check be **critical**? Only if the test crew always has ≥1 mobile job. | one `optional` step that can currently skip silently |
| ~~2~~ | ~~How often should **mutating suites** run?~~ **CLOSED** — runs are manual, so this is answered by whoever triggers one. Each run of `991`/`994`/`986`/`987`/`998` still leaves undeletable records, so trigger them deliberately rather than out of habit. Not a scheduling question. | — |

# Appendix F — making the suite faster

## F0 · Datadog's MAXIMUM TEST EXECUTION TIME is a hard ceiling

*It changes suite ARCHITECTURE, not just suite speed.*

`MOB.991` ran green at **474s** with 13 children. Adding one 70-step child took it to
**1071s**, where it died with `Maximum test execution time reached`.

- **A suite is not an unbounded container.** Past the ceiling it stops reporting anything, and
  the failure names **no step** — so it reads like an infra blip, not a budget problem.
  ⚠️ **A timeout does not name a step: check runtime against the last green run before hunting
  a locator.**
- **`MOB.991` is at its ceiling.** New work-order coverage goes in a NEW suite — which is why
  `MOB.985_WorkDetail` exists. Small suites also parallelise (item 3 below).
- **Readiness gates are the expensive part, and they multiply.** `work_list_gate` costs ~23s;
  `MOB.134` called it once per leg for ~70s that bought nothing, because **the cache it warms
  is per browser SESSION** and a suite is one session. Gate on the first leg only.

*In progress. Every number below is measured, not estimated.*

Runtime ≈ **explicit `wait` seconds + ~1s per step**. Today the suite holds **2505s of waits
across 1823 steps**, with the bulk still concentrated in waits of ≥10s —
that concentration is why the long waits are the whole game. **354** polling gates are in
place so far.

> **This is no longer only a cost question — see F0.** A suite that grows past Datadog's
> maximum execution time stops reporting at all, so wait-trimming is what buys headroom for
> new coverage. The cheapest win is not trimming individual waits but **not repeating a
> readiness gate within one session**: `MOB.134` spent ~70s calling `work_list_gate` three
> times for a cache that is warmed once per browser session.

**1. Replace blind waits with a step `timeout`. ✅ LARGELY DONE.**

| | before | after |
|---|---|---|
| `MOB.996_Search` | 327s | **273s** |
| `MOB.986_WorkOrders_Extra` | 281s | **252s** |
| suite-wide waits | 1975s | **1832s** *; now **2300s** as twelve tests landed after the pass — the reduction held, the total did not. Do not read this row as regression)* |
| polling gates | 54 | **82** |

Steps genuinely poll — a guard with `timeout=60` was measured polling **58.2s** before
failing. Both `step(..., timeout=N)` and `jsassert(..., timeout=N)` take it.

*Method:* reduce each wait to a small settle floor (2–5s) and put a generous `timeout` on the
following **positive** assertion.

> ⚠️ **Three shapes must NOT be converted.** A mechanical pass breaks all three:
> - a wait before **`assertPageLacks`** — a *lacks* assertion is true BEFORE the thing appears
>   as well as after it goes, so the wait is what gives it meaning;
> - a wait before **`goToUrl`** — nothing to gate on; usually "let the mutation land";
> - **`av_list_gate`'s 25s** — two `assertPageLacks` checks depend on that elapsed time.

> **The largest remaining pool is NOT convertible, and that is a finding rather than a gap.**
> Thirteen tests each wait **20s** on `/work` to warm the lookup cache — **260s**, the single
> biggest block left. There is no positive readiness signal to gate on: the work list's four
> indicators are all *negative* (`assertPageLacks` on a loading label is true before loading
> starts, the trap that produced the empty-asset-list failure), and the only per-row "ready"
> signal is `bg={loading ? 'gray.1' : 'white'}` — a colour, which this suite has already
> established is not assertable. **Leave those waits alone.**

*Still convertible:* short waits (2–5s) across the suite, worth little individually.

**2. Turn off screenshots on non-assertion steps.** `no_screenshot` is per-step and `false`
everywhere — `noScreenshot` is still false on **every** step, so
this item is entirely un-started; at ~1s/step that is most of the non-wait cost. **Keep them on
assertions** — screenshots have repeatedly been what diagnosed a failure here.

**3. Run independent suites in parallel.** `dd_tools.run` takes several names and Datadog runs
them concurrently, so a full pass costs the slowest suite rather than the sum. Safe for the
read-only suites only — never the mutating ones (trap 1).

**4. Drop `retry` while developing.** `retry: {count: 1}` re-runs a failing test: right for
scheduled runs, pure cost in a build-fix loop.
