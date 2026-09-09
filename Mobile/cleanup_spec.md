# Mobile test-residue cleanup — DEFINITION

*What the cleanup has to do, what the server will actually let it do, and what still needs an
answer. **No code yet.** `test_authoring.md → 🧹 THE DESKTOP CLEANUP CHORE` lists the markers;
this file is the feasibility and design pass on top of it.*

---

## 1 · Why

Fourteen tests are tagged `leaves-residue` and the residue is **per run, not per suite** — every
run of `MOB.991` / `MOB.994` / `MOB.986` / `MOB.987` / `MOB.998` adds another set. Nothing prunes
it, so dev accumulates indefinitely and two fixtures drift **one-way**.

---

## 2 · ⭐ CAN WE ACTUALLY REMOVE IT? — verified against the GraphQL schema

*The existing spec says what to remove. Nobody had checked the server exposes a way. It mostly
does, with **two exceptions that change the design**.*

| residue | mutation | verdict |
|---|---|---|
| Asset (`MOB.600`) | `deleteAssets(ids: [ID!]!): Int!` | ✅ ⚠️ gated `@auth(ASSET, **UPDATE**)`, not DELETE — an oddity, but it means update rights suffice |
| Attachment (`MOB.600`) | `removeAttachment(parentId, modelType, attachmentId)` | ✅ |
| Condition (`MOB.390`) | `deleteWorkStageConditions(ids)` | ✅ `@auth(WORK)` |
| Failure (`MOB.391`) | `deleteWorkStageFailures(ids)` | ✅ `@auth(WORK, DELETE)` |
| Note (`MOB.392`) | **`deleteWorkStageJobNotes(ids)`** | ✅ `@auth(WORK, DELETE)` — table confirmed by the owner (4.3) |
| Event readings (`MOB.550`) | `deleteEvents(ids)` | ✅ `@auth(EVENT, DELETE)` |
| Work order (`MOB.300`·`122`·`396`·`397`) | `WorkStage.removeNode(nodeId)` | ⚠️ **exists, but see 3a** |
| **Charges** (`MOB.350`·`360`·`370`·`380`) | `reverseWorkCharge(financialTransactionId, comment)` | 🛑 **NO DELETE — see 3b** |
| Storeroom qty (`MOB.870`) | quantity adjustment | ✅ arithmetic, the `MOB.860` pattern |
| Mobile job status | editable `status` field on the desktop detail | ✅ |

---

## 3 · The two findings that change the design

### 3a · A work order can only be deleted as a **LEAF**

Deletion is `WorkStage.removeNode(nodeId)`, and the desktop hierarchy tree offers it **only when
the node has no children** (`buildHierarchyButtons.tsx:158-160` — *"Remove only on leaves"*) and
the user has delete permission.

**Consequences to design around:**
- A created work order with **stages beneath it** cannot be removed in one call — children first,
  bottom-up.
- ⚠️ **`MOB.397` creates a FOLLOW-UP work order**, which is by definition related to the fixture.
  Deletion order matters, and deleting the wrong node could touch the **fixture work order**
  (`EYRpYJ9QYdQ1JFF10JtB0Q`) that ~40 tests depend on.
- ✅ **Confirmed by the owner: they DO have stages, so deletion is bottom-up** — walk to the
  leaves and remove upward. The follow-up case is the one to get right.

### 3b · 🛑 Charges are REVERSED, never deleted — and reversal makes the table BIGGER

`reverseWorkCharge` does not remove anything. It **creates a new counter-transaction** with
negated cost and qty (`workChargeReversal.ts` — `cost * -1`, `qty * -1`, new id, new date) and
writes a matching row into the redundant per-type table (`WorkStageLabor` / `WorkStageMaterial` /
`WorkStageEquipment`).

**So "cleaning up" the four charges each run would DOUBLE the rows rather than remove them —
8 rows per run instead of 4.** Financial records are append-only by design; that is almost
certainly correct product behaviour, and it means:

➡️ **Charges are not cleanable, and the script will NOT touch them** (4.2 — deferred by the
owner). ⚠️ **Record the consequence rather than forgetting it**: the fixture work order gains
**4 charges per run, permanently.** That is accepted debt, not an oversight — and the eventual
fix is a *test* change (make `MOB.350`–`380` assert the mutation fires without committing),
not a script change.

---

## 4 · Decisions — answered by the owner

| # | question | answer |
|---|---|---|
| **4.1** | do created work orders have child stages? | ✅ **Yes. Delete BOTTOM-UP.** `removeNode` only removes leaves, so walk children first |
| **4.2** | charges | ⏸️ **Ignored for now.** The script does **not** touch charges. ⚠️ They therefore accumulate on the fixture WO at **4/run** — a known, accepted debt, not an oversight |
| **4.3** | which note table? | ✅ **`WorkStageJobNote`** → `deleteWorkStageJobNotes(ids)` |
| **4.4** | which account? | ✅ **The same `Admin` account the tests use.** Its role must be exactly `Admin` (not `Admin (0000)`/`(0100)`) — the same constraint every login-bearing test asserts |
| **4.5** | how much has accumulated? | ❓ **Still unknown** — see below |
| **4.6** | where does it run? | ✅ **A cleanup script on Datadog.** ⚠️ See the cost note in §5 |

### 4.5 is still open, and it is measurable

Counting existing residue is a **read-only GraphQL query** and costs **no Synthetics credits**.
It needs the app `Admin` login. ➡️ Either the owner reads it off the desktop UI (search assets and
work orders for `DD SYNTHETIC MOBILE`), or the script's **dry-run mode answers it on first use** —
which is an argument for building dry-run first and running it before anything else.

## 5 · Shape

1. **Runs on Datadog** (4.6), as a **Synthetics API test** — not a browser test. Every capability
   in §2 is a GraphQL mutation, so there is nothing to click; an API test is far cheaper and far
   less fragile than driving the desktop UI.
   > ⚠️ **COST — decide this consciously.** *Any* Synthetics test consumes a run credit, and
   > **credits are the current bottleneck** (nothing has run since the account ran dry). A
   > cleanup that lives on Datadog therefore **competes with the tests it exists to support**.
   > Scheduling is settled as off, so it would be triggered by hand either way — which is the
   > same effort as running a local script that costs nothing. **The gain is colocation and
   > not needing a laptop; the cost is a credit per cleanup.** Worth a second look before build.
2. **Dry-run by default.** `--apply` to act. It deletes real records on a shared box.
3. **Query by marker, delete by id.** Never delete by name match at the mutation.
4. **Report a count per category.** ⭐ A category that returns **zero** usually means a test
   stopped writing — a cheap regression signal, and the reason to report even when idle.
5. **Work orders bottom-up** (4.1): resolve children, delete leaves, then the parent.
6. **Charges excluded** (4.2).
7. **Auth as the `Admin` account** (4.4) — assert the role is exactly `Admin` before deleting
   anything, the same guard every login-bearing test carries.

### 🛑 Safety rules — non-negotiable

**The fixture and residue markers differ by one word.** A script matching too broadly takes the
fixtures with it and breaks ~40 tests at once.

| never touch | why |
|---|---|
| WO `EYRpYJ9QYdQ1JFF10JtB0Q` | the fixture for `MOB.310`–`395`; its `desc` ends every run as **`DATADOG FIXTURE`** |
| Asset `Pump 0102` | fixture for `MOB.390`/`391`/`700`/`710`; `desc` also ends `DATADOG FIXTURE` |
| Mobile job `Z0EVwQcdJZhMURcBFkp0E0` | **reset its status, never delete it** |
| Workflow **`Datadog Test`** | a fixture **workflow**, not residue — every created WO selects it, so its name is all over the residue. Deleting it breaks creation entirely |
| `Actuator Tools` · `Central Storeroom` · `000-000-000 Adamantium` | fixtures |

- Residue marker is **`DD SYNTHETIC MOBILE`** (prefix — `MOB.300` writes it bare, the others
  append a per-run `{{ RUNID }}`).
- Asset **`Tank 0000`** (the AV fixture) **has workflow associations** (observed 2026-09-09; it had
  none when `MOB.396` was written). A test that opens the create form with it as the default
  asset gets the asset-filter toggle auto-set ON, and `Datadog Test` disappears from the list.
  `MOB.396` reads the toggles instead of assuming them; nothing else may assume either state.
- **`DATADOG FIXTURE`** is a *fixture* marker. **`Datadog Test`** is a *fixture workflow*.
  Three similar strings, three different meanings — this is the single most likely way to cause
  real damage.

---

## 6 · Explicitly out of scope

- **Asset flags** on verified assets — they **self-revert** (`bugs_found.md` §10). Listed so
  nobody adds them.
- **`MOB.860`'s quantity** — a `+1`/`-1` pair that already self-restores. Only `MOB.870` drifts.
- Anything from the 11 `self-restoring` tests, or the three photo tests, which upload real files
  and write **nothing** (local reducer, never submitted).

---

## 7 · Per-run AV fixture reset — DESIGN (2026-09-09)

*The decision the checklist's 🟡 BLOCKED row asks for. Written so the owner can say yes, no, or
"change X" to a concrete thing.*

### 7.1 · What it unlocks, and what each test would leave behind

Five tests are blocked only because the fixture job `Z0EVwQcdJZhMURcBFkp0E0` cannot be put back
from mobile. Bugs §10 is **not** fixed on `origin/development` (checked 2026-09-09): the job's
status is recomputed on the client, one way — `READY → IN_PROGRESS → COMPLETED` — and the server's
`updateMobileJobAsset` is a plain record update that touches nothing else.

| unlocked test | what it writes | what puts it back |
|---|---|---|
| Verify **all** assets → job goes `COMPLETED` (T2.2) | both `MobileJobAsset.verified = true`, `MobileJob.status = COMPLETED` | `updateMobileJobAsset(id, {verified:false})` ×2 · `updateMobileJob(job, {status: IN_PROGRESS})` |
| Verify status update on the **job list** (the badge/legend flips to Completed) | same as above — it is the list-side assertion of the same act | same reset |
| Add a **new** asset to the job (`NewAssetForm`) | a new `Asset` + a `MobileJobAsset` link (+ an attachment if a photo is added) | `deleteMobileJobAssets([link])` · `deleteAssets([asset])` (`@auth ASSET UPDATE`) |
| Add an **existing** asset to the job (`Pump 0102`) | a `MobileJobAsset` link only | `deleteMobileJobAssets([link])` |
| **Add Work** from Asset Lookup / the AV detail | a work order with stages | `WorkStage.removeNode` bottom-up (§3a) — the same routine the residue cleanup needs anyway |

Everything in the right-hand column is a GraphQL mutation the `Admin` role already has
permission for (`MOBILEJOB UPDATE/DELETE`, `ASSET UPDATE`, `WORK DELETE`). Nothing needs the
desktop UI, which is what "desktop reset" used to mean.

### 7.2 · Invariants the reset must restore — and assert

After a reset the fixture job must read exactly what `MOB.500`/`510`/`530`/`560` assume:

- `status = IN_PROGRESS`
- exactly **2** `MobileJobAsset` rows, `Tank 0000` and `A/C Motor 0002`, both `verified = false`
- no other asset linked; no `DD SYNTHETIC` asset created by the job tests left behind

The script ends by **querying the job back and asserting those three lines**, and exits non-zero
otherwise. A reset that reports success without reading back is trap 6 in a different coat.

### 7.3 · Where it runs — the decision

| option | credits | needs | verdict |
|---|---|---|---|
| **A. local script** `reset_av_fixture.py` (GraphQL, dry-run by default, `--apply` to act) | **0** | the test account's email/password in `.env` (they already live in Datadog as globals) to obtain the same-origin session cookie | ⭐ **recommended** — it is also the vehicle §5 already chose for residue cleanup, so one script grows two subcommands |
| B. Datadog **API** test | 1 per reset | nothing new | competes with the browser tests for the same credits; cannot be a child of `MOB.993`, so it is a separate manual trigger either way |
| C. make the tests self-restore in-browser | 0 | — | **impossible** — mobile has no status control and cannot delete; that is the whole reason the row is blocked |

### 7.4 · How the unlocked tests slot in

- They go in **`MOB.993` as the LAST children**, after everything that assumes the fixture is
  at rest — verifying the second asset flips the job and would break `MOB.500`/`530`/`560` if they
  ran afterwards in the same session.
- A run of `MOB.993` is then **run → reset**. A forgotten reset leaves the job `COMPLETED` and the
  next `MOB.993` fails at its first fixture guard — loudly, at the first child, not silently.
- The reset is idempotent: running it on a clean fixture changes nothing and still asserts 7.2.

### 7.5 · What the owner is deciding

1. **Yes to option A?** It means the test account credentials live in `.env` next to the Datadog
   keys (already gitignored).
2. **Accept the "run → reset" chore** for `MOB.993` — one command after each run.
3. **Accept the residue**: "Add Work" leaves a work order per run until §3a's bottom-up delete is
   built; the new-asset test leaves nothing once `deleteAssets` is in the script.

If 1–3 are yes, the build order is: script with dry-run and the 7.2 read-back → run it once on the
current fixture (it should change nothing) → the two verify tests → the two add-asset tests →
Add Work last, with the work-order delete.
