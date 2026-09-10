# Mobile — test authoring reference

*Split out of `testing_checklist.md`, which had grown to 2,530 lines. **Nothing here is coverage
state.** This is what you consult while WRITING a test; the plan answers what is left to write.*

| file | question |
|---|---|
| `testing_checklist.md` | **What is left to do?** Open work, blockers, tier rows, appendices |
| `coverage.md` | **What do we have, and what does a green run PROVE?** |
| **`test_authoring.md`** *(this file)* | **How do I write one without repeating a known mistake?** Fixtures · the cleanup chore · operational rules · the locator & assertion traps |
| `bugs_found.md` | **What did the tests find?** |

🛑 **The traps are the load-bearing part.** Each one is a mistake that has already cost at least
one run here. Read the relevant trap *before* debugging a locator, not after.

---

**What lives down here, and why it is down here:**

| | |
|---|---|
| **Fixtures** | the data the tests depend on |
| **Operational notes** | how to build, push and wire a test |
| **Locator & assertion traps** | **28** numbered ways a test here has already gone wrong — the single most valuable section when writing one, and the single most distracting when reading coverage |
| **Appendices A–F** | scope decisions, harness limits, speed |
| **Forensic record** | retracted claims and what caused them. Never needed for daily work; kept because the *reasoning* that produced a wrong row is what stops the next one |

📌 **This half is append-only. That is intended.** New lessons land here so Part 1 can stay
the size of a thing a person actually reads.


## Fixtures

| Fixture | Id | Used by | Must stay |
|---|---|---|---|
| Work order | `EYRpYJ9QYdQ1JFF10JtB0Q` | MOB.310–395 | assigned to crew `Admin`; `desc` is owned by MOB.395 and ends every run as `DATADOG FIXTURE` |
| Mobile job | `Z0EVwQcdJZhMURcBFkp0E0` "DATADOG MOBILE JOB" | MOB.500–570 | crew `Admin`, `IN_PROGRESS`, exactly **2 assets** — currently named **`⚡ Tank 0000`** (the symbol is part of the stored name) and `A/C Motor 0002` — neither verified. `reset_av_fixture.py --check` asserts all of it for 0 runs; match these names by **containment**, never equality (trap 29) |
| Asset | `Pump 0102` | MOB.390/391 (attached), MOB.700 (search), MOB.710 (edit) | exists, attached to the work order; `desc` is owned by MOB.710 and ends every run as `DATADOG FIXTURE` |
| Asset type | `Actuator Tools` | MOB.600 | exists |
| Storeroom | `Central Storeroom` | MOB.850/860 | visible to crew `Admin`, `canAdjust` on |
| Storeroom item | `000-000-000 Adamantium` | MOB.850/860 | in that storeroom; quantity is restored by arithmetic each run |

Session role must be exactly **`Admin`** — not `Admin (0000)` or `Admin (0100)`, which lack
work create/update. Every login-bearing test asserts this immediately after login so drift
fails fast with a legible message.

---

## 🧹 THE DESKTOP CLEANUP CHORE — what a script has to do

> ➡️ **`cleanup_spec.md` is the live definition** — it adds the feasibility pass this section
> lacks: which mutations actually exist, and **two findings that change the design** (a work order
> deletes only as a *leaf*; charges can only be **reversed**, which makes the table bigger rather
> than smaller). It also carries the open questions. **Read it before building anything.**
> What is below is the marker inventory it builds on.

**Why it has to exist at all.** Mobile has no delete for any of this (trap 2; `bugs_found.md`
§10 for the one-way status). Fourteen tests are tagged `leaves-residue`, and the residue is
**per run, not per suite** — every run of `MOB.991`/`MOB.994`/`MOB.986`/`MOB.987`/`MOB.998`
adds another set. Nothing prunes it today, so dev accumulates indefinitely and two fixtures
(`Central Storeroom`'s stock, the mobile job's status) **drift in one direction**.

🛑 **READ THIS BEFORE WRITING A LINE OF IT — the deletions and the fixtures overlap.**
Most residue hangs off records that **must survive**. A script that matches too broadly takes
the fixtures with it and breaks ~40 tests at once:

| ❌ never delete | why |
|---|---|
| Work order `EYRpYJ9QYdQ1JFF10JtB0Q` | the fixture for `MOB.310`–`395`. Its `desc` ends every run as **`DATADOG FIXTURE`** — a *different* marker from the residue one, and deliberately so |
| Asset `Pump 0102` | fixture for `MOB.390`/`391`/`700`/`710`; its `desc` also ends as `DATADOG FIXTURE` |
| Mobile job `Z0EVwQcdJZhMURcBFkp0E0` "DATADOG MOBILE JOB" | fixture for `MOB.500`–`570`. **Reset it, never delete it** — see below |
| Workflow **`Datadog Test`** | a **fixture workflow**, not residue. Every created work order selects it, so its name appears all over the residue — deleting it breaks creation entirely |
| Asset type `Actuator Tools` · `Central Storeroom` · `000-000-000 Adamantium` | fixtures |

### 1 · Records to DELETE — created fresh every run

*Match on the marker, not on the workflow name. `DD SYNTHETIC MOBILE` is the residue marker;
`DATADOG FIXTURE` is a fixture marker; `Datadog Test` is a fixture **workflow**.*

| what | created by | how to find it |
|---|---|---|
| **Work orders** ×4 per full pass | `MOB.300` · `MOB.122` (from the map) · `MOB.396` (from an asset) · `MOB.397` (a follow-up) | `desc` starts **`DD SYNTHETIC MOBILE`**. `MOB.300` writes it bare; the other three append a per-run `{{ RUNID }}`, so prefix-match rather than equals |
| **Asset + its ATTACHMENT** | `MOB.600` | name **`DD SYNTHETIC MOBILE <8 digits>`**, `desc` **`Created by Datadog Synthetics - safe to delete`**, type `Actuator Tools`. ⚠️ **The attachment is new** — a collect from a browser no longer errors on its photo, so every run now leaves a photo as well as the asset. Delete both |
| **Charges ×4** on the fixture work order | `MOB.350` equipment `AC Adapter` · `MOB.360` labor `Dev Eloper` · `MOB.370` material `0000-0000 Diaphragm Pump` from `Central Storeroom` · `MOB.380` other, `Other Charge Types`/`Dev Eloper` | all qty **1**, on work order `EYRpYJ9…`. Delete the CHARGE rows, not the work order |
| **Condition record** | `MOB.390` | `Structural` / `Mounting/Support`, ratings 1·2·3, against `Pump 0102` on the fixture WO |
| **Failure record** | `MOB.391` | `BELT (R-L1)` / `MISSED` / `TIME`, against `Pump 0102` on the fixture WO |
| **Note** | `MOB.392` | body **`This is a note - DD SYNTHETIC MOBILE`** |
| **Event readings ×2** | `MOB.550` | values **`4242`** and **`1337`** on the mobile job's assets. ⚠️ `MOB.550` **reads a previous run's value back on a cold cache as its server proof** — so deleting these is safe but it will re-create them next run; do not "fix" the accumulation by changing the test |

### 2 · State to RESET — not deletions, and mobile cannot walk them back

| what | who moves it | reset to |
|---|---|---|
| ⭐ **Mobile job status** — flips to `COMPLETED` when its **last** asset is verified | the Asset Verification tests | **`IN_PROGRESS`**. This is the **per-run reset decision** in 🟡 BLOCKED: it unlocks the verify-status-update test **and all four Appendix A rows**. Desktop can do it (`work/mobileJob/details/index.tsx:75` renders an editable `status` `FormField`). ⚠️ A `COMPLETED` job also stays in the crew's list with a different badge, which perturbs `MOB.535`'s row set and `MOB.560`'s arithmetic |
| **`000-000-000 Adamantium` quantity** — **+1 every run, one-way** | `MOB.870` (stocking) | decrement by the number of runs since the last tidy. ⚠️ `MOB.860` is the `+1`/`-1` pair and **self-restores** — only `MOB.870` drifts. **Do not "fix" this by making MOB.870 two-way**; the checklist already warns against the mirror of that change |
| **Asset flags** on verified assets | Asset Verification | ✅ **nothing to do — these self-revert** (§10: the flag reverts, the status does not). Listed so nobody adds them to the script |

### 3 · What the script does NOT need to handle

`MOB.131` `MOB.200` `MOB.210` `MOB.220` `MOB.320` `MOB.395` `MOB.510` `MOB.545` `MOB.590`
`MOB.710` `MOB.860` are **`self-restoring`** — they write and put it back. Everything else is
`read-only`. ⭐ And the three photo tests (`MOB.620`/`621`/`622`) upload real files but write
**nothing**: they dispatch to a local reducer and close the form without submitting.
`MOB.741` uploads an image that the Docs tab's filter rejects client-side.

### Cadence and shape

- **Per run** for the mobile job status, *if* that decision is taken — that is what makes it a
  chore rather than a one-off. Everything else tolerates a weekly sweep.
- **Make it idempotent and dry-run-first.** It deletes real records on a shared dev box, and the
  fixture/residue markers differ by one word.
- **Report a count per category.** A category that suddenly returns zero usually means a test
  stopped writing — a signal worth having, and cheaper than noticing it in a red run.

---

## Operational notes — read before adding tests

- **NAVIGATE THE WAY A USER DOES — click through; do not force-route.** *(All Asset
  Verification tests were converted; zero `/asset-verify/<id>` deep links remain,
  and `MOB.993`/`MOB.989`/`MOB.987` all pass on the shared gate.)* If a person would
  have to wait for data before they could click into a route, the test waits and clicks too.
  A `goToUrl` is a **full page load**: it restarts the SPA on the target route and races
  whatever was loading, exercising a path no user takes. This cost most of a day on MOB.396,
  where deep-linking to an Asset Verification job produced an intermittently **empty asset
  list** that survived a 60s polling guard; clicking the job row works. Use
  `dd_tools.av_job_gate`.
- **Deep-linking is the exception, and only where the target queries by id on mount.**
  `WorkStageDetails` reads its id from `useParams` and queries directly, so
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
| `audit_assertions.py` | ⭐ **Finds assertions that PASS WITHOUT PROVING THEIR OWN NAME** — the defect class that made three green tests meaningless (`MOB.340` empty list · `MOB.348` generic count · `MOB.346` `\|\| true`). Six detectors: TAUTOLOGY · GENERIC-COUNT · NAME-MISMATCH · VACUOUS-ABSENCE · LOADBEARING-OPT · CRITICAL-DIAG. **Validated in both directions** against reconstructions of all three historical bugs plus clean controls. ⚠️ **A heuristic — every hit needs a human read**; its worth is turning "read 102 tests hoping to notice" into "read 15 flagged steps on purpose". Exit 1 on any HIGH |
| `check_drift.py` | ⭐ **Reports where a generator and its JSON disagree, changing nothing.** Sandboxes the JSON, runs every `build_*`, diffs, restores. **Exit 1 = drift**, and it names what would be LOST. Run it before any `DD_FORCE=1` and after wiring a child into a suite — an audit found **six children** in that state at once (`MOB.990` ×4, `MOB.992`, `MOB.994`) plus `MOB.600`'s `PROOF OF CREATION`, all of which a rebuild would have deleted while the suites still reported PASS |
| `dd_tools.upload_steps(url, picker=…)` | ⭐ **the one working upload recipe, shared.** Returns `[reveal, uploadFiles]`, reading the ungeneratable `uploadFiles` step out of `MOB.600`'s JSON at build time — so there is exactly **one** copy and a build fails loudly if the master is lost. Exists because a `bucketKey` turned out to be **portable** between tests (`MOB.621`; Datadog re-namespaces it on push), which is what made upload coverage generatable for any screen instead of hand-authored per test. ⚠️ Trap 12 still applies **per FILE**: a new file *type* needs one hand-authored step before it can be copied |
| `dd_tools.reveal_file_button(scope=…)` | targets a Mantine `FileButton`'s hidden input (`accept="*/*"`, vs `image/*` for every `useFileDialog` input). 🛑 **Fails closed on an ambiguous match** — `AttachmentTable` is rendered by both `WorkStageAttachments` and `FileAttachments`, so two can be mounted at once, and `FileAttachments.addFiles` has **no image filter**: revealing the wrong one would silently write a real attachment to an asset. Always pass a `scope` (trap 3) |
| `set_device.py` | enforce tablet-only; run after any build script |
| `dd_tools.av_job_gate(job_id)` | **the** way to reach an Asset Verification job — clicks the job row (never deep-links), gates on the asset ROWS, and carries a polling `timeout`. Do not hand-roll a local copy; three tests each grew their own and all three were subtly wrong |
| `fetch.py` `fetch(type="full", dir=…)` | back up **every** browser test on the account. ⚠️ **names files by test name, so duplicate names silently overwrite each other** — the account has `000.000.000_RUN-1` ×6 and `Mobile` ×2, which turned 321 tests into 315 files. Re-save those by `public_id` or the backup has a hole in it. Last full backup: `dd_tests_backup/2026-08-12_1543_pre-delete/` (323 files) |
| `wire_suite.py` | fill in `subtestPublicId` after children exist. **Re-run after any suite rebuild** — a rebuilt suite resets its children to `PENDING-WIRE-UP` and `push` 400s |
| `dd_tools.work_list_gate(wait, require_row)` | readiness for the **work order list** — waits on `loadedAll`, which the map toggle silently depends on. ⚠️ Its LOADEDALL checks are absence assertions and **cannot poll** (trap 21), so use it only where `loadedAll` genuinely matters, and prefer `require_row=True` now the list is populated — that row guard *is* a polling positive |
| `dd_tools.work_view_toggle(to)` | **new.** Switches the work list between the **Scheduled** and plain **List** views via the hamburger item, and asserts `sessionStorage['toggle_mobile_v_work']` afterwards. `to` is the view you want to END UP IN. Shared rather than copied because the menu label *flips* (it names the view you are going to, and is also the only readable proof of the current view) — and because three hand-rolled copies of `av_job_gate` were all subtly wrong. ⚠️ The item exists **only for a `SCHEDULED` role**, and the toggle **persists across the suite's shared session**, so any caller needs an `alwaysExecute` restore |
| `dd_tools.work_cache_warm(wait)` | **new.** Warms the work lookup cache before a deep link and claims nothing else: navigate, assert the page mounted (positive, polling), wait. For `MOB.134`/`MOB.347`, which need a warm cache but not `loadedAll` — and which the racy gate above kept failing |
| `DD_FORCE=1 <build script>` then **diff** | the only way a generator's fix reaches its JSON — and the only way to find out they disagree (trap 19). Regenerate, diff against the committed JSON, and check the change is *only* what you intended before pushing |
| `step(..., always=True)` | Datadog's `alwaysExecute` — run a step even after an earlier one failed. For writes a later run depends on, and for restore legs (trap 16c) |

> **TODO — tag hygiene is unreliable, so do not filter on tags for safety.**
> **44 of 102 leaves carry no `read-only` tag**, and two that DO carry one should not.
> Until the table below is applied, the suite-level classification in *Coverage at a glance*
> is the source of truth for what mutates — **not** the tags.

### The classification — done; applying it is what remains

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

`write` refuses to overwrite existing JSON unless `DD_FORCE=1` — because the JSON, not the
generators, is the source of truth for anything hand-authored (trap 12).

> ## 🛑 Scheduling — SETTLED. Do not propose it.
>
> **Manual triggering is the intended mode. A decision, not a gap, and not a TODO.**
> Repo owner: it is a **separate concern** from coverage; **Datadog credits may be
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

*Thirty numbered traps (some with lettered siblings) — every one a way a test here has
already gone wrong. Most module notes are one-line pointers back to these. **18–27 are process
traps rather than locator traps** (28 is a locator trap; 29 and 30 are fixture ones): how the tooling, the fixture, or the framing of a test
misled someone — which has cost more than any single bad XPath. **25 and 26 are about this
document lying to you**, which is a category the first twenty-four did not cover.*

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
| `closeModal` inside Apollo `update`, no `optimisticResponse` | server confirmed — trustworthy (MOB.300) |
| `.then` on a non-awaited `mutate` returning an optimistic value | **nothing** (MOB.600's `createAsset`) |

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

**12 · Hand-authored steps cannot be regenerated — but they CAN be copied.** `uploadFiles`
references a `bucketKey` in Datadog's storage and `SyntheticsApi` has **no** endpoint that mints
one; such steps exist only because someone added them in the Datadog UI. Once a test carries
one, `DD_FORCE=1` on its generator destroys it on the next push — exactly how MOB.200's login
steps were lost. Pull the test down instead, and treat its JSON as permanent source of truth.
`build_collector_tests.py` now enforces this with a **programmatic guard**: it refuses to
overwrite `MOB.600` when the existing JSON carries a `uploadFiles` step.

> ⭐ **A `bucketKey` IS PORTABLE between tests — measured.** `MOB.621` copied MOB.600's key into a
> different test and ran green: **Datadog re-namespaces it to the receiving test on push.** So
> upload coverage is generatable for any screen — use **`dd_tools.upload_steps()`**, which reads
> the recipe out of `MOB.600`'s JSON at build time so there is exactly one copy.
> ⚠️ **The trap survives per FILE**: a new file *type* still needs one hand-authored step.
>
> 🛑 **Pair it with `reveal_file_button(scope=…)`.** Datadog cannot click a `display:none` input
> and every file input here is hidden, so the reveal is mandatory. It **fails closed on an
> ambiguous match** for a reason: `AttachmentTable` is rendered by both `WorkStageAttachments`
> and `FileAttachments`, and the latter calls `uploadFile` with **no image filter** — revealing
> the wrong one would silently write a real attachment to an asset.

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
`angles-left`; both wrong, two wasted runs), and —, `MOB.911` — **`faLocation` →
`location-crosshairs`**, because `faLocation` is an **ALIAS**: its module is literally
`require('./faLocationCrosshairs')`, and `"location"` survives only inside the icon's
`aliases` array, which is never emitted to the DOM.

⚠️ **The alias case is the nastiest variant, and it cost a run in the very test whose premise
was "measure, don't guess".** An imported name that reads like a canonical name feels safe in
a way `faSortAlt` does not — there is nothing about `faLocation` to suggest it resolves
elsewhere. **So the rule has no exceptions: run the one-liner for EVERY icon, including the
ones that look obvious.** Aliases are visible in the package —
`head -4 node_modules/@fortawesome/pro-regular-svg-icons/faLocation.js` shows the redirect.

Icon-only buttons have no accessible name, so the icon *is* the locator. Match every plausible variant, as MOB.340 does:
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
`bucketKey`, so trap 12 applies to `uploadFiles` only. `dd_tools.jsassert` wraps them; the
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
`alwaysExecute`, exposed as `always=True` in `dd_tools.step`. Do not confuse it with
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

**28 · A HIDDEN INPUT CANNOT BE CLICKED BY DATADOG — drive it with `element.click()` from JS,
and prove the state changed IN THE SAME STEP.** Cost two runs on `AssetGeolocate`'s
`Include Address` checkbox:

| attempt | result |
|---|---|
| `label[.//input[@type="checkbox"]]` | **No element found** — Mantine renders input and label as **siblings**, not nested, and `FormField ... label=""` leaves the checkbox with no label text at all |
| the raw `input[@type="checkbox"]` | **"Element located but it's invisible"** |
| `boxes[1].click()` from a JS step | ✅ |

⚠️ **`MOB.510` clicks a raw checkbox input successfully, and that is NOT a licence to do it
elsewhere.** That is `VerificationCheckbox`, a different component whose input is visible.
**Two Mantine checkboxes in this app behave differently**; a working locator in one test says
nothing about another component's DOM.

---

**29 · NEVER HARDCODE WHICH OF TWO RECORDS SORTS FIRST — COMPUTE IT WITH THE APP'S OWN
COMPARATOR.** `MOB.580` asserted *"`A/C Motor 0002` is listed before `Tank 0000`"* for weeks. It
went red on three runs and was written up as an app bug (*the sort pick leaves the list
unmoved*) before the cause turned out to be a **rename**: the fixture asset is now stored as
`⚡ Tank 0000`, and `localeCompare` collates that leading symbol **before** the letter `A`.

```js
'⚡ Tank 0000'.localeCompare('A/C Motor 0002')   // -1  → Tank really is first, ascending
```

The app had been sorting correctly the whole time, in both directions.

⭐ **Two things follow, and the second is the general one:**
- Read the ordering KEY off each row and check it against the comparator the app uses
  (`searchSort` → `localeCompare`). ASC = the sorted order; DESC = its exact reverse. That is
  stronger than a memorised pair *and* immune to a rename.
- **A fixture's display name is not yours.** Anyone with the app open can change it. Use names
  as identity anchors with `contains`, never as equality, ordering, or formatting facts.
  `reset_av_fixture.py` hit the identical trap on its first dry run — it planned to *unlink*
  `⚡ Tank 0000` as a stranger, and only the dry-run default kept that a printout.

⚠️ **The cheap way to tell a test bug from an app bug: assert the app's OWN record of what you
asked for.** `MOB.580`'s two `optional` DIAG steps read `sessionStorage['mobile-Asset-sort']`
back after each pick. Both were green while every proof was red — which rules out *the click
never landed* and leaves *the expectation is wrong*. Two steps, one run, no reading.

---

**30 · A FIXTURE THAT GROWS WILL EVENTUALLY BREAK EVERY WHOLE-LIST INVARIANT.** `MOB.345` proved
sorting by capturing the ascending order and asserting descending was its exact reverse. That
held while the crew had a handful of work orders. It has **57** (counted through the API,
2026-09-10), every `MOB.300`/`MOB.396`/`MOB.122` run adds one **for good**, and the list
virtualises — so ASC and DESC render two different WINDOWS and the invariant died. The same
thing killed `MOB.535` v1 on the job list in August.

⭐ **Two independent fixes, and a test on a growing list wants both:**
- **Narrow before you measure.** `WorkOrders/index.tsx` sorts first and filters second, so a
  search term leaves the subset in sort order while making it small enough to render whole.
- **Assert an invariant that tolerates arrival.** Not *DESC equals reverse(ASC)* but *every row
  present in BOTH renders comes out in the opposite relative order*. The screenshots that
  diagnosed this showed a row (`…-6-001`) that simply finished paging in between the two
  captures: same row COUNT, different row SET. A whole-list invariant calls that a sort bug; a
  pairwise one calls it what it is — a row that is not evidence either way.

🛑 Keep a floor: fewer than 2 rows in common must FAIL, not pass. That is both the trap-5 guard
and the alarm that the narrowing stopped biting.

`HTMLElement.click()` dispatches a real click event, so React's synthetic `onChange` fires — it
is still driving the app, unlike writing `.checked` directly, which React ignores.

🛑 **Fold the click and its proof into ONE step.** The first fix clicked in one step and
asserted the flip in the next; when the click silently failed, the assertion re-read an
unchanged state and the pair proved nothing (trap 5). The step must return
`after !== before`, so a toggle that does not happen cannot be mistaken for one that did.
⚠️ And **do not mark such a click `optional`** — the very first version did, so the failure went
amber, the suite went green, and a headline assertion sat inert.

**27 · RUN EVERY `Run JavaScript` ASSERTION AGAINST A DOM REPLICA BEFORE PUSHING IT.** Datadog
reports a thrown exception, an off-by-one regex and a genuine defect **identically** — *"Custom
assertion returned a falsy value."* So a broken assertion is indistinguishable from a finding,
and each one costs a full suite run plus the misdiagnosis after it.

Three defect classes, all caught locally in seconds and none visible in review:

| defect | how it reads on Datadog |
|---|---|
| a **raw** Python string with doubled backslashes (`r"...\s"`), emitting `/\s/` — a literal backslash | every assertion falsy → *"the value is missing"* |
| a regex over **concatenated** `textContent` — React inserts no separator between siblings, so `…NameForm: 1` defeats `Form` | one assertion falsy → *"the element is not rendering"* |
| a helper emitted twice (`const x` redeclared) | a thrown `SyntaxError`, reported as falsy |

Use `jsdom` out of the MentorTwo checkout — no dependency needed here:
`node -e "const {JSDOM}=require('/…/MentorTwo/node_modules/jsdom'); …"`.

**Build the replica from the COMPONENT SOURCE, not a screenshot** — the concatenation defect
only appears if the fixture reproduces React's separator-free sibling text. Then assert **both
directions**: every realistic data state passes, *and* each defect the assertion claims to catch
returns **false**. An assertion that can never return false is trap 5 in JS clothing.

**26 · A COMPONENT FILENAME IS NOT A FEATURE NAME — grep the test JSON for the RENDERED LABEL
before calling anything uncovered.** `InsertForm/ReassignWork.tsx` reads like an untested write
surface (it moves a work order to another crew). It is **`MOB.398`**: the button it renders is
labelled **`Assign Work Stage`**, and nothing anywhere uses the word *reassign*.

Resolve the name to a label, then search — seconds, and it precedes every "this is uncovered"
claim:

```bash
grep -n '<Button\|buttonText\|>.*</Button>' <component>     # what does it RENDER?
grep -rl "Assign Work Stage" dd_tests_mobile/*.json          # does any test contain that string?
```

⚠️ **It cuts both ways** — the same walk found six surfaces that genuinely had no row. The rule
is not "assume it is covered", it is *resolve the name to a label, then search*. Symmetrical to
trap 18: there a row named a control the app lacks; here the app had a control named differently.

**25 · A RECORDED GREEN IS NOT A CURRENT GREEN — read the LATEST RESULT, not the last one
somebody wrote down.** Nothing here turns red on its own. A checklist row records what someone
saw when they looked, so the gap between "green" and "green now" grows with every run that is
triggered but not read. `MOB.991` sat red for three days while this file reported it green,
because two runs happened and nobody read them.

- **After any run, read it** — including a run triggered for an unrelated reason.
- **Before quoting coverage, pull the latest result for every suite** — one API call each, no
  credits, no runs: `api.get_browser_test_latest_results(pid)`, sort by `check_time`, take the
  last.
- **Do not read a leaf's history for this** (trap 20); suites are the unit that runs.
- ⚠️ A suite whose last run predates the change you are asking about answers a different
  question.
- 🛑 **A verdict read the moment a run exits can be SUPERSEDED BY ITS OWN RETRY.**
  `options.retry = {count: 1, interval: 300.0}` on every test here, so a **failing** run
  produces a *second* result ~5 minutes later. Worse, results from a build you have since
  replaced keep sitting at the top of the list: `MOB.985` was reported green off a genuine
  pass, and two failures from a **superseded** version of `MOB.358` landed after it — leaving
  the suite's *latest* result red while the deployed code was fine.
  ➡️ **Before trusting a latest result, check WHICH BUILD it ran** — pull the remote test
  (`get_browser_test(public_id)`) and compare its step names against the local JSON. A failure
  naming a step that no longer exists is a stale artifact, not a finding. And after fixing a
  red suite, **re-run it** so the recorded state matches what is deployed; otherwise the next
  person reads the red.

**24 · THE RESULTS API LAGS A FINISHED RUN — an old "latest" result does NOT mean the run never
fired.** Hit. A triggered run of `MOB.990` had actually completed, but
`get_browser_test_latest_results` still returned the previous day's result as `[0]`. Reading
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
**`dd_tools.work_cache_warm`**, which claims nothing it cannot prove. `work_list_gate` is
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
➡️ **`check_drift.py` is now the answer — run it, do not rely on remembering.** An audit
found six suite children and `MOB.600`'s proof-of-creation step sitting in exactly this
state simultaneously; every affected suite was green, because a dropped child cannot fail.

`write` refuses to overwrite existing JSON without `DD_FORCE=1` — deliberately, since the
JSON is the source of truth (trap 12). The cost is that a fix applied to a build script may
never reach the test: `MOB.134`'s `[last]` scoping sat in `build_form_fill_test.py` while
the unscoped locator kept shipping to Datadog and failing, and the error message named a
locator that no longer existed in the repo. **When a test fails on a locator you believe you
already fixed, diff the JSON against the generator before debugging anything else** —
regenerate to a temp path and compare, so an unrelated `DD_FORCE=1` cannot clobber
hand-authored steps.

---

