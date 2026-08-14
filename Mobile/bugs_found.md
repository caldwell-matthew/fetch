# MentorTwo Mobile — Bugs & Findings

Issues in `MentorTwo/client/mobile` (and adjacent code) surfaced while building the
Datadog Synthetics suite in `Mobile/dd_tests_mobile/`. **These are app findings, not test
problems** — the tests are only how they were noticed.

Each entry says how strongly it is evidenced, because that varies a lot:

| Evidence | Meaning |
|---|---|
| **Runtime** | Observed in an actual test run; failure reproduced |
| **Source** | Read directly in the code; mechanism is clear but not yet observed failing |
| **Operational** | Environment/config hazard rather than a code defect |

---

## 1. Several lookup searches are case-sensitive (pattern, not one-off)

**Evidence: Runtime** · `LaborCharges.tsx`, `Conditions/Form.tsx`

Confirmed by a real failure: `MOB.390` searched the condition form's asset lookup for
`Pump 0102` — the only asset attached to the fixture work order — and got
`No element found`. The asset was there; the search filtered it out.

The user lookup lowercases both sides of the comparison; the craft lookup lowercases only
the query:

```js
// userId  — correct
user.name.toLocaleLowerCase().includes(txt)

// craftId — txt is lowercased, v.name is NOT
v.name.includes(txt)
```

`txt` is `inputText.toLocaleLowerCase()`, so typing `Account Executive` searches for
`account executive` against un-lowercased craft names and matches nothing. Any craft name
containing capitals is effectively unsearchable.

**Impact:** to a user, craft search looks broken — typing the exact visible name returns no
results. Silent: no error, just an empty list.

**Fix:** `v.name.toLocaleLowerCase().includes(txt)`.

**This is a pattern, not a single bug.** The same shape appears in at least three places:

| Lookup | File | Comparison |
|---|---|---|
| craftId | `LaborCharges.tsx` | `v.name.includes(txt)` |
| assetId (condition) | `Conditions/Form.tsx` | `v.name.includes(str)` |
| userId (labor) | `LaborCharges.tsx` | correct — lowercases both |
| material item | `MaterialCharges.tsx` | correct — lowercases both |

So it is inconsistent *within the same feature*, which is the worst case for users: some
lookups match case-insensitively and some silently return nothing. Worth a sweep for
`.includes(` on a name/label that has not been lowercased.

**The symptom actively misleads.** An empty dropdown reads as "that record does not exist"
rather than "your search excluded it". It cost a wrong diagnosis here — the asset was
already attached to the work order, and the first conclusion was that fixture data was
missing. A user hitting this would reasonably conclude the record is gone.

**Test workaround:** `MOB.360` (craft) and `MOB.390`/`MOB.391` (asset) focus the field
without typing. An empty query makes `includes("")` match everything, so the full list
appears, and the option is then picked by text. If this bug is fixed, those tests can be
simplified to search by name — until then, adding a search term silently breaks them.

---

## 2. `CreateWorkButton` reads the session non-reactively

**Evidence: Source** (latent — *not* the cause of the failures we chased; see §7)
`client/mobile/components/WorkOrders/components/InsertForm/index.tsx`

```js
const s = client.readQuery({ query: GET_SESSIONDocument });
if (!isOnline || !s?.session?.me?.role?.permissions?.work?.create) return null;
```

`client.readQuery` is a synchronous, **non-subscribing** cache read. If the session is not
in the Apollo cache when this mounts, `s` is `null`, the component returns `null`, and it
will not re-render when the session arrives — only if a parent happens to re-render.

`WorkInsertFormUI`, a few hundred lines above in the same file, uses
`useQuery(GET_SESSIONDocument)` — reactive. The inconsistency suggests oversight.

**Impact:** on a cold load the affixed "create work order" button could be missing until an
unrelated re-render. In practice the work list re-renders often enough to mask it, which is
why we have not observed it directly.

**Fix:** use `useQuery` for consistency with the sibling component.

**Honesty note:** this was proposed as the cause of a real failure and then disproven — a
15s wait did not help, and the true cause was §7. Recorded as a latent code smell only.

---

## 3. Crew shortcut is invisible on phone-width screens

**Evidence: Runtime** · `client/mobile/components/index.css:193`

```css
.mobile-crew { display: none; }
@media (min-width: 450px) { .mobile-crew { display: block; } }
```

`TopHeader` renders `<span className="mobile-crew">{role}</span>` as a tappable shortcut to
the crew switcher, but it is hidden below 450px — i.e. on most phones. Observed directly:
a test clicking it failed with *"Element located but it's invisible"* on
`chrome.mobile_small`.

**Impact:** on a phone the crew shortcut does not exist and the current crew is not
displayed in the header at all. Crew switching is only reachable via the burger menu.
Whether that is intended is a product question — but the *role is also not shown anywhere*
at phone width without opening a menu.

**Test workaround:** every test reaches the crew switcher via the burger, which is
width-independent.

---

## 4. Treat mobile as delete-free — `DeleteButton` is dead code

**Evidence: Source** · `client/mobile/components/ui/DeleteButton.tsx`

> **RULE — do not write a delete step into any mobile test.** Deleting from mobile is
> supported only in a few very specific places, and which ones is not reliably inferable
> from the code. **Never add one unless the repo owner names the exact flow.**
>
> *Retracted 2026-08-10:* I briefly rewrote this entry to claim collection items are
> generally deletable, on the strength of `WorkCollectionMenu` (`ui/Menu.tsx`) rendering a
> gear with a "Delete Item" action behind `wPerms.delete`. The owner corrected that: the
> component existing does not mean the path is available or intended in these areas. The
> original conclusion stands and self-cleaning tests are **off the table**.
>
> The general lesson, since this is the second time it has bitten: *finding a code path is
> not the same as establishing a supported feature.* Verify with the owner before letting
> one reshape test strategy.

`DeleteButton` is fully implemented — confirmation modal, "Delete Record" / "Yes" /
"Cancel" — and is **imported nowhere** in `client/mobile`.

**Impact:** work orders, labor/material/equipment/other charges, notes, conditions and
failures are created from mobile and, for testing purposes, never removed. Test data
accumulates permanently and must be cleaned from desktop. This shapes the whole test
strategy: no create/delete pair can self-clean, so every mutating test leaves residue.

**Fix / product question:** either wire up `DeleteButton` or delete the dead component.

---

## 4b. `WorkCollectionMenu` checks a permission field that does not exist

**Evidence: Source** · `client/mobile/components/WorkOrders/components/ui/Menu.tsx:29-30`

```js
const wPerms = sess?.session?.me?.role?.permissions?.work;
if (!wPerms.canDelete && !wPerms.update && !wPerms.create) return null;   // line 30
...
{ wPerms.delete && <Menu.Item ...>Delete Item</Menu.Item> }               // line 69
```

Two defects in two lines:

**1. `canDelete` is not a permission field.** `UpdatePermissionInput` in
`server/src/graphql/schema.graphql:9501` defines exactly `create · update · read · delete`.
`canDelete` is a *prop name* convention used elsewhere (`assetPopup.tsx:93` passes
`canDelete={assetPermission.delete}`), not a field on the permission object. So
`wPerms.canDelete` is always `undefined` and the guard silently collapses to
`if (!wPerms.update && !wPerms.create) return null`. The same object is read correctly as
`wPerms.delete` 39 lines later — so the file contradicts itself.

*Impact:* a role with **delete but neither update nor create** gets no gear menu at all,
even though its Delete Item would render. Delete-only roles lose the ability entirely.

**2. Missing optional chaining.** Line 29 guards the whole path with `?.`, then line 30
dereferences `wPerms` unguarded. If a user's role has no `work` permission entry, `wPerms`
is `undefined` and `wPerms.canDelete` throws a `TypeError` — an uncaught render crash, not
a hidden menu. The `?.` on the line above shows the author knew the value was nullable.

**Fix:** `if (!wPerms?.delete && !wPerms?.update && !wPerms?.create) return null;`

---

## 4c. Adding a form is self-degrading — it can only ever succeed once

**Evidence: Source** · `client/mobile/components/WorkOrders/components/Forms/AdHocForm.tsx:127`

```js
const currentForms = useMemo(() => new Set(forms.map(v => v.name)), [forms]);
...
return options.filter(v => v.name.toLowerCase().includes(matchText) && !currentForms.has(v.name));
```

The Ad Hoc Form dropdown **excludes any form already attached to the work stage**. Once
"Inspection" is added it disappears from its own picker.

**Impact:** probably intended as a UX nicety (do not offer a duplicate), but combined with
§4 it means the choice is one-way from mobile *for that work stage* unless the form is
removed. Whether a work stage should ever carry two of the same form is a product question.

**Test consequence:** identical in shape to the `ReassignWork` `notInCollection` problem —
`MOB.393` passes on its first run against a clean fixture and fails with *"No element
found"* on every run after, because it consumed its own fixture data. This is the second
instance of the same trap, so it is worth treating as a category: **any picker that filters
out what is already attached cannot be tested repeatably without a cleanup step.**

Since mobile is treated as delete-free (§4), there is no in-app cleanup available, so
`MOB.393` is **inherently one-shot** and cannot be made repeatable from inside the test.
The options are a desktop cleanup between runs, or a read-only fixture with a form that is
never attached. Marked TODO in the checklist rather than papered over.

---

## 5. Created work orders are not crew-assigned

**Evidence: Runtime** (confirmed in-app)

A work order created from mobile is not assigned to any crew, and the mobile list queries
`workStages(crew: '<SESSION>')`. So a work order you just created **disappears** — it never
appears in `/work` and cannot be reopened from mobile.

**Impact:** from the user's point of view, creating a work order produces a success toast
and then nothing. Arguably the most user-visible finding here.

**Test consequence:** `MOB.300` can only assert the creation toast; `MOB.310`+ have to use a
manually-assigned fixture (`EYRpYJ9QYdQ1JFF10JtB0Q`).

---

## 6. Crew and logout modals have no close control

**Evidence: Source** · `client/mobile/components/Layout/TopHeader/index.tsx`

Both are opened with `{ centered: true, withCloseButton: false }`, so neither has an X.
Dismissal is via their own buttons (Cancel / "Take Me Back") or click-outside.

**Impact:** minor, and possibly deliberate. Noted because the inherited test checklist had
a "Switch Crews — Close button" item testing a control that does not exist.

---

## 7. Several roles share the "Admin" prefix with different permissions

**Evidence: Operational** (not a code bug — an environment hazard)

Dev has at least `Admin`, `Admin (0000)` and `Admin (0100)`. Only plain `Admin` can
create/update work orders. Because **a Crew *is* a Role** in MentorTwo and permissions are
aggregated from the groups linked to it, being on the wrong one silently removes abilities.

**Impact:** this cost several rounds of misdiagnosis. The symptom is an *absent control*
(`CreateWorkButton` returns `null`), not a permission error — so it looks like a broken UI
or a flaky test rather than a permissions state. Confirmed by the failure mode changing the
moment the role was restored to exact `Admin`.

**Mitigations in place:**
- Every login-bearing test now asserts the role is exactly `Admin` immediately after login,
  reading it from the burger menu, so drift fails fast with a clear message.
- `MOB.200_Crew_Switch` restores the role and is exempt from that guard.

**Suggested:** rename the roles to something unambiguous, or align their permissions.

---

## 8. `hooks/NetworkStatus.tsx` is an empty file

**Evidence: Source** · `client/mobile/hooks/NetworkStatus.tsx` — 0 bytes.

Dead file. Network state actually comes from Mantine's `useNetwork()`. Harmless, but
misleading when searching for the offline implementation.

---

## Not bugs — Datadog Synthetics limitations

Recorded so they are not mistaken for app defects. None of these can be tested with
Synthetics; they need Playwright/Cypress or manual testing.

- **Offline behaviour cannot be tested at all.** There is no network-toggle step, so the
  entire offline-first queue (`QueueLink`, `PersistedQueueLink`, `SerializeLink`) is
  unreachable — the highest-risk mobile surface and completely uncovered.
- **Locators cannot use extracted values.** Datadog can extract a value from the page but
  cannot interpolate it into an XPath, so "restore whatever it was" is inexpressible.
  Mutating tests must revert to *fixed*, known values instead.
- **Camera capture, barcode scanning, canvas drawing (map tools, signature widget)** are
  out of reach.

---

## 9. An invalid form submits silently — no error, no feedback

**Evidence: Source** · `client/mobile/components/ui/SubmitButton.tsx:13`

```js
type={isValid ? 'submit' : 'button'}
```

When `formState.isValid` is false the button is downgraded from `submit` to `button`, so
pressing it **does nothing at all**. There is no validation summary, no field-level error
surfaced on press, and no toast. The only affordance is `opacity: 0.5` — the button still
renders full width, full size, and accepts the tap (it even fires `onClick`, minus the
haptic).

**Impact:** a user who misses one required field taps Submit and gets *silence*. Nothing
indicates which field is wrong or that anything was rejected. On a phone, where the invalid
field is often scrolled out of view, this reads as "the app is broken". Contrast the usual
pattern of letting the submit fire and rendering validation errors.

**Test consequence — this is why "no toast" has been so hard to diagnose.** Every charge
test asserts a transient toast after clicking Submit, so a failure is ambiguous between:
  1. the mutation succeeded and the toast was missed on timing, and
  2. the form was invalid and the click was a silent no-op.
These need completely different fixes, and the test cannot distinguish them. It has already
produced several wrong diagnoses (chased as toast flake when it was a missing required
field — `unitPrice` on MOB.380, `actualHours`/`laborType` on MOB.360).

**Mitigation in the tests:** assert a *durable* signal — the modal closing — as the critical
step, and demote the toast to optional. A still-open modal proves case 2; a closed modal
with no toast proves case 1.

**Fix:** keep `type="submit"` and let `handleSubmit` surface validation errors, or disable
the button outright so the dead state is honest.

---

## 10. Mobile job status only ever moves forward — unverifying never walks it back

**Evidence: Source** · `client/mobile/components/AssetVerification/VerificationCheckbox.tsx:41-46`

```js
const { status, assets, assetsVerified } = job.mobileJob;
let newStatus = null;
if (status === 'CANCELED' || status === 'CREATED') return;
if (assetsVerified === assets?.length && status !== 'COMPLETED') newStatus = 'COMPLETED';
if (assetsVerified && status === 'READY') newStatus = 'IN_PROGRESS';
```

This `update` runs for **both** directions — the same mutation verifies and unverifies. But
no branch can ever produce `READY`, and none reverses `COMPLETED`. So:

| Action | assetsVerified | Status after |
|---|---|---|
| verify first asset (from `READY`) | 1 | `IN_PROGRESS` |
| verify last asset | n | `COMPLETED` |
| **unverify one** | n−1 | **still `COMPLETED`** |
| unverify all | 0 | **still `COMPLETED`** |

**Impact:** a job can sit at `COMPLETED` while assets are demonstrably unverified, and a job
knocked to `IN_PROGRESS` by a mis-tap never returns to `READY`. The progress counter and the
status badge disagree, and the status is the field that reports upward. Anyone unchecking a
box to correct a mistake leaves the job permanently misreported.

*(`assetsVerified` itself is fine — it is an `@client` field recomputed from
`assets { verified }` on every read, so it always reflects the optimistic write. I initially
suspected an off-by-one here and confirmed from `graphql/localFields/MobileJob.ts` that there
is none.)*

**Test consequence — the inherited checklist's premise is wrong.** It calls verify → unverify
"a natural self-reverting pair, making this one of the few mutating areas that can be fully
repeatable." The *asset* flag reverts; the *job status* does not. A test that verifies every
asset completes the job permanently.

**Repeatable strategy instead:** use a fixture job that is **already `IN_PROGRESS` with ≥2
assets**, and verify/unverify exactly **one**. Both status branches are then unreachable —
`assetsVerified === assets.length` is false, and `status === 'READY'` is false — so the run
mutates nothing but the single asset flag it restores.

**Fix:** make the transition symmetric — recompute from `assetsVerified` in both directions
(0 → `READY`, partial → `IN_PROGRESS`, full → `COMPLETED`).

---

## 11. Verification toast fires before the mutation is sent

**Evidence: Source** · `client/mobile/components/AssetVerification/VerificationCheckbox.tsx:24`

```js
toast.success(`Asset ${flag ? 'verified' : 'unverified'}`);
client.mutate({ mutation: VERIFY_ASSETDocument, ... });
```

The success toast is emitted **before** `client.mutate` is called, and nothing awaits or
catches the result. A rejected mutation still reports "Asset verified".

Same shape as `AdHocForm.tsx:127`, which calls `toast.success('Form added')` ahead of its
own mutate — so this is a pattern worth a sweep, not a one-off.

**Impact:** offline or on a server error, the user is told the asset was verified when it
was not. This is the one module where that matters most: verification is the record that
the asset was physically inspected.

**Test consequence:** the toast is **not** proof of persistence here — it proves only that
the handler ran. Assert the checkbox state or the Verified/Unverified filter contents
instead, and treat the toast as incidental.

---

## 12. The asset *detail route* implements 6 of 15 template section types — the rest render a blank tab

> **SCOPE CORRECTION (2026-08-10).** As first written this read as though it described the
> asset tabs users actually see. It does not. There are **two separate tab systems**:
>
> | Where | Tabs | Source |
> |---|---|---|
> | `/asset-verify/:jobId/asset/:id` (`AssetDetails.tsx`) | template-driven | `MobileJobTemplateSectionType` |
> | asset row expanded on the job page (`AssetLookupDetails`) | **hardcoded five** | synthetic template |
>
> The five tabs in normal use — General Info, Attributes, Photos, Docs, Work History — come
> from `AssetLookupDetails/index.tsx:81`, which hardcodes them. `Work History` is not in the
> enum at all, so it can only come from there. Everything below concerns the *other*
> surface, the deep asset-detail route, and its practical impact depends on which section
> types MobileJob templates are actually allowed to use — which the owner says is a
> restricted set. Recorded as a latent robustness gap, **not** a user-facing bug.

**Evidence: Source** · `client/mobile/components/AssetVerification/AssetDetails.tsx:201-243`
vs `server/src/graphql/schema.graphql:14820`

`MobileJobTemplateSectionType` defines fifteen values:

```
GENERAL_INFO  ATTRIBUTES  ATTACHMENTS  EVENT_READINGS  NOTES  CONDITION  FAILURES
FORMS  ASSETS  EQUIPMENT_CHARGES  LABOR_CHARGES  MATERIAL_CHARGES  OTHER_CHARGES
PERMITS  WARRANTIES
```

`AssetVerificationForm` maps only **six** — `GENERAL_INFO`, `ATTRIBUTES`, `ATTACHMENTS`,
`CONDITION`, `EVENT_READINGS`, `FAILURES`. Any section using one of the other nine renders a
`Tabs.Panel` with **no children at all**: the tab appears in the strip, is selectable, and
shows an empty page. No "not supported" message, no fallback, no console warning.

Three of the six are further gated on `job.mobileJob.workStageId`, so `CONDITION`,
`EVENT_READINGS` and `FAILURES` also render empty on any job with no linked work stage —
the fixture `Z0EVwQcdJZhMURcBFkp0E0` is exactly that case.

**Impact:** a template author can add any section the enum allows and get a silently blank
tab in the field. Nothing in the mobile UI distinguishes "this section is empty" from "this
section type was never implemented", and nothing upstream stops the template being saved.

**Fix:** render an explicit fallback for unhandled section types, and ideally constrain the
template editor to the subset each app actually implements.

**Test consequence:** per-tab **content** assertions are only meaningful for the six handled
types, and only three of those work without a work stage. Tab tests here must be
template-agnostic — assert the strip, the active state and switching — which is the same
approach `MOB.330` takes for work orders and for the same underlying reason.

---

## 13. Escape discards the whole new-asset form, defeating a guard the code already has

**Evidence: Runtime** · `client/mobile/components/AssetCollector/index.tsx:263-275`

```jsx
<Modal
  opened={showForm}
  title="Get New Asset"
  closeOnClickOutside={false}   // deliberately protected
  ...                           // closeOnEscape is NOT set -> defaults to true
>
```

The author clearly thought about accidental dismissal — `closeOnClickOutside={false}` exists
precisely so a stray tap outside does not throw away a part-filled asset. But `closeOnEscape`
is left at its Mantine default of `true`, so **Escape discards the entire form**, including
every field typed and every photo attached. There is no confirmation.

Worse, it cascades. Adding a photo opens a *second* modal ("Select Photo Source") on top.
One Escape closes **both** — the picker and the form underneath — so a user who opens the
photo picker and hits Escape to back out of it loses all their work instead.

**Impact:** silent data loss in the one flow where the user has done the most typing, and
the inconsistency (click-outside guarded, Escape not) suggests it is an oversight rather
than a decision.

**Fix:** `closeOnEscape={false}` on the "Get New Asset" modal, matching the click-outside
guard. If Escape should dismiss the photo picker, that inner modal can keep it.

**Confirmed by a real run:** `MOB.600` pressed Escape to dismiss the photo picker and the
next step failed with *"No element found using locator:
`//button[@form="asset-collector"]`"* — the submit button was gone because the whole form
had closed. The test now closes the picker via its own close button instead.

---

## 14. Attaching a photo from a browser fails the whole collect — and the UI reports success

**Evidence: Runtime** (confirmed by the repo owner) ·
`server/src/controllers/system/attachment/create/mobile.ts:177`

Attachments can currently only be created from the **native mobile app**. Attempting it from
a desktop browser fails server-side:

```ts
} catch (err) {
    await tsx.rollback();
    console.error('Error creating attachment records >:(', err);
    throw new Error('Unable to create attachments');
}
```

The user sees a red `Unable to create attachments` toast, and — per the owner — **no asset
is created either**. So collecting an asset with a photo is impossible outside the native
app, and the failure takes the asset with it.

**Impact:** the browser build offers a photo picker (`AddPhotoOptions`'s "non react-native
fallback", which explicitly builds `NativeFile` objects from `URL.createObjectURL`) for a
flow the backend cannot complete. The affordance exists, is reachable, and cannot succeed.
Anyone using mobile web rather than the native app loses the whole asset, not just the photo.

**Fix / product question:** either support browser-originated attachments, or hide the photo
controls when `window.ReactNativeWebView` is absent so the flow cannot be started.

---

### Why our test still went green — a lesson about "durable" assertions

`MOB.600` passed this exact scenario. Worth recording how, because the mistake was subtle and
repeated:

| Assertion | Verdict | Why it was useless here |
|---|---|---|
| `assertPageLacks "Submit"` | passed | vacuous — the button reads "Create Asset" (§ below) |
| `assertPageLacks "Create Asset"` | passed | the modal *did* close — closing is not creating |
| `assertElementPresent` affixed + | passed | same: proves the form dismissed, nothing more |
| `assertPageContains "Asset collected"` | **FAILED** | **the only truthful step — and it was optional** |

Every "durable" signal described the *form*, and the form closed regardless of whether the
mutation succeeded. The toast was the one assertion tied to the actual outcome, and it had
been demoted to optional precisely because toasts are transient.

**The rule that follows:** a mutating test must assert that **the record exists**, not that
the form went away. UI state is a proxy; the record is the fact. Where a toast is the only
available proof of the mutation, do not demote it without replacing it with something
stronger — read the record back.

**But the proxy is not always weak — it depends on where the close lives.** Audited MOB.300
(create work order) expecting the same flaw, and it does not have it:

| | MOB.300 create work | MOB.600 collect asset |
|---|---|---|
| where the close happens | inside Apollo's `update()` | `.then()` on a non-awaited call |
| optimistic response | **none** on `createWork` | returns `optimisticResponse.collectAsset` |
| so "modal closed" proves | the server confirmed | only that a promise resolved |

`InsertForm/index.tsx:163` puts `toast.success` and `closeModal()` inside `update()`, and
`createWork` has no `optimisticResponse` — so Apollo runs that block only on a successful
server response. MOB.300's modal-closed assertion is therefore genuine proof of creation,
and its intermittent toast failures were timing, not silent failures.

`createAsset.ts:128` by contrast calls `apolloClient.mutate(...)` **without awaiting it** and
returns the optimistic value at line 171, so the collector's form closes no matter what the
server does.

*The distinction to carry forward: a UI-state assertion is only as strong as the callback it
is coupled to. Check whether the close is inside `update()` (server-confirmed) or in a
`.then()` on an un-awaited mutation (proves nothing) before trusting it.*

---

## 18. `SubmitButton` ignores the label its caller passes as children

**Severity:** cosmetic · **Found:** 2026-08-12, building MOB.710 · **Source-read, not observed**

`SubmitButton` renders its label from a prop, in the JSX child position:

```jsx
// mobile/components/ui/SubmitButton.tsx
export default function SubmitButton({ isValid, buttonText = 'Submit', onClick, ...btnProps }) {
    return <Button ... {...btnProps}>{buttonText}</Button>;
}
```

`btnProps` carries `children` when a caller writes the label between the tags, but an
explicit JSX child **wins over a spread `children` prop** — so a caller that passes its label
as children gets `Submit` on screen instead. `EditForm` does exactly that:

```jsx
// AssetLookup/AssetLookupDetails/EditForm.tsx:63-70
<SubmitButton isValid={validSubmit} onClick={...}>Update Asset</SubmitButton>
```

Callers that use the `buttonText` prop are unaffected.

**Why it is filed here rather than fixed in a locator:** this is the same class of problem as
`bugs_found.md` §9's silent no-op — the code reads as though it does one thing and renders
another, and a test written from the source would assert a button label that never appears.
That is precisely how MOB.600 spent three runs asserting a form had closed by looking for a
button that read **"Create Asset"** when the real label was different.

**What MOB.710 does about it:** it does not depend on the answer. The modal's submit is
matched as `normalize-space(.)="Submit" or normalize-space(.)="Update Asset"`, scoped to the
modal so the `or` cannot match two buttons; the General Info form's submit is matched by
`@form="mobile-genInfo"`, which has no label dependency at all. **Not verified against a
running page** — the locator was deliberately built so it did not have to be.

---

## 19. Event readings report success, update the timeline, and advance the progress bar without waiting for the server

**Severity:** medium · **Found:** 2026-08-12, building MOB.550 · **Verified by run**

`AssetVerificationEventReadings.onSubmit` (`EventReadings/index.tsx:57-106`):

```js
client.mutate({ mutation: CREATE_EVENT, context: { waitForKeys: [assetId] }, variables: { data: event } });
// ...not awaited, no update(), no .then(), no onError
if (events.length) {
    setSubmitCount(c => c + 1);
    toast.success('Event readings captured.');
    client.writeQuery({ query: ASSET_EVENT_READING_HISTORY, ... });  // hand-written local entry
}
```

The mutation is fired and dropped. The success toast, the `N of M recorded recently (in 24h)`
progress bar, and the reading rendered beside its reading type **all** come from the local
`writeQuery`, so a technician sees a complete, confident success for a reading the server may
have rejected.

**What makes this worse than §11's toast-before-mutation:** the fabricated state is *durable*.
The Apollo cache is persisted to IndexedDB (`persistCache` + LocalForage, `graphql/index.tsx:146`),
and nothing re-reads that query from the network:

| | |
|---|---|
| `clearCache` (`AssetVerification/utils/index.ts:179`) | rewrites only `MOBILE_JOB_DETAILS` and `FETCH_MOBILE_JOB_TEST`; `assetEventReadingHistory` is a **root** field so `cache.gc()` keeps it |
| the prefetch (`utils/index.ts:106-113`) | `apolloClient.query(...)` at the default **cache-first** policy — returns the local entry without a request |

So a reading that never reached the server keeps displaying as recorded, across reloads and
across resyncs, until the persisted cache is cleared. There is no in-app path back to the truth.

**Verified, not inferred.** MOB.550 writes `4242`/`1337` and a *later* run — fresh browser
profile, empty IndexedDB, history necessarily fetched from the server — reads them back. That
run passed, so `CREATE_EVENT` **does** persist on the happy path. What is untested, and
unprovable from the browser, is the failure path: nothing in the UI would distinguish it.

**Suggested fix:** move the toast and the `writeQuery` into the mutation's `update()` (the
pattern `InsertForm/index.tsx:163` already uses and §14 credits for MOB.300 being trustworthy),
or await the mutation and surface an error. Either makes the displayed state mean something.

---

## 20. Submitting the search box silently discards every active structured filter

**Severity:** high — silently wrong data · **Found:** 2026-08-12 · **Confirmed by run** (MOB.820)

On Asset Lookup, applying a structured filter and then pressing Enter in the search box
returns results that **ignore the filter**, while the UI continues to report the filter as
active. A technician sees `Filters (1)` and a filtered-looking screen showing unfiltered data.

`AssetLookup/index.tsx` sends the filter conditions in two places and they disagree:

```js
line  62  useQuery   query: { conditions: [...(props.query || query || [])] }   // WITH filters
line 142  refetch    query: { conditions: [...(props.query ?? [])] }            // WITHOUT
```

`query` (lowercase, from `useFilterState`) is the structured-filter payload. `props.query` is
only set when AssetLookup is **embedded** (the asset-picker flow), so on the standalone page
it is `undefined` and the search form's `refetch` sends `conditions: []`.

**Observed, not inferred.** MOB.820 filters on `Name contains ZZZZ-NO-SUCH-ASSET` (matching
nothing), confirms `Pump 0102` is hidden, then searches for it:

| step | result |
|---|---|
| baseline search, no filter | `Pump 0102` present ✓ |
| apply non-matching filter | `Pump 0102` hidden ✓ |
| submit the search box | `Filters (1)` still shown, **`Pump 0102` back in the results** ✗ |

That last row is the bug: the filter is applied to the display and not to the query.

**The race did not save it.** The same handler calls `setSearchText`, which is a `useQuery`
variable, so a second request that *does* carry the filters is issued alongside the filter-less
`refetch`. The filter-less response wins in practice — so reasoning from the two code paths
alone ("maybe they cancel out") would have been wrong in the optimistic direction.

**Suggested fix:** make line 142 match line 62 — `conditions: [...(props.query || query || [])]`.

**Test status:** MOB.820 now asserts the **actual, buggy** behaviour so the suite stays green
and the defect stays pinned. It is a characterization test: **when this bug is fixed, MOB.820
will fail**, and its message says so. Do not "repair" it then — flip the assertions back to
the correct behaviour and delete this entry.

---

## 21. The Permits tab renders a blank panel when there are no permits

**Severity:** low (UX) · **Found:** 2026-08-12, building MOB.394 · **Source-read**

`PermitsStats` (`WorkOrders/components/Permits.tsx:9-12`) maps straight over the list with no
guard for the empty case:

```jsx
const PermitsStats = ({ permits }) => {
    return (<>
        {permits.map((s, i) => ( ...card... ))}
    </>);
};
```

With no permits it returns an empty fragment, so the tab opens onto **nothing** — no message,
no placeholder. A technician cannot tell "this work order has no permits" apart from "the tab
failed to load", which is exactly the ambiguity `bugs_found.md` §12 describes for
unimplemented section types.

**Every sibling tab handles this and Permits is the outlier:**

| Tab | Empty state |
|---|---|
| Warranties | `No Warranties Found...` (`Warrenties.tsx:85`) |
| Attributes | `No asset attributes found.` (`DetailPage/Attributes.tsx:81`) |
| **Permits** | **nothing** |

**Suggested fix:** match the siblings — `if (!permits.length) return <Text>No Permits
Found...</Text>;`

**Testing consequence, which is why this is filed rather than just noted:** an empty Permits
tab gives a test nothing to assert beyond the tab being active, and asserting a blank panel is
a check that cannot fail (trap 5). `MOB.394` is only meaningful because the repo owner added a
real permit to the fixture on 2026-08-12. If that permit is ever removed, MOB.394 fails and
the cause is fixture data, not code. Adding the empty-state text would also make the
no-permits case testable in its own right.

---

## 22. `useMediaQuery` is called inside a loop callback, so segmented-control labels render nondeterministically

**Severity:** medium (React correctness) · **Found:** 2026-08-12, debugging MOB.396 · **Source-read; NOT the cause of that failure — see Status**

`SegmentedControlWithIcons` (`components/helper-components/SegmentedControlWithIcons/index.tsx:13-20`):

```jsx
export const SegmentedControlWithIcons = ({ options, minWidth, value: selectedValue, ...props }) => {
    const showDisplayLabel = (value: string) => {
        if (minWidth === undefined || minWidth === null) return true;
        else if (minWidth && useMediaQuery(`(min-width: ${minWidth}px)`))   // ← hook, conditionally, in a callback
            return true;
        else return value === selectedValue;
    };
    ...options.map(({ value, icon, label }) => ({ label: showDisplayLabel(value) ? <div>…<span>{label}</span></div> : <Icon/> }))
```

`useMediaQuery` is a hook, but it is called from a plain function that runs **inside `.map()`**,
and only on one branch. That breaks the Rules of Hooks twice over: the call is conditional, and
it happens a variable number of times per render (once per option that reaches that branch).
React's hook state is positional, so the values returned drift between renders.

**Status: real, but NOT the cause of the failure it was filed from.** It was filed while
debugging `MOB.396`, whose `All`-filter click failed where `MOB.545`'s identical one passed.
Switching the locator to the radio input failed too — because the control is a Mantine
`<SegmentedControl>` that presents as a **button**, not a `<label>`/`<input>` pair. The click
was then removed entirely: `All` is the default filter the page lands on, so clicking it was
always a no-op that could only ever fail. **Two theories (a trimmed readiness gate, then this
one) were wrong before the simplest question got asked — does that click need to happen at
all?**

The hooks violation below is still a genuine defect found by reading the code; it is simply
not what broke that test, and no test now depends on the label rendering.

**Why it matters beyond tests:** the same nondeterminism decides what a technician sees. A
control that sometimes shows `All / Unverified / Verified` and sometimes shows three bare icons
is a usability problem, and the hook-order drift can affect any other hook in the component.

**Suggested fix:** hoist the hook to the component body —
`const wide = useMediaQuery(minWidth ? \`(min-width: ${minWidth}px)\` : '(min-width: 0px)');`
then `showDisplayLabel = (value) => minWidth == null || wide || value === selectedValue;`

**Test-side workaround already applied:** `dd_tools.av_job_gate` now matches the underlying
radio input (`//label[.//input[@value="All"]]`), which is always present regardless of whether
the text label rendered. **Do not go back to matching the visible text on any segmented
control.** Note `build_verify_tests.py`'s `filt()` helper still uses the text form for
MOB.500–530; those pass today but are exposed to the same flakiness.
