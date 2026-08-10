"""Build the ELMO charge tests. Equipment first (MOB.350); the others follow its shape.

WHY THIS NEEDS AN ADMIN-ASSIGNED FIXTURE
  The charge lookups are fetchPolicy: 'cache-only' (e.g. MOBILE_EQUIPMENT_LOOKUP in
  EquipmentCharges.customFormFields). The only thing that populates that cache is
  prefetchWorkData, and WorkOrders/index.tsx gates it on the session crew's own work list:

      React.useEffect(() => {
          if (!data?.workStages || !loadedAll) return;
          await prefetchWorkData(data.receivedAt, data.workStages?.edges ?? [], client, ...)

  With no work assigned to the crew the prefetch never runs, the lookup returns nothing,
  and the form can never validate. Hence the test VISITS /work FIRST to warm the cache,
  then deep-links to the fixture. Do not "optimise" that first navigation away.

THE FOUR FORMS ARE NOT INTERCHANGEABLE
  Equipment : equipmentId (record lookup) + quantity
  Labor     : userId + craftId + laborTypeId + qty ("Actual Hours")
  Material  : storeroomLocationId + materialItemId + quantity  (cascading; hides storeroomItemId)
  Other     : otherChargeId + userId + unitPrice + quantity
  So each needs its own field sequence; only the surrounding navigation is shared.

SUBMIT LOCATOR
  Scoped as //button[@form="work-collection-form"] rather than matching any "Submit" on
  the page. A bare Submit locator is what silently clicked the wrong control six times a
  run in MOB.320 - see the note in build_work_tests.py.

MUTATES: adds a permanent child record to the fixture on every run. Mobile has no delete
(DeleteButton is unused in client/mobile), so these accumulate and need desktop cleanup.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write  # noqa: E402

FIXTURE_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
STAGE_URL = f"{BASE}/work/{FIXTURE_ID}"
WORK_URL = BASE + "/work"
ADD_BTN = '//button[normalize-space(.)="Add"]'
SUBMIT = '//button[@form="work-collection-form"]'
TAGS = ["Mobile", "env:dev", "Work Order", "ELMO", "CRUD"]

# Labor charges are data-dependent: craftId offers only the crafts belonging to the
# SELECTED user, so an arbitrary first-match user often has none. These are known-good
# values on the test crew.
LABOR_USER = "Dev Eloper"
# Pick craft and labor type BY TEXT, not by index. A bare (//*[@role="option"])[1] matches
# any option on the page, including leftovers from the user dropdown that is now closed and
# hidden - which failed with "Element located but it's invisible". Text-matching targets the
# right list regardless of what stale options linger in the DOM.
LABOR_CRAFT = "Account Executive"
LABOR_TYPE = "Regular"
OTHER_USER = "Dev Eloper"
# Known-good dev values. Every lookup picks BY TEXT rather than by index: a bare
# (//*[@role="option"])[1] matches any option on the page, including hidden leftovers from
# a dropdown that has already closed - which is what broke MOB.360 with "Element located
# but it's invisible". Index-based picks only appeared to work because a typed search
# happened to refresh the list first.
EQUIPMENT = "AC Adapter"
STOREROOM_LOCATION = "Central Storeroom"
MATERIAL_ITEM = "0000-0000 Diaphragm Pump"
# WorkStageMaterial.type is an enum: Issue | Return. Deliberately RETURN, not Issue:
#   - Issue is validated against stock on hand ("Not enough inventory to create a charge"),
#     so it fails silently - invalid form, SubmitButton stays type="button", no toast.
#   - Worse, each Issue DECREMENTS stock, so an Issue-based test erodes its own fixture
#     until it starts failing. Return has no stock check and is stable across runs.
MATERIAL_TYPE = "Return"
OTHER_CHARGE_TYPE = "Other Charge Types"   # an OtherChargeTypes record on dev


def tab(label):
    # Tab titles come from template.sections; match on contains so a longer title
    # ("Equipment Charges") still works.
    return f'//*[@role="tab"][contains(normalize-space(.), "{label}")]'


def warm_cache_and_open():
    """Visit /work so prefetchWorkData populates the cache-only lookups, then open the
    fixture. Both steps are required - see the module docstring."""
    return [
        go(WORK_URL, "/work to warm the lookup cache"),
        step("wait", "Wait for the work list and lookup prefetch", {"value": 20}),
        go(STAGE_URL, "the fixture work order"),
        # Settle before asserting: coming off the heavy /work load, the detail view can lag.
        # Observed failing with `Page does not contain "Status:"` while MOB.310 - which
        # deep-links straight here without the warm-up - passed in the same run.
        step("wait", "Wait for the detail view to render", {"value": 5}),
        step("assertPageContains", "Test work order detail rendered", {"value": "Status:"}),
    ]


def lookup(field_id, label, search="a", pick=None):
    """Fill a ListFilter record field.

    search=None  -> focus only, do not type. Use this where the field's own filter is
                    unreliable; an empty query makes includes("") match everything, so the
                    full option list appears on focus.
    pick=None    -> click the first option; otherwise click the option whose text contains
                    `pick`, which keeps the choice deterministic instead of "whatever
                    happened to sort first".
    """
    target = ('(//*[@role="option"])[1]' if pick is None
              else f'//*[@role="option"][contains(normalize-space(.), "{pick}")]')
    steps = [
        step("click", f"Focus the {label} lookup",
             {"element": xpath_el(STAGE_URL, f'//*[@id="{field_id}"]')}),
    ]
    if search is not None:
        steps.append(
            step("typeText", f"Type into the {label} lookup to load options",
                 {"value": search, "element": xpath_el(STAGE_URL, f'//*[@id="{field_id}"]')}))
    steps += [
        step("wait", f"Wait for {label} options", {"value": 2}),
        step("click", f"Pick the {pick or 'first'} {label} option",
             {"element": xpath_el(STAGE_URL, target)}),
    ]
    return steps


write(test(
    "MOB.350_Work_Add_Equipment_Charge",
    "`MOB.350` Add an equipment charge to the fixture work order.\n"
    "- Visits /work FIRST to warm the cache: the equipment lookup is fetchPolicy\n"
    "  'cache-only' and is only populated by prefetchWorkData, which runs off the session\n"
    "  crew's own work list. The fixture must stay assigned to the test crew.\n"
    "- Submit is scoped to form=\"work-collection-form\" so it cannot match another\n"
    "  Submit control on the page.\n"
    f"- MUTATES: adds a permanent equipment charge to {FIXTURE_ID} on every run. Mobile\n"
    "  has no delete, so these accumulate and need cleaning up from desktop.",
    warm_cache_and_open() + [
        step("click", "Open the Equipment tab",
             {"element": xpath_el(STAGE_URL, tab("Equipment"))}),
        step("click", "Open the add-charge form",
             {"element": xpath_el(STAGE_URL, ADD_BTN)}),
        *lookup("equipmentId", "equipment", search=EQUIPMENT, pick=EQUIPMENT),
        step("typeText", "Enter a quantity",
             {"value": "1", "element": xpath_el(STAGE_URL, '//*[@id="quantity"]')}),
        step("click", "Submit the charge", {"element": xpath_el(STAGE_URL, SUBMIT)}),
        step("wait", "Wait for the add mutation", {"value": 3}),
        # DURABLE FIRST, TOAST OPTIONAL. The toast is transient (autoClose) and lost a race
        # on a run where the charge WAS created. And a missing toast is ambiguous, because
        # SubmitButton is `type={isValid ? 'submit' : 'button'}` - an invalid form makes the
        # click a silent no-op with no error at all. So "clicked, no toast" meant either
        # "worked, toast missed" or "form invalid, nothing happened". Asserting the modal
        # closed separates the two: still open => invalid form, closed => the mutation ran.
        step("assertPageLacks", "Test the charge modal closed (durable success signal)",
             {"value": "Submit"}),
        step("assertPageContains", "Test the item-added toast (optional: transient)",
             {"value": "Item added"}, optional=True),
    ],
    TAGS,
))


# ---------------------------------------------------------------- labor
# userId then craftId: craftId's loadOptions returns [] without a userId, and changing
# userId calls resetField('craftId'). Order matters.
write(test(
    "MOB.360_Work_Add_Labor_Charge",
    "`MOB.360` Add a labor charge to the fixture work order.\n"
    "- Fields cascade: userId must be picked BEFORE craftId, whose loadOptions returns\n"
    "  an empty list without a user, and which is reset whenever userId changes.\n"
    f"- Searches for {LABOR_USER} explicitly: crafts belong to the SELECTED user, and an\n"
    "  arbitrary first-match user usually has none. This one has many, so taking the\n"
    "  first craft is safe and avoids depending on a specific craft continuing to exist.\n"
    "- The craft field is focused but NOT typed into: its filter lowercases the query but\n"
    "  not the option name, so any typed text with capitals matches nothing.\n"
    "- Visits /work first to warm the cache-only lookups (see module docstring).\n"
    f"- MUTATES: adds a permanent labor charge to {FIXTURE_ID} on every run.",
    warm_cache_and_open() + [
        step("click", "Open the Labor tab", {"element": xpath_el(STAGE_URL, tab("Labor"))}),
        step("click", "Open the add-charge form", {"element": xpath_el(STAGE_URL, ADD_BTN)}),
        *lookup("userId", "user", search=LABOR_USER, pick=LABOR_USER),
        # NO typing in the craft field. craftId's filter is `v.name.includes(txt)` with txt
        # lowercased but the name left as-is - a case-sensitivity bug - so typing
        # "Account Executive" would match nothing. An empty query returns every craft the
        # selected user has, and we then pick by exact text.
        *lookup("craftId", "craft", search=None, pick=LABOR_CRAFT),
        # laborTypeId and qty are required by the WorkStageLabor schema but are NOT in
        # customFormFields, so reading the component alone misses them. Without them the
        # form never validates, SubmitButton stays type="button", and the click silently
        # does nothing - no error, no toast.
        *lookup("laborTypeId", "labor type", search=None, pick=LABOR_TYPE),
        # `qty` is the field id; it is displayed as "Actual Hours".
        step("typeText", "Enter actual hours (schema field qty)",
             {"value": "1", "element": xpath_el(STAGE_URL, '//*[@id="qty"]')}),
        step("click", "Submit the charge", {"element": xpath_el(STAGE_URL, SUBMIT)}),
        step("wait", "Wait for the add mutation", {"value": 3}),
        # DURABLE FIRST, TOAST OPTIONAL. The toast is transient (autoClose) and lost a race
        # on a run where the charge WAS created. And a missing toast is ambiguous, because
        # SubmitButton is `type={isValid ? 'submit' : 'button'}` - an invalid form makes the
        # click a silent no-op with no error at all. So "clicked, no toast" meant either
        # "worked, toast missed" or "form invalid, nothing happened". Asserting the modal
        # closed separates the two: still open => invalid form, closed => the mutation ran.
        step("assertPageLacks", "Test the charge modal closed (durable success signal)",
             {"value": "Submit"}),
        step("assertPageContains", "Test the item-added toast (optional: transient)",
             {"value": "Item added"}, optional=True),
    ],
    TAGS,
))

# ---------------------------------------------------------------- material
# storeroomLocationId then materialItemId (which is disabled until a location is chosen
# and reset when it changes) then quantity.
write(test(
    "MOB.370_Work_Add_Material_Charge",
    "`MOB.370` Add a material charge to the fixture work order.\n"
    "- Fields cascade: storeroomLocationId -> materialItemId -> quantity. materialItemId\n"
    "  is disabled until a storeroom location is selected and is reset when it changes.\n"
    "- Visits /work first to warm the cache-only lookups (see module docstring).\n"
    f"- MUTATES: adds a permanent material charge to {FIXTURE_ID} on every run.",
    warm_cache_and_open() + [
        step("click", "Open the Material tab", {"element": xpath_el(STAGE_URL, tab("Material"))}),
        step("click", "Open the add-charge form", {"element": xpath_el(STAGE_URL, ADD_BTN)}),
        *lookup("storeroomLocationId", "storeroom location",
                search=STOREROOM_LOCATION, pick=STOREROOM_LOCATION),
        *lookup("materialItemId", "material item",
                search=MATERIAL_ITEM, pick=MATERIAL_ITEM),
        # `type` is a required enum (Issue | Return) on WorkStageMaterial. It is not in
        # customFormFields, so reading the component alone misses it - the same trap that
        # hid laborTypeId/qty on the Labor form.
        *lookup("type", "material charge type", search=None, pick=MATERIAL_TYPE),
        step("typeText", "Enter a quantity",
             {"value": "1", "element": xpath_el(STAGE_URL, '//*[@id="quantity"]')}),
        step("click", "Submit the charge", {"element": xpath_el(STAGE_URL, SUBMIT)}),
        step("wait", "Wait for the add mutation", {"value": 3}),
        # DURABLE FIRST, TOAST OPTIONAL. The toast is transient (autoClose) and lost a race
        # on a run where the charge WAS created. And a missing toast is ambiguous, because
        # SubmitButton is `type={isValid ? 'submit' : 'button'}` - an invalid form makes the
        # click a silent no-op with no error at all. So "clicked, no toast" meant either
        # "worked, toast missed" or "form invalid, nothing happened". Asserting the modal
        # closed separates the two: still open => invalid form, closed => the mutation ran.
        step("assertPageLacks", "Test the charge modal closed (durable success signal)",
             {"value": "Submit"}),
        step("assertPageContains", "Test the item-added toast (optional: transient)",
             {"value": "Item added"}, optional=True),
    ],
    TAGS,
))

# ---------------------------------------------------------------- other
# OtherCharges passes no customFormFields, so its fields come straight from the
# WorkStageOtherCharge schema. The rendered charge shows otherChargeId + quantity +
# unitPrice, so those two are the INFERRED inputs - unverified until this test runs.
write(test(
    "MOB.380_Work_Add_Other_Charge",
    "`MOB.380` Add an \"other\" charge to the fixture work order.\n"
    "- OtherCharges supplies no customFormFields, so the form is whatever the\n"
    "  WorkStageOtherCharge schema defines. otherChargeId + quantity are INFERRED from\n"
    "  the rendered charge item, and userId comes from the schema (required AND\n"
    "  insertable). transactionAmount is required but insertable=false - server-derived,\n"
    "  so it is deliberately NOT filled.\n"
    "- Visits /work first to warm the cache-only lookups (see module docstring).\n"
    f"- MUTATES: adds a permanent other charge to {FIXTURE_ID} on every run.",
    warm_cache_and_open() + [
        step("click", "Open the Other tab", {"element": xpath_el(STAGE_URL, tab("Other"))}),
        step("click", "Open the add-charge form", {"element": xpath_el(STAGE_URL, ADD_BTN)}),
        *lookup("otherChargeId", "other charge type",
                search=OTHER_CHARGE_TYPE, pick=OTHER_CHARGE_TYPE),
        # userId is required by the WorkStageOtherCharge schema AND insertable, so it is
        # rendered in the form even though OtherCharges declares no customFormFields.
        # (transactionAmount is also required but insertable=false - server-derived, not a
        # form field, so it must NOT be filled here.)
        *lookup("userId", "user", search=OTHER_USER, pick=OTHER_USER),
        # unitPrice is required by the form. Note there are TWO definitions in the models:
        #   WorkStageEstimatedOtherCharge.unitPrice -> required: true
        #   WorkStageOtherCharge.unitPrice          -> no required flag
        # OtherCharges renders via WorkChargeLayout with both charges and estimates, so
        # which one applies depends on the section. Fill it either way - without it the
        # form never validates and submit is a silent no-op.
        step("typeText", "Enter a unit price",
             {"value": "1", "element": xpath_el(STAGE_URL, '//*[@id="unitPrice"]')}),
        step("typeText", "Enter a quantity",
             {"value": "1", "element": xpath_el(STAGE_URL, '//*[@id="quantity"]')}),
        step("click", "Submit the charge", {"element": xpath_el(STAGE_URL, SUBMIT)}),
        step("wait", "Wait for the add mutation", {"value": 3}),
        # DURABLE FIRST, TOAST OPTIONAL. The toast is transient (autoClose) and lost a race
        # on a run where the charge WAS created. And a missing toast is ambiguous, because
        # SubmitButton is `type={isValid ? 'submit' : 'button'}` - an invalid form makes the
        # click a silent no-op with no error at all. So "clicked, no toast" meant either
        # "worked, toast missed" or "form invalid, nothing happened". Asserting the modal
        # closed separates the two: still open => invalid form, closed => the mutation ran.
        step("assertPageLacks", "Test the charge modal closed (durable success signal)",
             {"value": "Submit"}),
        step("assertPageContains", "Test the item-added toast (optional: transient)",
             {"value": "Item added"}, optional=True),
    ],
    TAGS,
))

print("wrote MOB.350 (equipment), MOB.360 (labor), MOB.370 (material), MOB.380 (other)")
