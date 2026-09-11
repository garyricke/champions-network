// Build the branded Mom & Pop Papers from mom-pop/papers.json.
//
// For each paper: mom-pop/paper-NN.html (the print source, also viewable in a
// browser), assets/mom-pop/mom-pop-NN-<slug>.pdf (US Letter, office-printable,
// no bleed), and assets/mom-pop/thumbs/paper-NN.png (page 1, for the index).
//
// Run: node build-mom-pop.js          (all papers)
//      node build-mom-pop.js 2        (just paper #2)

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(repoRoot, 'mom-pop', 'papers.json'), 'utf8'));
const only = process.argv[2] ? Number(process.argv[2]) : null;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pad = n => String(n).padStart(2, '0');

function block(b) {
  if (typeof b === 'string') return `<p>${esc(b)}</p>`;
  if (b.quote) return `<blockquote class="pull"><p>${esc(b.quote)}</p><cite>${esc(b.cite)}${b.note ? `<sup>${b.note}</sup>` : ''}</cite></blockquote>`;
  if (b.scripture) return `<blockquote class="scripture"><p>${esc(b.scripture)}</p><cite>${esc(b.cite)}</cite></blockquote>`;
  if (b.list) return `<ul class="pts">${b.list.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
  return '';
}

function render(p) {
  const s = data.series;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mom &amp; Pop Paper No. ${p.number} — ${esc(p.title)}</title>
<link rel="icon" href="../favicon-champions-network.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playfair+Display:ital,wght@0,700;1,700&family=Poppins:ital,wght@0,300;0,400;0,600;1,300&display=swap" rel="stylesheet">
<link rel="stylesheet" href="paper.css">
</head><body>
<article class="paper">

  <header class="band">
    <img class="logo" src="../logo-champions-network-20mar2026-on-dark-background.svg" alt="Champions Network">
    <div class="series">
      <span class="name">${esc(s.name)}</span>
      <span class="no">No. ${p.number}</span>
    </div>
  </header>

  <div class="title-block">
    <h1>${esc(p.title)}</h1>
    ${p.subtitle ? `<p class="subtitle">${esc(p.subtitle)}</p>` : ''}
    <p class="kicker">${esc(p.kicker)}</p>
  </div>

  <div class="body">
    ${p.body.map(block).join('\n    ')}
  </div>

  <section class="questions">
    <div class="q-head">
      <span class="eyebrow">Talk it through</span>
      <h2>Discussion Questions</h2>
      <p>Work through these with your group, then with a friend or your spouse — without the sheet.</p>
    </div>
    <ol>
      ${p.questions.map(q => `<li><span class="q">${esc(q)}</span><span class="lines"></span></li>`).join('\n      ')}
    </ol>
    ${p.footnotes.length ? `<div class="footnotes">${p.footnotes.map((f, i) => `<div><sup>${i + 1}</sup> ${esc(f)}</div>`).join('')}</div>` : ''}
    <footer class="colophon">
      <span>${esc(s.org)}</span>
      <span class="url">${esc(s.url)}</span>
    </footer>
  </section>

</article>
</body></html>
`;
}

(async () => {
  const outDir = path.join(repoRoot, 'assets', 'mom-pop');
  const thumbDir = path.join(outDir, 'thumbs');
  fs.mkdirSync(thumbDir, { recursive: true });

  const browser = await puppeteer.launch();
  for (const p of data.papers) {
    if (only && p.number !== only) continue;
    const htmlFile = path.join(repoRoot, 'mom-pop', `paper-${pad(p.number)}.html`);
    fs.writeFileSync(htmlFile, render(p));

    const page = await browser.newPage();
    await page.goto('file://' + htmlFile, { waitUntil: 'networkidle0', timeout: 120000 });
    await page.evaluateHandle('document.fonts.ready');

    const pdfFile = path.join(outDir, `mom-pop-${pad(p.number)}-${p.slug}.pdf`);
    await page.pdf({
      path: pdfFile,
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `<div style="width:100%;font-family:Helvetica,Arial,sans-serif;font-size:7.5px;color:#7a8794;
        padding:0 0.75in;display:flex;justify-content:space-between;">
        <span>Mom &amp; Pop Paper No. ${p.number} &middot; ${esc(p.title)}</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
      margin: { top: '0.6in', bottom: '0.6in', left: '0', right: '0' },
    });

    // page-1 thumbnail: render the first sheet's worth of the source at 2x
    await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });
    await page.screenshot({ path: path.join(thumbDir, `paper-${pad(p.number)}.png`), clip: { x: 0, y: 0, width: 816, height: 1056 } });
    await page.close();

    const kb = Math.round(fs.statSync(pdfFile).size / 1024);
    console.log(`[No. ${p.number}] ${path.basename(pdfFile)} — ${kb} KB`);
  }
  await browser.close();
})();
