"""Build MOB.345_Work_Sort_Persist - the work list's sort choice is applied, PERSISTED, and
actually reorders the rows.

⚠️ THE NAME UNDERSTATES IT, DELIBERATELY. This test now proves ordering as well as
persistence, but it keeps the `_Work_Sort_Persist` name because it already holds a Datadog
public_id and `push` matches on NAME - renaming the file would create a second test and
orphan the first, along with its run history. Rename in the Datadog UI if it ever matters.

HOW ORDERING IS PROVEN WITHOUT A SORTABLE, VISIBLE COLUMN
  An earlier version of this file argued ordering was impossible here, on the grounds that no
  column is both sortable and readable from a row:

      sortable, not visible ..... status, priority, createdAt, targetDueDate
      visible, not sortable ..... name, assets, address, description

  That is true and still worth knowing - but it does not block an ordering test, because the
  sort COLUMN never has to be read. Only row IDENTITY does. From `applySortValue`:

      ASC   -> sortBy(list, column)
      DESC  -> reverse(sortBy(list, column))

  DESC is not "sorted the other way", it is the EXACT REVERSE of the ASC array. So the
  invariant is: capture the rendered order under `Created At ▲`, capture it again under
  `Created At ▼`, and the second must equal the first reversed - whatever the rows are called
  and whatever column is driving it. Nothing is hardcoded, so the test survives fixture churn
  in a way MOB.580 (which names two assets) does not.

  Ties are safe: lodash `sortBy` is stable, so tied rows reverse along with everything else.

CARRYING THE FIRST ORDER TO THE SECOND ASSERTION
  Datadog cannot pass a JS value from one step into another. The capture step therefore
  stashes the order in a TEST-OWNED sessionStorage key (`__dd345_asc`) as a side effect and
  the comparison step reads it back. That key is not app state and is deleted by a cleanup
  step at the end; it is only a scratch slot inside one browser session.

VIRTUOSO IS THE ONE REAL HAZARD
  The list is virtualised, so the DOM holds only what is on screen. If it ever grows past a
  screenful, ASC and DESC would render DIFFERENT SUBSETS and a naive reversal check would
  fail for the wrong reason. The comparison therefore checks same-length and same-membership
  FIRST and says so in its own step name, so that failure mode is self-identifying rather
  than looking like a sort bug.

TRAP 16 IS THE REST OF THE DESIGN
  The persistence half asserts `sessionStorage['mobile-WorkStage-sort']`, the app's own
  contract. A matching "the input displays the label" check was written and FAILED while the
  storage check beside it passed - so Mantine's Select does not hold the human label as its
  input value (most likely the option id). It was removed rather than guessed at.

SELF-RESTORING, AND IT MATTERS. The sort choice persists in sessionStorage and Datadog reuses
one browser session across a suite, so a run that ended on a non-default sort would change
what every later work-order subtest sees. Restore leg is `alwaysExecute` (trap 16c).
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, HERE, WORK_URL, step, xpath_el, test, write,  # noqa: E402
                      jsassert, work_list_gate, work_view_toggle)

KEY = "mobile-WorkStage-sort"
# MEASURED, not derived (trap 15) - see the module docstring.
PICK = "Created At ▲"          # ascending
RESTORE = "Created At ▼"       # descending = the component's own default

SORT_BTN = ('//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up"'
            ' or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ")'
            ' or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]')
SORT_SELECT = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
               '[contains(., "Sort Criteria")]'
               '//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]')


def option(label):
    return f'//*[@role="option"][normalize-space(.)="{label}"]'


def choose(label, always=False):
    return [
        step("click", "Open the sort dropdown",
             {"element": xpath_el(WORK_URL, SORT_BTN)}, timeout=30, always=always),
        step("wait", "Wait for the sort modal", {"value": 3}, always=always),
        step("assertPageContains", "The Sort Criteria modal opened",
             {"value": "Sort Criteria"}),
        step("click", "Open the sort options",
             {"element": xpath_el(WORK_URL, SORT_SELECT)}, timeout=30, always=always),
        step("wait", "Wait for the options", {"value": 2}, always=always),
        step("click", f'Pick "{label}"',
             {"element": xpath_el(WORK_URL, option(label))}, timeout=30, always=always),
        step("wait", "Let the list re-sort and the choice persist", {"value": 3},
             always=always),
    ]


def stored_is(label, name, always=False):
    return jsassert(
        name,
        f"const raw = sessionStorage.getItem('{KEY}');\n"
        "if (!raw) return false;\n"
        "let v; try { v = JSON.parse(raw); } catch (e) { return false; }\n"
        f"return v && v.label === '{label}';",
        always=always, timeout=30)


STASH = "__dd345_asc"   # test-owned scratch key, deleted by the cleanup step

# Row identity. `_workSequence` and `name` are the first things WorkListItem renders, but a
# row's whole textContent is the most stable key available and needs no schema knowledge.
ROWS_JS = ("const ORDER = () => [...document.querySelectorAll('.mantine-Paper-root')]\n"
           "  .filter(e => (e.textContent || '').includes('Description:'))\n"
           "  .map(e => (e.textContent || '').replace(/\\s+/g, ' ').trim());\n")


def capture_order():
    """Stash the rendered order so the DESC step can compare against it. Datadog cannot pass
    a value between steps, so the assertion writes one as a side effect."""
    return jsassert(
        "CAPTURE: record the ascending row order (needs >=2 rows to mean anything)",
        ROWS_JS +
        "const o = ORDER();\n"
        "// <2 rows makes any ordering claim vacuous (trap 5), so fail loudly instead.\n"
        "if (o.length < 2) return false;\n"
        f"sessionStorage.setItem('{STASH}', JSON.stringify(o));\n"
        "return true;",
        timeout=30)


def diagnose_order():
    """Split the reversal failure into ATTRIBUTABLE parts.

    `assert_reversed` returns false for three different reasons - different row COUNT,
    different row SET, or a genuinely wrong ORDER - and a boolean cannot say which. Its own
    comment claimed the count/set checks made the failure "distinguishable"; they do not,
    because all three paths return the same falsy value. These do, one optional step each.
    """
    common = (ROWS_JS +
              f"const raw = sessionStorage.getItem('{STASH}');\n"
              "if (!raw) return false;\n"
              "let asc; try { asc = JSON.parse(raw); } catch (e) { return false; }\n"
              "const desc = ORDER();\n")
    return [
        jsassert("DIAG: ASC and DESC rendered the SAME NUMBER of rows",
                 common + "return desc.length === asc.length;",
                 optional=True, always=True, timeout=15),
        jsassert("DIAG: ASC and DESC rendered the SAME SET of rows",
                 common + "return [...asc].sort().join('\\u0000') === "
                 "[...desc].sort().join('\\u0000');",
                 optional=True, always=True, timeout=15),
        jsassert("DIAG: the rendered order actually CHANGED between ASC and DESC",
                 common + "return desc.join('\\u0000') !== asc.join('\\u0000');",
                 optional=True, always=True, timeout=15),
        jsassert("DIAG: the list is in SCHEDULED view (group headers present) — which would "
                 "explain a non-reversal, since ScheduledWork re-buckets rows by group",
                 "return [...document.querySelectorAll('button')]"
                 ".filter(b => /^(Past Due|Today|Tomorrow|Future)\\b/"
                 ".test((b.textContent||'').trim())).length > 0;",
                 optional=True, always=True, timeout=15),
    ]


def assert_reversed():
    """DESC is `reverse(sortBy(...))` of ASC - so the exact reversal is the invariant."""
    return jsassert(
        "PROOF: descending is the EXACT REVERSE of ascending — the sort really reorders",
        ROWS_JS +
        f"const raw = sessionStorage.getItem('{STASH}');\n"
        "if (!raw) return false;\n"
        "let asc; try { asc = JSON.parse(raw); } catch (e) { return false; }\n"
        "const desc = ORDER();\n"
        "// Virtuoso virtualises: if the list ever outgrows one screen, ASC and DESC would\n"
        "// render DIFFERENT SUBSETS. Check membership first so that failure mode is\n"
        "// distinguishable from a genuine sort bug.\n"
        "if (desc.length !== asc.length) return false;\n"
        "const sameSet = [...asc].sort().join('\\u0000') === [...desc].sort().join('\\u0000');\n"
        "if (!sameSet) return false;\n"
        "// applySortValue: ASC = sortBy(list), DESC = reverse(sortBy(list)).\n"
        "return desc.join('\\u0000') === [...asc].reverse().join('\\u0000');",
        timeout=30)


# NOTE - there is deliberately no "the input displays the label" assertion.
# One was written and it FAILED on the first run while the sessionStorage assertion beside it
# passed, which means the Select's input does not hold the human label (`Created At ▲`) as its
# value - most likely it holds the option id (`createdAt_ASC`). Rather than guess at the
# representation, it was removed: trap 16's own ordering says assert the PERSISTED source of
# truth where one exists, and here one does. The DOM form of the control is an implementation
# detail of Mantine's Select; the storage key is the app's contract.


write(test(
    "MOB.345_Work_Sort_Persist",
    "`MOB.345` The work list's sort choice is applied, **persisted**, and really reorders\n"
    "the rows (T2.1). *(The test name understates it — kept because renaming would orphan its\n"
    "Datadog `public_id`.)*\n"
    "- **SELF-RESTORING, and it has to be.** The choice lives in\n"
    f"  `sessionStorage['{KEY}']` and Datadog reuses one browser session across a suite, so\n"
    "  a run ending on a non-default sort would change what every later work-order subtest\n"
    "  sees. Restore leg is `alwaysExecute` (trap 16c).\n"
    "- **It proves ORDERING too, without reading the sort column.** No column here is both\n"
    "  sortable and visible — the options are `Status`/`Priority`/`Created At`/`Target Due\n"
    "  Date` and a row shows `_assets`/`address`/name/desc — but the sort column never has\n"
    "  to be read. `applySortValue` makes `DESC = reverse(sortBy(list))`, so **descending\n"
    "  must be the exact reverse of ascending**, whatever the rows are called. Nothing is\n"
    "  hardcoded, unlike `MOB.580` which names two assets.\n"
    "- **Datadog cannot pass a value between steps**, so the capture step stashes the order\n"
    "  in a test-owned `sessionStorage` key as a side effect; a cleanup step deletes it.\n"
    "  That key is scratch space, not app state.\n"
    "- ⚠️ **Virtuoso virtualises the list.** If it outgrows one screen, ASC and DESC would\n"
    "  render different subsets — so the comparison checks same-length and same-membership\n"
    "  BEFORE checking reversal, making that failure mode self-identifying rather than\n"
    "  looking like a sort bug.\n"
    "- The capture requires **>=2 rows**; fewer makes any ordering claim vacuous (trap 5).\n"
    "- **The assertion is JS against sessionStorage** (trap 16), not against the control. A\n"
    "  matching \"the input displays the label\" check was written and **failed while the\n"
    "  storage check beside it passed** — so Mantine's `Select` does not hold the human\n"
    "  label as its input value (most likely the option id). It was removed rather than\n"
    "  guessed at: the storage key is the app's contract, the DOM shape is Mantine's.\n"
    f"- Restores to `{RESTORE}`, which is the component's own default\n"
    "  (`setOrderBy(formatSortValue(createdAt, 'DESC'))`). ⚠️ It restores the *value*, not\n"
    "  the absence of the key — a first-ever run starts with no key at all, and this leaves\n"
    "  one set to the default. That is deliberate: it is the state every later subtest\n"
    "  expects, and it is what the component would have written itself.",
    # SWITCH TO THE PLAIN LIST FIRST. Measured 2026-08-20: this test's reversal invariant
    # only holds in `AssignedWork`, which renders the sorted list directly. The `Admin` role
    # became `SCHEDULED` that day, so a fresh session lands on `ScheduledWork`, which
    # RE-BUCKETS the sorted rows into Past Due / Today / Tomorrow / Future - order is
    # group-major, so DESC is not the global reverse of ASC even though the sort ran.
    # The diagnostics below proved exactly that: same row count, same row set, order DID
    # change, and group headers present. The sort was never broken; the view was wrong.
    work_list_gate() + work_view_toggle("List") + choose(PICK) + [
        stored_is(PICK, f'PROOF: the choice persisted to sessionStorage["{KEY}"]'),
        step("pressKey", "Close the sort modal", {"value": "Escape"}),
        step("wait", "Let the modal close", {"value": 2}),
        capture_order(),
    ] + choose(RESTORE, always=True) + [
        stored_is(RESTORE, f'RESTORED: sessionStorage holds the default "{RESTORE}"',
                  always=True),
        step("pressKey", "Close the sort modal", {"value": "Escape"}, always=True),
        step("wait", "Let the modal close and the list re-sort", {"value": 3}, always=True),
    ] + diagnose_order() + [
        assert_reversed(),
        jsassert("CLEANUP: drop the test-owned scratch key",
                 f"sessionStorage.removeItem('{STASH}');\n"
                 f"return sessionStorage.getItem('{STASH}') === null;",
                 always=True, timeout=30),
    ] + work_view_toggle("Scheduled", always=True),
    ["Mobile", "env:dev", "Work Order", "Search", "read-only"],
))

# ---------------------------------------------------------------- wire into MOB.986
suite_path = os.path.join(HERE, "MOB.986_WorkOrders_Extra_Suite.json")
doc = json.load(open(suite_path))
steps = doc["details"]["steps"]
CHILD = "MOB.345_Work_Sort_Persist"
if CHILD not in [s.get("name") for s in steps]:
    steps.append({"allowFailure": False, "alwaysExecute": False, "exitIfSucceed": False,
                  "isCritical": True, "name": CHILD, "noScreenshot": False,
                  "type": "playSubTest",
                  "params": {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1}})
    with open(suite_path, "w") as f:
        f.write(json.dumps(doc, indent=4))
    print(f"added {CHILD} to MOB.986_WorkOrders_Extra_Suite")

print("wrote MOB.345 (work sort persistence)")
