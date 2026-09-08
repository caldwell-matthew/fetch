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

## Index

*Re-verified against `MentorTwo@5cdeece5b7` (development, 2026-08-20) where the check was
cheap — those rows say **confirmed**. The rest were not re-read and may have been fixed since
they were written; treat them as leads, not as current facts.*

*§27–§31 were added 2026-08-21/23 while building the geolocation and offline tests, and were
read against `client/mobile` at that time. **§28's runtime half is still unconfirmed** — it
says so in the row.*

⚠️ **Keep this file current as work happens, not in a catch-up pass.** §29 and §31 were both
found days before they were written down, and lived only as comments inside test generators —
where nobody looking for app bugs would ever find them. If a finding is about the APP, it
belongs here; if it is about a TEST, it belongs in `testing_checklist.md`.

⚠️ **Do not renumber.** `testing_checklist.md` cross-references §1, §4, §9, §10, §11, §14,
§20, §21, §23, §24, §25 and §26 by number. **§15–§17 do not exist** — they never did, and
nothing references them; the gap is not a missing entry.

| § | Finding | Evidence | Status |
|---|---|---|---|
| 1 | Lookup searches are case-sensitive (pattern, not one-off) | Runtime | ✅ **FIXED 2026-08-24** |
| 2 | `CreateWorkButton` reads the session non-reactively | Source | ✅ **FIXED 2026-08-24** — `useQuery(GET_SESSIONDocument)` |
| 3 | Crew shortcut invisible at phone width | Source | ✅ **FIXED 2026-08-24** — shown at all widths |
| 4 | Mobile is delete-free; `DeleteButton` is dead code | Source | ✅ **FIXED 2026-08-24** — dead component deleted |
| 4b | `WorkCollectionMenu` gates on a permission field that does not exist | Source | ✅ **FIXED 2026-08-24** |
| 4c | Adding a form is self-degrading — succeeds only once | Runtime | ✅ **FIXED 2026-08-24** — duplicate filter kept; picker now says so |
| 5 | Created work orders are not crew-assigned | Runtime | ✅ **FIXED 2026-08-24** — session `useQuery` + Pending/Requested → Ready |
| 6 | Crew and logout modals have no close control | Source | ✅ **FIXED 2026-08-24** — `withCloseButton: true` |
| 7 | Several roles share the `Admin` prefix with different permissions | Operational | open — env/data, not an app-code fix |
| 8 | `hooks/NetworkStatus.tsx` is an empty file | Source | ✅ **FIXED 2026-08-24** — empty file deleted |
| 9 | An invalid form submits silently | Source | ✅ **FIXED 2026-08-24** — button stays `type="submit"` |
| 10 | Mobile job status only moves forward | Runtime | ✅ **FIXED 2026-08-24** |
| 11 | Verification toast fires before the mutation | Source | ✅ **FIXED 2026-08-24** |
| 12 | Asset detail route implements 6 of 15 template section types | Source | ✅ **FIXED 2026-08-24** — unhandled tabs show a fallback |
| 13 | Escape discards the whole new-asset form | Source | ✅ **FIXED 2026-08-24** — `closeOnEscape={false}` |
| 14 | Browser-originated attachments fail the whole collect | Runtime | ✅ **FIXED** — verified by test, not by report |
| 18 | `SubmitButton` ignores the label passed as children | Source | ✅ **FIXED 2026-08-24** |
| 19 | Event readings report success without waiting for the server | Source | ✅ **FIXED 2026-08-24** |
| 20 | Submitting search discards active structured filters | Runtime | ✅ **FIXED 2026-08-24** — **flip `MOB.820` assertions** |
| 21 | Permits tab renders blank with no permits | Source | ✅ **FIXED 2026-08-24** |
| 22 | `useMediaQuery` inside a loop callback | Source | ✅ **FIXED 2026-08-24** |
| 23 | `HomeWidgets` hardcodes counts / queries the wrong thing | Source | ✅ **FIXED 2026-08-24** — dead file deleted |
| 24 | `Supersesed` misspelling in the status legend | Source | ✅ **FIXED 2026-08-24** — assert `Superseded` |
| 25 | The `Admin` crew's work list is empty on dev | Operational | 🔄 **SUPERSEDED 2026-08-20** — work orders were assigned; see the entry |
| 26 | Asset Type edits on the AV detail "save" and revert | Runtime | ✅ **FIXED 2026-08-24** — `typeId` locked on AV detail |
| 27 | `useGeolocation` is dead code — but carries a full Jest suite | Source | ✅ **FIXED 2026-08-24** — hook and tests deleted |
| 28 | `GeolocateButton`'s offline message sits behind a `disabled` element's own `onClick` | Source | ✅ **FIXED 2026-08-24** — enabled control + `aria-disabled` |
| 29 | A Mapbox failure makes Geolocate fail **silently** | Source | ✅ **FIXED 2026-08-24** |
| 30 | The offline transaction queue has **no tests in either harness** | Source | ✅ **FIXED 2026-08-24** — Jest for Queue/Persist/Serialize/Error |
| 31 | A deploy takes over a running session silently, and deletes the cache it was using | Source | ✅ **FIXED 2026-08-24** — `controllerchange` reloads once |
| 32 | Work-stage Docs upload gated on `asset.create` | Source | ✅ **FIXED 2026-08-24** — gate passed in from the call site |

**If you fix one, mark it here rather than deleting the entry** — several are referenced from
the checklist as the reason a test is shaped the way it is, and a deleted entry turns that
reasoning into a dangling pointer.

---

## 1. Several lookup searches are case-sensitive (pattern, not one-off)

> ## ✅ FIXED 2026-08-24
>
> Craft, condition-asset, and failure-asset lookups now lower-case both sides of
> `.includes`. Tests can search by the visible name.

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

> ## ✅ FIXED 2026-08-24
>
> `CreateWorkButton` now uses `useQuery(GET_SESSIONDocument)` so it re-renders
> when the session lands in cache.

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

> ## ✅ FIXED 2026-08-24
>
> `.mobile-crew` is `display: block` at all widths. The current crew name is
> visible and tappable on phone-sized screens, not only ≥450px.

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

> ## ✅ FIXED 2026-08-24
>
> Unused `DeleteButton` (and its Jest file) deleted. Mobile stays delete-free;
> do not write a delete step into any mobile test unless the owner names the
> exact flow.

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

> ## ✅ FIXED 2026-08-24
>
> Guard is now `if (!wPerms?.delete && !wPerms?.update && !wPerms?.create) return null;`

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

> ## ✅ FIXED 2026-08-24
>
> The picker still hides forms already on the stage (duplicates are not a
> supported mobile action). It now states that explicitly:
> *"Forms already on this work stage are not listed."*
> `MOB.393` remains one-shot / read-only for that reason.

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

> ## ✅ FIXED 2026-08-24
>
> Create-work reads the session with `useQuery` (same as `CreateWorkButton`)
> so `roleId` is assigned from the live role. Newly created stages in
> Pending or Requested are then updated to Ready so `getCrew.ts` still
> returns them after a resync. Server download rules were not relaxed.

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

> ## ✅ FIXED 2026-08-24
>
> Switch Crews, the header crew shortcut, and Log Out now open with
> `withCloseButton: true`. Cancel / Take Me Back remain.

**Evidence: Source** · `client/mobile/components/Layout/TopHeader/index.tsx`

Both are opened with `{ centered: true, withCloseButton: false }`, so neither has an X.
Dismissal is via their own buttons (Cancel / "Take Me Back") or click-outside.

**Impact:** minor, and possibly deliberate. Noted because the inherited test checklist had
a "Switch Crews — Close button" item testing a control that does not exist.

---

## 7. Several roles share the "Admin" prefix with different permissions

> Left as **operational** (2026-08-24). This is environment/role data, not an
> app-code defect. Tests already assert the logged-in role is exactly `Admin`.

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

> ## ✅ FIXED 2026-08-24
>
> The 0-byte file was deleted. Network state still comes from Mantine's `useNetwork()`.

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

> ## ✅ FIXED 2026-08-24
>
> `SubmitButton` always uses `type="submit"` so `handleSubmit` can surface
> validation errors. Invalid state is still shown via `opacity: 0.5` and no haptic.

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

> ## ✅ FIXED 2026-08-24
>
> Status is recomputed from `assetsVerified` in both directions: 0 → `READY`,
> partial → `IN_PROGRESS`, full → `COMPLETED`.

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

> ## ✅ FIXED 2026-08-24
>
> The verify/unverify toast now fires from the mutation `update()`, and a rejected
> mutate shows an error toast. Same for Ad Hoc Form (`toast.success('Form added')`
> is inside `update()` once the new form is present).

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

> ## ✅ FIXED 2026-08-24
>
> Unhandled `MobileJobTemplateSectionType` values now render
> *"This section is not available on mobile."* CONDITION / EVENT_READINGS /
> FAILURES without a linked work stage render
> *"This section requires a linked work stage."* The six implemented types
> are unchanged.

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

> ## ✅ FIXED 2026-08-24
>
> The "Get New Asset" modal now has `closeOnEscape={false}`, matching
> `closeOnClickOutside={false}`.

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

> ## ✅ FIXED — verified by test, not by report
>
> Browser-originated attachments now work. **`MOB.600` runs 23/23 green with a real
> `uploadFiles` step**, creating the asset *and* its attachment, and asserting the asset back by
> read-back (`DD SYNTHETIC MOBILE {{ RUNID }}` in the collected list). Two further tests cover
> the surface: **`MOB.621`** uploads a photo into the collector carousel without submitting, and
> **`MOB.741`** uploads through the work-stage Docs tab.
>
> ⚠️ **Two consequences worth carrying forward:**
> 1. **`MOB.600`'s residue grew.** Every run now leaves a permanent **attachment** as well as a
>    permanent asset. The desktop cleanup job has more to do than it did.
> 2. **The reasoning below is still the reason this entry is kept.** The "why our test still went
>    green" section is not about this bug — it is about assertions that describe the *form*
>    instead of the *record*, and it stands unchanged.
>
> The original report follows, unedited.

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

> ## ✅ FIXED 2026-08-24
>
> Label is now `buttonText ?? children ?? 'Submit'`. `EditForm`'s
> `Update Asset` children render as the visible label.

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

> ## ✅ FIXED 2026-08-24
>
> Toast, progress, and `writeQuery` now run in `Promise.all(mutations).then(...)`.
> A rejected mutate surfaces `Failed to save event readings.` and does not write
> the local history.

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

> ## ✅ FIXED 2026-08-24
>
> Search, tag capture, tag clear, and `fetchMore` now send
> `conditions: [...(props.query || query || [])]`, matching the `useQuery`.
>
> ⚠️ **`MOB.820` will fail.** It characterises the old buggy behaviour. Flip its
> assertions back to "filter stays applied after search" and drop this entry's
> "open" status — do not "repair" the test to keep matching the old bug.

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

> ## ✅ FIXED 2026-08-24
>
> Empty list now renders `No Permits Found...`, matching Warranties.

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

> ## ✅ FIXED 2026-08-24
>
> The hook is hoisted to the component body:
> `const wide = useMediaQuery(minWidth != null ? \`(min-width: ${minWidth}px)\` : '(min-width: 0px)');`

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

---

## 23. `HomeWidgets` hardcodes the work-order count, and queries mobile jobs for both cards

> ## ✅ FIXED 2026-08-24
>
> `client/mobile/routing/HomeWidgets.tsx` deleted. It had no imports.

*Found 2026-08-18, by reading `client/mobile/routing/HomeWidgets.tsx`. **Dead code today** —
see the severity note — but recorded because it is one import away from shipping.*

`routing/HomeWidgets.tsx` exports two dashboard cards, `AssetVerificationSummary` and
`WorkOrderSummary`. Three problems, in ascending order:

1. **`WorkOrderSummary` renders a literal.** The "completed" figure is
   `<Text size="sm">{'2 / 13'} Completed</Text>` — not derived from anything. Every user would
   see `2 / 13`, always.
2. **`WorkOrderSummary` queries the wrong model.** It runs `FETCH_MOBILE_JOB_TEST` — the same
   query as the *Asset Verification* card — and feeds those mobile jobs into its
   `JobStatusSummary` ring. So the Work Orders card would draw a chart of mobile jobs.
3. **Both cards pass a no-op `onSelect`,** each with an in-source comment declining to fix it
   (`/** Someone should fix this. Not me since i have more ts errors to clear up*/`). Clicking a
   legend entry does nothing, while the card's own `onClick` navigates away underneath it.

Also note the query name itself — `FETCH_MOBILE_JOB_TEST` — is what the home screen would be
built on.

**Severity: latent, not live.** `HomeWidgets.tsx` is **never imported anywhere** in the
repo — `routing/Home.tsx` does not reference it, and it renders six navigation tiles instead.
Nothing a user can reach today displays `2 / 13`.

**Why it is still worth filing:** the file is not marked as scratch, sits in `routing/`
alongside the live `Home.tsx`, and would become user-visible the moment someone adds one
import. The hardcoded literal in particular is the kind of thing that reads as working during
a demo.

**Suggested fix:** delete the file, or — if the cards are wanted — derive the count from a
work-stage query and give `WorkOrderSummary` its own document rather than reusing the mobile
job one.

**Test-side note:** no test targets this, and none should. Recorded in
`testing_checklist.md` → T2.7 as dead code so a future component-by-component audit does not
log it as a coverage gap.

---

## 24. `WorkStatusSummary` misspells "Superseded" as "Supersesed" in the status legend

> ## ✅ FIXED 2026-08-24
>
> Display string is `'Superseded'`. Tests for the legend must assert that spelling,
> not `Supersesed`.

*Found 2026-08-18. Live, user-visible, trivial to fix.*

`client/mobile/components/WorkOrders/components/StatusSummary/index.tsx:47`:

```
Superseded: { status: 'Supersesed', value: 0, tooltip: '' },
```

The **key** is spelled correctly, so the status maps and counts fine; the **display string** is
not. That string becomes the legend label and the tooltip on the work-list status ring
(`WorkOrders/index.tsx:186`), so any work order in the Superseded state is labelled
`Supersesed` to the user.

**Severity: cosmetic, but on a live screen** — this renders on the Work Orders list, which is
one of the most-visited pages in mobile.

**Suggested fix:** correct the string literal to `'Superseded'`.

⚠️ **Test-side consequence — match the typo until it is fixed.** The work-list status legend is
currently untested (`testing_checklist.md` → T2.1, *Work list chrome*). Whoever writes that
test must assert `Supersesed`, and should re-check this section first: when the typo is fixed
the assertion flips, and a test that quietly matched on a prefix like `Superse` would hide the
change rather than catch it.

---

## 25. The `Admin` crew's work list is empty on dev — and one test has been passing against it

> 🔄 **SUPERSEDED 2026-08-20 — the list is no longer empty.** The repo owner assigned work
> orders to the crew, and set one to `In Progress`. **The entry is kept because the ANALYSIS
> below is still the reference for how this list is populated** — the four server-side rules,
> and the SQL to check each — and because several tests are still shaped by what it found.
>
> What changed downstream, all on 2026-08-20:
> - **`work_list_gate`'s timing assumption broke.** Its LOADEDALL checks are `assertPageLacks`
>   on progress labels, which cannot poll, so they were really a race against the download.
>   Empty list → instant; populated list → outran 20s and then 45s. Three tests failed on it,
>   and the fix was structural: `dd_tools.work_cache_warm()` for callers that only need a warm
>   cache, and positive polling gates elsewhere (checklist trap 21).
> - **Virtualisation started to bite.** Virtuoso mounts only what is on screen; with an empty
>   list everything fitted, so the long-standing "rows are virtualised" warning had no teeth.
>   It broke `MOB.346`, which anchored on the `Today` group header (checklist trap 22).
> - **Two blocked items became possible**: `MOB.342`'s status-ring **exclusion** leg (it needed
>   a second status) and `MOB.349` record cycling (it needs ≥2 work orders).
> - **`MOB.340`'s vacuous search** — the concern below that it had been asserting its controls
>   against an empty list — is now moot going forward, though it says nothing about the runs
>   that already passed.

*Found 2026-08-18 while building `MOB.341`/`MOB.342`. Filed as a fixture defect with a
test-quality consequence, not as an application bug — but see the last section, because §5
makes it one from a user's point of view.*

### What was measured

`MOB.342_Work_Status_Ring` failed on a row locator that turned out to be correct. Rather than
guess between "wrong locator" and "no data" — the two have opposite fixes —
`MOB.978_DIAG_WorkList_Probe` asked both questions in one run:

| probe | result |
|---|---|
| `RingProgress` rendered | **PASS** |
| legend has a `Status (n)` entry | **FAIL** |
| body contains `Ready (` | **FAIL** |
| any element with class `*Paper*` | **FAIL** |
| body contains `Description:` / `Assets:` / `Address:` | **FAIL** ×3 |
| Virtuoso scroller mounted | **PASS** |
| `input[placeholder="Find Workstage(s)"]` present | **PASS** |

The page mounts completely — search box, scroll container, status ring — and contains **zero
work stages**. `WorkStatusSummary` still renders its `RingProgress`, with `sections=[]`; the
legend filters out every entry via `v.quantity > 0`.

Note `loadedAll` is **true** in this state: it is
`!!edges && edges.length === pageInfo.totalCount`, and with an empty list that is `!![]`
(true) and `0 === 0`. So the list is not still loading. It is loaded, and empty.

### The test-quality consequence

**`MOB.340_Work_Search_Sort` has been green against an empty list.** Its assertions are: the
search box is present, typing puts text in it, the Sort Criteria modal opens and closes. All
four are true with no data on the page. It proves those controls *mount*; it has never proved
that searching filters anything or that sorting orders anything.

This is trap 5 in its purest form — and it hid for as long as it did precisely because
**nothing had ever asserted that a work row renders at all**. `MOB.310`/`MOB.320` reach the
fixture work order by deep link (`WorkStageDetails` queries by id), and `MOB.134` visits
`/work` only to warm the lookup cache before deep-linking. The list page's *contents* were
never on any test's path.

### WHY it is empty — the server rule, read from source

`server/src/controllers/work/workStage/find/getWorkStages/utils/getCrew.ts`. When `crew` is
`'<SESSION>'` (which is what mobile always sends), a work stage is returned **only if all of
these hold**:

1. **Assigned to your crew** — `EXISTS (SELECT * FROM workstageassignment WHERE
   workStageId = workstage.id AND roleId = <your role id>)`. A crew *is* a role in MentorTwo,
   so this is the session's role.
2. **Status is one of `In Progress`, `On Hold`, `Ready`** — *or* `Complete`/`Pending` whose
   `statusDate` is inside the retention window (`mobilejobtemplate.workRetentionHours`,
   default **48 hours**), which additionally requires the workflow to have a mobile template.
   Note `Canceled`, `Requested`, `Not Completed` and `Superseded` are **never** returned.
3. **NOT tied to an asset verification job** —
   `NOT EXISTS (SELECT * FROM mobilejob WHERE workStageId = workstage.id)`. The source comment
   is explicit that these workstages exist to hold the failure/condition data for a mobile job
   and are deliberately hidden from the work list.
4. **If the role's `mobileDownloadMode` is `SCHEDULED`** — a `scheduledevent` for the crew
   within **±7 days**. The column defaults to `ASSIGNED` (`Role.ts`), so this usually does not
   apply, but a role configured to `SCHEDULED` with no events would show an empty list even
   with everything else correct.

Two things worth noting for anyone diagnosing this:

- **The status filter that reads like the obvious culprit is not applied to mobile.**
  `getWorkStages/index.ts:30` sets `q.status = [{in: [...]}]` only `if (args.crew !==
  '<SESSION>')`. Mobile is excluded from *that* filter and subject to the stricter rule above.
- **`Ready` is allowed**, so `MOB.320` leaving the fixture at `Ready` is not the cause.

### Which rule the fixture trips — not yet determined

Rule 2 is ruled out (the fixture ends `Ready`). That leaves 1, 3 or 4, and they cannot be told
apart from the client:

- **Rule 1** is the plainest explanation and matches §5 — the fixture was described there as
  *manually assigned*, and an assignment that was once set can be changed or lost.
- **Rule 3 is the interesting one.** A mobile job's workstage is hidden by design, and
  `MOB.575` drives Failure/Condition through `job.mobileJob.workStageId`. If the AV fixture
  job's `workStageId` **is** `EYRpYJ9QYdQ1JFF10JtB0Q`, then the work fixture is the mobile
  job's workstage, and its absence from the list is **correct behaviour, not a fixture error**
  — it would also mean the work-order tests and the asset-verification tests have been sharing
  one record.
- **Rule 4** would be a role misconfiguration.

**How to check, in order:** `SELECT * FROM workstageassignment WHERE workStageId =
'EYRpYJ9QYdQ1JFF10JtB0Q'` (rule 1) · `SELECT * FROM mobilejob WHERE workStageId =
'EYRpYJ9QYdQ1JFF10JtB0Q'` (rule 3) · `SELECT mobileDownloadMode FROM role WHERE name =
'Admin'` (rule 4). One query settles it; nothing in the client can.

### Why more test runs cannot fix it

`MOB.300` creates a work order every run, but per §5 created work orders are **not
crew-assigned**, so they never enter `workStages(crew: '<SESSION>')` and never appear in
`/work`. Mobile can therefore create work it can never afterwards see in its own list — §5
recorded that as a property of the create flow; this section is what it looks like from the
list end, which is that the list is permanently empty.

**Severity: high for coverage, and arguably a real product issue.** The Work Orders list is
one of the six things on the home screen. On dev, as the `Admin` crew, it shows nothing.

**Suggested fix:** get one work stage to satisfy all four rules for the `Admin` role — in
practice, assign a work order to the `Admin` crew and leave it `Ready`, making sure it is not
the workstage behind a mobile job (rule 3). That single change unblocks the withdrawn
status-ring test, gives `MOB.340` something to actually assert, and makes `MOB.341`'s map view
show a marker.

⚠️ **Do not "fix" this by relaxing the server rule.** Rules 2 and 3 are deliberate — they keep
a technician's device from downloading terminal work and stop mobile-job workstages appearing
as if they were ordinary work. The gap is in the dev data, not in `getCrew.ts`.

**Test-side state:** `MOB.341_Work_Map_Toggle` was rewritten to be data-independent (it
discriminates list-vs-map by the Virtuoso scroller and the Mapbox canvas) and is green.
`MOB.342` was deleted rather than left red; its design is preserved in
`testing_checklist.md` → T2.1. `MOB.978_DIAG_WorkList_Probe` is kept, paused and in no suite,
until the fixture is fixed — then delete it.

---

## 26. Asset Type appears editable on the Asset Verification asset detail, "saves", and silently reverts

> ## ✅ FIXED 2026-08-24
>
> AV detail `AssetGeneralInfo` now passes `typeId: { allowUpdate: false }`, matching
> Asset Lookup. The field is no longer editable there, so it cannot toast success
> for a write `UPDATE_ASSET` cannot apply. The dedicated `UPDATE_TYPE_OF_ASSET`
> flow remains unused (still dead on Asset Lookup).

**Evidence: Runtime** (observed by the repo owner, 2026-08-20) · `DetailPage/GeneralInfo.tsx`,
`AssetVerification/AssetGeneralInfo.tsx`, `AssetLookup/AssetLookupDetails/index.tsx`

On the Asset Verification asset detail, the **Asset Type** field renders as editable. Changing
it and submitting shows a **`Record Updated`** toast — and then the value reverts to what it
was. Nothing tells the user the change did not take.

### Mechanism

Two different components render an asset's General Info, and only one of them protects this
field.

| Screen | Renders | Asset Type editable? |
|---|---|---|
| Asset Lookup · Collector details · AV job asset **rows** | `AssetLookupDetails` → `RecordInfoTable` | **No.** `index.tsx:45-49` overrides the column with `allowUpdate: false`, and `RecordInfoTable.tsx:92` renders the pencil only when `col.allowUpdate && canEdit` |
| AV asset **detail** (`/asset-verify/:jobId/asset/:verificationId`) | `AssetGeneralInfo` → `DetailPage/GeneralInfo` | **Yes** — its fields come from the MobileJobTemplate's section fields, which carry their own `allowUpdate`, and nothing overrides `typeId` |

`GeneralInfo.updateRecord` then submits every dirty field through **`UPDATE_ASSET`**:

```js
client.mutate({
  mutation: props.updateMutation,          // UPDATE_ASSET
  variables: { id: props.record.id, data: updatedFields },
  optimisticResponse: { [mutationName]: { ...props.record, ...values, ... } },
  update() { toast.success('Record Updated'); }
});
```

But changing an asset's type is not an `UPDATE_ASSET` operation — the app's own dedicated
path is **`UPDATE_TYPE_OF_ASSET`**, which additionally takes `copyNewAttributes` because
changing type has to decide what happens to the existing attributes. So:

1. the optimistic response paints the new type immediately,
2. `update()` fires `Record Updated` **off the optimistic response**, before any server reply,
3. the server does not apply `typeId`, and
4. the cache reconciles against the real response — the field reverts.

The toast is therefore actively misleading: it reports success for a write that never
happened. (This is the same optimistic-toast hazard as §11 and trap 6, but here the write
does not merely go unconfirmed — it is *known* not to be applied.)

### Related: the guarded path is unreachable, so the guard never runs

`AssetLookupDetails` **does** implement the correct flow — `index.tsx:180` intercepts
`column.id === 'typeId'` and opens `CopyAttributesConfirmation`, which asks whether to delete
existing attributes before loading the new type's, then calls `UPDATE_TYPE_OF_ASSET` with the
answer. That is the right design.

It can never run. The same file sets `allowUpdate: false` on `typeId`, so no pencil renders,
so `onEditButtonClick` is never called with that column. `CopyAttributesConfirmation` and the
`UPDATE_TYPE_OF_ASSET` call are referenced from nowhere else in `client/mobile` or
`client/src` — **dead code**.

So mobile has the careful path disabled and the careless path exposed.

### Suggested fix

Either make the AV detail route `typeId` through the same `CopyAttributesConfirmation` /
`UPDATE_TYPE_OF_ASSET` flow, or mark the field non-editable there as `AssetLookupDetails`
already does. Whichever is chosen, `GeneralInfo` should not toast success from inside an
optimistic `update()` for a field the mutation cannot write.

⚠️ **If the AV path is wired to the real mutation, note what the happy path does**: the
confirmation's first button is *"Update The Asset Type And Attributes"*, whose own text reads
*"delete all existing asset attributes … This action cannot be undone."*

### Test status

**Not covered, and deliberately so.** The checklist previously called the `typeId` branch the
highest-value gap in T2.4 on the strength of reading the handler; that was wrong — the branch
is unreachable from Asset Lookup. A characterization test on the AV path is possible (change
the type, assert the toast, re-navigate, assert it reverted) and would fail when the bug is
fixed, in the manner of `MOB.820`. It needs an owner decision first.


---

## §27 · `useGeolocation` is dead code — and it is the *tested* half of geolocation

> ## ✅ FIXED 2026-08-24
>
> `useGeolocation` and its Jest suite were deleted, along with the commented
> Map import. Live geolocation remains `GeolocateButton` / `ProximityMenu`.

**Evidence: Source — confirmed 2026-08-23.**

`hooks/useGeolocation.ts` has exactly one consumer, and it is commented out:

```
components/Map/index.tsx:22    // import { useGeolocation } from '../../hooks';
components/Map/index.tsx:61    // const userLocation = useGeolocation({ timeout: 500000000 });
```

Nothing else imports it (`hooks/index.ts` re-exports it; that is the only other reference).

**Why it is worth an entry rather than a shrug** — this is the same shape as §4
(`DeleteButton`) and §23 (`HomeWidgets`), but with a twist that inverts the usual priority
argument: **it has a six-case Jest suite** (`hooks/__jest__/useGeolocation.test.ts`), while
`QueueLink`, `PersistedQueueLink`, `SerializeLink` and `ErrorLink` — the offline queue, the
highest-risk surface in the app — have **none at all** (§30). Test effort exists; it is
pointed at the dead hook.

Two smaller things, noted only because whoever revives it will hit them:
- the effect closes over `options` with an empty dep array (`useGeolocation.ts:34`), so option
  changes after mount are ignored — a stale closure that is harmless only because nothing
  calls it;
- it is the only geolocation consumer using **`watchPosition`**; the two live ones
  (`GeolocateButton.tsx:27`, `ProximityMenu.tsx:28`) use `getCurrentPosition`. Anything
  stubbing geolocation must cover both, which is why `MOB.731`'s stub does.

**Fix**: delete the hook and its test, or revive the consumer. Do not leave it as the only
geolocation code with tests.

---

## §28 · The offline message sits behind a `disabled` element's own `onClick`

> ## ✅ FIXED 2026-08-24
>
> The control is a real `button` (not a `span`), is not `disabled`, and uses
> `aria-disabled` plus `aria-label` when offline. Offline tap still opens
> the popover (`MOB.911`).

**Evidence: Source. Runtime-checked 2026-08-23 — `MOB.911_Offline_Geolocate` is green.**

✅ **The click DOES fire**, so the message is reachable with a mouse/touch tap. The severity
here is therefore **not** "the feature is broken" — it is the accessibility gap below, plus the
fragility of depending on three separate implementation details to keep working.

`GeolocateButton.tsx` renders `OFFLINE_FEATURE_MESSAGE` in a `Popover`, and the only thing
that opens that popover is the button's own `onClick` (`:82-89`) — on a control that is
simultaneously **`disabled={!online}`** and `component="span"` (`:80-95`).

So the app's one user-facing offline explanation is reachable only by clicking the control it
has just disabled. Whether that works at all is a property of three separate details:

1. `component="span"` — `disabled` is functional only on **form controls**; on a `<span>` it
   is an inert attribute and does not block event dispatch.
2. Mantine's disabled rule for ActionIcon (`styles/ActionIcon.css:59`) sets `cursor`, `border`,
   `color`, `background` — and **no `pointer-events: none`**.
3. Neither `ActionIcon.mjs` nor `UnstyledButton` guards `onClick` on the disabled state.

Reading those, the click should fire — **and `MOB.911` confirmed it does.** **But it is
fragile by construction**: any one of
those three changing — a Mantine upgrade adding `pointer-events: none`, or someone switching
`component` to `button` — silently removes the only path to the message, with no test
failing and nothing visibly broken.

⚠️ **Independently of the click question, this is an accessibility defect.** A `<span>` with a
`disabled` attribute is **not focusable, exposes no `aria-disabled`, and has no keyboard
path**. Keyboard and screen-reader users cannot reach the explanation at all.

**Fix**: do not gate the affordance on the disabled control. Render the `Popover`/`Tooltip` on
a wrapping element, or keep the control enabled and show the message on activation. Add
`aria-disabled` and a focusable host either way.

---

## §29 · A Mapbox failure makes Geolocate fail silently

> ## ✅ FIXED 2026-08-24
>
> `reverseGeocode` checks `q.ok`, wraps in try/catch, and on failure still calls
> `onResult` with coordinates plus a warning toast.

**Evidence: Source.**

`GeolocateButton.tsx:122-127`:

```js
async function reverseGeocode(lng, lat) {
    const q = await fetch(`https://api.mapbox.com/.../${lng},${lat}.json?...`);
    const results = await q.json();   // no ok-check, no try/catch
    return results.features;
}
```

It is awaited inside the `getCurrentPosition` **success callback** (`:27-28`), which is an
`async` function whose promise nobody holds. So if Mapbox is down, rate-limits, returns a
non-JSON error body, or the device is on a captive portal:

- `q.json()` throws,
- the callback's promise rejects **unhandled**,
- **`onResult` never fires** — no coordinates, no address, no toast, no console error the user
  would see.

The user taps Geolocate and **nothing happens at all.** That is the same silent-failure shape
as §9 (invalid form submits silently) and it is equally hard to diagnose from the outside.

Note the asymmetry: the geolocation error path *is* handled (`:71-73` logs), and
`ProximityMenu` toasts its failures (`ProximityMenu.tsx:50`). Only the geocoding hop is
unguarded — and it is the one that depends on a third party.

**Fix**: check `q.ok`, wrap in `try/catch`, and on failure still call `onResult` with the
coordinates (which succeeded) and a null address, plus a toast. Losing the address is
recoverable; losing the whole result silently is not.

---

## §30 · The offline transaction queue has no tests in either harness

> ## ✅ FIXED 2026-08-24
>
> Jest coverage added under `client/mobile/graphql/links/__jest__/` for
> `QueueLink`, `PersistedQueueLink`, `SerializeLink`, `ErrorLink`, and
> serialize/network gating utils. Datadog still cannot reach the queue.

**Evidence: Source — confirmed 2026-08-21.**

`graphql/links/` is the offline-first mutation queue — the feature the mobile app exists to
provide, and the one whose failure loses user work. Counted:

| | |
|---|---|
| Jest test files in `client/mobile` | **218** |
| source files in `graphql/links/` | 7 |
| of those, tested | **2** — `UploadLink`, `TusUnauthorizedRetry` |
| **`QueueLink`, `PersistedQueueLink`, `SerializeLink`, `ErrorLink`** | **0 tests** |
| `workers/` | **0 tests** |

It is not covered by the Datadog suite either, and cannot be: `graphql/index.tsx:68` reads
`navigator.onLine`, which a dispatched `offline` event does not change — so requests still go
out and nothing ever queues. `MOB.910` and `MOB.911` cover the offline **UI**; they must never
be read as queue coverage, and both say so in their own descriptions.

**So the highest-risk surface in the application is unprotected in both harnesses**, while a
dead hook has six tests (§27).

**Fix**: this is a **Jest** job, not a Synthetics one — the links are unit-testable in
isolation (mock the terminating link, assert ordering, persistence across a simulated reload,
and drain-on-reconnect). That is the cheapest large risk reduction available anywhere in this
codebase.


---

## §31 · A deploy takes over a running session silently — and deletes the cache it was using

> ## ✅ FIXED 2026-08-24
>
> `skipWaiting()` / `clients.claim()` stay. `mobile.ejs` listens for
> `controllerchange` and reloads the page once (`refreshing` guard) so a
> new worker does not keep serving the old bundle.

**Evidence: Source — read 2026-08-23.**

Registration (`server/src/views/mobile.ejs:22-30`) is a bare script with only a `.catch` for
logging:

```js
navigator.serviceWorker.register('/apm-mobile-sw.js')
    .catch(err => console.error('❌ Service Worker registration failed:', err));
```

**No `updatefound` listener. No `registration.waiting` handling. No prompt.** And `sw.js` opts
into taking over as fast as possible:

```
workers/sw.js:34   self.skipWaiting();      // in `install`
workers/sw.js:49   self.clients.claim();    // in `activate`
```

So when a deploy lands while someone is mid-session, the new worker installs, skips the
waiting phase, and claims the open page — **all without the page reloading and without the
user being told.** The tab keeps running the OLD JavaScript bundle while being served by the
NEW worker.

⚠️ **The `activate` handler then deletes the cache that page is relying on** (`:38-50`): it
drops every `apm-mobile-*` cache whose key is not the new `CACHE_NAME`. Only the current
version's assets are precached (`PRECACHE_ASSETS` is built from `VERSION`), so anything the
running page lazy-loads afterwards — a route chunk it has not needed yet — is no longer in any
cache and must come from the network under the OLD versioned filename. If the deploy does not
keep old versioned assets served, that request fails and the user sees a broken screen or a
chunk-load error, mid-task, with no explanation.

**This is a deliberate trade-off, not obviously a defect** — `skipWaiting` is a legitimate
choice, and how bad it gets depends on whether old build artefacts stay served, which is a
deployment question this repo does not answer. It is logged because the *silent* part is the
risk: there is no code path by which a user is ever told to reload, so the failure surfaces as
"the app broke" rather than "there is an update".

⚠️ It also interacts with the offline queue (§30): a worker swap mid-session while mutations
are queued is exactly the scenario nothing tests in either harness.

**Fix (pick one)**: drop `skipWaiting()` and add an `updatefound` → `waiting` → *"Reload to
update"* prompt (the row `testing_checklist.md` T1.5 assumed already existed); **or** keep
`skipWaiting()` and have the page listen for `controllerchange` and reload itself; **or**
confirm the deploy keeps old versioned assets served and document that this is what makes the
current behaviour safe.

---

## §32 · The work-stage **Docs** upload is gated on `asset.create`, while the **Photos** tab beside it is gated on `work.update`

> ## ✅ FIXED 2026-08-24
>
> `AttachmentTable` now takes `canAddFiles` from the call site, the same way
> `canAddPhotos` already works. Work-stage Docs passes `work.update`. Asset
> FileAttachments still defaults to `asset.create`.

**Severity:** low–medium (permissions correctness) · **Source-read** while writing `MOB.741` ·
`client/mobile/components/DetailPage/Attachments.tsx:124` and
`client/mobile/components/WorkOrders/components/WorkStageAttachments.tsx:32,135`

Both halves of the same panel attach files to the **same work stage**, and they check different
permissions on different models:

```tsx
// WorkStageAttachments — the Photos tab
const workPerms = sessionData?.session?.me.role.permissions.work.update;
<Attachments canAddPhotos={workPerms} … />          // ← work.update

// AttachmentTable — the Docs tab, rendered for the SAME workStageId
sessionData?.session?.me.role.permissions.asset.create &&
    <FileButton onChange={addFiles} multiple accept="*/*"> … Add File …
```

`AttachmentTable` is shared with `FileAttachments`, where the parent really *is* an asset — so
the `asset.create` check is presumably a leftover from that call site rather than a decision
about work stages. Nothing scopes it per parent type.

**Consequences, both directions:**

- a role with `work.update` but **not** `asset.create` can add photos to a work stage but
  cannot add a document to it — the Docs tab renders with no way to add anything
- a role with `asset.create` but **not** `work.update` gets the opposite: no photo button, but a
  working `Add File` that uploads to a work stage it may not be allowed to modify

**Not observed at runtime** — the `Admin` fixture holds both permissions, so `MOB.741` cannot
tell the two apart and does not try to. That test asserts the button is *present* and names the
step so a failure reads as a permission/session problem rather than a broken locator.

**Suggested fix:** pass the gate in from the call site the way `canAddPhotos` already is —
`AttachmentTable` should not be deciding which model's permission applies to a parent it is
handed.
