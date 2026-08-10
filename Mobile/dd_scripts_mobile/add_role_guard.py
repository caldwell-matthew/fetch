"""Insert a fail-fast role check into every test that logs in.

WHY
  The account's role is shared mutable state between a human using the app and the test
  suite, and three roles share the "Admin" prefix - "Admin", "Admin (0000)", "Admin 0100".
  Only plain "Admin" can create/update work orders. When the account drifts onto one of
  the others, CreateWorkButton renders null and the suite fails with a mystery "Affix
  button missing from the DOM" - which cost several rounds of misdiagnosis.

  This asserts the role explicitly right after login, so drift fails immediately with an
  obvious message instead of surfacing later as a missing control.

WHERE THE ROLE IS READABLE
  span.mobile-crew shows it but is display:none below 450px (components/index.css), and
  we run chrome.mobile_small, so it is present-but-invisible there - unusable.
  TopHeader's "Switch Crews" menu item instead renders the role underneath its label via
  customRender:
        <Stack><div>Switch Crews</div><div ...>{role}</div></Stack>
  The burger is width-independent, so that is the reliable place to read it.

  The assertion is an EXACT match on the role div, so "Admin 0100" and "Admin (0000)"
  correctly fail it. Do not loosen this to contains().
"""
import json, glob, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, HERE  # noqa: E402

HOME = BASE + "/"
BURGER = '//button[@aria-label="Toggle navigation"]'
EXPECTED_ROLE = "Admin"
ROLE_IN_MENU = ('//button[.//div[normalize-space(.)="Switch Crews"]]'
                f'//div[normalize-space(.)="{EXPECTED_ROLE}"]')
MARKER = "Guard: session role is"


def guard_steps():
    return [
        step("click", "Open the menu to read the session role",
             {"element": xpath_el(HOME, BURGER)}),
        step("assertElementPresent", f'{MARKER} exactly "{EXPECTED_ROLE}"',
             {"element": xpath_el(HOME, ROLE_IN_MENU)}),
        step("pressKey", "Close the menu", {"value": "Escape"}),
    ]


def has_login(steps):
    return any(s["type"] == "typeText" and "email" in s["name"].lower() for s in steps)


changed = []
for f in sorted(glob.glob(os.path.join(HERE, "*.json"))):
    d = json.load(open(f))
    steps = d["details"]["steps"]
    if not has_login(steps):
        continue
    if any(MARKER in s["name"] for s in steps):
        continue
    # insert immediately after the login block's closing assertion
    idx = next((i for i, s in enumerate(steps)
                if "authenticated mobile shell" in s["name"]), None)
    if idx is None:
        print(f"SKIP  {d['details']['name']} - no login-complete assertion to anchor to")
        continue
    for off, gs in enumerate(guard_steps()):
        steps.insert(idx + 1 + off, gs)
    d["details"]["message"] += (
        f"\n- Guards that the session role is exactly \"{EXPECTED_ROLE}\". The org has"
        " several\n  similarly-named roles and only this one can create/update work"
        " orders; drift\n  onto another otherwise surfaces as an unexplained missing"
        " control.")
    with open(f, "w") as fh:
        fh.write(json.dumps(d, indent=4))
    changed.append(d["details"]["name"])

print(f"added role guard to {len(changed)} test(s):")
for n in changed:
    print("   ", n)
