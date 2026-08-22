# Mobile App — Test Plan

## Codebase sync

*This plan describes a moving target. A row can be correct on the day it is written and wrong
a week later because the app changed, not because anyone made a mistake — so record which
commit was actually read.*

| | |
|---|---|
| **Last synced with `development`** | **2026-08-21** — `MentorTwo@5f1e177bf3` (`ci: version bump to 2026.5.0-rc.222`) |
| **Local working tree** | ⚠️ on **`mc-itsjustaphase`** (`4f6803ba9a`), *not* `development` — **but `client/mobile` is byte-identical to `origin/development` (`5f1e177bf3`)**, verified with `git diff --stat origin/development -- client/mobile` on 2026-08-21 (empty). Code read off this branch is therefore safe to cite for mobile. **Re-check the branch before every read** — it has moved twice now, and a branch can diverge from what dev.mentorapm.com actually serves, which is what the tests run against. |
| **Last commit touching `client/mobile`** | `08645c852f` — 2026-08-21, *"fix: clear persisted asset lookup search"* |
| **Last full walk of `client/mobile`** | 2026-08-18 — component-by-component; found Scheduled Work, the scheduled-view toggle, Asset Lookup's `Readings` tab, and three work-detail surfaces |
| **Diffed since that walk** | 2026-08-21 — three commits touched `client/mobile`: `08645c852f` (persisted search), `21e388b5b7` (assets near me), `7a3b54dd60` (button colour). See the note below |

**How to re-sync** — do this before trusting the coverage numbers, and whenever a test starts
failing on a locator that used to work:

```bash
cd ~/GitHub/MentorTwo && git checkout development && git pull
git log -1 --format='%h %ad %s' --date=short                     # record this here
git log -1 --format='%h %ad %s' --date=short -- client/mobile    # and this
# what changed in mobile since the last walk recorded above:
git log --since=<LAST-WALK-DATE> --oneline -- client/mobile
git diff --stat <LAST-MOBILE-COMMIT> HEAD -- client/mobile
```

⚠️ **`git diff @{<date>}` is reflog-derived and lies about a repo that was not pulled that
day** — it reported Scheduled Work as newly added when it had landed on 2026-08-13. Diff
against a **commit SHA**, never a date-based revision.

> ### 🔴 The 2026-08-21 diff broke a passing test — this is what the table is for
>
> `08645c852f` *"fix: clear persisted asset lookup search"* made Asset Lookup's query persist
> to **`sessionStorage['asset_lookup_query']`**. A Datadog suite shares **one browser
> session**, so inside `MOB.995`: `MOB.700` searches `Pump 0102`, and `MOB.720` then arrives
> at a box **already holding it**. `typeText` APPENDS (trap 17), so the query became
> `Pump 0102Pump 0102` and matched nothing.
>
> `MOB.720` passed on 2026-08-20 and would have failed on its next run, for a reason nothing
> in the test had changed. **Both tests now select-all before typing.** Nothing else in the
> suite types into that box.
>
> **The general shape**: when the app starts persisting something to `sessionStorage`, every
> test that shares the session inherits it. That is the third persistence hazard here, after
> the two map toggles and the scheduled-view toggle — worth checking for on every diff.
>
> **Why this table exists.** Scheduled Work landed 2026-08-13 and had no coverage and no
> checklist row for five days, purely because nobody re-read the module after it merged. The
> failure mode is silent: nothing goes red when a feature ships untested, because the tests
> that would fail do not exist. **A diff of `client/mobile` is the only thing that catches
> it** — which is the same reason the coverage percentages must be derived from the app
> rather than from this file.

**When the two disagree, the codebase wins** — update the row, do not adjust the app.

---

> **Legend**
> `[x]` automated and passing · `[~]` partially automated · `[ ]` not yet automated
> `[-]` not automatable in Datadog Synthetics — needs Playwright/Cypress or manual
> Automated items name the test that covers them, e.g. *(MOB.150)*.
> Bracketed **(trap N)** refers to *Locator & assertion traps* below — read those before
> debugging a locator.

---

## Coverage at a glance

> **Numbers below re-verified against the Datadog API on 2026-08-18** (not inferred from the
> local JSON): local and remote agree exactly — no local-only test awaiting a push, no orphan
> left behind on Datadog. The account held 85 MOB.* tests at the start of that audit and 86
> after `MOB.977` was added.

| | |
|---|---|
| Tests | **86 leaf tests · 13 suites** · 2085 steps · 78 subtest slots · 2 archived (`MOB.134`, `MOB.711`) *(recounted from local JSON at session end, 2026-08-21)* |
| Read-only suites | `MOB.990_Smoke` · `MOB.992_Menu` · `MOB.995_AssetLookup` · `MOB.996_Search` · `MOB.985_WorkDetail` *(new 2026-08-20, 3 children, green)* |
| Self-restoring | `MOB.993_AssetVerify` · `MOB.997_Session` · `MOB.989_FieldEdit` — end every run exactly as they started |
| Runtime ceiling | `MOB.991` is **at** Datadog's max execution time — put new work-order tests in a NEW suite, see **Appendix F0** |
| Leaves residue | `MOB.991_WorkOrders` · `MOB.994_Collector` · `MOB.987_EventReadings` · `MOB.986_WorkOrders_Extra` *(MOB.396/397)* · `MOB.998_MaterialLookup` *(MOB.870 only)* |
| Standalone | `MOB.000_Login` · `MOB.200_Crew_Switch` (mutates) · `MOB.440_Logout` (ends session) · `MOB.974`/`MOB.977`/`MOB.978`/`MOB.979` diagnostics |
| Device | `chrome.tablet` **only** — load-bearing, see trap 1 |
| Step flags | 103 `optional` (traps 6, 7) · 210 `alwaysExecute` (trap 16c) · 194 `assertFromJavascript` (trap 16) *(recounted 2026-08-21)* |
| Items | **104 verified · 11 partial · 50 not automatable · 2 open** *(recounted from the rows at session end, 2026-08-21 — `MOB.910` moved two `[-]`→`[x]` and one `[-]`→`[~]`; `MOB.974` moved the service-worker row `[-]`→`[~]`)* |
| Scheduling | **Manual only — a SETTLED DECISION, not a gap. Do not propose scheduling.** See below |

### Where this stands — 2026-08-21

| | |
|---|---|
| **Green and verified** | **all seven suites touched by this effort**: `MOB.991` · `MOB.990` (**14 children**, incl. `MOB.346`, `MOB.171`, and `MOB.910_Offline_UI` — green 13:40) · `MOB.989` · `MOB.986` (all 11, incl. `MOB.342`, `MOB.345`, `MOB.399`'s warranty leg) · `MOB.985` (all 3 work-detail tests) · `MOB.995` (**3 children**, green 13:45 in 100s, after `MOB.711` was un-wired) |
| **Pushed, not yet green** | *(none)* — `MOB.345` went green 2026-08-21 with the view-toggle fix, closing the last one |
| **Local ↔ remote** | verified in sync 2026-08-21 via the API for both suites — child lists match exactly, no orphan and nothing awaiting a push |
| **Both verified 2026-08-20** | `MOB.342`'s duplicate-deselect fix and `MOB.346`'s double-Escape fix both passed |
| **Archived** | `MOB.134` — five causes, four fixed, kept in `_archive/` · `MOB.711_AssetLookup_Column_Search` — un-wired from `MOB.995` and archived 2026-08-21 after two failures (trap 23: built from a grep hit; the box sits inside a `Menu.Dropdown` behind a `table-columns` icon and filters **checkboxes, not rows**) |
| **Waiting on the owner** | a **scheduled event** for the `In Progress` work order (unblocks `MOB.342`'s exclusion leg) · whether `bugs_found.md` §26 gets a characterization test |

#### ▶ START HERE NEXT SESSION

**One task, already scoped — finish `MOB.974`'s decisive probe.** It passed, but its headline
question is unanswered because the probe's own click locator missed (section B has the full
table; T1.6 and the diagnostic-pattern note carry the lesson).

1. **Read the DOM shape first — do not guess a second time.** Open the `Near Me` menu on
   `/asset-lookup` and read what a `Menu.Item` actually is: tag name, class tokens, and whether
   the label text sits directly on it or inside a `mantine-Menu-itemLabel` child. `MOB.730`
   already proves `document.querySelectorAll('.mantine-Menu-item')` finds these items, so the
   items exist — only the XPath form in `build_geo_probe.py` is wrong.
2. Fix that one locator, `DD_FORCE=1` the generator, **diff the JSON** (trap 19), push, re-run.
3. **The answer that matters is G3**: does the button label flip `Near Me` → `Within 100 mi`?
   That is the only evidence the app consumes the stub. G1 makes it likely; likely is not
   evidence.

**If G3 comes back green**, `MOB.730`'s 🛑 is wrong and its radius legs can be built — but the
real test must **re-apply the stub after every `go()`** (G7 measured), and it must restore
`asset_lookup_proximity_radius` belt-and-braces, because a stored radius silently filters and
re-sorts Asset Lookup for every later subtest in the session.

**If G3 comes back red**, that is a real finding — the app captured a reference or the runner
uses an isolated world — and geolocation goes back to Appendix C with evidence this time
rather than inheritance. Either way, delete `MOB.974` once it has answered.

**Cheap and independent of all the above** *(no probe needed, both already measured green)*:
promote `MOB.974`'s S1–S3b service-worker assertions into `MOB.470` — ~4 steps, closes T1.5
row 1, and `MOB.470` already reads `window.__mentorapm.shortVersion` so they belong together.
Remember the **two-step promise pattern** for `getRegistrations()`.

### The 2026-08-18/21 audit, in one place

*The corrections, indexed. Each is also written where it matters.*

**Rows that moved DOWN** — an audit that only finds more coverage is not an audit.

| row | was | is |
|---|---|---|
| `MOB.134` fill a form | `[~]` "not yet verified" | **never passed** — archived after 5 causes |
| `MOB.393` add form | "one-shot, will now fail" | **read-only** — which is what stranded `MOB.134` |
| `/work/:id/form/:formId` | `[-]` not automatable | `[x]` at **render** level (`MOB.355`); filling is `[-]` |
| Work detail "complete" | — | four surfaces were never listed |
| Asset Lookup tab count | "five" | **six** — the `Readings` tab |
| `typeId` "highest-value gap" | open | **dead code**, hiding a real bug (§26) |

**Surfaces nobody had written down** (all from walking or diffing `client/mobile`): Scheduled
Work + its menu toggle (`MOB.346`) · Asset Lookup `Readings` (`MOB.720`) · "Near Me"
(`MOB.730`) · the work detail's warranty banner (`MOB.399`), Assets tab (`MOB.347`), MapLink
(`MOB.348`) and record cycling (`MOB.349`).

**Two findings were mine and WRONG.** Kept, because the mistaken method is the reusable part:
- `MOB.900` "never run, in no suite" — **both false**; it is `MOB.990`'s 9th child. An empty
  leaf result-history means "never triggered directly" → **trap 20**.
- Every work-list test exercises `AssignedWork` — the **opposite**: the role is `SCHEDULED`
  and `scheduledView` defaults true, so they all run against `ScheduledWork`.

**Process failures worth more than any single test** — the tooling silently disagreeing with
itself: a generator's fix never reaching its JSON (**trap 19**, why `MOB.991` sat red), and a
suite's children being *dropped* by regenerating its generator (trap 19 reverse — five from
`MOB.986`, one from `MOB.995`). All three suite generators are now guarded.

**Depth by module.**

| Module | Depth |
|---|---|
| Work Orders | full CRUD — create, 6 status transitions, 4 charge types, 4 detail tabs, field edit; list search/sort/ring/map all covered. **Not** covered: filling an inserted form (`MOB.134` has never passed), the Scheduled Work view, and three off-tab surfaces |
| Asset Verification | verify/unverify loop, counter, tabs, search/filter/sort, attribute edit, event readings, map view |
| Search & filter | both systems — simple (`MOB.530`) and StructuredQuery (`MOB.800`); ordering proven (`MOB.580`), choice persisted (`MOB.810`) |
| Home screen | banner, six tiles, tile navigation, permission gating |
| Collector | create asset, proven by reading the record back |
| Asset Lookup | search, expand, tabs, per-field edit. **Not** covered: the `Readings` tab (a sixth tab, and a write surface) and the `typeId` branch |
| Material Lookup | storeroom select, item search, cycle-count adjustment (self-restoring) |
| The Map | style/layers/zoom, geocoder, create work from a pin; plus the in-module map views |
| Session & permissions | crew scoping and gating, both proven by negatives — 7 of 12 permission gates |
| Offline queue | **zero** — the highest-risk surface, unreachable with Datadog |

**Five things the checkmarks do not convey.**

- ~~`MOB.393` (add form) is **one-shot**~~ — **corrected 2026-08-18.** It was converted to
  **read-only** (`build_tab_tests.py:260-279`) and no longer submits, so it passes on every
  run. The consequence nobody recorded: it therefore **stopped attaching the `Inspection`
  form**, and `MOB.134` — which was built on the premise that MOB.393 had stranded one —
  lost its fixture. See T2.1.
- Attachments are blocked on the **backend**, not on test effort (trap 12).
- `MOB.600` creates a permanent asset per run; `MOB.991` a permanent work order; `MOB.550` one
  event reading per leg.
- **SB is proven on two lists** (mobile jobs, work orders). The other four modules rely on
  those — a search box elsewhere could be broken and nothing would catch it.
- **Every check above is a capability, not a detector** — runs are triggered by hand, so a
  green row means "this passed when someone last ran it", not "this is passing now". Record
  results plainly and re-run after changes; that is the workflow. *(Scheduling is settled —
  see the note below. Do not re-raise it.)*

## How much of Mobile is actually covered?

*Three numbers, because the honest answer depends on the denominator.*

| Question | |
|---|---|
| Of what Datadog **can** reach in a browser | **~65%** *(was ~70)* |
| Of the mobile app **as a whole** | **~45%** *(was ~48)* |
| Of "would **catch a regression** before a user hits it" | **~28%** *(was ~30)* |

> **Revised down 2026-08-18 after a walk of `client/mobile`** — the method this section has
> always prescribed, applied for the first time since it was written. It turned up four
> user-facing surfaces that no row had ever mentioned (Scheduled Work, the scheduled-view
> toggle, Asset Lookup's Readings tab, and three controls on the work detail), plus two rows
> crediting coverage that does not exist (`MOB.134` has never passed). The drop is small
> because the surfaces are small; the point is the **direction** — a
> list maintained only from the inside drifts upward, and this is the second time that has
> been measured.

**Why the whole-app number is much lower.** The unreachable part is disproportionately *the
mobile-specific part* — the offline transaction queue, service worker updates, geolocation,
camera capture, the native bridge, attachments. A technician working without signal is
exercising almost entirely untested code, and no amount of test-writing changes that from a
browser runner.

**Why the regression number is lowest, and why it is the one that matters.**

- **Runs are manual.** There is regression *capability*, not regression *detection*, and that
  is a deliberate choice rather than an omission — see the scheduling note.
- **Almost everything is a happy path.** We prove a form submits with valid input; we rarely
  prove it rejects invalid input or survives a slow network.
- **Fixture monoculture.** A handful of work orders, one mobile job, two assets, one storeroom
  item. `MOB.397` is the live demonstration: the same form behaved differently because one
  asset had workflows and another did not.
- **A green test is not necessarily a meaningful one.** `MOB.340` passed for weeks against an
  empty work list (`bugs_found.md` §25). Counting tests overstates coverage; that is why the
  percentage figures here are estimates and not derived from the item count.

**Derive these from the app, not from this file.** Any future percentage should come from a
walk of `client/mobile` — a count of this document's own rows cannot see what nobody thought
to list, which is exactly how the previous numbers drifted high.

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
  be reopened from mobile. ⚠️ **And nothing else is assigned either — the `Admin` crew's work
  list can be EMPTY** — it is governed by four server-side rules (`bugs_found.md` §25). A
  test that expects a work *row* can fail on data rather than on code; `MOB.310`/`MOB.320`/
  `MOB.134` are immune because they deep-link to the fixture by id.
- **Deleting a test from Datadog requires un-wiring it from its suite FIRST.** The API refuses
  with `"Unable to delete synthetics tests that are used as subtest in another test"`. The
  order is: remove the `playSubTest` step from the suite JSON → `push` → then delete. Learned
  while withdrawing `MOB.342`.
- **A new leaf's first `push` 400s every suite it was added to**, because its
  `subtestPublicId` is still `PENDING-WIRE-UP` while the leaf itself is being created. This is
  expected, not a failure: `push` → `wire_suite.py` → `push` again. The first push's summary
  line naming the suites is the signal to run `wire_suite.py`, not a reason to investigate.

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
| `dd_tools.work_list_gate(wait, require_row)` | readiness for the **work order list** — waits on `loadedAll`, which the map toggle silently depends on. ⚠️ Its LOADEDALL checks are absence assertions and **cannot poll** (trap 21), so use it only where `loadedAll` genuinely matters, and prefer `require_row=True` now the list is populated — that row guard *is* a polling positive |
| `dd_tools.work_view_toggle(to)` | **new 2026-08-20.** Switches the work list between the **Scheduled** and plain **List** views via the hamburger item, and asserts `sessionStorage['toggle_mobile_v_work']` afterwards. `to` is the view you want to END UP IN. Shared rather than copied because the menu label *flips* (it names the view you are going to, and is also the only readable proof of the current view) — and because three hand-rolled copies of `av_job_gate` were all subtly wrong. ⚠️ The item exists **only for a `SCHEDULED` role**, and the toggle **persists across the suite's shared session**, so any caller needs an `alwaysExecute` restore |
| `dd_tools.work_cache_warm(wait)` | **new 2026-08-20.** Warms the work lookup cache before a deep link and claims nothing else: navigate, assert the page mounted (positive, polling), wait. For `MOB.134`/`MOB.347`, which need a warm cache but not `loadedAll` — and which the racy gate above kept failing |
| `DD_FORCE=1 <build script>` then **diff** | the only way a generator's fix reaches its JSON — and the only way to find out they disagree (trap 19). Regenerate, diff against the committed JSON, and check the change is *only* what you intended before pushing |
| `step(..., always=True)` | Datadog's `alwaysExecute` — run a step even after an earlier one failed. For writes a later run depends on, and for restore legs (trap 16c) |

> **TODO — tag hygiene is unreliable, so do not filter on tags for safety.**
> **44 of 76 leaves carry no `read-only` tag**, and two that DO carry one should not.
> Until the table below is applied, the suite-level classification in *Coverage at a glance*
> is the source of truth for what mutates — **not** the tags.

### The classification — done 2026-08-20; applying it is what remains

*Classifying was the hard part. Three mutually exclusive tags, by **what a run leaves behind on
the SERVER**: `read-only` (no server write — a restored sessionStorage toggle still counts),
`self-restoring` (writes, then puts it back), `leaves-residue` (creates something mobile cannot
delete).*

- **`leaves-residue`** — `MOB.122` `MOB.300` `MOB.350` `MOB.360` `MOB.370` `MOB.380` `MOB.390`
  `MOB.391` `MOB.392` `MOB.396` `MOB.397` `MOB.550` `MOB.600` `MOB.870`
- **`self-restoring`** — `MOB.131` `MOB.200` `MOB.210` `MOB.220` `MOB.320` `MOB.395` `MOB.510`
  `MOB.545` `MOB.590` `MOB.710` `MOB.860`
- **`read-only`** — everything else, **including** the sessionStorage-toggling tests
  (`MOB.121` `MOB.341` `MOB.345` `MOB.346` `MOB.530` `MOB.585` `MOB.810`), which restore what
  they touch and never reach the server
- **`session`** — `MOB.000` (establishes one) and `MOB.440` (ends one); neither belongs in a
  suite with others

⚠️ **Classify by reading the STEPS, not by grepping the message.** `MOB.720`'s message mentions
residue precisely because it deliberately creates none.

⚠️ **Do NOT apply to the JSON alone** — generators pass their own `tags=[...]`, so JSON-only
tags are reverted by the next `DD_FORCE=1` regeneration (trap 19). Update generator and JSON
together.

`write()` refuses to overwrite existing JSON unless `DD_FORCE=1` — because the JSON, not the
generators, is the source of truth for anything hand-authored (trap 12).

> ## 🛑 Scheduling — SETTLED. Do not propose it.
>
> **Manual triggering is the intended mode. A decision, not a gap, and not a TODO.**
> Repo owner, 2026-08-21: it is a **separate concern** from coverage; **Datadog credits may be
> limited**; and the mutating suites leave undeletable records every run.
>
> **Do not raise it** — not as a recommendation, a next step, or the lesson from a test that
> drifted, even where a scheduled run genuinely would have caught something. If it becomes
> relevant, the owner will raise it.
>
> *Mechanics, for whenever that day comes:* all tests are `paused` with `tick_every: 86400`,
> and **`push` cannot change that** — `BODY_KEYS` omits `status`, so Datadog's own state
> governs (the same omission means `pull` drops the field). No MOB.* test is in
> `datadog-synthetics.yml`. The read-only suites (`MOB.985` `MOB.990` `MOB.992` `MOB.995`
> `MOB.996`) leave no residue and would be the safe candidates.

---

## Locator & assertion traps

*Twenty-four numbered traps (some with lettered siblings) — every one a way a test here has
already gone wrong. Most module notes are one-line pointers back to these. **18–24 are process
traps rather than locator traps**: how the tooling, the fixture, or the framing of a test
misled someone — which has cost more than any single bad XPath.*

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

**18 · A component can branch on VIEWPORT WIDTH, and `chrome.tablet` takes the DESKTOP
branch.** `FormDetails.tsx:106` renders the desktop form into `#apm-dv-tabpanel` when
`window.screen.availWidth >= 750`, and `<form id="senor-work-form">` only below that. The
tablet runner is above the threshold, so `MOB.134` spent its whole life targeting a container
that could not exist — and because trap 1 forbids adding a phone device, that branch is
**unreachable by this suite entirely, by design**. Cost: every step after the container
locator, on every run the test ever made.
Before writing locators for any form or detail view, grep the component for `availWidth`,
`innerWidth`, `useMediaQuery` or a Mantine `visibleFrom`/`hiddenFrom` prop, and write against
the branch the **tablet** takes. Where a screen has a phone-only branch, say so in the item
rather than leaving a test pointed at it.

**24 · THE RESULTS API LAGS A FINISHED RUN — an old "latest" result does NOT mean the run never
fired.** Hit 2026-08-21. A triggered run of `MOB.990` had actually completed, but
`get_browser_test_latest_results()` still returned the previous day's result as `[0]`. Reading
that literally produced the wrong conclusion — *"the run never fired"* — and a duplicate run was
launched on top of one already in flight. Five minutes later the real result appeared.

This is the **same failure mode as trap 20**, one layer out: treating an empty or stale API
response as evidence about the *world* rather than about the *query*. Before concluding a run
did not happen:

- **check the trigger's own output** — `dd_tools.py run` prints a live progress bar and a
  terminal `PASS`/`FAIL`; that is the authoritative signal, not the results list;
- **compare against `date`** — `report`'s age banner is the guard that exists for exactly this,
  so read it instead of the rendered timestamp, and note the API returns UTC;
- **never re-trigger to resolve the ambiguity.** Runs cost credits, and a duplicate of a
  mutating suite races the original on shared fixture state (trap 1's hazard by another route).

**23 · WHEN A TEST KEEPS FAILING, ASK WHETHER A SMALLER TEST CAPTURES MOST OF THE VALUE —
before fixing it again.** `MOB.134` (fill a work form) was attempted five times, each failure a
different cause, each fix another edit-and-hope run. It never passed. The repo owner then asked
the question nobody had: *forms are freely customisable — can we just assert the form RENDERS?*
Everything up to the typing had worked every time, so `MOB.355` was available from about
attempt two and passes on its first run.

**The failure was one of framing**: scope was treated as fixed while the implementation was
debugged over and over. So when a test resists —

- ask **what fraction of the value is in the part that already works**;
- separate *what is tested* from *how much must be proven*. A render check, a read-only walk,
  or an entry-point assertion often survives where an end-to-end write does not — `MOB.347`,
  `MOB.398`, `MOB.575`, `MOB.720` and `MOB.355` are all this shape deliberately;
- prefer **template-agnostic** assertions where content is user-configurable: naming a field or
  form is a fixture dependency waiting to rot, as `MOB.134`'s vanished `Inspection` form was;
- decide the reframing point in advance — *two failures is a signal about scope, not locators.*

⚠️ **Simplifying is not lowering the bar.** State plainly what the smaller test does NOT cover
(`MOB.355` records that it does not fill anything) so the gap stays visible rather than being
quietly redefined away.

**22 · A VIRTUALISED LIST MOUNTS ONLY WHAT IS ON SCREEN — never anchor on a NAMED row or
header.** The warning had no teeth while the crew's list was empty: everything fitted on one
screen, so whatever *should* render *did*. Once work orders were assigned it bit immediately —
`MOB.346` anchored on the `Today` group header, true of the component (`Today` never hides when
empty) but false of the DOM, because `Past Due` now occupies the top.
**Assert the SET, not a member**: `MOB.346` counts group headers (`>= 1` scheduled, `0` list),
which is scroll- and data-independent and still a real exclusive-or. Same for rows — a DOM row
count is not the result-set size, and "the first row is X" passes while the second is missing
(`MOB.580` compares POSITIONS for that reason).

**21 · AN `assertPageLacks` GATE CANNOT POLL, SO IT IS A TIMER, NOT A GATE — and timers rot
when the data grows.** An absence assertion is already true *before* loading starts, so its
only meaning comes from the blind `wait` in front of it. While the crew's work list was empty
20s was plenty; once it had stages the downloads outran 20s, then **45s**, failing `MOB.134`,
`MOB.346` and `MOB.990` identically. Raising it a third time is guessing.
**Gate on a POSITIVE signal that polls**, and pick the one the test actually needs: `MOB.346`
polls for its own group headers; `MOB.347`/`MOB.355` need only a warm cache, so they use
**`dd_tools.work_cache_warm()`**, which claims nothing it cannot prove. `work_list_gate` is
still right where `loadedAll` genuinely matters (the map toggle no-ops without it) — but with
the list populated, prefer `require_row=True`, whose row guard *is* a polling positive.

**20 · A LEAF'S RESULT HISTORY ONLY SHOWS DIRECT TRIGGERS — a subtest that runs inside a suite
has none.** `get_browser_test_latest_results(<leaf public_id>)` returns an empty list for
`MOB.100`, `MOB.110`, `MOB.121`, `MOB.170`, `MOB.180` and `MOB.900` alike — every one of which
runs, and passes, on every `MOB.990_Smoke` execution. The subtest's steps are reported inside
the **parent's** result, not as results of its own.
This produced a confident, wrong claim that `MOB.900` had never executed. **To find out
whether a leaf really runs, look at which suites wire it** (grep the suite JSON for its
`subtestPublicId`), and read the parent's report — `dd_tools.py report <suite>` lists each
child with its step count. An empty leaf history means "never triggered on its own", which for
a well-behaved leaf is the *normal* state, not a red flag.

**19 · A generator and its JSON can disagree indefinitely, and nothing warns you.**
`write()` refuses to overwrite existing JSON without `DD_FORCE=1` — deliberately, since the
JSON is the source of truth (trap 12). The cost is that a fix applied to a build script may
never reach the test: `MOB.134`'s `[last()]` scoping sat in `build_form_fill_test.py` while
the unscoped locator kept shipping to Datadog and failing, and the error message named a
locator that no longer existed in the repo. **When a test fails on a locator you believe you
already fixed, diff the JSON against the generator before debugging anything else** —
regenerate to a temp path and compare, so an unrelated `DD_FORCE=1` cannot clobber
hand-authored steps.

---

# Tier 1 — Mobile-specific risks

## T1.1 Offline & the transaction queue

`graphql/links/` implements an offline-first mutation queue: `QueueLink`,
`PersistedQueueLink`, `SerializeLink`, `ErrorLink`. `TopHeader` surfaces it via
`TransactionStatus` (`pendingCount`) and `PendingTransactionLogs`. Logout calls
`clearPersistedTransactionQueues()`.

- [-] Mutate while offline → operation queues rather than failing
- [-] Reconnect → queue drains in order (`SerializeLink`)
- [-] Queue survives an app reload while offline (`PersistedQueueLink`)
- [-] Pending-transaction count increments/decrements correctly
- [~] `OFFLINE_FEATURE_MESSAGE` appears on connection-dependent controls when offline
      ✅ **The offline STATE is now reachable — `MOB.910_Offline_UI`, verified 2026-08-21.**
      What `MOB.910` proves is the three `online` gates it targets (icon swap, Home tile, menu
      item). The `OFFLINE_FEATURE_MESSAGE` string itself is still unasserted — a cheap
      extension to `MOB.910` now that the state can be entered, not a new test.
- [~] Offline notice does **not** appear while online *(MOB.900 — was the only reachable half)*
      ✅ **Strengthened 2026-08-20.** It was two steps — navigate, then a lone
      `assertPageLacks` — which is trap 5's assertion that cannot fail: vacuously true on a
      blank page, an error page, or a page that never loaded. It now anchors on the welcome
      banner **and** the module tiles first, and confirms `navigator.onLine`, so the absence
      is evidence rather than a tautology. The `OFFLINE_FEATURE_MESSAGE` string was
      re-checked against `mobile/constants.ts` and still matches.

> ⚠️ **A retracted claim, kept because the method that produced it is still tempting.**
> A 2026-08-18 note here said MOB.900 "has NEVER RUN — zero results, in no suite". **Both
> halves were wrong.** It has been `MOB.990_Smoke`'s 9th child all along. The error came from
> reading `get_browser_test_latest_results()` on the leaf and finding it empty — see trap 20.
- [x] Transaction Log lists entries *(MOB.131 — verified 2026-08-13, 20 steps)* — it has to
      **make** a mutation first: the log reads `gql_log`, a localforage store in the browser,
      and every Datadog run starts with a fresh profile, so it is empty unless that session
      wrote something. Self-restoring (verify → unverify).
      ⚠️ The **pending/offline** half is still `[-]`: distinguishing a queued transaction from
      a completed one needs the network toggled off (Appendix C)
- [-] Logout clears pending queues — **not observable, and the obvious test would assert
      something false.** Logout calls `clearPersistedTransactionQueues()` → `persistanceLink
      .clear()`, which empties the *queue*. The Transaction Log page renders `gql_log`, a
      **separate** localforage instance that logout does NOT clear — so "the log is empty
      after logout" is simply wrong. The queue itself only surfaces as `pendingCount`, which
      is always 0 while online, and filling it needs the network off (Appendix C)

> 🔄 **"Synthetics has no network-toggle step" was true but drew the wrong conclusion, and it
> stood here for weeks.** It does not follow that *offline* is unreachable — the app never
> reads the network, it reads `useNetwork()`, and that is a dispatchable window event. See
> section B and `MOB.910_Offline_UI`. What **is** still out of reach is everything above that
> depends on the *real* network being down, because `graphql/index.tsx:68` reads
> `navigator.onLine` directly and a dispatched event does not change it. Those rows need
> **Jest** — and per D2, Jest does not cover them today either.

## T1.2 Uploads & attachments

`UploadLink`, tus resumable uploads, `TusUnauthorizedRetry`, `uploadManager.enqueue`,
`createThumbnailUpload`, and the `UploadLogs` status icon.

- [-] Attach a file — UI-authored only (trap 12) **and** fails server-side from a browser (§14)
- [-] Upload status icon reflects in-flight uploads — **not reachable from a browser.**
      `TopHeader/index.tsx` renders it as `{!!window.ReactNativeWebView && <UploadStatusIcon />}`,
      so it mounts only inside the Expo shell (T1.7).
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
      token. (Hard to test and corrupting tests *invalid* token handling, which is not the same thing)
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
- [-] Crew shortcut visible ≥450px / hidden below *(needs that read-only phone test; Bug §3
      is currently unexercised)*
- [-] Sticky search row and affixed create button remain reachable at phone width *(same blocker)*

## T1.5 Service worker & app updates

`workers/sw.js`, plus the `apply-update` control.

- [~] **Service worker registers — MEASURED REACHABLE 2026-08-21** (`MOB.974`, probes S1–S3b,
      all green). `'serviceWorker' in navigator` is true, `navigator.serviceWorker.controller`
      is **non-null** (one is actively controlling the page), and `getRegistrations()` returns
      **≥1**. `[~]` not `[x]` because the assertions live in a *diagnostic*, not a real test —
      promoting them is a ~4-step addition to `MOB.470` (which already reads
      `window.__mentorapm.shortVersion`, so the two belong together), not a new test.
      ⚠️ `getRegistrations()` is async and a JS assertion must return a boolean, so it needs
      the **two-step promise pattern**: kick the promise off in one step writing to `window`,
      read the result in the next
- [-] Update prompt appears and applies
- [-] Stale cache does not survive an update

## T1.6 Geolocation

`useGeolocation`, `GeolocateButton`, forms `mobile-geolocate` / `mobile-geolocate-offline`.

> **Two methods, three consumers — a stub built on the summary would miss one.**
> `ProximityMenu.tsx:28` and `GeolocateButton.tsx:27` call **`getCurrentPosition`**;
> `useGeolocation.ts:28` calls **`watchPosition`** + `clearWatch`.
>
> ⚠️ **`useGeolocation` is DEAD CODE in mobile** — its only consumer, `Map/index.tsx:61`, is
> commented out. Same shape as the `typeId` finding: a row that reads as a coverage gap but is
> not reachable behind any UI. Do not build a test for it.
>
> `GeolocateButton` is live in three places: the work-order **InsertForm**, `MapLink`'s
> `LocationForm`, and — via `AssetGeolocate` — Asset Collector, the Map card header, and the
> work-order **Assets** tab.

- [-] Geolocate populates address/lat/long on the work order form
      🟡 **Half-measured 2026-08-21** (`MOB.974`): the geolocation stub **installs and holds**
      (G1/G2), but whether the app consumes it is still unknown — the probe's own click locator
      missed, voiding G3–G6. It also does **not** survive a navigation (G7), so any real test
      must re-apply it after every `go()`. See section B
- [-] Geolocate disabled/messaged when offline — **now the most promising of the three.**
      `GeolocateButton.tsx:101` renders a `Popover` containing `OFFLINE_FEATURE_MESSAGE` when
      `!online`, and `MOB.910` has already proven the offline state is enterable. ⚠️ But the
      button is `disabled={!online}` on an `ActionIcon component="span"` whose `onClick` is
      what opens the popover — so whether the message can be *reached* by clicking is an open
      question, not an assumption. Probe before building
- [-] Real device GPS behavior — **only truly-unreachable row of the three;** a stub proves the
      app's handling of a position, never the device's

## T1.7 Native shell bridge

*✅ Resolved — everything here is Expo-shell only.*

`utils/WebviewBridge/ReactNativeBridge` (`haptic`, `window.ReactNativeWebView`).

- [-] Haptics · native upload · anything gated on `window.ReactNativeWebView` — Expo shell only

---

# Tier 2 — Module functionality

## T2.1 Work Orders

*List page covered by MOB.341–345. Suites: `MOB.991` (**13** children after MOB.134 was
un-wired) and `MOB.986` (11).*

> ⚠️ **"Detail page complete apart from decisions" — struck 2026-08-18.** That claim held only
> for the *tabs*, and only for the tabs somebody had listed. A walk of `WorkDetails.tsx` found
> the **Assets tab** unlisted (with two uncovered controls of its own), plus three surfaces
> outside the tab strip entirely — `MapLink`, the warranty alert banner, and
> `RecordCycleButtons`. All four are now rows below. The tabs really are near-complete; the
> *page* was not.

*Suite `MOB.991_WorkOrders_Suite` — 13 subtests. Mutates and leaves residue. Fixture
`EYRpYJ9QYdQ1JFF10JtB0Q`. ⚠️ **At Datadog's execution ceiling — put new work-order tests in a
new suite** (Appendix F0); `MOB.985_WorkDetail` exists for that.*

> ✅ **GREEN again as of 2026-08-18 — twice consecutively** (18:03 and 18:13, 474s, all 13
> children). Verified by running it, not by inference.
>
> ⚠️ **It had been RED, and the reason was a broken sync, not a broken app.** The previous note
> here (*"the 14th, `MOB.134`, has never run and has no `public_id`"*) was stale on both
> counts: it holds `ddb-hg4-a9b` and had run four times, failing every time. All 13 other
> children passed; `MOB.134` alone took the suite down, and is now un-wired until it can pass.
>
> **The sync failure is the transferable lesson.** `MOB.134`'s locator had already been fixed
> in `build_form_fill_test.py`, but `write()` refuses to overwrite existing JSON without
> `DD_FORCE=1` — so the fix sat in the generator while the old locator kept shipping. *A
> generator and its JSON can disagree indefinitely and nothing warns you.* When a test fails
> on a locator you believe you fixed, diff the JSON against the generator before debugging
> anything else.

### Create — entry points

- [x] From Work Order module *(MOB.300)* — affixed `+` → workflow lookup → submit. Modal-close
      is genuine proof here: `closeModal()` sits inside Apollo `update()` with no optimistic
      response (trap 6)
- [x] From the **Mobile Map** *(MOB.122)* — all four create entry points are now covered
- [x] From a **Mobile Job asset** *(MOB.396 — verified 2026-08-12, 28 steps)* — ⚠️ leaves a
      real work order per run. `AddWorkButton defaultAsset={asset}` on the asset detail
- [x] From **Work Orders**: *assign follow-up work* *(MOB.397 — verified 2026-08-12, 30
      steps)* — ⚠️ leaves a real work order per run. Reached via the gear menu on an
      **expanded** asset row, with both workflow filters turned off first (note below)

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
- [-] Fill out an inserted form — **NOT AUTOMATABLE**; `MOB.134` archived 2026-08-21 after five
      causes, the last measured: typed text never lands in the field. The RENDER half is
      covered by `MOB.355`. *(Superseded note follows:)* drives
      the `/work/:workStageId/form/:formId` route (`WorkFormDetails`), the **only** entry in
      `MOBILE_ROUTES.WORK.children` (corrected: this said "the third route").
      **SELF-RESTORING**: writes `DD FORM EDIT` into the first field, re-navigates to prove it
      came back from the server, then clears the field back to empty — its measured rest
      state. The field **saves on blur, not on change** (so the test tabs out), and the proof
      is a re-navigation + JS read rather than the toast.

> **MOB.134 had never passed, and the reason was not a locator typo.** Three independent
> defects, all found by measuring the live page with `MOB.977_DIAG_FormField_Probe` rather
> than by reading code. Recorded in full because each one generalises:
>
> **1 · It targeted a container that cannot exist on this device — see trap 21.**
> `FormDetails.tsx:106` is `if (window.screen.availWidth >= 750 && form?.fields)`. Above the
> threshold the DESKTOP form renders into `<div id="apm-dv-tabpanel">`; only *below* it does
> `<form id="senor-work-form">` render. `chrome.tablet` measures ≥750, so every locator in the
> original — all built on `#senor-work-form` — was aimed at the phone branch, which trap 1
> forbids us from ever running. **A tablet takes the desktop branch.**
>
> **2 · Its fixture had quietly evaporated.** It opened the card named `Inspection`, on the
> premise that `MOB.393` had stranded one there. MOB.393 was later made read-only and stopped
> attaching anything, and the probe measured **zero** elements whose exact heading is
> `Inspection` — while ≥2 merely *contain* that substring, because Mantine keeps inactive tab
> panels mounted and the Condition tab reads "Inspection Group" (trap 3). That substring match
> is what produced *"Multiple elements found"*. It now opens the **first form card in the
> visible panel** and names no form at all: its subject is filling *a* form, and a locator
> that does not depend on fixture naming cannot rot when the fixture is cleaned from desktop.
>
> **3 · Its warm-up was blind.** It waited 20s on `/work` then deep-linked. The `Admin` crew's
> work list is EMPTY on dev (§25), so there was no row to wait for and the wait proved
> nothing — the first leg's readiness assertion failed while later legs passed, which is the
> signature of a wait that is not a gate. Now uses `work_list_gate(require_row=False)`.
- [x] **Assets tab and its status controls** *(MOB.347 — built 2026-08-20, in `MOB.985`)*.
      *Never listed as an item until 2026-08-18, though partly exercised.*

> 🛑 **`Mark as ...` WRITES IMMEDIATELY — no modal, no confirmation, no undo.**
> `AssetStatusIcon`'s menu items call `applyStatus({ status })` straight from `onClick`.
> `MOB.347` opens the menu to prove it renders and **never clicks an item** — same standing
> rule as `Delete Item` in `MOB.397`'s gear menu. The menu also filters out the current status,
> so assert `<= 4` options, never a fixed count.
>
> **`MOB.347` asserts trap 8 directly — the first test that does.** An untouched
> `AssetStatusForm` has an inert `type="button"` Submit that does nothing when pressed. The
> trap has been documented since `MOB.380` broke on it; nothing had asserted the mechanism.
> **READ-ONLY**: restoring a status needs the prior value fed back into a locator, which
> Datadog cannot do. The `Progress:` badge doubles as a **fixture guard** for `showAssetStatus`
> (owner-confirmed 2026-08-20).

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
> ⚠️ **"Forms are low priority for mobile" was about TRIGGERS, not about forms.** Clarified by
> the repo owner 2026-08-21: **filling in forms is wanted coverage.** That is
> `/work/:workStageId/form/:formId` — the route `MOB.134` drives, currently archived. The
> deferral below applies only to the status-change trigger items, which turn out not to exist
> in mobile at all. Do not read it as forms being out of scope generally.

- [-] **Status-change FORM TRIGGERS — traced 2026-08-21, and they are NOT MOBILE BEHAVIOUR.**

> These three sat open for weeks on the assumption that the fixture workflow might have
> triggers configured. It does not matter: **`client/mobile` has no such code path.**
> `StatusMenuIcon.updateStatus` has exactly ONE conditional branch —
>
> ```js
> if (requireStatusNotes) { modal.open(<StatusNotesForm .../>) }
> else { updateWorkStage(newStatus) }
> ```
>
> — and nothing anywhere in the module reacts to a status change by opening a form, creating
> follow-up work, or adding a work stage. The `Assign`/`Create Follow-up Work` strings exist
> only in the gear menu on a collection item (`components/ui/Menu.tsx`), which is
> user-initiated and already covered by `MOB.397`.
>
> **So these are desktop concepts** → Appendix B, not open mobile items. *(The lesson is the
> same one `typeId` taught: read the render path, not just the handler — three items were
> "open" against code that does not exist.)*

### `requireStatusNotes` — the one real, uncovered branch here

- [-] **The status-notes modal — DELIBERATELY NOT COVERED** (repo owner, 2026-08-21).
      A decision, not a gap: enabling it would **rework `MOB.320`** rather than add a test.
      Kept out of the open count so "open" keeps meaning remaining work.
      `WorkDetails.tsx:106` passes
      `requireStatusNotes={template.requireStatusNotes}`, and when it is on **every** status
      change opens `StatusNotesForm` before committing. The fixture template has it **off**,
      which is why `MOB.320` walks all six transitions and never sees it.
      **To enable**: desktop → *admin → mobile job template* → the `WORK_ORDER` template used
      by fixture `EYRpYJ9QYdQ1JFF10JtB0Q` → toggle **`requireStatusNotes`**
      (`TemplateHierarchy.tsx:89`, beside `showAssetStatus`).
      ⚠️ **This REWORKS a green test rather than adding one.** `MOB.320` drives six
      transitions; with notes required each gains a modal to fill and submit — every future
      status change in the suite becomes slower and more brittle, to cover one modal.
      **If it is ever turned on, `MOB.320` must be updated in the same change or it goes red
      immediately.**
- [-] Change status: permit — negative test · approve permit — **Permits are READ-ONLY data
      in mobile** (repo owner, 2026-08-12). The tab displays them; approving and the
      status-gating workflow are not mobile actions. Not a gap
- [-] Submit form with signature widget — freehand canvas
- [x] **SB** — search bar *(MOB.340 opens it; **MOB.343** proves it filters)* — MOB.340
      asserts the box holds a term and the Sort Criteria modal opens/closes. That is a control
      check only, and it passed for weeks against an empty list (`bugs_found.md` §25). MOB.343
      is the real proof: a term nothing can match must drive the row count to **zero**, and
      clearing it must bring the rows back. NB the placeholder is **`Find Workstage(s)`**
      (trap 9 — an attribute, not page text)

### Work list

> **The list is crew-scoped by four server-side rules**, all of which must hold — assigned to
> your crew · status `In Progress`/`On Hold`/`Ready` (or `Complete`/`Pending` inside
> `workRetentionHours`) · **not** tied to an asset verification job · plus a scheduled event if
> the role's `mobileDownloadMode` is `SCHEDULED`. Full detail and the SQL to check each is in
> `bugs_found.md` §25. If this list ever looks empty again, read that first — it is almost
> never a locator fault.
>
> ⚠️ **Rows are virtualised.** Virtuoso renders only what is on screen, so a DOM row count is
> **not** the result-set size. Never assert legend counts against rendered rows.

- [x] **Map view toggle** *(MOB.341)* — `WorkOrders/index.tsx:223` renders
      `ToggleMapViewButton`; `:281` swaps the list for `WorkMapView`. Gated on
      `permissions.map.read`.
      **Proof is `sessionStorage['show-mobile-work-map']`**, not the icon (trap 16).
      ⚠️ **Self-restoring out of necessity.** Datadog reuses one browser session per suite, so
      a run ending in map view leaves every later work-order subtest looking at a map. Restore
      leg is `alwaysExecute` (trap 16c).
      ⚠️ The click is a **silent no-op until `loadedAll`** — `loadedAll ? setMapView(...) :
      undefined` — so `work_list_gate()` must run first (trap 5).
      Icon names measured (trap 14): `faGlobe` → `globe`, `faList` → `list`.
- [x] **Status ring + legend** *(MOB.342)* — the analogue of `MOB.560` on the job list.
      **The proof is a computed style.** A work row never renders its status as text
      (`listFieldsToDisplay` is `_assets` and `address` only), so status lives solely in the
      row's `borderLeft`; every rendered row must be `rgb(155, 203, 82)`
      (`STATUS_COLORS.Ready` = `#9BCB52`). This is why **status colour is not an honest `[-]`**
      — unreachable from XPath, reachable from `getComputedStyle`.
      ⚠️ **The exclusion half is not proven.** Every work order in the crew's list is `Ready`,
      so no status hides anything, and a single-status list cannot distinguish "filtered
      correctly" from "did not filter" (trap 5). To complete it, set one work order to
      `In Progress` and assert no row is Ready-green while that status is selected.
      ⚠️ `Pending` is desktop-only here (`notMobile`), and `Superseded` is misspelled
      **`Supersesed`** in the source (`bugs_found.md` §24) — match the typo until it is fixed.
- [x] **Search filters the list** *(MOB.343)* — see the SB row above.
- [x] **Tapping a row opens its work order** *(MOB.344)* — the actual user path, which every
      other work-order test skips by deep-linking. It also covers a guard deep-linking cannot
      reach: `WorkListItem`'s onClick bails while `!loadedAll || lookupDownloadProgress ||
      downloadingStages.has(id)`, so a row tapped early is inert.
- [x] **SCHEDULED WORK — a whole third view of this screen** *(MOB.346 — VERIFIED 2026-08-20, green in `MOB.990`)*.
      *(Found 2026-08-18 by walking `client/mobile`, exactly as the "count coverage from the
      app, not from this file" note warns. The feature landed 2026-08-13 and had been live and
      untested for five days — see* Codebase sync *.)*
      `WorkOrders/index.tsx:319` picks between **three** views, not two:
      `mapView ? <WorkMapView> : showScheduleWork ? <ScheduledWork> : <AssignedWork>`.
      It renders a `GroupedVirtuoso` under four collapsible headers — **Past Due** (red,
      hidden when empty) · **Today** · **Tomorrow** (collapsed by default) · **Future**
      (collapsed by default, hidden when empty) — each with a count and a chevron.

> 🔄 **THE SCHEDULED VIEW IS THE DEFAULT, which inverts an assumption.**
> `showScheduleWork = role.mobileDownloadMode === 'SCHEDULED' && scheduledView`, and
> `scheduledView` defaults **true**. The `Admin` role was set to `SCHEDULED` on 2026-08-20, and
> Datadog starts each run with empty sessionStorage — so **every work-list test runs against
> `ScheduledWork`**, and `AssignedWork` is the view nothing exercises without the toggle. An
> earlier draft here said the opposite.
>
> ⚠️ Two side effects of that role change, both of which bit: a `SCHEDULED` role only sees
> stages that also carry a **scheduled event** (`bugs_found.md` §25 rule 4), which is why
> `MOB.342`'s exclusion leg still cannot see an `In Progress` work order; and the feature was
> **live for the owner but unreachable for the test account** until the role changed, which
> cost `MOB.346` three runs. **Check the test account's role before concluding a locator is
> wrong.**

- [x] **`WO_SCHEDULED_SORT` — the scheduled view's own sort mode** *(MOB.346, read-only leg)*.
      `id: 'SCHEDULED_WORK'`, label **`Scheduled Grouping`** (`SortDropdown.tsx:12`), forced as
      `orderBy` whenever this view is active (`index.tsx:60`) and skipped by `applySortValue`
      (`:172`), so rows keep schedule-date order. `MOB.345` structurally cannot see it.
      ⚠️ **A trap 10 self-degrading picker, and a one-way door within a session.**
      `SortDropdown.tsx:49` offers `Scheduled Grouping` *only while it is already the current
      value*, so choosing anything else removes it from the options — and `orderBy` resets to
      it only when `/work` REMOUNTS. Selecting would also persist to
      `sessionStorage['mobile-WorkStage-sort']`, which **`MOB.345` asserts** — a cross-test
      hazard in a suite sharing one browser session.
      So `MOB.346` asserts the option is **present** (which proves it is the active sort) and
      **selects nothing**. Covering the selection would need its own suite, not a new leg here.
- [x] **Work order record cycling** *(MOB.349, in `MOB.985`)*.
      ⚠️ **On a deep-linked page the arrows are actively BROKEN, not inert**: `records` is `[]`,
      so `newId` resolves to `''` and the click navigates to `/work/` with the id blanked. A
      deep-linked test would "prove" cycling against a control that cannot work — `MOB.349`
      walks the list and taps a row (the `MOB.344` path), which is why every other work-order
      test missed it. Proof is `location.pathname`, stashed in `sessionStorage` because Datadog
      cannot carry a value between steps. Self-restoring, `alwaysExecute`.
      **Needs ≥2 work orders**, guarded up front so a one-row list fails as fixture, not code.
      ⚠️ Two cyclers here share the same icons (`RecordCycleButtons`, `InfiniteTabs`'
      `CycleButtons`) — scoped to the group carrying the MapLink globe (trap 3).

- [x] **`MapLink` on the work order title** *(MOB.348, in `MOB.985`)* — a globe menu with
      **View in Map** and **Edit Location**; the latter opens `LocationForm`, a write surface
      on `address`/`x`/`y`. **READ-ONLY** (restoring needs the original values).
      ⚠️ **`View in Map` is asserted but NEVER clicked** — it navigates away to `/map`.
      **Only one disabled state is asserted, deliberately**: `View in Map` is data-gated on
      `x`/`y` (asserting it either way would be a fixture test), while `Edit Location` is
      role-gated on `work.update`, which every suite already guards — so that one is asserted
      ENABLED and fails on drift.

- [x] **The warranty alert banner** *(MOB.399)*. `WorkDetails.tsx:80` shows
      *"Assets Related to the Work Order are under Warranty"* when `hasActiveWarranties` holds
      — a real date/reading comparison, not a render.
      ⚠️ **Asserted as a CONSISTENCY check, not a presence check**: the banner needs a still-
      ACTIVE warranty while the Warranties *tab* lists expired ones too, so "the banner is
      present" would be a time bomb that fails the day the fixture lapses and says nothing
      about the code. Instead: no warranties → absent; a positive `Remaining Days` → present.
      Either way one branch holds. Same exclusive-or shape as `MOB.720`; it cannot rot.
- [x] **Sort applies and persists, AND the ordering really reverses** *(MOB.345 — VERIFIED
      2026-08-21, 46 steps, green in `MOB.986`)* —

> 🔄 **`MOB.345`'s ordering leg failed because of the VIEW, not the sort.** Four diagnostics
> settled it in one run, all passing: same row count, same row set, the order **did** change,
> and **group headers were present**. So the sort reordered — but `ScheduledWork` re-buckets
> rows into Past Due/Today/Tomorrow/Future, so order is group-major and DESC is not the
> *global* reverse of ASC. (`index.tsx:172` also skips `applySortValue` entirely while the
> sort is `SCHEDULED_WORK`.) **Fixed by switching to the plain list first** via
> `dd_tools.work_view_toggle`, with an `alwaysExecute` restore. **Verified green 2026-08-21** —
> its first-ever green ordering leg.
>
> ⚠️ `assert_reversed` was also mis-documented: its comment claimed the count/set checks made a
> failure "distinguishable", but all three paths returned the same falsy value. Splitting them
> into separate optional diagnostics is what made one run enough.

## T2.2 Asset Verification

*Suite `MOB.993_AssetVerify_Suite` — **10 subtests**, 22 suite-level steps, passed 2026-08-18.
(Corrected 2026-08-18: this read "3 subtests, 76 steps, passed 2026-08-10" long after seven
more children were wired in.)
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
- [x] Asset list left / right arrow navigation *(MOB.570 — verified 2026-08-13, 25 steps)* —
      forward, **wrap-around** (2 assets, so forward twice returns to the start), and back.
      Each click targets the arrow beside the asset just asserted, so it is immune to there
      being more than one `RecordCycleButtons` on the page

### Add assets

- [-] Add a **new** asset to a verification job — `NewAssetForm` (`Job.tsx:13`, as
      `NewAssetButton`). Appendix A
- [-] Add an **existing** asset to a verification job. Appendix A

> Both are non-revertible and would permanently grow the fixture job, breaking the
> verification assertions that name the asset count. They need a throwaway job plus a desktop
> cleanup cadence.

### Map view

- [x] **Map view toggle** on the job asset list *(MOB.585)* — `Job.tsx:212` renders the same `ToggleMapViewButton` as the work
      list, and `:230` swaps the accordion for `JobAssetMap`. Gated on `permissions.map.read`.
      **The proof is `sessionStorage['show-mobile-asset-ver-map']`** (trap 16) plus the Mapbox
      canvas plus the accordion disappearing.
      ⚠️ **A different key from the work list** (`show-mobile-work-map`), same persistence
      hazard — a run ending in map view would put every later AV subtest on a map, so the
      restore leg is `alwaysExecute` (trap 16c).
      ⚠️ Unlike the work list there is **no `loadedAll` guard** — `onClick={() =>
      setMapView(!mapView)}` — so the toggle is live immediately. The readiness problem here is
      the `cache-only` detail route, which `av_job_gate` handles.
- [-] **Asset markers carry verification state** — `JobAssetMap` colours each marker
      `verified ? 'green' : 'blue'` and only plots assets that have **both** `latitude` and
      `longitude`. Marker colour is painted into WebGL, not the DOM, and tapping a marker to
      reach the `MarkerInfo` popup is a **canvas hit-test** — the same barrier as
      `ChangeAssetPopup` (T2.6, Appendix C). `MOB.585` deliberately asserts nothing that
      depends on a marker existing, since it is also unknown whether the fixture's assets
      carry coordinates at all.

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
- [x] Failures — form opens on the asset detail *(MOB.575 — verified 2026-08-13, 32 steps)*
      — READ-ONLY by design: MOB.391 already proves this form mutates, so this covers the new
      part (pre-bound asset, and the `!asset.failureProfileId` gate passing) and cancels.
      ⚠️ Fixture-dependent — `Tank 0000` has a failure profile; if that is removed this fails
      on the placeholder, which is a fixture change not a regression.
      *The placeholder half cannot be covered here for the same reason.*
- [x] Condition — form opens on the asset detail *(MOB.575)* — same shape as Failures
      above: MOB.390 proves the mutation, this proves the entry point and that the
      `!asset.assetStandardId` gate passes
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

*All enumerated items resolved. Suite `MOB.994_Collector_Suite`. **Mutates and does NOT self-restore**
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

*Suite `MOB.995_AssetLookup_Suite` — **read-only**, safe to schedule. 2 children
(`MOB.700`, `MOB.720`). ⚠️ Not complete:
`EditForm`'s `typeId` branch is the most destructive control in mobile and is untested.*

- [x] Alphanumeric lookup *(MOB.700)* — searches `Pump 0102`; server-side `CONTAINS`, so
      trap 11 does not apply here
- [x] Asset card caret *(MOB.700)* — expands the first result
- [x] Tabs render *(MOB.700)* — asserts the strip mounts and that **Work History** exists.
      NB Work History embeds its own `StructuredQuery` (twice), so it is not a plain list
- [-] **Tag Lookup / Scan Barcode** — one control, not two. Needs a camera, and routes through
      an OpenAI call, so non-deterministic regardless

### The `typeId` edit branch — resolved 2026-08-20, not as expected

- [-] **`CopyAttributesConfirmation` is DEAD CODE from mobile.** Nothing to click:
      `index.tsx:45-49` sets `allowUpdate: false` on `typeId`, and `RecordInfoTable.tsx:92`
      renders the pencil only when `col.allowUpdate && canEdit`. So the handler at `:180`
      never fires and `UPDATE_TYPE_OF_ASSET` is never called; neither symbol is referenced
      anywhere else in `client/mobile` or `client/src`.
      *This row used to read "the gap that matters most in T2.4" — inferred from the handler
      without checking whether its trigger renders. **Read the render path, not just the
      handler.***

- [-] **Editing Asset Type on the AV detail is BROKEN — `bugs_found.md` §26.** That screen uses
      a different component (`AssetGeneralInfo` → `DetailPage/GeneralInfo`), where `typeId` IS
      editable. Submitting paints it optimistically, toasts `Record Updated` from inside
      `update()` before any server reply, never applies it (`UPDATE_ASSET` is the wrong
      mutation), and reverts. **The toast reports success for a write that never happened.**
      Mobile has the careful path disabled and the careless one exposed.
      **Not covered, deliberately.** A characterization test is possible (`MOB.820`'s shape)
      but is an owner decision, and only worth it if the fix is not imminent.

*Both search systems here are owned by T3.3: the simple **SB** block, and **`StructuredQuery`**
— this screen is its main home (the other is the Work History tab). `MOB.800` covers it.*

> **There is no search button.** The `SearchInput` sits in a `<form onSubmit>`, so search is
> submitted with **Enter**; the visible "Add N Asset(s)" button belongs to the embedded picker
> flow. ~~The inherited list also gave four tabs — there are **five**.~~ **Corrected
> 2026-08-18: there are SIX.** `AssetLookupDetails/index.tsx:95-101` appends a conditional
> `Readings` tab — see below. The count has now been wrong twice; read the `template` memo,
> do not count what a screenshot shows.

- [x] **"Near Me" proximity search** *(MOB.730 — VERIFIED 2026-08-21, green in `MOB.995`)* —
      *NEW FEATURE, landed 2026-08-21* (`21e388b5b7`,
      `AssetLookup/ProximityMenu.tsx`). Found by diffing `client/mobile`, three days after the
      last full walk — which is the cadence the *Codebase sync* table is meant to enforce.
      A `Near Me` button opening a menu of radii — **5 / 10 / 25 / 50 / 100 miles** — plus
      `Update my location` and `Clear` once a radius is active. The button's own label flips to
      `Within {n} mi`, which makes it assertable state rather than a screenshot check (the same
      shape as `MOB.121`'s style button).
      🟡 **"The location half is Appendix C" is NO LONGER a settled claim — under active
      revision as of 2026-08-21.** `MOB.974` measured that
      `navigator.geolocation.getCurrentPosition` **is writable** in a Datadog runner and the
      stub holds across steps (G1/G2), so *"Synthetics cannot satisfy it"* is at best
      incomplete. Whether the **app** consumes such a stub is still unmeasured — `MOB.974`'s
      own click locator missed and voided that half of the run. Read section B before treating
      any of the "not assertable" list below as fixed. Everything the test *does* assert
      remains valid.
      ⚠️ **Split the coverage as originally reasoned.** Every menu item calls
      `locate()` → `navigator.geolocation.getCurrentPosition`, and a denial surfaces only as
      `toast.error`. So:
      **assertable** — the button renders, the menu opens, the five radii and the labels are
      right, `Search radius` heads the list, and `Update my location`/`Clear` appear only once a
      radius is set;
      **not assertable** — that a radius actually filters results, since that needs a real fix.
      ⚠️ It also persists `sessionStorage['asset_lookup_proximity_radius']`, and on mount an
      `initialRadius` triggers `locate()` **automatically** — so a stored radius makes the page
      request geolocation on load. `MOB.730` asserts the key is empty **before and after**, so
      it can never be the thing that sets it; that is the third persistence hazard here, after
      the two map toggles and the view toggle.
      **What `MOB.730` proves**: the button renders with its no-radius label, the menu is
      headed `Search radius`, exactly the five radii are offered (asserted as a SET and a
      count), and `Update my location`/`Clear` are **absent** while no radius is set — the
      `{!!value && ...}` branch. It never clicks a radius.

- [x] **The `Readings` tab — the sixth tab** *(MOB.720 — built 2026-08-20)*.
      *(Found 2026-08-18 by walking `client/mobile`.)* `AssetLookupDetails` appends
      `{ id: 'event_readings', title: 'Readings' }` when `permissions.event.read`, rendering
      `AssetEventReadings` with `canCreate={permissions.event.create}` — plus
      `AddReadingTypes`, which has no counterpart anywhere else in mobile.
      ⚠️ **This is not the same component as `MOB.550`'s.** MOB.550 covers Asset
      *Verification*'s `EventReadings/index.tsx`; this is
      `AssetLookup/AssetLookupDetails/EventReadings.tsx`. Two different files, two different
      screens — the "three edit surfaces, not seven" note below is about `EditForm` /
      `GeneralInfo` / `Attributes` and does **not** absorb this one.
      ⚠️ Because `AssetLookupDetails` is the component reused by **three** entry points (Asset
      Lookup, the Collector's asset details, the asset rows inside a verification job), this
      tab is missing from all three at once — the same leverage that makes `MOB.710` valuable
      works against us here.
      **`MOB.720` is READ-ONLY by design.** Submitting calls `CREATE_EVENT` per filled field
      and mobile cannot delete, so every run would leave permanent `Event` rows — exactly what
      `MOB.550` already does, and `MOB.550` already proves that write path. `MOB.720` covers
      what is genuinely new here: the entry point, the field list derived from reading
      history, and the `AddReadingTypes` picker. **Do not make it submit** without deciding to
      accept the residue.
      It cannot go vacuous: `Pump 0102` may or may not have readings, so it asserts an
      **exclusive-or** of the `recorded recently (in 24h)` progress row and the
      `No readings recorded for this asset.` empty state — if the panel renders nothing,
      neither holds and it fails (trap 5). The picker's modal has **no cancel button**
      (`withCloseButton: false`), so it is dismissed with Escape, and `Add` is asserted
      DISABLED while nothing is selected, which proves the gate without selecting anything.
      ⚠️ Still uncovered here: actually **capturing** a reading from this screen.

## T2.5 Material Lookup

*All enumerated items resolved. Suite `MOB.998_MaterialLookup_Suite` — mutates stock, and is
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

*The map **is** reachable — WebGL, the Mapbox canvas and the geocoder all render (`MOB.979_DIAG_Map_Probe`, 2026-08-13). Only the freehand drawing tools are out.*

> **This section covers the `/map` route only.** `MobileMap` is also embedded inside two other
> screens — `WorkMapView` on the work list and `JobAssetMap` on the job asset list — and both
> of those are untested. They are listed under T2.1 and T2.2, where their toggles live, not
> here.

- [x] Change map style · map layers *(MOB.121 — verified 2026-08-13, 22 steps)* — the style
      button carries its state in `data-tooltip-content`, flipping `Satellite`↔`Street`, so
      clicking it and asserting the *other* label is a genuine state change. Self-restoring
- [~] Zoom in/out *(MOB.121)* — `[~]` on purpose: Mapbox does not publish the zoom level to
      the DOM, so this proves only that the controls exist and clicking them does not break
      the map. **Do not upgrade to `[x]`** on the strength of it
- [x] Search (the geocoder) *(MOB.122)* — typing an address returns suggestions and picking
      one flies the map and opens its popup. ⚠️ depends on Mapbox's API
- [x] Create a work order from the map *(MOB.122 — verified 2026-08-13, 25 steps)* — ⚠️
      leaves a real work order per run, **and is the only mobile test with a third-party
      dependency**: the geocoder suggestions come from Mapbox's API, so an outage or rate
      limit fails it for reasons unrelated to MentorTwo. Walks the real chain (type ≥5 chars →
      suggestion → fly-to → popup → Add Work), asserting each link
- [-] Add asset to work order — **the popup is DOM, but reaching it is not.**
      `ChangeAssetPopup` ("Attach one or more assets to this work stage") only opens when a
      work-order **feature on the canvas** is tapped: `onTouchEnd` →
      `queryRenderedFeatures(event.point)`. Map features have no DOM element, so Synthetics
      cannot target one — same barrier as the drawing tools, not a coverage gap
- [-] Create asset: lasso · marker · line · polygon
- [-] Create work order: lasso · marker · line · polygon
- [-] Get directions · get street view — leave the app

*Search here is the shared **SB** block, owned by T3.3.*

---

## T2.7 Home screen

*`routing/Home.tsx`, route `/`. The first screen of every session and the `resync()` landing
target (`TopHeader` navigates to `/` before `client.resetStore()`), so a break here is visible
to every user on every launch. Covered by `MOB.180` (green in `MOB.990`) and `MOB.210`.*

- [x] **Welcome banner** *(MOB.180)* — asserts `Welcome,`, then in JS that the greeting is
      **not** `Welcome, Friend!` and the org line is **not** `- No Associated Organization -`.
      Rejecting the fallbacks is what makes this evidence that `GET_SESSION` resolved, rather
      than evidence that a heading exists (trap 5)
- [x] **The six module tiles** render, and the `Work Orders` tile navigates *(MOB.180)* — six
      element checks plus a JS count, so a tile lost to a permission change fails the count
      even if the other five still render
- [x] **Tile permission gating** *(MOB.210)* — under `Admin (0000)` every tile must vanish.
      With the menu items, gating is now proven on **7 of 12** gates
- [x] **`No valid permissions` empty state** *(MOB.210)* — the positive half of that proof.
      Six absence checks would all pass on a blank page; this one fails if Home rendered
      nothing at all (trap 5)
- [x] **Asset Lookup tile hidden when offline** *(MOB.910 — verified 2026-08-21)* — gated on
      `permissions.asset.read && online`. Proven **present first**, then proven gone after the
      `offline` dispatch; the other tiles are asserted to survive (≥3), so this reads as gating
      rather than a failed render. Previously `[-]` on the belief that it needed the real
      network off — see section B
- [-] **Trial-mode tile disabling** — `window.__mentorapm.isTrial` disables every tile except
      Asset Collector. Needs a trial org

> **Locate tiles by the `img` alt, never by title text.** Each tile renders
> `<img alt="icon for {title} url">`; the hamburger menu renders the **same six titles** with
> an `<img>` that has **no** alt. A text match would pass with every tile missing — and
> `MOB.210` has the menu open two steps earlier (trap 5b). Tile assertions run with the menu
> **closed**.

> **Datadog has no `assertElementAbsent`.** Tile absence is a JS count of
> `img[alt^="icon for "]`, since the alt is an attribute, not page text (trap 9).

> 🛑 **`routing/HomeWidgets.tsx` and `Layout/NavFooter.tsx` are DEAD CODE** — never imported,
> and rendered inside a comment block, respectively. Do not write tests for them; they are
> unreachable, not uncovered. `bugs_found.md` §23.

---

# Tier 3 — Navigation & chrome

*Well covered. Each nav test asserts `PageTitle`'s `h4` against `MOBILE_ROUTES` — the crew-
and data-independent signal that a route rendered.*

## T3.1 Routes

- [x] Mobile App / login landing *(MOB.000)*
- [x] **`/` — the Home route** *(MOB.180)*. ⚠️ It cannot gate on a
      page title like every other nav test: `PageTitle` opens with
      `if (location.pathname === '/') return null`, so Home has **no `#page-title` and no back
      arrow**. The readiness signal is the welcome banner. Owned by **T2.7**
- [x] Collector / Lens *(MOB.160)* · Asset Lookup *(MOB.100)* · Material Lookup *(MOB.110)*
- [x] Work Orders *(MOB.150)* · The Map *(MOB.120)* · Transaction Log *(MOB.130)*
- [x] Dev Logs *(MOB.170)* — menu item hidden unless env is `development`/`development2`
- [x] **Dev Logs page contents** *(MOB.171 — built 2026-08-20, in `MOB.990`)*. `MOB.170`
      asserts the page title only; this covers the screen. The level `Select`
      (`default`/`info`/`verbose`) persists to `sessionStorage['log_level']`, so the proof is
      the stored value rather than the input's label (trap 16) — and it is **self-restoring**,
      because a suite shares one browser session and leaving it on `verbose` would change
      logging for every later subtest.
      🛑 **Two buttons are asserted but NEVER clicked**: **Email me the JSON** POSTs to
      `/api/attachment/email` (it would send real mail on every run), and **Clear Logs** calls
      `logger.clearAllLogs()`, wiping the store the test asserts against. **Refresh** is the
      only safe button and is the one clicked.
      The list is asserted as an exclusive-or of entries vs the `No logs found.` empty state,
      so it cannot pass by rendering nothing (trap 5).
- [x] `/work/:workStageId/form/:formId` — **COVERED AT RENDER LEVEL** *(MOB.355 — green first
      run, 2026-08-21, in `MOB.985`)*. The last route in mobile with no passing test.
      **Template-agnostic**: it names no field, form or count — work forms are freely
      customisable — and asserts the shape the renderer always produces: the route,
      `#apm-dv-tabpanel`, ≥1 `.ws-form-widget`, real inputs inside those widgets, and the
      trailing `Progress` bar that proves the whole component rendered rather than its first
      child.
      ⚠️ **What it does NOT cover: filling a field.** That is stated here rather than quietly
      redefined away —

- [-] **FILLING a work form — not automatable from Synthetics.** Settled 2026-08-21 by
      measurement, after five attempts and five distinct causes.
      The route is reachable and the form renders; what fails is that **typed text never lands
      in the field** — `MOB.134`'s DIAG-1 showed the value unchanged *before* the blur, so the
      save gate is never even reached. Click, `Control+A` and `typeText` all report success
      while nothing changes.
      The contrast that makes this specific rather than general: `MOB.395`, `MOB.710` and
      `MOB.545` all type successfully in the same suite run. They drive
      `GeneralInfo`/`EditForm`/`Attributes`; this screen renders the **desktop** `Form.tsx`
      through `react-grid-layout`, and that combination resists.
      Full record — all six causes, including one I got wrong — in
      `dd_tests_mobile/_archive/README.md`. **Reviving it needs new evidence, not another
      locator.**
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
- [x] **Toggle Work Order List / Scheduled View** *(MOB.346)* — *unlisted until 2026-08-18.*
      `TopHeader/index.tsx:131` renders a menu item whose label **flips** between
      `Toggle Work Order List View` and `Toggle Work Order Scheduled View`, writing
      `sessionStorage['toggle_mobile_v_work']`. It is the only way to reach `AssignedWork`
      (T2.1), and its label-flip makes it the same shape as `MOB.121`'s style button — a
      genuine state change readable without a screenshot. Hidden unless
      `mobileDownloadMode === 'SCHEDULED'` **and** `permissions.work.read`.
      ⚠️ Same persistence hazard as the map toggles: it survives the whole suite session, so
      `MOB.346`'s restore leg is `alwaysExecute` (trap 16c) — keep it that way.
- [x] **Asset Lookup menu item hidden when offline** *(MOB.910 — verified 2026-08-21)* —
      *unlisted until now.* `TopHeader` drops the item on `!permissions || !online`. Proven
      **present first**, then proven gone after the `offline` dispatch, with the rest of the
      menu (Work Orders / Transaction Log) asserted intact so the absence is gating rather than
      a menu that failed to open. Was assumed to need the real network off — see section B
- [-] Switch Crews — Close button — does not exist (`withCloseButton: false`); dismissal is
      Cancel or click-outside

### Header status icons

*`TopHeader` renders four things to the right of the crew label that no test asserts.*

*All covered by `MOB.470_Header_Status_Icons` (green in `MOB.992`). READ-ONLY: the crew modal
is opened and escaped, never submitted.*

- [x] **Version string** *(MOB.470)* — `Version: ` + `window.__mentorapm.shortVersion`. The
      cheapest real deploy signal in the suite: the only place a synthetic run can see which
      build is live. Asserted **twice** — the rendered prefix, and a JS read proving the value
      behind it is non-empty *and* actually on the page, because `'Version: ' + undefined`
      renders the prefix perfectly well (trap 5)
- [x] **`NetworkStatusIcon`** *(MOB.470 + MOB.910)* — **both halves covered as of 2026-08-21.**
      `MOB.470` has the online half: `wifi` present **and** `wifi-slash` absent, so a component
      stuck on the offline icon fails, paired with a `navigator.onLine` sanity check.
      `MOB.910` now has the offline half — after the `offline` dispatch, `wifi-slash` present
      **and** `wifi` gone, so the swap is proven in both directions rather than one.
      Icon names **measured** (trap 14): `faWifi` → `wifi`, `faWifiSlash` → `wifi-slash`
- [~] **`TransactionStatus` pending count** *(MOB.470)* — `[~]` on purpose. `if (!count)
      return null` and the count is always `0` while online, so the only online assertion is
      **absence**. That proves the `!count` branch and nothing else (trap 5); the meaningful
      half needs the network off
- [-] **`UploadStatusIcon`** — Expo shell only, see T1.2. `MOB.470` asserts
      `!window.ReactNativeWebView`, so the *reason* it is unreachable is checked rather than
      assumed
- [x] **The crew shortcut `<span class="mobile-crew">`** *(MOB.470)* — opens the same
      `RoleSelection` modal as the menu item, which `MOB.430` only ever reaches from the menu.
      Dismissed with Escape, nothing submitted, so no crew changes. NB Bug §3 concerns its
      visibility below 450px, still blocked on phone-width coverage (T1.4)

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
| Offline **QUEUE** behaviour (T1.1) | `graphql/index.tsx:68` reads `navigator.onLine`, which a dispatched event does not change — so requests still go out and the queue cannot be exercised. ⚠️ **Jest does not cover it either**: `QueueLink`, `PersistedQueueLink`, `SerializeLink` and `ErrorLink` have **no tests anywhere**. Highest-risk surface in the app, unprotected in both harnesses — and the cheapest fix is a **Jest** test, not a Synthetics one |
| ~~Offline **UI**~~ | ✅ **NO LONGER TRUE — corrected and COVERED 2026-08-21** by `MOB.910_Offline_UI` (green in `MOB.990`). Row kept struck-through, not deleted, because the reasoning that made it wrong is the lesson. See the note below Appendix C |
| Upload resume / tus retry (T1.2) | Requires interrupting a transfer |
| Camera capture (T1.2, T2.3, T2.4) | Requires device camera; tag scan also calls OpenAI |
| Browser-originated attachments (T2.3) | Backend limitation, not a harness one — `bugs_found.md` §14 |
| Native shell bridge (T1.7) | Only active inside the Expo shell |
| Map **canvas interactions** (T2.6) | anything needing a tap on a rendered feature — the drawing tools, and `ChangeAssetPopup` (add asset to work stage). Features are hit-tested via `queryRenderedFeatures(event.point)` and have no DOM element. **The map itself IS reachable** — WebGL, canvas, geocoder, style/layers/zoom controls all work (probe + MOB.121/122) |
| Signature widget (T2.1) | Freehand canvas |
| Directions / street view (T2.6) | Navigate out of the app |
| Color assertions | Assert the label instead — though `getComputedStyle` reaches it from JS, which is how `MOB.342` proves status colour |

> ## 🔄 THE OFFLINE **UI** IS REACHABLE — measured 2026-08-21
>
> Appendix C said offline was unreachable because "Synthetics has no network-toggle step".
> True, and irrelevant: **the app does not read the network.** It reads `useNetwork()` from
> `@mantine/hooks`, which is
>
> ```js
> useWindowEvent("offline", () => setStatus({ online: false, ... }));
> ```
>
> So a `Run JavaScript` step can `window.dispatchEvent(new Event('offline'))` and flip every
> offline branch. `MOB.975_DIAG_Offline` proved it in one 55s run — **all ten probes passed**:
> the icon became `wifi-slash`, the online icon went, the Asset Lookup **tile** vanished from
> Home, the Asset Lookup **menu item** vanished, and an `online` dispatch restored everything.
>
> ✅ **Shipped as `MOB.910_Offline_UI`** — 27 steps, green in `MOB.990_Smoke` on 2026-08-21.
> The probe is therefore settled and `MOB.975` can be deleted (section F).
>
> ⚠️ **The limit, which matters as much as the unlock.** `navigator.onLine` stays **true**
> (probe A4), so requests still go out. This can prove *the UI reacts to going offline*. It can
> **never** prove the transaction queue queues, drains, or survives a reload. Do not let a
> green offline test be read as queue coverage.
>
> **The same technique probably reaches** geolocation (stub
> `navigator.geolocation.getCurrentPosition` — would unlock `MOB.730`'s radius legs and
> `GeolocateButton`) and **service-worker registration** (`navigator.serviceWorker` is
> readable). Neither is attempted yet.
>
> **The general lesson**: an item marked *not automatable* is a claim about the HARNESS, and it
> ages badly. This one had been inherited and never re-tested. Before trusting such a row, ask
> what the app actually reads — it is often a JS-reachable observable rather than the physical
> thing the row names.

# Appendix D — Open questions

**Only 2 are still open.** Ask the repo owner — these are questions *for them*, not puzzles to
engineer around. Q7 sat open for days while tests were built to route around it; asking took
one sentence.

| # | Question | Blocks |
|---|---|---|
| **1** | Should `MOB.140`'s "Find Mobile Job(s)" check be **critical**? Only if the test crew always has ≥1 mobile job. | one `optional` step that can currently skip silently |
| ~~2~~ | ~~How often should **mutating suites** run?~~ **CLOSED 2026-08-21** — runs are manual, so this is answered by whoever triggers one. Each run of `991`/`994`/`986`/`987`/`998` still leaves undeletable records, so trigger them deliberately rather than out of habit. Not a scheduling question. | — |

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

## Lessons that outlived their audit

*Kept because each one would otherwise be re-learned the hard way. The audit narrative itself
is in git; these are the durable bits.*

- **The route table's `permission` field is decorative.** Nothing reads
  `MOBILE_ROUTES[].permission`. Real gating is in `Home.tsx` and `TopHeader/index.tsx`, and
  Material Lookup gates on `storeroomlocation`, not the `storeroomitem` the table claims.
- **Two components are dead code** — `routing/HomeWidgets.tsx` (never imported) and
  `Layout/NavFooter.tsx` (rendered inside a comment block). Recorded so a component-by-
  component audit does not log them as coverage gaps. `bugs_found.md` §23.
- **Colour is reachable from JS**, just not from an XPath. `getComputedStyle` reads a row's
  status border, which is how `MOB.342` proves filtering on a list whose rows never render
  their status as text.
- **Count coverage from the app, not from this file.** Percentages derived from these rows
  cannot see surfaces nobody listed — the entire Home screen sat unlisted for months.
- **Writing a test finds more than reading code does.** The empty work list, the vacuous
  `MOB.340`, and the reachability of colour all surfaced while building, not while auditing.

# Appendix F — making the suite faster

## F0 · Datadog's MAXIMUM TEST EXECUTION TIME is a hard ceiling

*Measured 2026-08-20. It changes suite ARCHITECTURE, not just suite speed.*

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
across 1823 steps** (measured 2026-08-20), with the bulk still concentrated in waits of ≥10s —
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
| suite-wide waits | 1975s | **1832s** *(measured 2026-08-13; now **2300s** as twelve tests landed after the pass — the reduction held, the total did not. Do not read this row as regression)* |
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

# Where to pick up next

*Only **2** items are `[ ]` open and both are blocked, so the checkbox count is no longer the
useful lens. The remaining ground is in the six sections below, in value order — **B is the
largest available unlock**, and D corrects a claim this document has been making for weeks.*

## A · Close the PARTIALS — cheapest real gains

**Done 2026-08-21** — the search sweep and the collapse leg:

| was partial | closed by |
|---|---|
| `SB` proven on one list only | **`MOB.531`** ✅ (AV job assets) and **`MOB.610`** ✅ (Collector) — both green |
| Asset card expand only | collapse leg added to **`MOB.520`** ✅, asserted via `aria-expanded` (the panel's contents stay mounted when closed, so asserting their absence would be wrong — trap 3) |

> 🗄 **`MOB.711` (column-picker search) was PARKED after two failures** — archived, un-wired,
> and noted in `build_lookup_tests.py`. It filters the column PICKER's checkboxes, not records,
> which makes it the lowest-value box of the three; trap 23 says stop rather than guess a third
> locator. Two things learned and worth keeping: the box lives inside a `Menu.Dropdown` behind
> a `table-columns` ActionIcon (it does not exist until opened), and **`selectedColumns`
> persists to `localStorage`** — so a test here must never tick a checkbox, or it permanently
> changes which columns every later run displays. That is the **fourth** persistence hazard
> here, after the two map toggles, the view toggle and `asset_lookup_query`.

> The "other five modules" figure was stale. A grep of `<SearchInput` plus a read of what each
> test asserts found only **three** genuinely unproven boxes — and one of them, the column
> search, was in no list at all because it filters the FIELD list rather than records.

**Still partial, needing a fixture answer, not a test:**

| item | what it needs |
|---|---|
| AV job-list sort **ordering** (`MOB.530`) | **≥2 known mobile jobs.** `MOB.580` established the position-comparison shape; only one job is known, so the pattern cannot be applied |
| `MOB.140`'s job-search step is `optional` | confirmation the crew **always** has ≥1 mobile job, then make it critical |

**Deliberately partial — leave them:** `MOB.398` (a real assign hits trap 10) · `MOB.121` zoom
and `MOB.460` resync (neither publishes an observable result).

## B · Make OFFLINE UI testable — the correction to Appendix C

### ✅ DONE — `MOB.910_Offline_UI` shipped and verified 2026-08-21

Measured first (`MOB.975_DIAG_Offline`, ten probes green in 55s), then built. `useNetwork` —
which drives every offline branch — is `useWindowEvent("offline", ...)`, so a JS step can
`window.dispatchEvent(new Event('offline'))` and flip the app offline **with no network change
at all**. `MOB.910` is wired into `MOB.990_Smoke` as child 14 and **passed all 27 steps** in
the 13:40 run.

What it closed:

| was | now |
|---|---|
| `MOB.470`'s `[~]` — only the online icon was assertable | `wifi-slash` proven, and the online icon proven **gone** |
| T2.7 `[-]` — Asset Lookup **tile** gates on `&& online` | tile proven present, then proven hidden |
| T3.2 `[-]` — Asset Lookup **menu item** gates on `!online` | item proven present, then proven hidden |

**Three things make it trustworthy, and they are the pattern to copy for any state-flip test:**

1. **Every negative is paired with a baseline asserted *before* the dispatch.** "The tile is
   absent" is equally true of a page that never rendered (trap 5). Proving it present first is
   what converts absence into evidence.
2. **The survivors are asserted too** — other tiles ≥3, other menu items intact. That is what
   separates *gating* from *a broken render*.
3. **It self-restores, `alwaysExecute`.** A suite shares one browser session, so a run left
   offline would hide half the app from all 13 later subtests — the same hazard class as the
   map toggles but with far wider blast radius. The restore working is not assumed: every
   downstream subtest in the run stayed green, which *is* the proof.

⚠️ **It does NOT unlock the queue, and a green run must never be read as if it did.**
`graphql/index.tsx:68` reads `navigator.onLine`, which a dispatched event does not change, so
requests still go out — `MOB.910` asserts `navigator.onLine === true` explicitly so the limit
cannot be quietly forgotten. *"The UI reacts to going offline"* is covered; *"mutations queue
and drain in order"* is not, in **either** harness (see D2).

### 🟡 PARTLY MEASURED — `MOB.974_DIAG_Geolocation`, 2026-08-21, PASS in 230s

Two of the three questions are answered. **Read the void column before acting on this table.**

| probe | result | what it means |
|---|---|---|
| **G1** the stub assignment sticks | ✅ | `navigator.geolocation` is a readonly *accessor*, but its **methods are writable** — `getCurrentPosition = fn` holds. This was the whole premise |
| **G2** it survives to the next step | ✅ | same page, no navigation — the stub persists across Synthetics steps |
| **G7** it survives a **navigation** | ❌ | **it does not.** A real test must **re-apply the stub after every `go()`** — a genuine constraint on how any geolocation test is written, and much cheaper learned here |
| **S1 / S2 / S3b** service worker | ✅✅✅ | readable · **controlling the page** · **≥1 registered** → T1.5 row 1 unlocked |
| **G3 / G3b / G4 / G5 / G6** | ⚫ **VOID** | **not negative results — no result at all.** See below |

⚫ **G3–G6 prove nothing, and must not be read as "the app ignored the stub."** The step that
clicks `100 miles` **failed on its locator** —
`//*[contains(@class," mantine-Menu-item ")][normalize-space(.)="100 miles"]` matched nothing —
so `locate()` was never called. Every assertion after it was measuring a page where nothing had
happened. This is the cascade shape trap 5 warns about, in its most seductive form: five red
rows that *look* like a finding.

**The locator is the bug, not the app.** `MOB.730` already reads the same items successfully
via `document.querySelectorAll('.mantine-Menu-item')`, so the items exist under that class —
the XPath form is what missed. ⚠️ **Do not re-run this probe until the element shape has been
read from the DOM** rather than guessed a second time; a guess is what cost this run its
headline answer.

**So the decisive question — does the APP consume the stub? — is still open.** G1 makes it
likely; it is not evidence. Cost to settle: one locator fix and one run.

### Still open in B

- **Geolocation, the app-side half** — above. Fix the click locator, re-run `MOB.974`.
- **`OFFLINE_FEATURE_MESSAGE` via `GeolocateButton`** — see T1.6: the popover is opened by an
  `onClick` on a **`disabled`** `ActionIcon component="span"`, which may swallow the click.
  Probe it; do not assume it either way.

Both get the same discipline: **one read-only probe run to measure, before anything is built on
the assumption.** That order is what made the offline work cheap — the alternative is `MOB.134`,
which cost five speculative runs and never passed. `MOB.974` shows the discipline is not
automatic protection: a probe whose *own* locators are guessed inherits the same problem.

## C · DEEPEN what is already ticked

**Almost everything is a happy path.** A test proving a form submits with valid input will not
catch the bug that matters. `MOB.343`, `MOB.530`, `MOB.720`, `MOB.347` and the new search tests
carry real negatives; most others do not. Candidates: the charge forms' required-field gating
(`MOB.350`–`MOB.380`, the trap 8 mechanism `MOB.347` now proves once) and empty states, which
are unproven either way on several panels (§21).

## D · The genuinely unreachable block — and it is smaller than recorded

**~53 `[-]` items**, disproportionately mobile-specific. But two corrections:

1. **Some of it moves to B above** — the offline UI, geolocation and service-worker
   registration are not unreachable, only unattempted.
2. ⚠️ **Jest does not cover the gap either.** The checklist said the offline queue "needs
   Jest". `client/mobile` has **218 Jest test files**, but `graphql/links/` has 7 source files
   and only **2** tested (`UploadLink`, `TusUnauthorizedRetry`). **`QueueLink`,
   `PersistedQueueLink`, `SerializeLink` and `ErrorLink` have no tests anywhere**, and
   `workers/` has none. The highest-risk surface is unprotected in *both* harnesses — and the
   cheapest fix is a Jest test, not a Synthetics one.

## E · Blocked or owner-decided — recorded so they are not re-litigated

| item | |
|---|---|
| `MOB.342` exclusion leg | needs a **scheduled event** on the `In Progress` work order. Two fixture changes on 2026-08-20 interacted: a `SCHEDULED` role only sees stages that have one (§25 rule 4), so the work order dropped out of the list. The leg is preserved in `build_work_ring_test.py`'s header |
| Verify status update (job list) | one-way status (§10). A throwaway fixture would unlock this **and** all four Appendix A items |
| Status badge colour | not expressible; `MOB.342` covers colour where it matters via `getComputedStyle` |
| Placeholder states, Failures/Condition | `Tank 0000` has both a profile and a standard, so neither placeholder can render |
| Form FILLING (`MOB.134`) | archived — typed text never lands (`_archive/README.md`). The RENDER half is `MOB.355` |
| `typeId` | dead code in mobile; the editable AV path is **broken** (§26) |
| `requireStatusNotes` | deliberately not covered — enabling it reworks `MOB.320` |
| Status-change form triggers ×3 | not mobile behaviour at all → Appendix B |
| §26 characterization test | owner decision |

## F · Maintenance

- **Re-sync with `development` and diff `client/mobile`** — the *Codebase sync* table at the
  top, on a regular cadence and always before quoting a coverage number. It has already earned
  itself twice: Scheduled Work shipped 2026-08-13 and sat unlisted for five days, and a
  persisted-search change on 08-21 would have broken `MOB.720` unnoticed.
- **Tag hygiene** — 44 of 81 leaves carry no `read-only` tag. The classification is **done**
  (see *The classification*); applying it is mechanical, but must touch generator **and** JSON
  together or the next `DD_FORCE=1` reverts it (trap 19). Until then *Coverage at a glance* is
  the source of truth for what mutates, **not** the tags.
- **Delete the diagnostics** when their question is settled: `MOB.977` (form field — settled,
  `MOB.134` archived) · `MOB.979` (map — settled) · **`MOB.975` (offline — settled 2026-08-21,
  `MOB.910` shipped green)** · **`MOB.974` (geolocation — keep until its click locator is fixed and re-run; its question is still OPEN)** · `MOB.978` (keep while the work-list fixture is in flux).
- **Finish the Appendix F rollout** on short waits. The `/work` lookup waits are not
  convertible — see Appendix F.
- `MOB.800` could drop ~12 steps by removing filters via the pills rather than the drawer.

> **The diagnostic pattern is worth copying.** A Datadog JS assertion returns only a boolean,
> so it can never say *what* a value is. `MOB.977` got around that with **mutually exclusive
> hypotheses**, each an `optional` step: the report names the answer by which one passed.
> Two rules make it work — every hypothesis is `always=True` (trap 16c) so an early failure
> cannot suppress the data, and exactly one **non**-optional guard remains so it cannot pass
> vacuously on a blank page (trap 5).
>
> ⚠️ Three ways it has bitten: a standalone diagnostic must borrow `MOB.000`'s login steps and
> declare `extra_globals=("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD")`, or every locator misses;
> a helper that wraps bodies in `return {expr}` silently breaks multi-statement probes —
> that produced three invalid results in `MOB.977` and cost a wrong conclusion;
> and — `MOB.974`, 2026-08-21 — **a probe's own locators must be as well-founded as the thing
> it is probing.** One guessed XPath on an intermediate `click` step failed, and the five
> `optional always` assertions after it dutifully returned falsy, producing a block of red that
> read exactly like a finding. `optional`+`always` is what makes a diagnostic legible, and it
> is also what lets a broken step masquerade as data. **A probe answers its question only as
> far as its own setup steps are green** — check those first, before reading any hypothesis.
