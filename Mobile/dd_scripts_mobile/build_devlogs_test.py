"""Build MOB.171_DevLogs_Contents - the Dev Logs screen itself, not just its route.

WHY THIS EXISTS
  `MOB.170` asserts the page TITLE and nothing else, so every control on `DevLogs/index.tsx`
  was uncovered. Low user impact - the menu item is hidden unless the env is `development` or
  `development2` - but the level `Select` is nearly free to cover and is a textbook
  assert-the-source-of-truth case (trap 16): it persists to `sessionStorage['log_level']` via
  `logger.setLevel` (`utils/Logger.ts:86`).

🛑 TWO BUTTONS ON THIS SCREEN MUST NEVER BE CLICKED.
  - **"Email me the JSON"** POSTs the entire log payload to `/api/attachment/email`
    (`DevLogs/index.tsx:36`). Clicking it in a scheduled test would send real mail on every
    run.
  - **"Clear Logs"** calls `logger.clearAllLogs()`, wiping the log store for the session -
    destructive, and it would hollow out the very list this test asserts.
  Both are asserted PRESENT by exact text and never actioned, the same standing rule as the
  `Delete Item` entry in MOB.397's gear menu and the `Mark as ...` items in MOB.347.

  Only **Refresh** is safe to click: it re-reads the store and sets no state.

SELF-RESTORING. The level `Select` writes to sessionStorage, and a Datadog suite shares ONE
browser session - so a run that left the level on `verbose` would change logging behaviour for
every later subtest. Leg 2 sets it back to `default` and is `alwaysExecute` (trap 16c).

NB the restore writes `default` explicitly where a fresh session had NOTHING stored. That is a
deliberate, harmless difference: `Logger` reads `sessionStorage.getItem('log_level')` and falls
back to `default` when it is absent, so the two states behave identically.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

LOGS_URL = BASE + "/logz"

# Mantine `Select` renders an input; its options render in a portalled dropdown as
# `mantine-Select-option`. Clicking the input opens it.
LEVEL_INPUT = '//input[@class and not(@type="checkbox")][ancestor::*[contains(@class,"mantine-Select")]]'
OPTION = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-option ")]'
          '[normalize-space(.)="{}"]')


def button(label):
    return f'//button[normalize-space(.)="{label}"]'


def set_level(value, label, always=False):
    return [
        step("click", f"Open the log-level select ({label})",
             {"element": xpath_el(LOGS_URL, LEVEL_INPUT)}, always=always, timeout=30),
        step("wait", "Let the options render", {"value": 1}, always=always),
        step("click", f'Choose "{value}"',
             {"element": xpath_el(LOGS_URL, OPTION.format(value))},
             always=always, timeout=30),
        step("wait", "Let the level apply", {"value": 2}, always=always),
        # THE SOURCE OF TRUTH, not the input's displayed value - a Mantine Select renders its
        # label as an input VALUE, which is a property and invisible to assertPageContains
        # (trap 16). `logger.setLevel` writes this key.
        jsassert(f"PERSISTED: sessionStorage['log_level'] is now '{value}'",
                 f"return sessionStorage.getItem('log_level') === '{value}';",
                 always=always, timeout=30),
    ]


steps = (
    [
        go(LOGS_URL, "the Dev Logs screen"),
        step("wait", "Let the page render", {"value": 3}),
        step("assertPageContains", "The Developer Logs heading rendered",
             {"value": "Developer Logs"}, timeout=60),

        # ---- every control is present ---------------------------------------------------
        step("assertElementPresent", "The log-level select renders",
             {"element": xpath_el(LOGS_URL, LEVEL_INPUT)}, timeout=30),
        step("assertElementPresent", 'The "Refresh" button renders',
             {"element": xpath_el(LOGS_URL, button("Refresh"))}, timeout=30),
        # 🛑 Asserted, never clicked - see the header note.
        step("assertElementPresent",
             'The "Clear Logs" button renders (asserted, NEVER clicked — it wipes the store)',
             {"element": xpath_el(LOGS_URL, button("Clear Logs"))}, timeout=30),
        step("assertElementPresent",
             'The "Email me the JSON" button renders (asserted, NEVER clicked — it POSTs '
             "to /api/attachment/email)",
             {"element": xpath_el(LOGS_URL, button("Email me the JSON"))}, timeout=30),

        # The list area renders one of exactly two things. Asserting either alone would be a
        # data test - whether this browser session happens to have logged anything (trap 5).
        jsassert("EXACTLY ONE of: log entries, or the 'No logs found.' empty state",
                 "const t = document.body.innerText || '';\n"
                 "const empty = /No logs found\\./.test(t);\n"
                 "const entries = [...document.querySelectorAll('.mantine-Paper-root')]"
                 ".filter(e => /(INFO|ERROR|DEBUG|WARN)/.test(e.textContent||'')).length > 0;\n"
                 "return empty !== entries;", timeout=30),

        # Refresh is the ONLY safe button here: it re-reads the store and sets nothing.
        step("click", 'Click "Refresh" (the only non-destructive button on this screen)',
             {"element": xpath_el(LOGS_URL, button("Refresh"))}, timeout=30),
        step("wait", "Let the refresh settle", {"value": 3}),
        step("assertPageContains", "The screen survived the refresh",
             {"value": "Developer Logs"}, timeout=30),
    ]

    # ---- the level select, self-restoring ----------------------------------------------
    + set_level("verbose", "leg 1 — change it")
    + set_level("default", "leg 2 — put it back", always=True)
)

write(test(
    "MOB.171_DevLogs_Contents",
    "`MOB.171` The **Dev Logs screen's controls** — `MOB.170` only ever asserted its page\n"
    "title.\n"
    "- 🛑 **Two buttons are asserted but NEVER clicked.** `Email me the JSON` POSTs the whole\n"
    "  log payload to `/api/attachment/email` — it would send real mail on every run — and\n"
    "  `Clear Logs` calls `logger.clearAllLogs()`, wiping the store this test asserts against.\n"
    "  `Refresh` is the only safe button and is the one clicked.\n"
    "- **SELF-RESTORING**: the level `Select` persists to `sessionStorage['log_level']` and a\n"
    "  suite shares one browser session, so leaving it on `verbose` would change logging for\n"
    "  every later subtest. Leg 2 restores `default` and is `alwaysExecute`.\n"
    "- **Proof is the stored value, not the input's label** — a Mantine `Select` renders its\n"
    "  label as an input *value*, invisible to `assertPageContains` (trap 16).\n"
    "- The list area is asserted as an **exclusive-or** of entries vs the `No logs found.`\n"
    "  empty state, so it cannot pass by rendering nothing at all (trap 5).\n"
    "- Dev-env only: the menu item is hidden unless the env is `development`/`development2`.",
    steps,
    tags=["Mobile", "env:dev", "Dev Logs", "read-only"],
))
print("wrote MOB.171 (dev logs screen contents)")
