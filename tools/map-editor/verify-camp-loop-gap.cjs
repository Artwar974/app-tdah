const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.ATHENA_BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding']
  });
  try {
    const page = await browser.newPage({ viewport: { width: 720, height: 1280 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto('http://127.0.0.1:4176/?timelapse=1&cycleSeconds=48&version=athena-native-wave-loop-v48', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForSelector('.loading.done', { timeout: 60000 });
    await page.waitForFunction(() => {
      const videos = Array.from(document.querySelectorAll('video'))
        .filter(video => video.currentSrc.includes('CAMP_BACKGROUND_ANIMATED'));
      return videos.length === 2 && videos.every(video => video.readyState >= 2);
    }, { timeout: 60000 });

    const timing = await page.evaluate(async () => {
      const videos = Array.from(document.querySelectorAll('video'))
        .filter(video => video.currentSrc.includes('CAMP_BACKGROUND_ANIMATED'));
      const events = [];
      for (const [index, video] of videos.entries()) {
        for (const name of ['waiting', 'stalled', 'pause', 'ended']) {
          video.addEventListener(name, () => events.push({ index, name, at: performance.now(), mediaTime: video.currentTime }));
        }
      }
      return await new Promise((resolve, reject) => {
        const progressGaps = [];
        const previousMediaTimes = videos.map(video => video.currentTime);
        const initialActiveIndex = videos.findIndex(video => !video.paused);
        let overlapObserved = false;
        let lastProgressAt = performance.now();
        let maxProgressGapMs = 0;
        const timeout = setTimeout(() => {
          clearInterval(interval);
          reject(new Error(`No relay transition observed; players=${JSON.stringify(videos.map(video => ({ time: video.currentTime, paused: video.paused })))}`));
        }, 20000);
        const interval = setInterval(() => {
          const now = performance.now();
          let progressed = false;
          videos.forEach((video, index) => {
            if (Math.abs(video.currentTime - previousMediaTimes[index]) >= .002) progressed = true;
            previousMediaTimes[index] = video.currentTime;
          });
          if (progressed) {
            const progressGap = now - lastProgressAt;
            progressGaps.push(progressGap);
            maxProgressGapMs = Math.max(maxProgressGapMs, progressGap);
            lastProgressAt = now;
          }
          const activeIndices = videos
            .map((video, index) => (!video.paused ? index : -1))
            .filter(index => index >= 0);
          if (activeIndices.length === 2) overlapObserved = true;
          const switched = overlapObserved
            && activeIndices.length === 1
            && activeIndices[0] !== initialActiveIndex;
          if (switched) {
            const sorted = [...progressGaps.slice(-160)].sort((a, b) => a - b);
            clearInterval(interval);
            clearTimeout(timeout);
            resolve({
              maxProgressGapMs,
              medianProgressGapMs: sorted[Math.floor(sorted.length / 2)],
              activeIndex: activeIndices[0],
              players: videos.map(video => ({ time: video.currentTime, paused: video.paused, rate: video.playbackRate })),
              overlapObserved,
              events
            });
          }
        }, 8);
      });
    });
    if (errors.length) throw new Error(errors.join('\n'));
    process.stdout.write(`${JSON.stringify(timing)}\n`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
