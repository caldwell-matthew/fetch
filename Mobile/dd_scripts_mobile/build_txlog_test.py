"""Build MOB.131_Transaction_Log_Contents - the log actually records mutations (T1.1).

WHY THIS TEST HAS TO MUTATE SOMETHING FIRST
  The Transaction Log reads `gql_log`, a **localforage store in the browser** - not a server
  query. Datadog starts every run with a fresh profile, so the log is EMPTY unless the same
  session performed a mutation. A test that just navigates to /transactions and asserts rows
  would fail forever, and a test that asserts "no rows" would prove nothing.

  So it makes one self-restoring mutation (verify then unverify an asset) and then checks the
  log recorded it. That also makes the test order-independent: it does not rely on an earlier
  subtest in the suite having mutated something.

WHAT IS AND IS NOT PROVEN
  Proven: the log renders its table and contains at least one entry after a mutation.
  NOT proven: that a PENDING (offline-queued) transaction appears distinctly from a completed
  one - that needs the network toggled off, which Synthetics cannot do (Appendix C). The
  checklist keeps the offline half of T1.1 at `[-]` for exactly that reason.

SELF-RESTORING: verify -> unverify, with the restore leg `alwaysExecute` so a failed
assertion cannot leave the fixture job with a verified asset.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, xpath_el, go, test, write, av_job_gate  # noqa: E402

JOB_ID = "Z0EVwQcdJZhMURcBFkp0E0"
JOB_URL = f"{BASE}/asset-verify/{JOB_ID}"
TX_URL = BASE + "/transactions"
ASSET = "Tank 0000"


def row(name):
    return ('//*[contains(concat(" ", normalize-space(@class), " "),'
            f' " mantine-Accordion-item ")][contains(., "{name}")]')


CHECKBOX = f'{row(ASSET)}//input[@type="checkbox"]'
TX_ROW = '//table//tbody//tr[1]'

write(test(
    "MOB.131_Transaction_Log_Contents",
    "`MOB.131` The Transaction Log **records a mutation** (T1.1).\n"
    "- **SELF-RESTORING**: verifies then unverifies an asset; the restore leg is\n"
    "  `alwaysExecute` so a failed assertion cannot leave the fixture dirty.\n"
    "- **It has to mutate first.** The log reads `gql_log`, a *localforage store in the\n"
    "  browser*, not a server query — and Datadog starts every run with a fresh profile, so\n"
    "  the log is empty unless this session did something. A navigate-and-assert-rows test\n"
    "  would fail forever; asserting *no* rows would prove nothing.\n"
    "- Doing its own mutation also makes it order-independent — it does not depend on an\n"
    "  earlier subtest having written something.\n"
    "- ⚠️ **Does NOT prove the offline half.** Whether a *pending* queued transaction renders\n"
    "  differently from a completed one needs the network toggled off, which Synthetics\n"
    "  cannot do — that half of T1.1 stays `[-]` (Appendix C).",
    av_job_gate(JOB_ID) + [
        step("assertElementPresent", f"BASELINE: {ASSET} is present",
             {"element": xpath_el(JOB_URL, row(ASSET))}, timeout=30),
        step("click", f"Verify {ASSET} (this is the mutation the log should record)",
             {"element": xpath_el(JOB_URL, CHECKBOX)}, timeout=30),
        step("wait", "Wait for the verify mutation", {"value": 4}),
        step("click", f"Unverify {ASSET} — restore immediately",
             {"element": xpath_el(JOB_URL, CHECKBOX)}, timeout=30, always=True),
        step("wait", "Wait for the unverify mutation", {"value": 4}, always=True),

        go(TX_URL, "the transaction log"),
        step("wait", "Let the log read localforage", {"value": 4}),
        step("assertPageContains", "The log's table headers render", {"value": "Details"}),
        step("assertElementPresent",
             "PROOF: the log recorded at least one transaction from this session",
             {"element": xpath_el(TX_URL, TX_ROW)}, timeout=30),
    ],
    ["Mobile", "env:dev", "Offline", "CRUD"],
))

# ---------------------------------------------------------------- wire into MOB.993
suite_path = os.path.join(HERE, "MOB.993_AssetVerify_Suite.json")
doc = json.load(open(suite_path))
steps = doc["details"]["steps"]
CHILD = "MOB.131_Transaction_Log_Contents"
if CHILD not in [s.get("name") for s in steps]:
    steps.append({"allowFailure": False, "alwaysExecute": False, "exitIfSucceed": False,
                  "isCritical": True, "name": CHILD, "noScreenshot": False,
                  "type": "playSubTest",
                  "params": {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1}})
    with open(suite_path, "w") as f:
        f.write(json.dumps(doc, indent=4))
    print(f"added {CHILD} to MOB.993_AssetVerify_Suite")

print("wrote MOB.131 (transaction log contents)")
