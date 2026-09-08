"""Build MOB.911_Offline_Geolocate - OFFLINE_FEATURE_MESSAGE, the last unproven offline branch.

WHAT THIS CLOSES
  `OFFLINE_FEATURE_MESSAGE` ('This feature requires an internet connection.') is the app's one
  user-facing offline affordance, and nothing has ever asserted it. T1.1 has carried it as `[-]`
  and then `[~]` on the grounds that the offline state was unreachable. `MOB.910` disproved
  that; this is the test that finally reads the message.

  `GeolocateButton.tsx:101-117` renders it inside a `Popover` when `!online`, opened by the
  button's own `onClick`.

⚠️ THE OPEN QUESTION, AND WHY IT WAS ANSWERED FROM SOURCE RATHER THAN A PROBE RUN
  The button is `disabled={!online}` on an `ActionIcon component="span"` - and the thing that
  OPENS the popover is that same element's `onClick`. If `disabled` suppressed the click, the
  message would be unreachable BY DESIGN and this test could never pass. Three reads settle it:

    1. `component="span"` - `disabled` is only functional on FORM CONTROLS (button/input/
       select/textarea). On a `<span>` it is an inert attribute and does not block dispatch.
    2. Mantine's disabled rule for ActionIcon (`styles/ActionIcon.css:59`) sets `cursor`,
       `border`, `color` and `background` - and NO `pointer-events: none`.
    3. Neither `ActionIcon.mjs` nor `UnstyledButton` guards `onClick` on the disabled state.

  So the click should fire. That is an INFERENCE, not a measurement - but a single, well-
  understood interaction is a fair thing to let the test itself measure, unlike `MOB.134`'s
  chain of stacked assumptions. **If this test fails at the popover step, the finding is that
  `OFFLINE_FEATURE_MESSAGE` is unreachable by design - which is a genuine bug report, not a
  broken test.** Record it that way rather than fixing forward.

ROUTE - reuses MOB.348's proven path, which is why this is cheap
  /work (cache warm) -> fixture work order -> MapLink globe menu -> "Edit Location" ->
  `<form id="locationform">`, which renders `GeoLocateButton` in the Address field's
  `labelRightSection` (`LocationForm.tsx:67`). MOB.348 already asserts that control exists;
  this test asserts what it DOES when offline.

🛑 SELF-RESTORING ON TWO AXES, both `alwaysExecute`:
  the `online` dispatch (a session left offline degrades every later subtest - MOB.910's
  hazard), and the modal close (a left-open modal blocks everything behind it). Neither is
  optional. Nothing is ever submitted.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert, work_cache_warm  # noqa: E402

WORK_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
WORK_URL = f"{BASE}/work/{WORK_ID}"
MESSAGE = "This feature requires an internet connection."

GLOBE = ('//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class),'
         ' " "), " fa-globe ")]]')
EDIT_LOC = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")]'
            '[normalize-space(.)="Edit Location"]')
LOCATION_FORM = '//form[@id="locationform"]'

# The geolocate control is the `faLocation` ActionIcon in the Address field's
# labelRightSection.
# ⚠️ TRAP 14, AND IT BIT ON RUN 1 (2026-08-21). `faLocation` is NOT rendered as
# `data-icon="location"` - it is an ALIAS for `faLocationCrosshairs`, so the DOM carries
#     data-icon="location-crosshairs"
# `"location"` survives only as an entry in the icon's `aliases`, which is never emitted.
# Measured with:
#     node -e "console.log(require('@fortawesome/pro-regular-svg-icons/faLocation').iconName)"
# The package was available the whole time; run 1 guessed instead. Do not guess an icon name.
GEO_ICON = "location-crosshairs"
GEO_BTN = (f'//*[@data-icon="{GEO_ICON}" or contains(concat(" ", normalize-space(@class),'
           f' " "), " fa-{GEO_ICON} ")]')

# What to CLICK. The icon above is an <svg> inside the ActionIcon's inner slot; clicking the
# ROOT is what carries the onClick. Asserting the icon proves it is the GEOLOCATE control;
# clicking the root is what actually exercises it - the two are deliberately different nodes.
GEO_ROOT = ('//*[contains(concat(" ", normalize-space(@class), " "),'
            ' " mantine-ActionIcon-root ")]')

# ⚠️ RESOLVE THE ACTIONICON *ROOT*, NOT THE NEAREST SPAN.
# ActionIcon nests its children:  <span .mantine-ActionIcon-root>  <- carries data-disabled
#                                   <span .mantine-ActionIcon-icon>  <- inner slot, carries NOTHING
#                                     <svg data-icon="location-crosshairs">
# `icon.closest('span')` therefore returns the INNER slot, which never has `data-disabled` -
# so a disabled check written that way reads the wrong element and can only ever say "enabled".
# Caught by reading the component before run 2 rather than by another failed run.
# `component="span"` also means there is no `role="button"` and no `type` (UnstyledButton.mjs:53),
# which is why MOB.348's `button, [role=button]` count never counted this control at all.
GEO_STATE_JS = (
    "const f = document.getElementById('locationform');\n"
    "if (!f) return null;\n"
    "let el = f.querySelector('.mantine-ActionIcon-root');\n"
    "if (!el) {\n"
    f"  const icon = f.querySelector('[data-icon=\"{GEO_ICON}\"], .fa-{GEO_ICON}');\n"
    "  el = icon && icon.closest('[data-disabled]');\n"
    "}\n"
)


def dispatch(evt, always=False):
    return jsassert(f"Dispatch a window '{evt}' event",
                    f"window.dispatchEvent(new Event('{evt}'));\nreturn true;",
                    always=always, timeout=15)


steps = [
    *work_cache_warm(),
    go(WORK_URL, "the fixture work order"),
    step("wait", "Let the detail view begin rendering", {"value": 3}),
    step("assertElementPresent", "GATE 1/2: the /work/:id route mounted",
         {"element": xpath_el(WORK_URL, '//*[@id="page-title"]//h4')}, timeout=60),
    step("assertElementPresent", "GATE 2/2: the detail data arrived (tab strip)",
         {"element": xpath_el(WORK_URL, '(//*[@role="tab"])[1]')}, timeout=60),

    # ---- MOB.348's proven route to the location form ----------------------------------
    step("click", "Open the MapLink menu",
         {"element": xpath_el(WORK_URL, f"({GLOBE})[1]")}, timeout=30),
    step("assertElementPresent", 'GATE: poll until "Edit Location" exists — not a fixed wait',
         {"element": xpath_el(WORK_URL, EDIT_LOC)}, timeout=30),
    step("click", 'Open the location form via "Edit Location"',
         {"element": xpath_el(WORK_URL, EDIT_LOC)}, timeout=30),
    step("assertElementPresent", "GATE: the location form mounted",
         {"element": xpath_el(WORK_URL, LOCATION_FORM)}, timeout=30),

    # ---- BASELINE, asserted ONLINE. Without it, "the button is disabled" below would be
    # equally true of a form that never rendered the control at all (trap 5).
    step("assertElementPresent", "BASELINE: the geolocate control renders in the form",
         {"element": xpath_el(WORK_URL, f"({LOCATION_FORM}{GEO_BTN})[1]")}, timeout=30),
    jsassert("BASELINE: it is ENABLED while online — the state we are about to change",
             GEO_STATE_JS +
             "if (!el) return false;\n"
             "return !el.hasAttribute('data-disabled') && !el.disabled;", timeout=30),
    jsassert(f'BASELINE: the offline message is NOT on screen yet',
             f"return !(document.body.innerText || '').includes({MESSAGE!r});", timeout=15),

    # ---- GO OFFLINE --------------------------------------------------------------------
    dispatch("offline"),
    step("wait", "Let React re-render the gated controls", {"value": 3}),

    jsassert("⭐ the geolocate control is now DISABLED — it gates on `online`",
             GEO_STATE_JS +
             "if (!el) return false;\n"
             "return el.hasAttribute('data-disabled') || el.disabled === true;",
             always=True, timeout=30),

    # ---- ⭐⭐ THE POINT: click it and read the message ----------------------------------
    # See the module docstring. If this step or the next fails, the finding is that
    # OFFLINE_FEATURE_MESSAGE is UNREACHABLE BY DESIGN — a bug report, not a broken test.
    step("click", "Click the disabled control — its onClick is what opens the Popover",
         {"element": xpath_el(WORK_URL, f"({LOCATION_FORM}{GEO_ROOT})[1]")},
         always=True, timeout=30),
    step("wait", "Let the popover open", {"value": 2}, always=True),
    jsassert(f'⭐⭐ OFFLINE_FEATURE_MESSAGE is shown — "{MESSAGE}"',
             f"return (document.body.innerText || '').includes({MESSAGE!r});",
             always=True, timeout=30),
    jsassert("it is in a POPOVER, not loose page text — the `!online` branch of "
             "GeolocateButton, not something else on the page saying the same thing",
             "const ds = [...document.querySelectorAll('.mantine-Popover-dropdown')];\n"
             f"return ds.some(d => (d.textContent || '').includes({MESSAGE!r}));",
             always=True, timeout=30),

    # ---- RESTORE axis 1: online. A session left offline degrades every later subtest.
    dispatch("online", always=True),
    step("wait", "Let React re-render", {"value": 3}, always=True),
    jsassert("RESTORED: the control is ENABLED again",
             GEO_STATE_JS +
             "if (!el) return false;\n"
             "return !el.hasAttribute('data-disabled') && !el.disabled;",
             always=True, timeout=30),

    # ---- RESTORE axis 2: the modal. A left-open modal blocks everything behind it.
    step("pressKey", "Close the popover", {"value": "Escape"}, always=True),
    step("wait", "Let the popover close", {"value": 1}, always=True),
    step("pressKey", "Close the location modal WITHOUT submitting", {"value": "Escape"},
         always=True),
    step("wait", "Let the modal close", {"value": 2}, always=True),
    jsassert("RESTORED: the location form is gone — nothing was submitted",
             "return !document.getElementById('locationform');", always=True, timeout=30),
]

write(test(
    "MOB.911_Offline_Geolocate",
    "`MOB.911` **`OFFLINE_FEATURE_MESSAGE`** — the app's one user-facing offline affordance,\n"
    "and the last unproven offline branch.\n"
    "- **Never asserted before.** T1.1 carried it as unreachable because the offline *state*\n"
    "  was unreachable. `MOB.910` disproved that; this test finally reads the message.\n"
    "- **Route** reuses `MOB.348`'s proven path — MapLink globe → `Edit Location` →\n"
    "  `<form id=\"locationform\">`, which renders `GeoLocateButton` in the Address field.\n"
    "- ⚠️ **The open question, settled from source**: the button is `disabled={!online}` on an\n"
    "  `ActionIcon component=\"span\"`, and its own `onClick` is what opens the popover. It\n"
    "  should still fire — `disabled` is only functional on form controls, Mantine's disabled\n"
    "  rule sets **no `pointer-events: none`**, and nothing guards the handler. That is an\n"
    "  inference, and this test is what measures it.\n"
    "- 🛑 **If the popover steps fail, the finding is that the message is UNREACHABLE BY\n"
    "  DESIGN — a bug report, not a broken test.** Do not fix forward.\n"
    "- **Both negatives are paired with baselines asserted while ONLINE** (control present,\n"
    "  enabled, message absent), so \"it is disabled\" cannot pass on a form that never\n"
    "  rendered (trap 5). The message is also asserted to be inside a\n"
    "  `.mantine-Popover-dropdown`, not merely present as page text.\n"
    "- **Self-restoring on two axes**, both `alwaysExecute`: the `online` dispatch, and the\n"
    "  modal close. Nothing is ever submitted.",
    steps,
    tags=["Mobile", "env:dev", "Offline", "Work Orders", "read-only"],
))
print("wrote MOB.911 (offline geolocate — OFFLINE_FEATURE_MESSAGE)")
