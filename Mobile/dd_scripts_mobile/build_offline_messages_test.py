"""Build MOB.914_Offline_Feature_Messages - Asset Lookup's offline messages.

WHAT THE SOURCE SAYS (origin/development) - three `useNetwork` consumers in the asset detail
  `AssetLookup/AssetLookupDetails/EventReadings.tsx`
      :240  `if (!fields.length && !online) return <Text>{OFFLINE_FEATURE_MESSAGE}</Text>`
            - on an asset with no readings, the whole Readings tab becomes the message offline
            (the same tab online reads `No readings recorded for this asset.` - MOB.721)
  `AssetLookup/AssetLookupDetails/WorkHistory.tsx`
      :132  `if (!data?.assetWorkHistory?.edges && !online) return <Text>{OFFLINE_FEATURE_MESSAGE}</Text>`
            - a tab that has NOT loaded yet shows the message offline
  `AssetLookup/AssetLookupDetails/index.tsx` + `ui/PhotoCarousel/PhotoMenu.tsx`
      `Get Description` is `disabled: isVideo || !online`, `showConnectionHintWhenDisabled` -> offline,
      its click is swallowed and a popover shows the message instead of posting to the AI route
  ⚠️ TWO THINGS DECIDE THE ORDER (local run 1 went red on both)
    - Mantine's `useNetwork` (8.3.18) starts `online: true` and copies `navigator.onLine` on MOUNT; only
      an instance ALREADY MOUNTED flips on a dispatched `offline`. A tab opened after the event is online.
    - The same event closes the app's queue, so a query a tab fires while closed is HELD - the tab
      sits in its loading state (EventReadings checks `loading` BEFORE `online`).
    So Readings is opened ONLINE (it answers `No readings recorded…`), then `offline` flips it to the
    message - one tab, both states. Work History checks `online` BEFORE loading: `offline` closes the
    queue, the tab is opened (its query held, the new instance still online), and `offline` is
    dispatched AGAIN so that instance flips - the message, not a spinner.
  A dispatched window `offline` event reaches all three (MOB.910's recipe). Asset Lookup's own
  `ConnectionRequired` gate reads `navigator.onLine`, which the event does not change, so the
  page stays usable (MOB.912 proves that screen separately).

FIXTURES
  `⚡ Building 0000` - no readings (MOB.721's asset); its Work History tab is never opened first.
  `⚡ Tank 0000` - the AV fixture asset, which has photos (MOB.546). ONLY `Get Description` is
  ever clicked, and only after the same step proves the offline icon is showing and the item is
  styled disabled - online that click would post the photo to the AI route. `Rotate Image`,
  `Set as Avatar` and `Delete Photo` are never touched (Set as Avatar is NOT offline-gated).

`Tank 0000` READINGS - `EventReadings.tsx:260-302`: with `canCreate` (Asset Lookup passes
  `eventPermissions.create`) and no workflow list, an `Add reading types` button sits in the panel; offline
  its click toggles a Popover holding the message instead of opening the AddReadingTypes modal. The panel
  keeps its fields offline only when the asset HAS readings (`latestReadings`, read by `useFragment` from
  the cache - `:240` replaces the whole tab when there are none), so it is Tank 0000, opened ONLINE first.
  Not a menu item: the popover stays open, no recorder needed.

🛑 READ-ONLY. `online` is dispatched again with `alwaysExecute` before the end, and the page is
reloaded so no later subtest inherits an offline `useNetwork`.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

LOOKUP_URL = BASE + "/asset-lookup"
MESSAGE = "This feature requires an internet connection."          # OFFLINE_FEATURE_MESSAGE, verbatim
SEARCH = '//input[@name="asset-search"]'
PAGE_TITLE = '//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]'


def tok(cls):
    return f'contains(concat(" ", normalize-space(@class), " "), " {cls} ")'


def item(name):
    return (f'(//*[{tok("mantine-Accordion-item")}]'
            f'[.//*[{tok("mantine-Accordion-control")}][contains(., "{name}")]])[1]')


def tab(name, label):
    return f'{item(name)}//*[@role="tab"][normalize-space(.)="{label}"]'


def panel_js(name):
    """The named row's ACTIVE tab panel -> `p`, its text -> `t`, the active tab -> `tabEl`."""
    return (
        "const items = [...document.querySelectorAll('[class*=\"mantine-Accordion-item\"]')];\n"
        "const it = items.find(i => { const c = i.querySelector('[class*=\"mantine-Accordion-control\"]');\n"
        f"  return c && (c.textContent || '').includes('{name}'); }});\n"
        "if (!it) return false;\n"
        "const tabEl = it.querySelector('[role=\"tab\"][aria-selected=\"true\"], [role=\"tab\"][data-active]');\n"
        "const byId = tabEl && tabEl.getAttribute('aria-controls')\n"
        "  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;\n"
        "const p = byId || [...it.querySelectorAll('[role=\"tabpanel\"]')].find(x => x.style.display !== 'none');\n"
        "if (!p || !tabEl) return false;\n"
        "const t = (p.textContent || '');\n")


OFFLINE_ICON = "!!document.querySelector('[data-icon=\"wifi-slash\"]')"


def search_and_expand(name):
    return [
        step("click", "Focus the search input", {"element": xpath_el(LOOKUP_URL, SEARCH)}, timeout=30),
        step("pressKey", "Select any persisted query first (typeText APPENDS — trap 17)",
             {"value": "a", "modifiers": ["Control"]}),
        step("typeText", f"Search for {name}", {"value": name, "element": xpath_el(LOOKUP_URL, SEARCH)}),
        step("pressKey", "Submit the search (Enter)", {"value": "Enter"}),
        step("wait", "Wait for the search results (network-only)", {"value": 8}),
        step("click", f"Expand {name}'s row by its chevron (never the avatar — bugs §35)",
             {"element": xpath_el(LOOKUP_URL, f'{item(name)}//*[{tok("mantine-Accordion-chevron")}]')},
             timeout=30),
        step("wait", "Let the detail panel mount", {"value": 3}),
    ]


def go_offline():
    return [
        jsassert("Go OFFLINE — dispatch a window `offline` event (`useNetwork`)",
                 "window.dispatchEvent(new Event('offline'));\nreturn true;", timeout=15),
        step("wait", "Let the detail re-render offline", {"value": 2}),
        jsassert("OFFLINE: the header shows the offline icon (`wifi-slash`)", f"return {OFFLINE_ICON};",
                 timeout=20),
    ]


BUILDING, TANK = "Building 0000", "Tank 0000"

steps = [
    go(LOOKUP_URL, "Asset Lookup"),
    step("wait", "Wait for the page to mount", {"value": 5}),
    step("assertElementContent", 'Test the "Asset Lookup" page rendered',
         {"check": "contains", "value": "Asset Lookup", "element": xpath_el(LOOKUP_URL, PAGE_TITLE)},
         timeout=30),
    # ---- Building 0000: Readings (no fields) and Work History (never loaded) -------------------------
] + search_and_expand(BUILDING) + [
    step("click", 'Open its "Readings" tab (ONLINE — its query must answer first)',
         {"element": xpath_el(LOOKUP_URL, tab(BUILDING, "Readings"))}, timeout=30),
    step("wait", "Let the Readings panel render", {"value": 3}),
    jsassert("ONLINE HALF: the Readings tab reads `No readings recorded for this asset.` (MOB.721's empty state)",
             panel_js(BUILDING) + "return (tabEl.textContent || '').trim() === 'Readings'\n"
             "  && t.includes('No readings recorded for this asset.');", timeout=30),
] + go_offline() + [
    jsassert(f"⭐ READINGS OFFLINE: the SAME tab is now `{MESSAGE}` — not `No readings recorded for this asset.` "
             "(`EventReadings.tsx:240`)",
             panel_js(BUILDING) + "return (tabEl.textContent || '').trim() === 'Readings'\n"
             f"  && t.includes('{MESSAGE}') && !t.includes('No readings recorded for this asset.');", timeout=30),
    step("click", 'Open its "Work History" tab (the queue is closed: its query is held)',
         {"element": xpath_el(LOOKUP_URL, tab(BUILDING, "Work History"))}, timeout=30),
    step("wait", "Let the Work History panel mount", {"value": 2}),
    jsassert("Dispatch `offline` AGAIN — the freshly mounted Work History instance started online (`useNetwork` on mount)",
             "window.dispatchEvent(new Event('offline'));\nreturn true;", timeout=15),
    step("wait", "Let the Work History panel re-render", {"value": 2}),
    jsassert(f"⭐ WORK HISTORY OFFLINE: the tab is `{MESSAGE}` (`WorkHistory.tsx:132`)",
             panel_js(BUILDING) + "return (tabEl.textContent || '').trim() === 'Work History'\n"
             f"  && t.includes('{MESSAGE}');", timeout=30),
    jsassert("Back ONLINE before the next asset — dispatch `online`",
             "window.dispatchEvent(new Event('online'));\nreturn true;", always=True, timeout=15),
    step("wait", "Let it re-render online", {"value": 2}, always=True),

    # ---- Tank 0000: Readings' `Add reading types` (EventReadings.tsx:300), then the photo menu -----------
] + search_and_expand(TANK) + [
    step("click", 'Open its "Readings" tab (ONLINE — its latest readings must load first)',
         {"element": xpath_el(LOOKUP_URL, tab(TANK, "Readings"))}, timeout=30),
    step("wait", "Let the Readings panel render", {"value": 3}),
    jsassert("FIXTURE GUARD: Tank 0000's Readings panel lists readings (`N of M recorded recently`) and offers `Add reading types`",
             panel_js(TANK) + "return /\\d+ of \\d+ recorded recently/.test(t) && !!p.querySelector('[aria-label=\"Add reading types\"]');",
             timeout=30),
] + go_offline() + [
    jsassert("OFFLINE, the SAME panel still lists its readings and the button — the tab is not replaced by the message",
             panel_js(TANK) + "return /\\d+ of \\d+ recorded recently/.test(t) && !!p.querySelector('[aria-label=\"Add reading types\"]');",
             timeout=30),
    jsassert("🛑 GUARD + click `Add reading types` — ONLY while offline (online it opens the AddReadingTypes modal)",
             f"if (!{OFFLINE_ICON}) return false;\n" + panel_js(TANK) +
             "const b = p.querySelector('[aria-label=\"Add reading types\"]');\nif (!b) return false;\nb.click();\nreturn true;",
             timeout=30),
    step("wait", "Let the popover open", {"value": 1}),
    jsassert(f"⭐ ADD READING TYPES OFFLINE: its popover reads `{MESSAGE}` (`EventReadings.tsx:300`) — no AddReadingTypes modal",
             "const d = [...document.querySelectorAll('.mantine-Popover-dropdown')]\n"
             f"  .find(x => (x.textContent || '').includes('{MESSAGE}'));\n"
             "return !!d && !document.querySelector('.mantine-Modal-content');", timeout=20),
    jsassert("Back ONLINE before the photo menu — dispatch `online`",
             "window.dispatchEvent(new Event('online'));\nreturn true;", always=True, timeout=15),
    step("pressKey", "Close the popover (Escape)", {"value": "Escape"}, always=True),
    step("wait", "Let it re-render online", {"value": 2}, always=True),
    step("click", 'Open its "Photos" tab', {"element": xpath_el(LOOKUP_URL, tab(TANK, "Photos"))}, timeout=30),
    step("wait", "Let the photos render", {"value": 4}),
    jsassert("FIXTURE GUARD: Tank 0000's Photos panel shows at least one photo with a gear",
             panel_js(TANK) + "return !!p.querySelector('[class*=\"mantine-Carousel-slide\"] [aria-label=\"Settings\"]');",
             timeout=30),
] + go_offline() + [
    jsassert("Open the first photo's gear menu", panel_js(TANK) +
             "const g = p.querySelector('[class*=\"mantine-Carousel-slide\"] [aria-label=\"Settings\"]');\n"
             "if (!g) return false;\ng.click();\nreturn true;", timeout=30),
    step("wait", "Let the menu open", {"value": 1}),
    # ⚠️ A menu item's offline popover can FLASH: the click closes the menu and the popover is anchored to the
    # item (MOB.626's `Add Asset Photo`: seen at 7ms, gone by 200ms). A MutationObserver set BEFORE the click
    # records it; a live read after a wait may never see it.
    jsassert("🛑 GUARD + record + click `Get Description` — ONLY while offline AND styled disabled (online it posts to the AI route)",
             f"if (!{OFFLINE_ICON}) return false;\n"
             "window.__dd914Seen = 0;\n"
             f"new MutationObserver(() => {{ if ((document.body.textContent || '').includes('{MESSAGE}')) window.__dd914Seen++; }})\n"
             "  .observe(document.body, { childList: true, subtree: true, characterData: true });\n"
             "const it = [...document.querySelectorAll('.mantine-Menu-dropdown .mantine-Menu-item')]\n"
             "  .find(i => (i.textContent || '').trim() === 'Get Description');\n"
             "if (!it || !(it.getAttribute('style') || '').includes('opacity')) return false;\n"
             "it.click();\nreturn true;", timeout=30),
    step("wait", "Let the popover open", {"value": 1}),
    jsassert(f"⭐ GET DESCRIPTION OFFLINE: `{MESSAGE}` was rendered (recorded by the observer — `PhotoMenu.tsx` connection hint)",
             "return (window.__dd914Seen || 0) > 0;", timeout=20),
    jsassert("📊 (optional) the message is still on screen once the menu has closed — red while bugs §43 is open (it flashes and unmounts with the menu)",
             "return !document.querySelector('.mantine-Menu-dropdown')\n"
             f"  && (document.body.textContent || '').includes('{MESSAGE}');", optional=True, timeout=5),

    # ---- restore ------------------------------------------------------------------------------------------
    jsassert("RESTORE: dispatch `online`", "window.dispatchEvent(new Event('online'));\nreturn true;",
             always=True, timeout=15),
    step("pressKey", "Close the menu/popover (Escape — no modal is open here)", {"value": "Escape"}, always=True),
    step("goToUrl", "Reload Asset Lookup so no later subtest inherits an offline `useNetwork`",
         {"value": LOOKUP_URL}, always=True),
    step("wait", "Let it mount", {"value": 4}, always=True),
    jsassert("RESTORED: the online icon is back (`wifi`), not `wifi-slash`",
             "return !!document.querySelector('[data-icon=\"wifi\"]') && !document.querySelector('[data-icon=\"wifi-slash\"]');",
             always=True, timeout=30),
]

write(test(
    "MOB.914_Offline_Feature_Messages",
    "`MOB.914` **Asset Lookup's offline messages** — a dispatched `offline` event (`useNetwork`).\n"
    f"- `Building 0000`: the Readings tab becomes **`{MESSAGE}`** (not its online empty state) and a\n"
    "  never-loaded Work History tab shows the same message.\n"
    "- `Tank 0000`: with its readings loaded online, `Add reading types` offline opens the message popover\n"
    "  (`EventReadings.tsx:300`), not the add-types modal.\n"
    "- `Tank 0000`: the photo menu's `Get Description` is disabled offline — its click opens the message\n"
    "  instead of posting to the AI route. 🛑 Clicked only while the offline icon shows; nothing else in\n"
    "  the menu is ever touched.\n"
    "- 🛑 READ-ONLY. `online` is restored `always` and the page reloaded.",
    steps,
    ["Mobile", "env:dev", "Offline", "Asset Lookup", "read-only"],
))
print("wrote MOB.914 (Asset Lookup offline messages)")
