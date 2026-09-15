const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.ATHENA_BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4176/?version=athena-solo-birds-stars-v39', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.removeItem('athena-housing-v2'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.click('#housingOpen');

  const stage = await page.locator('#housingLayer').boundingBox();
  const tentImage = await page.locator('[data-id="tent-main"] > .housing-object-art:not(.housing-object-daylight)').boundingBox();
  await page.mouse.move(tentImage.x + tentImage.width / 2, tentImage.y + tentImage.height / 2);
  await page.mouse.down();
  await page.mouse.move(stage.x + 2, tentImage.y + tentImage.height / 2, { steps: 8 });
  await page.mouse.up();

  const altarImage = await page.locator('[data-id="altar-main"] > .housing-object-art:not(.housing-object-daylight)').boundingBox();
  await page.mouse.move(altarImage.x + altarImage.width / 2, altarImage.y + altarImage.height / 2);
  await page.mouse.down();
  await page.mouse.move(stage.x + stage.width - 2, altarImage.y + altarImage.height / 2, { steps: 8 });
  await page.mouse.up();

  const positions = await page.evaluate(() => ({
    tent: Number.parseFloat(document.querySelector('[data-id="tent-main"]').style.getPropertyValue('--housing-x')),
    altar: Number.parseFloat(document.querySelector('[data-id="altar-main"]').style.getPropertyValue('--housing-x'))
  }));
  await page.screenshot({ path: 'tools/map-editor/.smoke/housing-wide-edges.png', fullPage: true });
  await browser.close();

  if (errors.length) throw new Error(errors.join('\n'));
  if (positions.tent > 9 || positions.altar < 91) {
    throw new Error(`Limites latérales trop étroites : ${JSON.stringify(positions)}`);
  }
  process.stdout.write(JSON.stringify(positions) + '\n');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
