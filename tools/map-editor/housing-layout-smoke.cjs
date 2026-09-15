const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.ATHENA_BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4176/?time=18&version=housing-density-smoke', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.removeItem('athena-housing-v2'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#housingOpen', { timeout: 30000 });
  await page.click('#housingOpen');
  const initialCount = await page.locator('.housing-object').count();
  for (let index = 0; index < 10; index++) {
    await page.click('.housing-catalogue-item[data-type="kiosk"]');
  }
  const finalCount = await page.locator('.housing-object').count();
  const widths = await page.locator('.housing-object').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
  await page.screenshot({ path: 'tools/map-editor/.smoke/housing-density.png', fullPage: true });
  await browser.close();
  if (errors.length) throw new Error(errors.join('\n'));
  if (initialCount !== 4 || finalCount !== 14) throw new Error(`Comptage inattendu : ${initialCount} → ${finalCount}`);
  process.stdout.write(JSON.stringify({ initialCount, finalCount, minWidth: Math.min(...widths), maxWidth: Math.max(...widths) }) + '\n');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
