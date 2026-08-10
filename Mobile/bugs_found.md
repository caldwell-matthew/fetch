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

Dev has at least `Admin`, `Admin (0000)` and `Admin 0100`. Only plain `Admin` can
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
