"""Convert the Datadog test JSON into Playwright (TypeScript) — 0 Datadog runs.

    ../../.venv/bin/python to_playwright.py --list            # what would be written
    ../../.venv/bin/python to_playwright.py MOB.954           # one suite and its children
    ../../.venv/bin/python to_playwright.py --all             # every suite

WHAT IT WRITES (under `e2e/`, which is self-contained so it can move into MentorTwo later)
    e2e/tests/<MOB.nnn>_<name>.ts   one exported function per LEAF test, its steps in order
    e2e/suites/<MOB.nnn>_<name>.spec.ts   a suite: log in once, then each child as its own `test()`
    e2e/support/login.ts            generated from MOB.000, the login every suite shares

FAITHFUL FIRST (owner's choice, 2026-09-22)
    Every step is translated as it stands, including the 1,179 fixed `wait`s. A converted test must
    behave like the Datadog one, so that a red is a real difference and not a rewrite. Tightening the
    waits into waits-for-a-condition comes later, suite by suite, with timings measured either side.

WHAT DOES NOT SURVIVE THE TRIP, AND IS FLAGGED IN THE OUTPUT
    - `{{ GLOBAL }}` values come from the repo-root `.env` (or CI variables) instead of Datadog.
    - `{{ numeric(8) }}`-style per-run locals become `runId(8)` in the generated code.
    - `uploadFiles` uses a stand-in file of the same name (Datadog keeps the bytes in its storage,
      trap 12), exactly as `local_run.py` does. MOB.600's photo picker still cannot be driven.
"""
import argparse
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..")
TESTS = os.path.join(HERE, "..", "dd_tests_mobile")
E2E = os.path.join(ROOT, "e2e")
LOGIN_TEST = "MOB.000"

sys.path.insert(0, HERE)
from suite_plan import SUITES, suite_name  # noqa: E402


# ---------------------------------------------------------------------------- reading the JSON
def load(ref):
    hits = sorted(glob.glob(os.path.join(TESTS, f"{ref}*.json")))
    if not hits:
        raise SystemExit(f"no test JSON matching {ref}")
    d = json.load(open(hits[0]))
    return os.path.basename(hits[0])[:-5], (d.get("details") or d)


def xpath_of(params):
    values = ((params.get("element") or {}).get("userLocator") or {}).get("values") or []
    if not values or values[0].get("type") != "xpath":
        raise ValueError("step has no xpath locator")
    return values[0]["value"]


def locals_of(details):
    """Per-run variables a test declares, e.g. RUNID = {{ numeric(8) }}."""
    out = {}
    for v in (details.get("config") or {}).get("variables") or []:
        if v.get("type") == "text":
            m = re.search(r"(numeric|alphanumeric|alphabetic)\((\d+)\)", v.get("pattern") or "")
            out[v["name"]] = (m.group(1), int(m.group(2))) if m else ("literal", v.get("example") or "")
    return out


# ---------------------------------------------------------------------------- emitting TypeScript
def ts(s):
    """A TypeScript string literal for `s`, with {{ VAR }} turned into ${...} interpolation."""
    lit = (s or "").replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")
    return "`" + re.sub(r"\{\{\s*([A-Za-z0-9_]+)\s*\}\}", lambda m: "${" + m.group(1) + "}", lit) + "`"


def uses_vars(text):
    return set(re.findall(r"\{\{\s*([A-Za-z0-9_]+)\s*\}\}", text or ""))


def step_lines(step, timeout_expr):
    """The Playwright call(s) for one Datadog step, as source lines."""
    t, p = step["type"], step.get("params") or {}
    if t == "wait":
        return [f"await wait(page, {int(p['value'])});"]
    if t == "goToUrl":
        return [f"await page.goto({ts(p['value'])});"]
    if t == "click":
        return [f"await el(page, {ts(xpath_of(p))}).click({{ timeout: {timeout_expr} }});"]
    if t == "typeText":
        return [f"await el(page, {ts(xpath_of(p))}).fill({ts(p['value'])}, {{ timeout: {timeout_expr} }});"]
    if t == "pressKey":
        mods = p.get("modifiers") or []
        combo = "+".join([m.title() for m in mods] + [p["value"]])
        return [f"await page.keyboard.press({ts(combo)});"]
    if t == "assertElementPresent":
        return [f"await assertElementPresent(page, {ts(xpath_of(p))}, {timeout_expr});"]
    if t == "assertElementContent":
        if p.get("check") != "contains":
            raise ValueError(f"assertElementContent check {p.get('check')!r} not handled")
        return [f"await assertElementContent(page, {ts(xpath_of(p))}, {ts(p['value'])}, {timeout_expr});"]
    if t == "assertPageContains":
        return [f"await assertPageContains(page, {ts(p['value'])}, {timeout_expr});"]
    if t == "assertPageLacks":
        return [f"await assertPageLacks(page, {ts(p['value'])}, {timeout_expr});"]
    if t == "assertFromJavascript":
        return [f"await assertFromJavascript(page, {ts(p['code'])}, {timeout_expr});"]
    if t == "uploadFiles":
        names = [f["name"] for f in p.get("files") or []]
        return [f"await uploadStandIn(page, {ts(xpath_of(p))}, {json.dumps(names)}, {timeout_expr});"]
    raise ValueError(f"step type {t!r} not handled")


def convert_steps(steps, indent="  ", unportable=None):
    """(body lines, helper names used, variable names used) for a run of steps.

    A step this cannot express (one recorded without an xpath, so only Datadog's own multiLocator can
    find it) is appended to `unportable` and left out: the caller marks that test `fixme` rather than
    letting it look green."""
    used, variables, body = set(), set(), []
    soft_seen = False
    for s in steps:
        if s["type"] == "playSubTest":
            continue
        try:
            xpath_of(s.get("params") or {}) if (s.get("params") or {}).get("element") else None
        except ValueError as e:
            if unportable is None:
                raise
            unportable.append(f"{s.get('name') or s['type']}: {e}")
            body += [f"{indent}// ⛔ NOT PORTABLE — {s.get('name') or s['type']}: {e}"]
            continue
        timeout = f"{int(s['timeout']) * 1000}" if s.get("timeout") else "DEFAULT_TIMEOUT"
        if s.get("timeout"):
            used.add("DEFAULT_TIMEOUT") if False else None
        else:
            used.add("DEFAULT_TIMEOUT")
        lines = step_lines(s, timeout)
        used.update(h for h in ("wait", "el", "assertElementPresent", "assertElementContent",
                                "assertPageContains", "assertPageLacks", "assertFromJavascript",
                                "uploadStandIn") if any(l.startswith(f"await {h}(") or f" {h}(" in l for l in lines))
        variables |= uses_vars(json.dumps(s.get("params") or {}))
        label = json.dumps(s.get("name") or s["type"])
        if s.get("allowFailure") and not s.get("isCritical"):          # optional
            used.add("optional")
            body += [f"{indent}await optional({label}, async () => {{"]
            body += [f"{indent}  {l}" for l in lines]
            body += [f"{indent}}});"]
        elif s.get("allowFailure") and s.get("isCritical"):            # soft
            used.add("Soft")
            soft_seen = True
            body += [f"{indent}await soft.run({label}, async () => {{"]
            body += [f"{indent}  {l}" for l in lines]
            body += [f"{indent}}});"]
        else:
            body += [f"{indent}// {s.get('name') or s['type']}"] + [f"{indent}{l}" for l in lines]
    return body, used, variables, soft_seen


HELPERS = ["DEFAULT_TIMEOUT", "assertElementContent", "assertElementPresent", "assertFromJavascript",
           "assertPageContains", "assertPageLacks", "el", "optional", "Soft", "uploadStandIn", "wait"]


def fn_name(test_name):
    return "mob" + re.sub(r"\W", "", test_name.split("_")[0].replace("MOB.", ""))


def write_leaf(test_name, details, out_dir):
    """One leaf test -> an exported async function. Returns the steps that could not be expressed."""
    steps = details["steps"]
    always = [s for s in steps if s.get("alwaysExecute")]
    main = [s for s in steps if not s.get("alwaysExecute")]
    unportable = []
    body, used, variables, soft = convert_steps(main, "    ", unportable)
    tail, used2, vars2, soft2 = convert_steps(always, "    ", unportable)
    used |= used2
    variables |= vars2
    soft = soft or soft2
    locs = locals_of(details)
    lines = [f"// Generated from Mobile/dd_tests_mobile/{test_name}.json by to_playwright.py — do not edit by hand yet.",
             f"// {details.get('name') or test_name}"]
    if unportable:
        lines += ["//",
                  "// ⛔ THIS TEST CANNOT RUN OUTSIDE DATADOG. Steps below were recorded without an xpath, so only",
                  "//    Datadog's own multiLocator can find their element. Its suite marks it `fixme`, so it is",
                  "//    reported as skipped and never as a pass:"]
        lines += [f"//      - {u}" for u in unportable]
    lines += [""]
    imports = sorted(h for h in used if h in HELPERS)
    lines += [f"import {{ Page }} from '@playwright/test';",
              f"import {{ {', '.join(imports)} }} from '../support/dd';"]
    if variables - set(locs):
        lines += ["import { globals } from '../support/env';"]
    if locs:
        lines += ["import { runId } from '../support/env';"]
    lines += ["", f"export async function {fn_name(test_name)}(page: Page): Promise<void> {{"]
    for name, (kind, n) in locs.items():
        lines += [f"  const {name} = runId('{kind}', {n});" if kind != "literal" else f"  const {name} = {ts(n)};"]
    for v in sorted(variables - set(locs)):
        lines += [f"  const {v} = globals.{v};"]
    if soft:
        lines += ["  const soft = new Soft();"]
    if tail:
        lines += ["  try {"] + body + ["  } finally {", "    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure"] + tail + ["  }"]
    else:
        lines += body
    if soft:
        lines += ["  soft.check();"]
    lines += ["}", ""]
    path = os.path.join(out_dir, f"{test_name}.ts")
    open(path, "w").write("\n".join(lines))
    return path, unportable


def write_suite(sid, details, children, out_dir, skip=()):
    """A suite -> one spec: log in once, then each child as its own test() in order."""
    name = details.get("name") or f"MOB.{sid}"
    device = "mobile_small" if "_Phone_" in name else "tablet"
    lines = [f"// Generated from Mobile/dd_tests_mobile/{name}.json by to_playwright.py — do not edit by hand yet.",
             "//",
             "// The children share ONE browser session, in order, exactly as the Datadog suite ran them",
             "// (they also share the fixture records, so nothing here may run in parallel — trap 1).",
             "import { test, Browser, Page } from '@playwright/test';",
             "import { DEVICES } from '../playwright.config';",
             "import { login } from '../support/login';"]
    for child, child_name in children:
        lines += [f"import {{ {fn_name(child_name)} }} from '../tests/{child_name}';"]
    lines += ["",
              f"test.describe.serial('{name}', () => {{",
              "  let page: Page;", "",
              "  test.beforeAll(async ({ browser }: { browser: Browser }) => {",
              f"    const context = await browser.newContext({{ viewport: DEVICES.{device} }});",
              "    page = await context.newPage();",
              "    await login(page);",
              "  });", "",
              "  test.afterAll(async () => {",
              "    await page?.context().close();",
              "  });", ""]
    for child, child_name in children:
        if child_name in skip:
            lines += [f"  // cannot run outside Datadog — see the header of tests/{child_name}.ts",
                      f"  test.fixme('{child_name}', async () => {{", f"    await {fn_name(child_name)}(page);",
                      "  });", ""]
        else:
            lines += [f"  test('{child_name}', async () => {{", f"    await {fn_name(child_name)}(page);", "  });", ""]
    lines += ["});", ""]
    path = os.path.join(out_dir, f"{name}.spec.ts")
    open(path, "w").write("\n".join(lines))
    return path


def write_login(out_dir):
    """MOB.000's steps -> support/login.ts, the prefix every suite shares."""
    test_name, details = load(LOGIN_TEST)
    body, used, variables, _soft = convert_steps(details["steps"], "  ")
    imports = sorted(h for h in used if h in HELPERS)
    lines = [f"// Generated from Mobile/dd_tests_mobile/{test_name}.json by to_playwright.py — do not edit by hand yet.",
             "// The shared login. Every suite runs it once, then its children reuse the session.",
             "import { Page } from '@playwright/test';",
             f"import {{ {', '.join(imports)} }} from './dd';",
             "import { globals } from './env';", "",
             "export async function login(page: Page): Promise<void> {"]
    for v in sorted(variables):
        lines += [f"  const {v} = globals.{v};"]
    lines += body + ["}", ""]
    path = os.path.join(out_dir, "login.ts")
    open(path, "w").write("\n".join(lines))
    return path


def suite_children(sid):
    for s_id, module, part, _cls, _blurb, children in SUITES:
        if s_id == sid:
            return suite_name(s_id, module, part), children
    raise SystemExit(f"MOB.{sid} is not a suite in suite_plan.py")


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("suites", nargs="*", help="suite ids, e.g. MOB.954")
    ap.add_argument("--all", action="store_true", help="every suite in suite_plan.py")
    ap.add_argument("--list", action="store_true", help="print what would be written, write nothing")
    a = ap.parse_args()

    ids = [s.replace("MOB.", "") for s in a.suites]
    if a.all:
        ids = [s[0] for s in SUITES]
    if not ids:
        ap.error("name a suite (MOB.954) or pass --all")

    if a.list:
        for sid in ids:
            name, children = suite_children(sid)
            print(f"{name}: {len(children)} children -> e2e/suites/{name}.spec.ts")
        return 0

    os.makedirs(os.path.join(E2E, "tests"), exist_ok=True)
    os.makedirs(os.path.join(E2E, "suites"), exist_ok=True)
    written, cannot = [write_login(os.path.join(E2E, "support"))], {}
    for sid in ids:
        name, children = suite_children(sid)
        _n, details = load(f"MOB.{sid}")
        pairs, skip = [], []
        for c in children:
            child_name, child_details = load(f"MOB.{c}")
            path, unportable = write_leaf(child_name, child_details, os.path.join(E2E, "tests"))
            written.append(path)
            pairs.append((c, child_name))
            if unportable:
                skip.append(child_name)
                cannot[child_name] = unportable
        written.append(write_suite(sid, details, pairs, os.path.join(E2E, "suites"), skip))
    print(f"wrote {len(written)} files under e2e/")
    if cannot:
        print("\n⛔ not portable — marked `fixme` in their suite, so they report as skipped:")
        for name, why in cannot.items():
            for w in why:
                print(f"   {name}: {w}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
