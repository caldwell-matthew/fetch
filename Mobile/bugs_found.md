# MentorTwo Mobile — Bugs & Findings

Defects in `MentorTwo/client/mobile` (and adjacent server code) that the Datadog Synthetics suite
surfaced. **App findings, not test problems** — a finding about a TEST belongs in
`testing_checklist.md` or `test_authoring.md`.

| Evidence | Meaning |
|---|---|
| **Runtime** | observed in a test run |
| **Source** | read in the code; mechanism clear, not observed failing |

**Rules for this file**
- Every status was read against the served code, `origin/development@db49958d6e`. Re-read a row
  before acting on it once the sync line in `testing_checklist.md` has moved on.
- **🔧 fix pending** = a PR is open; delete the entry once it merges and the served code has it.
- **A fixed finding is DELETED** — entry and index row — and whatever cited it is reworded to
  state the fact directly. This is what is wrong now, not a history.
- **Numbers are never reused or renumbered** (other docs cite them). Gaps are expected: §1–§4,
  §4c (§4b remains), §5–§9, §14–§17, §19, §23, §26, §27, §36. Dead code is not filed.
- File a finding the day it is found. A finding that lives only in a generator comment is lost.

## Index

| § | Finding | Evidence | Status |
|---|---|---|---|
| 4b | `WorkCollectionMenu` gates on a permission field that does not exist | Source | 🔧 **fix pending** — PR open; `ui/Menu.tsx:30` reads `wPerms.canDelete` until it merges |
| 10 | Mobile job status only moves forward | Runtime | ❌ `VerificationCheckbox.tsx:44` never reverses `COMPLETED` |
| 11 | Verification toast fires before the mutation | Source | ❌ `VerificationCheckbox.tsx:24` |
| 12 | Asset detail route implements 6 of 16 template section types | Source | ❌ latent |
| 13 | Escape discards the whole new-asset form | Runtime | ❌ `AssetCollector/index.tsx:264` guards click-outside only |
| 18 | `SubmitButton` ignores a label passed as children | Source | ❌ cosmetic, latent |
| 20 | Submitting search discards active structured filters | Runtime | ❌ `MOB.820` pins it |
| 21 | Permits tab renders blank with no permits | Source | ❌ `Permits.tsx` |
| 22 | `useMediaQuery` called inside a loop callback | Source | ❌ `SegmentedControlWithIcons/index.tsx:16` |
| 24 | `Supersesed` misspelling in the status legend | Source | ❌ `StatusSummary/index.tsx:45` — likely unreachable on mobile |
| 25 | How the crew's work list is populated | Reference | not a bug — the four server rules the checklist cites |
| 28 | The offline geolocate message sits behind a `disabled` element's `onClick` | Source + Runtime | ❌ `GeolocateButton.tsx:94` |
| 29 | A Mapbox failure makes Geolocate fail silently | Source | ❌ `reverseGeocode` has no `ok` check or `catch` |
| 30 | The offline queue's link classes have no Jest tests | Source | ⚠️ Synthetics half covered by `MOB.913`; Jest being done elsewhere |
| 31 | A deploy takes over a running session silently and deletes its cache | Source | ❌ no `controllerchange` handler in `client` |
| 32 | Work-stage Docs upload gated on `asset.create` | Source | ❌ `Attachments.tsx:124` |
| 33 | Material Lookup shows at most 500 items under a label counting all | Runtime | ❌ 996 items, 500 rows |
| 34 | **Collecting an asset WITH a photo from a browser never reaches the server** | Runtime + Source | 🛑 `MOB.600`'s server proof is red until fixed |
| 35 | Clicks inside the row-avatar modal toggle the row behind it | Runtime + Source | ❌ `MOB.624` sentinels it |
| 37 | Asset Lookup's `Scan Barcode` does nothing in a browser | Runtime + Source | ❌ `MOB.750` sentinels it |
| 38 | The collector's sort is saved under the AV job list's key | Runtime + Source | ❌ `MOB.625` sentinels it |
| 39 | A record-field `includes` filter is saved with no value | Runtime + API + Source | ❌ `MOB.807` sentinels it |
| 40 | **A rejected add or edit looks saved** — the server's refusal is swallowed | API + Source | 🛑 `addToCollection` / `updateCollectionRecord` |
| 41 | **A work order created from mobile cannot be deleted** | API + Source | ❌ `removeWorkById` rolls back; blocks residue pruning |

---

## §4b · `WorkCollectionMenu` checks a permission field that does not exist

`WorkOrders/components/ui/Menu.tsx:29-30`

```js
const wPerms = sess?.session?.me?.role?.permissions?.work;
if (!wPerms.canDelete && !wPerms.update && !wPerms.create) return null;   // line 30
...
{ wPerms.delete && <Menu.Item ...>Delete Item</Menu.Item> }               // line 69
```

1. **`canDelete` is not a permission field.** The GraphQL type exposes `create · update · read ·
   delete` (`permissionGroup/schema/index.ts:46`). So the guard collapses to
   `!update && !create`, and a delete-only role gets no gear menu at all, although line 69 would
   render its Delete Item.
2. **Missing optional chaining.** Line 29 uses `?.`; line 30 dereferences `wPerms` unguarded. A
   role with no `work` entry throws a `TypeError` — a render crash, not a hidden menu.

**Fix:** `if (!wPerms?.delete && !wPerms?.update && !wPerms?.create) return null;`
**Status: 🔧 fix pending** — a PR is open. Delete this entry once it is merged and served.

## §10 · Mobile job status only moves forward

`AssetVerification/VerificationCheckbox.tsx:41-46`

```js
if (status === 'CANCELED' || status === 'CREATED') return;
if (assetsVerified === assets?.length && status !== 'COMPLETED') newStatus = 'COMPLETED';
if (assetsVerified && status === 'READY') newStatus = 'IN_PROGRESS';
```

The same `update` runs for verify and unverify, and no branch produces `READY` or reverses
`COMPLETED`:

| action | status after |
|---|---|
| verify first asset (from `READY`) | `IN_PROGRESS` |
| verify last asset | `COMPLETED` |
| unverify one / all | **still `COMPLETED`** |

**Impact:** a job reads `COMPLETED` while assets are unverified, and a mis-tap never returns a job
to `READY`. The status is the field that reports upward. (`assetsVerified` itself is correct — an
`@client` field recomputed on every read.)
**Tests:** the AV fixture is `IN_PROGRESS` with two assets and tests verify/unverify exactly one,
so neither branch fires. Verify-all needs `reset_av_fixture.py` (`cleanup_spec.md` §4).
**Fix:** recompute symmetrically — 0 → `READY`, partial → `IN_PROGRESS`, all → `COMPLETED`.

## §11 · Verification toast fires before the mutation

`AssetVerification/VerificationCheckbox.tsx:24`

```js
toast.success(`Asset ${flag ? 'verified' : 'unverified'}`);
client.mutate({ mutation: VERIFY_ASSETDocument, ... });
```

Nothing awaits or catches the result, so a rejected mutation still reports "Asset verified" — in
the module whose record says the asset was physically inspected. `AdHocForm.tsx:127` has the same
shape (`toast.success('Form added')` before its mutate).
**Tests:** a toast proves the handler ran, not persistence (trap 7).

## §12 · The asset detail route implements 6 of 16 template section types

`AssetVerification/AssetDetails.tsx:201-243` maps six `MobileJobTemplateSectionType` values
(`GENERAL_INFO`, `ATTRIBUTES`, `ATTACHMENTS`, `CONDITION`, `EVENT_READINGS`, `FAILURES`) of 16.
Any other section renders a selectable tab with an **empty panel** — no fallback, no warning.
`CONDITION`, `EVENT_READINGS` and `FAILURES` are further gated on `job.mobileJob.workStageId`, so
they are empty on a job with no work stage (the fixture job is one).

**Scope:** this is the `/asset-verify/:jobId/asset/:id` route only. The tabs users see on an
expanded row (`AssetLookupDetails/index.tsx:81`) are a hardcoded five and unaffected. Latent — the
owner says templates use a restricted set.
**Fix:** render a fallback for unhandled types; constrain the template editor to what each app
implements.

## §13 · Escape discards the whole new-asset form

`AssetCollector/index.tsx:263-275` sets `closeOnClickOutside={false}` on the "Get New Asset"
modal and leaves `closeOnEscape` at Mantine's default `true`. Escape discards every field and
photo, without confirmation — and cascades: with the "Select Photo Source" picker open on top,
one Escape closes both.
**Runtime:** `MOB.600` pressed Escape to leave the picker and its next step found no form.
**Fix:** `closeOnEscape={false}` on the outer modal, matching the click-outside guard.

## §18 · `SubmitButton` ignores the label passed as children

```jsx
export default function SubmitButton({ isValid, buttonText = 'Submit', onClick, ...btnProps }) {
    return <Button ... {...btnProps}>{buttonText}</Button>;
}
```

An explicit JSX child wins over a spread `children`, so
`<SubmitButton ...>Update Asset</SubmitButton>` (`EditForm.tsx:63-70`) renders `Submit`. Cosmetic;
callers using `buttonText` are unaffected. `MOB.710` matches either label, scoped to the modal.

## §20 · Submitting the search box discards every active structured filter

`AssetLookup/index.tsx`:

```js
line  62  useQuery   query: { conditions: [...(props.query || query || [])] }   // WITH filters
line 173  refetch    query: { conditions: [...(props.query ?? [])] }            // WITHOUT
```

`props.query` is set only when Asset Lookup is embedded, so on the standalone page the submit
refetches with `conditions: []` while the UI still shows `Filters (1)`. The handler also issues a
filtered request via `setSearchText`; the unfiltered response wins in practice.

**Runtime (`MOB.820`):** filter `Name contains ZZZZ-NO-SUCH-ASSET` hides `Pump 0102`; submitting
the search box brings it back with `Filters (1)` still displayed.
**Severity:** high — silently wrong data.
**Fix:** line 173 should match line 62.
**Tests:** `MOB.820` asserts the buggy behaviour and will fail when this is fixed — then flip its
assertions and delete this entry.

## §21 · The Permits tab renders a blank panel when there are no permits

`WorkOrders/components/Permits.tsx:9-12` maps the list with no empty case. Every sibling has one
(`No Warranties Found...`, `No asset attributes found.`); Permits shows nothing, so "no permits"
and "failed to load" look identical.
**Fix:** `if (!permits.length) return <Text>No Permits Found...</Text>;`
**Tests:** `MOB.394` depends on the permit the owner added to the fixture; if it is removed the
test fails on data.

## §22 · `useMediaQuery` is called inside a loop callback

`helper-components/SegmentedControlWithIcons/index.tsx:13-20` calls `useMediaQuery` from
`showDisplayLabel`, conditionally, inside `options.map` — breaking the Rules of Hooks twice
(conditional, variable count). Hook state is positional, so labels can render as text or bare
icons nondeterministically, and the drift can affect other hooks in the component.
**Fix:** hoist it — `const wide = useMediaQuery(...)` in the body, then
`showDisplayLabel = v => minWidth == null || wide || v === selectedValue`.
**Tests:** `av_job_gate` matches the radio input (`//label[.//input[@value="All"]]`), never the
visible label. `build_verify_tests.py`'s `filt()` still matches text for `MOB.500`–`530`.

## §24 · `Supersesed` misspelling in the status legend

`WorkOrders/components/StatusSummary/index.tsx:45` — `Superseded: { status: 'Supersesed', … }`.
The key is right, so counting works; the display string (legend label and tooltip) is wrong.
**Reachability:** `WorkStatusSummary`'s only caller is the work list, and the crew query never
returns a `Superseded` stage (§25 rule 2) — so on mobile the label is probably never rendered.
**Fix:** `'Superseded'`. No test asserts it; one that does should match the exact string.

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

The generic status filter at `getWorkStages/index.ts:30` is skipped for `<SESSION>`. Do not
"fix" an empty list by relaxing these rules — 2 and 3 are deliberate. The checklist's `MOB.346`
row and fixture check 10 (the fixture must end `Ready`) rest on rules 2 and 4.

## §28 · The offline geolocate message sits behind a `disabled` element's own `onClick`

`ui/GeolocateButton.tsx:80-95` renders `OFFLINE_FEATURE_MESSAGE` in a `Popover` opened only by the
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

## §30 · The offline queue's link classes have no Jest tests

`client/mobile/graphql/links/__jest__` holds only `UploadLink` and `TusUnauthorizedRetry`.
`QueueLink`, `PersistedQueueLink`, `SerializeLink`, `ErrorLink` and `workers/` have none — the
offline-first queue, the feature whose failure loses user work.

**Synthetics half: covered by `MOB.913`.** In a browser the queue gates on the window
`online`/`offline` events (`gateQueueLinkOnNetworkChange`), so a dispatched `offline` holds a real
mutation; `MOB.913` proves it held, counted, listed, drained, and replayed from IndexedDB after a
reload. **Jest half: being done outside this suite.** Delete this entry when it lands.

## §31 · A deploy takes over a running session silently — and deletes the cache it was using

`workers/sw.js`: `skipWaiting()` in `install`, `clients.claim()` in `activate` after
`cleanupCaches()`, which deletes every `apm-mobile-*` cache but the new `CACHE_NAME`.
`workers/register.ts` registers at `/apm-mobile` with no `updatefound`/`waiting` handling, and no
`controllerchange` handler exists anywhere in `client`.

So a mid-session deploy swaps the worker under the open page, which keeps running the OLD bundle.
Only the new version is precached, so a route chunk the old page lazy-loads later must come from
the network under its old filename — if the deploy does not keep old assets served, the user gets
a chunk-load error mid-task with no explanation. `skipWaiting` is a legitimate choice; the
**silence** is the risk. It also interacts with the offline queue (§30).

Navigations are network-first with a cached offline shell (`/apm-mobile/?offlineShell=1`) falling
back to a hard-coded *"You are offline"* page — unreachable from Synthetics, where the browser
never really goes offline.
**Fix (one of):** drop `skipWaiting()` and prompt "Reload to update"; or listen for
`controllerchange` and reload; or confirm old versioned assets stay served and document it.

## §32 · Work-stage Docs upload gated on `asset.create`

`DetailPage/Attachments.tsx:124` vs `WorkStageAttachments.tsx:32,135` — two halves of one panel
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
fixed. It is `soft`, so `MOB.994`'s later children still run. **Never make it `optional`.**

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
`"Duplicate record found"` (`queryErrorHandler.ts:17-20`). `MOB.390`/`391` re-submitted the same
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

## §41 · A work order created from mobile cannot be deleted — `deleteWorkOrders` rolls back

`deleteWorkOrders(ids)` → `Work.removeWorkById` (`server/src/controllers/work/work/delete/index.ts`),
the mutation desktop uses. For every test-created work order tried (oldest, middle and newest of
176) it returns `null` with

```
Unexpected error value: "1 rows were not deleted. DELETE FROM workstagelog … DELETE FROM workstage …
DELETE FROM worknote … DELETE FROM [work] WHERE id = @p19 AND org = @p20 - "
```

— the batch of `DELETE`s and, after ` - `, no driver reason. The transaction rolls back (re-read
over the API). None of these has charges, a schedule entry, a condition or a failure — the four
refusals checked first — so the failure is inside the batch.
**Likely cause (unconfirmed):** a table referencing `workstage`/`work` that the batch does not
clear first; the error text drops the driver's message, so which one is not visible.
**Impact:** deleting such a work order from desktop fails the same way. Test residue cannot be
pruned (187 work orders since Aug 5, ≈5/day).
**Fix:** include the driver's error in the message, find the referencing table, add it to the
batch (or cascade).

Yes, this one is real, and it isn't specific to mobile. Two separate defects combine to produce what you saw.

1. The driver's reason is lost (confirmed from the library code).

A foreign-key violation returns two server errors: 547 ("DELETE statement conflicted with the REFERENCE constraint …") and 3621 ("The statement has been terminated").
When tedious 19.2.1 gets more than one error, it replaces them with new AggregateError(this.errors), which has no message (node_modules/tedious/lib/token/handler.js:297).
Knex then sets the message to sql + ' - ' + err.message, so it ends in " - " with nothing after it.
deleteWorkOrders calls String(error) on that, so the real reasons are left sitting unused in err.errors.
2. The delete batch doesn't clear tables that point at the stage (confirmed on the dev database). I ran read-only catalog queries against the dev DB in .env:

No cascades. There are 42 foreign keys pointing at work/workstage, and every one is NO_ACTION.
Two are always written at creation and never deleted:
workstagecertification: copied from the workflow at creation since e1e1c98840 (2025-09).
workstageeventreading: copied at creation since c9481998c2 (2026-05, the mobile job event-reading MVP).
The batch in delete/index.ts:55-79 dates from 2024-11, so it never picked up either table.
So: any work order whose workflow has stage certifications or event readings can't be deleted, from desktop or mobile. DELETE FROM workstage fails, then DELETE FROM [work] fails, and the whole transaction rolls back.
How widespread it is on the dev DB, for work orders created since Aug 5:

Org	Work orders	Blocked by
SMCT2	693	event readings (628), certifications (56)
MUPPET	68	certifications (16), external resources (38)
MENTOR	63	certifications (4)
Some work orders are also blocked by tables that hold genuine work records rather than copied setup: actual labor, material and equipment (workstagelabor, workstagematerial, workstageequipment), workstageexternalresource, and follow-up work orders created from the stage.

One gap: no org on this database has about 187 work orders since Aug 5. Your test run is probably on a different database or deployment, so I haven't confirmed which table blocks your residue. With one of your work-order ids and the environment it's on, a single query will name the table.

A side effect worth fixing at the same time: deleteAttachments calls deleteFromS3 (delete/index.ts:141) before the batch that fails. So each failed delete permanently removes the work order's untagged photos from S3, and the rollback leaves attachment rows pointing at files that no longer exist.

Fix I'd propose, as its own PR:

Include the driver's reasons in the error: unwrap AggregateError.errors in the removeWorkById catch, or where deleteWorkOrders formats the error.
Add workstageeventreading and workstagecertification to the batch. Both are setup copied from the workflow at creation, like the estimated costs and assignments the batch already deletes. workstageexternalresource probably belongs with them too.
Delete from S3 only after trx.commit().
Actual labor/material/equipment rows and follow-up work orders are a policy question, not residue. I'd refuse those with a clear message, like the existing charges/schedule/conditions/failures checks, and not delete them silently.