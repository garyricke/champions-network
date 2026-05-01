const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1600, deviceScaleFactor: 1 });
  const url = 'file://' + path.resolve(__dirname, '..', 'brochure.html');
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(async () => { if (document.fonts && document.fonts.ready) await document.fonts.ready; });
  await page.screenshot({ path: path.resolve(__dirname, 'preview-explainer-full.png'), fullPage: true });
  await browser.close();
  console.log('OK preview-explainer-full.png');
})();
