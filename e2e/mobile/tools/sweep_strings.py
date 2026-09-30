"""The rendered-string sweep (testing_checklist.md 🔧 check 6) — local, reads only.

Lists every JSX TEXT child in `client/mobile` on `origin/development` that no test's source contains. Attributes
(placeholder, aria-label) are not rendered text and are not swept — `check_literals.py` guards the literals tests
already assert. Every hit needs a human read: the regex also catches TypeScript between `>` and `<` (generics), and many
strings are already classified in the checklist (⚪ NOT A GAP, 🔴 HARNESS, 🟡 BLOCKED, `[-]`). A string worth a test
becomes a ▶ OPEN WORK row.

The corpus is the Playwright source — `tests/`, `suites/` and `support/` — as written and with regex escapes removed,
so a string asserted through a regex (`/You selected\\s*Tank/`) still counts.

USAGE
    .venv/bin/python e2e/mobile/tools/sweep_strings.py                # against origin/development (git fetch it first)
    .venv/bin/python e2e/mobile/tools/sweep_strings.py --ref <sha>
"""
import argparse
import glob
import html
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
MOBILE = os.path.dirname(HERE)
SOURCES = [os.path.join(MOBILE, d, "*.ts") for d in ("tests", "suites", "support")]
sys.path.insert(0, HERE)
from app_source import DEFAULT_REF, DEFAULT_REPO, require_repo  # noqa: E402
TEXT = re.compile(r">([^<>{}]*[A-Za-z][^<>{}]*)<")
CODE = re.compile(r"=>|&&|\|\||;|\bconst\b|\breturn\b|===|\bimport\b|\btype\b|\bvoid\b|React\.|\w\(|^\W+$|\]\s*,|: \w+\??:|//")


def norm(t):
    return re.sub(r"\s+", " ", t).strip()


def corpus():
    raw = "\n".join(open(p, encoding="utf-8").read() for pattern in SOURCES for p in glob.glob(pattern))
    unescaped = re.sub(r"\\s[*+?]?", " ", raw)          # a regex's \s, \s*, \s+ read as a space
    unescaped = re.sub(r"\\(.)", r"\1", unescaped)      # \( \. \? … read as the character
    return norm(raw) + "\n" + norm(unescaped)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--ref", default=DEFAULT_REF)
    ap.add_argument("--repo", default=DEFAULT_REPO)
    args = ap.parse_args()
    ref, repo = args.ref, args.repo
    require_repo(repo)
    git = lambda *a: subprocess.run(["git", "-C", repo, *a], capture_output=True, text=True, check=True).stdout
    files = [f for f in git("ls-tree", "-r", "--name-only", ref, "client/mobile").split()
             if f.endswith(".tsx") and "/__jest__/" not in f and "/__stories__/" not in f]
    text = corpus()
    asserted, missing, seen = 0, [], set()
    for f in files:
        src = git("show", f"{ref}:{f}")
        for m in TEXT.finditer(src):
            t = norm(html.unescape(m.group(1)))
            if len(t) < 3 or not re.search(r"[A-Za-z]{2}", t) or CODE.search(t):
                continue
            if t in text or t.rstrip(":") in text:
                asserted += 1
            elif (f, t) not in seen:
                seen.add((f, t))
                missing.append((f.replace("client/mobile/components/", ""), src.count("\n", 0, m.start()) + 1, t))
    sha = git("rev-parse", "--short=10", ref).strip()
    print(f"{ref} ({sha}) · {len(files)} .tsx files · {asserted + len(missing)} JSX text strings · {asserted} asserted · "
          f"{len(missing)} in no test (each needs a human read)\n")
    for f, line, t in missing:
        print(f"{f}:{line}\t{t}")


if __name__ == "__main__":
    main()
