# Desktop end-to-end tests — the plan

**Status:** planned, not started. Desktop comes after mobile is finished and wired to CircleCI (checklist ▶ #37).
Written 2026-09-30 from a read of MentorTwo `origin/development@2f0712fbf3` (rc.128) and of `e2e/mobile/`. Nothing here
has been run against dev: statements about how the app behaves come from its source, and the ones marked **probe** need
a read-only probe before they are relied on. The decisions in §5 are the owner's and are open.

---

## 1. The desktop app's map

### Where the route list comes from

- **Source of truth:** `config/modulesV2/<NNN - Module>/<N - Section>/<Link>.ts`, walked in order by `config/index.ts`.
  `scripts/initialization/createRoutes/index.ts` generates `client/src/__generated__/routing/menuRoutes.ts`,
  `routes.js`, `tableRoutes.ts` and `detailViewMetadata.ts` from it. The generated files are git-ignored
  (`scripts/codegen/generatedArtifacts.json`).
- **Not** `client/src/components/layout/Navigation/menuRoutes.ts`: a stale committed copy (last changed 2026-07-28)
  that disagrees with the config — `/archive` vs `/assetarchive`; no Diagrams, MentorLens Progress, Employees, Mentor
  Messages or Mobile Work Template; Bulk Transaction Jobs and User Groups still in it; changed permissions on Crews and
  Configuration Rules. The tests' route list is generated from `config/modulesV2`.
- **URLs:** base `/apm` (`client/src/components/Router/index.tsx`). A page is `/apm/<module path><link path>[/:id]`,
  e.g. `/apm/asset/assets/<id>`; a detail tab is a URL hash (`detailViewUrl(…) + '#<n>'`).
- **Routing:** `universal-router` resolves every route from the URL, so deep links are real on desktop (unlike
  mobile's cache-only pages).

### Top-level modules

Links counted in `config/modulesV2`; "routes" include detail and child routes.

| # | Module | Path | Menu links | Routes | Sections | Component code (.tsx/.jsx, no tests) |
|---|---|---|---|---|---|---|
| 001 | Home (dashboard) | `/apm` | 1 | 1 | — | `components/dashboard` 28 |
| 002 | MentorLens | `/lens` | 1 | 1 | — | `components/lenz` 1 |
| 003 | Map | `/map` | 1 + Map Views | 4 | Configuration | `components/map` 18 |
| 004 | Channels | `/channels` | 1 | 1 | — | `components/channel` 2 |
| 005 | **Assets** | `/asset` | 19 | 31 | Assets · Hierarchy Builder · Systems | `components/asset` 96, `diagram` 13 |
| 006 | **Work** | `/work` | 21 | 36 | Work · Work Stage Charges · Crew Management · Load Leveling · Maintenance Strategies · Projects | `components/work` 142 |
| 007 | Accounting | `/account` | 3 | 5 | Accounting | `components/accounting` 5 |
| 008 | Asset Investment Planning | `/aip` | 4 | 8 | AIP | `components/investment` 31 |
| 009 | Criticality Analysis | `/ca` | 6 | 8 | Criticality Analysis · Configuration | `components/criticalityAnalyzer` 61 |
| 010 | **Inventory** | `/inventory` | 12 | 23 | Inventory | `components/inventory` 53 |
| 011 | Reporting | `/report` | 3 | 4 | Reports | `components/reporting` 8 |
| 012 | **Admin & Setup** | `/admin` | 41 | 69 | Asset Health · Asset Risk & Criticality · System Settings · Mobile · Timekeeping · Work | `components/admin` 112 |
| — | Top-header routes | `/org`, `/myprofile` | — | 2 | — | `components/org` 9, `profile` 5 |

- **Totals:** 114 menu pages plus 2 top-header pages; about 193 routes with details and children; about 311 more
  shared files (`layout` 138, `helper-components` 173) render every table and detail view. Mobile is 162 files, so
  desktop is roughly five times the surface.
- **Quirks:** Asset Failure Types is under both `/ca` and `/admin`; Other Charges under both `/work` and `/admin`.
  SYSTEM Reports and SYSTEM Documentation are `env: 'development'` — built only when `NODE_ENV` is development; whether
  dev.mentorapm.com serves them is a **probe**.

### Permission gating — four layers

1. **Menu, per module** (`client/src/components/layout/Navigation/index.tsx`, `canView`): a module shows when its
   permission list is empty or any permission in it has `.read`; the list is the union of its links'
   (`createRoutes/index.ts`).
2. **Menu, per role type:** a `lensUser` role gets a different menu (`getLensRoutes`); a `mobileOnly` user is turned
   away from `/apm` by the server (`server/src/routes/apm/apm.ts`, `rejectMobileOnlyUser`) and the client
   (`RequireAuth.tsx`).
3. **Route** (`client/src/components/layout/RequireAuth.tsx`): a 401 page only if the role HAS an entry for the route's
   permission and its `.read` is false. A permission key missing from the role does **not** block the page — a
   permissive default worth a test (ask before filing it). `mentormessages` is limited to Mentor staff.
4. **Controls inside a table:** `TableWithRouting` works out create / update / delete rights from `gqlInfo.name`, so
   toolbar buttons do not render — the same "the control is absent" symptom as mobile's role trap. Chat renders only
   with `work.read` (`PageLayout.tsx`).

### How desktop differs from mobile

| Area | Mobile | Desktop | For the tests |
|---|---|---|---|
| Login | SSO form → "development" environment button → `/apm-mobile` | The same `/login` SSO → `/apm` (`server/src/routes/login/utils/index.ts:254`); `redirectedFrom` keeps a deep link through login | Share the form steps. Whether desktop shows the environment picker is a **probe** |
| Session | Cookie shared with `/apm` | Every `/apm` load publishes `sessionUpdate CREATED`; a different org logs out **every** session of the user (`RequireAuth.tsx`) | Never switch org; the login check asserts org `SMCT2` |
| Role switch | Crew switcher (MOB.210/220) | `changeSessionRole` **writes `User.role`** and broadcasts to all the user's sessions (`server/src/controllers/system/session/changeRole.ts`) | 🛑 A desktop role switch on the shared account flips a running mobile session's role |
| User admin | — | Editing a user's roles rebuilds or **destroys all their sessions** (`controllers/system/session/invalidate.ts`) | Admin > Users, Roles and Permission Groups never touch the test account |
| Lists | Custom virtualised lists | **Table3**: TanStack + `react-virtuoso`, header menus, inline edit, bulk insert/update, **Delete Records**, advanced search, CSV export (`client/src/components/helper-components/Table3/README.md`) | One shared table page-object. Mobile traps 22 (virtualised lists) and 50 (500-row pages) apply |
| "Read-only" grid actions | sessionStorage | Every sort, filter, join, page change, column resize or hide is **saved to the server** (`UPDATE_USER_TABLE_SETTINGS`, the README's state-transition matrix) | Sorting is a server write to the account; a saved filter changes what the next test sees |
| Other user-state writes | — | Favourites (`CREATE_SAVED_FAVORITE`), dashboard widgets, saved searches, locale | A new category: "user-state writes" |
| Detail views | Mixed | Generic `DetailView` (General Info + tabs from `detailViewMetadata`), attachments, audit table | One generic detail helper covers most screens |
| Crash / denied text | "Something went wrong." | "Something went wrong while rendering this page." (`client/src/components/app.tsx:72`); 401 text in `helper-components/ErrorPage/index.tsx` | A crash check per app |
| Stable handles | Few | 135 `data-testid`s (`tbl-record-count`, `table-delete-btn`, `edit-form-title`, …), 94 `aria-label`s | Prefer testids and roles over XPath |
| Third-party / costly | — | Nelson (an embedded AI iframe, `/login/nelson/embed`); Chat (visible to others) | Check the button is there; never prompt Nelson or send a chat |
| Datadog RUM | Blocked (`NO_RUM`) | `server/src/views/apm.ejs:18-41` loads RUM at a 100% sample rate | The shared `launchOptions` cover it; prove it with a desktop copy of `rum_blocked_probe` |

**Legacy material:** `legacy/dd_tests_backup/2026-09-22_2238_pre-playwright/` holds about 260 desktop Datadog tests.
Mine them for flows; do not port them — the "Navigation – <Module>" tests have no assertions, and many were destructive
("Create Role", "Deactivate Admin", "Delete Asset", "Create Permission Group – … Delete", trigger tests).

---

## 2. Structure

### Module folders, each with the mobile tests/suites split inside

```
e2e/
├── playwright.config.ts          # projects: mobile, desktop (§3)
├── support/                      # SHARED (TypeScript)
│   ├── env.ts · dd.ts · network.ts   # as today (dd.ts serves mobile's converted tests; desktop does not use it)
│   ├── sso.ts                    # NEW: the SSO form steps both logins share
│   ├── session.ts                # MOVED from mobile: freshSession(browser, {app}), serverRead, serverReadDirect
│   └── readonly.ts               # NEW: guardReadOnly(page, {absorb}) — blocks and counts every GraphQL mutation
├── tools/                        # SHARED (Python/Node), each taking --app mobile|desktop|all
│   ├── lib/devsession.py         # the GraphQL login session, out of mobile/tools/reset_av_fixture.py
│   ├── lib/residue.py            # cleanup engine: SMCT2 check, marker query, never-touch ids, dry run by default
│   ├── playwright_pass.py · check_docs.py · check_literals.py · sweep_strings.py · source_coverage.py · coverage_report.py
│   └── check_suites.py           # NEW: every @smoke suite is writes:false and uses guardReadOnly
├── mobile/ …                     # unchanged; its tools become thin wrappers
└── desktop/
    ├── PLAN.md                   # this file
    ├── app.json                  # prefix DSK, env var DESKDEV, source roots, markers, fixture-check names
    ├── support/  login.ts · fixtures.ts · routes.ts (GENERATED by tools/sync_routes.py) · nav.ts · table.ts · detail.ts
    ├── shell/       {tests/, suites/}   DSK.00.*  login, nav, top header, site map, spotlight, favourites, profile, /org, Home
    ├── lens/        {tests/, suites/}   DSK.02.*
    ├── map/         {tests/, suites/}   DSK.03.*
    ├── channels/    {tests/, suites/}   DSK.04.*
    ├── assets/      {tests/, suites/}   DSK.05.*
    ├── work/        {tests/, suites/}   DSK.06.*
    ├── accounting/  {tests/, suites/}   DSK.07.*
    ├── aip/         {tests/, suites/}   DSK.08.*
    ├── criticality/ {tests/, suites/}   DSK.09.*
    ├── inventory/   {tests/, suites/}   DSK.10.*
    ├── reporting/   {tests/, suites/}   DSK.11.*
    ├── admin/       {tests/, suites/}   DSK.12.*
    ├── cross/       {tests/, suites/}   DSK.00.8xx  permissions matrix, resilience, session (suites that run alone)
    ├── tools/                    # app-only: suites.json, fixtures.py, setup_*.py, sync_routes.py, cleanup wrapper
    ├── docs/                     # testing_checklist · coverage · test_authoring · bugs_found · cleanup_spec · source_coverage
    └── probe/
```

- `npx playwright test desktop/work/` runs one module — the owner's grouping by main route.
- The test/suite contract is mobile's, so the shared tools stay simple (the pass runner already reads `…suites/…`).
- Rejected: top-level `tests/<module>` + `suites/<module>` (one module split across two trees), and flat module folders
  (30+ tests mixed with their suites).

### IDs: `DSK.<MM>.<nnn>`

`MM` is the module's `config/modulesV2` number, frozen once assigned: 00 shell/cross, 02 Lens, 03 Map, 04 Channels,
05 Assets, 06 Work, 07 Accounting, 08 AIP, 09 CA, 10 Inventory, 11 Reporting, 12 Admin (Home, 01, folds into
`shell/`). `nnn` 000–899 is a test and 900–999 a suite, as on mobile. Files: `DSK.06.120_Work_Orders_Sort.ts`,
`DSK.06.901_Work_1_Orders_Read_Suite.spec.ts`; tools match `DSK\.(\d{2})\.(\d{3})`.

| Module | Sub-ranges |
|---|---|
| 00 shell / cross | 000 login/session · 100 nav · 200 top header · 300 Home dashboard · 400 profile/org · 800 permissions and resilience |
| 05 Assets | 000 route sweep · 100 Asset Register · 200 types/statuses/groups/standards · 300 hierarchy builder · 400 systems · 500 collector/diagrams/lens · 600 archive/warranty/attribute search |
| 06 Work | 000 sweep · 100 Work Orders · 200 Work Order Stages · 300 charges · 400 crew management · 500 load leveling · 600 maintenance strategies/events · 700 projects, mobile job, operator log, roleboxes, template |
| 10 Inventory | 000 sweep · 100 items/material items · 200 storerooms/locations · 300 issues/returns/transfers · 400 cycle counts/reorder · 500 vendors/buyers/types |
| 12 Admin | 000 sweep · 100 Asset Health · 200–399 System Settings · 400 Mobile templates · 500 Timekeeping · 600 Work config |
| Small modules | 000 sweep · 100+ as needed |

Every module's `.000` test is its **route sweep**, driven by `routes.ts`.

### Shared vs per app

| Piece | Today | Plan |
|---|---|---|
| `support/dd.ts`, `env.ts`, `network.ts`, RUM block, workers, reporters | Shared | Stay shared. Desktop tests use plain Playwright (roles, testids, `test.step`, `try/finally` restores), not `dd.ts` XPath steps. Mobile trap 3 still applies: filter to visible elements |
| SSO steps, `serverRead` / `serverReadDirect` / `freshSession` | `mobile/support/` | Move up (`support/sso.ts`, `support/session.ts`); each app keeps its own shell checks |
| Read-only guard | Ad hoc (MOB.930, MOB.332) | Shared `support/readonly.ts` |
| Pass runner, docs checker, literal and string scans, source coverage, coverage page | `mobile/tools/` | Move to `e2e/tools/` with `--app`; per-app settings in `<app>/app.json` |
| GraphQL session, cleanup engine | Inside `reset_av_fixture.py` / `cleanup_residue.py` | `tools/lib/devsession.py` + `tools/lib/residue.py`; each app keeps its categories |
| `suites.json`, `fixtures.py`, `setup_*`, `reset_av_fixture.py`, `prefetch.ts`, `map.ts`, `check_js_assertions.js` | Mobile | Stay mobile-only (offline, IndexedDB, map touch, converted steps) |
| Docs | `mobile/docs/` | Desktop gets its own set. Its checklist is seeded from `routes.ts` — a `## <Module> — /apm/<path>` section and a row per link — and `check_docs` fails when a generated route has no row |
| Traps | `mobile/docs/test_authoring.md` 1–57 | Not renumbered. Desktop cites "mobile trap N" and numbers its own D1, D2…; its **named-delete-flows list** starts empty (D2), and AGENTS.md points to both lists |

Moving the tools changes paths cited by AGENTS.md, the READMEs, the CI draft and the mobile docs: do it in one session,
then run mobile's `playwright_pass.py --dry-run` and `check_docs.py`.

---

## 3. Playwright config and CircleCI

### `e2e/playwright.config.ts`

- Add `DEVICES.laptop = { width: 1440, height: 1100 }` (the legacy desktop tests' `chrome.laptop_large`, believed to be
  Datadog's dimensions — confirm).
- Two projects: `mobile` (`testDir: 'mobile'`, `baseURL: MOBDEV`, tablet) and `desktop` (`testDir: 'desktop'`,
  `baseURL: DESKDEV ?? 'https://dev.mentorapm.com/apm/'`, laptop). Keep the `BASE_URL`, `DEVICES` and `RUM_HOSTS`
  exports so mobile's imports do not change. Confirm `DESKDEV` in `.env` is the `/apm` URL.
- Suites keep making their own context; the desktop `session.ts` passes the viewport explicitly, as mobile's does.
- Unchanged: `workers: 1`, `fullyParallel: false`, `retries: 0`, 60s timeouts. The JUnit and JSON result paths
  include the app so two CI steps do not overwrite each other.
- Tag suites (`test.describe.serial('DSK.05.901_…', { tag: '@smoke' }, …)`) instead of hand-kept lists; `suites.json`
  gains `app`, `module` and `smoke`.

### Selecting a run

| Scope | Command |
|---|---|
| One app | `npx playwright test --project=desktop` |
| One module | `npx playwright test desktop/work/` |
| One suite | the suite's **full file name** — the argument is a regex, so a trailing `*` also matches its neighbours |
| Smoke only | `npx playwright test --project=desktop --grep @smoke` |
| A safe pass | `.venv/bin/python e2e/tools/playwright_pass.py --app desktop [--module work] [--stage 1\|2]` |
| Everything | `--app all` — stage 2 interleaves both apps' data-changing suites one at a time, running **both** apps' fixture checks before each (desktop can reach mobile's fixtures, §4) |

### CircleCI (extends `e2e/ci/circleci-e2e.yml`)

- **`e2e_smoke`** (after `composer_deploy`, development only): `--project=mobile --grep @smoke`, then
  `--project=desktop --grep @smoke` with `when: always`; both JUnit files, the coverage page and the evidence stored.
  Desktop smoke budget: about 5 minutes (inferred) — the shell plus one list and one detail per major module. The full
  route sweep (about 114 pages, roughly 10–15 minutes, inferred) is too long for every deploy.
- **`e2e_full`** (nightly): `playwright_pass.py --app all`. Desktop contributes read-only suites first; its
  data-changing suites join only after repeated green local passes and the owner's OK.
- **Context:** add `DESKDEV` (and a desktop account's credentials, if there is one) to the e2e context.

---

## 4. Data safety on shared dev

### Markers

| Marker | Meaning |
|---|---|
| `DD SYNTHETIC DESKTOP <DSK id> <RUNID>` | Residue — the only desktop records that may ever be deleted, and only in named flows |
| `DATADOG FIXTURE DESKTOP …` | A fixture; never matches the residue prefix |

Mobile's cleanup matches `DD SYNTHETIC MOBILE`, so the sets do not overlap. Neither script ever queries the bare
`DD SYNTHETIC`.

### User-state writes

Grid sort / filter / resize / hide, favourites, dashboard widgets, saved searches and locale all write the **test
account's** settings. Smoke and sweep suites run under `guardReadOnly`: an unexpected mutation fails the test, and
`UPDATE_USER_TABLE_SETTINGS` is absorbed in the browser, never sent. Which mutations a plain page load sends is a
**probe** (with `watchOperations`) before the guard is made strict. Lists open with explicit URL state (`sort=`, `f_`,
`page`) through `table.gotoWithState`, so saved settings never decide what a test sees.

### Account and permissions

- **Recommended:** a separate desktop test user in SMCT2 with a fixed Admin role, and a second with a fixed limited
  role for gating tests.
- Until then: never use the role switcher on the shared account. Test menu and route gating with zero server writes by
  rewriting `session.me.role.permissions` in the `GET_SESSION` answer in the browser (as MOB.946 and MOB.544 fake rare
  states). Proving the *server* enforces a permission needs the real limited-role user.

### Admin and config — 🛑 read-only unless the owner names a flow

| Area | Why |
|---|---|
| Users, Roles, Permission Groups, Employees | Destroys or rebuilds sessions, mobile's included |
| `/org` business rules (e.g. `MOBILE_MENTOR_05`, read in `apm.ts`) | Org-wide |
| Configuration Rules, Datastores | Org-wide (Configuration Rules is `mentor_admin`) |
| Workflows, Workflow Stages, Workflow Forms, Template W.O. Insert Form | Mobile's `Datadog Test` workflow is a fixture; stage triggers can create work or send alerts |
| Departments | Status-change emails (mobile trap 51) |
| Mobile Job Template, Mobile Work Template | Feed mobile's Asset Verify and work fixtures |
| Map Views | MOB.119 and MOB.123 depend on them |
| Lookups, Attribute Types, Attachment Tags, Activities, Asset Statuses, Work Phase, Work Priority | In every picker |
| Detectability, Failure Rate, Impact and Occurrence scores, Hierarchy Levels | Feed criticality maths |
| Announcements, Mentor Messages | Shown to everyone on dev |
| Documentation, SYSTEM Documentation, Dashboard config | Shared content |
| Accounts, Expenditure Types | Financial |

**Table3 bulk tools** (Delete Records, bulk update / insert, inline edit, CSV imports) act only on rows the run made:
`table.ts` proves the selection is exactly this run's marker ids before the click — desktop's trap 2.

### Mobile's fixtures are read-only to desktop

Everything in `e2e/mobile/support/fixtures.ts`: the work orders, `DATADOG MOBILE JOB`, Pump 0102 (never its
attachments), Tank 0000, Bypass Valve 0001, the Admin / Account Executive / Test Notifications crews, the
`Datadog Test` workflow, Central Storeroom / `000-000-000 Adamantium`, `Actuator Tools`.

### Fixtures per module

| Module | Fixtures | Writes (once named) |
|---|---|---|
| Shell | None — reads the session | Favourites and widgets absorbed, or add/remove your own (named flow) |
| Assets | `DATADOG FIXTURE DESKTOP ASSET` (attributes, an attachment, a hierarchy node, a system), by id | Create `DD SYNTHETIC DESKTOP` assets and edit only those; field-restore legs on the fixture |
| Work | A desktop fixture work order in `Datadog Test` (`desktop/tools/setup_work_fixture.py`), separate from mobile's | Creates (residue); self-restoring stage and field edits. Charges add rows on reversal — owner decides |
| Inventory | Its own storeroom and item | Issues, returns, transfers and cycle counts change stock for good — owner decides (as MOB.870's drift) |
| Accounting, AIP, CA, Reporting, Map, Lens, Channels | Existing data | Read-only in the early phases |
| Admin | Existing config | Read-only (above) |

`desktop/tools/fixtures.py` checks desktop's fixtures; the shared runner runs both apps' checks before every
data-changing suite of either app.

### Cleanup

`desktop/tools/cleanup_residue.py` is a thin wrapper over `tools/lib/residue.py` — marker query, delete by id, SMCT2
only, dry run by default, never-touch ids checked twice — and starts with **no** delete categories. Each is added only
once the owner names it, and recorded in desktop's `cleanup_spec.md`.

---

## 5. Build order

| Phase | What | Writes to dev | Rough effort |
|---|---|---|---|
| **0 · Decisions and scaffolding** | The owner's decisions (below). Config projects. Move the shared tools and helpers; re-verify mobile (dry run, `check_docs`). `sync_routes.py` generates `routes.ts`. Empty desktop docs. `app.json`. Read-only **probes**: desktop login and environment picker, RUM blocked, a page load's mutations, whether dev-only routes are served | None | 2–3 sessions |
| **1 · Smoke** | `shell/` suite: login, all 12 modules for Admin, top header, site map, spotlight, breadcrumbs, crash and 401 checks. One read-only **route sweep** per module: every index route renders with no crash or 401, the record count shows, the first row's detail and tabs render, zero mutations. Pick the per-deploy `@smoke` set. Add desktop to the CI draft | None (`guardReadOnly`) | 3–4 sessions |
| **2 · Deep read-only, per module** | Assets → Work → Inventory → Admin (read) → the small modules. Grid behaviour (sort, filter, advanced search, paging, column menu, CSV) with settings writes absorbed; detail tabs against `serverRead` of the fixtures; gating with a faked session; error states with `failOperation` | Absorbed user state only | Assets ~3, Work ~4, Inventory ~2, Admin ~3, the rest ~1 each: ~15 sessions |
| **3 · Writes, one module at a time** | Fixture setup, fixture checks, cleanup categories and named flows first; then Assets creates and edits → Work creates, stages and fields → (if approved) charges and inventory transactions; through the runner, one data-changing suite at a time | Synthetic records, self-restoring edits | 2–4 sessions per module, gated on decisions |
| **4 · Later** | Desktop writing suites in the nightly; limited-role server-enforcement tests; cross-app checks (sequential, single session — "one device per test") | As approved | Open |

### The owner's decisions, before phase 0

1. A dedicated desktop test account (and a limited-role one) — strongly recommended, because of the role switch and
   session rebuilds.
2. The marker names `DD SYNTHETIC DESKTOP` / `DATADOG FIXTURE DESKTOP`.
3. The folder layout and the `DSK.MM.nnn` scheme (or a plain `DSK.nnnn`).
4. Admin & Setup policy: read-only by default? Which synthetic creates, if any? The initial named delete flows
   (expected: none).
5. Absorbing the table-settings, favourites and widget writes — acceptable, or tested for real on a desktop-only
   account?
6. Work charges and inventory transactions: accepted permanent debt (as mobile's charges) or excluded?
7. The per-deploy desktop smoke budget, and one CI job vs separate jobs.
8. When to move the shared tools — before desktop starts is recommended, but it touches mobile's paths during
   mobile's CI work.
9. Cross-app tests (desktop edits, mobile sees): wanted at all?

---

## 6. Risks and open questions

- **Org-wide config on shared dev** is the biggest risk: announcements reach real people, workflow triggers and
  department notifications send email, `/org` business rules change mobile, and Map Views and mobile templates break
  mobile suites.
- **Session side effects across apps:** a role switch writes `User.role` for all the user's sessions; editing or
  deactivating the user destroys them; an org change logs everything out. Any of these turns a running mobile pass red
  for reasons outside the test.
- **Hidden state from saved table settings:** tests become order-dependent unless every list opens with explicit URL
  state and the settings writes are absorbed.
- **Route-list drift:** the committed `menuRoutes.ts` is stale and the generated files are not in git; parsing
  `config/modulesV2` must fail loudly on a file it cannot read. Dev-only routes depend on dev's build `NODE_ENV`.
- **Heavy pages in headless CI:** Map (mapbox-gl WebGL), Lens, Channels, Diagrams and the dashboard can be slow or
  blank in Docker without a GPU — out of `@smoke`; the sweep checks only that they mount without a crash.
- **`RequireAuth.tsx`'s permissive default:** a missing permission key does not block a route — worth a test; ask
  before filing it.
- **Nelson and Chat** could cost money or be seen by others — check the button, go no further.
- **Open:** can CircleCI reach dev? Is `DESKDEV` the `/apm` URL? Does desktop login show the environment picker? What
  does a page load send (before `guardReadOnly` is strict)? Does a suite's own `browser.newContext()` pick up the
  project's `use` settings (plan: pass them explicitly)?
- **Volume:** desktop is about five times mobile. Without the route sweep, an untested new screen never shows red;
  `sync_routes.py` plus `check_docs` requiring a checklist row per route is the countermeasure.

### Files the build starts from

- `e2e/playwright.config.ts` — the two projects, the laptop viewport, per-app result paths
- `e2e/mobile/tools/playwright_pass.py` — generalised into `e2e/tools/` with `--app` / `--module`, and fixture checks
  across both apps (`suites.json` gains `app`, `module`, `smoke`)
- `e2e/mobile/support/session.ts`, `e2e/mobile/support/login.ts` — the SSO steps and server reads, up into `e2e/support/`
- `e2e/ci/circleci-e2e.yml` — the desktop `@smoke` step and the nightly `--app all`
- MentorTwo `config/modulesV2/**`, `scripts/initialization/createRoutes/index.ts`,
  `client/src/components/layout/RequireAuth.tsx`, `client/src/components/helper-components/Table3/README.md` — the route
  list, the permission gate and the grid the desktop helpers are built on
