# Mobile App — Test Plan

> **Legend**
> `[x]` automated and passing · `[~]` partially automated · `[ ]` not yet automated
> `[-]` not automatable in Datadog Synthetics — needs Playwright/Cypress or manual
> Automated items name the test that covers them, e.g. *(MOB.150)*.
> Bracketed **(trap N)** refers to *Locator & assertion traps* below — read those before
> debugging a locator.

---

## Coverage at a glance

| | |
|---|---|
| Tests | 38 live · 7 suites |
| Read-only suites | `MOB.990_Smoke` · `MOB.992_Menu` · `MOB.995_AssetLookup` · `MOB.996_Search` |
| Self-restoring | `MOB.993_AssetVerify` — ends every run exactly as it started |
| Leaves residue | `MOB.991_WorkOrders` · `MOB.994_Collector` |
| Standalone | `MOB.000_Login` · `MOB.200_Crew_Switch` (mutates) · `MOB.440_Logout` (ends session) |
| Device | `chrome.tablet` **only** — load-bearing, see trap 1 |
| Optional steps | 14 — 8 are deliberate toast demotions (trap 6); all audited, Appendix D |
| Status | **46 verified · 6 partial · 25 not automatable · 52 open** (last run 2026-08-10) |

**Where we actually are.**

| Module | Depth |
|---|---|
| Work Orders | full CRUD — create, 6 status transitions, 4 charge types, 4 detail tabs |
| Asset Verification | verify/unverify loop, counter, tabs, search/filter/sort |
| Search & filter | both systems — simple (`MOB.530`) and StructuredQuery (`MOB.800`) |
| Collector | create asset, proven by reading the record back |
| Asset Lookup | search, expand, tabs |
| Material Lookup · The Map | **navigation only** |
| Offline queue | **zero** — the highest-risk surface, unreachable with Datadog |

Five things the checkmarks do not convey on their own:

- `MOB.393` (add form) is **one-shot** — it passed once and fails on every later run until
  the fixture is cleaned from desktop (trap 10).
- Attachments are blocked on the **backend**, not on test effort (trap 12).
- `MOB.600` creates a permanent asset per run; `MOB.991` a permanent work order. Only
  `MOB.993` is self-restoring.
- **SB is proven on one list only** (the mobile job list). The other five modules rely on
  that single instance — a search box elsewhere could be broken and nothing would catch it.
- Sort **ordering** is never verified anywhere; only that the sort modal opens. Proving an
  order needs two known records in a known order (Appendix D, Q7).

## Fixtures

| Fixture | Id | Used by | Must stay |
|---|---|---|---|
| Work order | `EYRpYJ9QYdQ1JFF10JtB0Q` | MOB.310–393 | assigned to crew `Admin` |
| Mobile job | `Z0EVwQcdJZhMURcBFkp0E0` "DATADOG MOBILE JOB" | MOB.500–520 | crew `Admin`, `IN_PROGRESS`, exactly **2 assets**, neither verified |
| Asset | `Pump 0102` | MOB.390/391 (attached), MOB.700 (search) | exists, attached to the work order |
| Asset type | `Actuator Tools` | MOB.600 | exists |

Session role must be exactly **`Admin`** — not `Admin (0000)` or `Admin 0100`, which lack
work create/update. Every login-bearing test asserts this immediately after login so drift
fails fast with a legible message.

---

## Operational notes — read before adding tests

- **Deep-link to records instead of navigating lists.** `WorkStageDetails` reads its id from
  `useParams()` and queries directly, so `/apm-mobile/work/<id>` needs no list traversal, no
  `loadedAll` wait, and no crew scoping.
- **But Asset Verification's detail page is `cache-only`.** `Job.tsx` queries
  `MOBILE_JOB_DETAILS` with `fetchPolicy:'cache-only'` and bails with
  `if (!job || !schemaQuery) return null`, so a cold `/asset-verify/<id>` renders a **blank
  page** — no network fallback. `index.tsx` fills that cache by batch-downloading job details
  three at a time, so visiting `/asset-verify` first is REQUIRED. Use a readiness gate, not a
  wait (trap 13).
- **Work order lookups need the same warm-up.** They are `cache-only` and populated only by
  `prefetchWorkData`, which `WorkOrders/index.tsx` gates on the crew's own work list. Each
  test visits `/work` before deep-linking — do not remove that navigation.
- **Nothing in mobile can be deleted** (trap 2). Created records accumulate on dev and must
  be cleaned from desktop. They are tagged `DD SYNTHETIC MOBILE`.
- **Mutating tests must self-restore using *fixed* values.** Datadog can extract a value but
  cannot interpolate it into an XPath, so "put it back how it was" is impossible. Working
  pattern: outbound leg `optional`, return leg `critical`, always landing on a known state
  (`MOB.200` crew, `MOB.320` status).
- **Crew-scoped data is a trap.** `mobileJobsForCrew` and `workStages(crew: '<SESSION>')` are
  both crew-scoped, so anything that switches crews changes what other tests see. That is why
  `MOB.200` is in no suite.
- **Created work orders are not crew-assigned**, so they never appear in `/work` and cannot
  be reopened from mobile.

### Tooling

| Command | Purpose |
|---|---|
| `dd_tools.py push` | sync `dd_tests_mobile/` → Datadog. **Exits non-zero on failure** — chain with `&&`, never `;` |
| `dd_tools.py pull <name>` | fetch a test back after a Datadog-UI edit (strips step `public_id`) |
| `dd_tools.py run <suite>` | trigger + poll, with a live progress bar (TTY) or a line/minute (logs) |
| `dd_tools.py report <suite> [n]` | per-step results, with run age and sibling results |
| `set_device.py` | enforce tablet-only; run after any build script |
| `wire_suite.py` | fill in `subtestPublicId` after children exist |

`write()` refuses to overwrite existing JSON unless `DD_FORCE=1` — because the JSON, not the
generators, is the source of truth for anything hand-authored (trap 12).

---

## Locator & assertion traps

*Sixteen ways a test here has already gone wrong. Most module notes are one-line pointers
back to these.*

**1 · Never add a second `device_id`.** Datadog runs each entry as its own **concurrent**
browser session, and every mutating test drives the *same* fixture, so two devices race on
shared server state. Caught when `chrome.tablet` failed `MOB.320 → status is now "Complete"`
while the `chrome.mobile_small` session walked that work order elsewhere. Datadog cannot
serialize devices or bind a fixture per device. **It also hides itself**: for several runs one
device died at login, so only one session ran and the suite looked clean. Cost accepted: no
phone-width coverage. `set_device.py` enforces this.

**2 · Never write a delete step.** Deleting from mobile is supported only in a few very
specific places, and finding a delete code path (e.g. the gear menu in `ui/Menu.tsx`) does
**not** mean it is available or intended. Do not add one unless the repo owner names the exact
flow. *(Concluded the opposite from the code once and was corrected — `bugs_found.md` §4.)*

**3 · Mantine `keepMounted` produces duplicates.** Closed `Combobox` dropdowns and closed
`Accordion.Panel`s stay in the DOM, so their contents still match locators and Datadog errors
with *"Multiple elements found"* rather than choosing the visible one. Hit three times:
MOB.390's score options, MOB.520's tab strips, MOB.700's result rows. **Fix structurally** —
scope to the row/item under test, e.g. `(//*[contains(@class,"mantine-Accordion-item")])[1]//…`.
Index into a global list only when order is guaranteed and documented.

**4 · Mantine `Modal` unmounts its children.** The mirror image of trap 3: an element inside a
closed modal **does not exist** until the modal opens. That is why the collector's gallery file
input sits at index 3 and not 1 — the always-mounted capture icons come first.

**5 · An assertion that cannot fail is indistinguishable from a passing test.**
`assertPageLacks "Submit"` was vacuously true on MOB.600 for three runs because that form's
button reads **"Create Asset"**. Text-absence checks silently degrade into no-ops whenever the
text they name is not on the page. Always pair one with a **positive** assertion that fails
loudly when its target is missing.

**5b · Page-text assertions cannot tell content from CHROME.** `ActiveFilters` renders each
filter as `<Pill>{label}{operator}{value}</Pill>`, so filtering for `Pump 0102` puts that
string on the page whether or not anything matched — `assertPageContains "Pump 0102"` passes
against **zero results**. The search box, sort label and status legend echo their values the
same way. **Scope the assertion to the thing you actually mean**, e.g. a result row:
`//*[contains(@class," mantine-Accordion-item ")][contains(., "Pump 0102")]`.
A page-lacks is only safe when no chrome can echo the string — which is why MOB.800 clears
filters between its two legs rather than stacking them.

**6 · "The form closed" ≠ "the record was created".** Its strength depends entirely on the
callback the close is wired to:

| Pattern | Proves |
|---|---|
| `closeModal()` inside Apollo `update()`, no `optimisticResponse` | server confirmed — trustworthy (MOB.300) |
| `.then()` on a non-awaited `mutate()` returning an optimistic value | **nothing** (MOB.600's `createAsset`) |

Where it proves nothing, **read the record back** — MOB.600 asserts its own
`DD SYNTHETIC MOBILE {{ RUNID }}` appears in the collected list.

**7 · Toasts are transient, and sometimes fire before the mutation.** `VerificationCheckbox`
and `AdHocForm` both call `toast.success` *before* `client.mutate`, un-awaited — so the toast
proves the handler ran, not that anything persisted (`bugs_found.md` §11). Demote toasts to
`optional`, but only after replacing them with something stronger (trap 6).

**8 · An invalid form submits silently.** `SubmitButton` is
`type={isValid ? 'submit' : 'button'}`, so pressing it while invalid does **nothing** — no
error, no toast (`bugs_found.md` §9). "Clicked, no toast" is therefore ambiguous between
"worked, toast missed" and "form was invalid". Required fields come from the **runtime**
schema, which can demand more than the model file (this is how `unitPrice` broke MOB.380).

**9 · `placeholder` is an attribute, not page text.** `assertPageContains "Find Mobile Job(s)"`
can never match. Use `//input[@placeholder="Find Mobile Job(s)"]`. Cost two runs and briefly
pointed the diagnosis at fixture data that was fine.

**10 · Self-degrading pickers consume their own fixture.** Any dropdown that hides what is
already attached passes once and then fails with *"No element found"* — that is the test
having eaten its data, not a locator fault. Known instances: `AdHocForm`'s
`!currentForms.has(name)` (MOB.393) and `ReassignWork`'s `notInCollection: true`. With mobile
delete-free there is no in-app cleanup, so these are **inherently one-shot**.

**11 · Client-side lookup filters are case-sensitive.** Several use
`v.name.includes(str)` with only the query lowercased, so typing an exact visible name matches
nothing (`bugs_found.md` §1). Tests focus the field **without typing** — an empty query lists
everything — then pick by text. Do not "improve" them by adding a search term. Server-side
lookups (Asset Lookup's `CONTAINS`) are unaffected.

**12 · Hand-authored steps cannot be regenerated.** `uploadFiles` references a `bucketKey` in
Datadog's storage and `SyntheticsApi` has **no** endpoint that mints one; such steps exist only
because someone added them in the Datadog UI. Once a test carries one, `DD_FORCE=1` on its
generator destroys it on the next push — exactly how MOB.200's login steps were lost. Pull the
test down instead, and treat its JSON as permanent source of truth.

**13 · Use a readiness gate, not a blind wait.** Assert each precondition — page title, then
the list rendered, then loading labels gone, then the fixture row present — so a failure names
its own cause. A 30s sleep produced only "blank page" and sent the diagnosis toward the fixture.

**14 · FontAwesome icons render under their CANONICAL name, not the alias you imported.**
`faSortAlt` renders `data-icon="arrow-down-arrow-up"` in FA6 — `sort-alt` is only an alias.
A locator naming one variant fails on a healthy page. Match all four, as MOB.340 does:
`//button[.//*[@data-icon="sort-alt" or contains(@class," fa-sort-alt ") or @data-icon="arrow-down-arrow-up" or contains(@class," fa-arrow-down-arrow-up ")]]`.
Icon-only buttons have no accessible name either, so the icon *is* the locator.

**15 · Measure indexes, never derive them.** Predicting the collector's file-input index from
render order gave 1; the real answer was 3, because React runs effects depth-first. Measure in
the console against the real page, and record that it was measured.

---

# Tier 1 — Mobile-specific risk

*Absent from the inherited checklist. This is what makes the app mobile rather than a narrow
browser window, and where field failures actually come from.*

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

**Synthetics has no network-toggle step.** Everything `[-]` needs Playwright/Cypress. This is
the single biggest gap and no amount of Datadog work will close it.

## T1.2 Uploads & attachments

`UploadLink`, tus resumable uploads, `TusUnauthorizedRetry`, `uploadManager.enqueue`,
`createThumbnailUpload`, and the `UploadLogs` status icon.

- [-] Attach a file via `uploadFiles` — UI-authored only (trap 12), **and** attachments
      fail server-side from a browser (`bugs_found.md` §14)
- [ ] Upload status icon reflects in-flight uploads
- [-] Upload resumes after interruption (tus)
- [-] Unauthorized upload retries after token refresh
- [-] Capture from camera (photo/video/HEIC)
- [-] **AT** — all attachment types *(blocked on the backend — see Reusable Blocks)*

## T1.3 Session, auth & crew

- [x] Login via `/login/sso` environment picker *(MOB.000)*
- [x] Switch crew and revert, Admin → Operator → Admin *(MOB.200)*
- [x] Crew switcher opens and dismisses without mutating *(MOB.430)*
- [x] Log out, including the "Take Me Back" escape hatch *(MOB.440)*
- [ ] Session/JWT expiry behavior — `mobileToken` is signed with a 60-day expiry
- [ ] Role permissions gate menu items (`hidden: !permissions.*.read`)
- [ ] Crew switch actually changes the visible work/mobile-job set

> **Login is a shared prefix across all 6 login-bearing tests**, so one bad login takes down a
> ~150-step suite and reports as a *Work Orders* failure. Treat a lone login failure as
> environmental and re-run before changing anything — Datadog retries a locator for the whole
> step timeout, so a merely slow page would have resolved. A 5s hydration wait precedes the
> first keystroke in all 6 (`harden_login.py`, idempotent); it is cheap insurance, **not** a
> proven fix.

## T1.4 Responsive / viewport

> **Phone width (`chrome.mobile_small`) was REMOVED — do not simply re-add it** (trap 1). If
> wanted back it must be a separate **read-only** test, never a second device on a mutating
> suite. Both open items below are blocked on that.

- [x] Tablet width (`chrome.tablet`) — all tests
- [ ] Crew shortcut visible ≥450px / hidden below *(needs that read-only phone test; Bug §3
      is currently unexercised)*
- [ ] Sticky search row and affixed create button remain reachable at phone width *(same blocker)*

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

- [-] Haptics, native upload path, anything gated on `window.ReactNativeWebView` — only
      active inside the native Expo shell, not in a browser test

---

# Tier 2 — Module functionality

## T2.1 Work Orders

*Suite `MOB.991_WorkOrders_Suite` — 13 subtests, passed end to end 2026-08-10 (474s).
**Mutates and leaves residue.** Fixture `EYRpYJ9QYdQ1JFF10JtB0Q`.*

### Create — entry points

- [x] From Work Order module *(MOB.300)* — affixed `+` → workflow lookup → submit. Modal-close
      is genuine proof here: `closeModal()` sits inside Apollo `update()` with no optimistic
      response (trap 6)
- [ ] From Work Order module *(second variant — entry point TBD)*
- [ ] From Map
- [ ] From Asset Register
- [ ] From Hierarchy

### Read

- [x] Open a work order and render its detail *(MOB.310)*

### Change status

- [x] Pending · In Progress · On Hold · Complete · Canceled · Ready *(all six, MOB.320)*
- [x] Status notes branch — **confirmed not applicable** to this fixture's template

*MOB.320 walks all six transitions, verifying the badge after each, and always finishes on
Ready so the fixture is left in a known state. Repeatable across consecutive runs.*

### ELMO charges

- [x] Add equipment charges *(MOB.350)*
- [x] Add labor charges *(MOB.360)* — needs `laborTypeId` + `qty`; the craft list belongs to
      the selected user, so it searches `Dev Eloper` explicitly
- [x] Add material charges *(MOB.370)* — uses type **Return**, not Issue: Issue is validated
      against stock on hand and each one decrements it, so an Issue-based test erodes its own
      fixture until it fails
- [x] Add other charges *(MOB.380)* — needs `unitPrice`, which the model file does not mark
      required but the runtime schema does (trap 8)
- [ ] Verify financial transactions / GL distribution → estimate summary → cost summary

### Tabs & forms

- [x] Detail tabs render and switch *(MOB.330)* — template-agnostic, against Mantine
      `role="tab"` / `data-active`
- [x] Add condition score *(MOB.390)* — cascades asset → inspection group → inspection
      element. Field ids do not match labels: "Inspection Group" is `assetStandardDetailId`,
      "Condition Left" is `conditionScore`. Took six locator revisions — see traps 3 and 11,
      and the score-picker note below
- [x] Add failure *(MOB.391)* — each lookup is fed by the **previous** selection:
      `repairTypes`/`rootCauseTypes` come from the chosen *failure type*, not a global list,
      so a value that exists elsewhere may simply not be offered. `INSPECT` failed for that
      reason; working values are **`MISSED`** + **`TIME`**
- [x] Add job note *(MOB.392)* — Instructions is a **tiptap rich text editor**; the test types
      into `//div[@contenteditable="true"]`, which Datadog drives fine. `name`/`noteType`
      arrive prefilled via `defaultValues`
- [x] Add form *(MOB.393)* — **one-shot, will now fail** until the fixture is cleaned from
      desktop (trap 10). The `[x]` records that the flow works, not that it is repeatable
- [ ] **TODO** Fill out an inserted form — clicking the inserted form redirects into a
      separate flow. Scope undecided
- [ ] **TODO** Permits — deferred by decision
- [ ] **TODO** Warranties — deferred by decision
- [ ] **TODO** Assign work stage — `ReassignWorkButton`, form id `crewform`. Self-degrading
      (trap 10). Options: a non-mutating variant that opens the modal and cancels; a
      desktop/API unassign step; or accept it as a one-shot manual check
- [ ] General Info tab — edit all fields
- [ ] Change status: form trigger
- [ ] Change status: form trigger — create follow-up work
- [ ] Change status: form trigger — add work stage
- [ ] **TODO** Change status: permit — negative test *(blocked on permit fixture data)*
- [ ] **TODO** Change status: permit — approve permit *(blocked on permit fixture data)*
- [-] Submit form with signature widget — freehand canvas
- [~] **SB** — search bar *(MOB.340)* — search box and Sort Criteria modal open and dismiss.
      Does **not** verify results are filtered or ordered correctly: that needs known fixture
      records in the crew's work list

> **The TODOs are blocked on fixture data, not effort.** Each needs read-only records on dev
> (an approved permit, a warranty, a fillable form). A test written against whatever happens
> to be there would assert on data that can change underneath it. Revisit once they exist.

> **Every tab's form has its own `id`, and two never toast.** There is no shared submit button.
>
> | Tab | Form id | Success toast |
> |---|---|---|
> | Notes | `work-collection-form` | `Item added` |
> | Condition | `work-condition-form` | **none** |
> | Failures | `work-failure-form` | **none** |
> | Forms | `adhoc-form` | `Form added` |
>
> Condition and Failure call `addToCollection()` directly with `done: closeModal`, and that
> helper never toasts — so a toast assertion on those two **could never pass**. Their only
> success signal is the modal closing.

> **MOB.390's score fields cannot be picked by option text.** `ListFilter` renders each option
> as two sibling divs that concatenate with **no space** (`1New Condition …`), so
> `[normalize-space(.)="1"]` never matches and `contains(…,"1")` also matches 10/11/12. Match
> the title div: `//*[@role="option"][.//*[contains(@class,"option-title")][normalize-space(.)="1"]]`
> — then wrap in `[last()]`, because `conditionFound` and `conditionScore` load the *same*
> list and the closed dropdown's copy lingers (trap 3). `[last()]` is only correct while the
> fields are filled in field order.

## T2.2 Asset Verification

*Suite `MOB.993_AssetVerify_Suite` — 3 subtests, 76 steps, passed 2026-08-10 (237s).
**The only fully self-restoring mutating suite** — preserve that: any new subtest must be
read-only or restore what it changed.*

| Route | Component |
|---|---|
| `/asset-verify` | job list — crew-scoped, `mobileJobsForCrew(app: ASSET_VERIFICATION)` |
| `/asset-verify/:jobId` | job detail, asset list — queries by id, **`cache-only`** |
| `/asset-verify/:jobId/asset/:verificationId` | asset detail form — template-driven tabs |

### Verification behavior

- [x] Verify asset *(MOB.510)*
- [x] Verified asset displays on **Verified** tab *(MOB.510)*
- [x] Asset list counter increments on verify *(MOB.510 — `1 out of 2 Assets Verified`)*
- [x] Unverify asset — counter decrements *(MOB.510 — restores to `0 out of 2`)*
- [x] Unverified asset displays on **Unverified** tab *(MOB.500 — at rest)*
- [x] Verified tab is empty at rest *(MOB.500)*
- [ ] Verified asset does **not** display on **Unverified** tab — *needs the two asset names;
      count-based assertions cannot express "this specific row is absent"*
- [ ] Verify status update (job list) — blocked by the same one-way status problem

> **Why exactly one asset, on an already-`IN_PROGRESS` job.** Both status branches in
> `VerificationCheckbox` become unreachable — `assetsVerified === assets.length` is `1 === 2`,
> and `status === 'READY'` is false — so a run mutates nothing but the flag it restores. Point
> these at a `READY` job, or verify both assets, and the fixture degrades permanently.
> *(The inherited claim that verify/unverify is trivially repeatable was wrong: the asset flag
> reverts, the job status does not.)*
>
> **MOB.500 doubles as a fixture guard**, asserting `0 out of 2 Assets Verified` before
> anything mutates. If it fails, untick the stray asset — do not change the test.
>
> **The All/Verified/Unverified filter persists in `sessionStorage`** and a suite shares one
> browser session, so no subtest may assume it starts on All.

### Status filters, sort, cards

- [x] Status filter: Ready / Canceled / Completed / In Progress *(MOB.530)* — the fixture is
      `IN_PROGRESS`, so selecting `Ready` must **hide** it; that negative is what proves the
      filter filters. Each click is paired with an untoggle
- [x] Filter: All / Verified / Unverified *(MOB.500)*
- [~] Asset card caret expand *(MOB.520)* — expand is covered, collapse is not
- [~] Sort: open / dismiss *(MOB.530)* — **ordering is not verified.** Labels are
      schema-derived (`${column.label} ▲/▼`) and proving an order needs ≥2 known records in a
      known order; only one job here is known. Selecting would also persist to
      `sessionStorage` and leak into later subtests
- [ ] Status badge color — *assert the label; color is not expressible*
- [ ] Asset list left / right arrow navigation *(`RecordCycleButtons` on the asset detail
      route — needs a `verificationId`)*

### Add assets


> Both are non-revertible and would permanently grow the fixture job, breaking the
> verification assertions that name the asset count. They need a throwaway job plus a desktop
> cleanup cadence.

### Asset data tabs

*The tabs on an **expanded asset row**, hardcoded in `AssetLookupDetails/index.tsx:81` —
General Info · Attributes · Photos · Docs · Work History. These are **not** the
template-driven sections of the `/asset/:id` detail route; `Work History` is not even a
`MobileJobTemplateSectionType`, which is the quickest way to tell the two apart. Being
hardcoded, they are asserted **by name** rather than by index.*

- [x] All five tabs render and switch *(MOB.520 — 30 steps)* — asserts the strip and each
      tab's `data-active`, not panel contents: what a panel shows depends on the asset having
      attributes / photos / work history, which the fixture does not guarantee. Locators are
      scoped per accordion item (trap 3)
- [ ] General Info — edit all fields
- [ ] Failures — edit; verify message when asset has no default profile
- [ ] Condition — edit; verify message when asset has no default standard
- [ ] Attributes — edit / verify
- [ ] Event Readings — edit / verify
- [-] Attachments — **AT**, and verify they land on the asset record *(backend blocker)*

### Counts & cross-platform

- [ ] Mobile job count · statuses · asset count
- [ ] Total count matches pie chart — *assert the numeric label, not the SVG*
- [ ] Change all statuses · verify all assets · edit tab data
- [x] **SB** — search bar *(MOB.530)* — **the only place the SB block is actually proven.**
      Typing the fixture's own name matches; appending junk makes it disappear. That negative
      leg is what MOB.340 cannot do on the work list, where no record is known-stable
- [x] Mobile job search: status filter Ready, type name, verify results *(MOB.530)*

*"Web" needs its own desktop test. Mobile/Tablet variants cannot be extra `device_ids` on a
mutating test (trap 1).*

## T2.3 Collector / Lens

*Suite `MOB.994_Collector_Suite`. **Mutates and does NOT self-restore** — every run collects a
permanent asset named `DD SYNTHETIC MOBILE <8 digits>`; cleanup is a desktop job.*

- [x] Create asset — minimum fields, no photo *(MOB.600)* — name + desc + type
      `Actuator Tools`. `{{ RUNID }}` makes the name unique per run, so a uniqueness
      constraint cannot collide. **Proof of creation is a read-back**: the test asserts its own
      asset appears in the collected list, because the form closes regardless (trap 6)
- [-] Create asset **with a photo** — **impossible from a browser**, not a test gap. The
      server rolls back and throws `Unable to create attachments`, and the asset is lost with
      it (`bugs_found.md` §14)
- [-] Edit asset — add photo / attachments *(same blocker)*
- [ ] Edit asset — edit fields
- [-] Create asset with multiple attachments: Condition (3+) · Thermal (3+) · Nameplate (2) ·
      Custom (2) · HEIC (2) · Video (1) *(same blocker)*
- [-] **AT** — all attachment types *(same blocker)*

> 🛑 **Do not re-add the upload step to `MOB.600`.** It was built, verified to execute, and
> removed because attaching a photo fails the whole collect. The working recipe is preserved
> in `Mobile/dd_reference/MOB.600_with_upload_steps.json` for when the backend supports it;
> its `bucketKey` is namespaced to MOB.600's public id, so it can be restored into **this**
> test but not copied into another. See traps 4, 12 and 14 for why that step was hard to
> author: the input is created by `useFileDialog` with `display:none`, appended to `<body>`,
> only exists while the photo modal is open, and is indistinguishable from three camera
> inputs in the DOM.

## T2.4 Asset Lookup

*Suite `MOB.995_AssetLookup_Suite` — **read-only**, safe to schedule.*

- [x] Alphanumeric lookup *(MOB.700)* — searches `Pump 0102`; server-side `CONTAINS`, so
      trap 11 does not apply here
- [x] Asset card caret *(MOB.700)* — expands the first result
- [x] Tabs render *(MOB.700)* — asserts the strip mounts and that **Work History** exists.
      NB Work History embeds its own `StructuredQuery` (twice), so it is not a plain list
- [-] **Tag Lookup / Scan Barcode** — one control, not two. `TagLookup` *is* the scanner
      (`useBarcodeScanner` + a `capture:'environment'` dialog), and captured images route
      through an **OpenAI call**, so it would be non-deterministic even if the camera worked

*Both search systems here are owned by T3.3: the simple **SB** block, and **`StructuredQuery`**
— this screen is its main home (the other is the Work History tab). `MOB.800` covers it.*

> **There is no search button.** The `SearchInput` sits in a `<form onSubmit>`, so search is
> submitted with **Enter**; the visible "Add N Asset(s)" button belongs to the embedded picker
> flow. The inherited list also gave four tabs — there are **five**.

## T2.5 Material Lookup

*Navigation only (MOB.110), including that the search input renders.*

- [ ] Storeroom dropdown
- [ ] Material issue
- [ ] Material return
- [ ] Reorder notifications
- [ ] Cycle count
- [ ] Transfers

*Search/sort here is the shared **SB** block, owned by T3.3.*

> Issue/return move real stock. MOB.370 already showed Issue is validated against stock on
> hand and decrements it, so any Issue-based test erodes its own fixture. Expect to need a
> dedicated storeroom item, or a Return-only design, before automating these.

## T2.6 The Map

*Navigation only (MOB.120). Mostly unreachable — drawing happens on a WebGL canvas.*

- [ ] Search · change map · map layers · zoom in/out
- [ ] Add asset to work order
- [-] Create asset: lasso · marker · line · polygon
- [-] Create work order: lasso · marker · line · polygon
- [-] Get directions · get street view — leave the app

*Search here is the shared **SB** block, owned by T3.3.*

---

# Tier 3 — Navigation & chrome

*Well covered. Each nav test asserts `PageTitle`'s `h4` against `MOBILE_ROUTES` — the crew-
and data-independent signal that a route rendered.*

## T3.1 Routes

- [x] Mobile App / login landing *(MOB.000)*
- [x] Collector / Lens *(MOB.160)* · Asset Lookup *(MOB.100)* · Material Lookup *(MOB.110)*
- [x] Work Orders *(MOB.150)* · The Map *(MOB.120)* · Transaction Log *(MOB.130)*
- [x] Dev Logs *(MOB.170)* — menu item hidden unless env is `development`/`development2`
- [~] Mobile Jobs / Asset Verification *(MOB.140)* — page title asserted; the
      "Find Mobile Job(s)" check is `optional` because that input renders only when the crew
      has mobile jobs

## T3.2 Hamburger menu

- [x] Open / close *(MOB.400)*
- [x] ReSync from menu *(MOB.410)*
- [x] Transaction Log via menu *(MOB.420)*
- [x] Switch Crews *(MOB.200, MOB.430)*
- [x] Switch Crews — Cancel *(MOB.430)*
- [x] Log Out · confirm · Take Me Back *(MOB.440)*
- [ ] Timestamp resync (module-level `ResyncButton`)
- [-] Switch Crews — Close button — **this control does not exist**; both the crew and logout
      modals open with `withCloseButton: false`. Dismissal is Cancel or click-outside

## T3.3 Global

*Owns the cross-module controls so they are built once. T2.x sections defer here.*

*Suite `MOB.996_Search_Suite` — **read-only**, safe to schedule. Groups the shared controls
so they are built once: `MOB.530` (simple) and `MOB.800` (StructuredQuery).*

- [ ] Back arrow — `PageTitle` renders `faChevronDoubleLeft` calling `navigate(-1)`
- [~] **SB** — search bar — proven on the mobile job list *(MOB.530)*; the other five
      modules still rely on that one instance
- [x] `StructuredQuery` filter builder *(MOB.800 — verified 2026-08-10)* — `name contains`
      shows the asset as a **result row**, a non-matching value hides it, and clearing
      restores `Filters (0)`

> **There are TWO independent search/filter systems in mobile — do not conflate them.**
>
> | | Where | What it is |
> |---|---|---|
> | **Simple** (`SB`) | every list screen | `SearchInput` free-text + `SortDropDown` + per-module status/segment filters |
> | **Advanced** (`StructuredQuery`) | **Asset Lookup only**, plus the **Work History** tab (twice) | column/operator/value filter builder — `MultiValueSelector`, `ActiveFilters`, saved filters via `useFilterState` |
>
> `MOB.530` covers the **simple** system, and only on the mobile job list. `StructuredQuery`
> is untested everywhere and is the larger of the two: it builds server-side query
> conditions rather than filtering a loaded list, so a defect there returns *wrong data*
> rather than a visibly broken control.

---

# Reusable blocks

## SB — Standard search bar

*Referenced by 6 modules. **Collapsed from v1**, which enumerated every sort permutation per
module (~70 items) for low defect yield. Build once as a subtest, reference everywhere.*

- [x] Click search bar · type term · verify results *(MOB.530 — job list)*
- [x] Open **Sort By** dropdown, close modal *(MOB.340, MOB.530)*
- [ ] Sort options, once. NB the inherited labels were wrong: `SortDropdown` renders
      `${column.label} ▲` / `▼`, not "Ascending"/"Descending". Columns are per-module —
      WorkStage uses createdAt · status · _workSequence · priority · targetDueDate

## AT — All attachment types

> ⚠️ **This block's original premise — "`uploadFiles` is supported, so attaching fixture files
> works" — is disproven.** Two independent blockers: the step cannot be generated from our
> pipeline (trap 12), and browser-originated attachments fail server-side, taking the parent
> record with them (`bugs_found.md` §14). Attachment coverage is blocked on the **backend**,
> not on test effort.

- [-] Photo · Video · HEIC · Document · Nameplate · Custom — *by upload*
- [-] Any capture-from-camera path

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

Each of these becomes viable with a **throwaway fixture** plus a desktop cleanup cadence —
that single change unlocks all four.

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
| Offline queue behavior (T1.1) | No network-toggle step exists. **Highest-value gap.** |
| Upload resume / tus retry (T1.2) | Requires interrupting a transfer |
| Camera capture (T1.2, T2.3, T2.4) | Requires device camera; tag scan also calls OpenAI |
| Browser-originated attachments (T2.3) | Backend limitation, not a harness one — `bugs_found.md` §14 |
| Native shell bridge (T1.7) | Only active inside the Expo shell |
| Map drawing tools (T2.6) | react-map-gl WebGL canvas, no stable DOM |
| Signature widget (T2.1) | Freehand canvas |
| Directions / street view (T2.6) | Navigate out of the app |
| Color assertions | Assert the label instead |

# Appendix D — Open questions

Resolving these lets us delete `optional` steps, which currently fail silently:

1. ~~Does the fixture's work template set `requireStatusNotes`?~~ **Resolved: no.** Confirmed
   from a run's `step_details`; the 12 hedging steps were removed, one of which had been
   clicking the wrong button.
2. **Should `MOB.140`'s "Find Mobile Job(s)" check be critical?** Only if the test crew always
   has at least one mobile job.
3. ~~Do we want phone-width coverage?~~ **Resolved 2026-08-10: tablet only** (trap 1).
4. **How often should mutating suites run?** Every `MOB.991` run creates an undeletable work
   order; every `MOB.994` run creates an undeletable asset.
5. ~~Delete the superseded `MOB.999_Mobile_Suite`?~~ Done — deleted 2026-08-07.
6. **Delete the orphaned `MOB.320_Work_Status_Menu`** (`jv4-76y-xea`)? It exists on Datadog
   with no local file, left over from a rename.
7. **Can we get the two fixture asset names** for `Z0EVwQcdJZhMURcBFkp0E0`? It unblocks the
   one uncovered verification item ("verified asset absent from Unverified tab"), and would
   give the asset list two known records in a known order — the missing ingredient for
   verifying **sort ordering** rather than just that the sort modal opens.
8. **How do multiple `StructuredQuery` filters combine — AND or OR?** Observed in a real run:
   with `name contains "Pump 0102"` and `name contains "ZZZZ-NO-SUCH-ASSET"` both active, the
   asset was **still listed**. That rules out plain AND, but does not distinguish OR
   semantics from the second condition being dropped. `MOB.800` now clears between legs so it
   does not depend on the answer. Worth resolving — if conditions are silently dropped, the
   filter builder returns wrong data, which is the quiet failure mode that makes
   StructuredQuery higher-risk than the simple search.
9. **Does a text search discard active structured filters?** `AssetLookup`'s search `refetch`
   passes `conditions: [...(props.query ?? [])]`, omitting the `query` derived from
   `useFilterState` — so submitting a search after applying filters may drop them. Read from
   source, not yet observed; a natural follow-up test once MOB.800 is stable.

# Appendix E — What changed from the inherited list

- **Reordered by risk**, not by screen: Tier 1 mobile-specific behavior, Tier 2 module
  functionality, Tier 3 navigation.
- **Added Tier 1 entirely** — offline/queue, uploads, session/auth, viewport, service worker,
  geolocation, native bridge. None of it was in v1.
- **Collapsed the SB block** from ~12 items × 6 modules to one shared block.
- **Corrected controls that do not exist**: "Switch Crews — Close button"; Asset Lookup's
  "click search button"; Tag Lookup and Scan Barcode as separate items; Asset Lookup's tab
  count (four listed, five real); and two §1 entries that are desktop admin pages.
- **Corrected a wrong premise**: verify → unverify is *not* trivially repeatable (T2.2).
- **Extracted the recurring failure modes** into *Locator & assertion traps* rather than
  repeating them per module.
- **No inherited item was deleted** — everything from v1 appears somewhere here. Items that
  are decisions or desktop-scope moved to Appendices A and B rather than sitting in the open
  count, so "open" now means remaining work.
- **Extracted `Locator & assertion traps`** (16 entries) from what had been ~250 lines of
  per-module blockquotes. Most were the same few root causes repeated.
- **Split the shared controls into `MOB.996_Search_Suite`** rather than testing search and
  filtering once per module.

## Where to pick up

Ranked by value, from the current state:

1. **T1.3 — role permissions gate menu items · crew switch changes the visible set.** The
   highest-risk reachable area left. Permissions already produced a real bug
   (`bugs_found.md` §4b) and crew scoping has repeatedly misled diagnosis.
2. **Appendix D Q8 / Q9** — how multiple StructuredQuery filters combine, and whether a text
   search silently discards active filters. Both would be *wrong-data* defects, and the
   harness for them now exists in `MOB.800`.
3. **T3.3 back arrow · T3.2 timestamp resync** — trivial, read-only, closes out chrome.
4. **T2.5 Material Lookup** — needs a fixture decision first: issue/return move real stock,
   and MOB.370 already showed Issue erodes its own fixture.
5. **One decision unlocks four items at once** — a throwaway fixture plus a desktop cleanup
   cadence makes everything in Appendix A viable.

*Possible simplification, not yet applied:* `MOB.800` clears filters via the drawer's
"Clear all", which forces several open/close cycles (42 steps). The pills rendered by
`FilterInfo` carry their own remove **X** and sit **outside** the drawer, which would cut
this to roughly 30 steps. Scope any such locator to `.asset-lookup-active-filters` and click
it with the drawer shut — pills render in *both* places at once, so an unscoped match hits
two elements.
