"""Build MOB.913_Offline_Transaction_Queue - the offline queue holds a mutation, counts it, drains
it on reconnect, and replays it after a reload (checklist 🟢 #24, T1.1).

WHY THIS WAS CALLED UNREACHABLE, AND WHY IT IS NOT
  T1.1 carried "mutate while offline", "queue drains", "survives a reload" and "pending count" as
  `[-]`, and the (deleted) offline probe's docstring said a dispatched `offline` event reaches the
  UI "NOT the transaction queue". It does reach the queue. In a browser the queue is gated on
  exactly those window events (`graphql/links/utils.ts:50-75`):

      if (!window.ReactNativeWebView) {
          window.addEventListener('online', openIt);     // queueLink.open()
          window.addEventListener('offline', closeIt);   // queueLink.close()
      }

  The link chain is `sanitize → Logging → PersistedQueueLink → QueueLink → … → http`
  (`graphql/index.tsx:114-124`):
    PersistedQueueLink  writes every MUTATION to IndexedDB (`mutationQueueStore`) before it goes
                        on, removes it when it resolves, and publishes the count
                        (`pendingTransactionsCount`) that the header's `TransactionStatus`
                        renders: an Indicator labelled N on the `upload` icon, whose click opens
                        `PendingTransactionLogs` (each op's `operationName` + variables).
    QueueLink           while closed, HOLDS every operation; `open()` forwards them in order.
    Auth.tsx:126        `restoreMutationQueue(client)` re-sends whatever IndexedDB still holds
                        when the app starts.

THE MUTATION: `VERIFY_ASSET` on the AV fixture job (`VerificationCheckbox.tsx`) - one click,
optimistic, not gated on being online, and self-restoring by unverifying (MOB.510's pair).

⭐ LEG 1 - HOLD, COUNT, DRAIN
    at rest (0 of 2, no pending indicator) -> `offline` -> verify
      -> the indicator reads 1, and STILL 1 after 6s (held, not merely in flight)
      -> `PendingTransactionLogs` lists `VERIFY_ASSET` with `"verified":true`
    -> `online` -> the indicator is gone (drained)
    -> RELOAD -> the job reads 1 of 2 (the server has it) -> unverify -> reload -> 0 of 2
⭐ LEG 2 - SURVIVES A RELOAD
    at rest -> `offline` -> verify -> indicator 1 (held) -> RELOAD while it is held
      -> the fresh app is online and replays IndexedDB -> 1 of 2, no pending indicator
    It never left before the reload: the queue was closed and the count held.

🛑 RESTORE - `always`: dispatch `online` (a closed queue would hold every later request), then a
conditional unverify (only if the first asset's box is checked), a reload and a HARD gate that
the job is back to 0 of 2. If a run dies half-way, `reset_av_fixture.py --apply` puts the
fixture back for 0 runs.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (step, xpath_el, test, write, jsassert, av_job_gate,  # noqa: E402
                      AV_JOBS_URL)

JOB_ID = "Z0EVwQcdJZhMURcBFkp0E0"        # reset_av_fixture.JOB_ID - "DATADOG MOBILE JOB"
DETAIL = f"{AV_JOBS_URL}/{JOB_ID}"
AT_REST = "0 out of 2 Assets Verified"
ONE = "1 out of 2 Assets Verified"
ALL_FILTER = '//label[.//span[normalize-space(.)="All"]]'
FIRST_BOX = '(//input[@type="checkbox"])[1]'

# The header's pending indicator: TransactionStatus = Indicator(label=count) around the `upload`
# icon (faUpload -> data-icon="upload", no aliases). It renders NOTHING at count 0.
PENDING_JS = ("const up = document.querySelector('svg[data-icon=\"upload\"]');\n"
              "const root = up && up.closest('[class*=\"mantine-Indicator-root\"]');\n"
              "const lab = root && root.querySelector('[class*=\"mantine-Indicator-indicator\"]');\n"
              "const pending = lab ? (lab.textContent || '').trim() : null;\n")
TEXT = "const t = (document.body.textContent || '');\n"


def dispatch(evt, always=False):
    return jsassert(f"Dispatch a window '{evt}' event — the queue {'opens' if evt == 'online' else 'closes'} "
                    "(`gateQueueLinkOnNetworkChange`, browser fallback)",
                    f"window.dispatchEvent(new Event('{evt}'));\nreturn true;", always=always, timeout=15)


def at_rest(label):
    return av_job_gate(JOB_ID) + [
        step("click", 'Switch to the "All" filter', {"element": xpath_el(DETAIL, ALL_FILTER)}, timeout=30),
        step("wait", "Wait for the All list to re-render", {"value": 2}),
        step("assertPageContains", f'FIXTURE GUARD ({label}): job at rest ("{AT_REST}")',
             {"value": AT_REST}, timeout=30),
        jsassert(f"BASELINE ({label}): no pending-transactions indicator, and the online wifi icon "
                 "is showing (the header rendered)",
                 PENDING_JS + "return pending === null && !!document.querySelector('[data-icon=\"wifi\"]');",
                 timeout=30),
    ]


def queue_one_verify(label):
    return [
        dispatch("offline"),
        step("wait", "Let the header re-render", {"value": 2}),
        jsassert(f"OFFLINE ({label}): the offline icon is showing — the event was delivered",
                 "return !!document.querySelector('[data-icon=\"wifi-slash\"]');", timeout=20),
        step("click", "Verify the first asset (VERIFY_ASSET — optimistic)",
             {"element": xpath_el(DETAIL, FIRST_BOX)}, timeout=30),
        step("wait", "Let the mutation reach the closed queue", {"value": 2}),
        jsassert(f"⭐ QUEUED ({label}): the pending indicator reads 1",
                 PENDING_JS + "return pending === '1';", timeout=20),
        step("wait", "Hold offline — an in-flight request would have resolved by now", {"value": 6}),
        jsassert(f"⭐ HELD ({label}): still 1 pending after 6s offline — the request never left",
                 PENDING_JS + "return pending === '1';", timeout=10),
    ]


def restore(label):
    """`always`: reopen the queue, unverify only if needed, reload, and a HARD gate."""
    return [
        dispatch("online", always=True),
        step("wait", "Let the queue drain", {"value": 4}, always=True),
        jsassert(f"RESTORE ({label}): unverify the first asset — only if its box is checked",
                 "const b = document.querySelector('input[type=\"checkbox\"]');\n"
                 "if (b && b.checked) b.click();\nreturn true;", always=True, timeout=20),
        step("wait", "Let the unverify reach the server", {"value": 4}, always=True),
    ] + [dict(s, alwaysExecute=True) for s in av_job_gate(JOB_ID)] + [
        step("click", 'Switch to the "All" filter', {"element": xpath_el(DETAIL, ALL_FILTER)},
             always=True, timeout=30),
        step("wait", "Wait for the All list to re-render", {"value": 2}, always=True),
        step("assertPageContains", f'RESTORED ({label}): job back at rest ("{AT_REST}") after a reload',
             {"value": AT_REST}, always=True, timeout=30),
        jsassert(f"RESTORED ({label}): nothing pending", PENDING_JS + "return pending === null;",
                 always=True, timeout=30),
    ]


steps = at_rest("leg 1") + queue_one_verify("leg 1") + [
    jsassert("Open the pending-transactions list (the indicator's icon)",
             "const up = document.querySelector('svg[data-icon=\"upload\"]');\n"
             "if (!up) return false;\n"
             "up.dispatchEvent(new MouseEvent('click', { bubbles: true }));\nreturn true;", timeout=20),
    step("wait", "Let the list read IndexedDB", {"value": 2}),
    jsassert("⭐ LISTED: `Pending Transactions` shows the held VERIFY_ASSET with verified:true",
             # JSON.stringify(variables, null, 2) -> `"verified": true`, with a space
             TEXT + "return t.includes('Pending Transactions') && t.includes('VERIFY_ASSET')\n"
             "  && /\"verified\":\\s*true/.test(t);", timeout=20),
    step("pressKey", "Close the list", {"value": "Escape"}),
    step("wait", "Let it close", {"value": 1}),
    jsassert("UI (optional: records whether the job counter follows the optimistic verify while "
             "it is unsent)", TEXT + f"return t.includes('{ONE}');", optional=True, timeout=10),
    dispatch("online"),
    step("wait", "Let the queue drain", {"value": 4}),
    jsassert("⭐ DRAINED: the pending indicator is gone once back online",
             PENDING_JS + "return pending === null;", timeout=30),
] + av_job_gate(JOB_ID) + [
    step("click", 'Switch to the "All" filter', {"element": xpath_el(DETAIL, ALL_FILTER)}, timeout=30),
    step("wait", "Wait for the All list to re-render", {"value": 2}),
    step("assertPageContains", f'⭐ SERVER HAS IT: after a reload the job reads "{ONE}"',
         {"value": ONE}, timeout=30),
] + restore("leg 1") + queue_one_verify("leg 2") + [
    # ---- leg 2: reload while the op is held -------------------------------------------------
] + [s for s in av_job_gate(JOB_ID)] + [
    step("click", 'Switch to the "All" filter', {"element": xpath_el(DETAIL, ALL_FILTER)}, timeout=30),
    step("wait", "Wait for the All list to re-render", {"value": 2}),
    step("assertPageContains", f'⭐ REPLAYED: the reloaded app sent the persisted op — "{ONE}"',
         {"value": ONE}, timeout=30),
    jsassert("⭐ …and nothing is pending any more (IndexedDB drained on startup)",
             PENDING_JS + "return pending === null;", timeout=30),
] + restore("leg 2")

write(test(
    "MOB.913_Offline_Transaction_Queue",
    "`MOB.913` **The offline queue holds, counts, drains and replays a mutation.**\n"
    "- In a browser the queue closes on window `offline` and opens on `online`\n"
    "  (`gateQueueLinkOnNetworkChange`) — the events `MOB.910` dispatches.\n"
    "- Leg 1: offline → verify an AV asset → header indicator **1**, still 1 after 6s (held) →\n"
    "  `Pending Transactions` lists `VERIFY_ASSET` → online → indicator gone → **reload: the server\n"
    "  has it** → unverify.\n"
    "- Leg 2: offline → verify → held → **reload while held** → the app replays IndexedDB on\n"
    "  startup → 1 of 2, nothing pending → unverify.\n"
    "- 🛑 Self-restoring (`always`): `online`, a conditional unverify, a reload and a hard\n"
    "  0-of-2 gate. `reset_av_fixture.py --apply` is the 0-run fallback.",
    steps,
    ["Mobile", "env:dev", "Offline", "Asset Verification", "self-restoring"],
))
print("wrote MOB.913 (offline transaction queue)")
