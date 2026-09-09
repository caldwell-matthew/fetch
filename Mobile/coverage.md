# MentorTwo Mobile — what the Datadog tests actually cover

*Companion to `testing_checklist.md`. **This file answers one question: what does a green run
PROVE?** It does not track what is left to do, what has run lately, or how a test was debugged —
those are the checklist, its 📊 RUN STATUS table, and the generator docstrings respectively.*

**108 leaf tests · 13 suites · 2899 steps · 97 subtest slots.** 10 of the 108 are standalone.
Every number is derived from the test JSON, not from the plan.

> 🛑 **These numbers describe COVERAGE, not freshness.** Only some suites have run against the
> current build — **`testing_checklist.md` → 📊 RUN STATUS is the authority on which.** Check it
> before quoting anything here.

## 🛑 Read this before quoting a coverage number

**"Covered" here means a browser test drives the surface and asserts something about it. It does
not mean the surface is safe.** Four things separate the two, and all four are live:

1. **Runs are manual.** This is regression *capability*, not regression *detection*. Nothing runs
   on a schedule, so a break is found when someone chooses to look. *(Settled decision.)*
2. **A green test is not necessarily a meaningful one.** Four have been caught proving nothing —
   `MOB.340` against an empty list, `MOB.348` counting buttons that never included its own
   control, `MOB.346` with a `|| true`, `MOB.358` flipping a checkbox by position.
   `audit_assertions.py` now encodes all four shapes.
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
| **Read-back proof** — assert the RECORD, not the form | ⭐ strong | `MOB.623` reads the rotated image's new src; `MOB.550` reads a previous run's value off a cold cache. 🛑 `MOB.600`'s list read-back was NOT one — the row is client-prepended (bugs §34); it now searches a network-only query instead |
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
controls (style toggle, layers panel, zoom — **not** 2D/3D, Home or the map picker), `MOB.180`
Home tiles and navigation, `MOB.171` Dev Logs contents, `MOB.910` the offline UI, and `MOB.900`
— a *regression guard* that the offline notice and the `ErrorBoundary` must **not** appear
during a normal run.

`MOB.346` (Scheduled view) is not a child: the crew's `mobileDownloadMode` is `ASSIGNED`, so the
scheduled view is unreachable. This suite establishes nothing about the scheduled view.

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

The four charge tests and `MOB.356` see the `CHARGES` half of their tabs. `MOB.351` (in
`MOB.985` — see the ceiling note) proves the `ESTIMATES` section *switches* on all four tabs. It
does not read an estimate row: the fixture has none, so the grouped-by-storeroom rendering of
material estimates is still unproven.

⚠️ **This suite is at Datadog's execution-time ceiling** (Appendix F0 — it died at 1071s once).
New work-order coverage goes in `MOB.985`/`MOB.986` instead, which is why those exist.

### `MOB.985_WorkDetail` — 9 children · read-only
**Establishes: the work-order detail screen's secondary controls, and the negative cases.**

`MOB.347` the Assets tab and its status controls (🛑 `Mark as …` asserted, never clicked — it
writes instantly) · `MOB.348` the globe menu and LocationForm · `MOB.349` record cycling ·
`MOB.355` form render · `MOB.357` `FormMetrics` · **`MOB.356` trap 8 across all four charge
forms** — the negative case the four charge tests cannot express · `MOB.351` the `ESTIMATES`
section on all four charge tabs · `MOB.911` the offline geolocate branch · `MOB.358` the asset
location form.

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

### `MOB.994_Collector` — 7 children · **leaves residue (`MOB.600`, `MOB.623`)**
**Establishes: asset collection, the photo/attachment input surface, and the saved-photo menu.**

⭐ `MOB.623` adds a photo to an **existing** collected asset through the panel's `Add Photo`,
waits for the `blob:` preview to become a server URL, then opens the gear on that **saved**
photo: the five-item menu is asserted exactly and in order, and `Rotate Image` is driven four
times with the `<img src>` read back after each (self-restoring at 360°). `Set as Avatar`,
`Get Description` and `Delete Photo` are asserted present, never clicked. It also asserts the
Photos / Docs / Attributes panel **content** on this call site of `AssetLookupDetails`.
⚠️ Proves the rotate round trip, not the pixels — the server swallows a failed `rotate()`.
`MOB.624` (⏳ unverified, unwired) opens the row avatar's fullscreen attachments modal on that
photo: no accordion expansion, Photos↔Docs biconditional, `Done` closes.
Green standalone (58/58); it has not run inside the suite.

`MOB.620` the picker (🛑 the three capture buttons asserted, never clicked — each opens a native
dialog Datadog cannot dismiss) · `MOB.621` a photo really reaches the carousel, then is discarded
unsent · `MOB.622` the carousel's display surface read at one photo **and** at two, plus
fullscreen and the tag editor · `MOB.600` create an asset **with a real photo attached** — 🛑 red: the server never receives
it (bugs §34) · `MOB.610` collector search.

### `MOB.995_AssetLookup` — 7 children · read-only
**Establishes: asset lookup, three of its six detail tabs, and the work panel behind them.**

`MOB.700` search and open · `MOB.720` the Readings tab · `MOB.740` **`WorkLookupDetails`**, the
four-tab work panel — ⭐ which is *also* the map's `WorkCard`, so one test covers two screens ·
`MOB.741` the work-stage attachment panel and its image filter · `MOB.735` `View in Map`, the
only navigation in mobile carrying **router state** rather than a URL · `MOB.730`/`MOB.731`
"Near Me" proximity and its radius.

The strip has six tabs — `General Info · Attributes · Photos · Docs · Work History · Readings` —
and `MOB.720` pins the count at 6. On **this** screen only three panels are asserted:
`General Info` (`MOB.710`), `Work History` (`MOB.740`/`741`) and `Readings` (`MOB.720`).
`Photos`, `Docs` and `Attributes` are opened by `MOB.520` on the AV job accordion (`data-active`
only) and their **content** is asserted by `MOB.623` on the collector call site — the same
`AssetLookupDetails` component, so one call site proves the panels for all eight.

### `MOB.996_Search` — 7 children · read-only
**Establishes: search, filtering and sorting across three screens.**

`MOB.800` builds a structured filter and proves it filters · `MOB.805` the **edit** branch ·
`MOB.806` the **multi-value** branch · `MOB.810` sort persistence · ⭐ `MOB.820` answers a
specific question (does submitting the search box silently discard an active filter?) ·
`MOB.530` search/filter/sort on the job list · `MOB.535` the list really comes out in order.

⚠️ **`MOB.806` covers 1 of `MultiValueSelector`'s 3 branches.** The `enum` branch is reachable
(`MOB.976`: 3 of the first 8 asset-lookup filter fields render a pre-loaded `MultiSelect`) but
the probe reports by index, not label, so no test targets it yet. `record` is undistinguished.
🟢 BUILDABLE #1.

### The smaller suites

| suite | children | establishes |
|---|---|---|
| `MOB.992_Menu` | 7 | hamburger menu, resync, back arrow, header status icons, crew modal dismissal |
| `MOB.989_FieldEdit` | 3 | the **three** edit surfaces — `MOB.395` WO General Info, `MOB.710` per-field pencil (three entry points at once), `MOB.545` attributes. All prove **persistence**, all self-restore |
| `MOB.998_MaterialLookup` | 3 | storeroom read, ⭐ `MOB.860` cycle count as a `+1`/`-1` pair that self-restores, `MOB.870` stocking (**one-way, drifts**). `MOB.865` (green solo, wired) pins the modal's four segments by value, the `Photos`↔`Docs` biconditional, and the row avatar image modal as an exclusive-or. `MOB.855` (green solo, wired) proves column-header sort really reorders and that `N matches` equals the row count. `MOB.860`'s `+1`/`-1` is self-restoring *by construction, not by assertion*: both legs prove only that the modal closed, and neither reads the quantity back |
| `MOB.997_Session` | 2 | ⭐ permission gating of the menu, and crew scoping changing the visible job set. ⚠️ **Never run concurrently** — it mutates the session crew |
| `MOB.987_EventReadings` | 2 | `MOB.550` meter readings — ⭐ the only test proving a write the app itself **fakes** (the UI hand-writes the cache; proof is the next run's cold read). `MOB.551` (⏳ unverified, unwired) opens the reading-history popover on that residue: resolved state as an exclusive-or, timeline↔chart biconditional, offline branch |

### Standalone — in no suite

`MOB.000_Login` and `MOB.440_Logout` establish/end a session and cannot share one.
`MOB.200_Crew_Switch` mutates the session crew. `MOB.346_Work_Scheduled_View` is blocked (see
above). The rest are **diagnostics** —
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

In order:

1. **The AV job reset decision** — one owner call; unlocks five tests and breaks the fixture
   monoculture at its tightest point.
2. **The next buildable items** (`testing_checklist.md` 🟢 #11, #9, #13, #1) — read-only, no
   fixture, on screens tests already reach. The rendered-string sweep finds these; the attribute
   sweep does not.
3. **`audit_assertions.py` triage** — makes rows that are already `[x]` mean what they claim,
   which moves the third number in a way new tests do not.
4. **Jest for the offline queue** — highest-risk surface, no Synthetics test will ever reach it,
   and it costs no credits.

*Details: `testing_checklist.md` → ▶ OPEN WORK.*
