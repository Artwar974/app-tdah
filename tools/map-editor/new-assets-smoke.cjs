const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.ATHENA_BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errors = [];
  const failedResponses = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('http://127.0.0.1:4176/?time=18&version=athena-solo-birds-stars-v39', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.removeItem('athena-housing-v2'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#housingOpen', { timeout: 30000 });
  await page.click('#housingOpen');

  const requestedTypes = ['torch', 'fountain', 'shrub', 'weapons', 'flowers', 'table'];
  for (const type of requestedTypes) {
    await page.click(`.housing-catalogue-item[data-type="${type}"]`);
  }
  await page.waitForTimeout(250);

  const state = await page.evaluate(types => {
    const objects = types.map(type => {
      const element = document.querySelector(`.housing-object[data-type="${type}"]`);
      const image = element?.querySelector('img');
      const bounds = element?.getBoundingClientRect();
      return {
        type,
        present: Boolean(element),
        loaded: Boolean(image?.complete && image.naturalWidth),
        width: bounds?.width || 0,
        src: image?.getAttribute('src') || ''
      };
    });
    return { objects, artificialFountainEffect: Boolean(document.querySelector('[data-type="fountain"] .housing-water-shimmer')) };
  }, requestedTypes);

  const torch = page.locator('.housing-object[data-type="torch"] > .housing-animated-art').first();
  const firstTorch = await torch.screenshot();
  await page.waitForTimeout(130);
  const secondTorch = await torch.screenshot();
  await page.screenshot({ path: 'tools/map-editor/.smoke/housing-new-assets.png', fullPage: true });
  await browser.close();

  if (errors.length) throw new Error(errors.join('\n'));
  if (failedResponses.length) throw new Error(failedResponses.join('\n'));
  if (state.objects.some(object => !object.present || !object.loaded || object.width <= 0)) {
    throw new Error(`Asset absent ou illisible : ${JSON.stringify(state.objects)}`);
  }
  if (firstTorch.equals(secondTorch)) throw new Error('Le flambeau ne change pas de frame.');
  if (state.artificialFountainEffect) throw new Error('L’effet artificiel de la fontaine est encore présent.');
  process.stdout.write(JSON.stringify({ ...state, torchAnimated: true }) + '\n');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
