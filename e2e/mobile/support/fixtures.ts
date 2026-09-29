/**
 * Every record on dev the mobile tests rely on, in one place — so a move (another org, the MentorTwo repo) changes
 * this file, not the tests. What each must stay like is in `docs/test_authoring.md` → Fixtures; `tools/fixtures.py`
 * checks the ones a suite can disturb before every data-changing suite.
 */

// Work orders (work stage ids)
export const FIXTURE_WO = 'EYRpYJ9QYdQ1JFF10JtB0Q';          // `20260805-18-001`, the main fixture — Ready, no project
export const FORMS_WO = 'xohY0klBZktB9VBRxc8k4J';            // `20260910-16-001` — forms attach, photos, reassignment (MOB.363–365)
export const MOB302_WO = 'RcdI0xcpc8NBV8VoRNNBYM';           // `20260910-18-001` — holds the photo MOB.302 links
export const SECOND_FIXTURE_WO = 'Vg5Qd9VddQJIYNR48Yhk9l';   // `20260929-19-001` — In Progress, a required form field (`tools/setup_second_fixture.py`)
export const PM_ROUTE_STAGE = '58JgBIYA1cBQxoQVwJ5FRw';      // `20260929-18-001` — a PM route (`tools/setup_pm_route.py`)

// Asset Verify
export const AV_JOB = 'Z0EVwQcdJZhMURcBFkp0E0';              // `DATADOG MOBILE JOB` — READY, `⚡ Tank 0000` + `A/C Motor 0002`, none verified
export const AV_JOB_NAME = 'DATADOG MOBILE JOB';

// Assets
export const PUMP_0102 = 'oB5BUN1Es1Jctw8FVYwYBh';           // never touch its attachments (owner)
export const TANK_0000 = '8khYtoBRVNNs5d9cEt8NdY';           // `⚡ Tank 0000` — the symbol is part of its name
export const BYPASS_VALVE_0001 = 'wFRo1MMwoAMkdxA4hVpIhB';   // no photos at rest (MOB.302)

// Crews (roles) and workflows
export const ADMIN_CREW = 'l4Jlk4ExMY005JZAF8hclQ';          // the test account's crew
export const ACCOUNT_EXECUTIVE_CREW = 'thtNo1Nd9th9FRNNoAN5Il'; // MOB.365's reassignment target
export const TEST_NOTIFICATIONS_CREW = 'dgQh4IMBgwFgYxdVQFMcxA'; // no one holds it; receives the Admin department's `Complete` notice (trap 51)
export const DATADOG_TEST_WORKFLOW = 'IQU5x1VsQho4BZoEYwx9E4'; // "☢️ Datadog Test" — every test-made work order uses it
