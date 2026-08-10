# Mobile App — Test Plan


> **Legend**
> `[x]` automated and passing · `[~]` partially automated · `[ ]` not yet automated
> `[-]` not automatable in Datadog Synthetics — needs Playwright/Cypress or manual
> Automated items name the test that covers them, e.g. *(MOB.150)*.

---

## Coverage at a glance

| | |
|---|---|
| Tests | 32 live · 370 steps |
| Suites | `MOB.990_Smoke` (read-only) · `MOB.991_WorkOrders` (mutates) · `MOB.992_Menu` (read-only) |
| Standalone | `MOB.000_Login` · `MOB.200_Crew_Switch` (mutates) · `MOB.440_Logout` (ends session) |
| Device | `chrome.tablet` **only** — single device is load-bearing, see below |
| Optional steps | 14 — 8 are deliberate toast demotions (see below); all audited, Appendix B |

**Honest summary:** routes and chrome are well covered, and **Work Orders is now done** —
`MOB.991` passed end to end on 2026-08-10 (13 subtests, 474s): create, read, all six status
transitions, detail tabs, search/sort, all four ELMO charge types, and the Condition /
Failure / Note / Form tabs. Every other module is still navigation only, and the
highest-risk mobile surface (the offline queue) has **zero** coverage and cannot be reached
with Datadog at all.

Three caveats behind that green run, none of which the checkmarks convey on their own:
Assets / Attributes / Attachments are deliberately deferred to Verification & Collector;
Permits, Warranties and filling out an inserted form are TODO pending read-only fixture
data; and `MOB.393` is **one-shot** — it passed once and will fail on every later run until
the fixture is cleaned from desktop.

> ⚠️ **Never add a second device id.** Datadog runs each `device_ids` entry as its own
> **concurrent** browser session, and every mutating test here drives the *same* fixture
> work order — so two devices race on shared server state. Caught when `chrome.tablet`
> failed `MOB.320 → Test status is now "Complete"` while the `chrome.mobile_small` session
> was walking that same work order to a different status. The assertion was right; the
> state moved underneath it. Datadog cannot serialize devices, and cannot bind a different
> fixture per device without duplicating every test.
>
> **It also hid itself.** For several runs one device kept failing at login, so only one
> session actually ran — which read as a clean pass and masked the race entirely. MOB.350–380's
> "four consecutive passes" were really four *single-device* runs. That evidence still
> stands under the tablet-only config (it is the same one-session condition), but it was
> luck, not design, and it is why the race went unnoticed for so long.
>
> `set_device.py` enforces tablet-only and is idempotent; run it after any build script.
> Cost accepted: no phone-width coverage. Layout regressions at 375px will go unseen, and
> the `.mobile-crew` visibility bug (Bug #3) is no longer exercised.

---

## Operational notes — read before adding tests

- **Deep-link to records instead of navigating lists.** `WorkStageDetails` reads its id
  from `useParams()` and queries directly, so `/apm-mobile/work/<id>` needs no list
  traversal, no `loadedAll` wait, and no crew scoping. Work order fixture:
  `EYRpYJ9QYdQ1JFF10JtB0Q`.
- **Nothing in mobile can be deleted.** `DeleteButton` exists but is used nowhere in
  `client/mobile`. Created work orders and collection children accumulate on dev forever
  and must be cleaned from desktop. Created records are tagged `DD SYNTHETIC MOBILE`.
- **Mutating tests must self-restore using *fixed* values.** Datadog can extract a value
  but cannot interpolate it into an XPath, so "put it back how it was" is impossible.
  Working pattern: outbound leg `optional`, return leg `critical`, always landing on a
  known state (`MOB.200` crew, `MOB.320` status).
- **Crew-scoped data is a trap.** `mobileJobsForCrew` and `workStages(crew: '<SESSION>')`
  are both crew-scoped, so anything that switches crews changes what other tests see.
  That is why `MOB.200` is not in any suite.
- **`optional` steps can pass by hitting the WRONG element.** Not theoretical: MOB.320
  carried 12 status-notes steps for a modal that never opens, and the paired
  `//button[normalize-space(.)="Submit"]` matched another Submit on the page and
  clicked it 6 times per run while reporting success. Keep optional steps rare, scope
  their locators tightly, and audit them against a real run's `step_details`.
- **Created work orders are not crew-assigned**, so they never appear in `/work` and
  cannot be reopened from mobile. The creation toast is the only proof.

---

# Tier 1 — Mobile-specific risk

*Absent from the inherited checklist. This is what makes the app mobile rather than a
narrow browser window, and it is where field failures actually come from.*

## T1.1 Offline & the transaction queue

`graphql/links/` implements an offline-first mutation queue: `QueueLink`,
`PersistedQueueLink`, `SerializeLink`, `ErrorLink`. `TopHeader` surfaces it via
`TransactionStatus` (`pendingCount`) and `PendingTransactionLogs`. Logout calls
`clearPersistedTransactionQueues()`.

- [-] Mutate while offline → operation queues rather than failing
- [-] Reconnect → queue drains in order (`SerializeLink`)
- [-] Queue survives an app reload while offline (`PersistedQueueLink`)
- [-] Pending-transaction count increments/decrements correctly
- [-] `OFFLINE_FEATURE_MESSAGE` appears on connection-dependent controls when offline
- [~] Offline notice does **not** appear while online *(MOB.900 — the only reachable half)*
- [ ] Transaction Log lists completed/pending entries *(route reachable via MOB.130/MOB.420; contents unverified)*
- [ ] Logout clears pending queues

**Synthetics has no network-toggle step.** Everything `[-]` above needs Playwright/Cypress.
This is the single biggest gap in the plan and no amount of Datadog work will close it.

## T1.2 Uploads & attachments

`UploadLink`, tus resumable uploads, `TusUnauthorizedRetry`, `uploadManager.enqueue`,
`createThumbnailUpload`, and the `UploadLogs` status icon.

- [ ] Attach a file via `uploadFiles` (supported — 22 uses in the existing corpus)
- [ ] Upload status icon reflects in-flight uploads
- [-] Upload resumes after interruption (tus)
- [-] Unauthorized upload retries after token refresh
- [-] Capture from camera (photo/video/HEIC)
- [ ] **AT** — all attachment types, *by upload* (see Reusable Blocks)

## T1.3 Session, auth & crew

- [x] Login via `/login/sso` environment picker *(MOB.000)*
- [x] Switch crew and revert, Admin → Operator → Admin *(MOB.200)*
- [x] Crew switcher opens and dismisses without mutating *(MOB.430)*
- [x] Log out, including the "Take Me Back" escape hatch *(MOB.440)*
- [ ] Session/JWT expiry behavior — `mobileToken` is signed with a 60-day expiry
- [ ] Role permissions gate menu items (`hidden: !permissions.*.read`)
- [ ] Crew switch actually changes the visible work/mobile-job set

## T1.4 Responsive / viewport

*The inherited checklist has no viewport dimension at all, yet this already produced a
real finding: `.mobile-crew` is `display:none` below 450px, so the crew shortcut is
invisible on phones and only the burger path works.*

- [x] Tablet width (`chrome.tablet`) — all tests
- [ ] **Phone width (`chrome.mobile_small`) — REMOVED, do not simply re-add.** It ran at
      both widths until the parallel-device race above forced a single device. Re-adding
      it to `device_ids` reintroduces the race and will produce confusing, non-reproducible
      failures in the *mutating* tests. If phone width is wanted back, it has to be a
      separate **read-only** test (render/layout assertions only, no mutations) that can
      safely run concurrently — not a second device on `MOB.991`.
- [ ] Crew shortcut visible ≥450px / hidden below *(needs the read-only phone test above;
      Bug #3 is currently unexercised)*
- [ ] Sticky search row and affixed create button remain reachable at phone width
      *(same blocker)*

## T1.5 Service worker & app updates

`workers/sw.js`, plus the `apply-update` control.

- [ ] Service worker registers
- [ ] Update prompt appears and applies
- [ ] Stale cache does not survive an update

## T1.6 Geolocation

`useGeolocation`, `GeolocateButton`, forms `mobile-geolocate` / `mobile-geolocate-offline`.

- [ ] Geolocate populates address/lat/long on the work order form
- [ ] Geolocate disabled/messaged when offline
- [-] Real device GPS behavior

## T1.7 Native shell bridge

`utils/WebviewBridge/ReactNativeBridge` (`haptic`, `window.ReactNativeWebView`).

- [-] Haptics, native upload path, anything gated on `window.ReactNativeWebView` —
      only active inside the native Expo shell, not in a browser test

---

# Tier 2 — Module functionality

## T2.1 Work Orders

*The only module with real CRUD coverage. Uses fixture `EYRpYJ9QYdQ1JFF10JtB0Q`.*

> **Assets, Attributes and Attachments are deliberately NOT covered here.** They overlap
> with Asset Verification / Collector and will be tested there instead, to avoid
> duplicating the same flows against two different fixtures.

### Create — entry points

- [x] From Work Order module *(MOB.300)* — affixed `+` → workflow lookup → submit;
      success asserted by the modal closing, toast check optional
- [ ] From Work Order module *(second variant — entry point TBD)*
- [ ] From Map
- [ ] From Asset Register
- [ ] From Hierarchy

### Read

- [x] Open a work order and render its detail *(MOB.310)*

### Change status

- [x] Pending *(MOB.320)*
- [x] In Progress *(MOB.320)*
- [x] On Hold *(MOB.320)*
- [x] Complete *(MOB.320)*
- [x] Canceled *(MOB.320)*
- [x] Ready *(MOB.320 — always the end state)*
- [x] Status notes branch — **confirmed not applicable** to this fixture's template

*All six covered. MOB.320 walks Pending → In Progress → On Hold → Complete → Canceled →
Ready, verifying the status badge after each transition, and always finishes on Ready so
the fixture is left in a known state. Verified repeatable across consecutive runs.*

### ELMO charges

- [x] Add equipment charges *(MOB.350)*
- [x] Add labor charges *(MOB.360)* — needs `laborTypeId` + `qty`; craft list belongs to
      the selected user, so it searches `Dev Eloper` explicitly
- [x] Add material charges *(MOB.370)* — uses type **Return**, not Issue: Issue is
      validated against stock on hand and each one decrements it, so an Issue-based test
      erodes its own fixture until it fails
- [x] Add other charges *(MOB.380)* — needs `unitPrice`, which the model file does
      not mark required (the runtime schema does)
- [ ] Verify financial transactions / GL distribution → estimate summary → cost summary

*Reaching these lookups requires the fixture to stay assigned to the test crew: the
lookups are `fetchPolicy: 'cache-only'` and are populated only by `prefetchWorkData`,
which `WorkOrders/index.tsx` gates on the crew's own work list. Each test therefore
visits `/work` before deep-linking to the fixture — do not remove that navigation.*

*All four go through `InsertModalButton` → toast `"Item added"`.*

> **Assert the modal closed, never the toast.** Applied to all 8 mutating tests
> (MOB.350–380, MOB.390–393) on 2026-08-10. Two independent problems made toast assertions
> unusable as the critical signal:
> 1. **Transient.** The toast auto-closes and races the assertion — confirmed on a run where
>    the material charge *was* created but `"Item added"` had already disappeared.
> 2. **Ambiguous.** `SubmitButton` is `type={isValid ? 'submit' : 'button'}`, so an invalid
>    form makes the click a **silent no-op** — no submit, no error, no toast (`bugs_found.md`
>    §9). "Clicked, no toast" therefore meant *either* "worked, toast missed" *or* "form
>    invalid, nothing happened" — and the test could not say which. That ambiguity caused
>    several wrong diagnoses, each costing a ~20 min run.
>
> The split fixes both: `assertPageLacks "Submit"` is **critical** (the form unmounts with
> the modal via `{opened && Form(...)}`, so its absence proves the mutation resolved), and
> the toast is **optional**. A still-open modal now means the form was invalid; a closed
> modal with no toast means it was only timing. `Submit` is the collection forms' default
> label — other buttons on the page read `SUBMIT` or `Create Work Order`, so no collision.

> **Rule: never write a delete step into a mobile test.** Deleting from mobile is supported
> only in a few very specific places, and finding a delete code path (e.g. the gear menu in
> `ui/Menu.tsx`) does **not** mean it is available or intended in that area. Do not add one
> unless the repo owner names the exact flow. Every mutating test therefore leaves permanent
> residue on the fixture, which must be cleaned from desktop — that constraint is deliberate,
> not an oversight. *(I briefly concluded the opposite from the code and was corrected; the
> retraction is recorded in `bugs_found.md` §4.)*

> **Every tab's form has its own `id` — and two of them never toast.** There is no shared
> submit button; `//button[@form="work-collection-form"]` only exists on the Notes form.
>
> | Tab | Form id | Success toast |
> |---|---|---|
> | Notes | `work-collection-form` | `Item added` |
> | Condition | `work-condition-form` | **none** |
> | Failures | `work-failure-form` | **none** |
> | Forms | `adhoc-form` | `Form added` |
>
> Condition and Failure call `addToCollection()` directly with `done: closeModal`, and
> `addToCollection` never toasts — only `NewItemForm`'s own `onSubmit` calls
> `toast.success`. So a toast assertion on those two **could never pass**, however correct
> the rest of the test was. Their only success signal is the modal closing, which is
> another reason the durable assertion above is the right default rather than a workaround.

### Tabs & forms

- [x] Detail tabs render and switch *(MOB.330)* — template-agnostic, against
      Mantine `role="tab"` / `data-active`; `keepMounted={false}` means a switch is a
      real panel change, not styling
- [x] Add condition score *(MOB.390 — verified 2026-08-10, 28 steps)* — cascades
      asset → inspection group → inspection element. Field ids do not match labels:
      "Inspection Group" is `assetStandardDetailId`, "Condition Left" is `conditionScore`.
      Submits via `work-condition-form` and emits **no toast** — the modal closing is the
      only success signal. Took six locator revisions; see the two notes below before
      touching it.
- [x] Add failure *(MOB.391 — verified 2026-08-10, 22 steps)* — asset, failure type, repair
      type, root cause type. Each lookup is fed by the **previous** selection:
      `repairTypes` / `rootCauseTypes` come from the chosen *failure type*
      (`getOptions` → `failureType[type]`), not from a global list, so a value that exists
      elsewhere in the app may simply not be offered here. `INSPECT` failed for exactly
      that reason; the working value is **`MISSED`** with root cause **`TIME`**.
- [x] Add job note *(MOB.392 — verified 2026-08-10, 13 steps)* — Instructions is a **tiptap
      rich text editor**, not a plain field, so the test types into the `contenteditable`
      div; `name`/`noteType` arrive prefilled via `defaultValues`. Datadog drives the
      editor fine — `//div[@contenteditable="true"]` is enough, no special handling
- [x] Add form *(MOB.393 — verified 2026-08-10, 14 steps)* — own form id (`adhoc-form`) and
      own toast text ("Form added", not "Item added")
      **⚠ PASSED ONCE AND WILL NOW FAIL** until the fixture is cleaned from desktop — see
      the self-degrading note below. This `[x]` records that the flow works, not that the
      test is repeatable.
      **⚠ SELF-DEGRADING — will pass at most once.** `AdHocForm.tsx:127` filters the picker
      with `!currentForms.has(v.name)`, so once "Inspection" is attached it vanishes from
      its own dropdown and every later run fails *"No element found"*. Do not debug that as
      a locator problem — it is the test having consumed its fixture. Second instance of
      this trap (Assign Work Stage is the first), so treat it as a category: **any picker
      that hides what is already attached needs a cleanup step to be repeatable.**
      With mobile treated as delete-free there is no in-app cleanup, so **MOB.393 is
      inherently one-shot** — it needs a desktop cleanup between runs or a dedicated
      read-only fixture. Tracked as TODO, not solvable from inside the test.
> **MOB.390 / MOB.391 — asset lookup gotcha.** Options come from the assets ATTACHED TO
> THE WORK STAGE (`props.assets` in `Conditions/Form.tsx`), not a global list, and the
> filter is `v.name.includes(str)` with `str` lowercased but the name left as-is. So
> typing "Pump 0102" matches nothing even though the asset is attached. The tests focus
> the field WITHOUT typing — an empty query returns every attached asset — then pick by
> text. Do not "improve" these by adding a search term.

> **MOB.390 — the score fields cannot be picked by option text.** `ListFilter` renders
> each option as two sibling divs (`ListFilter/index.tsx:236`):
> `<div class="option-title">1</div><div class="option-description">New Condition …</div>`.
> They concatenate with **no separating space**, so the option's text is `1New Condition …`.
> That defeats both obvious locators: `[normalize-space(.)="1"]` never matches, and
> `[contains(normalize-space(.), "1")]` also matches 10/11/12 → *"Multiple elements found"*.
> The tests match the title div instead:
> `//*[@role="option"][.//*[contains(@class,"option-title")][normalize-space(.)="1"]]`.
> Only needed where the label is a short numeric prefix of other labels — the text lookups
> are unambiguous on full option text.
>
> **…and that still is not unique, hence `[last()]`.** Mantine `Combobox` defaults to
> `keepMounted`, so a dropdown's options stay in the DOM (portaled onto `<body>`) after it
> closes. `conditionFound` and `conditionScore` are **both** `filterScores('conditionScores')`
> — literally the same list — so once the first has been opened, `"2"` matches its leftover
> option as well as the live one and Datadog errors instead of choosing. No text can separate
> two identical lists, and the portal puts the dropdown outside the field's wrapper so an
> ancestor scope cannot reach it either. `[last()]` works because leftovers accumulate in
> field order and the test fills fields in field order — **filling them out of order would
> silently break this.**

> **Login is the single point of failure for every suite.** All 6 login-bearing tests share
> the same opening steps, so one bad login takes down a whole ~150-step suite and reports as
> a *Work Orders* failure — a misleading triage signal worth recognizing on sight.
>
> Seen once: `Type email` → *No element found using locator: `//input[@name="email"]`*,
> while the very next steps (Next / password / Submit / role guard) all passed. **Most
> likely a dev deploy landing mid-run, not a test defect** — Datadog retries a locator for
> the whole step timeout (~60s), so a merely slow page would have resolved. Treat a lone
> login failure as environmental and re-run before changing anything.
>
> A 5s wait now precedes the first keystroke in all 6 (`harden_login.py`, idempotent). It is
> **cheap insurance, not a proven fix** — it would not have prevented the failure above. If
> login flakes again with the wait in place, the cause is upstream of the tests.

- [ ] **TODO** Fill out an inserted form — clicking the inserted form redirects into a
      separate form-filling flow. Scope undecided; not covered by MOB.393
- [ ] **TODO** Permits — deferred by decision
- [ ] **TODO** Warranties — deferred by decision

> **The three TODOs above are lower priority and blocked on fixture data.** Each needs
> read-only records set up on dev that a test can assert against (an approved permit, a
> warranty, a fillable form). Until that exists there is nothing stable to check, and a
> test written against whatever happens to be there would assert on data that can change
> underneath it. Revisit once the fixtures exist — not before.
- [ ] **TODO** Assign work stage — `ReassignWorkButton`, form id `crewform`
      *Not automatable as a repeatable test in its current form.* The crew lookup queries
      with `notInCollection: true`, so it lists only crews **not already assigned**. Run
      one assigns a crew; from run two that crew is gone from the dropdown and the pick
      fails. Mobile has no unassign, so the test cannot reset itself — it would degrade
      into a permanent failure rather than just leaving data behind.
      Options if we want it: (a) a non-mutating variant that opens the modal, asserts the
      crew list renders, and cancels; (b) a desktop/API cleanup step that unassigns
      afterwards; (c) accept it as a one-shot manual check.
- [ ] General Info tab — edit all fields
- [ ] Change status: form trigger
- [ ] Change status: form trigger — create follow-up work
- [ ] Change status: form trigger — add work stage
- [ ] **TODO** Change status: permit — negative test *(blocked on permit fixture data)*
- [ ] **TODO** Change status: permit — approve permit *(blocked on permit fixture data)*
- [-] Submit form with signature widget — freehand canvas
- [~] **SB** — search bar *(MOB.340)* — search box and Sort Criteria modal open and
      dismiss. Does NOT verify results are filtered or ordered correctly: that needs
      known fixture records in the crew's work list, which we do not have.

## T2.2 Asset Verification

*Navigation only (MOB.140). Crew-scoped (`mobileJobsForCrew`) — needs its own fixture
mobile job before automation, same lesson as the work order fixture.*

### Verification behavior

- [ ] Verify asset
- [ ] Verified asset displays on **Verified** tab
- [ ] Verified asset does **not** display on **Unverified** tab
- [ ] Asset list counter increments on verify
- [ ] Unverify asset — counter decrements
- [ ] Unverified asset displays on **Unverified** tab
- [ ] Verify all assets
- [ ] Verify status update (job list)
- [ ] Verify status update (desktop) — *needs a desktop test, outside the MOB.\* suite*

*Verify → assert → unverify → assert is a natural self-reverting pair, making this one of
the few mutating areas that can be fully repeatable.*

### Status filters, sort, cards

- [ ] Status filter: Ready / Canceled / Completed / In Progress
- [ ] Status badge color — *assert the label; color is not expressible*
- [ ] Asset list left / right arrow navigation
- [ ] Sort: Created At ASC/DESC · Mobile Job ASC/DESC · Status ASC/DESC · close sort
- [ ] Filter: All / Verified / Unverified
- [ ] Asset card caret expand / close

### Add assets

- [ ] Add new asset → displays on **Unverified**
- [ ] Add existing asset → displays on **Unverified**

### Asset data tabs

- [ ] General Info — edit all fields
- [ ] Failures — edit; verify message when asset has no default profile
- [ ] Condition — edit; verify message when asset has no default standard
- [ ] Attributes — edit / verify
- [ ] Event Readings — edit / verify
- [ ] Attachments — **AT**, and verify they land on the asset record

### Counts & cross-platform

- [ ] Mobile job count · statuses · asset count
- [ ] Verify/unverify counter increments and decrements
- [ ] Total count matches pie chart — *assert the numeric label, not the SVG*
- [ ] Verify asset(s) update on Web / Mobile / Tablet
- [ ] Verify mobile job status update on Web / Mobile / Tablet
- [ ] Change all statuses · verify all assets · edit tab data
- [ ] Add mobile job on desktop → mobile list updates
- [ ] **SB** — search bar *(no "Collected By Me" in this module)*
- [ ] Mobile job search: status filter Ready, type name, verify results

*Mobile/Tablet variants are extra `device_ids` entries on one test — cheap. "Web" needs
its own desktop test.*

## T2.3 Collector / Lens

*Navigation only (MOB.160).*

- [ ] Create asset — no photo
- [ ] Create asset — no photo, minimum fields
- [ ] Edit asset — add photo / attachments
- [ ] Edit asset — edit fields
- [ ] Create asset with multiple attachments: Condition (3+) · Thermal (3+) ·
      Nameplate (2) · Custom (2) · HEIC (2) · Video (1)
- [ ] **AT** — all attachment types
- [ ] **SB** — search bar

## T2.4 Asset Lookup

*Navigation only (MOB.100).*

- [ ] Tag Lookup button
- [ ] Alphanumeric lookup
- [-] Scan Barcode — requires camera
- [ ] Asset card caret
- [ ] **Add Work** button
- [ ] Tabs: General Info · Attributes · Photos · Docs
- [ ] Search: click, type asset name, click search button
- [ ] **SB** — search bar

## T2.5 Material Lookup

*Navigation only (MOB.110), including that the search input renders.*

- [ ] Storeroom dropdown
- [ ] Material issue
- [ ] Material return
- [ ] Reorder notifications
- [ ] Cycle count
- [ ] Transfers
- [ ] **SB** — search bar

## T2.6 The Map

*Navigation only (MOB.120). Mostly unreachable — drawing happens on a WebGL canvas.*

- [ ] Search · change map · map layers · zoom in/out
- [ ] Add asset to work order
- [-] Create asset: lasso · marker · line · polygon
- [-] Create work order: lasso · marker · line · polygon
- [-] Get directions · get street view — leave the app
- [ ] **SB** — search bar

---

# Tier 3 — Navigation & chrome

*Well covered. Each nav test asserts `PageTitle`'s `h4` against `MOBILE_ROUTES`, which is
the crew- and data-independent signal that a route rendered.*

## T3.1 Routes

- [x] Mobile App / login landing *(MOB.000)*
- [x] Collector / Lens *(MOB.160)* · Asset Lookup *(MOB.100)* · Material Lookup *(MOB.110)*
- [x] Work Orders *(MOB.150)* · The Map *(MOB.120)* · Transaction Log *(MOB.130)*
- [x] Dev Logs *(MOB.170)* — menu item hidden unless env is `development`/`development2`
- [~] Mobile Jobs / Asset Verification *(MOB.140)* — page title asserted; the
      "Find Mobile Job(s)" check is `optional` because that input renders only when the
      crew has mobile jobs
- [ ] Asset Verification Job Template — *desktop page `admin/mobilejobtemplate`, not a mobile route*
- [ ] Mobile Work Template — *desktop page `admin/work-template`, not a mobile route*

## T3.2 Hamburger menu

- [x] Open / close *(MOB.400)*
- [x] ReSync from menu *(MOB.410)*
- [x] Transaction Log via menu *(MOB.420)*
- [x] Switch Crews *(MOB.200, MOB.430)*
- [x] Switch Crews — Cancel *(MOB.430)*
- [x] Log Out · confirm · Take Me Back *(MOB.440)*
- [ ] Timestamp resync (module-level `ResyncButton`)
- [-] Switch Crews — Close button — **this control does not exist**; both the crew and
      logout modals open with `withCloseButton: false`. Dismissal is Cancel or click-outside.

## T3.3 Global

- [ ] Back arrow — `PageTitle` renders `faChevronDoubleLeft` calling `navigate(-1)`
- [ ] **SB** — search bar

---

# Reusable blocks

## SB — Standard search bar

*Referenced by 6 modules. **Collapsed from v1**: the inherited list enumerated every sort
permutation per module (~70 checklist items) for low defect yield. Build once as a subtest,
reference everywhere, and cover the permutations in a single sort test rather than six.*

- [ ] Click search bar · type term · verify results
- [ ] Open **Sort By** dropdown, close modal
- [ ] Sort options, once. NB the inherited labels were wrong: SortDropdown renders
      `${column.label} ▲` / `▼`, not "Ascending"/"Descending". Columns are per-module —
      WorkStage uses createdAt · status · _workSequence · priority · targetDueDate.

## AT — All attachment types

*`uploadFiles` is supported, so attaching fixture files works; camera capture does not.*

- [ ] Photo · Video · HEIC · Document · Nameplate · Custom — *by upload*
- [-] Any capture-from-camera path

---

# Appendix A — Not automatable in Synthetics

Marked `[-]` throughout. These need Playwright/Cypress or manual testing — they are not
"not yet".

| Area | Why |
|---|---|
| Offline queue behavior (T1.1) | No network-toggle step exists. **Highest-value gap.** |
| Upload resume / tus retry (T1.2) | Requires interrupting a transfer |
| Camera capture (T1.2, T2.4) | Requires device camera |
| Native shell bridge (T1.7) | Only active inside the Expo shell |
| Map drawing tools (T2.6) | react-map-gl WebGL canvas, no stable DOM |
| Signature widget (T2.1) | Freehand canvas |
| Directions / street view (T2.6) | Navigate out of the app |
| Color assertions | Assert the label instead |

# Appendix B — Open questions

Resolving these lets us delete `optional` steps, which currently fail silently:

1. ~~Does the fixture's work template set `requireStatusNotes`?~~ **Resolved: no.**
   Confirmed from a run's `step_details` — `#statusNotes` never renders. The 12
   hedging steps were removed; one of them had been clicking the wrong button.
2. **Should `MOB.140`'s "Find Mobile Job(s)" check be critical?** Only if the test crew
   always has at least one mobile job.
3. ~~Do we want phone-width coverage?~~ **Resolved 2026-08-10: tablet only.** It ran at
   both widths briefly; a second `device_ids` entry races the mutating tests against the
   shared fixture (see the warning under *Coverage at a glance*). Phone width can only
   come back as a separate read-only test.
4. **How often should mutating suites run?** Every `MOB.991` run creates an undeletable
   work order.
5. ~~Delete the superseded `MOB.999_Mobile_Suite`?~~ Done — deleted 2026-08-07.
6. **Delete the orphaned `MOB.320_Work_Status_Menu`** (`jv4-76y-xea`)? It exists on
   Datadog with no local file, left over from a rename.

# Appendix C — What changed from v1

- **Reordered by risk**, not by screen. Tier 1 is mobile-specific behavior, Tier 2 module
  functionality, Tier 3 navigation.
- **Added Tier 1 entirely** — offline/queue, uploads, session/auth, viewport, service
  worker, geolocation, native bridge. None of this was in the inherited list.
- **Collapsed the SB block** from ~12 items × 6 modules to one shared block plus a single
  sort test.
- **Marked 2 items as non-existent controls**: "Switch Crews — Close button", and flagged
  the two §1 entries that are desktop admin pages rather than mobile routes.
- **No inherited item was deleted** — everything from v1 appears somewhere here.
