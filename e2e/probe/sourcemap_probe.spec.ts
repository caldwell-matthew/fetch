import { test } from '@playwright/test';
import { login } from '../support/login';

// Does dev serve source maps for the mobile bundle? Code coverage can only be mapped back to
// client/mobile/**/*.tsx if it does. Read-only.
test('source maps on dev', async ({ browser, request }) => {
  test.setTimeout(5 * 60_000);
  const page = await (await browser.newContext({ viewport: { width: 768, height: 1020 } })).newPage();
  const scripts: string[] = [];
  page.on('response', (r) => {
    const ct = r.headers()['content-type'] || '';
    if (r.url().includes('mentorapm.com') && (ct.includes('javascript') || r.url().match(/\.m?js(\?|$)/))) scripts.push(r.url());
  });
  await login(page);
  await page.waitForTimeout(5000);
  const uniq = [...new Set(scripts)];
  console.log(`  ${uniq.length} app script(s) loaded`);
  let mapped = 0;
  for (const url of uniq.slice(0, 40)) {
    const body = await (await request.get(url)).text();
    const tail = body.slice(-300);
    const m = tail.match(/sourceMappingURL=([^\s*]+)/);
    let mapStatus = 'no sourceMappingURL';
    if (m) {
      const mapUrl = new URL(m[1], url).toString();
      const res = await request.get(mapUrl);
      mapStatus = `map ${res.status()}`;
      if (res.ok()) {
        mapped++;
        const map = await res.json().catch(() => null);
        const mobile = (map?.sources || []).filter((s: string) => s.includes('mobile')).length;
        mapStatus += ` · ${map?.sources?.length ?? 0} sources, ${mobile} under mobile/`;
      }
    }
    console.log(`  ${url.replace(/^https:\/\/dev\.mentorapm\.com/, '').slice(0, 70)}  (${Math.round(body.length / 1024)} KB)  ${mapStatus}`);
  }
  console.log(`  RESULT: ${mapped} of ${uniq.length} scripts have a reachable source map`);
  await page.context().close();
});
