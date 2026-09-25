const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const output = 'tools/map-editor/.audit/camp-motion';
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.ATHENA_BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  });
  const page = await browser.newPage({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.stack || error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });

  try {
    const response = await page.goto('http://127.0.0.1:4176/?timelapse=1&cycleSeconds=48&version=camp-motion-v45', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    if (!response || !response.ok()) throw new Error(`Invalid HTTP response: ${response?.status()}`);
    await page.waitForSelector('.loading.done', { timeout: 60000 });
    await page.waitForFunction(() => {
      const video = document.querySelector('#oceanVideoSource');
      return video && video.readyState >= 2 && video.videoWidth === 720 && video.videoHeight === 1280;
    }, { timeout: 60000 });
    await page.addStyleTag({ content: '#todayDrawer,#journalOpen,#temporalControls,#temporalPreview{display:none!important}' });

    const setHour = async hour => {
      await page.locator('#temporalTimeline').evaluate((timeline, value) => {
        timeline.value = String(value * 60);
        timeline.dispatchEvent(new Event('input', { bubbles: true }));
      }, hour);
      await page.waitForTimeout(1200);
    };

    await setHour(6);
    await page.locator('#scene').screenshot({ path: `${output}/sunrise.png` });
    await setHour(12);
    await page.locator('#scene').screenshot({ path: `${output}/day-a.png` });
    await page.waitForTimeout(1200);
    await page.locator('#scene').screenshot({ path: `${output}/day-b.png` });
    await setHour(18);
    await page.locator('#scene').screenshot({ path: `${output}/sunset.png` });
    await setHour(0);
    await page.locator('#scene').screenshot({ path: `${output}/night.png` });
    // Run longer than the 7.9 s source duration to exercise the seamless relay.
    await page.waitForTimeout(9000);
    await page.locator('#scene').screenshot({ path: `${output}/after-loop.png` });

    const result = await page.evaluate(() => {
      const video = document.querySelector('#oceanVideoSource');
      return {
        source: video.currentSrc,
        readyState: video.readyState,
        videoSize: [video.videoWidth, video.videoHeight],
        currentTime: video.currentTime,
        paused: video.paused,
        sourcePlayers: Array.from(document.querySelectorAll('video'))
          .filter(item => item.currentSrc.includes('CAMP_BACKGROUND_ANIMATED'))
          .map(item => ({ currentTime: item.currentTime, duration: item.duration, paused: item.paused, readyState: item.readyState })),
        loadingDone: document.querySelector('.loading').classList.contains('done')
      };
    });
    if (errors.length) throw new Error(errors.join('\n'));
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
