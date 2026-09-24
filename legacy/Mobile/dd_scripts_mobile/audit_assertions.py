"""Find assertions that PASS WITHOUT PROVING THEIR OWN NAME. Changes nothing.

WHY THIS EXISTS - three green tests have already been caught not proving anything.

    MOB.340   passed for weeks against an EMPTY work list (bugs_found.md 25). It asserted the
              page chrome, which renders whether or not any data arrived.
    MOB.348   its geolocate step counted `button, [role=button] >= 2` and NEVER included the
              `component="span"` control it was named for. Green, and would have stayed green
              if that control vanished entirely.
    MOB.346   its sort guard was `id !== 'SCHEDULED_WORK' || true` - a tautology. Dead code
              that could not fail.

  Each was found by hand, by accident, one at a time. Each was a row counted as coverage that
  was not coverage. That is the most expensive kind of defect in a test suite, because it is
  invisible: the run is GREEN, and the checklist row says `[x]`.

  ⚠️ THIS IS A HEURISTIC, NOT A PROOF. It reports SUSPECTS, ranked. Several shapes below are
  legitimate in the right context - an action step SHOULD `return true`, and an absence
  assertion is fine when something nearby establishes the positive. **Every hit needs a human
  read.** The value is that it turns "read 102 tests hoping to notice" into "read 20 flagged
  steps on purpose".

WHAT IT LOOKS FOR

  TAUTOLOGY        `|| true`, `|| 1`, `return true` at the end of a GUARD/PROOF/assert step.
                   Cannot fail. This is MOB.346's shape and is always a real defect.
  GENERIC-COUNT    `querySelectorAll('button'|'div'|'*'|[role=button]...).length >= N`.
                   Passes on page chrome. This is MOB.348's shape.
  NAME-MISMATCH    the step NAME names a thing (a quoted string, a placeholder, an aria-label)
                   that appears NOWHERE in the code it runs. The strongest single signal here,
                   and what MOB.348 would have tripped.
  VACUOUS-ABSENCE  `assertPageLacks` / `!...` with no positive control in the same test.
                   True on a blank page, a crashed render, and a login redirect alike.
  LOADBEARING-OPT  a step marked `optional` whose name claims GUARD / PROOF / ⭐ / CRITICAL.
                   An amber step cannot fail a run, so a regression there is invisible.
  (NO-TIMEOUT      REMOVED 2026-09-11 - its premise was false. An untimed step POLLS until
                   Datadog's 60s default: MOB.390's untimed `Pick 1` failed at 58.5s. 95 hits,
                   none a defect. Trap 21 is about ABSENCE checks, which VACUOUS-ABSENCE covers.)

USAGE
    ./.venv/bin/python Mobile/dd_scripts_mobile/audit_assertions.py            # ranked report
    ./.venv/bin/python Mobile/dd_scripts_mobile/audit_assertions.py --json     # machine-readable
    ./.venv/bin/python Mobile/dd_scripts_mobile/audit_assertions.py MOB.348    # one test

Exit 1 if any HIGH-severity suspect is found, so it can gate a rebuild.
"""
import json, glob, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TESTS = os.path.join(os.path.dirname(HERE), "dd_tests_mobile")

# Selectors so broad that a count over them is satisfied by page chrome. `[role=tab]` and
# `[role=option]` are deliberately NOT here: those ARE the subject in the tab/select tests.
GENERIC = ("button", "div", "*", "[role=button]", "input", "a", "span", "p", "li")

# Words that mark a step as load-bearing. If one of these is in the name, the step is claiming
# to establish a fact - so it must not be optional and must not be a tautology.
CLAIMS = ("GUARD", "PROOF", "⭐", "CRITICAL", "BASELINE", "RESTORED", "FIXTURE")

# Step names that legitimately end in `return true`: they DO something and report that it
# happened. Judged by name, exactly as the checklist's own note says.
ACTIONS = ("open", "click", "select", "switch", "pick", "reveal", "close", "leave", "focus",
           "type", "scroll", "dismiss", "expand", "collapse", "set ", "clear", "enable")

# `DIAG:` steps are INFORMATIONAL BY DESIGN - they record what the page looked like so a failure
# elsewhere can be diagnosed, and several are deliberately always-true. Flagging them as
# tautologies is a false positive, and a checker that cries wolf gets ignored, which is the one
# way this file can do harm. So they are exempt from TAUTOLOGY / GENERIC-COUNT -
# BUT ONLY WHILE THEY STAY OPTIONAL. That is the invariant that makes them safe: an always-true
# DIAG cannot fail, and a fallible DIAG must not be able to fail a run for a diagnostic reason.
# All 11 DIAG steps in the suite are optional today; this keeps it that way.


# A quoted term in a step name is NOT always a DOM string the code should contain. Two whole
# classes are legitimate, and treating them as defects is what made the first version of this
# check ~90% false positives - a checker nobody trusts is worse than no checker.
#
#   SOURCE REFERENCE   `withIndicators={photos.length > 1}` · `PhotoMenu` · `isValid` · `#value`
#                      documentation of WHY the assertion matters, quoting the component source.
#   PLACEHOLDER        `Status (n)` · `X of Y` · `Mark as ...`
#                      a shape with a variable in it; the code necessarily matches it by regex.
_SRC_HINT = ("{", "}", "=>", "===", "!==", ".length", "#", "&&", "||", "<", ">")


def _looks_like_source_ref(t):
    if any(h in t for h in _SRC_HINT):
        return True
    # a bare CamelCase or camelCase identifier - a component or prop name, not page text
    return bool(re.fullmatch(r"[A-Za-z_$][A-Za-z0-9_$]*", t) and not t.islower() or
                re.fullmatch(r"[a-z]+[A-Z][A-Za-z0-9]*", t))


def _has_placeholder(t):
    # `(n)`, `X of Y`, a lone capital standing for a value, or an elision
    return bool(re.search(r"\(\s*[a-z]\s*\)|\b[A-Z]\b|\.\.\.|…", t))


def _squash(x):
    """Normalise so a REGEX in the code still matches the literal in the name.

    `Within\\s+25\\s*mi` and `Within 25 mi` must compare equal, so regex quantifiers and
    escapes are removed before the alphanumeric squash.
    """
    x = re.sub(r"\\[sdwSDW][*+?]?", "", x)     # \s+ \d+ \w* ...
    x = re.sub(r"[\\.*+?^$|]", "", x)          # escapes and metacharacters
    return re.sub(r"[^a-z0-9]", "", x.lower())


def quoted_terms(name):
    """Distinctive things a step NAME claims to be about - quoted strings and `code` spans."""
    out = []
    for pat in (r'"([^"]{3,40})"', r'`([^`]{3,40})`', r"'([^']{3,40})'"):
        out += re.findall(pat, name)
    return [t for t in out
            if not re.fullmatch(r'[<>=!.\d\s]+', t)
            and not _looks_like_source_ref(t)
            and not _has_placeholder(t)]


def audit_step(test_name, i, s, all_code, prev_type=None):
    hits = []
    name = s.get("name", "")
    typ = s.get("type", "")
    p = s.get("params", {}) or {}
    code = p.get("code", "") if typ == "assertFromJavascript" else ""
    optional = s.get("allowFailure") and not s.get("isCritical")
    is_diag = name.strip().upper().startswith("DIAG")
    claims = any(c in name.upper() or c in name for c in CLAIMS)
    is_action = any(name.lower().startswith(a) or f" {a}" in name.lower()[:28] for a in ACTIONS)

    # --- a DIAG step that can FAIL A RUN -------------------------------------------------
    if is_diag and not optional:
        hits.append(("HIGH", "CRITICAL-DIAG",
                     "a DIAG step is CRITICAL — diagnostics must never be able to fail a run"))

    if code and not is_diag:
        flat = re.sub(r"\s+", " ", code)

        # --- TAUTOLOGY -------------------------------------------------------------------
        if re.search(r"\|\|\s*(true|1)\b", flat):
            hits.append(("HIGH", "TAUTOLOGY",
                         "`|| true` — this assertion cannot fail (MOB.346's shape)"))
        # a bare `return true;` as the ONLY return, in something that claims to prove a fact
        returns = re.findall(r"return\s+([^;]+);", flat)
        if returns and all(r.strip() in ("true", "!0") for r in returns):
            if claims and not is_action:
                hits.append(("HIGH", "TAUTOLOGY",
                             "only ever returns true, but the name claims to prove something"))
            elif not is_action:
                hits.append(("LOW", "TAUTOLOGY",
                             "only ever returns true (fine for an action step — check the name)"))

        # --- GENERIC-COUNT ---------------------------------------------------------------
        for m in re.finditer(r"querySelectorAll\(\s*['\"]([^'\"]+)['\"]\s*\)"
                             r"[^;]*?\.length\s*(>=|>)\s*(\d+)", flat):
            sel, _, n = m.group(1), m.group(2), m.group(3)
            parts = [x.strip() for x in sel.split(",")]
            if all(x in GENERIC for x in parts):
                hits.append(("HIGH", "GENERIC-COUNT",
                             f"counts `{sel}` >= {n} — satisfied by page chrome (MOB.348's shape)"))

        # --- NAME-MISMATCH ---------------------------------------------------------------
        terms = quoted_terms(name)
        if terms:
            csq = _squash(code)
            missing = [t for t in terms if t not in code and _squash(t) not in csq]
            if missing and len(missing) == len(terms):
                hits.append(("MED", "NAME-MISMATCH",
                             f"name is about {missing!r} — none of it appears in the code"))

        # --- VACUOUS-ABSENCE -------------------------------------------------------------
        if re.fullmatch(r"\s*return\s*!\s*[^;]+;\s*", code) and claims is False:
            hits.append(("LOW", "VACUOUS-ABSENCE",
                         "asserts only an ABSENCE — true on a blank page or a login redirect too"))

    # --- assertPageLacks with nothing positive anywhere in the test ----------------------
    if typ == "assertPageLacks":
        val = str(p.get("value", ""))
        if val and val not in all_code:
            hits.append(("LOW", "VACUOUS-ABSENCE",
                         f"`{val[:40]}` is never asserted PRESENT anywhere in this test — "
                         "the lacks-check may be vacuous"))

    # --- LOADBEARING-OPT ------------------------------------------------------------------
    # A DIAG probe is optional BY DESIGN - every one of its steps is, so that a single run can
    # report them all (the MOB.978 convention). `⭐` there marks "this is the decisive probe",
    # not "this is a load-bearing guarantee". Flagging them buried the two REAL hits (MOB.346)
    # under 16 false ones.
    if optional and claims and "_DIAG_" not in test_name:
        hits.append(("MED", "LOADBEARING-OPT",
                     "marked optional (amber) but the name claims a fact — it cannot fail a run"))

    # --- NO-TIMEOUT -----------------------------------------------------------------------
    # ⚠️ ONLY flagged when the step is NOT preceded by an explicit `wait`. An untimed assertion
    # straight after a sleep is the suite's normal idiom and is usually fine; an untimed assertion
    # straight after a CLICK or a NAVIGATION races the render, which is the trap-21 case worth
    # acting on. Without this narrowing the check reported 225 hits - too many to triage, which
    # in practice means none of them get looked at.
    # (removed: an untimed step polls to Datadog's 60s default - see the docstring)

    return [(sev, kind, f"{test_name} step {i} [{typ}]", name, msg) for sev, kind, msg in hits]


def main():
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    as_json = "--json" in sys.argv
    findings = []
    for f in sorted(glob.glob(os.path.join(TESTS, "*.json"))):
        base = os.path.basename(f)[:-5]
        if only and not any(o in base for o in only):
            continue
        if "Suite" in base:
            continue
        d = json.load(open(f))["details"]
        all_code = " ".join(json.dumps(s) for s in d["steps"])
        for i, s in enumerate(d["steps"]):
            findings += audit_step(base, i, s, all_code,
                                   d['steps'][i-1]['type'] if i else None)

    if as_json:
        print(json.dumps([{"sev": a, "kind": b, "where": c, "name": d, "msg": e}
                          for a, b, c, d, e in findings], indent=1))
        return 1 if any(f[0] == "HIGH" for f in findings) else 0

    order = {"HIGH": 0, "MED": 1, "LOW": 2}
    findings.sort(key=lambda x: (order[x[0]], x[1], x[2]))
    by_sev = {}
    for sev, kind, where, name, msg in findings:
        by_sev.setdefault(sev, []).append((kind, where, name, msg))

    for sev in ("HIGH", "MED", "LOW"):
        rows = by_sev.get(sev, [])
        if not rows:
            continue
        print(f"\n{'='*94}\n{sev}  ({len(rows)})\n{'='*94}")
        for kind, where, name, msg in rows:
            print(f"[{kind}] {where}")
            print(f"    name: {name[:104]}")
            print(f"    why : {msg}")
    n_high = len(by_sev.get("HIGH", []))
    print(f"\n{'-'*94}")
    print(f"{len(findings)} suspect(s): {n_high} HIGH · {len(by_sev.get('MED',[]))} MED · "
          f"{len(by_sev.get('LOW',[]))} LOW")
    print("HEURISTIC — every hit needs a human read. An action step may legitimately return")
    print("true, and an absence assertion is fine when something nearby proves the positive.")
    return 1 if n_high else 0


if __name__ == "__main__":
    sys.exit(main())
