const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1600, deviceScaleFactor: 1 });
  const url = 'file://' + path.resolve(__dirname, '..', 'brochure.html');
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(async () => { if (document.fonts && document.fonts.ready) await document.fonts.ready; });

  // Snapshot top
  await page.screenshot({ path: path.resolve(__dirname, 'preview-top.png'), clip: { x: 0, y: 0, width: 1280, height: 1100 } });
  // Snapshot middle (compare + tour)
  await page.screenshot({ path: path.resolve(__dirname, 'preview-middle.png'), clip: { x: 0, y: 2400, width: 1280, height: 1700 } });
  // Snapshot tour grid
  await page.screenshot({ path: path.resolve(__dirname, 'preview-tour.png'), clip: { x: 0, y: 4100, width: 1280, height: 1700 } });
  // Snapshot bottom (specs + download)
  await page.screenshot({ path: path.resolve(__dirname, 'preview-bottom.png'), clip: { x: 0, y: 5800, width: 1280, height: 1500 } });
  await browser.close();
})();
