"""Which files of the mobile app the tests touch — a file-level map, 0 Datadog runs, no browser.

    .venv/bin/python e2e/mobile/tools/source_coverage.py                   # print the summary
    .venv/bin/python e2e/mobile/tools/source_coverage.py --write           # also write e2e/mobile/docs/source_coverage.md

WHAT IT MEASURES, AND WHAT IT DOES NOT
  For every `.tsx` under `client/mobile/` on `origin/development` it collects what a test could OBSERVE of that
  file — its rendered JSX text, its `id` / `placeholder` / `aria-label` / `label` / `title` / `name` attribute
  values, its own (non-Mantine) class names, and its toast messages — and looks for each in the TypeScript of
  every test that runs (each non-held suite's children, plus the shared login).

      ✅ touched      at least one of the file's handles appears in a test
      ❌ untouched    it has handles, and no test uses any of them
      ⚪ no handles   it renders nothing a test can name (hooks, layout wrappers, pure logic)
      💀 dead         nothing in the app imports it (by file name), so there is nothing to test

  This is NOT code coverage. "Touched" means a test names something the file renders; it says nothing about
  how many of the file's branches ran. Real line coverage needs source maps from the dev build (see
  e2e/README.md). A file can also be exercised without being named — a hook behind a form the test fills in —
  which is what ⚪ is for.
"""
import argparse
import collections
import glob
import html
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
E2E = os.path.dirname(HERE)
OUT = os.path.join(E2E, "docs", "source_coverage.md")
DEFAULT_MENTORTWO = os.environ.get("MENTORTWO_REPO", os.path.expanduser("~/GitHub/MentorAPM/MentorTwo"))

# What counts as rendered JSX text - the same rule the old sweep used, so the two numbers agree.
TEXT = re.compile(r">([^<>{}]*[A-Za-z][^<>{}]*)<")
CODE = re.compile(r"=>|&&|\|\||;|\bconst\b|\breturn\b|===|\bimport\b|\btype\b|\bvoid\b|React\.|\w\(|^\W+$|\]\s*,|: \w+\??:|//")


def norm(t):
    return re.sub(r"\s+", " ", t).strip()


ATTRS = re.compile(r"""\b(id|placeholder|aria-label|label|title|name|data-testid)\s*=\s*["']([^"'{}]{3,})["']""")
CLASSES = re.compile(r"""className\s*=\s*["']([^"'{}]+)["']""")
TOASTS = re.compile(r"""toast(?:\.\w+)?\(\s*[`'"]([^`'"]{4,})[`'"]""")


def scheduled_corpus():
    """The source of every test that runs: each non-held suite's children, and the shared login."""
    suites = json.load(open(os.path.join(HERE, "suites.json")))["suites"]
    ids = {c for su in suites if "held" not in su for c in su["children"]}
    parts = [open(os.path.join(E2E, "support", "login.ts")).read()]
    for path in glob.glob(os.path.join(E2E, "tests", "MOB.*.ts")):
        if os.path.basename(path)[:7] in ids:
            parts.append(open(path).read())
    # the tests hold strings as TypeScript literals: undo the escaping the converter added
    text = "\n".join(parts).replace("\\`", "`").replace('\\"', '"').replace("\\$", "$")
    return html.unescape(text), len(ids) + 1


def handles(src):
    """What a test could observe of one file: (kind, value) pairs."""
    out = set()
    for m in TEXT.finditer(src):
        t = norm(html.unescape(m.group(1)))
        if len(t) >= 3 and re.search(r"[A-Za-z]{2}", t) and not CODE.search(t):
            out.add(("text", t.rstrip(":")))
    for kind, val in ATTRS.findall(src):
        out.add((kind, norm(val)))
    for group in CLASSES.findall(src):
        for c in group.split():
            if not c.startswith("mantine") and len(c) >= 4:
                out.add(("class", c))
    for t in TOASTS.findall(src):
        if "${" not in t:
            out.add(("toast", norm(t)))
    return out


def seen_in(corpus, value):
    """A handle counts when the tests contain it as a whole token, not inside a longer word."""
    return re.search(r"(?<![\w-])" + re.escape(value) + r"(?![\w-])", corpus) is not None


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--ref", default="origin/development")
    ap.add_argument("--repo", default=DEFAULT_MENTORTWO)
    ap.add_argument("--write", action="store_true", help="write e2e/mobile/docs/source_coverage.md")
    a = ap.parse_args()
    if not os.path.isdir(os.path.join(a.repo, ".git")):
        sys.exit(f"not a git repo: {a.repo}  (set MENTORTWO_REPO, or pass --repo)")
    git = lambda *x: subprocess.run(["git", "-C", a.repo, *x], capture_output=True, text=True, check=True).stdout
    sha = git("rev-parse", "--short", a.ref).strip()

    everything = [f for f in git("ls-tree", "-r", "--name-only", a.ref, "client").split()
                  if f.endswith((".ts", ".tsx")) and "/__jest__/" not in f and "/__stories__/" not in f]
    files = [f for f in everything if f.startswith("client/mobile/") and f.endswith(".tsx")]
    sources = {f: git("show", f"{a.ref}:{f}") for f in everything}
    corpus, n_tests = scheduled_corpus()

    def imported(f):
        """Does anything else import this file? By name: `…/Stem` or, for index.tsx, `…/Folder`."""
        stem = os.path.splitext(os.path.basename(f))[0]
        name = os.path.basename(os.path.dirname(f)) if stem == "index" else stem
        pat = re.compile(r"""from\s+['"][^'"]*\b""" + re.escape(name) + r"""(?:/index)?(?:\.tsx?)?['"]"""
                         r"""|import\(\s*['"][^'"]*\b""" + re.escape(name) + r"""['"]""")
        return any(pat.search(s) for g, s in sources.items() if g != f)

    rows = []
    for f in files:
        hs = handles(sources[f])
        hit = sorted(v for k, v in hs if seen_in(corpus, v))
        miss = sorted(v for k, v in hs if not seen_in(corpus, v))
        entry = f.count("/") <= 2 or f.endswith("routing/index.tsx")      # client/mobile/*.tsx, the router
        if not entry and not imported(f):
            state = "💀"
        elif hit:
            state = "✅"
        elif hs:
            state = "❌"
        else:
            state = "⚪"
        area = f.replace("client/mobile/", "").split("/")
        area = area[1] if area[0] == "components" and len(area) > 2 else area[0]
        rows.append((area, f.replace("client/mobile/", ""), state, hit, miss))

    by_area = collections.OrderedDict()
    for area, f, state, hit, miss in sorted(rows):
        by_area.setdefault(area, collections.Counter())[state] += 1
    totals = collections.Counter(s for _a, _f, s, _h, _m in rows)
    judged = totals["✅"] + totals["❌"]

    lines = [
        "# Source coverage — which app files the tests touch",
        "",
        f"*Generated by `e2e/mobile/tools/source_coverage.py --write` from MentorTwo "
        f"`{a.ref}` @ `{sha}`, against the {n_tests} tests that run. Do not edit by hand — re-run it.*",
        "",
        "**What it is:** for each `.tsx` under `client/mobile/`, whether any test that runs names something the file "
        "renders — its text, an id, placeholder or aria-label, one of its own class names, or a toast message. "
        "**What it is not:** line coverage. \"Touched\" says a test reaches the file, not how much of it ran; real "
        "line coverage needs source maps from the dev build (`e2e/README.md`).",
        "",
        "✅ touched · ❌ has something to name, and no test names it · ⚪ renders nothing a test can name (hooks, "
        "wrappers, logic) · 💀 nothing imports it",
        "",
        f"**{totals['✅']} of {judged} files with something to name are touched "
        f"({100 * totals['✅'] / judged:.0f}%).** {totals['⚪']} render nothing nameable, {totals['💀']} are "
        f"imported by nothing. {len(rows)} files in all.",
        "",
        "| Area | Files | ✅ | ❌ | ⚪ | 💀 | Touched |",
        "|---|---|---|---|---|---|---|",
    ]
    for area, c in by_area.items():
        j = c["✅"] + c["❌"]
        pct = f"{100 * c['✅'] / j:.0f}%" if j else "—"
        lines.append(f"| {area} | {sum(c.values())} | {c['✅']} | {c['❌']} | {c['⚪']} | {c['💀']} | {pct} |")
    lines += ["", "## ❌ Files no test touches", "",
              "Each has something a test could name. Worth a read: some are gaps, some are states that are hard to "
              "reach on dev (an error, an empty list), some are covered by a row already marked `[-]` in "
              "`testing_checklist.md`.", "",
              "| File | What a test could look for (first few) |", "|---|---|"]
    for area, f, state, hit, miss in sorted(rows):
        if state == "❌":
            shown = " · ".join(f"`{m}`" for m in miss[:4]) + (f" · +{len(miss) - 4}" if len(miss) > 4 else "")
            lines.append(f"| `{f}` | {shown} |")
    lines += ["", "## 💀 Imported by nothing", "",
              "Matched by file name, so a file imported under another name can land here; check before calling it "
              "dead.", ""]
    lines += [f"- `{f}`" for area, f, state, hit, miss in sorted(rows) if state == "💀"]
    lines += ["", "## ✅ Touched", "", "| File | Named by a test |", "|---|---|"]
    for area, f, state, hit, miss in sorted(rows):
        if state == "✅":
            lines.append(f"| `{f}` | {len(hit)} of {len(hit) + len(miss)} handles |")
    text = "\n".join(lines) + "\n"

    print("\n".join(lines[:len(by_area) + 14]))
    print(f"\n❌ untouched: {totals['❌']} · 💀 imported by nothing: {totals['💀']}")
    if a.write:
        open(OUT, "w").write(text)
        print(f"\nwrote {os.path.relpath(OUT, os.path.dirname(E2E))}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
