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
