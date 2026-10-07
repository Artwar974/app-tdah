const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.ATHENA_BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  });
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
  const errors = [];
  const failedResponses = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  await page.goto('http://127.0.0.1:4176/?time=18&version=athena-launch-catalog-v77', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.removeItem('athena-housing-v2'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#housingOpen', { timeout: 30000 });
  await page.click('#housingOpen');
  await page.waitForSelector('.housing-catalogue-item[data-type="launchMarketWorkshop"]');

  const catalogue = await page.evaluate(async () => {
    const buttons = [...document.querySelectorAll('.housing-catalogue-item[data-type^="launch"]')];
    await Promise.all(buttons.map(button => {
      const image = button.querySelector('img');
      if (image.complete) return Promise.resolve();
      return new Promise(resolve => image.addEventListener('load', resolve, { once: true }));
    }));
    return buttons.map(button => {
      const image = button.querySelector('img');
      return {
        type: button.dataset.type,
        label: button.textContent.trim(),
        src: image.getAttribute('src'),
        loaded: image.complete && image.naturalWidth > 0 && image.naturalHeight > 0
      };
    });
  });

  const samples = [
    ['launchMarketWorkshop', 'atelier-marche'],
    ['launchHearthKitchen', 'cuisine-cheminee'],
    ['launchBrazier', 'brasero'],
    ['launchPottedOlive', 'olivier-pot'],
    ['launchVictoryStatue', 'statue-victoire'],
    ['launchMajorRock', 'rocher-majeur']
  ];
  for (const [type] of samples) await page.click(`.housing-catalogue-item[data-type="${type}"]`);
  const placed = await page.evaluate(entries => entries.map(([, slug]) => {
    const image = [...document.querySelectorAll('.housing-object img')].find(candidate => candidate.getAttribute('src')?.includes(`/${slug}.webp`));
    return Boolean(image?.complete && image.naturalWidth);
  }), samples);
  await page.screenshot({ path: 'tools/map-editor/.smoke/housing-launch-catalog.png', fullPage: true });
  await browser.close();

  if (errors.length) throw new Error(errors.join('\n'));
  if (failedResponses.length) throw new Error(failedResponses.join('\n'));
  if (catalogue.length !== 64) throw new Error(`Le catalogue de lancement doit contenir 64 objets, reçu ${catalogue.length}.`);
  if (catalogue.some(item => !item.loaded)) throw new Error(`Images absentes : ${JSON.stringify(catalogue.filter(item => !item.loaded))}`);
  if (catalogue.some(item => /tente|feu de camp/i.test(`${item.label} ${item.src}`))) {
    throw new Error('La tente ou le feu de camp de la planche a été importé par erreur.');
  }
  if (placed.some(value => !value)) throw new Error(`Certains objets échantillons ne sont pas apparus : ${JSON.stringify({ samples, placed })}`);
  process.stdout.write(JSON.stringify({ catalogueCount: catalogue.length, loaded: true, excludedTentAndCampfire: true }) + '\n');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
