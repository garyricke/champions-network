const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1100, deviceScaleFactor: 1 });
  const url = 'file://' + path.resolve(__dirname, '..', 'brochure.html');
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(async () => { if (document.fonts && document.fonts.ready) await document.fonts.ready; });

  // Snapshot the download band area first
  await page.evaluate(() => {
    document.getElementById('download').scrollIntoView({ block: 'start' });
  });
  await new Promise(r => setTimeout(r, 250));
  await page.screenshot({ path: path.resolve(__dirname, 'preview-band.png'), fullPage: false });

  // Click the "Order Printed Copies" button
  await page.evaluate(() => {
    document.querySelector('[data-om-open]').click();
  });
  await new Promise(r => setTimeout(r, 400));

  await page.screenshot({ path: path.resolve(__dirname, 'preview-modal.png'), fullPage: false });
  await browser.close();
  console.log('OK preview-modal.png');
})();
