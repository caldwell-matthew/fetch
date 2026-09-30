"""The Playwright coverage report — one self-contained HTML page: what passed, failed or is pinned, and what is not covered.

Built from what already exists, nothing re-derived:
  results   Playwright's JSON reporter — `e2e/results/results.json` for a plain `npx playwright test` (playwright.config.ts),
            or every suite's `results.json` in a pass's evidence folder (`tools/playwright_pass.py` writes them);
  gaps      docs/testing_checklist.md — each section's `[x]` / `[~]` / `[ ]` / `[-]` rows, and ▶ OPEN WORK's rows;
  bugs      docs/bugs_found.md's index — the pinned ones matched to the test that pins them;
  code      docs/source_coverage.md's area table (tools/source_coverage.py).
Reads only; writes the page. The same page serves a local run and a CI artifact.

USAGE
    .venv/bin/python e2e/mobile/tools/coverage_report.py                 # after `npx playwright test …`
    .venv/bin/python e2e/mobile/tools/coverage_report.py --pass <evidence folder> [--pass <another>] [--out <file>]
    add --open to open it in the browser (macOS)
"""
import argparse
import datetime
import glob
import html
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
MOBILE = os.path.dirname(HERE)
E2E = os.path.dirname(MOBILE)
DOCS = os.path.join(MOBILE, "docs")
ANSI = re.compile(r"\x1b\[[0-9;]*m")
esc = html.escape


# --- results ---------------------------------------------------------------------------------------------------
def load_results(paths):
    """Every test in these Playwright JSON reports: (suite file, test title, status, seconds, pin, error, attachments)."""
    tests, stats = [], {"duration": 0.0, "startTime": None}
    for path in paths:
        data = json.load(open(path))
        st = data.get("stats", {})
        stats["duration"] += (st.get("duration") or 0) / 1000
        stats["startTime"] = stats["startTime"] or st.get("startTime")

        def walk(suite, file):
            file = suite.get("file") or file
            for spec in suite.get("specs", []):
                for t in spec.get("tests", []):
                    last = (t.get("results") or [{}])[-1]
                    pin = next((a.get("description", "") for a in t.get("annotations", []) if a.get("type") == "fail"), "")
                    if t.get("status") == "skipped":
                        status = "skipped"
                    elif t.get("status") == "flaky":
                        status = "flaky"
                    elif t.get("status") == "expected":
                        status = "pinned" if t.get("expectedStatus") == "failed" else "passed"
                    else:
                        status = "failed"
                    err = ANSI.sub("", ((last.get("error") or {}).get("message") or "")).strip()
                    atts = [(a.get("name"), a.get("path")) for a in last.get("attachments", []) if a.get("path")]
                    tests.append((os.path.basename(file or "?"), spec.get("title", "?"), status,
                                  (last.get("duration") or 0) / 1000, pin, err, atts))
            for child in suite.get("suites", []):
                walk(child, file)

        for s in data.get("suites", []):
            walk(s, s.get("file"))
    return tests, stats


# --- the docs --------------------------------------------------------------------------------------------------
def checklist():
    ck = open(os.path.join(DOCS, "testing_checklist.md"), encoding="utf-8").read()
    sections, gaps = [], []
    for part in re.split(r"^## ", ck, flags=re.M)[1:]:
        head, _, body = part.partition("\n")
        boxes = {k: len(re.findall(rf"^- \[{re.escape(k)}\]", body, re.M)) for k in ("x", "~", " ", "-")}
        if sum(boxes.values()) == 0:
            continue
        name = head.strip().replace("`", "")
        sections.append((name, boxes))
        for m in re.finditer(r"^- \[(~| )\] (.+)$", body, re.M):
            gaps.append((name, "partial" if m.group(1) == "~" else "not yet", m.group(2)))
    open_work = re.search(r"^## ▶ OPEN WORK.*?(?=^## )", ck, re.M | re.S)
    for m in re.finditer(r"^\| \*\*(\d+)\*\* \| (.+?) \| ([^|]+) \|$", open_work.group(0) if open_work else "", re.M):
        gaps.append((f"OPEN WORK #{m.group(1)}", m.group(3).strip(), m.group(2)))
    return sections, gaps


def bugs():
    text = open(os.path.join(DOCS, "bugs_found.md"), encoding="utf-8").read()
    rows = []
    for m in re.finditer(r"^\| (\d+) \| (.+?) \| (.+?) \| (.+?) \|$", text, re.M):
        rows.append((int(m.group(1)), m.group(2), m.group(4)))
    return rows


def source_areas():
    text = open(os.path.join(DOCS, "source_coverage.md"), encoding="utf-8").read()
    head = re.search(r"\*\*(\d+) of (\d+) files with something to name are touched \((\d+)%\)\.\*\*", text)
    rows = re.findall(r"^\| (\w[\w.]*) \| (\d+) \| (\d+) \| (\d+) \| (\d+) \| (\d+) \| (\d+%|—) \|$", text, re.M)
    return head.groups() if head else None, rows


# --- the page --------------------------------------------------------------------------------------------------
def md_inline(text):
    """The docs' inline markdown, enough for the page: code, bold, italics."""
    t = esc(text)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    return re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", t)


def clip(text, n=320):
    """A doc row cut to about n characters at a word, with any bold it opened closed again."""
    if len(text) <= n:
        return text
    cut = text[:n].rsplit(" ", 1)[0].rstrip(" ·—,;:")
    return cut + ("**" if cut.count("**") % 2 else "") + " …"


def bar(parts):
    total = sum(n for n, _c in parts) or 1
    return '<div class="bar">' + "".join(f'<span class="{c}" style="width:{100 * n / total:.2f}%"></span>' for n, c in parts if n) + "</div>"


def page(tests, stats, sources, out):
    sections, gaps = checklist()
    bug_rows = bugs()
    src_head, src_rows = source_areas()
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    count = {k: sum(1 for t in tests if t[2] == k) for k in ("passed", "failed", "pinned", "flaky", "skipped")}
    boxes = {k: sum(b[k] for _n, b in sections) for k in ("x", "~", " ", "-")}
    rel = lambda p: os.path.relpath(p, os.path.dirname(out)) if p else ""

    h = [f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mobile Test Coverage</title><style>
:root {{ --bg:#f7f7f5; --card:#fff; --ink:#1d1d1b; --mute:#6b6b66; --line:#e3e2dc;
  --pass:#2f8f4e; --fail:#c7372f; --pin:#b7791f; --skip:#8a8a84; --part:#d69e2e; --none:#c7372f; --na:#b9b8b1; }}
@media (prefers-color-scheme: dark) {{ :root {{ --bg:#141413; --card:#1e1e1c; --ink:#ecebe6; --mute:#a3a29b; --line:#33332f;
  --pass:#4fbf73; --fail:#ef6a61; --pin:#e0a84a; --skip:#8f8e88; --part:#e7b54e; --none:#ef6a61; --na:#5b5a55; }} }}
* {{ box-sizing:border-box }} body {{ margin:0; background:var(--bg); color:var(--ink); font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif }}
main {{ max-width:1100px; margin:0 auto; padding:24px 16px 64px }} h1 {{ font-size:26px; margin:0 0 4px }} h2 {{ font-size:19px; margin:36px 0 12px }}
.sub {{ color:var(--mute); margin:0 0 20px }} .cards {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px }}
.card {{ background:var(--card); border:1px solid var(--line); border-radius:10px; padding:14px 16px }}
.card .n {{ font-size:28px; font-weight:650 }} .card .l {{ color:var(--mute); font-size:13px }}
.pass {{ background:var(--pass) }} .fail {{ background:var(--fail) }} .pin {{ background:var(--pin) }} .skip {{ background:var(--skip) }}
.part {{ background:var(--part) }} .none {{ background:var(--none) }} .na {{ background:var(--na) }}
.t-pass {{ color:var(--pass) }} .t-fail {{ color:var(--fail) }} .t-pin {{ color:var(--pin) }} .t-skip {{ color:var(--skip) }}
.bar {{ display:flex; height:10px; border-radius:5px; overflow:hidden; background:var(--line); min-width:120px }} .bar span {{ display:block }}
table {{ width:100%; border-collapse:collapse; background:var(--card); border:1px solid var(--line); border-radius:10px; overflow:hidden }}
th,td {{ text-align:left; padding:8px 10px; border-bottom:1px solid var(--line); vertical-align:top }} th {{ font-size:13px; color:var(--mute); font-weight:600 }}
tr:last-child td {{ border-bottom:0 }} td.num {{ text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap }}
.chip {{ display:inline-block; font-size:12px; font-weight:600; color:#fff; border-radius:999px; padding:1px 9px; white-space:nowrap }}
details {{ background:var(--card); border:1px solid var(--line); border-radius:10px; margin:8px 0 }} details > summary {{ cursor:pointer; padding:10px 14px; font-weight:600 }}
details table {{ border:0; border-top:1px solid var(--line); border-radius:0 }} code {{ font-size:13px; background:var(--line); border-radius:4px; padding:0 4px }}
pre {{ white-space:pre-wrap; font-size:12px; color:var(--mute); margin:6px 0 0; max-height:160px; overflow:auto }}
.legend {{ display:flex; gap:14px; flex-wrap:wrap; color:var(--mute); font-size:13px; margin:8px 0 }} .legend i {{ display:inline-block; width:10px; height:10px; border-radius:2px; margin-right:5px }}
a {{ color:inherit }} .scroll {{ overflow-x:auto }}
</style></head><body><main>
<h1>Mobile Test Coverage</h1>
<p class="sub">Generated {now} · results from {esc(sources)}</p>"""]

    # Results
    if tests:
        h.append(f"""<div class="cards">
<div class="card"><div class="n t-pass">{count['passed']}</div><div class="l">passed</div></div>
<div class="card"><div class="n t-fail">{count['failed'] + count['flaky']}</div><div class="l">failed{f" ({count['flaky']} flaky)" if count['flaky'] else ""}</div></div>
<div class="card"><div class="n t-pin">{count['pinned']}</div><div class="l">pinned bugs (failing as expected)</div></div>
<div class="card"><div class="n t-skip">{count['skipped']}</div><div class="l">skipped / did not run</div></div>
<div class="card"><div class="n">{round(stats['duration'] / 60)}m</div><div class="l">test time</div></div></div>
{bar([(count['passed'], 'pass'), (count['failed'] + count['flaky'], 'fail'), (count['pinned'], 'pin'), (count['skipped'], 'skip')])}""")
        h.append("<h2>Results by suite</h2>")
        by_suite = {}
        for t in tests:
            by_suite.setdefault(t[0], []).append(t)
        for suite, ts in sorted(by_suite.items(), key=lambda kv: (not any(t[2] in ("failed", "flaky") for t in kv[1]), kv[0])):
            c = {k: sum(1 for t in ts if t[2] == k) for k in ("passed", "failed", "flaky", "pinned", "skipped")}
            red = c["failed"] + c["flaky"]
            label = re.sub(r"\.spec\.ts$", "", suite)
            h.append(f"<details{' open' if red else ''}><summary>{'🔴' if red else '🟢'} {esc(label)} — "
                     f"{c['passed']} passed" + (f", {red} failed" if red else "") + (f", {c['pinned']} pinned" if c['pinned'] else "")
                     + (f", {c['skipped']} skipped" if c['skipped'] else "") + "</summary><div class='scroll'><table>"
                     "<tr><th>Test</th><th>Result</th><th class='num'>Time</th><th>Evidence</th></tr>")
            for _s, title, status, secs, pin, err, atts in ts:
                chip = {"passed": "pass", "failed": "fail", "flaky": "fail", "pinned": "pin", "skipped": "skip"}[status]
                links = " · ".join(f'<a href="{esc(rel(p))}">{esc(n)}</a>' for n, p in atts)
                detail = f"<pre>{esc(pin)}</pre>" if status == "pinned" and pin else (f"<pre>{esc(err[:600])}</pre>" if status in ("failed", "flaky") and err else "")
                h.append(f"<tr><td>{esc(title)}{detail}</td><td><span class='chip {chip}'>{status}</span></td>"
                         f"<td class='num'>{secs:.1f}s</td><td>{links or '—'}</td></tr>")
            h.append("</table></div></details>")
    else:
        h.append("<p class='sub'>No results file — run a suite (or a pass) first. The coverage below is from the docs.</p>")

    # Checklist coverage
    total = sum(boxes.values())
    h.append(f"""<h2>Behaviours covered — the testing checklist</h2>
<div class="cards"><div class="card"><div class="n t-pass">{boxes['x']}</div><div class="l">automated</div></div>
<div class="card"><div class="n t-pin">{boxes['~']}</div><div class="l">partial</div></div>
<div class="card"><div class="n t-fail">{boxes[' ']}</div><div class="l">not yet</div></div>
<div class="card"><div class="n t-skip">{boxes['-']}</div><div class="l">not automatable (native shell, dead code…)</div></div>
<div class="card"><div class="n">{round(100 * boxes['x'] / max(1, total - boxes['-']))}%</div><div class="l">of automatable rows</div></div></div>
<div class="legend"><span><i class="pass"></i>automated</span><span><i class="part"></i>partial</span><span><i class="none"></i>not yet</span><span><i class="na"></i>not automatable</span></div>
<div class="scroll"><table><tr><th>Section</th><th class="num">Automated</th><th class="num">Partial</th><th class="num">Not yet</th><th class="num">N/A</th><th style="width:30%"></th></tr>""")
    for name, b in sections:
        h.append(f"<tr><td>{md_inline(name)}</td><td class='num'>{b['x']}</td><td class='num'>{b['~'] or ''}</td><td class='num'>{b[' '] or ''}</td>"
                 f"<td class='num'>{b['-'] or ''}</td><td>{bar([(b['x'], 'pass'), (b['~'], 'part'), (b[' '], 'none'), (b['-'], 'na')])}</td></tr>")
    h.append("</table></div>")

    # Gaps
    h.append(f"<h2>Gaps — what is not covered ({len(gaps)})</h2><div class='scroll'><table><tr><th>Where</th><th>State</th><th>What</th></tr>")
    for where, state, what in gaps:
        h.append(f"<tr><td>{md_inline(where)}</td><td>{esc(state)}</td><td>{md_inline(clip(what))}</td></tr>")
    h.append("</table></div>")

    # Bugs
    pinned_by = {}
    for t in tests:
        for n in sorted({int(x) for x in re.findall(r"§(\d+)", t[4])}):   # a message may name its § twice
            pinned_by.setdefault(n, []).append((t[1].split("_")[0], t[2]))
    h.append(f"<h2>Open bugs ({len(bug_rows)})</h2><div class='scroll'><table><tr><th>§</th><th>Finding</th><th>Status</th><th>This run</th></tr>")
    for n, finding, status in bug_rows:
        seen = pinned_by.get(n, [])
        run = ", ".join(f"{tid} {'reproduced' if st == 'pinned' else st}" for tid, st in seen) or "—"
        h.append(f"<tr><td>{n}</td><td>{md_inline(finding)}</td><td>{md_inline(status)}</td><td>{esc(run)}</td></tr>")
    h.append("</table></div>")

    # Source coverage
    if src_head:
        touched, of, pct = src_head
        h.append(f"""<h2>App code reached — {touched} of {of} screen files ({pct}%)</h2>
<p class="sub">A file counts when a test names something it renders; this is not line coverage (dev serves no source maps).</p>
<div class="scroll"><table><tr><th>Area</th><th class="num">Files</th><th class="num">Reached</th><th class="num">Not reached</th><th class="num">Nothing to name</th><th class="num">Unused</th><th style="width:30%"></th></tr>""")
        for area, files, ok, miss, blank, dead, _pct in src_rows:
            h.append(f"<tr><td>{esc(area)}</td><td class='num'>{files}</td><td class='num'>{ok}</td><td class='num'>{int(miss) or ''}</td>"
                     f"<td class='num'>{int(blank) or ''}</td><td class='num'>{int(dead) or ''}</td>"
                     f"<td>{bar([(int(ok), 'pass'), (int(miss), 'none'), (int(blank) + int(dead), 'na')])}</td></tr>")
        h.append("</table></div>")
    h.append("</main></body></html>")
    return "\n".join(h)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--pass", dest="pass_dirs", action="append",
                    help="a pass's evidence folder (every suite's results.json in it); repeat it to combine a pass run in parts")
    ap.add_argument("--results", help="one Playwright JSON results file (default: e2e/results/results.json)")
    ap.add_argument("--out", help="the page to write (default: e2e/results/coverage/index.html)")
    ap.add_argument("--open", action="store_true", help="open the page when written (macOS)")
    a = ap.parse_args()
    if a.pass_dirs:
        paths = sorted(p for d in a.pass_dirs for p in glob.glob(os.path.join(d, "*", "results.json")))
        sources = ", ".join(os.path.relpath(d, os.path.dirname(E2E)) for d in a.pass_dirs)
    else:
        one = a.results or os.path.join(E2E, "results", "results.json")
        paths = [one] if os.path.exists(one) else []
        sources = os.path.relpath(one, os.path.dirname(E2E)) if paths else "no run"
    tests, stats = load_results(paths)
    out = os.path.abspath(a.out or os.path.join(E2E, "results", "coverage", "index.html"))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w", encoding="utf-8").write(page(tests, stats, sources, out))
    red = sum(1 for t in tests if t[2] in ("failed", "flaky"))
    print(f"coverage report: {os.path.relpath(out, os.path.dirname(E2E))} — {len(tests)} test(s), {red} failed")
    if a.open and sys.platform == "darwin":
        subprocess.run(["open", out])
    return 0


if __name__ == "__main__":
    sys.exit(main())
