"""Build MOB.135_Work_Form_Signature_Pad - a tablet signs a form's signature field in the desktop grid.

WHAT THE SOURCE SAYS (origin/development, since the `9d80ad499c` sync)
  `FormDetails.tsx` picks its layout ONCE at mount: `window.screen.availWidth >= 750` gets the desktop grid
  (`#apm-dv-tabpanel`, `DesktopForm`), and its signature widgets are drawn by `renderSignature` with the
  MOBILE control - `<div class="mobile-signature-cell"><MobileSignatureField/></div>` - because the desktop
  widget opens its pad through the web app's modal stack, which the mobile app does not mount. Datadog's
  tablet is 768 wide, so it takes this branch (the same one MOB.134 fills).

  `MobileSignatureField` (`Forms/SignatureField.tsx`): the field's label, a `Signed by … on …` line and the
  image once signed, and a button reading `Add Signature` (unsigned) / `Update Signature`. The button opens a
  Mantine Modal holding the pad (`helper-components/MentorInputs/SignatureField`).

⭐ WHY OPEN-AND-CLOSE WRITES NOTHING - read, not assumed
  The pad calls `onUpdate` in exactly two places: a stroke ending (`onEnd`) and `Clear` (`index.tsx:97-106`).
  Nothing on mount. `MobileSignatureField` parks that in `pending` and SAVES ONLY ON CLOSE, and only if
  something is pending (`save()`: `if (update) onUpdateRef.current?.(...)`). So open → close with no stroke and
  no `Clear` sends nothing - and the proof is a /graphql read that the signature is still null, not the UI.
  🛑 NEVER CLICK `Clear`: it sets pending to `(id, null)`, and the close would then SAVE.

WHAT IS LEFT OUT, AND WHY
  Drawing a signature and saving it would sign the fixture's `🔎 Inspection` form - a write whose restore
  (saving null back) is untested. That is an owner decision; the checklist keeps it as a gap.

FIXTURE (read over /graphql 2026-09-17): the fixture work order's `🔎 Inspection` form has one
`WorkflowFormSignature`, label `Add a signature label`, UNSIGNED. The card is picked BY NAME - MOB.134 opens
whichever form card comes first, and the work order holds four.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert, server_assert, work_list_gate  # noqa: E402

WORK_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
WORK_DETAIL = f"{BASE}/work/{WORK_ID}"
FORM_NAME = "Inspection"
SIG_LABEL = "Add a signature label"

PANEL = '//*[@role="tabpanel"][not(contains(@style, "display: none"))]'
PAPER = '*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")]'
TITLE = '*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")]'
INSPECTION_CARD = f'({PANEL}//{PAPER}[.//{TITLE}[contains(normalize-space(.), "{FORM_NAME}")]])[1]'

SIG_Q = ('query($id: ID!) { workStage(id: $id) { forms { name widgets { __typename '
         '... on WorkflowFormSignature { id label signature } } } } }')
UNSIGNED = ("(w => { const f = (w.forms || []).filter(f => (f.name || '').indexOf('" + FORM_NAME + "') !== -1);\n"
            "  if (f.length !== 1) return false;\n"
            "  const s = f[0].widgets.filter(x => x.__typename === 'WorkflowFormSignature');\n"
            f"  return s.length === 1 && s[0].label === '{SIG_LABEL}' && !s[0].signature; }})(data.workStage)")

CELL_JS = ("const cells = [...document.querySelectorAll('#apm-dv-tabpanel .mobile-signature-cell')];\n"
           "const cell = cells.length === 1 ? cells[0] : null;\n"
           "const btn = cell && [...cell.querySelectorAll('button')].find(b => b.getAttribute('title') === 'Add Signature');\n")
PAD_JS = ("const pad = [...document.querySelectorAll('.mantine-Modal-content')]\n"
          "  .find(m => m.querySelector('canvas') && m.querySelector('[title=\"Clear\"]'));\n")

steps = [
    *work_list_gate(require_row=False),
    go(WORK_DETAIL, "the fixture work order"),
    step("wait", "Let the detail view begin rendering", {"value": 3}),
    step("assertElementPresent", "GATE: the detail data arrived (tab strip)",
         {"element": xpath_el(WORK_DETAIL, '(//*[@role="tab"])[1]')}, timeout=60),
    step("click", "Open the Forms tab",
         {"element": xpath_el(WORK_DETAIL, '//*[@role="tab"][contains(normalize-space(.), "Form")]')}, timeout=30),
    step("wait", "Wait for the forms list", {"value": 3}),
    step("click", f"Open the `🔎 {FORM_NAME}` form card — by NAME, not position",
         {"element": xpath_el(WORK_DETAIL, INSPECTION_CARD)}, timeout=60),
    step("wait", "Let the form page render", {"value": 4}),
    jsassert("ROUTE: we are on /work/<id>/form/<id>",
             "return /\\/work\\/[^/]+\\/form\\/[^/]+$/.test(location.pathname);", timeout=60),
    jsassert("⭐ The DESKTOP GRID mounted (`#apm-dv-tabpanel`) — this 768-wide tablet takes the wide branch "
             "(`screen.availWidth >= 750`), which is where the new signature cell lives",
             "return !!document.getElementById('apm-dv-tabpanel') && window.screen.availWidth >= 750;", timeout=60),
] + server_assert(
    f"PREMISE (server): the {FORM_NAME} form holds ONE signature field, `{SIG_LABEL}`, UNSIGNED",
    "__dd135_sig", SIG_Q, {"id": WORK_ID}, UNSIGNED) + [
    jsassert(f"⭐ The grid draws it with the MOBILE control: exactly one `.mobile-signature-cell`, labelled "
             f"`{SIG_LABEL}`, its button reading `Add Signature`, no signature image yet",
             CELL_JS + f"return !!btn && (btn.textContent || '').trim() === 'Add Signature'\n"
             f"  && (cell.textContent || '').includes('{SIG_LABEL}')\n"
             "  && !cell.querySelector('[data-testid=\"signature-image\"]');", timeout=45),
    jsassert("Open the pad (`Add Signature`)", CELL_JS + "if (!btn) return false;\nbtn.click();\nreturn true;",
             timeout=20),
    jsassert("⭐ The pad opened in a modal — a canvas and its `Clear` control (NOT clicked: Clear would queue "
             "a null signature that the close then saves)", PAD_JS + "return !!pad;", timeout=30),
    jsassert("Close the pad WITHOUT drawing — its modal's close button",
             PAD_JS + "const c = pad && pad.querySelector('.mantine-Modal-close');\n"
             "if (!c) return false;\nc.click();\nreturn true;", always=True, timeout=20),
    jsassert("The pad is gone", PAD_JS + "return !pad;", always=True, timeout=20),
    step("wait", "Give a (wrong) save on close time to reach the server", {"value": 3}),
] + server_assert(
    "⭐ SERVER: closing an untouched pad saved NOTHING — the signature is still null "
    "(`MobileSignatureField` saves only a pending stroke, on close)",
    "__dd135_sig", SIG_Q, {"id": WORK_ID}, UNSIGNED, always=True) + [
    jsassert("…and the cell still reads `Add Signature`, with no image",
             CELL_JS + "return !!btn && !cell.querySelector('[data-testid=\"signature-image\"]');",
             always=True, timeout=20),
]

write(test(
    "MOB.135_Work_Form_Signature_Pad",
    "`MOB.135` **A tablet signs a form's signature field in the desktop grid.**\n"
    "- The 768-wide tablet takes the desktop grid, which now draws signature fields with the\n"
    f"  MOBILE control: `🔎 {FORM_NAME}`'s `{SIG_LABEL}` renders as a `.mobile-signature-cell` with\n"
    "  `Add Signature`, which opens the pad in a modal.\n"
    "- ⭐ Closed without drawing, the pad saves NOTHING — proved over /graphql. The pad reports only\n"
    "  a finished stroke or `Clear`, and the field saves only what is pending, on close.\n"
    "- 🛑 `Clear` is never clicked (it would queue a null save). Drawing and saving a signature is\n"
    "  left out: it would sign the fixture's form — an owner decision.\n"
    "- Read-only.",
    steps,
    ["Mobile", "env:dev", "Work Order", "Forms", "read-only"],
))

print("wrote MOB.135 (form signature pad)")
