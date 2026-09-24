"""Do the mobile docs still describe the suite as it is? — free, reads only files in this repo.

    .venv/bin/python e2e/mobile/tools/check_docs.py

Run it after any change to `e2e/mobile/docs/` or to the tests. It fails on the drift these docs keep growing:

  - a row in ▶ OPEN WORK that reads as finished (a done item is deleted, not kept);
  - a `#N` anywhere in the docs or the tests that cites an OPEN WORK row which does not exist;
  - the checklist's Rows line not matching its own boxes;
  - the test counts in the checklist and in coverage.md not matching the tests in e2e/mobile/.
"""
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
MOBILE = os.path.dirname(HERE)
DOCS = os.path.join(MOBILE, "docs")


def counts():
    """What the suite holds, from the TypeScript: tests, suites, steps, and suite children."""
    tests = glob.glob(os.path.join(MOBILE, "tests", "*.ts"))
    steps = sum(len(re.findall(r"^\s*await run\.step\(", open(p).read(), re.M)) for p in tests)
    suites = json.load(open(os.path.join(HERE, "suites.json")))["suites"]
    children = sum(len(s["children"]) for s in suites)
    return len(tests), len(suites), steps, children


def check():
    problems = []
    ck = open(os.path.join(DOCS, "testing_checklist.md")).read()

    section = ck[ck.index("## ▶ OPEN WORK"):ck.index("### ⚪ NOT A GAP")]
    rows = set()
    for line in section.splitlines():
        m = re.match(r"\| \*\*#?(\d+)\b", line)
        if not m:
            continue
        rows.add(int(m.group(1)))
        state = line.rstrip().rstrip("|").rsplit("|", 1)[-1].strip()
        if re.search(r"✅|\bbuilt\b|\bfixed\b|\bdone\b", state):
            problems.append(f"OPEN WORK #{m.group(1)} reads as finished ({state[:50]!r}) - delete the row")

    cited = glob.glob(os.path.join(DOCS, "*.md")) + glob.glob(os.path.join(MOBILE, "tests", "*.ts"))
    for path in cited:
        for m in re.finditer(r"(?<![\w§/])#(\d{2})(?:\s*[–-]\s*#?(\d{2}))?\b", open(path).read()):
            for n in range(int(m.group(1)), int(m.group(2) or m.group(1)) + 1):
                if n not in rows:
                    problems.append(f"{os.path.basename(path)} cites checklist #{n}, which is not a row")

    boxes = {k: len(re.findall(rf"^- \[{re.escape(k)}\]", ck, re.M)) for k in ("x", "~", " ", "-")}
    want = (f"| Rows | {boxes['x']} `[x]` · {boxes['~']} `[~]` · {boxes[' ']} `[ ]` · {boxes['-']} `[-]` "
            f"— {sum(boxes.values())} rows.")
    if want not in ck:
        problems.append(f"the checklist's Rows line should read: {want}")

    n_tests, n_suites, _steps, n_children = counts()
    # Steps are not counted: only the converted tests are written as `run.step` calls, so a step count would
    # ignore every test written natively in Playwright.
    line = f"**{n_tests} tests · {n_suites} suites** · {n_children} suite children"
    for name, want in (("testing_checklist.md", line), ("coverage.md", line)):
        if want not in open(os.path.join(DOCS, name)).read():
            problems.append(f"{name}'s test counts should read: {want}")

    problems = list(dict.fromkeys(problems))
    if problems:
        return False, f"{len(problems)} problem(s):\n  - " + "\n  - ".join(problems[:8])
    return True, f"OPEN WORK rows {sorted(rows)} all open · citations resolve · counts current"


if __name__ == "__main__":
    ok, msg = check()
    print(("DOCS CURRENT — " if ok else "DOCS STALE — ") + msg)
    sys.exit(0 if ok else 1)
