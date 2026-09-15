const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.ATHENA_BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4176/?time=18&version=fire-x2-smoke', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.removeItem('athena-housing-v2'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.housing-fire-animation', { timeout: 30000 });
  await page.waitForTimeout(350);
  const capture = image => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    return { url: canvas.toDataURL(), data: context.getImageData(0, 0, canvas.width, canvas.height).data };
  };
  const fire = page.locator('.housing-fire-animation');
  const firstScreenshot = await fire.screenshot();
  await page.waitForTimeout(120);
  const result = await page.locator('.housing-fire-animation').evaluate((image, source) => {
    const captureFrame = eval(`(${source})`);
    const frame = captureFrame(image);
    const data = frame.data;
    let transparent = 0;
    let opaqueBlack = 0;
    for (let offset = 0; offset < data.length; offset += 4) {
      const alpha = data[offset + 3];
      if (alpha === 0) transparent++;
      if (alpha > 32 && Math.max(data[offset], data[offset + 1], data[offset + 2]) < 12) opaqueBlack++;
    }
    return { second: frame.url, transparent, opaqueBlack };
  }, capture.toString());
  const secondScreenshot = await fire.screenshot();
  await page.screenshot({ path: 'tools/map-editor/.smoke/fire-x2.png', fullPage: true });
  await browser.close();
  if (errors.length) throw new Error(errors.join('\n'));
  if (firstScreenshot.equals(secondScreenshot)) throw new Error('Le feu ne change pas de frame.');
  if (result.transparent < 1000 || result.opaqueBlack > 20) {
    throw new Error(`Alpha invalide : transparent=${result.transparent}, noir opaque=${result.opaqueBlack}`);
  }
  process.stdout.write(JSON.stringify({ animated: true, transparent: result.transparent, opaqueBlack: result.opaqueBlack }) + '\n');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
