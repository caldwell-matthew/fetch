# Mobile App — Test Plan

> **State, not stories.** A row records what is covered and what blocks it. It does not carry
> run logs, dates, or how a test was debugged. When something ships, flip its box and cite the
> test — nothing else.
>
> | information | its one home |
> |---|---|
> | what is left to do, and the state of each item | **this file** — a row, one line |
> | what a green run actually proves | `coverage.md` |
> | how to write a test without repeating a known mistake | `test_authoring.md` (the 28 traps) |
> | product defects the tests found | `bugs_found.md` |
> | why a specific test is built the way it is | its `build_*.py` docstring |

> **Legend** — `[x]` automated · `[~]` partial · `[ ]` not yet · `[-]` not automatable in
> Synthetics. Row tags: `· residue` leaves data behind · `· self-restoring` puts itself back.
> **(trap N)** refers to `test_authoring.md`.

## Codebase sync

*When this file and the codebase disagree, the codebase wins — update the row.*

| | |
|---|---|
| **Serves the tests** | `origin/development` → dev.mentorapm.com. Read source with `git show origin/development:client/mobile/…`, never the working tree. `origin/development` is a local ref — `git fetch origin development` first |
| **Last synced** | `6822c05baa` (2026-09-09). Last `client/mobile` change: `15c38f7987` (2026-09-08) |
| **Literal scan** | `check_literals` clean against this build (1159 literals, 0 missing) |

```bash
cd ~/GitHub/MentorAPM/MentorTwo && git fetch origin development
git log --oneline <LAST-SHA>..origin/development -- client/mobile   # then record the new SHA
```

Nothing goes red when a feature ships untested, because the test that would fail does not
exist. The `client/mobile` diff is the only check that sees it.

**Session model** (`589f8635ea`): no silent refresh. An expired session redirects to login, so a
mid-suite expiry fails every later step on an absent locator. A `LOGOUT` event from anywhere
also redirects, so logging the test account out kills an in-flight suite.

**Watch every diff for new `sessionStorage` writes** — a suite shares one browser session.
Known keys: the two map toggles, `toggle_mobile_v_work`, `mobile-asset-ver-filter`,
`asset_lookup_query`, `asset_lookup_proximity_radius`, `mobile-<Model>-sort`, `storeroomId`,
`log_level`, and the column picker's `selectedColumns` (`localStorage`, outlives the session).

## Coverage at a glance

| | |
|---|---|
| Tests | **108 leaf tests · 13 suites** · 2899 steps · 97 subtest slots (+ `MOB.999_Verify_Scratch`, a harness, not coverage) |
| Local ↔ remote | 122 local, in sync by content. The 2 remote extras are archived orphans `MOB.134` / `MOB.711` |
| Device | `chrome.tablet` **only** — load-bearing, trap 1 |
| Rows | 117 `[x]` · 13 `[~]` · 10 `[ ]` · 46 `[-]` — 186 rows. Counts describe *this file*, not the app |
| Cost of one full pass | ~117 billed runs — a subtest bills as its own run |
| Scheduling | **Manual only — settled. Do not propose scheduling.** |

### Suites — children, and what they leave behind

| suite | children | class |
|---|---|---|
| `MOB.985_WorkDetail` | 9 | read-only |
| `MOB.986_WorkOrders_Extra` | 11 | residue (`MOB.122`/`396`/`397`) |
| `MOB.987_EventReadings` | 2 | residue (`MOB.550`) |
| `MOB.989_FieldEdit` | 3 | self-restoring |
| `MOB.990_Smoke` | 13 | read-only |
| `MOB.991_WorkOrders` | 13 | residue · **at the runtime ceiling** (Appendix F) |
| `MOB.992_Menu` | 7 | read-only |
| `MOB.993_AssetVerify` | 12 | self-restoring |
| `MOB.994_Collector` | 7 | residue (`MOB.600`, `MOB.623`) |
| `MOB.995_AssetLookup` | 7 | read-only |
| `MOB.996_Search` | 7 | read-only |
| `MOB.997_Session` | 2 | self-restoring · **never run concurrently** — mutates session crew |
| `MOB.998_MaterialLookup` | 5 | residue (`MOB.870` only) |

**Standalone:** `MOB.000_Login` · `MOB.200_Crew_Switch` (mutates) · `MOB.346_Work_Scheduled_View`
(blocked) · `MOB.440_Logout` (ends the session) · `MOB.974`–`MOB.979` diagnostics (delete each
once its question is settled).

### The default loop: prove ONE test — `verify.py <test>` (2 runs)

A suite costs `1 + children`. Proving a single test through the scratch harness costs 2.

**Order for a NEW test — wire it last:** build → `dd_tools.py push` (creates it standalone) →
`verify.py <test>` until green → add to its suite, `wire_suite.py`, push again. Wiring first
makes the suite reference a child with no `public_id`, and Datadog rejects it with a 400.

A solo pass is strong evidence (a fresh session inherits no sort, filter or crew). The reverse
is the risk: passing *inside* a suite because an earlier child left state behind. Run the suite
occasionally as an integration check, not as the way to prove a test works.

## 📊 RUN STATUS — what is actually proven

*A green suite means "passed when last run", and runs are manual. Re-run a stale suite when its
area changes, not on principle.*

| suite | status |
|---|---|
| `MOB.991_WorkOrders` | ✅ 13/13 · current build (`15c38f7987`) |
| `MOB.994_Collector` | 🛑 **will be RED** — `MOB.600` now carries a server proof that fails (bugs §34). 7 children: `MOB.623` ✅ green solo 58/58; `MOB.624` ⏳ built, wired, unverified |
| `MOB.998_MaterialLookup` | ✅ 3/3 · current build · now 5 children: `MOB.855` ✅ and `MOB.865` ✅ green solo, wired, never run inside the suite |
| `MOB.990_Smoke` | ✅ 13/13 · current build |
| `MOB.995_AssetLookup` | ✅ 7/7 · current build |
| `MOB.985_WorkDetail` | ✅ 9/9 · 546s · current build |
| `MOB.974_DIAG_Geolocation` | ✅ standalone · current build |
| `MOB.992_Menu` | ✅ 7/7 · current build |
| `MOB.996_Search` | ❌ red at `MOB.800` (the Filters click was swallowed; same flake as 2026-08-23). `MOB.800` rebuilt with a self-healing drawer gate — ⏳ solo verify pending. The other 6 children were skipped, so they are unproven on the current build |
| `MOB.986_WorkOrders_Extra` | ❌ red at `MOB.396`: `Tank 0000` now has workflows on the dev box, so the app's auto-filter (`InsertForm/index.tsx:51`) hides `Datadog Test`. `MOB.396` rebuilt state-aware (reads each toggle, clicks only the ON ones) — ⏳ solo verify pending. The other 10 children were skipped |
| `MOB.993` `MOB.989` `MOB.997` | ⏳ in flight (run sequentially; `MOB.993` self-restores the AV job) |
| `MOB.987_EventReadings` | ❌ suite not run for ≥ 3 weeks · 2 children; `MOB.551` ✅ green solo, wired |
| `MOB.346_Work_Scheduled_View` | 🛑 cannot pass — see 🟡 BLOCKED |

**Never executed meaningfully** — live, statically verified only: `MOB.358`.

## ▶ OPEN WORK — the only "what's next" section

### 🟢 BUILDABLE — ranked by yield

| # | item | why |
|---|---|---|
| **11** | **AV full-page asset detail — the `Attachments` tab** | `AssetDetails.tsx` renders `SegmentedAssetAttachments` (Photos/Docs segmented control) for an `ATTACHMENTS` section. `MOB.545`/`575`/`550` open Attributes, Failure, Condition and Readings on that page; nothing opens Attachments. ⏳ Whether the fixture job's template has that section is unverified |
| **12** | **Map: `Switch Map` picker** | `ViewSelectButton` opens a `Select a map` modal, disabled unless the org has ≥ 2 maps — an exclusive-or over disabled/opens. Switching writes `mobile-map-id` to sessionStorage; open and dismiss only. 🛑 **Not 2D/3D or Home**: the pitch label reads the `viewport` prop while the click drives the map imperatively, so it never flips (measured — `build_map_tests.py`), and recentering has no DOM trace |
| **4** | **A crash guard in the shared login prefix** | `MOB.900` already asserts `Something went wrong.` is absent; the `ErrorBoundary` is otherwise unexercised and when it trips later steps fail on absent locators. Copy `MOB.900`'s shape into the prefix every suite uses |
| **1** | **`MultiValueSelector`'s `enum` + `record` branches** | `MOB.806` covers the `TagsInput` branch. `MOB.976` proved the `enum` shape is reachable (3 of the first 8 asset-lookup filter fields render a pre-loaded `MultiSelect`) but reports by index, and the field list is runtime server schema — do not target `field[4]` (trap 15). One more probe iteration reporting the selected LABEL unblocks it (`MOB.979`'s `___DUMP___` sentinel is the pattern). `record` still undistinguished |
| **14** | **Collector list sort, incl. `Collected By Me`** | `SortDropDown` on the collector offers createdAt / name / `Collected By Me` (`createdBy`). Only the `MOB.978` probe has touched it. Same shape as `MOB.810` |
| **16** | **`Tag Lookup` menu renders `Scan Barcode` + `Alphanumeric`** | Cheap positive on Asset Lookup. Both actions stay 🔴 HARNESS (scanner / native dialog) |
| **2** | **Work-order `InsertForm` photos** | `Add Work Order Photo` — the third derived `buttonText`. `addImages` writes local state, so read-only until submit |
| **3** | **`Copy to asset`** (`WorkStageAttachments.tsx`) | Needs a work stage that already has a photo, and copying writes |
| **17** | **Work-order `Attributes` tab** | `WorkDetails.tsx` renders `Attributes` with `UPDATE_WORKSTAGE_ATTRIBUTE` for an `ATTRIBUTES` section; only asset attributes (`MOB.545`) are tested. ⏳ Whether the fixture template has the section is unverified — `MOB.330` walks tabs by index, not name |
| **10** | **A `Created`-status guard on the work ring** | `StatusMenuIcon` hides `Created` from the menu, but `StatusSummary`'s `statusMap` lacks it, so a `Created` stage inflates `total` and shows in no segment. Product bug; ⏳ needs a `Created` stage |

Find the next ones with the rendered-string sweep (🔧 MAINTENANCE check 6), not the attribute
sweep. Exclude `__jest__` **by path** — `grep -rh` prints no filename, so `| grep -v __jest__`
filters nothing.

### 🟡 BLOCKED — decisions and fixtures, not work

| item | needs | kind |
|---|---|---|
| **`MOB.346_Work_Scheduled_View`** | **Settled: `mobileDownloadMode` stays `ASSIGNED`** so the crew keeps its work orders (a `SCHEDULED` role only sees stages with a `scheduledevent` within ±7 days — `bugs_found.md` §25 rule 4). The scheduled view, `WO_SCHEDULED_SORT` and the `ScheduleTimeline` modal are therefore unreachable. Removed from `MOB.990`; stays standalone and correct for a `SCHEDULED` org. Put it back only when the role changes **and** its work orders are scheduled | settled |
| Verify status update (job list) | a **per-run fixture reset** — designed in `cleanup_spec.md` §7 (a local GraphQL script; five tests unlocked; three owner decisions listed there). Bugs §10 is NOT fixed on `origin/development`, so the reset is still required | decision |
| `MOB.357`'s non-zero path | a form template with a **required field**; every card reads `0 of 0` | fixture |
| `MOB.342` exclusion leg | a second status in the crew's list. `Pending` now counts on mobile (`db98d77d63`) — read the legend before asking | fixture |
| Session/JWT expiry | backend — HTTP GraphQL authenticates with a same-origin cookie; a client cannot expire it | backend |
| **AT** — attachment types beyond PNG | ⏸️ deferred by the owner, do not re-raise. One hand-authored upload step per file type (trap 12 is per file) | fixture |
| Trial-mode tile disabling | a trial org | fixture |
| §26 characterization test | owner decision | decision |

### ⚪ NOT A GAP

`CopyAttributesConfirmation` (dead: `typeId` is `allowUpdate: false`) · material transfers /
issue-return / reorder (controls do not exist) · Switch-Crews close button
(`withCloseButton: false`) · status-change form triggers (desktop → Appendix B) · the
status-notes modal (deliberate; enabling it reworks `MOB.320`) · `typeId` on the AV detail
(broken — §26) · adding an *existing* asset to a job (Appendix A) · logout clearing queues (the
obvious test asserts something false) · status badge colour (`MOB.342` covers it via
`getComputedStyle`) · Failures/Condition placeholders (`Tank 0000` has both) · form FILLING
(`MOB.134`, archived — the render half is `MOB.355`) · real device GPS · `UploadStatusIcon`
(Expo only) · forcing `ErrorBoundary` to trip (poisons the shared session) ·
`/asset-collector/:assetId` (orphan route — nothing navigates to it) · Transaction Log column
sort (`onSort` is `console.log`).

### 🔴 HARNESS — needs a different tool

Offline queue (5) · uploads **transport only** (3: tus resume, unauthorized retry,
`UploadStatusIcon`) · camera / barcode (4) · map canvas drawing (4) · native shell · viewport
(2) · the phone-width form branch (`FormDetails.tsx` picks the desktop form at
`screen.availWidth >= 750`, which `chrome.tablet` always satisfies, so `MobileSignatureField`
and `#senor-work-form` never render on the only device the suite runs — trap 1).

**The queue is the highest-risk surface in the app and is untested in both harnesses** (§30).
`QueueLink`, `PersistedQueueLink`, `SerializeLink` and `ErrorLink` have no tests anywhere; the
fix is a Jest test, not a Datadog one, and costs no Synthetics credits.

⏳ **Unmeasured probe candidate:** `graphql/index.tsx` and `AssetLookup/index.tsx` read
`window.navigator.onLine` directly. A `Run JavaScript` step defining an own `onLine` getter on
the `navigator` instance would shadow the prototype getter for the page. If it works it reaches
`ConnectionRequired` and the queue's `onLine` branch; if not, nothing is lost. A probe, not a
claim.

### 🔧 MAINTENANCE — eight standing checks, none costs a run

| # | check | command |
|---|---|---|
| 1 | generator vs JSON (trap 19) | `check_drift.py` — clean except the known `MOB.200` role guard (24 → 27 steps) |
| 2 | local vs remote **by content** (step names + subtest ids, not test names) | a name-only check once reported "nothing unpushed" while `MOB.996`'s children were all `PENDING-WIRE-UP` |
| 3 | latest result per suite, and which build it ran against | 📊 RUN STATUS |
| 4 | every test cited exists, and every test that exists is cited | clean (`MOB.134`/`MOB.711` are cited as archived orphans on purpose) |
| 5 | **stale-literal scan** — every asserted literal still exists in the app | `check_literals.py` · `--self-test` after any rule change. Scans page/element values, XPath text predicates, `assertFromJavascript` strings and attribute predicates (`@aria-label`/`@placeholder`/`@title`/`@name`). `@data-icon` is excluded on purpose — FontAwesome derives it (trap 14). Composed strings (`25 mi`, `100 km`) are listed, not judged: read them against `utils/distance` when the list changes. ⚠️ **Blind spot**: a paraphrase whose every word exists somewhere passes as COMPOSED — `MOB.551` shipped `Internet Connection is required for this feature.` for a constant that reads `This feature requires an internet connection.` and the scan was clean. Copy constants verbatim from `constants.ts` |
| 6 | **rendered-string sweep** — UI text that appears in no test | JSX text children, not attributes; see 🟢 above |
| 7 | **`assertFromJavascript` bodies, run on the bench** | `node check_js_assertions.js` — extracts the JS from the built JSON and runs it in jsdom against a DOM modelled on the component's own source. Every assertion needs a must-fail case (trap 5). Covers `MOB.351`, `MOB.623`, `MOB.865`, `MOB.855`, `MOB.551`, `MOB.624`. Blind spot: it proves the JS is right *about the structure it was told about*; re-read the component after any dependency bump (trap 25). When a library's DOM decides an assertion, read the library in `node_modules`, then run the bench — not Datadog |
| 8 | **bugs index vs the served code** — every `FIXED` row's named source fact re-checked against `origin/development` | `git show origin/development:<file>` per row. Added after 15 of 17 checkable `FIXED 2026-08-24` rows turned out not to be on the served branch (2026-09-09). A row that says fixed and is not makes a test look wrong when the app is |

Checks 1–4 watch the tests; 5, 6 and 8 watch the app. All four of 1–4 were clean while three tests
were broken by an app change.

**Other hygiene:**
- **Tag hygiene** — 44 of 108 leaves carry no `read-only` tag. Touch generator **and** JSON
  together or the next `DD_FORCE=1` reverts it (trap 19).
- 🧹 **Desktop cleanup script** — in definition: `cleanup_spec.md`, one open question (4.5).
  Nothing prunes residue today. It deletes real records on a shared box — dry-run first.
- **Delete settled diagnostics**: `MOB.974` · `MOB.975` · `MOB.977` · `MOB.979`. Keep `MOB.976`
  until it reports field labels (🟢 #1) and `MOB.978` while the work-list fixture is in flux.
- **`audit_assertions.py` triage — 131 suspects** (0 HIGH · 15 MED · 116 LOW): 92 `NO-TIMEOUT`
  (trap 21; fix in batches with a run between) · 13 `VACUOUS-ABSENCE` · 15 `NAME-MISMATCH` ·
  11 `TAUTOLOGY`. It cannot see an assertion the APP turned vacuous — only check 5 catches that.
- 🗑 **Delete the archived orphans on Datadog**: `MOB.134`, `MOB.711`. Confirm with the owner.

# Tier 1 — Mobile-specific risks

## T1.1 Offline & the transaction queue

- [-] Mutate while offline → operation queues rather than failing
- [-] Reconnect → queue drains in order (`SerializeLink`)
- [-] Queue survives an app reload while offline (`PersistedQueueLink`)
- [-] Pending-transaction count increments/decrements correctly
- [~] `OFFLINE_FEATURE_MESSAGE` on connection-dependent controls when offline *(MOB.910 reaches the offline state via a dispatched `offline` event; the header icon, Home tile and menu item flip. The per-control popovers are not asserted)*
- [x] Offline notice does **not** appear while online *(MOB.900)* — paired with a positive control so it cannot pass on a blank page
- [-] `ConnectionRequired` — Asset Lookup's whole-screen offline block reads `window.navigator.onLine`, which an event does not change (see the probe candidate in 🔴 HARNESS)
- [-] `useWorkAssignmentSubscription` — live work assignment push (`Layout/Auth.tsx`); needs a server-side event
- [x] Transaction Log lists entries *(MOB.131)* — makes a verify/unverify mutation first, because the log reads `gql_log` (localforage) and a fresh session has nothing to list
- [x] Transaction Log search *(MOB.132, in `MOB.993`)* — filters to zero and restores the same row count
- [-] Logout clears pending queues — not observable; the obvious test asserts something false

## T1.2 Uploads & attachments

- [~] Attach a file *(MOB.600)* — 🛑 the collect never reaches the server when a photo is attached (bugs §34); red until fixed
- [x] A photo reaches the carousel without submitting *(MOB.621)* — local reducer, discarded unsent
- [x] Work-stage attachments panel and its image filter *(MOB.741)* — an image uploaded through `Add File` is rejected with a toast, zero residue
- [x] Add a photo to an EXISTING asset through the panel's `Add Photo` *(MOB.623)* · residue — polls for the `blob:` preview to become a server URL
- [x] `PhotoMenu` on a saved photo *(MOB.623)* — the five-item set asserted exactly and in order; `Rotate Image` driven ×4 with the src read back (self-restoring at 360°)
- [~] `Set as Avatar` · `Get Description` · `Delete Photo` — asserted present *(MOB.623)*, never clicked (write / AI route / trap 2)
- [-] Upload status icon reflects in-flight uploads — Expo shell only (`window.ReactNativeWebView`)
- [-] Upload resumes after interruption (tus)
- [-] Unauthorized upload retries after token refresh
- [-] Capture from camera (photo/video/HEIC) — the three capture buttons open a native file dialog Datadog cannot dismiss; asserted, never clicked *(MOB.620)*
- [~] **AT** — all attachment types (Reusable blocks)

## T1.3 Session, auth & crew

- [x] Login via `/login/sso` environment picker *(MOB.000)*
- [x] Switch crew and revert, Admin → Operator → Admin *(MOB.200)*
- [x] Crew switcher opens and dismisses without mutating *(MOB.430)*
- [x] Log out, including the "Take Me Back" escape hatch *(MOB.440)*
- [-] Session/JWT expiry — signed 60-day `mobileToken`; needs a backend-issued short-lived token
- [x] Role permissions gate menu items *(MOB.210)* — `Admin (0000)` hides `Work Orders` and every tile; restores to `Admin`
- [x] Crew switch changes the visible work/mobile-job set *(MOB.220)* — `Admin (0100)` keeps read so the list still loads

## T1.4 Responsive / viewport

- [x] Tablet width (`chrome.tablet`) — all tests
- [-] Crew shortcut visible ≥450px / hidden below — needs a phone-width read-only test (trap 1; bugs §3 is unexercised)
- [-] Sticky search row and affixed create button reachable at phone width — same blocker

## T1.5 Service worker & app updates

- [x] Service worker registers and controls the page *(MOB.470)*
- [-] Update prompt — there is no update prompt in the app (bugs §31: a deploy takes over silently)
- [-] Stale cache does not survive an update — `sw.js` activate deletes every `apm-mobile-*` cache except `CACHE_NAME`; needs two builds to observe

## T1.6 Geolocation

- [x] Geolocate populates address/lat/long — `ProximityMenu` *(MOB.731)* and the work-asset form *(MOB.358)*
- [x] Geolocate messaged when offline *(MOB.911, in `MOB.985`)* — `GeolocateButton`'s popover
- [-] Real device GPS behaviour — a stub proves the app's handling of a result, never the device

## T1.7 Native shell bridge

- [-] Haptics · native upload · anything gated on `window.ReactNativeWebView` — Expo shell only

# Tier 2 — Module functionality

## T2.1 Work Orders

### Create — entry points

- [x] From the Work Order module *(MOB.300)* — affixed `+` → workflow lookup → submit
- [x] From the Mobile Map *(MOB.122)* — geocoder popup → `Add Work`
- [x] From a Mobile Job asset *(MOB.396)*
- [x] Assign follow-up work *(MOB.397)*
- [ ] Photos on the insert form — 🟢 #2

### Read

- [x] Open a work order and render its detail *(MOB.310)*

### Change status

- [x] Pending · In Progress · On Hold · Complete · Canceled · Ready *(MOB.320)*
- [~] Requested · Not Completed — offered by the menu, never walked
- [x] Status notes branch — not applicable to this fixture's template (`requireStatusNotes` off)
- [-] The status-notes modal — deliberately not covered (repo owner)

### ELMO charges

- [x] Equipment *(MOB.350)* · labor *(MOB.360)* · material *(MOB.370, type Return so stock is not decremented)* · other *(MOB.380, `unitPrice` required at runtime — trap 8)*
- [x] Invalid charge form does NOT submit — all four *(MOB.356)*
- [x] The `ESTIMATES` section on all four tabs *(MOB.351)* — pins `{section === 'CHARGES' && InsertForm}` in both directions; reports whether the fixture has estimate cards (it has none) without that deciding pass/fail
- [-] `Internet Connection is required to make a material charge` — `MaterialCharges.tsx` reads `navigator.onLine`

### Tabs & forms

- [x] Detail tabs render and switch *(MOB.330)* — by index against `role="tab"` / `data-active`
- [x] General Info — edit a field *(MOB.395)* · self-restoring (`DATADOG FIXTURE`)
- [ ] Attributes tab — 🟢 #17
- [x] Assets tab and its status controls *(MOB.347)* — `Mark as …` asserted, never clicked
- [x] Attachments *(MOB.741)*
- [ ] `Copy to asset` — 🟢 #3
- [x] Add failure *(MOB.391)* — each lookup is fed by the previous selection
- [x] Add condition score *(MOB.390)* — asset → inspection group → element
- [x] Add form *(MOB.393)* — one-shot until the fixture is cleaned from desktop (bugs §4c)
- [x] Form render *(MOB.355)* — `/work/:id/form/:id`, desktop form branch on tablet
- [-] Fill out an inserted form — not automatable (five attempts, five distinct causes; `MOB.134` archived)
- [-] Signature widget — freehand canvas; and the mobile `SignatureField` never renders on `chrome.tablet` (🔴 HARNESS)
- [x] `FormMetrics` *(MOB.357)* — every card reads `0 of 0` until the fixture has a required field
- [x] Permits tab *(MOB.394)* — read-only; permits are read-only data in mobile
- [x] Add job note *(MOB.392)* — tiptap editor, typed into `//div[@contenteditable="true"]`
- [x] Warranties tab and the warranty alert banner *(MOB.399)*
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
- [ ] `Created`-status guard on the ring — 🟢 #10

## T2.2 Asset Verification

### Verification behaviour

- [x] Verify · moves to the Verified tab · counter increments · unverify decrements *(MOB.510)*
- [x] Unverified tab shows the asset; Verified tab empty at rest *(MOB.500)*
- [x] Verified asset does not show on Unverified *(MOB.590)* · self-restoring, restore legs `alwaysExecute`
- [ ] Verify status update (job list) — 🟡 per-run reset decision

### Status filters, sort, cards

- [x] Status filter Ready / Canceled / Completed / In Progress *(MOB.530)* — fixture is `IN_PROGRESS`, so `Ready` must hide it
- [x] Filter All / Verified / Unverified *(MOB.500)*
- [x] Asset card caret expands and collapses *(MOB.520)*
- [x] Sort opens and dismisses *(MOB.530)* · ordering really holds *(MOB.535, MOB.580)*
- [x] Left / right asset cycling with wrap-around *(MOB.570)*
- [-] Status badge colour — assert the label; `MOB.342` shows the `getComputedStyle` route if needed

### Add assets

- [-] Add a new asset to a job — Appendix A
- [-] Add an existing asset to a job — Appendix A

### Map view

- [x] Map view toggle on the job asset list *(MOB.585)*
- [-] Markers carry verification state — `JobAssetMap` colours markers green/blue; canvas, no DOM

### Asset data tabs

- [x] Accordion tabs render and switch — General Info · Attributes · Photos · Docs · Work History *(MOB.520)*; Readings *(MOB.720)*. Asserts `data-active`, not panel contents
- [x] Photos / Docs / Attributes panel content *(MOB.623)* — on the collector call site of the same `AssetLookupDetails`; Photos↔Docs is a biconditional, Attributes an exclusive-or
- [x] General Info — edit a field *(MOB.710)* — the per-field pencil, once for all three entry points
- [x] Failures and Condition forms open on the full-page detail *(MOB.575)* — read-only; the mutations are `MOB.390`/`391`
- [x] Attributes — edit *(MOB.545)* — full-page detail, `Year Of Manufacture`, self-restoring
- [x] Event Readings — capture *(MOB.550)* · residue
- [ ] Full-page detail `Attachments` tab (Photos/Docs segmented) — 🟢 #11
- [~] Attachments — **AT**

### Counts & cross-platform

- [x] Job count · statuses · asset count · legend arithmetic *(MOB.560)*
- [-] Change all statuses · verify all assets — one-way to `COMPLETED` (§10), consumes the fixture
- [x] Asset search inside a job *(MOB.531)*
- [x] **SB** search bar — proven here *(MOB.530)*

## T2.3 Collector / Lens

- [~] Create asset — name + desc + type, with a real photo *(MOB.600)* — 🛑 **RED by design**: the server never receives it (bugs §34); the test now ends with a network-only Asset Lookup search for its own name, which fails until the app is fixed
- [x] Add a photo without submitting *(MOB.621)*
- [x] The add-photo picker *(MOB.620)*
- [x] Carousel display at one photo and at two; fullscreen; tag editor *(MOB.622)*
- [x] Collector search *(MOB.610)*
- [x] Saved-photo menu, `Rotate Image`, and the three attachment panels on a collected asset *(MOB.623)* · residue
- [ ] Collector sort incl. `Collected By Me` — 🟢 #14
- [x] Row avatar modal *(MOB.624)* — opens without expanding the accordion; Photos↔Docs biconditional; closed with `Done`
- [x] Edit asset fields *(MOB.710)* — same `AssetLookupDetails`
- [-] `/asset-collector/:assetId` — orphan route
- [-] Multiple attachments · HEIC · video — **AT**

## T2.4 Asset Lookup

- [x] Alphanumeric lookup *(MOB.700)* — server-side `CONTAINS`, so trap 11 does not apply
- [x] Card caret and tab strip *(MOB.700)*
- [~] `Get Description` (MentorLens) on the Photos tab — present in the menu set *(MOB.623)*; never clicked, it posts the image to the AI route
- [ ] `Tag Lookup` menu renders — 🟢 #16
- [-] Scan Barcode · Alphanumeric capture — scanner / native dialog / OpenAI
- [x] `View in Map` on an expanded row *(MOB.735)* — router state, not a URL
- [x] `Work History` tab contents — `WorkLookupDetails` *(MOB.740)*, also the map's `WorkCard`
- [x] Work-stage attachment panel and image filter *(MOB.741)*
- [x] "Near Me" proximity *(MOB.730)* and its radius *(MOB.731)*
- [x] The `Readings` tab — the sixth tab *(MOB.720)*
- [x] `AssetReadingTimeline` popover *(MOB.551, in `MOB.987`)* — resolved state as an exclusive-or, timeline↔chart biconditional, offline message via a dispatched event
- [-] `CopyAttributesConfirmation` — dead from mobile (`typeId` is `allowUpdate: false`)
- [-] Editing Asset Type on the AV detail — broken, `bugs_found.md` §26

## T2.5 Material Lookup

- [x] Storeroom dropdown *(MOB.850)* — `Central Storeroom` loads its list
- [x] Material search — matched pair *(MOB.850)*
- [x] Cycle count `+1` then `-1`, reason `Error Correction` *(MOB.860)* — self-restoring by construction, not by assertion
- [x] Stocking *(MOB.870)* · residue (+1 per run)
- [x] `Photos` / `Docs` segments and the row avatar image modal *(MOB.865)* — segment set pinned by value; Photos↔Docs biconditional; avatar modal an exclusive-or; nothing uploaded
- [x] Column-header sort really reorders, and `N matches` equals the row count *(MOB.855)* — chevron AND parsed `Qty` order asserted per direction; vacuous-order guard on the fixture
- [-] Issue / return — these are work-order material charges (`MOB.370`)
- [-] Transfers · reorder notifications — controls do not exist

## T2.6 The Map

- [x] Map style · layers panel *(MOB.121)* — style state is `data-tooltip-content` flipping `Satellite`↔`Street`
- [~] Zoom in/out *(MOB.121)* — Mapbox does not publish the zoom level to the DOM; proves the controls exist and the canvas survives
- [ ] `Switch Map` picker — 🟢 #12
- [-] 2D/3D toggle · Home — no DOM trace of the state change (the pitch label never flips)
- [x] Geocoder search → suggestion → fly + popup *(MOB.122)*
- [x] Create a work order from the map *(MOB.122)*
- [x] Feature sheet for an asset, reached by router state *(MOB.735)*
- [-] Add asset to work order — `ChangeAssetPopup` needs a tap on a rendered feature (canvas)
- [-] Create asset / work order by lasso · marker · line · polygon
- [-] Get directions · street view — leave the app

## T2.7 Home screen

- [x] Welcome banner names the user and org, not the fallbacks *(MOB.180)*
- [x] Six module tiles render; the `Work Orders` tile navigates *(MOB.180)*
- [x] Tile permission gating and the `No valid permissions` state *(MOB.210)*
- [x] Asset Lookup tile hidden when offline *(MOB.910)*
- [-] Trial-mode tile disabling — needs a trial org

# Tier 3 — Navigation & chrome

## T3.1 Routes

- [x] Login landing *(MOB.000)* · `/` Home *(MOB.180)*
- [x] Collector *(MOB.160)* · Asset Lookup *(MOB.100)* · Material Lookup *(MOB.110)* · Work Orders *(MOB.150)* · Map *(MOB.120)* · Transaction Log *(MOB.130)*
- [x] Mobile Jobs *(MOB.140)* — page title; `Find Mobile Job(s)` check is critical (Appendix D Q1)
- [x] Dev Logs *(MOB.170)* — item hidden unless env is `development`/`development2`; contents *(MOB.171)* · self-restoring (`log_level`)
- [x] `/work/:workStageId/form/:formId` — render level *(MOB.355)*
- [-] `/asset-collector/:assetId` — orphan route
- [-] Filling a work form — not automatable

## T3.2 Hamburger menu

- [x] Open / close *(MOB.400)* · ReSync *(MOB.410)* · Transaction Log *(MOB.420)*
- [x] Switch Crews *(MOB.200, MOB.430)* · Cancel *(MOB.430)*
- [x] Log Out · confirm · Take Me Back *(MOB.440)*
- [~] Module resync timestamp *(MOB.460)* — resync leaves no durable observable difference; proves the control and its timestamp render
- [x] Toggle Work Order List / Scheduled View *(MOB.346)* — blocked with it; the item exists only for a `SCHEDULED` role
- [x] Asset Lookup item hidden when offline *(MOB.910)*
- [-] Switch Crews close button — does not exist

### Header status icons

- [x] Version string *(MOB.470)* — `Version: ` + a real `shortVersion`
- [x] `NetworkStatusIcon` — online half *(MOB.470)*, offline half *(MOB.910)*
- [~] `TransactionStatus` pending count *(MOB.470)* — only the `!count` branch while online
- [-] `UploadStatusIcon` — Expo only
- [x] The crew shortcut `.mobile-crew` opens `RoleSelection` *(MOB.470)*

## T3.3 Global

- [x] Back arrow lands on the specific previous route *(MOB.450)*
- [~] **SB** — proven on the mobile job list *(MOB.530)*; the other modules rely on that instance
- [x] Search vs. filter interaction *(MOB.820)* — submitting the search box discards active filters (bugs §20)
- [x] `StructuredQuery` filter builder *(MOB.800)* · edit an existing filter *(MOB.805)* · multi-value branch *(MOB.806)*
- [ ] `enum` / `record` multi-value branches — 🟢 #1
- [x] Offline geolocate branch *(MOB.911)*

# Reusable blocks

## SB — Standard search bar

*Referenced by 6 modules. Build once, reference everywhere.*

- [x] Type a term · verify results *(MOB.530)*
- [x] Open Sort By, close the modal *(MOB.340, MOB.530)*
- [x] Sort options persist across a route change and flip *(MOB.810)* — labels are `${column.label} ▲` / `▼`; columns are per-module
- [x] Sort ordering really holds *(MOB.580)* — compares positions and requires both assets found first

The selected sort label is an `<input>` value, invisible to `assertPageContains`. `MOB.810`
reads `sessionStorage['mobile-MobileJob-sort']` instead (`jsassert` in `dd_tools.py`).

## AT — All attachment types

Each new file **type** needs one hand-authored `uploadFiles` step before `upload_steps()` can
copy it (trap 12 is per file). Mind the residue: the image path is only free where a client-side
filter rejects it (`MOB.741`); a successful upload writes a permanent attachment.

- [x] Photo — `MOB.600` (attached) · `MOB.621` (unsent)
- [x] Image rejected by the Docs-tab filter — `MOB.741`
- [-] Video · HEIC · Document · Nameplate · Custom — ⏸️ deferred by the owner
- [-] Multiple attachments at once — Datadog's step carries the one file it was authored with
- [-] Capture from camera — native dialog

# Appendix A — Deliberately not covered

| Item | Why not |
|---|---|
| **Add Work** from Asset Lookup / AV detail | Creates a permanent work order through the same `WorkInsertForm` as `MOB.300`; the only new behaviour is the asset arriving as `defaultAsset` |
| **Add new / existing asset** to a verification job | Permanently grows the fixture job and breaks the `out of 2` assertions `MOB.500`/`510` depend on |
| **Verify all assets** | Flips the job to `COMPLETED`, which mobile can never walk back (§10) |

These need a per-run desktop reset, not a one-time fixture: desktop can reset the status
(`work/mobileJob/details/index.tsx`), and the asset flags restore themselves. That is an upkeep
decision — 🟡 BLOCKED.

# Appendix B — Out of scope: needs a desktop harness

| Item | Belongs in |
|---|---|
| Verify status / asset / mobile-job updates on desktop | desktop suite |
| Add mobile job on desktop → mobile list updates | cross-platform test |
| Asset Verification Job Template · Mobile Work Template | desktop admin pages |

The Mobile/Tablet halves of "Web / Mobile / Tablet" items are not extra `device_ids` — that is
trap 1, and it would race the mutating suites.

# Appendix C — Not automatable in Synthetics

| Area | Why |
|---|---|
| Offline **queue** (T1.1) | `graphql/index.tsx` reads `navigator.onLine`, which a dispatched event does not change. The offline **UI** is covered (`MOB.910`): the app reads `useNetwork`, a window-event hook, so `window.dispatchEvent(new Event('offline'))` flips every UI branch — and never the queue |
| Upload resume / tus retry | requires interrupting a transfer |
| Camera capture · barcode | device camera / native dialog; tag scan also calls OpenAI |
| Native shell bridge | Expo only |
| Map **canvas** interactions | features are hit-tested via `queryRenderedFeatures` and have no DOM element. The map itself is reachable: canvas, geocoder, style/layers/zoom all work |
| Signature widget | freehand canvas |
| Directions / street view | navigate out of the app |
| Colour assertions | assert the label; `getComputedStyle` reaches it from JS where needed |

Before trusting a *not automatable* row, ask what the app actually **reads**. It is usually a
JS-reachable observable (`useNetwork`, `navigator.geolocation`, `queryRenderedFeatures`) rather
than the physical thing the row names. Hold a probe to the same standard as a test — a wrong
click step produces red rows that read exactly like a finding.

# Appendix D — Open questions

| # | Question | Blocks |
|---|---|---|
| **1** | Should `MOB.140`'s "Find Mobile Job(s)" check be critical? Only if the test crew always has ≥1 mobile job | one step that can currently skip silently |

# Appendix F — runtime

**Datadog's maximum test execution time is a hard ceiling.** `MOB.991` ran green at 474s with
13 children; one more 70-step child took it to 1071s and `Maximum test execution time reached`.
A timeout names no step — check runtime against the last green run before hunting a locator.
`MOB.991` is at its ceiling; new work-order coverage goes in `MOB.985`/`MOB.986`.

Runtime ≈ explicit `wait` seconds + ~1s per step. Rules that still apply:

- Replace blind waits with a `timeout` on the following **positive** assertion. Three shapes must
  not be converted: a wait before `assertPageLacks`, a wait before `goToUrl`, and
  `av_list_gate`'s 25s (two `assertPageLacks` checks depend on the elapsed time).
- Thirteen tests each wait 20s on `/work` to warm the lookup cache. There is no positive
  readiness signal (the only per-row one is a colour). Leave those waits alone.
- Readiness gates multiply: `work_list_gate` costs ~23s and warms a per-session cache, so gate
  on the first leg only.
- Screenshots are on for every step. Turning them off on non-assertion steps is unstarted; keep
  them on assertions.
- Independent read-only suites can run in parallel (`dd_tools.run` takes several names). Never
  the mutating ones (trap 1).
- Drop `retry` while developing; `retry: {count: 1}` is pure cost in a build-fix loop — a red `verify.py` run bills **3**, not 2, because Datadog retries the scratch suite once.
