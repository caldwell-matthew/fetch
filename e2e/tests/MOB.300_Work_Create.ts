// Generated from Mobile/dd_tests_mobile/MOB.300_Work_Create.json by to_playwright.py — do not edit by hand yet.
// MOB.300_Work_Create

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertPageContains, assertPageLacks, el, optional, wait } from '../support/dd';

export async function mob300(page: Page): Promise<void> {
    // Navigate to /work — the work order list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Let the work list begin rendering
    await wait(page, 3);
    // The "Work Orders" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
    // Wait for the workstage pages and the lookup prefetch
    await wait(page, 20);
    // The work list rendered its search box
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
    // LOADEDALL 1/3: the initial fetch finished
    await assertPageLacks(page, `Retrieving assigned work`, DEFAULT_TIMEOUT);
    // LOADEDALL 2/3: paging through workstages finished
    await assertPageLacks(page, `workstages found`, DEFAULT_TIMEOUT);
    // LOADEDALL 3/3: the per-stage detail downloads finished
    await assertPageLacks(page, `workstages downloaded`, 180000);
    // Open the create-work-order form
    await el(page, `//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]//button`).click({ timeout: DEFAULT_TIMEOUT });
    // Test create modal opened
    await assertPageContains(page, `Creating New Work Order`, DEFAULT_TIMEOUT);
    // Focus the Workflow lookup
    await el(page, `//*[@id="workflowTitleId"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Search for the Datadog Test workflow
    await el(page, `//*[@id="workflowTitleId"]`).fill(`Datadog Test`, { timeout: DEFAULT_TIMEOUT });
    // Pick the "Datadog Test" workflow
    await el(page, `//*[@role="option"][contains(normalize-space(.), "Datadog Test")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Type the synthetic marker into Problem Description
    await el(page, `//*[@id="problemDesc"]`).fill(`DD SYNTHETIC MOBILE`, { timeout: DEFAULT_TIMEOUT });
    // Click "Create Work Order"
    await el(page, `//button[normalize-space(.)="Create Work Order"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the create mutation to resolve
    await wait(page, 3);
    // Test create modal closed (durable success signal)
    await assertPageLacks(page, `Creating New Work Order`, DEFAULT_TIMEOUT);
    await optional("Test success toast (optional: transient, autoClose 5000)", async () => {
      await assertPageContains(page, `Work order successfully created!`, DEFAULT_TIMEOUT);
    });
}
