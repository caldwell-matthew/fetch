#!/usr/bin/env python3
"""Remove the fixed waits that only precede a check which polls anyway (checklist #89).

A converted test sleeps (`await wait(page, N)`) before most steps — Datadog's habit. Where the NEXT step is a
positive check that polls until its own timeout, the sleep adds nothing but time:
    assertElementPresent · assertElementContent · assertPageContains · click
Everything else keeps its wait:
  - before `assertPageLacks` or `assertFromJavascript` — either can pass at once, so the wait may be what makes the
    check mean something ("no error after the save");
  - before `typeText` / `press` (a re-rendering form wipes keys typed too early — trap in `support/dd.ts`), a
    server read, an upload, or a step that always runs;
  - a wait step carrying options (`always`, `allow`), or whose name speaks of a debounce, a mutation, the server,
    a toast, saving, syncing, the queue, a reload or an animation.

A prefetch sleep is REPLACED, not removed: the step waits for the app's own loading bars instead
(`support/prefetch.ts`). The job list's ("… and batched detail downloads") waits for every bar; the work list's
("Let the lookup prefetch run", "… workstage pages and the lookup prefetch") ignores the per-stage download bar,
which runs for minutes and which the old 30s sleep never waited for either.

    .venv/bin/python e2e/mobile/tools/tighten_waits.py MOB.962            # the plan: what would go, per test
    .venv/bin/python e2e/mobile/tools/tighten_waits.py MOB.962 --apply    # edit the suite's tests

Time the suite before and after, and run it green twice after, before calling a suite done.
"""
import argparse
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
MOBILE = os.path.dirname(HERE)

POLLING = re.compile(r"^\s*await (assertElementPresent|assertElementContent|assertPageContains|click)\(")
KEEP_NAME = re.compile(r"debounce|mutation|server|resolve|toast|persist|sync|queue|flush|sav(e|ing)|writ|reload|"
                       r"animat|settle|refetch|network|upload|offline|online|expire|clock", re.I)
# one step: `  await run.step("…", {…}, async () => {` … `  });`
STEP = re.compile(r"^  await run\.step\((\".*?\"), (\{.*?\}), async \(\) => \{\n(.*?)^  \}\);\n", re.S | re.M)
PREFETCH_ALL = re.compile(r"lookup prefetch and batched detail downloads|job list and its prefetch", re.I)
PREFETCH_LOOKUPS = re.compile(r"workstage pages and the lookup prefetch|^Let the lookup prefetch run$", re.I)
IMPORT_FROM = "from '../support/prefetch';"
WAIT_BODY = re.compile(r"^\s*await wait\(page, (\d+(?:\.\d+)?)\);\s*$")


def plan(path):
    """Return (steps to remove or replace as (start, end, name, seconds, replacement|None), kept count)."""
    src = open(path).read()
    steps = list(STEP.finditer(src))
    out, kept = [], 0
    for i, m in enumerate(steps):
        body = m.group(3).strip("\n")
        w = WAIT_BODY.match(body)
        if not w or "\n" in body:
            continue
        name, opts = json.loads(m.group(1)), m.group(2)
        if opts == "{}" and (PREFETCH_ALL.search(name) or PREFETCH_LOOKUPS.search(name)):
            call = ("await waitForPrefetch(page);" if PREFETCH_ALL.search(name)
                    else "await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });")
            out.append((m.start(), m.end(), name, float(w.group(1)),
                        f"  await run.step({m.group(1)}, {{}}, async () => {{\n    {call}\n  }});\n"))
            continue
        nxt = steps[i + 1] if i + 1 < len(steps) else None
        ok = (opts == "{}" and not KEEP_NAME.search(name) and nxt is not None
              and nxt.start() == m.end()                         # nothing between the two steps
              and nxt.group(2) == "{}"
              and POLLING.match(nxt.group(3).lstrip("\n").split("\n")[0]))
        if ok:
            out.append((m.start(), m.end(), name, float(w.group(1)), None))
        else:
            kept += 1
    return out, kept


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("suite", help="a suite id, e.g. MOB.962")
    ap.add_argument("--apply", action="store_true", help="edit the tests (default: print the plan)")
    a = ap.parse_args()
    suites = {s["id"]: s for s in json.load(open(os.path.join(HERE, "suites.json")))["suites"]}
    if a.suite not in suites:
        sys.exit(f"{a.suite}: not in suites.json")
    total_n = total_s = total_kept = 0
    for child in suites[a.suite]["children"]:
        files = glob.glob(os.path.join(MOBILE, "tests", f"{child}_*.ts"))
        if not files:
            continue
        path = files[0]
        gone, kept = plan(path)
        secs = sum(g[3] for g in gone)
        swapped = sum(1 for g in gone if g[4])
        total_n, total_s, total_kept = total_n + len(gone), total_s + secs, total_kept + kept
        print(f"{os.path.basename(path)}: remove {len(gone) - swapped} wait(s), replace {swapped} prefetch sleep(s)"
              f" — {secs:g}s of fixed sleep · keep {kept}")
        if a.apply and gone:
            src = open(path).read()
            for start, end, _, _, repl in reversed(gone):
                src = src[:start] + (repl or "") + src[end:]
            if any(g[4] for g in gone) and IMPORT_FROM not in src:
                names = ["waitForPrefetch"] + (["WORKSTAGE_DOWNLOADS"] if "WORKSTAGE_DOWNLOADS" in src else [])
                line = f"import {{ {', '.join(names)} }} {IMPORT_FROM}\n"
                cut = src.index("\n", src.rindex("\nimport ") + 1) + 1
                src = src[:cut] + line + src[cut:]
            open(path, "w").write(src)
    print(f"{a.suite}: {total_n} wait(s) removed or replaced, {total_s / 60:.1f} min of fixed sleep · keep {total_kept}"
          + ("" if a.apply else "  (plan only — --apply to edit)"))


if __name__ == "__main__":
    main()
