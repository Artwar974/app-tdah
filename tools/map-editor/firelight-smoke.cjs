const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.ATHENA_BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4176/?time=1&version=athena-solo-birds-stars-v39', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.removeItem('athena-housing-v2'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    for (const selector of ['#todayDrawer', '#journalOpen', '#housingOpen', '#temporalControls', '#temporalPreview']) {
      const element = document.querySelector(selector);
      if (element) element.dataset.smokeDisplay = element.style.display, element.style.display = 'none';
    }
  });
  await page.screenshot({ path: 'tools/map-editor/.smoke/ambient-night-scene.png', fullPage: true });
  await page.evaluate(() => {
    for (const element of document.querySelectorAll('[data-smoke-display]')) {
      element.style.display = element.dataset.smokeDisplay;
      delete element.dataset.smokeDisplay;
    }
  });
  await page.click('#housingOpen');
  await page.click('.housing-catalogue-item[data-type="table"]');
  await page.click('.housing-catalogue-item[data-type="torch"]');
  await page.waitForTimeout(1200);

  const night = await page.evaluate(() => {
    window.AthenaHousing.setVisualHour(1, {
      current: 'night', next: 'night', progress: 0,
      lightColor: '#dbe4ff', shadowColor: '#172344'
    });
    const sources = [...document.querySelectorAll('.housing-light-source')];
    const fireSource = document.querySelector('.housing-light-source--fire');
    const torchSource = document.querySelector('.housing-light-source--torch');
    const fire = document.querySelector('.housing-object[data-type="fire"]');
    const table = document.querySelector('.housing-object[data-type="table"]');
    const tableDaylight = [...table.querySelectorAll('.housing-object-daylight')];
    return {
      sourceCount: sources.length,
      sourceOpacities: sources.map(source => Number.parseFloat(getComputedStyle(source).getPropertyValue('--housing-source-opacity'))),
      groundUsesDayMaster: sources.every(source => getComputedStyle(source).backgroundImage.includes('MASTER_DAY_FIXED.png')),
      groundMask: getComputedStyle(sources[0]).webkitMaskImage || getComputedStyle(sources[0]).maskImage,
      tableDaylightLayers: tableDaylight.length,
      tableMask: tableDaylight[0]?.style.getPropertyValue('--housing-daylight-rx') || '',
      fireWidth: fire.getBoundingClientRect().width,
      flameGlowCount: document.querySelectorAll('.housing-flame-glow').length,
      torchGroundRemoved: !torchSource,
      fireLightY: Number.parseFloat(fireSource.style.getPropertyValue('--housing-light-y')),
      fireObjectY: Number.parseFloat(fire.style.getPropertyValue('--housing-y')),
      glowOpacity: Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--housing-flame-glow-opacity')),
      torchGlowBackground: getComputedStyle(document.querySelector('.housing-flame-glow--torch')).backgroundImage,
      fireGlowWidth: getComputedStyle(document.querySelector('.housing-flame-glow--fire')).width,
      ambientCounts: { ...window.AthenaAmbientLife.counts },
      ambientVisibility: window.AthenaAmbientLife.visibilityAt(1),
      legacyWildlifeNodes: document.querySelectorAll('.housing-firefly, .housing-butterfly').length,
      pointerEvents: getComputedStyle(document.querySelector('.housing-lights')).pointerEvents
    };
  });
  await page.screenshot({ path: 'tools/map-editor/.smoke/firelight-night.png', fullPage: true });

  await page.goto('http://127.0.0.1:4176/?time=12&version=athena-solo-birds-stars-v39-day', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    for (const selector of ['#todayDrawer', '#journalOpen', '#housingOpen', '#temporalControls', '#temporalPreview']) {
      const element = document.querySelector(selector);
      if (element) element.dataset.smokeDisplay = element.style.display, element.style.display = 'none';
    }
  });
  await page.screenshot({ path: 'tools/map-editor/.smoke/ambient-day-scene.png', fullPage: true });
  await page.evaluate(() => {
    for (const element of document.querySelectorAll('[data-smoke-display]')) {
      element.style.display = element.dataset.smokeDisplay;
      delete element.dataset.smokeDisplay;
    }
  });
  await page.click('#housingOpen');
  const day = await page.evaluate(() => {
    window.AthenaHousing.setVisualHour(12, {
      current: 'day', next: 'day', progress: 0,
      lightColor: '#fff4dc', shadowColor: '#445468'
    });
    const source = document.querySelector('.housing-light-source--fire');
    return {
      lightOpacity: Number.parseFloat(getComputedStyle(source).getPropertyValue('--housing-source-opacity')),
      ambientCounts: { ...window.AthenaAmbientLife.counts },
      ambientVisibility: window.AthenaAmbientLife.visibilityAt(12)
    };
  });
  await page.waitForTimeout(350);
  await page.screenshot({ path: 'tools/map-editor/.smoke/wildlife-day.png', fullPage: true });
  await browser.close();

  if (errors.length) throw new Error(errors.join('\n'));
  if (night.sourceCount !== 1 || !night.torchGroundRemoved) throw new Error(`Seul le feu doit encore projeter au sol : ${JSON.stringify(night)}`);
  if (!night.groundUsesDayMaster || !night.groundMask.includes('radial-gradient')) throw new Error(`Le sol n’utilise pas le master de jour masqué : ${JSON.stringify(night)}`);
  if (!(night.tableDaylightLayers > 0 && night.tableMask)) throw new Error(`La table ne reçoit pas de masque diurne partiel : ${JSON.stringify(night)}`);
  if (night.fireWidth < 55) throw new Error(`Le feu n’a pas été agrandi de 15 % : ${JSON.stringify(night)}`);
  if (night.flameGlowCount !== 2) throw new Error(`Les deux flammes n’ont pas leur glow local : ${JSON.stringify(night)}`);
  if (!(night.glowOpacity >= .35)) throw new Error(`Le glow des flammes reste trop faible la nuit : ${JSON.stringify(night)}`);
  if (Math.abs(night.fireLightY - night.fireObjectY) > .01) throw new Error(`La projection du feu n’est plus ancrée à sa base : ${JSON.stringify(night)}`);
  if (!night.torchGlowBackground.includes('radial-gradient')) throw new Error(`Le glow du flambeau n’est plus radial : ${JSON.stringify(night)}`);
  if (night.legacyWildlifeNodes !== 0) throw new Error(`L’ancienne imitation DOM est encore présente : ${JSON.stringify(night)}`);
  if (night.ambientCounts.birds !== 6 || night.ambientCounts.motes !== 18 || night.ambientCounts.butterflies !== 5 || night.ambientCounts.fireflies !== 13) throw new Error(`La vie ambiante canvas n’est pas complète : ${JSON.stringify(night)}`);
  if (night.ambientCounts.blinkingStars < 12 || night.ambientCounts.blinkingStars > 42) throw new Error(`La sélection d’étoiles clignotantes est anormale : ${JSON.stringify(night)}`);
  if (night.ambientVisibility.night < .99 || night.ambientVisibility.day > .01) throw new Error(`La vie nocturne n’est pas correctement sélectionnée : ${JSON.stringify(night)}`);
  if (day.ambientVisibility.night > .01 || day.ambientVisibility.day < .99) throw new Error(`La vie diurne n’est pas correctement sélectionnée : ${JSON.stringify(day)}`);
  if (!(night.sourceOpacities[0] > day.lightOpacity)) throw new Error('La source ne gagne pas en intensité la nuit.');
  if (night.pointerEvents !== 'none') throw new Error('Le calque lumineux intercepte les interactions.');
  process.stdout.write(JSON.stringify({ night, day }) + '\n');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
