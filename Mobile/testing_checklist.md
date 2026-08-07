# Mobile App — Test Plan


> **Legend**
> `[x]` automated and passing · `[~]` partially automated · `[ ]` not yet automated
> `[-]` not automatable in Datadog Synthetics — needs Playwright/Cypress or manual
> Automated items name the test that covers them, e.g. *(MOB.150)*.

---

## Coverage at a glance

| | |
|---|---|
| Tests | 24 live · 204 steps |
| Suites | `MOB.990_Smoke` (read-only) · `MOB.991_WorkOrders` (mutates) · `MOB.992_Menu` (read-only) |
| Standalone | `MOB.000_Login` · `MOB.200_Crew_Switch` (mutates) · `MOB.440_Logout` (ends session) |
| Device | `chrome.tablet` only — **no phone-width coverage** |
| Optional steps | 18 — each can fail silently; see Appendix B |

**Honest summary:** routes and chrome are well covered. Module *functionality* is barely
touched — Work Orders has a create/read/status slice, everything else is navigation only.
The highest-risk mobile surface (offline queue) has **zero** coverage and cannot be reached
with Datadog.

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
- **`optional` steps hide breakage.** They exist only where a config value is unconfirmed.
  Resolve Appendix B and make them critical.
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

- [ ] Phone width (`chrome.mobile_small`) — **not currently run**
- [x] Tablet width (`chrome.tablet`) — all tests
- [ ] Crew shortcut visible ≥450px / hidden below
- [ ] Sticky search row and affixed create button remain reachable at phone width

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

*All six covered. MOB.320 walks Pending → In Progress → On Hold → Complete → Canceled →
Ready, verifying the status badge after each transition, and always finishes on Ready so
the fixture is left in a known state. Verified repeatable across consecutive runs.*

### ELMO charges

- [ ] Add equipment charges
- [ ] Add labor charges
- [ ] Add material charges
- [ ] Add other charges
- [ ] Verify financial transactions / GL distribution → estimate summary → cost summary

*All four go through `InsertModalButton` → toast `"Item added"`. No delete exists, so each
run adds permanent children to the fixture.*

### Tabs & forms

- [x] Detail tabs render and switch *(MOB.330)* — template-agnostic, against
      Mantine `role="tab"` / `data-active`; `keepMounted={false}` means a switch is a
      real panel change, not styling
- [ ] General Info tab — edit all fields
- [ ] Add condition score — form `work-condition-form`
- [ ] Add failure score — form `work-failure-form`
- [ ] Change status: form trigger
- [ ] Change status: form trigger — create follow-up work
- [ ] Change status: form trigger — add work stage
- [ ] Change status: permit — negative test
- [ ] Change status: permit — approve permit
- [ ] Warranty
- [ ] Assign work stage — `ReassignWorkButton`, form `crewform`
- [ ] **AT** — attachments, all types
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

1. **Does the fixture's work template set `requireStatusNotes`?** `MOB.320` carries 5
   optional steps hedging both branches.
2. **Should `MOB.140`'s "Find Mobile Job(s)" check be critical?** Only if the test crew
   always has at least one mobile job.
3. **Do we want phone-width coverage?** Adding `chrome.mobile_small` to `device_ids`
   would re-catch the `.mobile-crew` 450px class of bug.
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
