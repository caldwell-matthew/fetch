"""The rendered-string sweep (testing_checklist.md 🔧 check 6) - 0 Datadog runs.

Lists every JSX TEXT child in `client/mobile` on `origin/development` that no test's step params contain.
Attributes (placeholder, aria-label) are not rendered text and are not swept - `check_literals.py` guards the
literals tests already assert. Every hit needs a human read: the regex also catches TypeScript between `>` and
`<` (generics), and many strings are already classified in the checklist (⚪ NOT A GAP, 🔴 HARNESS, 🟡 BLOCKED,
`[-]`). A string worth a test becomes a ▶ OPEN WORK row.

USAGE (from dd_scripts_mobile/)
    python3 sweep_strings.py                 # against origin/development (git fetch it first)
    python3 sweep_strings.py --ref <sha>
"""
import argparse
import glob
import html
import json
import os
import re
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
TESTS = os.path.join(HERE, "..", "dd_tests_mobile")
REPO = os.path.expanduser("~/GitHub/MentorAPM/MentorTwo")
TEXT = re.compile(r">([^<>{}]*[A-Za-z][^<>{}]*)<")
CODE = re.compile(r"=>|&&|\|\||;|\bconst\b|\breturn\b|===|\bimport\b|\btype\b|\bvoid\b|React\.|\w\(|^\W+$|\]\s*,|: \w+\??:|//")


def norm(t):
    return re.sub(r"\s+", " ", t).strip()


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--ref", default="origin/development")
    ref = ap.parse_args().ref
    git = lambda *a: subprocess.run(["git", "-C", REPO, *a], capture_output=True, text=True, check=True).stdout
    files = [f for f in git("ls-tree", "-r", "--name-only", ref, "client/mobile").split()
             if f.endswith(".tsx") and "/__jest__/" not in f and "/__stories__/" not in f]
    corpus = norm("\n".join(json.dumps(st.get("params", {}), ensure_ascii=False)
                            for p in glob.glob(os.path.join(TESTS, "*.json"))
                            for st in json.load(open(p))["details"]["steps"]))
    asserted, missing, seen = 0, [], set()
    for f in files:
        src = git("show", f"{ref}:{f}")
        for m in TEXT.finditer(src):
            t = norm(html.unescape(m.group(1)))
            if len(t) < 3 or not re.search(r"[A-Za-z]{2}", t) or CODE.search(t):
                continue
            if t in corpus or t.rstrip(":") in corpus:
                asserted += 1
            elif (f, t) not in seen:
                seen.add((f, t))
                missing.append((f.replace("client/mobile/components/", ""), src.count("\n", 0, m.start()) + 1, t))
    print(f"{ref} · {len(files)} .tsx files · {asserted + len(missing)} JSX text strings · {asserted} asserted · "
          f"{len(missing)} in no test (each needs a human read)\n")
    for f, line, t in missing:
        print(f"{f}:{line}\t{t}")


if __name__ == "__main__":
    main()
