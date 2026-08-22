"""Build MOB.348_Work_MapLink - the globe menu on the work order title, and its LocationForm.

WHY THIS EXISTS
  `WorkDetails.tsx:78` renders `<MapLink workStage={workStage} />` inside the title. It was
  never listed in the checklist until the 2026-08-18 walk of `client/mobile`, and it is one of
  the very few places mobile EDITS geodata: its menu opens a `LocationForm` that writes
  `address`, `x` and `y` back to the work stage.

READ-ONLY BY DESIGN
  Submitting would overwrite the fixture work order's real address and coordinates, and
  restoring needs the ORIGINAL values - which Datadog can extract but cannot feed back into a
  locator or a typed value reliably (the standing "restore with FIXED values" limitation). The
  form's geolocate button is Appendix C territory besides. So this proves the entry point, the
  menu, and the form, and stops before submitting.

  ⚠️ DO NOT CLICK "View in Map". It navigates away to `/map` with router state, which would
  abandon the work order mid-test and leave the following steps looking at the wrong screen.
  Its presence is asserted; it is never actioned. (Nor is it a loss: `MOB.120`/`MOB.121`
  already cover the map route itself.)

WHAT THE MENU'S DISABLED STATES ENCODE - and why only one of them is asserted
  - `View in Map` is `disabled={!x || !y}`  - DATA-dependent. The fixture may or may not have
    coordinates, so asserting either state would be a fixture test rather than a code test.
    Asserted as PRESENT only.
  - `Edit Location` is `disabled={!permissions}` where permissions is `work.update`. That is
    ROLE-dependent, and every suite already guards that the session role is exactly `Admin`,
    which has update. So this one IS asserted enabled - it is a real check on the permission
    wiring, and it fails loudly if the role drifts.

MODAL DISMISSAL: this modal is opened by `MapLink` with no modalProps, so Mantine renders its
default close button - the same shape as MOB.347's, and unlike MOB.720's picker which is
opened with `withCloseButton: false` and has to be dismissed by clicking the overlay. Both
paths are tried, optional, with a critical "the form is gone" assertion holding it honest.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write,  # noqa: E402
                      jsassert, work_cache_warm)

WORK_URL = BASE + "/work"
WORK_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
WORK_DETAIL = f"{WORK_URL}/{WORK_ID}"

# faGlobe -> canonical `globe`, already measured for MOB.341's ToggleMapViewButton (trap 14).
# That button lives on the work LIST; this one is on the DETAIL, so they never collide - but
# the locator matches both spellings anyway, as the rest of the suite does.
GLOBE = ('//button[.//*[@data-icon="globe"'
         ' or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]]')
MENU_ITEM = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")]'
             '[normalize-space(.)="{}"]')
LOCATION_FORM = '//form[@id="locationform"]'
OVERLAY = ('//*[contains(concat(" ", normalize-space(@class), " "),'
           ' " mantine-Modal-overlay ")]')

steps = (
    work_cache_warm()
    + [
        go(WORK_DETAIL, "the fixture work order"),
        step("wait", "Let the detail view begin rendering", {"value": 3}),
        step("assertElementPresent", "GATE 1/2: the /work/:id route mounted",
             {"element": xpath_el(WORK_DETAIL, '//*[@id="page-title"]//h4')}, timeout=60),
        step("assertElementPresent", "GATE 2/2: the detail data arrived (tab strip)",
             {"element": xpath_el(WORK_DETAIL, '(//*[@role="tab"])[1]')}, timeout=60),

        # ---- the globe control on the title -------------------------------------------
        step("assertElementPresent", "The MapLink globe control renders on the title",
             {"element": xpath_el(WORK_DETAIL, GLOBE)}, timeout=60),
        step("click", "Open the MapLink menu",
             {"element": xpath_el(WORK_DETAIL, f"({GLOBE})[1]")}, timeout=30),
        step("wait", "Let the menu open", {"value": 2}),

        # ---- both menu items ----------------------------------------------------------
        step("assertElementPresent", 'The menu offers "View in Map" (asserted, NEVER clicked '
             "— it navigates away to /map)",
             {"element": xpath_el(WORK_DETAIL, MENU_ITEM.format("View in Map"))}, timeout=30),
        step("assertElementPresent", 'The menu offers "Edit Location"',
             {"element": xpath_el(WORK_DETAIL, MENU_ITEM.format("Edit Location"))},
             timeout=30),
        # ROLE-dependent, not data-dependent - so this is a real assertion about the
        # permission wiring rather than about the fixture's coordinates.
        jsassert('"Edit Location" is ENABLED — the session role has work.update',
                 "const it = [...document.querySelectorAll('.mantine-Menu-item')]"
                 ".find(e => (e.textContent||'').trim() === 'Edit Location');\n"
                 "if (!it) return false;\n"
                 "return !it.disabled && it.getAttribute('data-disabled') === null;",
                 timeout=30),

        # ---- the LocationForm ----------------------------------------------------------
        step("click", 'Open the location form via "Edit Location"',
             {"element": xpath_el(WORK_DETAIL, MENU_ITEM.format("Edit Location"))},
             timeout=30),
        step("wait", "Let the modal open", {"value": 2}),
        step("assertElementPresent", "The location form mounted",
             {"element": xpath_el(WORK_DETAIL, LOCATION_FORM)}, timeout=60),
        jsassert("It has all three fields — Address, X and Y",
                 "const f = document.getElementById('locationform');\n"
                 "if (!f) return false;\n"
                 "const t = f.innerText || '';\n"
                 "return /\\bAddress\\b/.test(t) && /\\bX\\b/.test(t) && /\\bY\\b/.test(t);",
                 timeout=30),
        # The geolocate button lives in the Address field's labelRightSection. Actually USING
        # it needs device geolocation (Appendix C); that it renders is still worth asserting,
        # because it is the entry point to the only geodata capture path in this form.
        jsassert("The geolocate control renders inside the form (using it is Appendix C)",
                 "const f = document.getElementById('locationform');\n"
                 "if (!f) return false;\n"
                 "return f.querySelectorAll('button, [role=button]').length >= 2;",
                 optional=True, timeout=30),

        # ---- dismiss WITHOUT submitting -------------------------------------------------
        step("click", "Dismiss via the modal's close button",
             {"element": xpath_el(
                 WORK_DETAIL,
                 '//button[contains(concat(" ", normalize-space(@class), " "),'
                 ' " mantine-Modal-close ") or @aria-label="Close"]')},
             optional=True, always=True, timeout=15),
        step("wait", "Let the modal react", {"value": 1}, always=True),
        step("click", "Fallback: dismiss by clicking the overlay",
             {"element": xpath_el(WORK_DETAIL, OVERLAY)},
             optional=True, always=True, timeout=15),
        step("wait", "Let the modal close", {"value": 2}, always=True),
        jsassert("The location form is gone — nothing was submitted",
                 "return !document.getElementById('locationform');",
                 always=True, timeout=30),
    ]
)

write(test(
    "MOB.348_Work_MapLink",
    "`MOB.348` The **globe menu on the work order title** and its `LocationForm` — one of the\n"
    "few places mobile edits geodata, and unlisted until the 2026-08-18 walk.\n"
    "- **READ-ONLY by design.** Submitting overwrites the fixture's real `address`/`x`/`y`, and\n"
    "  restoring needs the original values, which cannot be fed back into a locator. Making it\n"
    "  mutate is an owner decision, not a tidy-up.\n"
    "- ⚠️ **`View in Map` is asserted but NEVER clicked** — it navigates away to `/map` and\n"
    "  would abandon the work order mid-test. `MOB.120`/`MOB.121` already cover the map route.\n"
    "- **Only one disabled state is asserted, deliberately.** `View in Map` is\n"
    "  `disabled={!x || !y}` — data-dependent, so asserting it either way would be a fixture\n"
    "  test. `Edit Location` is `disabled={!work.update}` — role-dependent, and every suite\n"
    "  already guards the role is `Admin`, so it is asserted ENABLED and fails loudly on drift.\n"
    "- Modal dismissal tries the close button then the overlay (MOB.347's shape, not\n"
    "  MOB.720's), with a critical *the form is gone* assertion holding it honest.",
    steps,
    tags=["Mobile", "env:dev", "Work Orders", "read-only"],
))
print("wrote MOB.348 (work order MapLink + LocationForm)")
