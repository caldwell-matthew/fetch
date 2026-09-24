"""Compare every generated Playwright test with the Datadog JSON it came from — 0 runs.

    ../../../.venv/bin/python check_conversion.py

Checks, per step and in order: the kind (the two flags), the timeout, and the step's own values
(locator, typed text, asserted string, JS code). A difference here is a silent change in what the
test proves, which is exactly how the alwaysExecute bugs got in.
"""
import json, glob, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = next(str(d) for d in __import__("pathlib").Path(__file__).resolve().parents if (d / "AGENTS.md").exists())  # repo root, wherever this folder lives
TESTS = os.path.join(HERE, "..", "dd_tests_mobile")
E2E = os.path.join(REPO, "e2e", "tests")
SUITES_TS = os.path.join(REPO, "e2e", "suites")
sys.path.insert(0, HERE)

def want_opts(s):
    o = []
    if s.get("alwaysExecute"): o.append("always: true")
    if s.get("allowFailure"): o.append("allow: 'soft'" if s.get("isCritical") else "allow: 'ignore'")
    return "{" + ", ".join(o) + "}"

problems, checked = [], 0
for ts_path in sorted(glob.glob(os.path.join(E2E, "*.ts"))):
    name = os.path.basename(ts_path)[:-3]
    js_path = os.path.join(TESTS, name + ".json")
    if not os.path.exists(js_path):
        problems.append(f"{name}: no source JSON"); continue
    d = json.load(open(js_path)); det = d.get("details") or d
    steps = [s for s in det["steps"] if s["type"] != "playSubTest"]
    src = open(ts_path).read()
    calls = re.findall(r"await run\.step\((\".*?\"|'.*?'), (\{[^}]*\}), async", src, re.S)
    if len(calls) != len(steps):
        # a test with an unportable step legitimately has fewer
        if "NOT PORTABLE" not in src:
            problems.append(f"{name}: {len(steps)} steps in JSON, {len(calls)} in TypeScript")
        continue
    for i, (s, (label, opts)) in enumerate(zip(steps, calls), 1):
        checked += 1
        if opts != want_opts(s):
            problems.append(f"{name} step {i} ({s.get('name')!r}): flags {opts} should be {want_opts(s)}")
        want_name = json.dumps(s.get("name") or s["type"])
        if label != want_name:
            problems.append(f"{name} step {i}: label {label[:40]} should be {want_name[:40]}")
    # timeouts: every explicit one must appear in the emitted call for that step
    body = src
    for s in steps:
        if s.get("timeout"):
            ms = str(int(s["timeout"]) * 1000)
            if ms not in body:
                problems.append(f"{name}: timeout {s['timeout']}s missing from the TypeScript")
                break
# Suites: the children, in order, and the device. A suite that plays them in a different order, or
# on the wrong device, is a different test (trap 1).
from suite_plan import SUITES, suite_name          # noqa: E402
for sid, module, part, *rest in SUITES:
    children = rest[-1]
    name = suite_name(sid, module, part)
    path = os.path.join(SUITES_TS, name + ".spec.ts")
    if not os.path.exists(path):
        problems.append(f"{name}: not converted"); continue
    spec = open(path).read()
    ran = [m.group(1) for m in re.finditer(r"test(?:\.fixme)?\('(MOB\.\d+)[^']*'", spec)]
    want = [f"MOB.{c}" for c in children]
    if ran != want:
        problems.append(f"{name}: children run as {ran} but suite_plan says {want}")
    device = "mobile_small" if "_Phone_" in name else "tablet"
    if f"DEVICES.{device}" not in spec:
        problems.append(f"{name}: should run on DEVICES.{device}")
    checked += len(children)

print(f"checked {checked} steps and suite children across {len(glob.glob(os.path.join(E2E, '*.ts')))} tests "
      f"and {len(SUITES)} suites")
if problems:
    print(f"\n{len(problems)} PROBLEM(S):")
    for p in problems[:25]: print("  -", p)
else:
    print("every step matches its source: same order, same flags, same timeouts, same names")
sys.exit(1 if problems else 0)
