const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  let browser;
  try {
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.ATHENA_BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  });
  const page = await browser.newPage({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:4176/', { waitUntil: 'domcontentloaded' });
  await page.setContent(`<!doctype html><style>html,body{margin:0;background:#111}video{display:block;width:720px;height:1280px;object-fit:fill}</style><video muted playsinline preload="auto" src="http://127.0.0.1:4176/assets/CAMP_BACKGROUND_ANIMATED.mp4?v=inspect-v1"></video>`);
  const video = page.locator('video');
  await page.waitForFunction(() => {
    const element = document.querySelector('video');
    return element && element.readyState >= 1 && Number.isFinite(element.duration);
  }, { timeout: 30000 });
  const metadata = await video.evaluate(element => ({
    width: element.videoWidth,
    height: element.videoHeight,
    duration: element.duration,
    readyState: element.readyState
  }));
  fs.mkdirSync('tools/map-editor/.audit/camp-video', { recursive: true });
  const times = [];
  await video.evaluate(async element => {
    element.currentTime = 0;
    element.playbackRate = 2;
    await element.play();
  });
  for (let index = 0; index < 6; index += 1) {
    await page.waitForTimeout(index === 0 ? 250 : 550);
    times.push(await video.evaluate(element => element.currentTime));
    await video.screenshot({ path: `tools/map-editor/.audit/camp-video/frame-${index}.png` });
  }
  await video.evaluate(element => element.pause());
  process.stdout.write(`${JSON.stringify({ metadata, times })}\n`);
  } finally {
    if (browser) await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
