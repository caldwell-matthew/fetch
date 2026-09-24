import { test } from '@playwright/test';
import { freshSession, serverRead, FORMS_WO } from '../support/session';

// Where is work order 20260910-16 in the Add-to-Work picker's list? Read-only.
test('picker order', async ({ browser }) => {
  const page = await freshSession(browser);
  for (const crew of ['<SESSION>']) {
    for (const p of [undefined, 1, 2, 3]) {
      const params = p === undefined ? '{ limit: 50, sortId: "displayName" }' : `{ limit: 50, page: ${p}, sortId: "displayName" }`;
      const d = await serverRead(page, `{ workStages(crew: "${crew}", params: ${params}) { edges { id name } pageInfo { page totalCount } } }`);
      const e = d.workStages.edges;
      console.log(`crew=${crew} page=${p} total=${d.workStages.pageInfo.totalCount} got=${e.length} formsWO@${e.findIndex((x: any) => x.id === FORMS_WO)} datadogTest=${e.map((x: any, i: number) => x.name.includes('Datadog Test') ? i : -1).filter((i: number) => i >= 0)}`);
    }
  }
  const first = (await serverRead(page, `{ workStages(crew: "<SESSION>", params: { limit: 50, sortId: "displayName" }) { edges { id name displayName workId { id } assets { id } } } }`)).workStages.edges;
  first.forEach((x: any, i: number) => { if (x.name.includes('Datadog Test')) console.log(`first[${i}] ${x.id} dn=${x.displayName} wo=${JSON.stringify(x.workId)} assets=${x.assets.length}`); });
  for (let p = 4; p <= 10; p++) {
    const e = (await serverRead(page, `{ workStages(crew: "<SESSION>", params: { limit: 50, page: ${p}, sortId: "displayName" }) { edges { id } } }`)).workStages.edges;
    const i = e.findIndex((x: any) => x.id === FORMS_WO);
    if (i >= 0) console.log(`FORMS_WO on page ${p} at ${i}`);
  }
  const ws = await serverRead(page, `query($id: ID!) { workStage(id: $id) { id name } }`, { id: FORMS_WO });
  console.log('FORMS_WO', JSON.stringify(ws));
  await page.context().close();
});

test('tank 0040 links', async ({ browser }) => {
  const page = await freshSession(browser);
  const d = await serverRead(page, `query($id: ID!) { workStage(id: $id) { assets { id assetId { name } } } }`, { id: FORMS_WO });
  console.log('FORMS_WO links', JSON.stringify(d.workStage.assets.map((a: any) => a.assetId.name)));
  await page.context().close();
});
