"""Report test assertions whose LITERAL no longer exists in the app. Changes nothing.

WHY THIS EXISTS - the failure `check_drift` and `audit_assertions` structurally cannot see.
  Those two watch the TESTS: does the generator still reproduce its JSON, does an assertion
  prove its own name. Both were clean on 2026-09-08 while three tests were broken, because
  the thing that changed was the APP.

  The 09-02 localization commit renamed ProximityMenu's radius items from `25 miles` to
  `25 mi`. Nobody ran anything for two weeks, so nothing went red. When it was finally read:

      MOB.731  could not find or click its radius -> every step after it void
      MOB.730  positive check `/^\\d+ miles$/ matches 5`  -> FAILED
      MOB.730  paired absence `... matches 0`            -> PASSED, VACUOUSLY, FOREVER

  ⚠️ THAT THIRD LINE IS THE POINT. A rename does not only break assertions - it can silently
  convert a real one into a tautology. `audit_assertions` reads that step as a positive check
  (it is: a filter and a count) and has no way to know the regex can no longer match anything.
  Only comparing the literal against the source finds it.

WHAT IT CHECKS
  Every literal a test asserts must still exist somewhere in the app source:
    - assertPageContains / assertPageLacks   `value`
    - assertElementContent                   `value`
    - XPath text predicates                  normalize-space(.)="X" | text()="X"
                                             contains(., "X") | starts-with(..., "X")
    - assertFromJavascript                   quoted strings AND prose inside /regex/ literals
      ⭐ This last one is not optional. `assertFromJavascript` is the single most common
      assertion type here (390 steps), and MOB.730's vacuous check WAS a regex. A first cut of
      this script skipped JS and reported the known-broken suite clean.

  Source = `client/mobile` + `client/src` at a git ref (default origin/development, the ref
  that serves dev.mentorapm.com), MINUS test files, MINUS comments. Read from the REF, never
  the working tree - local branches diverge, and auditing a dirty tree reports on code no
  runner will ever execute.

  🛑 EXCLUDING TESTS AND COMMENTS IS LOAD-BEARING, not tidiness. The question this script asks
  is "does the app still RENDER this string?" - and a jest file renders nothing, a comment
  renders nothing. When the radius rename landed, the word `miles` survived in exactly four
  places: two jest files, one `//` comment, and a turf.js `{ units: 'miles' }` argument. Every
  one of them is enough to absolve a dead literal if the corpus is naive.

THE THREE BUCKETS - only the first is a finding
  MISSING   nothing in the literal survives in rendered source. ⭐ THE SIGNAL.
  COMPOSED  built at runtime from a template, evidenced by a CONTIGUOUS fragment of the
            literal appearing in source - `Mark as {label}` leaves "Mark as", `Filters ({n})`
            leaves "Filters (". Reported quietly; worth a skim, because a template whose SHAPE
            changed lands here rather than in MISSING.
            ⚠️ Contiguity is the whole point. An earlier rule - "every WORD appears somewhere"
            - let `25 miles` through on the single word `miles` found 12 MB away in an
            unrelated file. A single-word literal can therefore never be COMPOSED; it must
            match exactly or be allowlisted.
  FIXTURE   listed in literals_allowlist.txt - data that lives in the dev database and is
            correctly absent from source (`Pump 0102`, `DATADOG MOBILE JOB`, ...).

SELF-TEST
    ./.venv/bin/python Mobile/dd_scripts_mobile/check_literals.py --self-test
  Replays the 2026-09-02 radius rename against the current suite and requires it to be
  reported. 🛑 Run this after ANY change to the matching rules - both defects above were found
  by it, not by reading the code.

USAGE
    ./.venv/bin/python Mobile/dd_scripts_mobile/check_literals.py
    ./.venv/bin/python Mobile/dd_scripts_mobile/check_literals.py --ref origin/development
    ./.venv/bin/python Mobile/dd_scripts_mobile/check_literals.py --all   # show COMPOSED too

  Exit 0 = every literal accounted for. Exit 1 = at least one MISSING.

  🛑 `git fetch origin development` FIRST. `origin/development` is a local ref and is only as
  current as your last pull - this script warns if it looks stale, because auditing against a
  stale ref produces confident nonsense. That was the one process gap in the 09-08 audit.

ADDING TO THE ALLOWLIST
  Only for FIXTURE DATA - a string that lives in the database and cannot appear in source.
  🛑 Never allowlist a UI string to make this quiet. That converts the exact failure this
  script exists to catch back into a silent one.
"""
import argparse, json, glob, os, re, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
MOBILE = os.path.dirname(HERE)
TESTS = os.path.join(MOBILE, "dd_tests_mobile")
ALLOWLIST = os.path.join(HERE, "literals_allowlist.txt")
DEFAULT_REPO = os.path.expanduser("~/GitHub/MentorAPM/MentorTwo")
DEFAULT_REF = "origin/development"
SOURCE_DIRS = ["client/mobile", "client/src"]
STALE_DAYS = 2

# Text inside an XPath predicate. Only these forms - a bare `contains(@class, ...)` is a
# selector, not a user-visible string, and reporting it would bury the signal.
XPATH_TEXT = re.compile(
    r'(?:normalize-space\(\.\)|text\(\))\s*=\s*"([^"]{3,80})"'
    r'|contains\(\s*(?:normalize-space\(\.\)|text\(\)|\.)\s*,\s*"([^"]{3,80})"\s*\)'
    r'|starts-with\(\s*(?:normalize-space\(\.\)|text\(\)|\.)\s*,\s*"([^"]{3,80})"\s*\)'
)
# Datadog templating - `{{ RUNID }}` is substituted at run time and is never in source.
TEMPLATE = re.compile(r"\{\{[^}]*\}\}")
WORD = re.compile(r"[A-Za-z][A-Za-z0-9']*")
# Prose worth checking inside an assertFromJavascript body: quoted strings, and the literal
# runs inside a /regex/. Selectors and property names are filtered out by IS_SELECTOR.
JS_STRING = re.compile(r"'([^'\\\n]{4,80})'|\"([^\"\\\n]{4,80})\"|`([^`\\\n]{4,80})`")
JS_REGEX = re.compile(r"/((?:[^/\\\n\[]|\\.|\[[^\]\n]*\])+)/[gimsuy]*")
# A JS literal that is plumbing, not user-visible text.
IS_SELECTOR = re.compile(
    r"^[.#\[]|[.#\[\]{}()<>$]|^[a-z][a-zA-Z]*$|^[a-z-]+$|^[A-Z_]+$|"
    r"mantine|aria|data-|querySelector|textContent|innerText|style|class|node|element"
)
# Comment strippers, applied PER LINE. A comment renders nothing, so it must not absolve a
# dead literal - but stripping across a blob is worse than not stripping at all: `git grep`
# output is many files concatenated, so a `/*` in one file pairs with a `*/` in another and a
# DOTALL match eats everything between. That silently deleted 312 KB of real source, including
# `Sort Criteria`, and reported it MISSING. Per line, a mispair can only ever eat one line.
BLOCK_COMMENT = re.compile(r"/\*.*?\*/")            # single-line /* ... */ only, no re.S
LINE_COMMENT = re.compile(r"(^|\s)//.*$")
JSDOC_LINE = re.compile(r"^\s*\*")                  # a block comment's continuation lines
TEST_PATH = re.compile(r"__jest__|__tests__|\.test\.|\.spec\.|\.stories\.|/__mocks__/")


def load_source(repo, ref):
    """Rendered app source at `ref`: no test files, no comments. Reads the REF, not the tree.

    🛑 Both exclusions are load-bearing - see the module docstring. `git grep` prefixes each
    line with `ref:path:`, which is what lets test files be dropped line-by-line.
    """
    if not os.path.isdir(os.path.join(repo, ".git")):
        sys.exit(f"not a git repo: {repo}  (pass --repo)")
    if subprocess.run(["git", "-C", repo, "rev-parse", "--verify", "--quiet", ref],
                      capture_output=True).returncode:
        sys.exit(f"ref not found: {ref}  (did you `git fetch`?)")

    fetch_head = os.path.join(repo, ".git", "FETCH_HEAD")
    if ref.startswith("origin/") and os.path.exists(fetch_head):
        age_days = (time.time() - os.path.getmtime(fetch_head)) / 86400
        if age_days > STALE_DAYS:
            print(f"⚠️  {ref} was last fetched {age_days:.1f} days ago. Run "
                  f"`git -C {repo} fetch origin` first - a stale ref gives confident "
                  f"nonsense.\n", file=sys.stderr)

    kept = []
    for d in SOURCE_DIRS:
        # no -h: keep the `ref:path:` prefix so test files can be dropped per line
        r = subprocess.run(["git", "-C", repo, "grep", "-e", "", ref, "--", d],
                           capture_output=True, text=True)
        for line in r.stdout.splitlines():
            path, _, body = line.partition(":")[2].partition(":")
            if TEST_PATH.search(path):
                continue
            if JSDOC_LINE.match(body):          # inside a /** ... */ block
                continue
            body = LINE_COMMENT.sub(" ", BLOCK_COMMENT.sub(" ", body))
            kept.append(body)
    text = "\n".join(kept)
    if len(text) < 100_000:
        sys.exit(f"source read from {ref} looks empty ({len(text)} chars) - wrong ref or path?")
    return text


def skeletons(lit):
    """Contiguous fragments of `lit` whose presence in source would explain it as a template.

    Longest first. A single-word literal yields nothing, deliberately: `25 miles` must not be
    absolved by the bare word `miles` sitting in an unrelated file.
    """
    out = []
    words = lit.split()
    for n in range(len(words), 1, -1):           # >= 2 words, contiguous, longest first
        for i in range(len(words) - n + 1):
            out.append(" ".join(words[i:i + n]))
    # `Filters (1)` -> `Filters (` : the invariant half of a `{count}` template
    head = re.split(r"\d", lit, maxsplit=1)[0].strip()
    if len(head) >= 5 and WORD.search(head):
        out.append(head)
    # A SINGLE capitalised word is admissible evidence; a single lowercase one is not.
    # `Ready (n)` is composed from the label `Ready`, which is real UI text. `25 miles` must
    # NOT be excused by the bare word `miles` sitting in a turf.js `{ units: 'miles' }`
    # argument - that is precisely the false negative that let the rename through.
    for tok in re.findall(r"[A-Z][A-Za-z]{3,}", lit):
        out.append(tok)
    return out


def explained(lit, src):
    """Is `lit` plausibly a runtime template rather than a dead string?

    TWO conditions, and BOTH are needed:
      (a) a CONTIGUOUS multi-word fragment of it survives in source - the template's stem;
      (b) EVERY word in it survives somewhere - the interpolated values.

    Neither alone is sufficient, and the self-test pins both:
      - (a) alone excuses a PARTIAL rename. `Select Photo Sauce` keeps the stem
        `Select Photo`, so contiguity says "template" about a string the app never renders.
      - (b) alone excuses a TOTAL rename on one common word. `25 miles` has every word
        present, because `miles` survives in a turf.js argument 12 MB away.

    Worked examples:
      `Mark as Pending`     stem `Mark as` ✓ · Mark/as/Pending all present ✓  -> template
      `Select Photo Sauce`  stem `Select Photo` ✓ · `Sauce` absent ✗          -> REPORTED
      `Ready (`             stem `Ready` (capitalised, admissible) ✓ · ✓      -> template
    """
    if not any(sk in src for sk in skeletons(lit)):
        return False
    return all(w in src for w in WORD.findall(lit))


NUMERIC_UNIT = re.compile(r"^[\d.,]+\s*[A-Za-z]{1,6}$")


def is_composed_numeric(lit):
    """`25 mi`, `100 km`, `3.4 mi` - a number the app formats next to a unit it derives.

    🛑 GREP CANNOT ADJUDICATE THESE, and pretending otherwise is worse than saying so. The
    rendered string is `${radius} ${distanceUnit}` where `distanceUnit` is chosen at runtime,
    so NEITHER `25 miles` (dead) NOR `25 mi` (live) appears in source. Both look identical to
    a substring search. Deciding between them needs the TypeScript evaluated.

    So they get their own bucket. It is short, and its CONTENTS CHANGE when a unit is renamed
    - which is the signal a human can actually use. The check that catches this class properly
    is the `client/mobile` codebase diff in testing_checklist.md, not this script.
    """
    return bool(NUMERIC_UNIT.match(lit.strip()))


def js_prose(code):
    """User-visible strings inside an assertFromJavascript body.

    Two sources, both of which have bitten: quoted strings, and the literal runs inside a
    /regex/ - MOB.730 asserted `/^\\d+ miles$/`, and skipping regexes made this script report
    the known-broken suite clean.

    🛑 PROSE ONLY. A JS body is mostly plumbing (`table tbody tr`, `h1,h2,h3`, `li mark`,
    `__dd132_rows`), and reporting that buries the signal under noise. The test for prose is
    cheap and holds well here: it must contain an uppercase letter AND either a space or 8+
    characters. Every real hit - `Welcome, Friend!`, `No logs found.`, `Location updated` -
    passes it; every selector above fails it.
    """
    out = []
    for m in JS_STRING.finditer(code):
        out.append(next(g for g in m.groups() if g is not None))
    for m in JS_REGEX.finditer(code):
        body = m.group(1)
        # alternations are separate candidates: `(INFO|ERROR)` is two strings, not
        # `"INFO ERROR"`, which is a phrase the app never renders
        for branch in re.split(r"\|", body):
            branch = re.sub(r"\\[a-zA-Z]|\[[^\]]*\]|[(){}?*+^$]|\\", " ", branch)
            for run in re.split(r"\s{2,}", branch):
                out.append(run)
    return [t for t in (s.strip() for s in out) if IS_PROSE(t)]


def IS_PROSE(t):
    """Is this string plausibly something a USER reads, rather than a selector or identifier?"""
    if len(t) < 4 or not WORD.search(t):
        return False
    if IS_SELECTOR.search(t):
        return False
    if not re.search(r"[A-Z]", t):
        return False
    return " " in t or len(t) >= 8


def literals():
    """Yield (test, step_index, step_name, kind, literal) for everything asserted."""
    for path in sorted(glob.glob(os.path.join(TESTS, "*.json"))):
        d = json.load(open(path))["details"]
        for i, s in enumerate(d["steps"]):
            p, t = s.get("params", {}), s["type"]
            if t in ("assertPageContains", "assertPageLacks") and isinstance(p.get("value"), str):
                yield d["name"], i, s["name"], t, p["value"]
            if t == "assertElementContent" and isinstance(p.get("value"), str):
                yield d["name"], i, s["name"], t, p["value"]
            el = p.get("element") or {}
            for v in (el.get("userLocator") or {}).get("values", []):
                for m in XPATH_TEXT.finditer(v.get("value") or ""):
                    got = next((g for g in m.groups() if g), None)
                    if got:
                        yield d["name"], i, s["name"], "xpath", got
            if t == "assertFromJavascript":
                for lit in js_prose(p.get("code") or ""):
                    yield d["name"], i, s["name"], "js", lit


def self_test(src, allow):
    """Prove the matching rules still do what they claim - against the REAL corpus.

    🛑 Written after two silent defects. The first cut of this script skipped
    `assertFromJavascript` bodies entirely, and used a "does every WORD appear somewhere" rule
    that `25 miles` satisfied on the single word `miles` sitting 12 MB away. Both produced a
    CLEAN report on a suite that was genuinely broken. Neither was visible by reading the code.

    Run this after ANY change to the rules. A tool that reports clean on known-broken input is
    worse than no tool, because it is trusted.
    """
    def verdict(lit):
        probe = TEMPLATE.sub("", lit).strip()
        if probe in allow:
            return "allowed"
        if is_composed_numeric(probe):
            return "numeric"
        if probe in src or explained(probe, src):
            return "clean"
        return "REPORTED"

    cases = [
        # --- the main path: a literal UI string that was renamed -------------------------
        ("Select Photo Sauce", "REPORTED", "a renamed literal - the case this tool is FOR"),
        ("Select Photo Source", "clean", "the real string, present in source"),
        ("Sort Criteria", "clean", "real, and the case a blob-wide /*..*/ strip once ate"),
        ("Search radius", "clean", "real UI string on the screen that broke"),
        # --- templates must not be reported ---------------------------------------------
        ("Mark as Pending", "clean", "runtime template `Mark as {label}`"),
        ("Ready (", "clean", "composed from the `Ready` label + ` (`"),
        # --- the radius rename: surfaced, but in the bucket that admits its limits -------
        ("25 miles", "numeric", "MOB.731's dead radius - grep cannot judge it, so it is "
                                "surfaced for a human, not silently cleared"),
        ("25 mi", "numeric", "and neither can it judge the LIVE one - same bucket, honestly"),
        # --- fixture data ----------------------------------------------------------------
        ("DATADOG MOBILE JOB", "allowed", "fixture data, allowlisted"),
    ]
    bad = 0
    print("SELF-TEST - matching rules vs the live corpus\n")
    for lit, want, why in cases:
        got = verdict(lit)
        ok = got == want
        bad += not ok
        print(f"  {'ok  ' if ok else 'FAIL'}  {lit!r:22s} -> {got:9s} (want {want:9s})  {why}")

    # --- regression test for defect #1: JS bodies must actually be SCANNED ---------------
    print()
    extracted = js_prose("return /No logs found\\./.test(t) || x === 'Location updated';")
    got = sorted(extracted)
    want_any = any("Location updated" in g or "No logs found" in g for g in got)
    bad += not want_any
    print(f"  {'ok  ' if want_any else 'FAIL'}  assertFromJavascript bodies are scanned "
          f"-> {got}")
    noise = js_prose("document.querySelectorAll('table tbody tr'); const x = 'li mark';")
    bad += bool(noise)
    print(f"  {'ok  ' if not noise else 'FAIL'}  selector noise is filtered out -> {noise}")

    print()
    if bad:
        print(f"🛑 {bad} SELF-TEST FAILURE(S) - do not trust a clean run until these pass.")
        return 1
    print("PASS - the rules behave as documented.")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=os.environ.get("MENTORTWO_REPO", DEFAULT_REPO))
    ap.add_argument("--ref", default=DEFAULT_REF)
    ap.add_argument("--all", action="store_true", help="also list COMPOSED hits")
    ap.add_argument("--self-test", action="store_true",
                    help="prove the matching rules still catch the 09-02 rename")
    args = ap.parse_args()

    src = load_source(args.repo, args.ref)
    allow = set()
    if os.path.exists(ALLOWLIST):
        allow = {ln.split("#")[0].strip() for ln in open(ALLOWLIST)
                 if ln.strip() and not ln.lstrip().startswith("#")}
        allow.discard("")

    if args.self_test:
        return self_test(src, allow)

    missing, composed, numeric, seen = [], [], [], set()
    n = 0
    for test, i, sname, kind, lit in literals():
        raw = lit.strip()
        # strip Datadog templating before matching - `{{ RUNID }}` is never in source
        probe = TEMPLATE.sub("", raw).strip()
        if len(probe) < 4 or not WORD.search(probe):
            continue
        n += 1
        if raw in allow or probe in allow:
            continue
        if probe in src:
            continue
        key = (test, raw)
        if key in seen:
            continue
        seen.add(key)
        row = (test, i, sname, kind, raw)
        if is_composed_numeric(probe):
            numeric.append(row)
        elif explained(probe, src):
            composed.append(row)
        else:
            missing.append(row)

    print(f"{n} literals checked against {args.ref} "
          f"({len(src):,} chars of client/mobile + client/src)")
    print(f"  {len(missing)} MISSING · {len(numeric)} NUMERIC+UNIT · "
          f"{len(composed)} COMPOSED · {len(allow)} allowlisted as fixture data\n")

    if missing:
        print("MISSING - asserted by a test, absent from the app. Each one is either a rename")
        print("the tests have not caught up with, or fixture data for the allowlist:\n")
        for test, i, sname, kind, lit in sorted(missing):
            print(f"  {test}  step {i} [{kind}]")
            print(f"      literal: {lit!r}")
            print(f"      step   : {sname[:88]}")

    if numeric:
        print(("\n" if missing else "") +
              "NUMERIC+UNIT - a number the app formats beside a unit it picks at RUNTIME.\n"
              "🛑 This script cannot tell a live one from a dead one: neither `25 mi` nor\n"
              "   `25 miles` appears in source, because both are composed. READ THESE against\n"
              "   utils/distance and utils/number whenever the list changes:\n")
        for test, i, sname, kind, lit in sorted(numeric):
            print(f"  {test}  step {i} [{kind}]  {lit!r}")

    if composed:
        head = "COMPOSED - built at runtime from a template; every word appears in source."
        if args.all:
            print(("\n" if missing else "") + head + "\n")
            for test, i, sname, kind, lit in sorted(composed):
                print(f"  {test}  step {i} [{kind}]  {lit!r}")
        else:
            print(f"\n{head} Re-run with --all to list them.")

    if not missing:
        print("\nOK - every asserted literal still exists in the app.")
        return 0
    print("\n🛑 A MISSING literal can FAIL a test or, if it sits in an absence check, make one")
    print("   pass vacuously forever. Read each before deciding which.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
