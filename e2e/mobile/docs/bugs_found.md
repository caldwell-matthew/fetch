# MentorTwo Mobile — Bugs & Findings

Defects in `MentorTwo/client/mobile` (and adjacent server code) that the Datadog Synthetics suite
surfaced. **App findings, not test problems** — a finding about a TEST belongs in
`testing_checklist.md` or `test_authoring.md`.

| Evidence | Meaning |
|---|---|
| **Runtime** | observed in a test run |
| **Source** | read in the code; mechanism clear, not observed failing |

**Rules for this file**
- Every status was read against `origin/development@9d80ad499c`. Re-read a row
  before acting on it once the sync line in `testing_checklist.md` has moved on.
- **🔧 fix pending** = a PR is open; delete the entry once it merges and the served code has it.
- **A fixed finding is DELETED** — entry and index row — and whatever cited it is reworded to
  state the fact directly. This is what is wrong now, not a history.
- **Numbers are never reused or renumbered** (other docs cite them). Gaps are expected: §1–§4,
  §4b, §4c, §5–§9, §14–§17, §19–§21, §23, §24, §26, §27, §30, §36, §41, §47. Dead code is not filed.
- File a finding the day it is found. A finding that lives only in a generator comment is lost.

## Index

| § | Finding | Evidence | Status |
|---|---|---|---|
| 11 | `Form added` toast fires before the mutation | Source | ❌ low · `AdHocForm.tsx:49` |
| 25 | How the crew's work list is populated | Reference | not a bug — the four server rules the checklist cites |
| 28 | The offline geolocate message sits behind a `disabled` element's `onClick` | Source + Runtime | ❌ `GeolocateButton.tsx:94` |
| 29 | A Mapbox failure makes Geolocate fail silently | Source | ❌ `reverseGeocode` has no `ok` check or `catch` |
| 31 | A deploy takes over a running session silently and deletes its cache | Source | ❌ no `controllerchange` handler in `client` |
| 32 | Work-stage Docs upload gated on `asset.create` | Source | ❌ `Attachments.tsx:126` |
| 33 | Material Lookup shows at most 500 items under a label counting all | Runtime | ❌ 996 items, 500 rows |
| 34 | **Collecting an asset WITH a photo from a browser never reaches the server** | Runtime + Source | 🛑 `MOB.600`'s server proof is red until fixed |
| 35 | Clicks inside the row-avatar modal toggle the row behind it | Runtime + Source | ❌ `MOB.624` sentinels it |
| 37 | Asset Lookup's `Scan Barcode` does nothing in a browser | Runtime + Source | ❌ `MOB.750` sentinels it |
| 38 | The collector's sort is saved under the AV job list's key | Runtime + Source | ❌ `MOB.625` sentinels it |
| 39 | A record-field `includes` filter is saved with no value | Runtime + API + Source | ❌ `MOB.807` sentinels it |
| 40 | **A rejected add or edit looks saved** — the server's refusal is swallowed | API + Source | 🛑 `addToCollection` / `updateCollectionRecord` |
| 42 | **A condition or failure form's first Submit after a page load does nothing** (add and `Edit Item`) | Runtime + Source | ❌ unchanged on `origin/development` `9d80ad499c` — **reproduced by `MOB.977_DIAG_Condition_Form_Schema_Race`**, which is red when the bug is gone |
| 43 | An offline menu item's connection message flashes and vanishes with the menu | Runtime + Source | ❌ `MOB.626` / `MOB.914` sentinel it |
| 44 | Creating a tag on a saved photo never attaches it | Runtime + Source | ❌ `ui/PhotoCarousel/Tags/index.tsx:77-89` → `handleTagAssign` `:51-52` looks the new tag up in the pre-create list — still on `f208805e08`; `MOB.627`'s sentinel red 2026-09-24 |
| 45 | Expanding an asset row on a work order's Assets tab — or in Asset Lookup before its schema answers — can crash the page | Runtime | ❌ `WorkOrders/components/Assets/index.tsx:42-45,221` passes an uncached schema, `AssetLookup/index.tsx:86,351` an unanswered one; `AssetLookupDetails/index.tsx:43` maps it unguarded |
| 46 | A General Info save resubmits every field, so one invalid field blocks the whole form — and the toast still says `Record Updated` | Runtime | ❌ `GeneralInfo.tsx:61,77-85`; `InsertForm/utils/index.ts:150-161` copies every `allowUpdate` field, dirty or not |
| 48 | `Item added` is shown for a save the server refused | Runtime | ❌ low–medium · `ui/NewItemForm.tsx:89` · `MOB.923` pins it |
| 49 | `Extend session` succeeds but tells the user `The operation was aborted.` | Runtime | ❌ medium · `Layout/Auth.tsx:38-58` · `MOB.925` pins it |
| 50 | "Add to Work" from a map card offers only the first 50 of the crew's work stages, ignores typing, and offers stages that already hold the asset | Runtime + Source | ❌ medium · `InsertForm/schemas.ts:27-40` |

## §11 · `Form added` toast fires before the mutation

`WorkOrders/components/Forms/AdHocForm.tsx:49`

```js
toast.success('Form added');
client.mutate({ ... });
```

The success toast is shown before the mutation is even sent, and nothing reports a rejection, so a form the
server refused is still announced as added. **Severity:** low — only a server rejection exposes it.
**Tests:** a toast proves the handler ran, not persistence (trap 7).

## §13 · Escape discards the whole new-asset form

`AssetCollector/index.tsx:263-275` sets `closeOnClickOutside={false}` on the "Get New Asset"
modal and leaves `closeOnEscape` at Mantine's default `true`. Escape discards every field and
photo, without confirmation — and cascades: with the "Select Photo Source" picker open on top,
one Escape closes both.
The modal does not set `keepMounted`, so closing unmounts `NewAssetForm` and what was typed is gone. (The X
loses the form the same way, which is presumably intended.)
**Runtime:** `MOB.600` pressed Escape to leave the picker and its next step found no form.
**Reach:** on a phone or tablet webview nothing sends Escape — only a hardware keyboard, or a desktop
browser, can trigger it. **Severity:** low.
**Fix:** `closeOnEscape={false}` on the outer modal, matching the click-outside guard.

## §25 · How the crew's work list is populated — reference, not a bug

`server/.../getWorkStages/utils/getCrew.ts`. With `crew: '<SESSION>'` (what mobile always sends)
a work stage is returned only if **all** hold:

1. **Assigned to the session's role** (`workstageassignment.roleId`) — a crew is a role.
2. **Status `In Progress`, `On Hold` or `Ready`** — or `Complete`/`Pending` inside the retention
   window (`mobilejobtemplate.workRetentionHours`, default 48h, needs a mobile template).
   `Canceled`, `Requested`, `Not Completed`, `Superseded` are **never** returned.
3. **Not a mobile job's work stage** (`NOT EXISTS mobilejob.workStageId`) — deliberate.
4. **If the role's `mobileDownloadMode` is `SCHEDULED`**, a `scheduledevent` within ±7 days.
   Default is `ASSIGNED`.

The generic status filter at `getWorkStages/index.ts:32-35` is skipped for `<SESSION>`. Do not
"fix" an empty list by relaxing these rules — 2 and 3 are deliberate. The checklist's `MOB.346`
row and fixture check 10 (the fixture must end `Ready`) rest on rules 2 and 4.

## §28 · The offline geolocate message sits behind a `disabled` element's own `onClick`

`ui/GeolocateButton.tsx:103-116` renders `OFFLINE_FEATURE_MESSAGE` in a `Popover` (the control itself is
`:80-95`) opened only by the
control's own `onClick` — on a control that is `disabled={!online}` and `component="span"`.

The click does fire (`MOB.911` is green), but only because of three details: `disabled` is inert
on a `<span>`; Mantine's disabled ActionIcon style has no `pointer-events: none`
(`ActionIcon.css:59`); and neither `ActionIcon` nor `UnstyledButton` guards `onClick`. Any one
changing removes the only path to the message, silently.
**Accessibility:** a `<span disabled>` is not focusable and exposes no `aria-disabled` — keyboard
and screen-reader users cannot reach the explanation.
**Fix:** host the popover on a wrapper or keep the control enabled; add `aria-disabled` and a
focusable host.

## §29 · A Mapbox failure makes Geolocate fail silently

`ui/GeolocateButton.tsx:122-127`

```js
async function reverseGeocode(lng, lat) {
    const q = await fetch(`https://api.mapbox.com/.../${lng},${lat}.json?...`);
    const results = await q.json();   // no ok-check, no try/catch
    return results.features;
}
```

It runs inside the `getCurrentPosition` success callback, whose promise nobody holds. If Mapbox is
down, rate-limits, or returns a non-JSON body, the promise rejects unhandled and `onResult` never
fires: the user taps Geolocate and nothing happens. The geolocation error path logs, and
`ProximityMenu` toasts — only the third-party hop is unguarded.
**Fix:** check `q.ok`, `try/catch`, and on failure still call `onResult` with the coordinates and
a null address, plus a toast.

## §31 · A deploy takes over a running session silently — and deletes the cache it was using

`workers/sw.js`: `skipWaiting()` in `install`, `clients.claim()` in `activate` after
`cleanupCaches()`, which deletes every `apm-mobile-*` cache but the new `CACHE_NAME`.
`workers/register.ts` registers at `/apm-mobile` with no `updatefound`/`waiting` handling, and no
`controllerchange` handler exists anywhere in `client`.

So a mid-session deploy swaps the worker under the open page, which keeps running the OLD bundle.
Only the new version is precached, so a route chunk the old page lazy-loads later must come from
the network under its old filename — if the deploy does not keep old assets served, the user gets
a chunk-load error mid-task with no explanation. `skipWaiting` is a legitimate choice; the
**silence** is the risk. It also interacts with the offline queue (`graphql/links/`).

Navigations are network-first with a cached offline shell (`/apm-mobile/?offlineShell=1`) falling
back to a hard-coded *"You are offline"* page — unreachable from Synthetics, where the browser
never really goes offline.
**Fix (one of):** drop `skipWaiting()` and prompt "Reload to update"; or listen for
`controllerchange` and reload; or confirm old versioned assets stay served and document it.

## §32 · Work-stage Docs upload gated on `asset.create`

`DetailPage/Attachments.tsx:126` vs `WorkStageAttachments.tsx:32,135` — two halves of one panel
attach to the **same work stage** under different permissions:

```tsx
<Attachments canAddPhotos={workPerms} … />                    // Photos: work.update
sessionData?.session?.me.role.permissions.asset.create &&      // Docs:   asset.create
    <FileButton onChange={addFiles} multiple accept="*/*"> … Add File …
```

`AttachmentTable` is shared with `FileAttachments`, where the parent is an asset — likely a
leftover. A role with `work.update` but not `asset.create` can add photos but no documents; the
reverse can upload documents to a stage it may not modify. Not observed — `Admin` holds both.
**Fix:** pass the gate in from the call site, as `canAddPhotos` is.

## §33 · Material Lookup renders at most 500 items under a label counting all of them

`MaterialLookup/index.tsx` queries with `limit: 500`, never pages, and renders
`${pageInfo.totalCount} matches`. `Central Storeroom` has 996 items: **500 rows under "996
matches"**, nothing hinting at the rest. Sorting is server-side, so it changes *which* 500 show.
**Tests:** `MOB.855` asserts `rows == min(matches, 500)`.
**Fix:** raise the limit, page, or say "showing 500 of 996".

## §34 · Collecting an asset with a photo from a browser never reaches the server — the UI says it did

**Mechanism.** `AssetCollector/utils/createAsset.ts` sends `MOBILE_COLLECT_ASSET` with
`context.thumbnails` when photos are attached. `UploadLink.ts` handles that by calling
`callNative('UPLOAD_THUMBNAILS')` and forwards the operation only when the bridge answers.
Outside the Expo shell `window.ReactNativeWebView?.postMessage` is skipped, the promise never
settles, and the mutation is never sent. Meanwhile the `optimisticResponse` fills the cache,
`prependTableResults` puts the row at the top of the list, the toast fires and the form closes.

**Evidence.** The owner saw on desktop that the newest `DD SYNTHETIC MOBILE` asset was dated
Aug 24 while `MOB.600` "passed" Sep 8–9; the server-side list agreed.

**Scope.** Adding a photo to an EXISTING record works in a browser — `DetailPage/utils/uploadPhoto.ts`
tus-uploads via `context.uploads` (its comment explains why), and `MOB.623` measures it. Collecting
**without** a photo persists. Only create-with-photo is stuck, because `createAsset.ts` never got
that browser branch.

**Fix.** Give `createAsset.ts` `uploadPhoto.ts`'s branch: tus-upload via `context.uploads` when
`!window.ReactNativeWebView`; reserve `thumbnails` for the shell.
**Tests.** `MOB.600` ends with a `network-only` Asset Lookup search for its own name — red until
fixed. It is `soft`, so `MOB.967`'s later children still run. **Never make it `optional`.** `MOB.967` is held out of the Datadog passes while this is open — it would spend 5 runs a pass re-confirming it.
🛑 **A LOCAL REPLAY CANNOT EXERCISE THIS, AND PASSES.** `local_run.py` cannot resolve the
`Open the photo picker ("Add Asset Photo")` step — it is a recorded-element click with no
`userLocator`, so there is no xpath to follow — and the `uploadFiles` step that follows never
finds its input. No photo is attached, the asset is created photo-free, and, per **Scope** above,
that path persists: the server proof then PASSES. Measured 2026-09-15 — local `MOB.967` red on
the picker with a green server proof, Datadog `MOB.600` green on the picker with a red server
proof (2 runs). ➡️ **Only a Datadog run can confirm or clear this finding.**

## §35 · Every click inside the row-avatar modal toggles the accordion row behind it

`AssetCollector/index.tsx:176` renders `<AssetAvatarWithModal>` inside
`<Accordion.Control component="span">`. Mantine portals the modal into `body`, but **React
propagates events through the React tree**, so every click inside the modal reaches the
control's `onClick`. The avatar's own handler stops propagation (`AssetAvatarWithModal.tsx:30`);
nothing inside the modal does.

**Runtime (`MOB.624`):** row collapsed after the modal opened; three clicks inside (Photos, Docs,
`Done`) left it expanded. The list state is decided by tap parity in an unrelated modal.
`AssetVerification/JobAccordianControl.tsx` and `WorkOrders/components/Assets/index.tsx` render
the same component the same way — unmeasured.
**Fix:** `onClick={e => e.stopPropagation()}` on the modal content, or lift the modal out of the
control. **Tests:** `MOB.624` restores the row; its `optional` sentinel flips when fixed.

## §37 · Asset Lookup's `Scan Barcode` does nothing in a browser

`AssetLookup/TagLookup/index.tsx`: `Scan Barcode` calls `launchScanner()` →
`callNative({ type: 'LAUNCH_CAMERA' })` with no browser branch; outside the shell nothing is sent
and the promise never settles (§34's mechanism). The menu closes; nothing else happens, and a
never-settled promise plus a `BARCODE_SCAN_RESULTS` listener leak per tap.

The item beside it, `Alphanumeric`, checks `window.ReactNativeWebView` and falls back to a file
dialog; the collector's `CaptureTagIcon.tsx:38` offers `Scan Barcode` only inside the shell.
Asset Lookup is the one place it is offered where it cannot work.
**Fix:** render it only when `window.ReactNativeWebView` exists, or add a browser branch.
**Tests:** `MOB.750`'s `optional` sentinel; when fixed, its menu assertion becomes `Alphanumeric`
alone.

## §38 · The collector's sort is saved under the Asset Verification job list's key

`SortDropDown` persists picks to `sessionStorage['mobile-${model}-sort']` (`ui/SortDropdown.tsx:88`),
and the collector passes **`model="MobileJob"`** (`AssetCollector/index.tsx:137`). The collector
never reads it back; the AV job list does, on mount (`AssetVerification/index.tsx:33-40`), and
`RecordCyclingButtons` orders job cycling by it.

**Runtime (`MOB.625`):** `Name ▼` on the collector → the job list opens sorted `Mobile Job Name ▼`.
`Collected By Me` stores `{ id: 'createdBy' }`, which the job list applies as a creator-name sort
while its picker shows **nothing** — a rule the screen cannot display.
**Fix:** a dedicated key (e.g. a `storageKey` prop — `model="Asset"` would collide with
`Job.tsx:223`), or stop persisting a sort the collector never restores.
**Tests:** `MOB.625`'s two `optional` sentinels; it stashes and restores the key `always`.

## §39 · A record-field `includes` filter is saved with no value

With `includes` / `does not include`, `RecordMultiSelect` hands the form an **array of ids**.
`addFilter` (`ui/StructuredQuery/index.tsx:100-106`) builds the value as
`vals.value?.label || vals.value?.name` — written for a single object — so an array saves
`value: undefined`, and `filterToCondition` sends `{ column: 'typeId', operator: 'IN' }` with no
value.

**Measured against the API** (Asset Lookup's query, 303 assets):

| condition | returned |
|---|---|
| none | 303 |
| `typeId IN` with no value — what the app sends | **303** — ignored |
| `typeId IN [<id>]` — the ids the selector holds | 0 |
| `typeId IN ['Pump']` — names | 49 (correct) |

Broken twice: the value is dropped, and the ids would match nothing — the server compares names.
All 20 `record` fields on `Asset` are affected (Asset Type, Crew, Department, …); `equals` works.
**Fix:** map the selected ids to their option labels and save the array of names.
**Tests:** `MOB.807`'s record leg carries two `optional` sentinels; when fixed it should assert the
list narrowed, as its `enum` leg does.

## §40 · A rejected add or edit looks saved — the card appears, the modal closes, the refusal is swallowed

`WorkOrders/utils/addToCollection.ts` passes an `optimisticResponse` and calls `done()` (which
closes the modal) inside `update()`. Apollo runs `update()` first with the OPTIMISTIC result, so
the modal closes and the card appears before the server answers. A server error then rolls the
card back, and `mutate()` has no `onError`/`catch` — nothing is shown. The same shape serves every
`addToCollection` caller (Conditions, Failures, `NewItemForm` — notes and charges) and
`updateCollectionRecord` (every card's `Edit Item`).

**How it showed.** The server refuses a duplicate by design — `WorkStageCondition.unique` is
`[org, workStageId, assetId, assetStandardDetailId, inspectionElementId]`, `WorkStageFailure.unique`
`[org, workStageId, failureTypeId, repairTypeId, rootCauseTypeId]`, surfaced as
`"Duplicate record found"` (`queryErrorHandler.ts:25-27`). `MOB.390`/`391` re-submitted the same
key every run and stayed green; the fixture's condition and failure were each **1 row, dated
2026-08-10**, while the same runs' charges and notes piled up. Replaying the payload over the API
returned the refusal. The uniqueness rule is not the bug; the silence is.

**User-visible effect.** Record a condition that already exists for that asset and element: the
form closes, the card flashes in and disappears, nothing says why.
**Fix:** call `done()` on the server result (the awaited `mutate()` or `onCompleted`, not
`update()`), and toast the error — ideally "This condition already exists …; edit it instead."
**Tests:** a closed modal proves nothing on these paths (trap 6). `MOB.390`/`391` now add a key the
fixture lacks and prove it after a reload; the charge tests and `MOB.392` count their records
across a reload.

## §42 · A condition or failure form's first Submit after a page load does nothing — its schema is built before it loads

`ConditionForm` (`WorkOrders/components/Conditions/Form.tsx:88`) passes `schemaData?._info?.fields ?? []`
to `useCustomForm` while `GET_SCHEMA('WorkStageCondition')` is still loading. `useFormWithValidation`
(`components/utils/hooks/index.ts:56-62`) builds its zod schema in a `useMemo` whose deps are
`[withDynamicSchema ? formFields : undefined]` — `[undefined]` here — so the schema is built once, from
`[]`, and never rebuilt when the fields arrive. An empty zod object is always valid (Submit arms) and
strips every key: `handleSubmit` hands the submit handler `{}`, and its
`if (!values.assetId || !values.assetStandardDetailId || !values.inspectionElementId) return;` exits.
No request, no error; the modal stays open.

**How it showed.** `MOB.386`: Condition Left 2 → 4, Submit armed, clicked — the modal
never closed and the server still held 2. Local probes, first open in a fresh browser session, 8 of 8:
react-hook-form reports `isSubmitSuccessful: true` with no errors; the page's `ApolloClient` receives no
`query` or `mutate`; the form's resolver returns **0 of the 8** values the form holds. Closed and
reopened on the same page (schema now cached): the resolver returns all 8, `UPDATE_WORKSTAGE_CONDITION`
goes out (200) and the modal closes.

**The add path, both forms.** On Datadog `MOB.390` (add a condition) failed 2 of 3 runs and `MOB.391` (add a
failure) 3 of 3 — a race, not a certainty: `MOB.390`'s third run submitted and passed end to end. Each failure: Submit armed and clicked, the modal never closed, nothing reached the server. A read-only
local probe, after a page load: the resolver on each untouched add form reports **no** required-field
errors (`isValid: true`); closed and reopened it reports `assetId`, … (`isValid: false`) — the empty-schema
signature. Local replays usually win the race (both had passed locally); Datadog loses it most of the time.

**The failure edit path.** `MOB.385` (failure card's gear → `Edit Item`, Repair Type `MISSED` → `REPAIR`): locally red 2 of 2 replays at the save proof, and on Datadog 1 of 1 (2026-09-15). A probe, first open after a page load: Submit armed and clicked, no `/graphql` operation, the modal stayed open, the server held `MISSED`; closed and reopened, `UPDATE_WORKSTAGE_FAILURE` went out and the server held `REPAIR` (`Failures/Form.tsx:57`, the guard `if (!values.assetId) return;` at `:154`).

**User-visible effect.** Open a work order, add a condition or a failure — or a condition or failure card's gear →
`Edit Item` — and Submit:
nothing happens, however often it is tapped, until the form is closed and reopened.
**What avoids it.** `/work`'s prefetch loads `WorkStageCondition` and `WorkStageFailure` among its schemas
(`WorkOrders/utils/prefetchData.ts:26-36`). A form opened after that prefetch finishes has its schema from the
cache and saves on the first Submit; the race needs the form to open first — a deep link, or leaving `/work`
early. Measured on Datadog 2026-09-16: `MOB.390`/`391`/`385`/`386` all passed once their suites waited for the
prefetch (`work_list_gate`), on the same app code that failed them before.
**Not measured:** whether a returning user's persisted Apollo cache already holds `GET_SCHEMA` at first
mount.
**Both forms:** `Conditions/Form.tsx:88` and `Failures/Form.tsx:57` build their forms the same way — both confirmed above.
**Fix:** pass `withDynamicSchema: true` from both forms, or render the form body only once `GET_SCHEMA`
has resolved, so `useCustomForm` first runs with the fields.
**Tests:** ⭐ **`MOB.977_DIAG_Condition_Form_Schema_Race` reproduces it** (built 2026-09-17): a deep link to
`/work/<id>` — never `/work` — then `Edit Item`, Condition Left 2 → 4, an ARMED Submit, and the server still
holding 2 with the modal open; then the same form reopened with `GET_SCHEMA` cached, which saves. It asserts the
BUG, so **it goes red when §42 is fixed** — at which point delete it, delete this row, and drop the `soft`
sentinels below. It is deliberately in no scheduled suite: §42 is a race (the add path failed 2 of 3 and 3 of 3
runs), so a single red run means read the source, not that the bug is gone.
`MOB.386`/`385` (first `Edit Item` save) and `MOB.390`/`391` (first add) keep their `soft` sentinels, but inside
`MOB.956`/`MOB.957` they open the forms after `/work`'s prefetch, so they pass while the bug stands.

## §43 · An offline menu item's "requires an internet connection" message flashes and vanishes with the menu

Two menus show `OFFLINE_FEATURE_MESSAGE` in a `Popover` wrapped around a `Menu.Item`, inside the menu's
dropdown:
- `AssetCollector/Form/CaptureImageOptions.tsx:11-39` (`OfflineMenuPopoverItem`) — the collector's
  `Add Asset Photo` (browser) and `Take Photo` / `Select From Gallery` (native), in
  `<Menu closeOnItemClick>` (`:91`).
- `ui/PhotoCarousel/PhotoMenu.tsx:109-124` — a saved photo's gear, for items disabled offline
  (`Get Description`); its `<Menu>` (`:33`) keeps Mantine's default `closeOnItemClick`.

Offline, the item's `onClick` opens the popover, and Mantine 8.3.18's `Menu.Item` then closes the menu
anyway: `MenuItem.mjs:46-53` runs the app's handler, then `closeDropdownImmediately()`
(`createEventHandler` ignores `PhotoMenu`'s `preventDefault()` / `stopPropagation()`). The dropdown
unmounts and takes the popover with it.

**How it showed.** `Add Asset Photo` offline: the message rendered ~7 ms after the click and was gone by
200 ms (a `MutationObserver` recorder, local). `Get Description` offline (`MOB.914`, local): the recorder
saw the message; it was not on screen once the menu had closed.
**User-visible effect.** Offline, tapping one of these items just closes the menu — the explanation is
never readable, so the item looks broken.
**Not tested:** the native `Take Photo` / `Select From Gallery` items (same component, native branch).
**Fix:** keep the menu open for the offline tap — `closeMenuOnClick={online}` on these items (Mantine's
per-item override, `MenuItem.mjs:50-51`) — or show the message outside the dropdown (a notification).
**Tests:** `MOB.626` and `MOB.914` prove the message rendered with a recorder installed before the click;
each has an optional sentinel, "still on screen once the menu has closed", red while §43 is open.

## §44 · Creating a tag on a saved photo never attaches it

On a photo already saved to a record, the tag editor's `+ Create Tag '…'` runs `handleTagCreate`
(`ui/PhotoCarousel/Tags/index.tsx:77-89`): it gives the new tag an id (`uid()`), merges it into the tag list with
`updateQuery`, sends `CREATE_TAG`, then — with no `onTagModify` (the saved-photo branch) — calls
`handleTagAssign(attachmentId, tagId)`. `handleTagAssign` (`:49-52`) looks the id up in `tagOptions`,
the array from the render before `updateQuery` merged the new tag, finds nothing, and returns before
`ADD_TAG_TO_ATTACHMENT`. The unsaved-photo branch (`onTagModify`, `MOB.622`) passes the new tag object
directly and is not affected.

**How it showed.** `MOB.627`, local, 2 of 2 replays: the server held exactly one tag with the typed name
(`CREATE_TAG` landed), and about 25 s later the photo carried no tag — the editor listed the new tag in
its dropdown, with no pill and `EDIT TAGS (0`. Both created tags exist and are attached to nothing. On Datadog (`MOB.627`, 2026-09-15) the same sentinel was red and the test otherwise passed.
**Not measured:** network traffic — that `ADD_TAG_TO_ATTACHMENT` is never sent is read from the code.
**User-visible effect.** Creating a new tag on a saved photo seems to do nothing to the photo; the user has
to create it, then search for it and pick it again. Each attempt leaves an unattached tag in the org.
**Fix:** in `handleTagCreate`, attach with the tag it just built (`newTag`) instead of looking it up in
`tagOptions` — as the `onTagModify` branch already does.
**Tests:** `MOB.627` proves add and remove of an existing tag and the tag's creation over `/graphql`; its
optional sentinel, "the CREATED tag reached our photo", is red while §44 is open.

## §45 · Expanding an asset row on a work order's Assets tab can crash the page

The Assets tab reads the Asset schema from the cache only — `apolloClient.readQuery(GET_SCHEMA, { schema:
'Asset' })` (`WorkOrders/components/Assets/index.tsx:42-45`) — and passes `schemaQuery?._info?.fields`
to each row's `AssetLookupDetails` (`:221`). `/work` fetches that schema only when a listed work stage's mobile
template has an `ASSETS` section (`WorkOrders/utils/prefetchData.ts:74`, behind the `PREFETCHED_WORK_DATA`
guard at `:142-143`) — the fixture stage has none, so on a cold cache the prop is `undefined`, and `AssetLookupDetails` calls `fields.map` without a
guard (`AssetLookup/AssetLookupDetails/index.tsx:43`). The ErrorBoundary replaces the page.

**How it showed.** Local probe, twice, each in a fresh session (`/work` → the fixture work order → Assets
tab): no geolocate control appeared on the row in 60 s (`AssetGeolocate` renders nothing without the
schema), and clicking the row's chevron replaced the page with "Something went wrong. … Cannot read
properties of undefined (reading 'map')". Opening `Add Existing Asset` first fetches the schema; after
that the row expands normally.
**User-visible effect.** A user who opens a work order straight from the list and expands an asset on the
Assets tab loses the page to the error screen, until something else on the device has loaded the Asset schema.
**Fix:** query the schema instead of reading it from the cache (`useQuery(GET_SCHEMADocument, { variables:
{ schema: 'Asset' } })`), and render `AssetLookupDetails` only once the fields exist — or default `fields`
to `[]` there.
**Tests:** `MOB.354` gates on the rows' geolocate controls before expanding a row, so it cannot trip the
crash. `MOB.397` expands the first asset row to reach its gear menu, and **did trip it** — 1 of 2 local replays,
2026-09-17, at "Expand the first asset row", the page replaced by the error screen. It is now guarded the same way,
after first opening `Add Existing Asset` and closing it unused, since that picker's `useQuery` is what loads the
schema — a gate alone would wait on a schema nothing had asked for. `MOB.358` does **not** expand a row — but its step 10 fixture guard requires an asset row to render the
geolocate control, and `AssetGeolocate` renders nothing without the schema, so that is its exposure. Inside
`MOB.955` it runs last, after `MOB.347` opens the Assets tab — whether that loads the schema is not measured.

**Asset Lookup has the same hole.** It does query the schema (`AssetLookup/index.tsx:86`), but renders
`AssetLookupDetails` with `schema={s.data?._info.fields}` (`:349-352`) whether or not that query has answered. A row
expanded before it answers crashes the same way. **Runtime:** once, 2026-09-23, in `MOB.929`'s development runs
(a fresh session, Asset Lookup → search → expand at once); not reproduced on demand. The same guard in
`AssetLookupDetails` (`fields ?? []`, or render nothing until the fields exist) fixes both.
**Tests (continued):** `MOB.929`'s removal opens Asset Lookup in its fresh browser and waits for the schema in the
persisted cache before loading the work order (`test_authoring.md` trap 44).

## §46 · A General Info save resubmits every field, so one invalid field blocks the whole form — and the toast still says `Record Updated`

`GeneralInfo.updateRecord` builds its mutation variables with `sanitizeValues(fields, values, 'UPDATE')`
(`DetailPage/GeneralInfo.tsx:61`). That helper copies **every field with `allowUpdate`, dirty or not**
(`InsertForm/utils/index.ts:150-161` — the loop's only skip is the `allowUpdate` flag). Editing the
Description therefore also resubmits the work order's `project`, `workCategory`, dates and the rest.

The server refuses a project reference whose project has no account: *"Project can not be referenced on a
work order without a valid account on the project record."* On dev **every** project has `accountId: null`
— all twelve, read over `/graphql`, 0 runs — so **no work order that references any project can save its
General Info form at all**, whatever field the user actually edited.

The user is told the opposite. The toast is fired from the mutation's `update()` callback
(`GeneralInfo.tsx:77-85`), and Apollo calls `update()` first for the `optimisticResponse`, before the
request goes out. The rejection arrives afterwards and rolls the cache back, but `Record Updated` has
already been shown and nothing replaces it. The same file's own comment at `:79-81` notes `update()` runs
twice; only the first, optimistic call is used.

**How it showed.** `MOB.957`'s Playwright trace, 2026-09-15. 175 ms after the click on
`button[form="mobile-genInfo"]` the page threw `CombinedGraphQLErrors` carrying that message; the optional
`Record Updated` assertion beside it passed. `MOB.395`'s post-reload proof then read the old value and went
red — correctly. A server read confirmed the precondition: work order `20260805-18-001`
(`EYRpYJ9QYdQ1JFF10JtB0Q`) referenced `Project One`, whose `accountId` was `null`.
**User-visible effect.** A user edits the description (or any General Info field) on a work order that has
a project, sees `Record Updated`, navigates away, and the edit is gone. No error is ever shown.
**Fix:** send only the dirty fields on `UPDATE` — the same file already has `isFieldDirty`
(`InsertForm/utils/index.ts:177-196`) — and fire the toast when the mutation resolves rather than from the
optimistic `update()`, surfacing the server's message on rejection.
**Tests:** `MOB.395` is the test that caught it, and it is the reason its proof is a reload rather than the
toast. The fixture work order's project reference has since been cleared so `MOB.395` can exercise the edit
path, so **MOB.395 no longer covers this finding** — reproduce it on any work order that still has a project.

## §48 · `Item added` is shown for a save the server refused

`WorkOrders/components/ui/NewItemForm.tsx:79-90`

```js
addToCollection({ ..., done: closeModal, formData: values })
  .then(() => { toast.success('Item added'); closeModal(); });
```

`addToCollection` (`WorkOrders/utils/addToCollection.ts`) awaits two cache reads, then calls `apolloClient.mutate(…)`
**without awaiting it** and returns. So the `.then` — and "Item added" — runs as soon as the mutation is SENT, before
the server answers. When the server refuses, the user is shown "Item added" and the server's error toast together,
and the optimistic item then disappears.

**Runtime (`MOB.923`):** a job note refused by the server (the refusal made in the browser, so dev never received
it) showed "Item added", then the error, then the note vanished; the server held no new note.
**Reach:** confirmed for job notes. The same form adds equipment, labor, material and other charges — likely the
same, not yet run. **Severity:** low–medium — only a refused save exposes it, but then the user is told both things.
**Same mistake as §11**, in the shared form rather than `AdHocForm`.

## §49 · `Extend session` succeeds but tells the user `The operation was aborted.`

`Layout/Auth.tsx`:

```js
:38  const handleReauthenticated = async () => { await getSess(); };          // the prompt awaits this
:57  onData(...) { if (event === 'UPDATE' || event === 'REFRESH') getSess()… } // the session subscription
```

When the password is accepted, the server re-issues the session and pushes a `sessionUpdate` **`REFRESH`** over the
websocket at the same moment. The re-auth's own `getSess()` and the subscription's run together; the first one's
promise is rejected with an `AbortError` (inferred: Apollo 4 rejects a lazy query's earlier `execute` when it is
called again — one request is sent, not two). `SessionReauthentication.submitPassword` treats that as a failure: it
shows `The operation was aborted.` and the prompt stays open.

**Runtime (`MOB.925`):** after "Extend session" the server's `expiresAt` moved on (the session WAS extended), while
the prompt showed the error. The trace: `/login/reauth/password` 200 → `GET_SESSION` sent → websocket `REFRESH`
within the same ~50ms → the error. The test reaches the prompt by moving the browser's clock; the race does not
involve the clock. **Severity:** medium — every successful extension tells the user it failed; they may retry or
log out. **Fix:** don't let the subscription's refetch reject the awaited one (ignore `AbortError` in
`handleReauthenticated`, or skip the subscription's `getSess` while a re-auth is in flight).

## §50 · "Add to Work" from a map card cannot reach most work orders

An asset's map card → `Add to Work` opens `AddAssetToWorkInsertForm`
(`WorkOrders/components/InsertForm/index.tsx:347-399`), whose only choice is the work stage. Its `loadOptions`
(`WorkOrders/components/InsertForm/schemas.ts:27-40`, read on `origin/development@6367f4980b`):

- sends `MOBILE_WORK_ORDERS` with `crew: '<SESSION>'` and no `page` — that query is fixed at `limit: 50`, sorted by
  `displayName` (`WorkOrders/queries/index.gql.ts:264-265`), so only the **first page** is ever offered;
- ignores `inputText`, so typing a work order's name filters those 50 on the client at best and never asks the server
  for the rest;
- filters with `o.assets?.find((a) => a.id === formValues.assetId.id)`, comparing a work-stage **asset link's** id
  with the **asset's** id — they never match, so a stage that already holds the asset is still offered;
- labels each option with the stage's `name` alone (`desc` goes to `_info`), so stages with the same name look the same.

**Runtime (2026-09-23, local, `MOB.929` development and `mobile/probe/picker_order_probe.spec.ts`):** the test account's
crew has **452** work stages; the picker listed 50. Work order `20260910-16` sorts onto page 9 and could not be
picked by scrolling or by typing. Seven of the 50 options read `☢️ Datadog Test` with nothing to tell them apart.
The link-id comparison is Source only — not driven to a duplicate add.
**User-visible effect:** a user on a crew with more than 50 work stages can add an asset from the map only to the
50 that sort first. The work order they want is usually missing, and nothing says the list is cut short.
**Severity:** medium — the feature is new to mobile (2026-09-21), and on real crews it mostly can't be used.
**Fix:** pass `inputText` to the server (a name/number search) and page with `fetchMore`, or use the lookup the
other record pickers use; compare `a.assetId.id` with the asset's id; show the work order's number or
description next to the stage name.
**Tests:** `MOB.929` works around it — it links to a test-made work order on the first page, picked by its place
in the list, and a route aborts any add for another stage.
