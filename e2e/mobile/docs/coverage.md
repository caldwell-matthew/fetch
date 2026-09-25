# MentorTwo Mobile — what the Datadog tests actually cover

*Answers one question: **what does a green run PROVE?** What is left to do and what has run
lately live in `testing_checklist.md` (its 📊 RUN STATUS is the authority on freshness); why a
test is built as it is lives in its `build_*.py` docstring.*

**156 tests · 27 suites** · 156 suite children — counted from `e2e/mobile/` by `tools/check_docs.py`.

## 🛑 Read this before quoting a coverage number

**"Covered" means a browser test drives the surface and asserts something about it — not that
the surface is safe.** Four gaps separate the two:

1. **Runs are manual today** — regression *capability*, not detection, until the planned weekly
   Datadog schedule lands (checklist #37 — late game, once no more tests are being made).
2. **A green test is not necessarily a meaningful one.** Five have been caught proving nothing:
   `MOB.340` against an empty list, `MOB.348` counting generic buttons, `MOB.346` with a
   `|| true`, `MOB.358` flipping a checkbox by position, and `MOB.390`/`391` re-submitting a key
   the server refused, green on a closing modal (bugs §40). `audit_assertions.py` encodes the
   first four shapes; the fifth is why writes are now proved on the server (`server_assert`) or, for
   optimistic adds, after a reload.
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
| **Read-back after a reload** — assert the RECORD, not the form | ⭐ strong — *where the write is optimistic* | charges and `MOB.392` count exactly +1. ⚠️ A reload renders the **persisted Apollo cache**, not the server: sound only for writes made through `optimisticResponse` (never persisted); a write the app makes straight into the cache reads back its own value (trap 6). 🛑 a row the client just prepended is NOT one (bugs §34) |
| **A `network-only` read** | ⭐ strongest server proof | `MOB.302` and `MOB.600` read Asset Lookup (`MOBILE_ASSET_LOOKUP` is `network-only`) |
| **A `/graphql` read** (`dd_tools.server_assert`) | ⭐ strongest server proof | `MOB.320` the status · `MOB.390`/`391` the added key and the post-delete count · `MOB.386` the edited score |
| **A recorder installed before the action** | solid — for UI that exists for milliseconds | `MOB.626`/`MOB.914` offline menu messages (bugs §43) · `MOB.750` the file-dialog request |
| **Exclusive-or** — either branch passes, neither fails | solid | `MOB.720`, `MOB.399` — cannot go vacuous on an empty fixture |
| **Positive presence with a polling gate** | ordinary | most `assertElementPresent` |
| **Absence only** | ⚠️ weak alone | true on a blank page, a crash and a login redirect alike — needs a positive control |
| **Count over a generic selector** | 🛑 distrust | `MOB.348`'s defect; flagged HIGH by `audit_assertions.py` |
| **"The modal closed"** | depends on the submit path | a server answer only where no `optimisticResponse` precedes it (trap 6) |

---

## Coverage by route

*Every route in `client/mobile/routing/index.tsx`, and the leaf tests its rows cite (suites excluded). The action-by-action rows are
`testing_checklist.md` → Tier 2; cross-cutting risks (offline, uploads, session, viewport) are its Tier 1.*

| route | tests | `[x]` | `[~]` | `[ ]` gaps | `[-]` |
|---|---|---|---|---|---|
| `/` — Home | 000 180 210 910 | 5 | 0 | 0 | 1 |
| Every route — header, hamburger menu and back arrow | 200 346 400 410 420 430 440 450 460 470 910 913 | 10 | 1 | 0 | 2 |
| `/work` — Work Orders list | 150 300 301 340 341 342 343 344 345 346 | 9 | 0 | 0 | 1 |
| `/work/:workStageId` — a work order | 302 310 320 330 347 348 349 350 351 352 353 354 356 357 359 360 361 363 364 365 370 380 385 386 387 388 389 390 391 392 393 394 395 397 398 399 731 741 911 912 | 38 | 1 | 1 | 1 |
| `/work/:workStageId/form/:formId` — a work stage form | 134 355 951 | 2 | 0 | 0 | 1 |
| `/asset-verify` — Mobile Jobs list | 140 342 530 535 560 580 | 5 | 1 | 1 | 1 |
| `/asset-verify/:jobId` — a mobile job's asset list | 396 500 510 520 531 536 547 551 585 590 720 | 12 | 0 | 0 | 3 |
| `/asset-verify/:jobId/asset/:verificationId` — full-page asset data | 537 545 546 550 570 575 | 6 | 1 | 0 | 1 |
| `/asset-collector` — Asset Collector / Lens | 160 600 610 620 621 622 623 624 625 626 627 628 710 | 16 | 1 | 1 | 1 |
| `/asset-collector/:assetId` | — | 0 | 0 | 0 | 1 |
| `/asset-lookup` — Asset Lookup | 100 550 623 700 710 712 720 721 722 730 731 735 740 741 750 800 805 806 807 820 914 | 19 | 1 | 1 | 2 |
| `/material-lookup` — Material Lookup | 110 370 850 855 860 865 866 870 | 8 | 0 | 0 | 2 |
| `/map` — The Map | 120 121 122 123 735 | 7 | 1 | 0 | 4 |
| `/transactions` — Transaction Log | 130 131 132 | 3 | 0 | 0 | 0 |
| `/logz` — Dev Logs | 170 171 | 1 | 0 | 0 | 0 |

## Writes by route — create, update, delete

*Every write the mobile app can send (`client/mobile` on `origin/development`), and the test that submits it with a
server proof. Reads are covered on every route (above). ✅ tested with a server proof · 🟠 partial or red on a known bug ·
❌ not yet (▶ OPEN WORK #N) · ⛔ excluded by a decision · — the app has no such write. Mobile deletes nothing but notes,
conditions, failures, work-order asset links, attachments and photo tags; it creates org tags and Systems it cannot delete.*

**`/work` and `/work/:workStageId`**

| record | create | update | delete |
|---|---|---|---|
| Work order | ✅ `MOB.300` · `122` · `396` · `397` · at a dropped map point `932` | ✅ status `MOB.320` · General Info `395` (⚠️ only because the fixture carries **no project** — bugs §46: the form resubmits every field, so a project with no account blocks any save, and the toast still says `Record Updated`) · attributes `388` · Edit Location `352` | — |
| Charges ×4 | ✅ `MOB.350`–`380` | — | — |
| Notes | ✅ `MOB.392` | ✅ `MOB.361`, its own note | ✅ `MOB.361`, its own note |
| Conditions | ✅ `MOB.390` ¹ | ✅ `Edit Item` `MOB.386` ¹ | ✅ `MOB.390`, its own card |
| Failures | ✅ `MOB.391` ¹ | ✅ `Edit Item` `MOB.385` ¹ | ✅ `MOB.391`, its own card |
| Assets on a work order | ✅ Assets tab add `MOB.354` · from a map card `929` | ✅ `Mark as …` `MOB.353` · location form submit `359` | ✅ `MOB.354`, `MOB.929`, each its own link |
| Attachments | ✅ one photo `MOB.363` · several types at once `MOB.933` · resumed after a cut `MOB.934` | ✅ `Copy to asset` `MOB.302` | ✅ `MOB.363`, `MOB.933`–`935`, their own uploads |
| Forms | ✅ attach `MOB.364` (the test then deletes it over `/graphql`) | ✅ fill `MOB.134` · signature `[-]` | — |
| Assignment | — | ✅ reassign `MOB.365` | — |

¹ The write path is proved over `/graphql`, but **bugs §42 is not detected**: these children wait for `/work`'s prefetch,
which caches the condition and failure schemas before the form opens, so the first-open race never happens. No test
reproduces §42.

**`/asset-verify` routes**

| record | create | update | delete |
|---|---|---|---|
| Job | — | ✅ status `MOB.536` · ⛔ verify all (reset decision) | — |
| Asset on a job | ⛔ add to job (reset decision) | ✅ verify `MOB.510`/`590` · attributes `545` · Tag ID `537` | — |
| Readings | ✅ `MOB.550` | — | — |

**Assets — Asset Lookup, the Collector and a job's asset rows (one `AssetLookupDetails`)**

| record | create | update | delete |
|---|---|---|---|
| Asset | 🟠 `MOB.600` (bugs §34) · ✅ at a dropped map point `MOB.932` | ✅ fields `MOB.710` · ✅ create a System `MOB.712` · ✅ `Get Description`, the AI answered in the browser `MOB.935` | — |
| Photos | ✅ upload to an existing asset `MOB.623` · a HEIC `936` | ✅ rotate `MOB.623` · `Set as Avatar` `627` · tags add/remove `627` · 🟠 tag **create** `627` — red on bugs §44, the created tag never attaches (its sentinel is `optional`) | ✅ `MOB.627`, its own upload |
| Docs | ✅ one PDF `MOB.628` · PDF, text and video at once `MOB.933` | — | ✅ `MOB.628`, `MOB.933`, `MOB.934`, their own files |
| Readings on Asset Lookup | ✅ `MOB.722` | — | — |

**`/material-lookup` · `/map` · every route's header**

| record | create | update | delete |
|---|---|---|---|
| Storeroom item quantity | — | ✅ cycle count `MOB.860` · stocking `870` | — |
| Storeroom item photos/docs | ✅ photo + PDF `MOB.866` | — | ✅ `MOB.866`, its own uploads |
| Work order from the map | ✅ `MOB.122` | ⛔ add/replace its asset (map canvas) | — |
| Session | — | ✅ switch crew `MOB.200`/`430` · log out `440` · Dev Logs level `171` | — |

## Coverage by suite

*The 24 module suites in `dd_scripts_mobile/suite_plan.py` — the only place membership is kept — grouped by module, children
in run order (often load-bearing). **Datadog** is each suite's green run on the first full pass (measured 2026-09-16, dev
bundle `mobile.2026.7.0-86`): read-only suites ran ten at once, writing suites one at a time. Datadog takes ~1.3–1.6× a
suite's local time against a ~1071s ceiling (Appendix F); `MOB.959` and `MOB.953` sit closest.*

### Work Orders

#### `MOB.953_WorkOrders_1_List_Suite` — 9 children · writes (`MOB.300` leaves a work order) · Datadog 634s
**The work-order LIST: create, search, sort, map toggle, status ring, row navigation.**

`MOB.150` the route renders · `MOB.300` create (the create form has no `optimisticResponse`, so its modal closing is a
server answer) · `MOB.301` a photo in the create form (a local `blob:`, discarded unsent) · `MOB.340` search/sort ·
`MOB.341` map toggle · `MOB.343` search filters · `MOB.344` row navigation · `MOB.342` status ring and legend ·
`MOB.345` sort applied, persisted and really reversed — narrowed by a search first, and every row rendered in both
directions must come out reversed, so a row paging in mid-test cannot fail it.

#### `MOB.954_WorkOrders_2_Detail_Open_Tabs_Suite` — 8 children · read-only · Datadog 294s (its 7-child version)
**The work-order detail screen opened, its tabs, and the records behind them.**

`MOB.310` read · `MOB.330` tabs · `MOB.331` General Info's value arrow — beside Stage Notes (`DATADOG FIXTURE`), absent beside the empty Problem Description, and opening exactly the value · `MOB.393` the add-form picker (nothing attached) · `MOB.394` permits · `MOB.399`
warranties (and the empty state on MOB.302's work order) · `MOB.348` globe menu and LocationForm · `MOB.349` record
cycling.

#### `MOB.981_WorkOrders_3_Detail_Charges_Offline_Suite` — 6 children · read-only · Datadog 453s
**The charge forms' negative cases, form metrics, the assign modal and the offline screens.**

`MOB.357` `FormMetrics` · ⭐ **`MOB.356` an invalid charge form does not submit, on all four** — the failure mode the
charge tests are blind to · `MOB.351` the `ESTIMATES` section on four tabs (no estimate row: the fixture has none) ·
`MOB.398` the crew-assignment modal (cancelled) · `MOB.911` the offline geolocate popover · ⭐ `MOB.912`
`ConnectionRequired` (Asset Lookup) and the material-charge offline message, reached by overriding `navigator.onLine`,
each paired with its online control.
🛑 Kept separate from `MOB.954`: together they measured 485s local, too close to the ceiling on Datadog.

#### `MOB.955_WorkOrders_4_Detail_Assets_Records_Read_Suite` — 6 children · read-only · Datadog 351s
**The Assets tab, the record forms opened unsaved, attachments and proximity.**

`MOB.347` Assets tab (🛑 `Mark as …` asserted, never clicked — `MOB.353` writes it) · `MOB.389` the Condition/Failure
asset lookups ignore case · `MOB.387` `Edit Item` opens the condition form filled with its card's six values, closed
unsaved; the card's `Stress Decision Score:`/`Notes:` rows and the failure table's `Discovery Code` · `MOB.741` the
work-stage attachment panel and its image filter · `MOB.731` Near Me's radius · `MOB.358` the asset location form, online
and — with `navigator.onLine` overridden — its offline state (last: it stubs `fetch`, and expanding an asset row needs
the Asset schema cached — bugs §45).

#### `MOB.956_WorkOrders_5_Records_Suite` — 8 children · writes (residue: charges, a note) · Datadog 623s
**Records added to a work order, each PROVEN ON THE SERVER after a reload.**

`MOB.350`/`360`/`370`/`380` — equipment, labor, material (Return, so stock is untouched), other — each counts its own
record's cards, reloads, and requires exactly +1. `MOB.390` condition and `MOB.391` failure add a key the fixture does not
hold, read it back after a reload, delete it from its own card (trap 2), and prove the original record untouched. Both
are also read on the server over `/graphql` — the key present after the add, gone after the delete with the original's
count unchanged — and both wait for an ARMED Submit (trap 8). ⚠️ They do **not** reproduce bugs §42: they wait for
`/work`'s prefetch, which caches the schemas before the form opens. The add proofs and the cleanup stay `soft`.
`MOB.392` a note, proved by exactly one more note after a reload · `MOB.361` a note of its own added, edited in
the tiptap editor and deleted — each over `/graphql`, the delete guarded to that note (trap 2) and the note ids ending
exactly as they began.

#### `MOB.957_WorkOrders_6_Status_Field_Edits_Suite` — 5 children · writes (self-restoring) · Datadog 581s
**Edits to the fixture work order that prove PERSISTENCE and put themselves back.**

`MOB.320` walks **every assignable status** — Pending, In Progress, On Hold, Requested, Not Completed, Complete,
Canceled — reading the badge exactly; it asks the server over `/graphql` for `NotCompleted` and the restored `Ready` (the
badge alone reads a cache `StatusMenuIcon` writes before the mutation), and restores Ready `always` · `MOB.395` General
Info (green only while the fixture has no `project` — bugs §46) · `MOB.388` a work-order attribute · `MOB.386` a
condition's and `MOB.385` a failure's `Edit Item` save, each proved over `/graphql` and restored. ⚠️ Like `MOB.390`/`391`,
they no longer reproduce bugs §42 (the schemas are cached before the form opens); the first-save proof stays `soft`.

#### `MOB.958_WorkOrders_7_Assets_Location_Edits_Suite` — 4 children · writes (self-restoring, self-cleaning) · Datadog 356s
**The work order's location and its asset links, written and put back.**

`MOB.352` `Edit Location` saves a marker address and x/y, proved over `/graphql`; the fixed rest values are typed back
`always`, with a `/graphql` backstop · `MOB.353` `Mark as …` on `Pump 0102`'s link, `Active` → `Completed` → `Active`,
each over `/graphql` (the badge is written to the cache before the mutation) · `MOB.354` `Bypass Valve 0001` linked
through `Add Existing Asset` and that link removed (trap 2); `Pump 0102`'s link, the condition and failure ids and the
stage's location proved untouched · `MOB.359` the asset location form submits `Pump 0102`'s address, city and postal code
from a stubbed geocode, `Include GIS` off so lat/long are proved unchanged, restored `always`.

#### `MOB.959_WorkOrders_8_Stage_Writes_Create_Suite` — 6 children · writes (residue: two work orders) · Datadog 682s
**The remaining work-order entry points, and writes on work order `20260910-16`.**

`MOB.396` create from a job asset · `MOB.397` follow-up · `MOB.302` **`Copy to asset` reaches the server** — the asset
lists the SAME attachment id (a link, not a copy), then the link is removed from the asset and the work order's image
still loads · on `20260910-16`: `MOB.363` a photo uploaded to the Attachments tab and deleted, guarded to its own id ·
`MOB.365` reassigned to another crew and assigned back to `Admin` (a `/graphql` net un-assigns the target), the crews
ending exactly the 8 at rest · `MOB.364` a form attached — one more over `/graphql`, its card after a reload and the
page's ⟳ resync — then deleted over `/graphql`, the form ids back to the premise's.

#### `MOB.960_WorkOrders_9_Forms_Suite` — 3 children · writes (self-restoring) · Datadog 191s (its 2-child version)
**A work stage form, rendered and written.**

`MOB.355` form render (desktop branch) · `MOB.134` a work form's integer field saved on blur, proved over `/graphql`, and
cleared · `MOB.135` the `🔎 Inspection` form's signature field in the tablet's desktop grid — drawn with the MOBILE control, `Add Signature`, its pad opened in a modal and closed untouched, and the server still holding no signature (the pad saves only a pending stroke, on close).

### Asset Verify

#### `MOB.961_AssetVerify_1_Jobs_List_Suite` — 6 children · read-only · Datadog 322s
**The mobile job list.**

`MOB.140` the route renders · `MOB.530` search/filter/sort on the job list · `MOB.560` counts, badges, ring labels ·
`MOB.580` sort against the app's own `localeCompare` · `MOB.810` the sort choice survives a page load
(`sessionStorage['mobile-MobileJob-sort']`) · `MOB.535` the list really comes out in order, and clears the persisted sort
on the way out.

#### `MOB.962_AssetVerify_2_Job_Assets_Read_Suite` — 6 children · read-only · Datadog 429s
**A job's asset list, read.**

`MOB.500` job read · `MOB.520` five data tabs · `MOB.585` map toggle · `MOB.531` in-job search · `MOB.547` the photo tag
search (the create button is an exclusive-or with an exact match) · `MOB.551` the reading-history popover.

#### `MOB.963_AssetVerify_3_Verify_Status_Queue_Suite` — 6 children · writes (self-restoring) · Datadog 739s
**The verification workflow and the job's status, putting themselves back.**

⭐ `MOB.510` verifies, proves the asset **moved tabs**, un-verifies · `MOB.590` the same crossing from the other side ·
⭐ `MOB.913` **the offline queue**: a verify made offline queues TWO operations — `VERIFY_ASSET` and the `UPDATE_MOBILE_JOB_STATUS` its `update()` recomputes — held (pending 2, still 2 after 6s), both listed in `Pending
Transactions` (still open, it refreshes to `No logs found.` once drained), drained on reconnect and on the server after a
reload, and replayed from IndexedDB after a reload while held · `MOB.536` the job status menu — READY → CANCELED
(the canceled alert) → IN PROGRESS → READY, proved after a reload; last, because a failed restore can drop the job from
the list. The menu cannot offer READY, so its last leg is a verify/unverify round trip, and the whole test reads the
status back from the MENU's exits: three items means READY, two means IN PROGRESS.
⭐ `MOB.511` verifies **both** assets — the one test that drives a job to `COMPLETED` — and reads the status from the
server at each step: `READY` → `IN_PROGRESS` → `COMPLETED`, then back to `READY` when both are unverified · ⭐ `MOB.512`
does the same act and then asserts what the **job list** renders: the card's own `2 out of 2 Assets Verified` and `100%`,
the `Completed` badge keeping the job and `Ready` hiding it. The dot beside a job is a colour, not text, so a status
badge is the only thing that can read a job's status back from the list.
🛑 These two run LAST, in that order: until their `always` restore legs finish, the fixture is `2 out of 2` and the job
is COMPLETED, which is false for every premise `MOB.500`/`510`/`590` and `MOB.530`/`560` start from. They are only
possible at all because the status now recomputes DOWNWARD — until build 92 `COMPLETED` was a one-way door and each run
would have needed `reset_av_fixture.py --apply` afterwards.

#### `MOB.964_AssetVerify_4_Asset_Detail_Read_Suite` — 3 children · read-only · Datadog 263s
**The full-page asset, read.**

`MOB.570` asset cycling · `MOB.575` Failure/Condition forms · `MOB.546` the full-page **Attachments** tab (the one
`keepMounted={false}` call site; Photos and Docs both populated).

#### `MOB.965_AssetVerify_5_Asset_Detail_Edits_Suite` — 3 children · writes · Datadog 438s
**The full-page asset, written.**

`MOB.537` the header's `Tag ID` (`None` and `0000`) and `Desc:`, and the tag's own edit button: `0000` → `DD-TAG-EDIT` →
`0000`, each proved after a reload · `MOB.545` an asset attribute, self-restoring · ⭐ `MOB.550` meter readings — a write
the UI **fakes** (it hand-writes the cache), proved by the next run's cold read (residue).

### Asset Collector

#### `MOB.966_AssetCollector_1_Capture_Suite` — 9 children · read-only · Datadog 356s (its 8-child version)
**The collector's capture surface — nothing submitted.**

`MOB.160` the route renders · `MOB.620` the picker (capture buttons asserted, never clicked) · `MOB.621` a photo reaches
the carousel, discarded unsent · `MOB.622` the carousel at one photo **and** two, fullscreen, and the tag editor's
`MentorLens Tags` — including a lens tag's **description**: the `?` on `Lens: Thermography`, then on `Lens: Condition
Assessment`, shows exactly that tag's desc in a modal that closes itself after 3s, and assigns nothing · `MOB.626` the tag/description capture menus — exactly `Add Asset Photo` in a browser, plus `Use photo
selected above` once the form holds a photo, and offline the wand's and `Add Asset Photo`'s connection messages
(recorded — they flash, bugs §43) · `MOB.629` the create form's **`Location` row**: `No location captured.`, then — with `MOB.358`'s geolocation and Mapbox stubs — `Asset Location` prefilled from the geocode, its Submit putting `1600 Main Street, Chicago, IL, 60601` over `41.878100, -87.629800` on the row, and `Clear location` restoring the placeholder; the location lives in the form's reducer, so nothing is written and the form is discarded unsent (the location APPLIED to a created asset is `MOB.600`'s, held by bugs §34) · `MOB.610` search · `MOB.624` the row avatar's attachments modal (its sentinel carries
bugs §35) · `MOB.625` list sort on our own rows against the server's order and `localeCompare`, and `Collected By Me` as a
filter (sentinels carry bugs §38).

#### `MOB.967_AssetCollector_2_Saved_Asset_Suite` — 4 children · writes (residue: a photo, an org tag) · `MOB.600` red by design until bugs §34 is fixed
**Writes on `DD SYNTHETIC MOBILE` assets.**

`MOB.600` create an asset with a real photo — 🛑 red on Datadog: the server never receives it (bugs §34); its server proof
is `soft`, so later children still run. A local replay of `MOB.600` is a false negative (it cannot drive the photo picker)
· ⭐ `MOB.623` a photo added to an **existing** asset, polled until its `blob:` becomes a server URL; the saved photo's
five-item menu exactly and in order; `Rotate Image` ×4 with the src read back (self-restoring at 360° — proves the round
trip, not the pixels); the Photos / Docs / Attributes panel content · `MOB.627` on a photo of its own: an existing tag
added and removed, a tag created (one permanent org tag per run; it does not reach the photo — bugs §44, an optional
sentinel), `Set as Avatar`, then `Delete Photo` — each over `/graphql`, every destructive click re-checking the photo is
this run's upload; the avatar clears with the photo · `MOB.628` uploads ONE PDF (the owner-recorded file, trap 12) to the
same asset's Docs and deletes exactly that file, both ends over `/graphql`.

### Asset Lookup

#### `MOB.968_AssetLookup_1_Rows_Tabs_Suite` — 9 children · read-only · Datadog 324s
**Asset lookup, its rows and detail tabs.**

`MOB.100` the route renders · `MOB.700` search and open · `MOB.750` the `Tag Lookup` menu — `Alphanumeric`'s browser
branch proved by a prototype-`click` recorder (one file dialog, rear camera, images, one file; nothing uploaded); bugs
§37 sentinelled · `MOB.720` Readings and `MOB.721` its empty state · ⭐ `MOB.914` the offline messages — the Readings and
Work History tabs show `OFFLINE_FEATURE_MESSAGE`, `Add reading types` offline opens it in a popover, and `Get
Description` on a saved photo, clicked only offline, renders it (recorded — bugs §43) · ⭐ `MOB.740` `WorkLookupDetails`,
which is also the map's `WorkCard`, and the history rows' `Assigned to:` — the newest row's value checked against the server's `_assignments` for that row · `MOB.735` `View in Map` (router state, not a URL) · `MOB.730` Near Me.
`Photos`/`Docs`/`Attributes` content is asserted by `MOB.623` on the collector — the same `AssetLookupDetails` component.

#### `MOB.969_AssetLookup_2_Filters_Sort_Suite` — 5 children · read-only · Datadog 307s
**Filtering on Asset Lookup.** *(⚠️ The name says `Sort` and nothing here sorts. The name is kept because `push` matches
on NAME, so renaming would orphan the Datadog test.)*

`MOB.800` a structured filter that really filters · `MOB.805` edit · `MOB.806` multi-value (string) · `MOB.807`
multi-value `enum` (`Failure Curve`, narrows) and `record` (`Asset Type`; sentinels carry bugs §39) — all three
`MultiValueSelector` branches · ⭐ `MOB.820` submitting the search box discards an active
filter — it did until `02b17aa82e` (2026-09-17), and `MOB.820` now asserts that it survives. All four
filter tests share `dd_tools.open_filters_drawer` (a bench drift-guard enforces one copy).

#### `MOB.980_AssetLookup_3_Edits_Suite` — 3 children · writes · Datadog 179s
**Writes on the Asset Lookup route.**

`MOB.710` the per-field pencil (three entry points), self-restoring on `Pump 0102` · `MOB.712` a System created from the
System field on a `DD SYNTHETIC MOBILE` asset — the System and the asset's link both over `/graphql` (residue: one System
per run) · `MOB.722` a `Test 1` reading captured on that asset, `CREATE_EVENT` proved over `/graphql` (residue: one
reading per run).
🛑 Separate from `MOB.969`: its children leave a term in `asset_lookup_query`, and a search typed on top of one reads
`Pump 0102Pump 0102` (trap 17, measured 2026-09-15).

### Material Lookup · Map · App shell · Session · Phone

| suite | children | Datadog | establishes |
|---|---|---|---|
| `MOB.970_MaterialLookup_Suite` | 7 · writes | 368s | `MOB.110` the route · `MOB.850` storeroom read and search · `MOB.860` cycle count `+1`/`-1` (self-restoring by construction — neither leg reads the quantity back) · `MOB.870` stocking (**one-way**) · `MOB.855` column sort really reorders, `N matches` vs rows (bugs §33) · `MOB.865` the Photos/Docs segments — the storeroom item's editable attachments above the material item's read-only ones — and the row avatar modal · `MOB.866` uploads a photo and a PDF to the storeroom item and deletes both, each end over `/graphql`, the material item's own attachments proved unchanged |
| `MOB.971_Map_Suite` | 4 · writes (residue: a work order) | 156s | `MOB.120` the route · `MOB.121` map controls (style, the layers panel and its heading, zoom — not 2D/3D or Home) · `MOB.123` the `Switch Map` picker (a real switch and back, read from `mobile-map-id`) · `MOB.122` a work order created from the map, last |
| `MOB.972_AppShell_Suite` | 15 · writes (`MOB.131` verifies and un-verifies an AV asset) | 378s | `MOB.180` Home tiles · `MOB.900` a guard that the offline notice and `ErrorBoundary` do **not** appear on a normal run · `MOB.910` the offline UI · `MOB.170` route and `MOB.171` Dev Logs · `MOB.130` route and `MOB.131`/`132` the Transaction Log · the hamburger menu, resync, back arrow, header status icons, crew modal dismissal and its always-shown offline description (`MOB.400` `410` `420` `430` `450` `460` `470` — **not** `MOB.440`, which logs out and is standalone). 🛑 Route checks are shallow by design: the route resolved and titled itself, not that its data loaded — each module's suites cover that |
| `MOB.973_Session_RunAlone_Suite` | 2 · writes · **run alone** | 215s | ⭐ `MOB.210` permission gating of the menu · `MOB.220` crew scoping changes the visible job set. ⚠️ never run concurrently — mutates the session crew |
| `MOB.975_Phone_Suite` | 2 · read-only · `chrome.mobile_small` | 129s | `MOB.951` a work form renders its MOBILE branch (`#senor-work-form`, below `availWidth` 750) and not the desktop one, with its image field's `Upload Photo` exactly when the form has one · `MOB.952` the affixed `+`, the list's search and the burger at phone width; the header crew shortcut is hidden under 450px by design |

### Standalone — in no suite

`MOB.000_Login` / `MOB.440_Logout` establish and end a session. `MOB.200_Crew_Switch` mutates the session crew.
`MOB.346_Work_Scheduled_View` is unreachable for this crew (bugs §25). Two diagnostics: `MOB.978_DIAG_WorkList_Probe`,
and `MOB.977_DIAG_Condition_Form_Schema_Race`, which **asserts bugs §42** — a deep link to a work order, never `/work`,
so the condition form opens before the schema prefetch and its first armed Submit reaches nobody; the same form reopened
saves. It is red once §42 is fixed, and it is out of the schedule because §42 is a race. Outside the counts: `MOB.999_Verify_Scratch` (the `verify.py` harness) and `MOB.PDF_Upload_Recording`, which
exists only on Datadog — never delete it.

---

## What is deliberately NOT covered

| area | why |
|---|---|
| **The queue's link classes in isolation** (`SerializeLink` ordering, `ErrorLink`) | a **Jest** job, being done outside this suite; `MOB.913` covers the queue end to end in a browser |
| **The browser genuinely offline** | Synthetics cannot cut the network — the offline shell page and a real fetch failure are unreachable. The window event and the `onLine` override reach everything else |
| **Camera capture** | each button opens a native file dialog Datadog cannot dismiss |
| **The native shell bridge** | Expo shell only (`window.ReactNativeWebView`) |
| **Real GPS** | a browser has none; geolocation is stubbed where a test needs a position |
| **Delete controls** | never fired except the owner-named flows (trap 2) |
| **Session/JWT expiry** | cookie-authenticated; a browser step cannot expire it |

---

## Where the next real gain is

*Local replays (`local_run.py`, 0 Datadog runs) make gaps cheap to build; Datadog runs go to verification and the weekly
schedule. The owner decides the order.*

1. **A dedicated bugs §42 repro** — deep-link the fixture without visiting `/work` first; nothing detects §42 today.
2. **`MOB.600` goes green by itself when bugs §34 is fixed** — its suite expects only that failure; until then the create is unproven on the server.
3. **The weekly schedule** (#37) — turns capability into detection.
4. **Decisions and fixtures** — the AV job reset (`cleanup_spec.md` §4, five tests), bugs §41 (residue), a second
   work-order shape (estimate rows, a required form field, a second list status).

Genuinely offline, network errors, file choosers, the re-auth clock, the map canvas and the tus transport were out
of Datadog's reach; Playwright covers them now, except the map card's change-asset popup (▶ #84).

*Details: `testing_checklist.md` → ▶ OPEN WORK.*
