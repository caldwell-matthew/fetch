"""Build MOB.536 (job status menu) and MOB.537 (asset header Tag ID) - checklist 🟢 #26, #23, #27.

MOB.536 - `JobStatusIcon` (`AssetVerification/JobStatusIcon.tsx`), the dot beside the job's title
  Its Menu offers `Mark as IN PROGRESS` / `COMPLETED` / `CANCELED` (never the current one, never
  READY) and sends `UPDATE_MOBILE_JOB_STATUS` with an optimisticResponse. `Job.tsx` renders
  `This verification job has been canceled.` while the status is CANCELED (sweep: in no test).
  Round trip IN_PROGRESS -> CANCELED -> IN_PROGRESS through the same menu; COMPLETED is never
  clicked. The mid-state is read in-page only - a CANCELED job may leave the crew's list, and the
  job route is `cache-only` (reached only from the list) - so the SERVER proof is the reload at the
  end: the job is back, IN_PROGRESS, no canceled alert. Restore is `always`, and
  `reset_av_fixture.py --apply` is the 0-run fallback.

MOB.537 - the full-page asset detail's header (`AssetVerification/AssetDetails.tsx:165-186`)
  `Tag ID: {asset.tagNumber ?? 'None'}` beside an edit button (`AssetCaptureIconFormBttn`) that
  opens `EditForm` for that one column and saves with `UPDATE_ASSET` (no optimisticResponse while
  online; the toast is in `update()`, so it is a server answer). MOB.710 covers `EditForm` from
  Asset Lookup; this is the header's own call site.
  #23  both branches of the fallback: `⚡ Tank 0000` reads `Tag ID: 0000`, `A/C Motor 0002` (no
       tag) reads `Tag ID: None` - values read over the API.
  #27  Tank 0000's tag: 0000 -> DD-TAG-EDIT -> reload proves it -> back to 0000 -> reload proves
       it. The description has the same button, but both fixture descriptions are long authored
       texts no typed restore could reproduce byte-for-byte - the tag is the same code path.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, test, write, jsassert, av_job_gate  # noqa: E402

JOB_ID = "Z0EVwQcdJZhMURcBFkp0E0"
JOB_URL = f"{BASE}/asset-verify/{JOB_ID}"
CANCELED_ALERT = "This verification job has been canceled."
TAG_BASE, TAG_MARK = "0000", "DD-TAG-EDIT"


def link(name):
    return f'(//span[contains(normalize-space(.), "{name}")])[last()]'


def menu_item(label):
    return (f'(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")]'
            f'[normalize-space(.)="{label}"])[1]')


TEXT = "const t = (document.body.textContent || '');\n"
# The job header's status dot: the Indicator in the same Flex as the job's Title.
OPEN_STATUS_JS = ("const title = [...document.querySelectorAll('[class*=\"mantine-Title-root\"]')]\n"
                  "  .find(h => (h.textContent || '').includes('DATADOG MOBILE JOB'));\n"
                  "const row = title && title.closest('[class*=\"mantine-Flex-root\"]');\n"
                  "const dot = row && row.querySelector('[class*=\"mantine-Indicator-root\"]');\n"
                  "if (!dot) return false;\ndot.click();\nreturn true;")


def status_pick(label, always=False):
    return [
        jsassert("Open the job's status menu (the dot beside its title)", OPEN_STATUS_JS,
                 always=always, timeout=30),
        step("wait", "Let the menu open", {"value": 1}, always=always),
        step("click", f"Mark as {label}", {"element": xpath_el(JOB_URL, menu_item(f"Mark as {label}"))},
             always=always, timeout=30),
        step("wait", "Let the status change render", {"value": 3}, always=always),
    ]


# ---------------------------------------------------------------------------------- MOB.536
m536 = av_job_gate(JOB_ID) + [
    jsassert("PREMISE: the job is not canceled (no alert) — at rest IN_PROGRESS",
             TEXT + f"return !t.includes('{CANCELED_ALERT}');", timeout=30),
    jsassert("Open the job's status menu (the dot beside its title)", OPEN_STATUS_JS, timeout=30),
    step("wait", "Let the menu open", {"value": 1}),
    jsassert("MENU: exactly IN PROGRESS's two exits — `Mark as COMPLETED`, `Mark as CANCELED` (never "
             "READY, never the current status)",
             "const items = [...document.querySelectorAll('.mantine-Menu-item')]\n"
             "  .map(i => (i.textContent || '').trim()).filter(x => x.indexOf('Mark as') === 0);\n"
             "return items.length === 2 && items.includes('Mark as COMPLETED') && items.includes('Mark as CANCELED');",
             timeout=20),
    step("click", "Mark as CANCELED", {"element": xpath_el(JOB_URL, menu_item("Mark as CANCELED"))}, timeout=30),
    step("wait", "Let the status change render", {"value": 3}),
    jsassert(f"⭐ CANCELED: `{CANCELED_ALERT}` is shown (`Job.tsx`)",
             TEXT + f"return t.includes('{CANCELED_ALERT}');", timeout=30),
] + status_pick("IN PROGRESS") + [
    jsassert("⭐ BACK IN PROGRESS: the canceled alert is gone",
             TEXT + f"return !t.includes('{CANCELED_ALERT}');", timeout=30),
    # ---- restore, `always`: if the alert is still up, mark IN PROGRESS again ----------------
    jsassert("RESTORE: if the job still reads canceled, open its status menu",
             TEXT + f"if (!t.includes('{CANCELED_ALERT}')) return true;\n" + OPEN_STATUS_JS,
             always=True, timeout=20),
    jsassert("RESTORE: …and pick `Mark as IN PROGRESS` (only if the menu is open)",
             "const it = [...document.querySelectorAll('.mantine-Menu-item')]\n"
             "  .find(i => (i.textContent || '').trim() === 'Mark as IN PROGRESS');\n"
             "if (it) it.click();\nreturn true;", always=True, timeout=15),
    step("wait", "Let the status reach the server", {"value": 4}, always=True),
] + [dict(s, alwaysExecute=True) for s in av_job_gate(JOB_ID)] + [
    jsassert("⭐ SERVER (after a reload): the job is in the crew's list again, IN PROGRESS — no "
             "canceled alert", TEXT + f"return t.includes('DATADOG MOBILE JOB') && !t.includes('{CANCELED_ALERT}');",
             always=True, timeout=30),
]

write(test(
    "MOB.536_AssetVerify_Job_Status_Menu",
    "`MOB.536` **The job status menu — IN PROGRESS → CANCELED → IN PROGRESS.**\n"
    "- The dot beside the job title offers exactly `Mark as COMPLETED` / `Mark as CANCELED` from\n"
    f"  IN PROGRESS. CANCELED shows `{CANCELED_ALERT}`; IN PROGRESS removes it.\n"
    "- The mid-state is read in-page (a canceled job may leave the crew's list); the server proof\n"
    "  is the reload at the end. COMPLETED is never clicked.\n"
    "- 🛑 Self-restoring (`always`); `reset_av_fixture.py --apply` is the 0-run fallback.",
    m536,
    ["Mobile", "env:dev", "Asset Verification", "self-restoring"],
))

# ---------------------------------------------------------------------------------- MOB.537
TAG_JS = ("const s = [...document.querySelectorAll('strong')].find(x => (x.textContent || '').trim() === 'Tag ID:');\n"
          "const line = s && s.parentElement;\n"
          "const tag = line ? (line.textContent || '').replace('Tag ID:', '').trim() : null;\n")
OPEN_TAG_EDIT = (TAG_JS + "const grp = line && line.closest('[class*=\"mantine-Group-root\"]');\n"
                 "const b = grp && grp.querySelector('button');\n"
                 "if (!b) return false;\nb.click();\nreturn true;")
MODAL = '//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
EDIT_FORM_SUBMIT = MODAL + '//button[normalize-space(.)="Submit"]'
# 🛑 SCOPED TO THE MODAL: the page's General Info form renders its own `#tagNumber` behind it, so a
# bare `//input[@id="tagNumber"]` matched TWO (run 1: "Multiple elements found" — trap 3).
TAG_INPUT = MODAL + '//input[@id="tagNumber"]'
MODAL_TAG_JS = "document.querySelector('.mantine-Modal-content input#tagNumber')"


def open_asset(name):
    return [
        step("click", f"Open {name}'s full-page detail", {"element": xpath_el(JOB_URL, link(name))}, timeout=30),
        step("wait", "Let the asset detail begin rendering", {"value": 2}),
        step("assertPageContains", "The full-page asset detail rendered", {"value": "Asset Type:"}, timeout=30),
    ]


def edit_tag(value, always=False):
    return [
        jsassert("Open the Tag ID edit button (`AssetCaptureIconFormBttn`)", OPEN_TAG_EDIT,
                 always=always, timeout=30),
        step("wait", "Let the edit form mount", {"value": 2}, always=always),
        step("click", "Focus the Tag field", {"element": xpath_el(JOB_URL, TAG_INPUT)},
             always=always, timeout=30),
        step("pressKey", "Select the current tag (typeText APPENDS — trap 17)",
             {"value": "a", "modifiers": ["Control"]}, always=always),
        step("typeText", f"Type {value}", {"value": value, "element": xpath_el(JOB_URL, TAG_INPUT)},
             always=always),
        step("click", "Submit", {"element": xpath_el(JOB_URL, EDIT_FORM_SUBMIT)}, always=always, timeout=30),
        step("wait", "Wait for UPDATE_ASSET", {"value": 3}, always=always),
    ]


def reload_to_tank(always=False):
    gate = av_job_gate(JOB_ID)
    return ([dict(s, alwaysExecute=True) for s in gate] if always else gate) + [
        dict(s, alwaysExecute=True) if always else s for s in open_asset("Tank 0000")]


m537 = av_job_gate(JOB_ID) + open_asset("A/C Motor 0002") + [
    jsassert("⭐ `Tag ID: None` — A/C Motor 0002 has no tag (the `?? 'None'` branch)",
             TAG_JS + "return tag === 'None';", timeout=30),
    jsassert("Back to the job in-app (`history.back()`)", "history.back();\nreturn true;", timeout=15),
    step("wait", "Let the job render", {"value": 3}),
] + open_asset("Tank 0000") + [
    jsassert(f"⭐ `Tag ID: {TAG_BASE}` — Tank 0000's stored tag (PREMISE for the edit)",
             TAG_JS + f"return tag === '{TAG_BASE}';", timeout=30),
] + edit_tag(TAG_MARK) + [
    jsassert("The edit form closed (the MODAL's `#tagNumber` is gone) — `update()` ran: a server answer",
             "return !" + MODAL_TAG_JS + ";", timeout=20),
] + reload_to_tank() + [
    jsassert(f"⭐ SERVER (after a reload): `Tag ID: {TAG_MARK}`", TAG_JS + f"return tag === '{TAG_MARK}';",
             timeout=30),
] + edit_tag(TAG_BASE, always=True) + reload_to_tank(always=True) + [
    jsassert(f"⭐ RESTORED (after a reload): `Tag ID: {TAG_BASE}`", TAG_JS + f"return tag === '{TAG_BASE}';",
             always=True, timeout=30),
]

write(test(
    "MOB.537_AssetVerify_Header_Tag",
    "`MOB.537` **The AV asset header's `Tag ID` — both branches, and its own edit button.**\n"
    "- `Tag ID: None` on A/C Motor 0002 (no tag); `Tag ID: 0000` on ⚡ Tank 0000.\n"
    f"- The header's edit button (`AssetCaptureIconFormBttn` → `EditForm`, `UPDATE_ASSET`): {TAG_BASE} →\n"
    f"  **{TAG_MARK}**, proved after a reload → back to **{TAG_BASE}**, proved after a reload.\n"
    "- 🛑 Self-restoring (`always`).",
    m537,
    ["Mobile", "env:dev", "Asset Verification", "Edit", "self-restoring"],
))
print("wrote MOB.536 (job status menu), MOB.537 (header tag)")
