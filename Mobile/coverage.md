# MentorTwo Mobile — what the Datadog tests actually cover

*Answers one question: **what does a green run PROVE?** What is left to do and what has run
lately live in `testing_checklist.md` (its 📊 RUN STATUS is the authority on freshness); why a
test is built as it is lives in its `build_*.py` docstring.*

**122 leaf tests · 16 suites · 3609 steps · 117 subtest slots** — counted from the test JSON.
5 leaves are standalone by design.

## 🛑 Read this before quoting a coverage number

**"Covered" means a browser test drives the surface and asserts something about it — not that
the surface is safe.** Four gaps separate the two:

1. **Runs are manual** — regression *capability*, not detection. *(Settled.)*
2. **A green test is not necessarily a meaningful one.** Five have been caught proving nothing:
   `MOB.340` against an empty list, `MOB.348` counting generic buttons, `MOB.346` with a
   `|| true`, `MOB.358` flipping a checkbox by position, and `MOB.390`/`391` re-submitting a key
   the server refused, green on a closing modal (bugs §40). `audit_assertions.py` encodes the
   first four shapes; the fifth is why optimistic writes are now proved after a reload.
3. **Fixture monoculture** — a handful of work orders, two AV assets, one storeroom item.
4. **Mostly happy paths.** Negative cases live in `MOB.343`, `356`, `389`, `530`, `720`, `347`,
   `741` and the search sweep.

| of … | estimate |
|---|---|
| what Datadog **can** reach in a browser | **~78%** |
| the mobile app as a whole | **~58%** |
| "would **catch a regression** before a user hits it" | **~37%** |

⚠️ Estimates derived from the app, not from counting checklist rows (a document cannot see what
nobody thought to list).

## How to tell a strong test from a weak one

| shape | strength | example |
|---|---|---|
| **Biconditional** — one fact read in two states, required to disagree | ⭐ strongest | `MOB.622` indicators at one photo and at two · `MOB.912` online control → offline screen, same session |
| **Read-back after a reload** — assert the RECORD, not the form | ⭐ strong — *where the write is optimistic* | `MOB.390`/`391` read their key back · charges and `MOB.392` count exactly +1. ⚠️ A reload renders the **persisted Apollo cache**, not the server: sound only for writes made through `optimisticResponse` (never persisted); a write the app makes straight into the cache reads back its own value (`MOB.320`'s status, the post-delete checks — checklist #32). 🛑 a row the client just prepended is NOT one (bugs §34) |
| **A `network-only` read** | ⭐ strongest server proof | `MOB.302` and `MOB.600` read Asset Lookup (`MOBILE_ASSET_LOOKUP` is `network-only`) |
| **Exclusive-or** — either branch passes, neither fails | solid | `MOB.720`, `MOB.399` — cannot go vacuous on an empty fixture |
| **Positive presence with a polling gate** | ordinary | most `assertElementPresent` |
| **Absence only** | ⚠️ weak alone | true on a blank page, a crash and a login redirect alike — needs a positive control |
| **Count over a generic selector** | 🛑 distrust | `MOB.348`'s defect; flagged HIGH by `audit_assertions.py` |
| **"The modal closed"** | depends on the submit path | a server answer only where no `optimisticResponse` precedes it (trap 6) |

---

## Coverage by suite

*Order within a suite is often load-bearing — see the checklist.*

### `MOB.990_Smoke` — 14 children · read-only
**The app boots, every route resolves, and the shell renders for an `Admin` session.**

Eight route checks (`MOB.100`–`170`) plus `MOB.121` map controls (style, layers, zoom — not
2D/3D or Home), `MOB.123` the `Switch Map` picker (a real switch and back, read from
`mobile-map-id`), `MOB.180` Home tiles, `MOB.171` Dev Logs, `MOB.910` the offline UI, and
`MOB.900` — a guard that the offline notice and `ErrorBoundary` do **not** appear on a normal run.
🛑 Route checks are shallow by design: the route resolved and titled itself, not that its data
loaded — the area suites cover that.

### `MOB.991_WorkOrders` — 7 children · leaves residue
**The core work-order lifecycle — create, read, status, tabs, list, note, form picker.**

`MOB.300` create (the create form has no `optimisticResponse`, so its modal closing is a server
answer) · `MOB.310` read · `MOB.320` walks **every assignable status** — Pending, In Progress,
On Hold, Requested, Not Completed, Complete, Canceled — reading the badge exactly, and restores Ready
`always`. ⚠️ Its reload checks read the persisted cache `StatusMenuIcon` writes before the mutation,
so they prove the menu and badge, not the server (checklist #32) · `MOB.330` tabs · `MOB.340` search/sort ·
`MOB.392` note, proved by exactly one more note after a reload · `MOB.393` the add-form picker.

### `MOB.988_WorkOrders_Records` — 6 children · leaves residue (charges)
**Records added to a work order, each PROVEN ON THE SERVER after a reload.**

`MOB.350`/`360`/`370`/`380` — equipment, labor, material (Return, so stock is untouched), other —
each counts its own record's cards, reloads, and requires exactly +1. `MOB.390` condition and
`MOB.391` failure add a key the fixture does not hold, read it back after a reload, delete it from
its own card (trap 2), and prove the original record untouched. The add proofs survive bugs §40;
the post-delete check reads a cache the app already edited — `preflight.py mob39x` is the server
check until checklist #32 lands. Split from `MOB.991` at the execution ceiling (checklist Appendix F).

### `MOB.985_WorkDetail` — 12 children · read-only
**The work-order detail screen's secondary controls, and the negative cases.**

`MOB.347` Assets tab (🛑 `Mark as …` asserted, never clicked) · `MOB.348` globe menu and
LocationForm · `MOB.349` record cycling · `MOB.355` form render (desktop branch) · `MOB.357`
`FormMetrics` · ⭐ **`MOB.356` an invalid charge form does not submit, on all four** — the failure
mode the charge tests are blind to · `MOB.351` the `ESTIMATES` section on four tabs (no estimate
row: the fixture has none) · `MOB.389` the Condition/Failure asset lookups ignore case · `MOB.911`
the offline geolocate popover · `MOB.387` `Edit Item` opens the condition form filled with its card's
six values, closed unsaved · ⭐ `MOB.912` `ConnectionRequired` (Asset Lookup) and the material-charge
offline message, reached by overriding `navigator.onLine`, each paired with its online control ·
`MOB.358` the asset location form, online and — with `navigator.onLine` overridden — its offline
state (last: it stubs `fetch`).

### `MOB.986_WorkOrders_Extra` — 13 children · leaves residue
**The remaining work-order entry points and the work LIST.**

`MOB.396` create from a job asset · `MOB.397` follow-up · `MOB.398` crew-assignment modal ·
`MOB.394` permits · `MOB.399` warranties · `MOB.122` create from the map · `MOB.301` a photo in the
create form (a local `blob:`, discarded unsent) · `MOB.302` **`Copy to asset` reaches the server**
— the asset lists the SAME attachment id (a link, not a copy), then the link is removed from the
asset and the work order's image still loads · `MOB.341` map toggle · `MOB.343` search filters ·
`MOB.344` row navigation · `MOB.342` status ring and legend · `MOB.345` sort applied, persisted
and really reversed — narrowed by a search first, and every row rendered in both directions must
come out reversed, so a row paging in mid-test cannot fail it.

### `MOB.993_AssetVerify` — 14 children · self-restoring
**The verification workflow, putting itself back.**

⭐ `MOB.510` verifies, proves the asset **moved tabs**, un-verifies. `MOB.590` the same crossing
from the other side · `MOB.500` job read · `MOB.520` five data tabs · `MOB.560` counts, badges,
ring labels · `MOB.580` sort against the app's own `localeCompare` · `MOB.570` asset cycling ·
`MOB.575` Failure/Condition forms · `MOB.585` map toggle · `MOB.531` in-job search · `MOB.547` the
photo tag search (the create button is an exclusive-or with an exact match) · `MOB.546` the
full-page **Attachments** tab (the one `keepMounted={false}` call site; Photos and Docs both
populated) · `MOB.131`/`132` the Transaction Log, placed here because they need a mutation to have
just happened.
🛑 It cannot touch the job's own status beyond one asset: verifying the last asset flips the job
`COMPLETED`, which mobile cannot walk back (bugs §10) — the reset decision in `cleanup_spec.md` §4.

### `MOB.994_Collector` — 9 children · leaves residue (`MOB.600`, `MOB.623`)
**Asset collection, the photo input surface, and the saved-photo menu.**

`MOB.620` the picker (capture buttons asserted, never clicked) · `MOB.621` a photo reaches the
carousel, discarded unsent · `MOB.622` the carousel at one photo **and** two, fullscreen, and the
tag editor's `MentorLens Tags` · `MOB.626` the tag/description capture menus — exactly `Add Asset
Photo` in a browser, plus `Use photo selected above` once the form holds a photo · `MOB.600` create an asset with a real photo — 🛑 red: the server
never receives it (bugs §34); its server proof is `soft`, so later children still run · `MOB.610`
search · ⭐ `MOB.623` a photo added to an **existing** asset, polled until its `blob:` becomes a
server URL; the saved photo's five-item menu exactly and in order; `Rotate Image` ×4 with the src
read back (self-restoring at 360° — proves the round trip, not the pixels); the Photos / Docs /
Attributes panel content · `MOB.624` the row avatar's attachments modal (its sentinel carries
bugs §35) · `MOB.625` list sort on our own rows against the server's order and `localeCompare`,
and `Collected By Me` as a filter (sentinels carry bugs §38).

### `MOB.995_AssetLookup` — 9 children · read-only
**Asset lookup, three of its six detail tabs, and the work panel behind them.**

`MOB.700` search and open · `MOB.750` the `Tag Lookup` menu — `Alphanumeric`'s browser branch
proved by a prototype-`click` recorder (one file dialog, rear camera, images, one file; nothing
uploaded); bugs §37 sentinelled · `MOB.720` Readings and `MOB.721` its empty state · ⭐ `MOB.740` `WorkLookupDetails`, which is
also the map's `WorkCard` · `MOB.741` the work-stage attachment panel and its image filter ·
`MOB.735` `View in Map` (router state, not a URL) · `MOB.730`/`731` Near Me and its radius.
Of the six tabs, `General Info` (`MOB.710`), `Work History` (`MOB.740`/`741`) and `Readings`
(`MOB.720`) are asserted here; `Photos`/`Docs`/`Attributes` content is asserted by `MOB.623` on
the collector — the same `AssetLookupDetails` component.

### `MOB.996_Search` — 8 children · read-only
**Search, filtering and sorting across three screens.**

`MOB.800` a structured filter that really filters · `MOB.805` edit · `MOB.806` multi-value
(string) · `MOB.807` multi-value `enum` (`Failure Curve`, narrows) and `record` (`Asset Type`;
sentinels carry bugs §39) — all three `MultiValueSelector` branches · `MOB.810` sort persistence ·
⭐ `MOB.820` submitting the search box discards an active filter (bugs §20) · `MOB.530`
search/filter/sort on the job list · `MOB.535` the list really comes out in order. All four filter
tests share `dd_tools.open_filters_drawer` (a bench drift-guard enforces one copy).

### `MOB.983_AssetVerify_Extra` — 3 children · self-restoring
**The AV job's header and status menu, and the offline transaction queue — each proved after a
reload, each put back.**

`MOB.537` the full-page asset header's `Tag ID` — `None` and `0000` — and its own edit button:
`0000` → `DD-TAG-EDIT` → `0000`, each proved after a reload · ⭐ `MOB.913` **the offline queue**: a
verify made offline is held (pending 1, still 1 after 6s), listed in `Pending Transactions`,
drained on reconnect and on the server after a reload, and replayed from IndexedDB after a reload
while held · `MOB.536` the job status menu — IN PROGRESS → CANCELED (the canceled alert) → IN
PROGRESS, proved after a reload; last, because a failed restore can drop the job from the list.

### `MOB.984_Phone_Suite` — 2 children · read-only · `chrome.mobile_small`
**The phone-width branches no tablet run can reach** (trap 1's one exception; run on its own).

`MOB.951` a work form renders its MOBILE branch (`#senor-work-form`, below `availWidth` 750) and
not the desktop one · `MOB.952` the affixed `+`, the list's search and the burger are on screen at
phone width; the header crew shortcut is hidden under 450px by design (the burger's `Switch Crews`
is the phone path, and the login prefix reads the role there).

### The smaller suites

| suite | children | establishes |
|---|---|---|
| `MOB.992_Menu` | 7 | hamburger menu, resync, back arrow, header status icons, crew modal dismissal |
| `MOB.989_FieldEdit` | 4 | the edit surfaces — `MOB.395` WO General Info, `MOB.710` the per-field pencil (three entry points), `MOB.545` asset attributes, `MOB.388` work-order attributes. All prove **persistence** after a reload and self-restore |
| `MOB.998_MaterialLookup` | 5 | storeroom read and search · `MOB.860` cycle count `+1`/`-1` (self-restoring by construction — neither leg reads the quantity back) · `MOB.870` stocking (**one-way**) · `MOB.865` the Photos/Docs segments and row avatar modal · `MOB.855` column sort really reorders, `N matches` vs rows (bugs §33) |
| `MOB.997_Session` | 2 | ⭐ permission gating of the menu; crew scoping changes the visible job set. ⚠️ never run concurrently — mutates the session crew |
| `MOB.987_EventReadings` | 2 | ⭐ `MOB.550` meter readings — a write the UI **fakes** (it hand-writes the cache), proved by the next run's cold read · `MOB.551` the reading-history popover |

### Standalone — in no suite

`MOB.000_Login` / `MOB.440_Logout` establish and end a session. `MOB.200_Crew_Switch` mutates the
session crew. `MOB.346_Work_Scheduled_View` is unreachable (the crew is `ASSIGNED`). `MOB.978` is
the one diagnostic, kept while the work-list fixture is in flux.

---

## What is deliberately NOT covered

| area | why |
|---|---|
| **The queue's link classes in isolation** (`SerializeLink` ordering, `ErrorLink`) | a **Jest** job, being done outside this suite; `MOB.913` covers the queue end to end in a browser |
| **The browser genuinely offline** | Synthetics cannot cut the network — the offline shell page and a real fetch failure are unreachable. The window event and the `onLine` override reach everything else |
| **Camera capture** | each button opens a native file dialog Datadog cannot dismiss |
| **The `tus` transport** | resume and unauthorized-retry need a transfer interrupted mid-flight |
| **The native shell bridge** | Expo shell only (`window.ReactNativeWebView`) |
| **Real GPS · map canvas drawing** | features are hit-tested via `queryRenderedFeatures`, no DOM |
| **Delete controls** | never fired except the owner-named flows (trap 2) |
| **Session/JWT expiry** | cookie-authenticated; a browser step cannot expire it |

---

## Where the next real gain is

1. **Genuine server reads** (checklist #32) — one `dd_tools` helper turns ~10 reload proofs into
   server proofs, and fixes the two that read the app's own writes today.
2. **A suite pass** (paused) — ~21 children are green solo and have never run inside their
   suites, and `MOB.988` and `MOB.983` have never run as suites.
3. **The AV job reset decision** — one owner call (`cleanup_spec.md` §4); unlocks five tests
   including verify-all.
4. **Bugs §41** — until `deleteWorkOrders` works, work-order residue (≈5/day) cannot be pruned.
5. **`Edit Item` save** (checklist #36) — `updateCollectionRecord` is untested.
6. **Fixture diversity** — a second work-order shape (estimates, a required form field, a second
   list status) would unlock `MOB.351`'s estimate rows, `MOB.357`'s non-zero path and `MOB.342`'s
   exclusion leg.

*Details: `testing_checklist.md` → ▶ OPEN WORK.*
