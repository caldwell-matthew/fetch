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

**Every status below was read against the served code — `origin/development@cad415620c`, 2026-09-10.** A status says what the code does, with the file and line that says so; a fix reported elsewhere is not a status. Re-read a row before acting on it once the sync line in `testing_checklist.md` has moved on.

⚠️ **Keep this file current as work happens, not in a catch-up pass.** §29 and §31 were both found days before they were written down, and lived only as comments inside test generators — where nobody looking for app bugs would ever find them. If a finding is about the APP, it belongs here; if it is about a TEST, it belongs in `testing_checklist.md`.

✅ **A fixed finding is DELETED from this file, entry and row.** This is what is wrong with the app now, not a history of what used to be. Numbers are never reused, so gaps in the sequence are expected: §1, §5, §14–§17, §19, §26 and §36 are gaps, not missing entries.
(§36 was withdrawn: the AV sort was correct all along — `MOB.580` had hardcoded which of
two assets sorts first, and the fixture had been renamed `⚡ Tank 0000`, whose leading
symbol collates before `A`. A wrong test is not an app bug.)

⚠️ **Do not renumber.** `testing_checklist.md` cross-references §4, §9, §10, §11, §20, §21, §23, §24 and §25 by number.

| § | Finding | Evidence | Status |
|---|---|---|---|
| 2 | `CreateWorkButton` reads the session non-reactively | Source | ❌ open — `InsertForm/index.tsx:369` still `readQuery` in render |
| 3 | Crew shortcut invisible at phone width | Source | ❌ open — `.mobile-crew` still `display:none` under 450px |
| 4 | Mobile is delete-free; `DeleteButton` is dead code | Source | ❌ open as dead code — `ui/DeleteButton.tsx` still unimported. **The rule stands: no delete steps** |
| 4b | `WorkCollectionMenu` gates on a permission field that does not exist | Source | ❌ open — `ui/Menu.tsx:30` reads `wPerms.canDelete`; the schema field is `delete` |
| 4c | Adding a form is self-degrading — succeeds only once | Runtime | ❌ open — `AdHocForm.tsx:118` still hides attached forms, unexplained · `MOB.393` stays one-shot |
| 6 | Crew and logout modals have no close control | Source | ❌ open — `TopHeader/index.tsx:76,153,188` all `withCloseButton: false` |
| 7 | Several roles share the `Admin` prefix with different permissions | Operational | open — env/data, not an app-code fix |
| 8 | `hooks/NetworkStatus.tsx` is an empty file | Source | ❌ open — `hooks/NetworkStatus.tsx` is 0 bytes |
| 9 | An invalid form submits silently | Source | ❌ open — `SubmitButton` still `type={isValid ? 'submit' : 'button'}` |
| 10 | Mobile job status only moves forward | Runtime | ❌ open — `VerificationCheckbox.tsx:44` never reverses `COMPLETED` · forces `cleanup_spec.md` §7 |
| 11 | Verification toast fires before the mutation | Source | ❌ open — `VerificationCheckbox.tsx:24` toasts before `client.mutate` |
| 12 | Asset detail route implements 6 of 16 template section types | Source | ❌ open — 6 of **16** section types (the enum grew) |
| 13 | Escape discards the whole new-asset form | Source | ❌ open — `AssetCollector/index.tsx:264` sets `closeOnClickOutside` only |
| 18 | `SubmitButton` ignores the label passed as children | Source | ❌ open — `{buttonText}` still wins over a caller's children (cosmetic, latent) |
| 20 | Submitting search discards active structured filters | Runtime | ❌ open — submit refetches with `props.query ?? []` · `MOB.820` pins it |
| 21 | Permits tab renders blank with no permits | Source | ❌ open — `Permits.tsx` renders nothing when the list is empty |
| 22 | `useMediaQuery` inside a loop callback | Source | ❌ open — `useMediaQuery` still inside `options.map` |
| 23 | `HomeWidgets` hardcodes counts / queries the wrong thing | Source | ❌ open as dead code — `routing/HomeWidgets.tsx` unimported |
| 24 | `Supersesed` misspelling in the status legend | Source | ❌ open — `StatusSummary/index.tsx:45` still `Supersesed` |
| 25 | The `Admin` crew's work list is empty on dev | Operational | 🔄 no longer true — **kept, not a bug**: the four list-population rules in the entry are what the checklist's `MOB.346` row cites |
| 27 | `useGeolocation` is dead code — but carries a full Jest suite | Source | ❌ open as dead code — only call site is commented out |
| 28 | `GeolocateButton`'s offline message sits behind a `disabled` element's own `onClick` | Source | ❌ open — `GeolocateButton.tsx:94` disables the element carrying the popover's `onClick` |
| 29 | A Mapbox failure makes Geolocate fail **silently** | Source | ❌ open — `reverseGeocode` has no `q.ok` check and no `catch` |
| 30 | The offline transaction queue has **no tests in either harness** | Source | ❌ open — only `UploadLink` and `TusUnauthorizedRetry` have Jest |
| 31 | A deploy takes over a running session silently, and deletes the cache it was using | Source | ❌ open — no `controllerchange` handler in `client` |
| 32 | Work-stage Docs upload gated on `asset.create` | Source | ❌ open — `Attachments.tsx:124` gates `Add File` on `asset.create` |
| 33 | Material Lookup renders at most 500 items under a label counting all of them | Runtime (`MOB.855` screenshot) | ❌ open — 996 items, 500 rows, no paging or hint |
| 34 | **Collecting an asset WITH a photo from a browser never reaches the server** — the UI reports success | Runtime (desktop: last collected asset Aug 24; `MOB.600` green Sep 8–9) + Source | 🛑 open — `MOB.600` carries a server-side proof and is RED until fixed (`soft`, so `MOB.994`'s later children still run) |
| 35 | Every click INSIDE the row-avatar modal toggles the accordion row behind it | Runtime (`MOB.624`) + Source | ❌ open — `MOB.624` restores the row and sentinels the state |
| 37 | Asset Lookup's `Scan Barcode` does nothing in a browser — no native guard, unlike the collector's | Runtime (`MOB.750`) + Source | ❌ open — `TagLookup/index.tsx` calls `launchScanner()` unconditionally; `MOB.750` sentinels it |
| 38 | The collector's sort is saved under the ASSET VERIFICATION job list's key — a pick on one screen re-sorts the other | Runtime (`MOB.625`) + Source | ❌ open — `AssetCollector/index.tsx:137` passes `model="MobileJob"`; `MOB.625` sentinels it and restores the key |
| 39 | A record-field `includes` filter is saved with NO value — the pill shows none and the server ignores it | Runtime (`MOB.807` + API replay) + Source | ❌ open — `StructuredQuery/index.tsx:100-106` reads `.label` off an array; `MOB.807` sentinels it |

**When one is fixed, delete its entry and its index row**, then fix whatever cited it — the
checklist and `test_authoring.md` cite some of these as the reason a test is shaped the way it
is, and those lines should state the fact directly rather than point at a number that is gone.

---

## 2. `CreateWorkButton` reads the session non-reactively

> ## ❌ OPEN in the served code
>
> `CreateWorkButton` still gates its render on `client.readQuery`
> (`WorkOrders/components/InsertForm/index.tsx:369`). The `readQuery` calls inside the
> submit handlers are correct and not this bug.

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

> ## ❌ OPEN in the served code
>
> `.mobile-crew` is still `display: none` below 450px (`components/index.css:193,208`).

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

> ## ❌ OPEN in the served code — as dead code
>
> `ui/DeleteButton.tsx` and its Jest file still exist and are still imported nowhere.
> The RULE below stands either way: it is a product decision, not a code state.

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

> ## ❌ OPEN in the served code
>
> `WorkOrders/components/ui/Menu.tsx:30` still reads `wPerms.canDelete`. The GraphQL
> permission type exposes `delete` (`permissionGroup/schema/index.ts:46`); `canDelete`
> exists only on the server's `PermissionInfo`, so the field is always `undefined`.

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

> ## ❌ OPEN in the served code
>
> `AdHocForm.tsx:118` still filters out forms already on the stage, and nothing on screen
> says so.

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

## 6. Crew and logout modals have no close control

> ## ❌ OPEN in the served code
>
> `Layout/TopHeader/index.tsx:76,153,188` still opens all three modals with
> `withCloseButton: false`.

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

> ## ❌ OPEN in the served code
>
> `client/mobile/hooks/NetworkStatus.tsx` is still a 0-byte file.

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

> ## ❌ OPEN in the served code
>
> `ui/SubmitButton.tsx` is still `type={isValid ? 'submit' : 'button'}` — an invalid form
> still swallows the tap with no message.

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

> ## ❌ OPEN in the served code
>
> `VerificationCheckbox.tsx:44-45` still walks one way only — `READY → IN_PROGRESS`, then
> `→ COMPLETED` — and never reverses `COMPLETED`. This is why the AV fixture needs the
> per-run reset designed in `cleanup_spec.md` §7.

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

> ## ❌ OPEN in the served code
>
> `VerificationCheckbox.tsx:24-25` still calls `toast.success` before `client.mutate`.

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

## 12. The asset *detail route* implements 6 of 16 template section types — the rest render a blank tab

> ## ❌ OPEN in the served code
>
> `AssetDetails.tsx` implements 6 of the **16** `MobileJobTemplateSectionType` values —
> GENERAL_INFO, ATTRIBUTES, ATTACHMENTS, CONDITION, EVENT_READINGS, FAILURES. The enum
> gained a value since this was written; the ratio is 6 of 16, not 6 of 15.

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

> ## ❌ OPEN in the served code
>
> `AssetCollector/index.tsx:264` still sets `closeOnClickOutside={false}` and nothing else,
> so Escape still closes the modal and discards the form.

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

> ## ❌ OPEN in the served code
>
> `ui/SubmitButton.tsx` still renders `{buttonText}` in the child position, so a caller's
> `children` is still ignored. Cosmetic and latent — every current caller passes
> `buttonText`.

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

## 20. Submitting the search box silently discards every active structured filter

> ## ❌ OPEN in the served code
>
> `AssetLookup/index.tsx:173` still refetches with `buildParams(1, [...(props.query ?? [])])`
> on submit, dropping the local `filters` state. `MOB.820` pins the bug.

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

> ## ❌ OPEN in the served code
>
> `Permits.tsx` maps `permits` and renders nothing at all when the list is empty — no
> empty state, no message.

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

> ## ❌ OPEN in the served code
>
> `SegmentedControlWithIcons/index.tsx:16` still calls `useMediaQuery` inside
> `showDisplayLabel`, which runs inside `options.map`.

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

> ## ❌ OPEN in the served code — as dead code
>
> `routing/HomeWidgets.tsx` still exists and is imported nowhere.

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

> ## ❌ OPEN in the served code
>
> `WorkOrders/components/StatusSummary/index.tsx:45` still reads `status: 'Supersesed'`.

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

*Filed as a fixture defect with a test-quality consequence, not as an application bug.*

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

- **Rule 1** is the plainest explanation: the fixture was manually assigned, and an assignment
  that was once set can be changed or lost.
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

### Why more test runs could not fix it

`MOB.300` creates a work order every run, and at the time those creates were not
crew-assigned — they never entered `workStages(crew: '<SESSION>')`, so they never appeared in
`/work` and could not populate the list. **That create-side defect has since been fixed**, so
a create now lands in the crew's list; the list was populated by hand before that landed.

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

## §27 · `useGeolocation` is dead code — and it is the *tested* half of geolocation

> ## ❌ OPEN in the served code — as dead code
>
> `hooks/useGeolocation.ts` and its Jest file still exist; the only call site is commented out
> (`Map/index.tsx:21,60`).

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

> ## ❌ OPEN in the served code
>
> `ui/GeolocateButton.tsx:94` still puts `disabled={!online}` on the very element whose
> `onClick` opens the offline popover.

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

> ## ❌ OPEN in the served code
>
> `reverseGeocode` (`GeolocateButton.tsx:123`) still has no `q.ok` check and no `catch`, and
> the geolocation error path is `console.log('ERROR!', err)` — nothing reaches the user.

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

> ## ❌ OPEN in the served code
>
> `client/mobile/graphql/links/__jest__` holds only `UploadLink` and `TusUnauthorizedRetry`.
> `QueueLink`, `PersistedQueueLink`, `SerializeLink` and `ErrorLink` are still untested.

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

> ## ❌ OPEN in the served code — **the worker was rewritten on 2026-09-10 and this survived it**
>
> `workers/sw.js` was rebuilt and `workers/register.ts` is new. The takeover is unchanged and
> slightly more assertive: `skipWaiting()` in `install`, `clients.claim()` in `activate`,
> `cleanupCaches()` deleting every cache but the current one — and still **no
> `controllerchange` handler anywhere in `client`**, so nothing tells the page or the user.

**Evidence: Source.** Registration moved out of the EJS template into
`client/mobile/workers/register.ts`, called at import time from `client/mobile/index.tsx`. It
retires the old root-scoped registration and registers at `/apm-mobile`, with only a `.catch`
for logging — no `updatefound` listener, no `registration.waiting` handling, no prompt:

```ts
// workers/register.ts
return serviceWorker.register(MOBILE_SERVICE_WORKER_URL, { scope: MOBILE_SERVICE_WORKER_SCOPE });
```

And `sw.js` still opts into taking over as fast as possible:

```js
await self.skipWaiting();   // end of `install`
await self.clients.claim(); // in `activate`, after cleanupCaches()
```

⭐ **New in the rewrite, and worth knowing before writing an offline test:** navigations to
`/apm-mobile*` are now **network-first with a cached offline shell**
(`/apm-mobile/?offlineShell=1`), falling back to a hard-coded page reading *"You are offline"* /
*"Reconnect and try again."*. That page is unreachable from Synthetics — `MOB.910` dispatches
the `offline` **event** and the browser never actually goes offline — so no existing test sees
it, and none can.

So when a deploy lands while someone is mid-session, the new worker installs, skips the
waiting phase, and claims the open page — **all without the page reloading and without the
user being told.** The tab keeps running the OLD JavaScript bundle while being served by the
NEW worker.

⚠️ **The `activate` handler then deletes the cache that page is relying on** (`cleanupCaches()`):
it drops every `apm-mobile-*` cache whose key is not the new `CACHE_NAME`. Only the current
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

> ## ❌ OPEN in the served code
>
> `DetailPage/Attachments.tsx:124` still gates `Add File` on `asset.create` for every
> parent, work stages included.

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

## §33 · Material Lookup renders at most 500 items under a label that counts all of them

**Found by** `MOB.855_MaterialLookup_Column_Sort`, 2026-09-09 (its first run's screenshot).

`MaterialLookup/index.tsx` queries `MOBILE_MATERIAL_ITEM_LOOKUP` with `limit: 500` and never
pages, then renders `${pageInfo.totalCount} matches` above the table. `Central Storeroom` holds
996 items, so the screen shows **500 rows under "996 matches"** with nothing to indicate the
other 496 exist. Column sorting is server-side, so sorting changes *which* 500 are shown.

**Test consequence:** the match-count assertion is `rows == min(matches, 500)`, not equality.
Raise the limit, page, or say "showing 500 of 996" — any of the three fixes the label.

## §34 · Collecting an asset with a photo from a browser never reaches the server, and the UI says it did

**Found** 2026-09-09. The owner confirmed on desktop that the newest `DD SYNTHETIC MOBILE` asset
is dated **Aug 24**, while `MOB.600` passed on Sep 8 and Sep 9. The first `MOB.623` run's
screenshot showed the same: the server-side `collectedAssets` list held nothing newer than Sep 3.

**Mechanism (source).** `AssetCollector/utils/createAsset.ts` sends `MOBILE_COLLECT_ASSET` with
`context.thumbnails` whenever photos are attached. `graphql/links/UploadLink.ts` handles that
context by calling `callNative('UPLOAD_THUMBNAILS')` and only forwards the operation when the
bridge answers. `ReactNativeBridge.callNative` creates a promise, registers it as pending, and
posts the message with `window.ReactNativeWebView?.postMessage(...)` — with no shell the post is
skipped, nothing ever resolves it, and the mutation is never sent (confirmed in source
2026-09-09). `DetailPage/utils/uploadPhoto.ts` says so in its own comment and tus-uploads instead;
`createAsset.ts` was never given the same branch. Meanwhile the `optimisticResponse` fills the
cache, `prependTableResults` puts the row at the top of the list, the toast fires, and the form
closes — every visible signal of success, with nothing on the wire.

**Scope — this is NOT "browser uploads are broken".** Adding a photo to an EXISTING record works
from a browser: `uploadPhoto.ts` tus-uploads via `context.uploads` and then sends its mutation.
`MOB.623` measured it on 2026-09-09 (the marker asset's badge went 0 → 1 → 2 across runs, and
`ROTATE_IMAGE` round-tripped against the server). Only the collector's **create-with-photo**
path is stuck, because `createAsset.ts` never got that browser branch.

Assets collected **without** a photo take the plain path and persist, which is why the Aug 21/24
residue exists and carries a `0` badge: those runs predate the photo step.

**Why the test missed it for two weeks.** `MOB.600`'s "PROOF OF CREATION" read the collected
list — the row the client had just written. Trap 6, exactly. `MOB.600` now ends by searching
Asset Lookup (a `network-only` query) for the run's exact name; that step is red until the app is
fixed, and `MOB.994` is red with it. **Do not make that step `optional`.** It is `soft`
(critical + `allowFailure`): `MOB.600` still fails, but the run carries on, so the children after it
in `MOB.994` still execute instead of reporting red unrun.

**Fix.** Give `createAsset.ts` the browser branch `uploadPhoto.ts` already has: tus-upload the
files via `context.uploads` when `!window.ReactNativeWebView`, and reserve `thumbnails` for the
native shell.


## §35 · Every click inside the row-avatar modal toggles the accordion row behind it

**Found by** `MOB.624_Collector_Row_Avatar_Modal`, 2026-09-09 (its first two runs, identical).

`AssetCollector/index.tsx:176` renders `<Accordion.Control component="span">` and, inside it,
`<AssetAvatarWithModal asset={asset} />`. That component's `<Modal>` is therefore a React CHILD
of the control. Mantine portals the modal into `document.body`, so in the DOM it is nowhere near
the accordion — **but React propagates events through the React tree, not the DOM tree.** Every
click inside the modal reaches the control's `onClick` and toggles the row underneath it.

The avatar itself is safe: its own handler calls `e.stopPropagation()` before `setOpened(true)`
(`AssetAvatarWithModal.tsx:30`). Nothing inside the modal does.

**Runtime evidence.** `MOB.624` asserted the row COLLAPSED right after the modal opened — green.
It then clicked three times inside the modal (the Photos radio, the Docs radio, `Done`), and the
closing assertion found the row EXPANDED. Three toggles, odd parity. The failure screenshot shows
the modal gone and `DD SYNTHETIC MOBILE 43398722` expanded to its General Info tab.

**User-visible effect.** Open an asset's attachments from the avatar, tap between Photos and
Docs, tap `Done` — the row you started from is now expanded (or collapsed) depending on how many
times you tapped, and the list under your finger reflows. Nothing is corrupted; the list state is
just decided by tap parity inside an unrelated modal.

**Same shape elsewhere.** `AssetVerification/JobAccordianControl.tsx` and
`WorkOrders/components/Assets/index.tsx` render the same component in the same position. Only the
collector is measured; assume, and check, the other two.

**Fix.** Stop the propagation the modal never stops — one `onClick={e => e.stopPropagation()}`
on the `Modal`'s content (or on the `Stack` inside it) — or lift the `<Modal>` out of
`Accordion.Control` so it is not a React descendant of the toggle.

**Test consequence.** `MOB.624` is not red for this. It collapses the row again on the way out
and carries an `optional` SENTINEL step asserting the expanded state; when this is fixed the
sentinel flips to ERR without failing the test, and that is the signal to delete it.


## §37 · Asset Lookup's `Scan Barcode` does nothing in a browser — the collector hides it, Asset Lookup does not

**Found by** `MOB.750_AssetLookup_Tag_Lookup_Menu`, 2026-09-10 (its optional SENTINEL, green on
the first run that reached it).

`AssetLookup/TagLookup/index.tsx` renders a `Tag Lookup` menu with two items. `Scan Barcode`'s
handler is `launchScanner()` (`TagLookup/utils.ts`), which calls
`callNative({ type: 'LAUNCH_CAMERA' })` with no branch for the browser. Outside the native shell
`callNative` posts to `window.ReactNativeWebView?.postMessage` — absent, so nothing is sent — and
returns a promise that nothing will ever settle (the §34 mechanism). The menu closes and nothing
else happens.

**Inconsistent within the same menu, and with the app.** The item beside it, `Alphanumeric`,
checks `!!window.ReactNativeWebView` and falls back to a browser file dialog (`MOB.750` proves
that branch). And the collector's own tag capture, `AssetCollector/Form/CaptureTagIcon.tsx:38`,
only offers `Scan Barcode` *when* `window.ReactNativeWebView` exists. Asset Lookup is the one
place the item is offered where it cannot work.

**Runtime evidence.** `MOB.750` clicks `Scan Barcode` in the Datadog browser and, three seconds
later, finds the menu closed, no dialog, no toast, no file dialog requested, and the page still
on Asset Lookup.

**User-visible effect.** In a browser (the app is served at `/apm-mobile` to anyone with a
link), tapping `Scan Barcode` closes the menu and nothing happens — no error, no explanation.
A leaked, never-settled promise and a `BARCODE_SCAN_RESULTS` listener are left behind per tap.

**Fix.** Guard the item the way `CaptureTagIcon` does — render it only when
`window.ReactNativeWebView` exists — or give it a browser branch.

**Test consequence.** `MOB.750` is not red for this. Its SENTINEL step is `optional`; when this is
fixed it flips to ERR without failing the test, and that is the signal to rewrite it (a hidden
item means the MENU assertion must change to `Alphanumeric` alone).


## §38 · The collector's sort is saved under the Asset Verification job list's key — a pick on one screen re-sorts the other

**Found by** `MOB.625_Collector_List_Sort`, 2026-09-10 — read in the source while building it,
then shown at runtime by its two optional SENTINEL steps (green on the first run).

`SortDropDown` persists every pick to `sessionStorage['mobile-${model}-sort']`
(`ui/SortDropdown.tsx:88`). The collector renders it with **`model="MobileJob"`**
(`AssetCollector/index.tsx:137`) — the Asset Verification job list's model. The collector never
reads the key back (its sort is `useState(null)`), but the job list does, on mount, as its
initial sort (`AssetVerification/index.tsx:33-40`), and `RecordCyclingButtons` reads it to order
job cycling.

**Runtime evidence.** `MOB.625` picks `Name ▼` on the collector, then opens the job list: its
sort picker reads `Mobile Job Name ▼` instead of its default `Created At ▼`, and the list is
sorted that way.

**User-visible effect.** Sort the collected-assets list by name, then open Asset Verification:
the job list is sorted by name too, and says so, although nobody chose that there. Picking
`Collected By Me` is worse: it stores `{ id: 'createdBy', column: 'createdBy' }`, which the job
list applies as a sort on creator name (`MobileJob` has a `createdBy` record) — while its picker
shows **nothing**, because `createdBy` is not one of its options. The list is ordered by a rule
the screen cannot display.

**Fix.** Pass the collector its own model (`model="Asset"` would collide with the AV asset list
inside a job — `Job.tsx:223` — so a dedicated key such as a `storageKey` prop is the clean fix),
or stop persisting a sort the collector never restores.

**Test consequence.** `MOB.625` is not red for this. Both sentinels are `optional`; when this is
fixed they flip to ERR without failing the test, and that is the signal to delete them. The test
stashes the key before it starts and restores it `always`.


## §39 · A record-field `includes` filter is saved with no value — the pill shows none and the server ignores it

**Found by** building `MOB.807_Search_MultiValue_Enum_Record`, 2026-09-10: read in the source,
replayed against the API for 0 runs, then shown in the UI by two optional SENTINEL steps (green on
the first run).

With operator `includes` / `does not include`, `MultiValueSelector` renders `RecordMultiSelect` for
a `record` field, whose `onChange` hands the form an **array of option ids**. `addFilter`
(`ui/StructuredQuery/index.tsx:100-106`) then builds the saved value as

```ts
selectedField.type === 'record'
  ? (vals.value as listFilterOption)?.label || (vals.value as listFilterOption)?.name
  : vals.value
```

— written for a single option object. An array has neither property, so the filter is saved with
`value: undefined`. `renderValue` has nothing to show, and `filterToCondition` sends
`{ column: 'typeId', operator: 'IN' }` with no value.

**Measured against the API** (the query Asset Lookup sends, 303 assets):

| condition | assets returned |
|---|---|
| none | 303 |
| `typeId IN` with no value — what the app sends | **303** — ignored |
| `typeId IN [<id>]` — the ids `RecordMultiSelect` holds | 0 |
| `typeId IN ['Pump']` — names | 49 (correct) |
| `failureCurve IN ['flat']` — the `enum` branch, for contrast | 81 (correct) |

So the record branch is broken twice: the value is dropped, and even the ids it held would match
nothing, because the server compares record NAMES.

**Runtime evidence.** `MOB.807` picks the first `Asset Type` option, adds the filter, and finds the
pill reading `Asset Type includes` with no value, and the asset list's first rows unchanged from
the unfiltered list. The `enum` leg of the same test filters correctly.

**User-visible effect.** Filter Asset Lookup by "Asset Type includes Pump": the filter is
accepted, a pill appears, and every asset is still listed. Every `record` field in the drawer —
Asset Type, Crew, Department, System, Operating Status and 15 more (20 on `Asset`, read over
the API) — is affected. `equals` on the
same fields works: that path stores the option's label.

**Fix.** For `record` + a multi-value operator, map the selected ids to their option labels
(`RecordMultiSelect` has them) and save the array of names.

**Test consequence.** `MOB.807` is not red for this. Both sentinels are `optional`; when this is
fixed they flip to ERR without failing the test, and the record leg should then assert the list
narrowed, like the enum leg does.
