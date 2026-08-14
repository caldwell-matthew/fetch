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
| Tests | 57 leaf tests · 12 suites |
| Read-only suites | `MOB.990_Smoke` · `MOB.992_Menu` · `MOB.995_AssetLookup` · `MOB.996_Search` |
| Self-restoring | `MOB.993_AssetVerify` · `MOB.997_Session` · `MOB.989_FieldEdit` — end every run exactly as they started |
| Leaves residue | `MOB.991_WorkOrders` · `MOB.994_Collector` · `MOB.987_EventReadings` · `MOB.986_WorkOrders_Extra` *(MOB.396/397)* · `MOB.998_MaterialLookup` *(MOB.870 only)* |
| Standalone | `MOB.000_Login` · `MOB.200_Crew_Switch` (mutates) · `MOB.440_Logout` (ends session) |
| Device | `chrome.tablet` **only** — load-bearing, see trap 1 |
| Optional steps | 25 — deliberate toast/transient demotions (traps 6, 7); all audited, and all now asserted **before** the 5000ms `autoClose` |
| Status | **68 verified · 8 partial · 33 not automatable · 23 open** (last run 2026-08-13) |

**Where we actually are.**

| Module | Depth |
|---|---|
| Work Orders | full CRUD — create, 6 status transitions, 4 charge types, 4 detail tabs, General Info field edit |
| Asset Verification | verify/unverify loop, counter, tabs, search/filter/sort, attribute edit, event readings |
| Search & filter | both systems — simple (`MOB.530`) and StructuredQuery (`MOB.800`); sort choice applied + persisted (`MOB.810`) |
| Collector | create asset, proven by reading the record back |
| Asset Lookup | search, expand, tabs, per-field edit |
| Material Lookup | storeroom select, item search, cycle-count adjustment (self-restoring) |
| The Map | **navigation only** |
| Session & permissions | menu gating and crew scoping, both proven by negatives |
| Offline queue | **zero** — the highest-risk surface, unreachable with Datadog |

Five things the checkmarks do not convey on their own:

- `MOB.393` (add form) is **one-shot** — it passed once and fails on every later run until
  the fixture is cleaned from desktop (trap 10).
- Attachments are blocked on the **backend**, not on test effort (trap 12).
- `MOB.600` creates a permanent asset per run; `MOB.991` a permanent work order; `MOB.550`
  one event reading per leg. `MOB.993`, `MOB.989`, `MOB.997` and `MOB.998` are the
  self-restoring ones.
- **SB is proven on one list only** (the mobile job list). The other five modules rely on
  that single instance — a search box elsewhere could be broken and nothing would catch it.
- Sort **ordering** is still never verified. `MOB.810` proves a sort choice is *applied and
  persisted* (it reads `sessionStorage['mobile-MobileJob-sort']` back), not that the rows
  came out in that order. Proving an order needs two known records in a known order
  (Appendix D, Q7).

## How much of Mobile is actually covered?

*Assessed 2026-08-12. Three numbers, because the honest answer depends on the denominator.*

| Question | Estimate |
|---|---|
| Of what Datadog **can** reach in a browser | **~65%** |
| Of the mobile app **as a whole** | **~45%** |
| Of "would **catch a regression** before a user hits it" | **~30%** |

**Do not quote the 65% on its own.** The raw item count (64 verified of 98 reachable) produces
it, but items are not equal weight — "the back arrow returns to the previous page" counts the
same as "the offline queue drains in order".

**Why the whole-app number is lower.** The unreachable third is not incidental; it is
disproportionately *the mobile-specific part* — the offline transaction queue, service worker
updates, geolocation, camera capture, the native bridge, and attachments. A technician working
without signal is exercising almost entirely untested code.

**Why the regression number is lowest, and it is the one that matters:**

- **Nothing is scheduled.** Every green result in this document came from a manual trigger.
  There is regression *capability*, not regression *detection*.
- **Almost everything is a happy path.** We prove a form submits with valid input; we rarely
  prove it rejects invalid input, respects permissions, or survives a slow network.
- **Fixture monoculture.** One work order, one mobile job, two assets, one storeroom item.
  MOB.397 is the live demonstration: the same form behaved differently because one asset had
  workflows and another did not.
- **Several tests are one-shot or timing-lucky.** MOB.393 passes only until its fixture is
  dirty; five asset-verify tests pass on the same timing MOB.396 did not get.

**The caveat on all three numbers:** this checklist enumerates what we thought to test, not the
app's real surface. Four of the bugs in `bugs_found.md` (§19–§22) were found while building a
test for something else, which suggests the unexamined area is larger than the open count
implies.

**Biggest single improvement available:** scheduling the four read-only suites
(`990`, `992`, `995`, `996`). That moves the regression number more than any new test, because
it converts existing work from "we checked once" into "we would know". See Appendix D Q4 and
Appendix F.

## Fixtures

| Fixture | Id | Used by | Must stay |
|---|---|---|---|
| Work order | `EYRpYJ9QYdQ1JFF10JtB0Q` | MOB.310–395 | assigned to crew `Admin`; `desc` is owned by MOB.395 and ends every run as `DATADOG FIXTURE` |
| Mobile job | `Z0EVwQcdJZhMURcBFkp0E0` "DATADOG MOBILE JOB" | MOB.500–570 | crew `Admin`, `IN_PROGRESS`, exactly **2 assets** — `Tank 0000` and `A/C Motor 0002` — neither verified |
| Asset | `Pump 0102` | MOB.390/391 (attached), MOB.700 (search), MOB.710 (edit) | exists, attached to the work order; `desc` is owned by MOB.710 and ends every run as `DATADOG FIXTURE` |
| Asset type | `Actuator Tools` | MOB.600 | exists |
| Storeroom | `Central Storeroom` | MOB.850/860 | visible to crew `Admin`, `canAdjust` on |
| Storeroom item | `000-000-000 Adamantium` | MOB.850/860 | in that storeroom; quantity is restored by arithmetic each run |

Session role must be exactly **`Admin`** — not `Admin (0000)` or `Admin (0100)`, which lack
work create/update. Every login-bearing test asserts this immediately after login so drift
fails fast with a legible message.

---

## Operational notes — read before adding tests

- **NAVIGATE THE WAY A USER DOES — click through; do not force-route.** *(All Asset
  Verification tests were converted 2026-08-13; zero `/asset-verify/<id>` deep links remain,
  and `MOB.993`/`MOB.989`/`MOB.987` all pass on the shared gate.)* If a person would
  have to wait for data before they could click into a route, the test waits and clicks too.
  A `goToUrl` is a **full page load**: it restarts the SPA on the target route and races
  whatever was loading, exercising a path no user takes. This cost most of a day on MOB.396,
  where deep-linking to an Asset Verification job produced an intermittently **empty asset
  list** that survived a 60s polling guard; clicking the job row works. Use
  `dd_tools.av_job_gate()`.
- **Deep-linking is the exception, and only where the target queries by id on mount.**
  `WorkStageDetails` reads its id from `useParams()` and queries directly, so
  `/apm-mobile/work/<id>` is safe — no list traversal, no `loadedAll` wait, no crew scoping.
  Verify that property before deep-linking anywhere else.
- **Asset Verification's detail page is `cache-only`** (`Job.tsx` bails on a cold cache), so
  it renders blank unless the list has loaded first — and a full page load re-races that
  download. Use `av_job_gate`, which clicks the job row and gates on the asset **rows**; a
  `assertPageLacks` on a loading label is equally true before loading starts.
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
| `dd_tools.av_job_gate(job_id)` | **the** way to reach an Asset Verification job — clicks the job row (never deep-links), gates on the asset ROWS, and carries a polling `timeout`. Do not hand-roll a local copy; three tests each grew their own and all three were subtly wrong |
| `fetch.py` `fetch(type="full", dir=…)` | back up **every** browser test on the account. ⚠️ **names files by test name, so duplicate names silently overwrite each other** — the account has `000.000.000_RUN-1` ×6 and `Mobile` ×2, which turned 321 tests into 315 files. Re-save those by `public_id` or the backup has a hole in it. Last full backup: `dd_tests_backup/2026-08-12_1543_pre-delete/` (323 files) |
| `wire_suite.py` | fill in `subtestPublicId` after children exist. **Re-run after any suite rebuild** — a rebuilt suite resets its children to `PENDING-WIRE-UP` and `push` 400s |
| `step(..., always=True)` | Datadog's `alwaysExecute` — run a step even after an earlier one failed. For writes a later run depends on, and for restore legs (trap 16c) |

> **TODO — tag hygiene is unreliable, so do not filter on tags for safety.** 18 leaf tests
> carry no `read-only` tag despite being read-only (all 8 `MOB.1xx` nav tests, the four
> `MOB.4xx` menu tests, `MOB.330`/`MOB.340`, `MOB.900`, `MOB.000`). Three of those 18 are
> **not** read-only and would need a mutating tag instead: `MOB.200_Crew_Switch` (switches
> crew), `MOB.440_Logout` (ends the session), and arguably `MOB.410_Menu_Resync`. Until this
> is cleaned up, the suite-level classification in *Coverage at a glance* is the source of
> truth for what mutates — **not** the tags. Metadata-only fix; no behaviour changes.

`write()` refuses to overwrite existing JSON unless `DD_FORCE=1` — because the JSON, not the
generators, is the source of truth for anything hand-authored (trap 12).

> **Nothing runs on a schedule — deliberately deferred until coverage is complete.** All 69
> tests are `paused` **on Datadog** (verified against the API 2026-08-12, not inferred from
> the local JSON — which cannot tell you, see the `BODY_KEYS` note below) with
> `tick_every: 86400`, so every green result in this doc is a *manual* trigger. There is no regression detection yet, and no MOB.* test is wired
> into `datadog-synthetics.yml` (it triggers 7 unrelated public_ids, on the
> `datadog-workflow` branch only).
>
> **`push` cannot change that today.** `BODY_KEYS` omits `status`, so the `"status": "paused"`
> in every local JSON is never transmitted — Datadog's own state governs. Enabling schedules
> means adding `status` to the push body, or flipping it in the UI. *(Same omission means
> `pull` drops the field: `MOB.600` has no `status` locally.)*
>
> When this is picked up: the four **read-only** suites (`990`, `992`, `995`, `996`) are the
> safe candidates. `991` and `994` each leave a permanent record per run, so scheduling them
> means committing to a cleanup cadence.

---

## Locator & assertion traps

*Twenty ways a test here has already gone wrong. Most module notes are one-line pointers
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

**14 · FontAwesome icons render under their CANONICAL name, not the alias you imported —
so look it up, never guess.** One line gives the truth:

```
node -e "console.log(require('@fortawesome/pro-regular-svg-icons').faSync.iconName)"
```

Measured examples: `faSortAlt` → `arrow-down-arrow-up`, `faSync` → `arrows-rotate`,
`faChevronDoubleLeft` → **`chevrons-left`** (guessed as `chevron-double-left` and then
`angles-left`; both wrong, two wasted runs). Icon-only buttons have no accessible name, so
the icon *is* the locator. Match every plausible variant, as MOB.340 does:
`//button[.//*[@data-icon="sort-alt" or contains(@class," fa-sort-alt ") or @data-icon="arrow-down-arrow-up" or contains(@class," fa-arrow-down-arrow-up ")]]`.
Icon-only buttons have no accessible name either, so the icon *is* the locator.

**15 · Measure indexes, never derive them.** Predicting the collector's file-input index from
render order gave 1; the real answer was 3, because React runs effects depth-first. Measure in
the console against the real page, and record that it was measured.

**16 · An input's value is a PROPERTY, not page text — and a `Run JavaScript` step is the way
to reach one.** Mantine's `Select` renders its chosen label as the `<input>`'s value, so
`assertPageContains "Created At ▲"` fails on a page that is displaying exactly that. Cost one
run on MOB.810. Two fixes, in order of preference:

| | |
|---|---|
| the state is persisted somewhere | assert the **source of truth** — MOB.810 reads `sessionStorage['mobile-MobileJob-sort']` |
| it is only in the DOM | `assertElementContent` with `check: "contains"` against the element, or a JS step reading `.value` |

**JS assertion steps ARE generatable** — their params are just `{"code": ...}` with no
`bucketKey`, so trap 12 applies to `uploadFiles` only. `dd_tools.jsassert()` wraps them; the
code is a function body, so `return` the boolean. Assuming otherwise nearly cost a rewrite.

**16b · A toast assertion placed after a long wait can never pass.** `react-toastify`
autoCloses at **5000ms**, so `wait 6` → `assertPageContains "<toast>"` is a step that can only
ever report ERR — the mirror image of trap 5's assertion that can never fail. Four such steps
shipped in the field-edit tests before this was spotted, all reporting ERR on every run and
all invisible because they were `optional`. Assert the toast ~2s after the action, then finish
waiting. **Where the toast is the only server-confirmed signal — `Attributes` has no
`optimisticResponse` — this is the difference between real evidence and none.**

**16c · A test whose proof depends on a previous run must be able to bootstrap itself.**
`MOB.550` opens by asserting that a reading a *previous* run wrote came back from the server
on a cold cache. That assertion is critical, so on the first run it failed and **aborted the
steps that would have written the reading** — leaving the next run to fail identically,
forever. A test that can never reach its own passing state. The fix is Datadog's
`alwaysExecute`, exposed as `always=True` in `dd_tools.step()`. Do not confuse it with
`optional`:

| flag | means | effect on the test |
|---|---|---|
| `optional` (`allowFailure`) | *this* step may fail | test still **passes** |
| `always` (`alwaysExecute`) | an *earlier* step failed | step runs anyway; test still **fails** |

Reasoning predicted "first run fails, second passes". Running it showed the second would fail
too. **Any test that leaves state for its own next run needs `always` on the steps that write
that state** — the same applies to restore legs in mutating tests.

**17 · `typeText` APPENDS — it does not replace.** Editing an existing value means click →
**Control+A** → type; without the select-all, leg 2 of a restore never restores, it grows the
string by one marker every run. `pressKey` takes modifiers:
`{"value": "a", "modifiers": ["Control"]}` — Control, not Meta, since the runners are Linux.
Pair this with trap 8: `SubmitButton` is `type={isValid ? 'submit' : 'button'}` and
`GeneralInfo` also requires `isDirty`, so **re-typing the value a field already holds
produces a button that silently does nothing**. Any edit test therefore needs its new value
to differ from the current one — `{{ RUNID }}` guarantees that.

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

- [-] Attach a file — UI-authored only (trap 12) **and** fails server-side from a browser (§14)
- [ ] Upload status icon reflects in-flight uploads
- [-] Upload resumes after interruption (tus)
- [-] Unauthorized upload retries after token refresh
- [-] Capture from camera (photo/video/HEIC)
- [-] **AT** — all attachment types *(blocked on the backend — see Reusable Blocks)*

## T1.3 Session, auth & crew

*✅ All items resolved.*

*Suite `MOB.997_Session_Suite` — mutates the session crew but **self-restores**.*

> **This org's role names are the fixture.** Roles are named `Admin <CRUD>`, each digit a
> permission flag in Create/Read/Update/Delete order — so `Admin (1000)` is create-only and
> `Admin (0000)` has nothing. That supplies the one thing a gating test normally cannot get:
> a role that genuinely lacks read.
>
> **Naming is consistent: always `Admin (####)` with parentheses.** Locators still match on
> the digits (`contains(., "0000")`) rather than the full string — the digits are the part
> that carries meaning, and it survives a role being renamed around them. Restoring to plain
> `Admin` *does* use exact match, so it cannot land on `Admin (0000)`.
>
> ⚠️ **Do not run this suite concurrently with another.** Crew is user-level session state and
> every other suite asserts the role is exactly `Admin`. `Switch Crews` has no permission gate
> (`TopHeader/index.tsx:61`), so even a no-read role can switch back, and the restore leg is
> critical — but if a run dies midway, check the session crew before rerunning anything else.
>
> **`MOB.200` does not prove its own switch.** Its outbound "Select Operator" / "Submit" steps
> are `optional` and nothing asserts the crew afterwards, so a missing option silently skips
> both and the test passes having restored Admin to Admin (trap 5). MOB.210/220 make every
> switch critical and assert the role label under "Switch Crews" after each one.

- [x] Login via `/login/sso` environment picker *(MOB.000)*
- [x] Switch crew and revert, Admin → Operator → Admin *(MOB.200)*
- [x] Crew switcher opens and dismisses without mutating *(MOB.430)*
- [x] Log out, including the "Take Me Back" escape hatch *(MOB.440)*
- [-] Session/JWT expiry — signed 60-day `mobileToken`; needs a backend-issued short-lived
      token. (Corrupting it tests *invalid* token handling, which is not the same thing)
- [x] Role permissions gate menu items *(MOB.210 — verified 2026-08-11, 33 steps)* — switches to `Admin (0000)`
      (CRUD all off) and asserts `Work Orders` **vanishes** from the menu, then restores
- [x] Crew switch actually changes the visible work/mobile-job set *(MOB.220 — verified
      2026-08-11, 21 steps)* — uses
      `Admin (0100)` (**read on**) so the list still loads; that isolates crew scoping from
      permissions, which `0000` would confound

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

*✅ Resolved — everything here is Expo-shell only.*

`utils/WebviewBridge/ReactNativeBridge` (`haptic`, `window.ReactNativeWebView`).

- [-] Haptics · native upload · anything gated on `window.ReactNativeWebView` — Expo shell only

---

# Tier 2 — Module functionality

## T2.1 Work Orders

*✅ **Complete as of 2026-08-13**, apart from items that are decisions (Appendix A) or
explicitly deferred: form triggers (low priority, owner call) and permit status-gating
(permits are read-only in mobile). Suites: `MOB.991` (13 children) and `MOB.986` (5, all green).*

*Suite `MOB.991_WorkOrders_Suite` — 13 subtests, passed end to end 2026-08-10 (474s).
**Mutates and leaves residue.** Fixture `EYRpYJ9QYdQ1JFF10JtB0Q`.*

### Create — entry points

- [x] From Work Order module *(MOB.300)* — affixed `+` → workflow lookup → submit. Modal-close
      is genuine proof here: `closeModal()` sits inside Apollo `update()` with no optimistic
      response (trap 6)
- [ ] From the **Mobile Map**
- [x] From a **Mobile Job asset** *(MOB.396 — verified 2026-08-12, 28 steps)* — ⚠️ leaves a
      real work order per run. `AddWorkButton defaultAsset={asset}` on the asset detail
- [x] From **Work Orders**: *assign follow-up work* *(MOB.397 — verified 2026-08-12, 30
      steps)* — ⚠️ leaves a real work order per run. Reached via the gear menu on an
      **expanded** asset row, with both workflow filters turned off first (note below)
- [-] ~~From Asset Register~~ · ~~From Hierarchy~~ — do not exist in mobile (owner, 2026-08-12);
      both were desktop screen names

*The **Asset Lookup** entry point is a deliberate non-goal, not a gap — it opens the same
`WorkInsertForm` MOB.300 covers and leaves a permanent work order. See Appendix A.*

> **The Warranties tab shows warranties of assets ATTACHED to the work order** (`WarrentyList`
> maps `workStage.assets` → `asset.warranties`). A warranty on an unattached asset renders
> nothing — that, not the assertion, is why MOB.399 first failed. It asserts real content
> (`Expiration Date` / `Remaining Days` / `Current Reading` / `Exp. Reading`) and deliberately
> does **not** accept the `No Warranties Found...` empty state, so it cannot go green on a
> tab that is showing nothing.

> **The workflow lookup is filtered differently depending on the entry point.** Two toggles
> default ON in `WorkInsertForm`: `filterWorkflowByPMField` ("Exclude PM Workflows", from
> `defaultValues`) and `filterWorkflowByAsset` ("Filter Workflows By Asset", auto-set by a
> `useEffect` **only when the default asset actually has workflows**). So the same form shows
> a different list per caller — `MOB.300` (no asset) and `MOB.396` (`Tank 0000`, no workflows)
> both find `Datadog Test`; `MOB.397`'s asset has workflows, so it does not. Turn both toggles
> off for the unfiltered list, and **click the `<label>`, not the input** — Mantine hides the
> real checkbox, so targeting the input gives *"Element located but it's invisible"*.

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
- [-] ~~Financial transactions / GL distribution / estimate + cost summary~~ — obsolete,
      dropped 2026-08-12 (owner). Not a mobile screen; mobile only *creates* charges

### Tabs & forms

*Both **Permits** and **Warranties** are read-only data in mobile (repo owner, 2026-08-12) —
the tabs display them and nothing is edited there. **Notes** is covered by `MOB.392`, which
opens the Notes tab and adds a note through the rich-text editor, so the tab and its write
path are both exercised.*

- [x] Warranties tab *(MOB.399 — verified 2026-08-13, 9 steps)* — read-only; asserts real
      warranty content, not the empty state
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
- [x] Permits tab *(MOB.394 — verified 2026-08-12, 9 steps)* — read-only. Requires **all three** of `Status:`,
      `Expiration Date:` and `Approved By:`, so a half-rendered card cannot pass.
      ⚠️ Only meaningful because the fixture carries a real permit (added 2026-08-12):
      `PermitsStats` has **no empty state**, so with no permits the tab is blank and there
      is nothing to assert — `bugs_found.md` §21
- [~] Assign work stage *(MOB.398 — verified 2026-08-12, 13 steps)* — **deliberately partial.** Opens the crew modal, proves
      the form renders, cancels. Does **not** prove an assignment persists: the crew lookup
      uses `notInCollection: true`, so a test that really assigns passes once then fails
      forever (trap 10). Repeatable-variant chosen by the repo owner 2026-08-12 — **do not
      'finish' it by making it submit**
- [x] General Info tab — edit a field *(MOB.395 — verified 2026-08-12, 37 steps)* —
      **SELF-RESTORING**: writes `DD SYNTHETIC EDIT <runid>` to `desc`, then writes
      `DATADOG FIXTURE` back. Proof is a **reload + JS read of `#desc.value`**, not the
      toast: `GeneralInfo` passes an `optimisticResponse`, so `Record Updated` fires
      before the server replies (trap 6). Covers the form, not every field — one field
      exercises the whole submit path, and the others are the same `FormField` renderer
- [ ] **REVISIT LATER — forms are low priority for mobile** (repo owner, 2026-08-12), and it
      is unconfirmed whether the fixture workflow has any form triggers configured at all.
      Do not start these without checking that first, or the test will fail on a fixture
      question rather than a code one:
  - [ ] Change status: form trigger
  - [ ] Change status: form trigger — create follow-up work *(would leave a permanent record)*
  - [ ] Change status: form trigger — add work stage *(same)*
- [-] Change status: permit — negative test · approve permit — **Permits are READ-ONLY data
      in mobile** (repo owner, 2026-08-12). The tab displays them; approving and the
      status-gating workflow are not mobile actions. Not a gap
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
- [x] Verified asset does **not** display on **Unverified** tab *(MOB.590 — verified
      2026-08-13, 25 steps)* — **self-restoring**, and the restore legs are `alwaysExecute` so
      a failed assertion cannot leave the fixture with a verified asset. Targets `Tank 0000`
      **by name** rather than MOB.510's `(//input[@type="checkbox"])[1]`, which acts on
      whichever asset is first and would silently pick a different one once MOB.580 changes
      the sort
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

- [x] All five tabs render and switch *(MOB.520 — 32 steps, re-verified 2026-08-13)* — asserts the strip and each
      tab's `data-active`, not panel contents: what a panel shows depends on the asset having
      attributes / photos / work history, which the fixture does not guarantee. Locators are
      scoped per accordion item (trap 3)
- [x] General Info — edit a field *(MOB.710 — verified 2026-08-12, 47 steps)* — the
      per-field pencil, covered once for all three entry points (see the note below)
- [ ] Failures — edit; verify message when asset has no default profile. **Low yield**: like
      Condition below, the asset-detail version reuses the Work Order form MOB.391 already
      drives; what is new is only the pre-bound asset and the existing-entries list
- [ ] Condition — edit. **Low yield**: `ConditionAssessment.tsx` renders the same form
      **MOB.390** covers, just with the asset pre-bound. Needs three gates to hold — a
      `CONDITION` template section, `job.mobileJob.workStageId`, and `asset.assetStandardId`
- [x] Attributes — edit *(MOB.545 — re-verified 2026-08-13)* — **on the full-page
      asset detail, not the expanded row.** Edits `Year Of Manufacture` (a *string*
      attribute holding values like `DECEMBER 2002`, despite the name) and restores it.
      **SELF-RESTORING**, and the restore value is a realistic one rather than a
      synthetic marker because this overwrites real data on a real asset
- [x] Event Readings — capture *(MOB.550 — re-verified 2026-08-13, 37 steps)* — ⚠️ **leaves
      residue**: one `Event` per leg per run. **The only test here that proves a write the
      app itself fakes**: `onSubmit` does not await the mutation, then unconditionally
      toasts and hand-writes the reading into the cache with `writeQuery`, and the cache is
      persisted to IndexedDB so a reload cannot cut through it. Proof is the NEXT run's
      cold cache — see trap 16c
- [-] Attachments — **AT**, and verify they land on the asset record *(backend blocker)*

> **There are three edit surfaces in mobile, not seven.** The plan said "asset data tabs ×5 +
> collector edit fields + WO General Info", which counted *screens*. The components are reused:
>
> | Form | Rendered by | Mutation |
> |---|---|---|
> | `EditForm` (per-field pencil) | Asset Lookup · the Collector's asset details (`Details.tsx`) · the asset rows inside a verification job | `UPDATE_ASSET` |
> | `GeneralInfo` (bulk form) | WO General Info tab · the full-page AV asset detail | `UPDATE_WORK_STAGE` / `UPDATE_ASSET` |
> | `Attributes` (bulk form) | WO Attributes tab · AV asset attributes | attribute update |
>
> So `MOB.710` covers three entry points at once, and four of the planned tests would have
> been near-duplicates of it. **Photos/Docs are attachments** (backend-blocked) and **Work
> History is read-only** — neither is an edit surface at all.
>
> **All three are now covered**: `MOB.710` (EditForm), `MOB.395` (GeneralInfo) and `MOB.545`
> (Attributes). `MOB.545` also reaches the full-page AV asset detail at
> `/asset-verify/:jobId/asset/:verificationId` — no `verificationId` is needed up front,
> because tapping the asset *name* in a job row navigates there (`JobAccordianControl.tsx:37`).
>
> Still uncovered on this path: the WO **Attributes** tab (same component, different mutation
> — `UPDATE_WORKSTAGE_ATTRIBUTE`), and `GeneralInfo` on the AV asset detail (same component,
> `UPDATE_ASSET` instead of `UPDATE_WORK_STAGE`). Both are second instances of forms already
> proven, so they are low-yield rather than risky.

### Counts & cross-platform

- [x] Mobile job count · statuses · asset count *(MOB.560 — verified 2026-08-12, 22 steps)*
- [x] Total count matches pie chart *(MOB.560)* — the ring's arcs are not assertable, so it
      checks the **legend** and the per-card arithmetic (`X out of Y` vs `Z%`, all cards, ≥1
      match required). Badge filtering proven by the negative: `Completed` hides the fixture
- [-] Change all statuses · verify all assets — one-way to `COMPLETED` (§10), consumes the
      fixture. Appendix A; a throwaway fixture unblocks it
- [x] **SB** — search bar *(MOB.530)* — **the only place the SB block is actually proven.**
      Typing the fixture's own name matches; appending junk makes it disappear. That negative
      leg is what MOB.340 cannot do on the work list, where no record is known-stable
- [x] Mobile job search: status filter Ready, type name, verify results *(MOB.530)*

*"Web" needs its own desktop test. Mobile/Tablet variants cannot be extra `device_ids` on a
mutating test (trap 1).*

## T2.3 Collector / Lens

*✅ All items resolved. Suite `MOB.994_Collector_Suite`. **Mutates and does NOT self-restore**
— every run collects a permanent asset named `DD SYNTHETIC MOBILE <8 digits>`; cleanup is a
desktop job.*

- [x] Create asset — minimum fields, no photo *(MOB.600)* — name + desc + type
      `Actuator Tools`. `{{ RUNID }}` makes the name unique per run, so a uniqueness
      constraint cannot collide. **Proof of creation is a read-back**: the test asserts its own
      asset appears in the collected list, because the form closes regardless (trap 6)
- [-] Create asset **with a photo** — **impossible from a browser**, not a test gap. The
      server rolls back and throws `Unable to create attachments`, and the asset is lost with
      it (`bugs_found.md` §14)
- [-] Edit asset — add photo / attachments *(same blocker)*
- [x] Edit asset — edit fields *(MOB.710)* — the Collector's asset details renders
      `AssetLookupDetails` (`Details.tsx`), the same component and the same
      `UPDATE_ASSET` path MOB.710 already drives. Covered by construction, not by a
      second test
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

*✅ All items resolved. Suite `MOB.995_AssetLookup_Suite` — **read-only**, safe to schedule.*

- [x] Alphanumeric lookup *(MOB.700)* — searches `Pump 0102`; server-side `CONTAINS`, so
      trap 11 does not apply here
- [x] Asset card caret *(MOB.700)* — expands the first result
- [x] Tabs render *(MOB.700)* — asserts the strip mounts and that **Work History** exists.
      NB Work History embeds its own `StructuredQuery` (twice), so it is not a plain list
- [-] **Tag Lookup / Scan Barcode** — one control, not two. Needs a camera, and routes through
      an OpenAI call, so non-deterministic regardless

*Both search systems here are owned by T3.3: the simple **SB** block, and **`StructuredQuery`**
— this screen is its main home (the other is the Work History tab). `MOB.800` covers it.*

> **There is no search button.** The `SearchInput` sits in a `<form onSubmit>`, so search is
> submitted with **Enter**; the visible "Add N Asset(s)" button belongs to the embedded picker
> flow. The inherited list also gave four tabs — there are **five**.

## T2.5 Material Lookup

*✅ All items resolved. Suite `MOB.998_MaterialLookup_Suite` — mutates stock, and is
self-restoring by arithmetic EXCEPT `MOB.870` (stocking), which is one-way.*

- [x] Storeroom dropdown *(MOB.850 — verified 2026-08-11, 15 steps)* — picking `Central Storeroom` loads its item list
- [x] Material search *(MOB.850)* — matched pair: `Adamantium` shows the fixture item, a
      non-matching term hides it. The negative leg is what proves it filters (trap 5)
- [x] Cycle count *(MOB.860 — verified 2026-08-11, 32 steps)* — `+1` then `-1` on `000-000-000 Adamantium`, reason
      `Error Correction`, so the item's quantity nets to zero change
- [-] **Material issue / return** — *not on this screen.* These are work-order material
      charges and `MOB.370` already covers them. This screen adjusts and stocks
- [-] **Transfers** — **this control does not exist** (zero matches across `client/mobile`)
- [-] **Reorder notifications** — **this control does not exist** (same)
- [x] Stocking *(MOB.870)* — ⚠️ **leaves residue**: +1 quantity per run, one-way by
      design. Proof is the modal closing, which here is genuine: `close()` sits inside
      the mutation's `update()` with no `optimisticResponse`

*Search/sort here is the shared **SB** block, owned by T3.3.*

> **Do not change MOB.860 to only add.** The point of the `+1`/`-1` pair is that the fixture
> item's stock does not drift; a one-way adjustment silently grows it every run.
>
> **The row text is not clickable.** Each row carries an `ActionIcon`
> (`MaterialLookup/index.tsx:181-188`, `faArrowUpRightFromSquare` → `arrow-up-right-from-square`)
> that opens the adjustment modal — trap 14 again. Both stock forms are gated on
> `storeRoom?.permissions?.canAdjust`, which is a real field, unlike `wPerms.canDelete`
> (`bugs_found.md` §4b).
>
> Modal-close is genuine proof here: `close()` runs inside the mutation's `update()` with no
> `optimisticResponse` (`StockAdjustments.tsx:26-43`), so it only fires on a confirmed server
> response — trap 6's trustworthy case. The toast stays optional.
>
> **Stocking** is covered by **MOB.870** — the second tab (`Stock Item`) of the same modal,
> a different mutation with different required fields. It is **one-way**: stocking only adds,
> so unlike MOB.860 it cannot net back to zero and raises the fixture item's quantity by 1
> every run. The repo owner accepted that 2026-08-12. Two things it corrected on the way in:
> the form is a *tab*, not a separate screen, and **`Unit Price` is required** alongside the
> quantity — filling only the quantity leaves Submit inert and silent (trap 8).

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
- [~] Timestamp resync *(MOB.460 — verified 2026-08-11)* — `[~]` on purpose: **resync leaves
      no durable observable difference.** Proves the control renders with its timestamp, the
      click does not break the page, and nothing hangs; the only live signal is a transient
      loading label, asserted optional. Distinct from MOB.410 (the *menu* ReSync)
- [-] Switch Crews — Close button — does not exist (`withCloseButton: false`); dismissal is
      Cancel or click-outside

## T3.3 Global

*Owns the cross-module controls so they are built once. T2.x sections defer here.*

*Suite `MOB.996_Search_Suite` — **read-only**, safe to schedule. Groups the shared controls
so they are built once: `MOB.530` (simple), `MOB.800` (StructuredQuery), `MOB.810` (sort).*
Back arrow and module resync live in `MOB.992_Menu_Suite` instead, with the other chrome.

- [x] Back arrow *(MOB.450 — verified 2026-08-11)* — builds real history (`/work` → `/asset-lookup`) then goes
      back, so the assertion is that we landed on the **specific** previous page, not merely
      that the app navigated somewhere. The arrow is an `<svg>` with `onClick` on it
      (`PageTitle.tsx:65`), not a button, and has no accessible name — the icon is the
      locator, and the Pro package renders `faChevronDoubleLeft` as `chevrons-left`
      (trap 14)
- [~] **SB** — search bar — proven on the mobile job list *(MOB.530)*; the other five
      modules still rely on that one instance
- [x] Search vs. filter interaction *(MOB.820 — Q9, answered 2026-08-12)* — ⚠️ pins
      **`bugs_found.md` §20**: submitting the search box **discards** the active structured
      filters while still reporting `Filters (1)`. Characterization test — **it fails when the
      bug is fixed**
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

*✅ All items resolved — sort **ordering** closed by MOB.580, 2026-08-13.*

*Referenced by 6 modules. **Collapsed from v1**, which enumerated every sort permutation per
module (~70 items) for low defect yield. Build once as a subtest, reference everywhere.*

- [x] Click search bar · type term · verify results *(MOB.530 — job list)*
- [x] Open **Sort By** dropdown, close modal *(MOB.340, MOB.530)*
- [x] Sort options, once *(MOB.810 — verified 2026-08-11, 25 steps)* — picks `Created At ▲`, proves it persists across a
      route change and back, then switches to `Created At ▼`. NB the inherited labels were
      wrong: `SortDropdown` renders `${column.label} ▲` / `▼`, not "Ascending"/"Descending".
      Columns are per-module — WorkStage uses createdAt · status · _workSequence ·
      priority · targetDueDate
- [x] Sort **ordering** *(MOB.580 — verified 2026-08-13, 35 steps)* — the rows really do
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
> `bucketKey`, so trap 12 does not apply to them. Use `jsassert()` in `dd_tools.py`.

## AT — All attachment types

*✅ Resolved — blocked on the backend, not on test effort.*

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

**Only 2 are still open.** Ask the repo owner — these are questions *for them*, not puzzles to
engineer around. Q7 sat open for days while tests were built to route around it; asking took
one sentence.

| # | Question | Blocks |
|---|---|---|
| **2** | Should `MOB.140`'s "Find Mobile Job(s)" check be **critical**? Only if the test crew always has ≥1 mobile job. | one `optional` step that can currently skip silently |
| **4** | How often should **mutating suites** run? Each run of `991`/`994`/`986`/`987`/`998` leaves undeletable records. | scheduling (Appendix F territory) |

**Answered** — kept as one line each; the reasoning that still matters was moved into the
traps or `bugs_found.md`.

| # | Question | Answer |
|---|---|---|
| 1 | Does the fixture template set `requireStatusNotes`? | No (removed 12 hedging steps) |
| 3 | Phone-width coverage? | No — tablet only, trap 1 |
| 5 | Delete `MOB.999_Mobile_Suite`? | Done 2026-08-07 |
| 6 | Delete the orphaned `MOB.320_Work_Status_Menu`? | It never existed — account audited 2026-08-12, 60 remote / 60 local, zero orphans |
| 7 | The fixture job's two asset names? | **`Tank 0000`** and **`A/C Motor 0002`** — unblocks sort *ordering* and the Unverified-tab item |
| 8 | How do multiple `StructuredQuery` filters combine? | They **AND**. An earlier claim otherwise came from a run whose assertion was later shown unsound (trap 5b) |
| 9 | Does a text search discard active structured filters? | **Yes** — `bugs_found.md` §20, pinned by `MOB.820` |

# Appendix E — What changed from the inherited list

Kept short: the inherited list is now well behind us, and each correction below is recorded
where it matters (the module section, a trap, or `bugs_found.md`).

- **Reordered by risk**, not by screen — Tier 1 mobile-specific, Tier 2 module, Tier 3 chrome.
- **Tier 1 added entirely** — offline/queue, uploads, session, viewport, service worker,
  geolocation, native bridge. None of it existed in v1.
- **Collapsed the SB block** from ~12 items × 6 modules into one shared block.
- **Controls that do not exist were corrected**, not left as open work: Switch Crews' close
  button · Asset Lookup's search button · Tag Lookup vs Scan Barcode as two items · Asset
  Lookup's tab count (four listed, five real) · Material Lookup's Transfers and Reorder
  notifications · Work Order create "From Asset Register" and "From Hierarchy" · ELMO charges.
- **Items filed under the wrong screen were re-pointed** — Material issue/return are work-order
  charges (MOB.370), not Material Lookup. The inherited list also missed the stocking form.
- **Nothing was silently dropped.** Decisions live in Appendix A, desktop scope in Appendix B,
  so the open count means remaining *work*.

# Appendix F — making the suite faster

*In progress. Every number below is measured, not estimated.*

Runtime ≈ **explicit `wait` seconds + ~1s per step**. Today the suite holds **1975s of waits
across 1276 steps**, with **1050s in just 63 waits of ≥10s** — that concentration is why the
long waits are the whole game. 54 polling gates are in place so far.

**1. Replace blind waits with a step `timeout`. ✅ PROVEN — do this to the rest.**

`MOB.996` was converted 2026-08-13: **327s → 273s (54s, 16.5%)**, tracking the 56s of waits
removed almost exactly. Steps genuinely poll — a guard with `timeout=60` was measured polling
**58.2s** before failing. Both `step(..., timeout=N)` and `jsassert(..., timeout=N)` take it.

*Method:* reduce each wait to a small settle floor (2–5s) and put a generous `timeout` on the
following **positive** assertion.

> ⚠️ **Three shapes must NOT be converted.** A mechanical pass breaks all three:
> - a wait before **`assertPageLacks`** — a *lacks* assertion is true BEFORE the thing appears
>   as well as after it goes, so the wait is what gives it meaning;
> - a wait before **`goToUrl`** — nothing to gate on; usually "let the mutation land";
> - **`av_list_gate`'s 25s** — two `assertPageLacks` checks depend on that elapsed time.

*Remaining pools:* `MOB.991` (13 children) and `MOB.986` are the biggest.

**2. Turn off screenshots on non-assertion steps.** `no_screenshot` is per-step and `false`
everywhere; at ~1s/step over 1276 steps that is most of the non-wait cost. **Keep them on
assertions** — screenshots have repeatedly been what diagnosed a failure here.

**3. Run independent suites in parallel.** `dd_tools.run` takes several names and Datadog runs
them concurrently, so a full pass costs the slowest suite rather than the sum. Safe for the
read-only suites only — never the mutating ones (trap 1).

**4. Drop `retry` while developing.** `retry: {count: 1}` re-runs a failing test: right for
scheduled runs, pure cost in a build-fix loop.

# Where to pick up next

Ranked by value, from the current state:

Done since the last revision: **T1.3** (MOB.210/220), **Q8**, **T3.3 back arrow / T3.2
resync** (MOB.450/460), **T2.5 Material Lookup** (MOB.850/860), **sort options** (MOB.810),
and **all three edit surfaces** (MOB.395/545/710 — 3 tests, not the 7 the plan assumed; see
T2.2's note).

Done 2026-08-13: **sort ordering** (MOB.580) · **verified-asset-absent-from-Unverified**
(MOB.590) · **T2.1 Work Orders complete** · **Appendix F proven on MOB.996** (327s → 273s).

1. **Finish the Appendix F rollout** — the method is proven and the three non-convertible
   shapes are documented. `MOB.991` (13 children) and `MOB.986` are the biggest remaining
   pools of blind waits.
2. **Scheduling** — the single largest improvement to the *regression* number, which is the
   weakest of the three coverage estimates. Appendix D Q4 is the open decision.
3. **The Map** (2 items) — low yield, mostly WebGL; a probe would at least settle whether the
   geocoder popup is reachable at all.
4. **Appendix F detail —** Waits are 58–70% of every run and the numbers are
   already measured; item 1 there (per-step `timeout` instead of blind waits) needs one
   experiment to confirm and would pay for itself immediately.
5. ~~Appendix D Q9~~ — **done**: answered, and the defect is pinned by MOB.820
   (`bugs_found.md` §20).
3. **Work Order create entry points** (4) — the Map, Asset Lookup, and the two list paths all
   open the same `WorkInsertForm` MOB.300 covers; only the pre-filled context differs.
6. ~~Counts and badges~~ — **done** (MOB.560). **The Map** (2) remains: low yield, mostly
   WebGL and unreachable.
5. **One decision unlocks four items at once** — a throwaway fixture plus a desktop cleanup
   cadence makes everything in Appendix A viable, *and* unblocks Q7 (two known records in a
   known order), which is the only route to verifying sort **ordering**.
6. **Not reachable at all**: offline queue, service worker, geolocation — Appendix C.

*Scheduling is deliberately deferred until mobile coverage is complete.*

*Possible simplification, not yet applied:* `MOB.800` clears filters via the drawer's
"Clear all", which forces several open/close cycles (42 steps). The pills rendered by
`FilterInfo` carry their own remove **X** and sit **outside** the drawer, which would cut
this to roughly 30 steps. Scope any such locator to `.asset-lookup-active-filters` and click
it with the drawer shut — pills render in *both* places at once, so an unscoped match hits
two elements.
