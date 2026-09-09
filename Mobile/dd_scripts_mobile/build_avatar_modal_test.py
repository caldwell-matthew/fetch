"""Build MOB.624_Collector_Row_Avatar_Modal - the row avatar opens the asset's attachments
modal (checklist 🟢 #15).

WHAT SHIPPED WITHOUT A TEST
  `AssetAvatarWithModal.tsx` wraps every collector and work-asset row's avatar in a click target
  (its `Indicator` badge is the image/video attachment count) that opens a FULLSCREEN modal
  (`withCloseButton={false}`) holding the asset name, `SegmentedAssetAttachments` (a Photos /
  Docs `SegmentedControlWithIcons`, values `1` / `2`) and a `Done` button. The avatar's click
  handler stops propagation, so it never toggles the accordion.

THE FIXTURE IS `MOB.623`'S RESIDUE
  `MOB.623` uploads one photo per run onto the newest `DD SYNTHETIC MOBILE` asset, so that row's
  badge is >= 1 and its Photos segment has a carousel. This runs after `MOB.623` in `MOB.994`.

⭐ PHOTOS vs DOCS IS A BICONDITIONAL - `MOB.741`'s shape, on the modal rather than a tab
  Photos: a carousel and `Add Photo` (`asset.update`), NO `Add File`. Docs: `Add File`
  (`asset.create`), NO `Add Photo`, NO carousel. Segments are switched by clicking the radio INPUT
  by value - the labels are rendered by `useMediaQuery` inside a loop and are nondeterministic
  (bugs §22), and the control is scoped to the modal (trap 3).

🛑 Nothing is uploaded: `FileAttachments.addFiles` has no image filter, so an upload here lands.
  `Done` is the component's own dismissal and writes nothing.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

COLLECTOR_URL = BASE + "/asset-collector"
MARKER = "DD SYNTHETIC MOBILE"


def tok(cls):
    return f'contains(concat(" ", normalize-space(@class), " "), " {cls} ")'


ITEM = (f'(//*[{tok("mantine-Accordion-item")}]'
        f'[.//*[{tok("mantine-Accordion-control")}][contains(., "{MARKER}")]])[1]')
AVATAR = f'{ITEM}//*[{tok("mantine-Indicator-root")}]'
DONE = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
        '//button[normalize-space(.)="Done"]')

MODAL_JS = ("const m = document.querySelector('.mantine-Modal-content');\n"
            "if (!m) return false;\n")
BUTTONS = "const t = [...m.querySelectorAll('button')].map(b => (b.textContent || '').trim());\n"
CAROUSEL = "[class*=\"mantine-Carousel\"]"


def switch_segment(value, label):
    return [
        jsassert(f'Switch to the "{label}" segment by VALUE ({value}) — never by label (§22)',
                 MODAL_JS +
                 "const root = m.querySelector('[class*=\"mantine-SegmentedControl-root\"]');\n"
                 "if (!root) return false;\n"
                 f"const el = root.querySelector('input[type=\"radio\"][value=\"{value}\"]');\n"
                 "if (!el) return false;\n"
                 "el.click();\n"
                 "return true;", timeout=30),
        step("wait", f"Let the {label} panel mount", {"value": 3}),
    ]


steps = [
    go(COLLECTOR_URL, "the asset collector"),
    step("wait", "Wait for the collector to load its lookup cache", {"value": 15}),
    step("assertElementPresent", "The collector page rendered",
         {"element": xpath_el(COLLECTOR_URL, '//*[@id="page-title"]//h4')}, timeout=30),
    step("assertElementPresent",
         f'FIXTURE GUARD: a "{MARKER}" asset is in the collected list (MOB.600 residue)',
         {"element": xpath_el(COLLECTOR_URL, ITEM)}, timeout=60, soft=True),
    jsassert("FIXTURE GUARD: its badge (image/video attachment count) is not 0 — MOB.623 residue",
             "const items = [...document.querySelectorAll('.mantine-Accordion-item')];\n"
             "const it = items.find(i => {\n"
             "  const c = i.querySelector('.mantine-Accordion-control');\n"
             f"  return c && (c.textContent || '').includes('{MARKER}');\n"
             "});\n"
             "if (!it) return false;\n"
             "const b = it.querySelector('.mantine-Indicator-indicator');\n"
             "return !!b && (b.textContent || '').trim() !== '0';", timeout=30, soft=True),
    jsassert("BASELINE: the row is collapsed and no modal is open",
             "const items = [...document.querySelectorAll('.mantine-Accordion-item')];\n"
             "const it = items.find(i => {\n"
             "  const c = i.querySelector('.mantine-Accordion-control');\n"
             f"  return c && (c.textContent || '').includes('{MARKER}');\n"
             "});\n"
             "if (!it) return false;\n"
             "const c = it.querySelector('.mantine-Accordion-control');\n"
             "return c.getAttribute('aria-expanded') === 'false'"
             " && !document.querySelector('.mantine-Modal-content');", timeout=30),
    step("click", "Click the row's avatar", {"element": xpath_el(COLLECTOR_URL, AVATAR)},
         timeout=30),
    step("wait", "Let the fullscreen modal mount", {"value": 3}),
    jsassert("⭐ The modal opened, names the asset, and offers `Done` — and the avatar's click did "
             "NOT expand the accordion (stopPropagation)",
             MODAL_JS + BUTTONS +
             f"const named = (m.textContent || '').includes('{MARKER}');\n"
             "const items = [...document.querySelectorAll('.mantine-Accordion-item')];\n"
             "const it = items.find(i => {\n"
             "  const c = i.querySelector('.mantine-Accordion-control');\n"
             f"  return c && (c.textContent || '').includes('{MARKER}');\n"
             "});\n"
             "const collapsed = !!it && it.querySelector('.mantine-Accordion-control')"
             ".getAttribute('aria-expanded') === 'false';\n"
             "return named && t.includes('Done') && collapsed;", timeout=30),
    jsassert("SEGMENTS: exactly two, values 1 (Photos) and 2 (Docs)",
             MODAL_JS +
             "const root = m.querySelector('[class*=\"mantine-SegmentedControl-root\"]');\n"
             "if (!root) return false;\n"
             "const vals = [...root.querySelectorAll('input[type=\"radio\"]')].map(i => i.value);\n"
             "return JSON.stringify(vals) === JSON.stringify(['1', '2']);", timeout=30),
] + switch_segment("1", "Photos") + [
    jsassert("⭐ PHOTOS: a carousel with a slide, `Add Photo`, and NO `Add File`",
             MODAL_JS + BUTTONS +
             f"const slides = m.querySelectorAll('[class*=\"mantine-Carousel-slide\"]').length;\n"
             "return slides >= 1 && t.includes('Add Photo') && !t.includes('Add File');",
             timeout=30),
] + switch_segment("2", "Docs") + [
    jsassert("⭐ DOCS: `Add File`, NO `Add Photo`, and NO carousel — the biconditional closes",
             MODAL_JS + BUTTONS +
             f"return !m.querySelector('{CAROUSEL}') && t.includes('Add File') && !t.includes('Add Photo');",
             timeout=30),
    step("click", "Close the modal with its own `Done`", {"element": xpath_el(COLLECTOR_URL, DONE)},
         always=True, timeout=30),
    step("wait", "Let the modal close", {"value": 2}, always=True),
    jsassert("RESTORED: no modal is open and the row is still collapsed",
             "if (document.querySelector('.mantine-Modal-content')) return false;\n"
             "const items = [...document.querySelectorAll('.mantine-Accordion-item')];\n"
             "const it = items.find(i => {\n"
             "  const c = i.querySelector('.mantine-Accordion-control');\n"
             f"  return c && (c.textContent || '').includes('{MARKER}');\n"
             "});\n"
             "return !!it && it.querySelector('.mantine-Accordion-control')"
             ".getAttribute('aria-expanded') === 'false';", always=True, timeout=30),
]

write(test(
    "MOB.624_Collector_Row_Avatar_Modal",
    "`MOB.624` **The row avatar opens the asset's fullscreen attachments modal.**\n"
    "- READ-ONLY. Fixture is `MOB.623`'s residue (a photo on the newest `DD SYNTHETIC MOBILE`\n"
    "  asset), so this runs after it in `MOB.994`.\n"
    "- Proves the avatar's click opens the modal WITHOUT expanding the accordion\n"
    "  (`stopPropagation`), that the modal names the asset and offers `Done`, and that the\n"
    "  segmented control has exactly values `1`/`2`.\n"
    "- ⭐ **Photos vs Docs is a biconditional**: carousel + `Add Photo` and no `Add File`, then\n"
    "  `Add File`, no `Add Photo`, no carousel. Switched by radio VALUE (§22). Nothing uploaded.\n"
    "- Closed with `Done`; the row is asserted collapsed before and after.",
    steps,
    tags=["Mobile", "env:dev", "Asset Collector", "Photos", "read-only"],
))
print("wrote MOB.624 (collector row avatar modal)")
