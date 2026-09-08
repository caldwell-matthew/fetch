"""Build MOB.132_TransactionLog_Search - the Transaction Log's search box.

WHY THIS EXISTS
  `TransactionLog/index.tsx:117` renders a `Search for things` box, and `:67-73` filters the
  loaded rows client-side across FIVE fields:

      v.app | v.key | v.op | JSON.stringify(v.variables) | v.error

  `MOB.131` proves the log lists entries; nothing has ever touched the box. It is the last
  untested `SearchInput` in mobile.

⚠️ IT MUST RUN AFTER SOMETHING HAS BEEN LOGGED. The page reads `gql_log`, a localforage store
  in the browser, and every Datadog run starts with a fresh profile — so the log is EMPTY
  unless this session has already made a mutation. That is exactly why `MOB.131` performs a
  verify/unverify before reading the log, and why this test is wired into
  `MOB.993_AssetVerify_Suite` immediately after it rather than into a read-only suite. A
  read-only suite would give it an empty table and a vacuous pass (trap 5).

THE PROOF IS THE MATCHED PAIR, NOT A SINGLE SEARCH
  Following `MOB.343` / `MOB.610` / `MOB.530`: a term nothing can match must drive the row
  count to ZERO, and clearing it must bring the SAME count back. A positive search is
  deliberately not attempted — the log's contents are whatever this session happened to write,
  so no search term can be known in advance, and asserting against one would be a fixture test.
  The negative pair needs no knowledge of the contents and still proves the filter filters.

⚠️ ROWS ARE A REAL TABLE, NOT A VIRTUALISED LIST. `:154` maps `searchResults` into
  `<Table.Tr>` inside a `<Table.Tbody>`, all of it inside a `ScrollArea.Autosize` — so unlike
  the work and job lists, the DOM row count IS the result-set size and can be compared
  directly. (Contrast `MOB.535`, where virtualisation forced a different invariant entirely.)

READ-ONLY: it types into a client-side filter and clears it. Nothing is written, and the box
  is component state (`React.useState`) that dies with the page — nothing to restore.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

TX_URL = BASE + "/transactions"
NO_MATCH = "ZZZZ-NO-SUCH-TRANSACTION"
STASH = "__dd132_rows"   # test-owned scratch key, removed by the cleanup leg

# The rendered rows. One table on this screen; `searchResults.map` fills its tbody.
ROWS_JS = "const ROWS = () => document.querySelectorAll('table tbody tr').length;\n"

SEARCH_BOX = '//input[@placeholder="Search for things"]'

steps = [
    go(TX_URL, "the Transaction Log"),
    step("wait", "Let the page mount and read `gql_log`", {"value": 5}),
    step("assertElementContent", 'Test the "Transaction Log" page rendered',
         {"check": "contains", "value": "Transaction Log",
          "element": xpath_el(TX_URL,
                              '//*[@id="page-title"]//h4[contains(normalize-space(.),'
                              ' "Transaction Log")]')}, timeout=30),
    # trap 9: `placeholder` is an ATTRIBUTE, not page text — assertPageContains can never
    # match it.
    step("assertElementPresent", "The search box renders",
         {"element": xpath_el(TX_URL, SEARCH_BOX)}, timeout=30),

    # ⭐ THE GUARD THAT STOPS THIS BEING VACUOUS. With an empty log every count below is 0 and
    # "the filter drove it to zero" would be trivially true (trap 5). If this fails, the
    # session has not logged a mutation — a SUITE-ORDER problem, not a code one.
    jsassert("LOG GUARD: the session has logged at least one transaction to filter",
             ROWS_JS +
             "const n = ROWS();\n"
             "if (n < 1) return false;\n"
             f"sessionStorage.setItem('{STASH}', String(n));\n"
             "return true;", timeout=60),

    # ---- the negative leg --------------------------------------------------------------------
    step("click", "Focus the search box",
         {"element": xpath_el(TX_URL, SEARCH_BOX)}, timeout=30),
    # typeText APPENDS (trap 17). Nothing else types here, but select-all costs nothing and
    # removes the whole class of problem.
    step("pressKey", "Select any existing term first (typeText APPENDS — trap 17)",
         {"value": "a", "modifiers": ["Control"]}),
    step("typeText", "Type a term nothing can match",
         {"value": NO_MATCH, "element": xpath_el(TX_URL, SEARCH_BOX)}),
    step("wait", "Let the filter apply", {"value": 2}),
    jsassert("⭐ NEGATIVE: the filter drives the row count to ZERO",
             ROWS_JS + "return ROWS() === 0;", timeout=30),

    # ---- restore the view ---------------------------------------------------------------------
    step("click", "Focus the search box (to clear it)",
         {"element": xpath_el(TX_URL, SEARCH_BOX)}, always=True, timeout=30),
    step("pressKey", "Select all", {"value": "a", "modifiers": ["Control"]}, always=True),
    step("pressKey", "Delete", {"value": "Delete"}, always=True),
    step("wait", "Let the list restore", {"value": 2}, always=True),
    # ⭐ The other half of the pair: the same count must come back. A filter that emptied the
    # table permanently, or a re-read that lost rows, fails here rather than passing as "the
    # negative worked".
    jsassert("⭐ RESTORED: clearing the term brings the SAME row count back",
             ROWS_JS +
             f"const before = Number(sessionStorage.getItem('{STASH}') || '0');\n"
             "if (!before) return false;\n"
             "return ROWS() === before;", always=True, timeout=30),
    jsassert("CLEANUP: remove this test's scratch key",
             f"sessionStorage.removeItem('{STASH}');\n"
             f"return !sessionStorage.getItem('{STASH}');", always=True, timeout=30),
]

write(test(
    "MOB.132_TransactionLog_Search",
    "`MOB.132` **The Transaction Log's search box** — the last untested `SearchInput` in\n"
    "mobile.\n"
    "- `TransactionLog/index.tsx:67-73` filters client-side across **five** fields —\n"
    "  `app` / `key` / `op` / `variables` / `error`. `MOB.131` proves the log lists entries;\n"
    "  nothing had touched the box.\n"
    "- ⚠️ **It must run AFTER something has been logged.** The page reads `gql_log`, a\n"
    "  localforage store, and every Datadog run starts with a fresh profile — so the log is\n"
    "  empty unless this session already made a mutation. Wired into `MOB.993` right after\n"
    "  `MOB.131` for exactly that reason; in a read-only suite it would pass vacuously against\n"
    "  an empty table (trap 5). The `LOG GUARD` makes that failure legible as suite order\n"
    "  rather than a code defect.\n"
    "- **The proof is the matched pair** (`MOB.343`/`MOB.610`/`MOB.530` shape): a term nothing\n"
    "  can match must drive the count to **zero**, and clearing must bring the **same** count\n"
    "  back. A positive search is deliberately not attempted — the log holds whatever this\n"
    "  session wrote, so no term is knowable in advance and asserting one would be a fixture\n"
    "  test.\n"
    "- ⚠️ Unlike the work and job lists, these rows are a **real table, not virtualised**, so\n"
    "  the DOM count IS the result-set size and can be compared directly.\n"
    "- **READ-ONLY**: the box is component state that dies with the page; nothing is written.",
    steps,
    tags=["Mobile", "env:dev", "Transaction Log", "Search", "read-only"],
))
print("wrote MOB.132 (transaction log search)")
