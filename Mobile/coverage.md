# MentorTwo Mobile — what the Datadog tests actually cover

*Companion to `testing_checklist.md`. **This file answers one question: what does a green run
PROVE?** It does not track what is left to do, what has run lately, or how a test was debugged —
those are the checklist, its 📊 RUN STATUS table, and the generator docstrings respectively.*

**102 leaf tests · 13 suites · 2685 steps · 92 subtest slots.** 9 of the 102 are standalone.
Every number is derived from the test JSON, not from the plan.

> 🛑 **These numbers describe COVERAGE, not freshness.** Only some suites have run against the
> current build — **`testing_checklist.md` → 📊 RUN STATUS is the authority on which.** Check it
> before quoting anything here.

## 🛑 Read this before quoting a coverage number

**"Covered" here means a browser test drives the surface and asserts something about it. It does
not mean the surface is safe.** Four things separate the two, and all four are live:

1. **Runs are manual.** This is regression *capability*, not regression *detection*. Nothing runs
   on a schedule, so a break is found when someone chooses to look. *(Settled decision.)*
2. **A green test is not necessarily a meaningful one.** Four have now been caught proving
   nothing — `MOB.340` passed for weeks against an empty list, `MOB.348` counted buttons that
   never included its own control, `MOB.346` had a `|| true`, and `MOB.358` flipped a checkbox
   **by position** while claiming to flip a named one. Three were found by hand; the fourth by
   `audit_assertions.py`, which now encodes all of them.
3. **Fixture monoculture.** A handful of work orders, two known assets, one storeroom item. Most
   tests only ever see one shape of data.
4. **Mostly happy paths.** Genuine negative cases live in `MOB.343`, `MOB.356`, `MOB.530`,
   `MOB.720`, `MOB.347`, `MOB.741` and the search sweep. Elsewhere, a pass means the intended
   path works — not that the wrong input is rejected.

### The three numbers

| question | |
|---|---|
| Of what Datadog **can** reach in a browser | **~78%** |
| Of the mobile app **as a whole** | **~58%** |
| Of "would **catch a regression** before a user hits it" | **~37%** |

⚠️ **Estimates, derived from the app — not from counting rows in the plan.** Counting ticked rows
gives ~68% and is wrong, because a document cannot see what nobody thought to list.

---

## How to tell a strong test here from a weak one

Written down because it is the difference between the first number and the third.

| shape | strength | example |
|---|---|---|
| **Biconditional** — the same fact read in two states, required to *disagree* | ⭐ strongest | `MOB.622` reads indicators at one photo and at two; `MOB.741` pairs an absence with two positive controls |
| **Read-back proof** — assert the RECORD, not the form | ⭐ strong | `MOB.600` re-reads its own asset out of the collected list; `MOB.550` reads a previous run's value off a cold cache |
| **Exclusive-or** — either branch is a pass, but *neither* is a fail | solid | `MOB.720`, `MOB.399` — cannot go vacuous when the fixture is empty |
| **Positive presence with a polling gate** | ordinary | most `assertElementPresent` |
| **Absence only** (`assertPageLacks`, `return !x`) | ⚠️ weak alone | true on a blank page, a crash, and a login redirect alike — needs a positive control nearby |
| **Count over a generic selector** (`button >= 2`) | 🛑 distrust | this is `MOB.348`'s defect; `audit_assertions.py` flags it HIGH |

---

## Coverage by suite

*Order within a suite is often load-bearing — see `testing_checklist.md`. Step counts are from
the JSON.*

### `MOB.990_Smoke` — 13 children · read-only
**Establishes: the app boots, every route resolves, and the shell renders for an `Admin` session.**

Eight route checks (`MOB.100`–`170`, 2–3 steps each) plus the substantive ones: `MOB.121` map
controls (zoom/style/3D/layers), `MOB.180` Home tiles and navigation, `MOB.171` Dev Logs
contents, `MOB.910` the offline UI, and `MOB.900` — a *regression guard* that the offline notice
must **not** appear during a normal run.

🛑 **`MOB.346` (Scheduled view) is NO LONGER a child** — the crew's `mobileDownloadMode` is
`ASSIGNED`, so the scheduled view is unreachable and it cannot pass. It stays a standalone test.
**So this suite no longer establishes anything about the scheduled view**, which was previously
the default work-list rendering. See 🟡 BLOCKED in `testing_checklist.md`.

🛑 **The route checks are shallow by design.** A pass means the route resolved and the page
titled itself. It does **not** mean the screen's data loaded — that is what the area suites are
for. This is the distinction `MOB.340` failed to make.

### `MOB.991_WorkOrders` — 13 children · **leaves residue** · at the runtime ceiling
**Establishes: the core work-order lifecycle — create, read, status, tabs, and all four charge
types.**

`MOB.300` create · `MOB.310` read · `MOB.320` walks **six of the eight assignable statuses**
(`Requested` and `Not Completed` are offered by the menu and never clicked) and ends on Ready ·
`MOB.330` tabs · `MOB.340` list search/sort · `MOB.350`/`360`/`370`/`380` equipment, labor,
material and other charges · `MOB.390` condition · `MOB.391` failure · `MOB.392` note ·
`MOB.393` the add-form picker.

🛑 **The four charge tests see the `CHARGES` half of their tabs and nothing else (09-08).** Each
tab is a `SegmentedControl data={['CHARGES','ESTIMATES']}`; the `ESTIMATES` side renders a
different list from a different field, and material estimates are additionally grouped by
storeroom. `MOB.356` inherits the same blind spot. **No test in the suite has ever named it** —
it is the single largest gap the string sweep found. 🟢 BUILDABLE #5.

⚠️ **This suite is at Datadog's execution-time ceiling** (Appendix F0 — it died at 1071s once).
New work-order coverage goes in `MOB.985`/`MOB.986` instead, which is why those exist.

### `MOB.985_WorkDetail` — 8 children · read-only
**Establishes: the work-order detail screen's secondary controls, and the negative cases.**

`MOB.347` the Assets tab and its status controls (🛑 `Mark as …` asserted, never clicked — it
writes instantly) · `MOB.348` the globe menu and LocationForm · `MOB.349` record cycling ·
`MOB.355` form render · `MOB.357` `FormMetrics` · **`MOB.356` trap 8 across all four charge
forms** — the negative case the four charge tests cannot express · `MOB.911` the offline
geolocate branch · `MOB.358` the asset location form.

⭐ `MOB.356` is the strongest test here: it proves an **invalid form does not submit**, on four
forms, which is the failure mode `MOB.350`–`380` are structurally blind to.

### `MOB.986_WorkOrders_Extra` — 11 children · **leaves residue**
**Establishes: the remaining work-order entry points and the work LIST's behaviour.**

`MOB.396` create from a job asset · `MOB.397` assign follow-up · `MOB.398` the crew-assignment
modal · `MOB.394` permits · `MOB.399` warranties · `MOB.122` **create from the map** (the last
uncovered create entry point) · and the list group: `MOB.341` map toggle, `MOB.343` search
actually filters, `MOB.344` row navigation, `MOB.342` the status ring and clickable legend,
`MOB.345` sort applied + persisted + **really reorders**.

### `MOB.993_AssetVerify` — 12 children · self-restoring
**Establishes: the verification workflow, including the one that puts itself back.**

⭐ `MOB.510` verifies an asset, proves it **moved tabs**, then un-verifies it — a full
round-trip. `MOB.590` proves the same crossing from the other side. `MOB.500` job read ·
`MOB.520` all five data tabs · `MOB.560` counts, badges and ring labels · `MOB.580` sort really
reorders · `MOB.570` asset cycling with wrap-around · `MOB.575` the Failures/Condition forms ·
`MOB.585` map toggle · `MOB.531` in-job asset search · plus `MOB.131`/`MOB.132`, the
Transaction Log, wired here because they need a **mutation to have just happened**.

🛑 **What this suite cannot do**: the job's own status. Verifying the last asset flips it to
`COMPLETED` and **mobile can never walk that back** — the open owner decision.

### `MOB.994_Collector` — 5 children · **leaves residue (`MOB.600` only)**
**Establishes: asset collection, and the whole photo/attachment surface.**

🛑 **CORRECTED 09-08: this is the whole attachment INPUT surface, not the whole attachment
surface.** Everything below is *getting a file in*. Nothing here — or anywhere — opens the gear
menu on a **saved** photo, so `Set as Avatar`, `Rotate Image` and `Get Description` are
unexercised on all three parent types. `MOB.622` proves the gear renders and stops.
🟢 `testing_checklist.md` BUILDABLE #6; `Rotate Image` is the strongest test available there,
because it is a real mutation with a read-back proof that self-restores every four clicks.

⭐ **This is where the attachment work landed.** `MOB.620` the picker (🛑 the three capture
buttons asserted, never clicked — each opens a native dialog Datadog cannot dismiss) ·
`MOB.621` a photo really reaches the carousel, then is discarded unsent · `MOB.622` the
carousel's display surface read at one photo **and** at two · `MOB.600` create an asset **with a
real photo attached**, proven by read-back · `MOB.610` collector search.

⚠️ **`MOB.622` is built, wired and jsdom-validated (41 cases, both directions) but its run is
NOT yet confirmed green.** It is excluded from the coverage numbers above.

### `MOB.995_AssetLookup` — 7 children · read-only
**Establishes: asset lookup, ~~its six detail tabs~~ three of its six detail tabs, and the work
panel behind them.**

`MOB.700` search and open · `MOB.720` the Readings tab · `MOB.740` **`WorkLookupDetails`**, the
four-tab work panel — ⭐ which is *also* the map's `WorkCard`, so one test covers two screens ·
`MOB.741` the work-stage attachment panel and its image filter · `MOB.735` `View in Map`, the
only navigation in mobile carrying **router state** rather than a URL · `MOB.730`/`MOB.731`
"Near Me" proximity and its radius.

🛑 **"Six detail tabs" overstates it.** The strip has six —
`General Info · Attributes · Photos · Docs · Work History · Readings` — and `MOB.720` correctly
pins the **count** at 6, but only three are ever *opened*: `General Info` (`MOB.710`),
`Work History` (`MOB.740`/`741`) and `Readings` (`MOB.720`). **`Photos`, `Docs` and `Attributes`
are opened by no test on any of the eight `AssetLookupDetails` call sites.** `MOB.700`'s message
claims `MOB.520` covers them; `MOB.520` walks the same component on the **AV job accordion** and
stops at `Work History`. 🟢 BUILDABLE #7 — three clicks on a panel `MOB.700` already has open.

### `MOB.996_Search` — 7 children · read-only
**Establishes: search, filtering and sorting across three screens.**

`MOB.800` builds a structured filter and proves it filters · `MOB.805` the **edit** branch ·
`MOB.806` the **multi-value** branch · `MOB.810` sort persistence · ⭐ `MOB.820` answers a
specific question (does submitting the search box silently discard an active filter?) ·
`MOB.530` search/filter/sort on the job list · `MOB.535` the list really comes out in order.

⚠️ **`MOB.806` covers 1 of `MultiValueSelector`'s 3 branches.** The `enum` and `record` branches
are unreached — gated on the `MOB.976` probe, which has **not yet produced a result**.

### The smaller suites

| suite | children | establishes |
|---|---|---|
| `MOB.992_Menu` | 7 | hamburger menu, resync, back arrow, header status icons, crew modal dismissal |
| `MOB.989_FieldEdit` | 3 | the **three** edit surfaces — `MOB.395` WO General Info, `MOB.710` per-field pencil (three entry points at once), `MOB.545` attributes. All prove **persistence**, all self-restore |
| `MOB.998_MaterialLookup` | 3 | storeroom read, ⭐ `MOB.860` cycle count as a `+1`/`-1` pair that self-restores, `MOB.870` stocking (**one-way, drifts**). 🛑 **09-08: the modal grew `Photos` and `Docs` tabs and the list grew a row avatar modal — none covered.** And `MOB.860`'s `+1`/`-1` is "self-restoring" *by construction, not by assertion*: both legs prove only that the modal closed, and neither reads the quantity back |
| `MOB.997_Session` | 2 | ⭐ permission gating of the menu, and crew scoping changing the visible job set. ⚠️ **Never run concurrently** — it mutates the session crew |
| `MOB.987_EventReadings` | 1 | `MOB.550` meter readings — ⭐ the only test proving a write the app itself **fakes** (the UI hand-writes the cache; proof is the next run's cold read) |

### Standalone — in no suite

`MOB.000_Login` and `MOB.440_Logout` establish/end a session and cannot share one.
`MOB.200_Crew_Switch` mutates the session crew. The rest are **diagnostics** —
`MOB.974` geolocation · `MOB.975` offline · `MOB.976` filter field types · `MOB.977` form
fields · `MOB.978` work list · `MOB.979` map. Probes report through `optional` steps so one run
answers many questions; read them with `dd_tools.py report`. **They are meant to be deleted**
once their question is settled.

---

## What is deliberately NOT covered

*Recorded so it stops reading as debt. Full reasoning in `testing_checklist.md`.*

| area | why |
|---|---|
| **The offline transaction queue** | `navigator.onLine` is read directly, so a dispatched event does not change it. 🛑 **Highest-risk surface in the app and untested in BOTH harnesses** (`bugs_found.md` §30) — the cheapest fix is a **Jest** test, not a Synthetics one |
| **Camera capture** | each button opens a **native file dialog** Datadog cannot dismiss; a click risks hanging the run |
| **The `tus` upload transport** | resume-after-interruption and unauthorized-retry need a transfer interrupted mid-flight |
| **The native shell bridge** | only active inside the Expo shell (`window.ReactNativeWebView`) |
| **Real device GPS** · **map canvas drawing** | features are hit-tested via `queryRenderedFeatures` and have no DOM element |
| **Delete controls** | standing rule: prove the control renders, never fire it |
| **Session/JWT expiry** | HTTP GraphQL authenticates with a same-origin cookie; nothing a browser step does can expire it |

⭐ **Attaching a file is no longer on this list** — `MOB.600`/`MOB.621`/`MOB.741` all upload for
real. What remains out is the **camera** and the **tus transport**. Mechanics: trap 12.

---

## Where the next real gain is

Not more tests. In order:

1. **Finish re-pointing the suite at the current build** — 📊 RUN STATUS carries the costed run
   order. Deepening a test that measures a three-week-old app is work done twice.
2. **The AV job reset decision** — one owner call; unlocks five tests and breaks the fixture
   monoculture at its tightest point.
3. **The two gaps that were never listed** — `ESTIMATES` × 4 charge tabs, and `PhotoMenu`'s
   action set. Both read-only or self-restoring, no fixture, on screens tests already reach.
   ⭐ They were missed because the label sweep reads *attributes* and both are JSX text — so fix
   the sweep, not just the gap.
4. **`audit_assertions.py` triage** — makes rows that are already `[x]` mean what they claim,
   which moves the third number in a way new tests do not.
5. **Jest for the offline queue** — 339 lines, highest-risk surface, no Synthetics test will ever
   reach it, and it costs no credits.

*Details for all five: `testing_checklist.md` → ▶ OPEN WORK.*
