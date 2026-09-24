import { test } from '@playwright/test';
import { freshSession, serverRead, FIXTURE_WO, FORMS_WO } from '../support/session';
import { removeOurLink } from '../tests/MOB.929_Map_Card_Add_Asset_To_Work';

// Remove the ONE Tank 0040 link a failed MOB.929 left on a test-made work order (MOB.354's named flow).
test('mob929 leftover', async ({ browser }) => {
  test.setTimeout(4 * 60_000);
  const page = await freshSession(browser);
  const me = (await serverRead(page, '{ session { me { id } } }')).session.me.id;
  const stages = (await serverRead(page, '{ workStages(crew: "<SESSION>", params: { limit: 50, sortId: "displayName" }) { edges { id workId { problemDesc createdBy { id } } assets { id assetId { name } } } } }')).workStages.edges;
  await page.context().close();
  for (const s of stages) {
    if ([FIXTURE_WO, FORMS_WO, 'RcdI0xcpc8NBV8VoRNNBYM'].includes(s.id)) continue;
    if (s.workId?.createdBy?.id !== me || !(s.workId.problemDesc ?? '').trim().startsWith('DD SYNTHETIC MOBILE')) continue;
    const tank = s.assets.filter((a: any) => a.assetId.name === 'Tank 0040');
    if (!tank.length) continue;
    console.log(`stage ${s.id}: ${tank.length} Tank 0040 link(s) of ${s.assets.length}`);
    const before = new Set<string>(s.assets.filter((a: any) => a.assetId.name !== 'Tank 0040').map((a: any) => a.id));
    await removeOurLink(browser, s.id, before);
    console.log(`stage ${s.id}: removed`);
  }
});
