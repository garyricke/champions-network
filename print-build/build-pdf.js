// Build print-ready PDFs of the Champions brochure (v1 painterly + v2 modern).
//
// Each output: 8 pages at 8.75 × 11.25 in (US Letter trim 8.5 × 11 + 0.125 in bleed),
// crop marks rendered into the bleed, full-bleed art and exact colors. Also produces
// trim-clipped page thumbnails for the explainer at assets/brochure/thumbs/<v>/page-N.png
//
// Run: node build-pdf.js

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..');

const variants = [
  {
    key: 'v1',
    htmlFile: 'brochure-print.html',
    pdfFile: 'champions-brochure-print-ready.pdf',
    label: 'v1 painterly',
  },
  {
    key: 'v2',
    htmlFile: 'brochure-modern-print.html',
    pdfFile: 'champions-brochure-modern-print-ready.pdf',
    label: 'v2 modern',
  },
];

async function buildVariant(browser, v) {
  const inputHtml = path.join(repoRoot, v.htmlFile);
  const outputPdf = path.join(repoRoot, v.pdfFile);
  if (!fs.existsSync(inputHtml)) {
    console.error(`[${v.key}] missing source: ${inputHtml}`);
    return;
  }
  const fileUrl = 'file://' + inputHtml;

  const page = await browser.newPage();
  await page.emulateMediaType('print');
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 120000 });
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  });

  await page.pdf({
    path: outputPdf,
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  // Trim-clipped thumbnails for the explainer page
  const thumbDir = path.join(repoRoot, 'assets', 'brochure', 'thumbs', v.key);
  if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

  await page.emulateMediaType('screen');
  await page.evaluate(() => document.body.classList.add('no-crops'));
  await page.setViewport({ width: 875, height: 1125, deviceScaleFactor: 2 });

  const bleedCssPx = 12.5; // 0.125in × 100 CSS px/in
  const pageIds = ['page-1','page-2','page-3','page-4','page-5','page-6','page-7','page-8'];
  for (const id of pageIds) {
    const el = await page.$('#' + id);
    if (!el) continue;
    const box = await el.boundingBox();
    await page.screenshot({
      path: path.join(thumbDir, `${id}.png`),
      type: 'png',
      omitBackground: false,
      clip: {
        x: box.x + bleedCssPx,
        y: box.y + bleedCssPx,
        width: box.width - bleedCssPx * 2,
        height: box.height - bleedCssPx * 2,
      },
    });
  }

  await page.close();

  const stat = fs.statSync(outputPdf);
  console.log(`[${v.key} ${v.label}] ${path.basename(outputPdf)} — ${(stat.size / 1024 / 1024).toFixed(2)} MB · 8 thumbs in thumbs/${v.key}/`);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--font-render-hinting=none'],
  });

  for (const v of variants) {
    await buildVariant(browser, v);
  }

  await browser.close();
  console.log('\ndone.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
