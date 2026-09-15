const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.ATHENA_BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.stack || error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });

  const response = await page.goto('http://127.0.0.1:4188/__editor__/?editor=open&version=smoke', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  if (!response || !response.ok()) throw new Error(`Réponse HTTP invalide : ${response?.status()}`);
  await page.waitForSelector('.ase-shell:not([hidden])', { timeout: 30000 });
  await page.waitForSelector('#scene', { timeout: 30000 });
  await page.waitForFunction(() => Boolean(window.AthenaSceneEditor && window.AthenaRendererEditor && window.AthenaSceneRuntime));
  await page.screenshot({ path: 'tools/map-editor/.smoke/editor.png', fullPage: true });

  const result = await page.evaluate(() => ({
    title: document.title,
    editorVisible: !document.querySelector('.ase-shell').hidden,
    layerCount: window.AthenaSceneRuntime.getLayers().length,
    objectCount: window.AthenaHousing.getObjects().length,
    sourceSize: window.AthenaHousing.getSceneSize()
  }));
  await browser.close();
  if (errors.length) throw new Error(errors.join('\n'));
  process.stdout.write(`${JSON.stringify(result)}\n`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
