# Mobile test residue — cleanup and fixture reset

*What the tests leave behind, what the server lets us remove, and the two local scripts that do
it: `cleanup_residue.py` (residue) and `reset_av_fixture.py` (the AV fixture job). Both run over
GraphQL as the test account, cost 0 Datadog runs, and are **dry run by default** (`--apply` to
act). Keep `--apply` opt-in permanently — the first dry run of the reset planned to unlink the
fixture's own asset (see §6).*

## 1 · 🛑 Never touch

**The fixture and residue markers differ by one word.** A match too broad takes the fixtures
with it and breaks ~40 tests.

| never touch | why |
|---|---|
| WO `EYRpYJ9QYdQ1JFF10JtB0Q` and its parent work `20260805-18` | fixture for `MOB.310`–`395`. The parent work carries the residue marker (`MOB.300` created it) — excluded by id |
| WO `RcdI0xcpc8NBV8VoRNNBYM` and its parent work `20260910-18` | `MOB.302`'s fixture; parent also carries the marker — excluded by id |
| WO `xohY0klBZktB9VBRxc8k4J` and its parent work `20260910-16` | fixture for `MOB.363`–`365`; created by `MOB.396`, so it carries the marker — excluded by id (`FIXTURE_STAGES`) |
| Asset `Pump 0102` | fixture; `desc` ends `DATADOG FIXTURE`. **Never touch its attachments** (owner) |
| Mobile job `Z0EVwQcdJZhMURcBFkp0E0` | **reset its status, never delete it** |
| Workflow **`Datadog Test`** | a fixture *workflow* — every created WO selects it, so its name is all over the residue. Deleting it breaks creation |
| `Actuator Tools` · `Central Storeroom` · `000-000-000 Adamantium` · `Bypass Valve 0001` · `⚡ Building 0000` | fixtures. ⚠️ This list and `cleanup_residue.NEVER_ASSETS` (`Pump 0102` · `Bypass Valve 0001` · `⚡ Tank 0000` · `A/C Motor 0002`) are different sets — the script only ever selects assets whose name STARTS WITH the marker, so its guard is a backstop, not the policy. Neither list is a subset of the other |

Three similar strings, three meanings: **`DD SYNTHETIC MOBILE`** is the residue marker (prefix —
`MOB.300` writes it bare, others append `{{ RUNID }}`); **`DATADOG FIXTURE`** is a fixture marker;
**`Datadog Test`** is a fixture workflow. The script queries by marker, deletes by id, and
re-checks the never-touch ids before every delete.

## 2 · What the tests leave, and what can remove it

*Counts are dated measurements. The first full Datadog pass (2026-09-16, every suite but the held-out `MOB.967`) ran after
them and added more — recount over `/graphql` or with a dry run before any prune.*

| residue | created by (suite) | marker | removal | state |
|---|---|---|---|---|
| **Work orders** (~4 per full pass) | `MOB.300` (`953`) · `122` (`971`) · `396` · `397` (`959`) | `problemDesc` starts `DD SYNTHETIC MOBILE`, created by the test account | `deleteWorkOrders` → `removeWorkById` (whole work + stages, one transaction; refuses any with charges, schedule entries, conditions or failures) | 🛑 **blocked** — every call rolls back (bugs §41). 196 carry the marker (created 2026-08-05 → 09-10; measured 2026-09-15); newest 10 kept for the work-list tests |
| **Charges** ×4 on the fixture WO | `MOB.350` equipment `AC Adapter` · `360` labor `Dev Eloper` · `370` material `0000-0000 Diaphragm Pump` · `380` other (`956`) | qty 1 | `reverseWorkCharge` **adds** a negated counter-transaction — reversal doubles the rows | ⏸️ **excluded** (owner). Accepted debt: +4 per run, permanent — 78 equipment · 52 labor · 45 material · 35 other on the fixture (measured 2026-09-15) |
| **Note** | `MOB.392` (`956`) | body `This is a note - DD SYNTHETIC MOBILE` | `deleteWorkStageJobNotes(ids)` | 4 on the fixture (measured 2026-09-15) — a prune keeps the newest 1 |
| **Asset + attachment** | `MOB.600` (+ `MOB.623` adds photos) (`967`, held out while bugs §34 is open) | name `DD SYNTHETIC MOBILE <8 digits>`, desc `Created by Datadog Synthetics - safe to delete` | `deleteAssets(ids)` (gated `ASSET UPDATE`) · `removeAttachment` | newest 4 kept (`MOB.623`/`625` select them by prefix) — nothing to prune today. A kept asset can hold `MOB.712`'s System link and `MOB.722`'s readings; not yet checked whether `deleteAssets` refuses one with events. `MOB.627`/`628` add and delete their own photo/PDF and set the avatar on the newest one — nothing left when green |
| **Event readings** ×2 | `MOB.550` (`965`) | values `4242`, `1337` on the job's assets — no marker | `deleteEvents(ids)` | reported, never touched — no marker to select by, and `MOB.550` reads the previous run's value as its server proof |
| **Systems** | `MOB.712` (`980`) | name `DD SYNTHETIC MOBILE <8 digits>` | `deleteSystems(ids)` (desktop/API — mobile has none); unlink the asset's `systemId` first | 1 per run; the first `DD SYNTHETIC MOBILE` asset in Asset Lookup points at the newest. 6 (measured 2026-09-15 over `/graphql`; the script does not report this category) |
| **Event readings** (Asset Lookup) | `MOB.722` (`980`) | type `Test 1`, value `722` + 5 digits, on the first `DD SYNTHETIC MOBILE` asset | `deleteEvents(ids)` | 1 per run; selectable by asset marker + `Test 1` + `722…`. Not reported by `cleanup_residue.py` — count it over `/graphql` before a prune |
| **Org tags** | `MOB.627` (`967`) | name `DD SYNTHETIC MOBILE <8 digits>`, attached to nothing | `deleteTags(ids)` (API — mobile has none; not scripted) | +1 per run, permanent until pruned. 4 (measured 2026-09-15 over `/graphql`; the script does not report this category) |
| Condition / failure | `MOB.390` / `391` (`956`) | `Pump Body` · `BELT·ADJUST·TIME` | deleted by the test itself (trap 2); a failed run's leftover is pruned by the script | ✅ self-cleaning; `preflight.py mob39x` checks |
| Photo link on `Bypass Valve 0001` | `MOB.302` (`959`) | — | unlinked by the test itself (trap 2) | ✅ self-cleaning; `preflight.py mob302` |

**State that drifts one way** (not deletions):

| state | moved by | reset |
|---|---|---|
| Mobile job status → `COMPLETED` when its last asset is verified (bugs §10) | a verify-all test (not built) | `reset_av_fixture.py` — §4 |
| `000-000-000 Adamantium` quantity, +1 per run | `MOB.870` (`970`) | decrement by runs since last tidy. `MOB.860`'s `+1`/`-1` self-restores; do not make `MOB.870` two-way |

**Nothing to do:** asset verified flags (they self-revert); `self-restoring` and `read-only`
tests; the photo tests `MOB.620`/`621`/`622`/`626`/`301` (local reducer, never submitted);
`MOB.741` (the Docs filter rejects its image client-side); `MOB.363` (deletes the photo it uploaded to `20260910-16`); `MOB.361` (adds a note, edits it, deletes it — ⚠️ a FAILED run leaves a `DD SYNTHETIC MOBILE 361 NOTE` marker note on the fixture, and the note prune keeps the newest 1, so it can keep MOB.361's leftover and delete MOB.392's); `MOB.628` (deletes its own PDF); `MOB.364` (deletes the form it attached over `/graphql`, owner-authorised); `MOB.866` (deletes its own photo and PDF from the storeroom item; a failed run's leftover makes the next run's premise refuse).

## 3 · `cleanup_residue.py` — built

- **Scope:** only Datadog's records — created by the test account AND carrying the marker.
  Every candidate work is checked against the fixtures' parent work ids and every stage it
  holds; the run aborts if a never-touch id is anywhere in the plan.
- **Deletes in batches of 5, stops on the first error**, and re-plans from the server every run,
  so it resumes cleanly once §41 is fixed.
- **Reports a count per category** — a category that drops to zero usually means a test stopped
  writing.
- Auth as the `Admin` test account (role exactly `Admin`). ⚠️ Never call logout, and do not run
  while a suite is running — a logout anywhere kills an in-flight suite.
- **Local, not a Datadog API test**: a billed run per cleanup, triggered by hand either way.

## 4 · `reset_av_fixture.py` — built

`--check` asserts only · dry run plans · `--apply` acts.

**Invariants it restores and then reads back** (exit non-zero otherwise):
- job `status = IN_PROGRESS`
- exactly **2** `MobileJobAsset` rows — `⚡ Tank 0000` and `A/C Motor 0002` — both
  `verified = false`
- no other asset linked; no `DD SYNTHETIC` asset left by a job test

**What it unlocks** — five tests blocked because mobile cannot walk the job back (bugs §10):

| test | writes | put back by |
|---|---|---|
| verify all → job `COMPLETED` (`/asset-verify/:jobId`) | both `verified = true`, status `COMPLETED` | `updateMobileJobAsset(…, {verified:false})` ×2 · `updateMobileJob(…, {status: IN_PROGRESS})` |
| verify status update on the job list | same act, list-side assertion | same |
| add a NEW asset to the job | `Asset` + `MobileJobAsset` (+ attachment) | `deleteMobileJobAssets` · `deleteAssets` |
| add an EXISTING asset (`Pump 0102`) | a `MobileJobAsset` link | `deleteMobileJobAssets` |
| Add Work from Asset Lookup / AV detail | a work order | `deleteWorkOrders` — blocked by §41 |

They go in `MOB.963_AssetVerify_3_Verify_Status_Queue_Suite` as the **last** children (verifying the second asset flips the
job), and a `MOB.963` run becomes **run → reset**. A forgotten reset fails the next run at its first fixture
guard. The reset is idempotent.

**Open owner decisions:** accept the run → reset chore for `MOB.963`; accept Add Work's residue
until §41 is fixed. Then build: the two verify tests → the two add-asset tests → Add Work.

## 5 · Session over plain HTTP

Login is an Express route with a session cookie, so `requests.Session()` suffices:

| # | call | body | gives |
|---|---|---|---|
| 1 | `POST /login` | `{email, password}` | `{route, token}` — the coretoken JWT |
| 2 | `POST /login/user-env` | `{coretoken: token}` | environments; take `environment == 'development'` |
| 3 | `POST /login/sso` | `{environment_id, environment_org, environment, token, mobile: 'true'}` | the session cookie |
| 4 | `POST /graphql` | the mutation | `credentials: 'same-origin'` — the cookie is the whole auth |

Skipping step 3 leaves a coretoken and no session: every mutation returns unauthenticated.
`DATA_DOG_EMAIL`/`DATA_DOG_PASSWORD` are readable Datadog globals (`.env` is the fallback).

## 6 · Match fixture names by containment

The AV asset's stored name is `⚡ Tank 0000` — the symbol is part of it. The reset's first dry run
matched by equality and planned to unlink the fixture's own asset as a stranger; the dry-run
default kept that a printout. Both scripts match by containment, as the browser tests do
(trap 29).
