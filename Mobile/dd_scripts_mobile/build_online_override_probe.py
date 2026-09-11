"""Build MOB.980_DIAG_OnLine_Override - can a Synthetics step make the APP read
`navigator.onLine === false`?

THE ONE QUESTION
  `MOB.910`/`MOB.911` go offline by dispatching a window `offline` event, which flips every
  `useNetwork()` consumer. It does NOT change `navigator.onLine`, and several branches read that
  property directly (`origin/development`):

      components/AssetLookup/index.tsx:160   if (!window.navigator.onLine) return <ConnectionRequired />
      components/WorkOrders/components/MaterialCharges.tsx:104   the material-charge message ([-] today)
      components/AssetCollector/AssetGeolocate.tsx:272   the offline geolocate form (no test)
      graphql/index.tsx:69   RetryLink: a mutation that fails while offline is re-queued

  A `Run JavaScript` step that defines an OWN `onLine` getter on the `navigator` instance
  would shadow `Navigator.prototype.onLine` - IF the step runs in the page's JS world. If
  Datadog runs step code in an isolated world (as extensions do), the step sees its own
  override and the page never does. Reading `navigator.onLine` back in the step therefore
  proves NOTHING; only the APP's reaction counts.

⭐ THE DECISIVE READ: ConnectionRequired on Asset Lookup, reached WITHOUT a reload
  No `offline` event is dispatched, so Home's `useNetwork` stays online and the Asset Lookup
  tile stays visible. The tile click is an in-app route change (a `goToUrl` would reload and
  wipe any override). `AssetLookup/index.tsx:160` then reads the property at render:
      override seen   -> OFFLINE_FEATURE_MESSAGE, no search input
      override unseen -> the normal page (search input)
  Each outcome is an OPTIONAL step, so the run records which one happened.

TWO ROUTES, each judged by that read
  A  define the getter in the step's own code
  B  inject a <script> element, which always runs in the PAGE world (unless CSP blocks inline
     scripts - a third outcome, detected by a DOM attribute the script writes)
  A is removed before B (and B starts from a reload), so B's result is its own.

READ-ONLY. No mutation is sent: Asset Lookup's query is `skip: !navigator.onLine`, and nothing
is submitted. RESTORE is `always`: delete the getter in both worlds, then a full reload
(`goToUrl`) - a reload discards every JS-level override - and a hard gate that the app is
online again (property true, Asset Lookup tile back).

This is a probe, not coverage. If A or B reaches ConnectionRequired, the four branches above
become buildable (read-only ones first; the RetryLink branch only fires on a mutation, so it
stays out of scope until the owner names a flow). If neither does, 2 runs bought the answer.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

HOME = BASE + "/"
MESSAGE = "This feature requires an internet connection."          # OFFLINE_FEATURE_MESSAGE
TILE = '//img[starts-with(@alt, "icon for ") and contains(@alt, "Asset Lookup")]'
ATTR = "data-dd980-online"

TILE_JS = ("const tiles = () => [...document.querySelectorAll('img[alt^=\"icon for \"]')]"
           ".map(i => i.getAttribute('alt') || '');\n")
DEFINE = ("Object.defineProperty(navigator, 'onLine', "
          "{ configurable: true, get: function () { return false; } });")
UNDEFINE = "try { delete navigator.onLine; } catch (e) {}"
REPORT = f"document.documentElement.setAttribute('{ATTR}', String(navigator.onLine));"


def inject(name, code, **kw):
    """Run `code` in the PAGE world via a <script> element (works unless CSP blocks inline)."""
    return jsassert(name,
                    f"document.documentElement.removeAttribute('{ATTR}');\n"
                    "const s = document.createElement('script');\n"
                    f"s.textContent = {code!r};\n"
                    "document.head.appendChild(s);\n"
                    "s.remove();\n"
                    "return true;", timeout=15, **kw)


def home(label, always=False):
    return [
        go(HOME, label) if not always else step("goToUrl", f"Navigate to {label}", {"value": HOME},
                                                always=True),
        step("wait", "Let home render", {"value": 4}, always=always),
        step("assertPageContains", "GATE: the home screen rendered", {"value": "Welcome,"},
             always=always, timeout=60),
    ]


def reach(route):
    return [
        step("click", f"{route}: open Asset Lookup from its Home TILE (an in-app route change, "
             "no reload)", {"element": xpath_el(HOME, TILE)}, timeout=30),
        step("wait", "Let Asset Lookup render", {"value": 4}),
        jsassert(f"{route} ⭐ REACHED ConnectionRequired — the app read `navigator.onLine === "
                 "false` (optional: records the outcome)",
                 "return /\\/asset-lookup/.test(location.pathname)\n"
                 f"  && (document.body.textContent || '').includes('{MESSAGE}')\n"
                 "  && !document.querySelector('input[name=\"asset-search\"]');",
                 optional=True, timeout=20),
        jsassert(f"{route}: the NORMAL Asset Lookup rendered — the app did NOT see the override "
                 "(optional: records the outcome)",
                 "return /\\/asset-lookup/.test(location.pathname)\n"
                 "  && !!document.querySelector('input[name=\"asset-search\"]');",
                 optional=True, timeout=20),
    ]


steps = home("the home screen") + [
    jsassert("BASELINE: navigator.onLine is true and the Asset Lookup tile is on Home",
             TILE_JS + "return navigator.onLine === true && tiles().some(a => /Asset Lookup/i.test(a));",
             timeout=30),

    # ---- A: the step's own world -------------------------------------------------------------
    jsassert("A: define an own `onLine` getter (false) on navigator, from the step's code",
             DEFINE + "\nreturn navigator.onLine === false;", optional=True, timeout=15),
    inject("A: ask the PAGE world what it reads (a <script> writes it to a DOM attribute)",
           REPORT, optional=True),
    jsassert("A: the PAGE world reads false — the step shares the page's world (optional)",
             f"return document.documentElement.getAttribute('{ATTR}') === 'false';",
             optional=True, timeout=10),
    jsassert("A: the PAGE world reads true — the step runs in an ISOLATED world (optional)",
             f"return document.documentElement.getAttribute('{ATTR}') === 'true';",
             optional=True, timeout=10),
    jsassert("A: NO page-world answer — inline <script> is blocked (CSP) (optional)",
             f"return document.documentElement.getAttribute('{ATTR}') === null;",
             optional=True, timeout=10),
] + reach("A") + [
    jsassert("A: remove the step-world getter", UNDEFINE + "\nreturn true;", always=True, timeout=15),

    # ---- B: the page world, from a clean reload ----------------------------------------------
] + home("the home screen (clean reload for B)") + [
    inject("B: define the `onLine` getter (false) in the PAGE world via a <script>",
           DEFINE + " " + REPORT, optional=True),
    jsassert("B: the page-world override took — the script ran and read false (optional)",
             f"return document.documentElement.getAttribute('{ATTR}') === 'false';",
             optional=True, timeout=10),
] + reach("B") + [

    # ---- RESTORE: both worlds, then a reload, then a HARD gate -------------------------------
    inject("RESTORE: remove the page-world getter", UNDEFINE + " " + REPORT, always=True,
           optional=True),
    jsassert("RESTORE: remove the step-world getter", UNDEFINE + "\nreturn true;", always=True,
             timeout=15),
] + home("the home screen (reload discards any override)", always=True) + [
    jsassert("RESTORED: navigator.onLine is true and the Asset Lookup tile is back",
             TILE_JS + f"document.documentElement.removeAttribute('{ATTR}');\n"
             "return navigator.onLine === true && tiles().some(a => /Asset Lookup/i.test(a));",
             always=True, timeout=30),
]

write(test(
    "MOB.980_DIAG_OnLine_Override",
    "`MOB.980` **DIAGNOSTIC — can a step make the APP read `navigator.onLine === false`?**\n"
    "- `MOB.910`'s `offline` event flips `useNetwork()` only; `AssetLookup` (ConnectionRequired),\n"
    "  `MaterialCharges`, `AssetGeolocate` and `graphql/index.tsx`'s RetryLink read the property.\n"
    "- Judged ONLY by the app: Asset Lookup opened from its Home tile (no reload) shows\n"
    "  ConnectionRequired or the normal page. Route A = getter from the step; route B = getter\n"
    "  from an injected `<script>` (page world). Outcomes are optional steps, so the run records\n"
    "  which happened.\n"
    "- 🛑 **READ-ONLY**, and restores with `always` steps + a reload + a hard online gate.",
    steps,
    ["Mobile", "env:dev", "Diagnostic", "Offline", "read-only"],
))
print("wrote MOB.980 (navigator.onLine override probe)")
