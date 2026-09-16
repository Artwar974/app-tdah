const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.ATHENA_BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding']
  });
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:4176/', { waitUntil: 'domcontentloaded' });
    await page.setContent(`<!doctype html><video muted playsinline loop preload="auto" src="http://127.0.0.1:4176/assets/CAMP_BACKGROUND_ANIMATED.mp4?v=wave-speed-analysis"></video>`);
    const samples = await page.evaluate(async () => {
      const video = document.querySelector('video');
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('metadata timeout')), 15000);
        video.addEventListener('loadeddata', () => { clearTimeout(timeout); resolve(); }, { once: true });
        video.load();
      });
      const canvas = document.createElement('canvas');
      canvas.width = 180;
      canvas.height = 96;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      const output = [];
      let previous = null;
      let previousMediaTime = null;
      let wraps = 0;
      video.playbackRate = .5;
      await video.play();

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('frame analysis timeout')), 30000);
        const inspect = (_now, metadata) => {
          const mediaTime = metadata.mediaTime;
          if (previousMediaTime !== null && mediaTime + .25 < previousMediaTime) wraps += 1;
          context.drawImage(video, 0, 350, 720, 450, 0, 0, canvas.width, canvas.height);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
          if (previous) {
            let total = 0;
            let changed = 0;
            for (let index = 0; index < pixels.length; index += 4) {
              const delta = Math.max(
                Math.abs(pixels[index] - previous[index]),
                Math.abs(pixels[index + 1] - previous[index + 1]),
                Math.abs(pixels[index + 2] - previous[index + 2])
              );
              total += delta;
              if (delta > 3) changed += 1;
            }
            output.push({
              mediaTime,
              previousMediaTime,
              dt: mediaTime >= previousMediaTime ? mediaTime - previousMediaTime : video.duration - previousMediaTime + mediaTime,
              meanDelta: total / (pixels.length / 4),
              changedRatio: changed / (pixels.length / 4),
              wraps
            });
          }
          previous = new Uint8ClampedArray(pixels);
          previousMediaTime = mediaTime;
          if (wraps >= 1 && mediaTime >= 1.25) {
            clearTimeout(timeout);
            video.pause();
            resolve();
            return;
          }
          video.requestVideoFrameCallback(inspect);
        };
        video.requestVideoFrameCallback(inspect);
      });
      return { duration: video.duration, output };
    });

    const bins = new Map();
    for (const sample of samples.output) {
      if (sample.dt <= 0 || sample.dt > .26) continue;
      const key = Math.floor(sample.mediaTime * 2) / 2;
      if (!bins.has(key)) bins.set(key, []);
      bins.get(key).push(sample.meanDelta / sample.dt);
    }
    const summary = [...bins.entries()].map(([start, values]) => ({
      start,
      speed: values.reduce((sum, value) => sum + value, 0) / values.length,
      samples: values.length
    }));
    const seam = samples.output.filter(sample => sample.wraps > 0 && sample.mediaTime < .7);
    process.stdout.write(`${JSON.stringify({ duration: samples.duration, summary, seam }, null, 2)}\n`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
