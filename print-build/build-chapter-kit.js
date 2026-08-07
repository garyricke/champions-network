#!/usr/bin/env node
// ============================================================
// Champions Network — Chapter Publicity Kit builder
//
// One chapter = one JSON file in chapter-kit/chapters/<slug>.json.
// This renders that data through the shared templates and outputs:
//
//   assets/chapter-kit/<slug>-poster.pdf        8.5×11 poster (bleed + crops)
//   assets/chapter-kit/<slug>-handouts.pdf      2 sheets, 5.5×8.5 half-sheets 2-up
//   assets/chapter-kit/<slug>-social-square.png   1080×1080
//   assets/chapter-kit/<slug>-social-portrait.png 1080×1350
//   <slug>.html                                 landing page at /<slug>
//   assets/chapter-kit/qr-<slug>.svg            QR → landing page
//   assets/chapter-kit/thumbs/<slug>/*.png      trim-clipped previews
//
// Run:  node build-chapter-kit.js boulder
//       node build-chapter-kit.js            (builds every chapter)
//
// Layout safety: every fixed-height print container is measured
// (scrollHeight vs clientHeight) and the build FAILS LOUDLY on
// overflow — a clipped flex child is invisible in a thumbnail.
// ============================================================

const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..');
const kitDir = path.join(repoRoot, 'chapter-kit');
const outDir = path.join(repoRoot, 'assets', 'chapter-kit');

// ---------- tiny template engine ----------
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// "Stand with the *students*." -> "Stand with the <span class='accent'>students</span>."
const accentize = (s) =>
  esc(s).replace(/\*(.+?)\*/g, '<span class="accent">$1</span>');

function render(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (m, key) => {
    if (!(key in vars)) throw new Error(`template token {{${key}}} has no value`);
    const v = vars[key];
    // *HTML-suffixed tokens are pre-built markup; everything else is escaped
    return key.endsWith('HTML') || key.endsWith('Grid') || key.endsWith('Flag')
      || key.endsWith('Inline') || key.endsWith('Spans') || key.endsWith('Items')
      ? v
      : esc(v);
  });
}

// ---------- Cloudinary delivery URL with the chapter's cinematic grade ----------
// Transform components are '/'-separated and ORDER MATTERS: size/crop first, then
// the colour grade, then format+quality last. `photoGrade` is the single knob —
// tune it in the chapter JSON, not here.
const CLOUD = 'https://res.cloudinary.com/dsbllwpbh/image/upload';

function photoUrl(c, sizeTransform) {
  const parts = [sizeTransform];
  if (c.photoGrade) parts.push(c.photoGrade);
  parts.push('f_auto,q_auto');
  return `${CLOUD}/${parts.join('/')}/${c.photoId}.jpg`;
}

// ---------- derive the computed tokens ----------
function buildVars(c) {
  const flagged = c.sessions.filter((s) => s.note && /parent/i.test(s.note));

  const scheduleGrid = c.sessions
    .map((s) => {
      const isFlag = s.note && /parent/i.test(s.note);
      return `<div class="p-date${isFlag ? ' p-date--flag' : ''}"><span class="d">${esc(s.date)}</span></div>`;
    })
    .join('\n        ');

  const scheduleFlag = flagged.length
    ? `<p class="p-sched__flag"><b>${esc(flagged.map((f) => f.date).join(' · '))}</b> — ${esc(flagged[0].note.replace(/^.*—\s*/, ''))}</p>`
    : '';

  const datesInline = c.sessions.map((s) => esc(s.date)).join(' &nbsp;·&nbsp; ');

  const datesSpans = c.sessions
    .map((s) => `<span>${esc(s.date)}</span>`)
    .join('\n        ');

  const datesItems = c.sessions
    .map((s) => {
      const note = s.note ? `<span class="note">${esc(s.note)}</span>` : '';
      return `<li><span class="d">${esc(s.date)}</span>${note}</li>`;
    })
    .join('\n          ');

  return {
    ...c,
    // Width only — no aspect crop here. Each surface frames the shot with CSS
    // object-position, so a c_fill crop at this stage would double-crop and
    // slice the top off the tower.
    heroPhoto: photoUrl(c, 'w_1800'),
    heroPhotoSocial: photoUrl(c, 'w_1200'),
    adultHeadlineHTML: accentize(c.adultHeadline),
    studentHeadlineHTML: accentize(c.studentHeadline),
    scheduleGrid,
    scheduleFlag,
    datesInline,
    datesSpans,
    datesItems,
    sessionCount: String(c.sessions.length),
  };
}

// ---------- overflow guard ----------
async function assertNoOverflow(page, selectors, label) {
  const bad = await page.evaluate((sels) => {
    const out = [];
    for (const sel of sels) {
      document.querySelectorAll(sel).forEach((el, i) => {
        const over = el.scrollHeight - el.clientHeight;
        const overW = el.scrollWidth - el.clientWidth;
        if (over > 1 || overW > 1) {
          out.push({ sel, i, over, overW, h: el.clientHeight, sh: el.scrollHeight });
          return;
        }
        // scrollHeight omits a scroll container's own padding-bottom, so content
        // can spill into (or past) the bottom padding with over === 0. Measure the
        // last child against the padding box directly.
        const kids = el.children;
        if (!kids.length) return;
        const cs = getComputedStyle(el);
        const padB = parseFloat(cs.paddingBottom) || 0;
        const elBottom = el.getBoundingClientRect().bottom - parseFloat(cs.borderBottomWidth || 0);
        const lastBottom = kids[kids.length - 1].getBoundingClientRect().bottom;
        const spill = lastBottom - (elBottom - padB);
        if (spill > 1) {
          out.push({ sel, i, over: Math.round(spill), overW: 0, h: el.clientHeight, sh: el.clientHeight + Math.round(spill), pad: true });
        }
      });
    }
    return out;
  }, selectors);

  if (bad.length) {
    console.error(`\n  ✗ OVERFLOW in ${label}:`);
    for (const b of bad) {
      console.error(
        `      ${b.sel}[${b.i}] content ${b.sh}px in ${b.h}px box — ${b.over}px too tall${b.pad ? ' (spills into padding)' : ''}${b.overW > 1 ? `, ${b.overW}px too wide` : ''}`
      );
    }
    return false;
  }
  console.log(`  ✓ ${label} — no overflow`);
  return true;
}

// ---------- per-chapter build ----------
async function buildChapter(browser, slug) {
  const cfgPath = path.join(kitDir, 'chapters', `${slug}.json`);
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const vars = buildVars(cfg);

  console.log(`\n=== ${cfg.chapterName} (${slug}) ===`);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 1. QR code → landing page
  const qrPath = path.join(repoRoot, cfg.qrFile);
  await QRCode.toFile(qrPath, cfg.landingUrl, {
    type: 'svg',
    margin: 1,
    color: { dark: '#055A81', light: '#FFFFFF' },
  });
  console.log(`  ✓ QR → ${cfg.landingUrl}`);

  const buildDir = path.join(kitDir, 'build');
  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });

  let ok = true;

  // 2. Print pieces
  const printJobs = [
    {
      tpl: 'poster.html',
      out: `${slug}-poster.html`,
      pdf: `${slug}-poster.pdf`,
      pages: ['page-1'],
      guard: ['.poster-frame', '.p-body__col', '.p-sched'],
      label: 'poster 8.5×11',
      thumbW: 875,
      thumbH: 1125,
    },
    {
      tpl: 'handouts.html',
      out: `${slug}-handouts.html`,
      pdf: `${slug}-handouts.pdf`,
      pages: ['page-1', 'page-2'],
      guard: ['.half', '.h-body'],
      label: 'half-sheets 2-up',
      thumbW: 1125,
      thumbH: 875,
    },
  ];

  for (const job of printJobs) {
    const tpl = fs.readFileSync(path.join(kitDir, 'templates', job.tpl), 'utf8');
    const htmlPath = path.join(buildDir, job.out);
    fs.writeFileSync(htmlPath, render(tpl, vars), 'utf8');

    const page = await browser.newPage();
    await page.emulateMediaType('print');
    await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0', timeout: 120000 });
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    });

    if (!(await assertNoOverflow(page, job.guard, job.label))) ok = false;

    const pdfPath = path.join(outDir, job.pdf);
    await page.pdf({
      path: pdfPath,
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    // trim-clipped preview thumbs
    const thumbDir = path.join(outDir, 'thumbs', slug);
    if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });
    await page.emulateMediaType('screen');
    await page.evaluate(() => document.body.classList.add('no-crops'));
    // 1× is plenty — these display ~240–390px wide in the chapters.html grid.
    // 2× quadrupled the committed weight for no visible gain.
    await page.setViewport({ width: job.thumbW, height: job.thumbH, deviceScaleFactor: 1 });

    const bleed = 12.5; // 0.125in at 100 CSS px/in
    for (const id of job.pages) {
      const el = await page.$('#' + id);
      if (!el) continue;
      const box = await el.boundingBox();
      await page.screenshot({
        path: path.join(thumbDir, `${job.pdf.replace('.pdf', '')}-${id}.png`),
        clip: {
          x: box.x + bleed,
          y: box.y + bleed,
          width: box.width - bleed * 2,
          height: box.height - bleed * 2,
        },
      });
    }
    await page.close();

    const mb = (fs.statSync(pdfPath).size / 1024 / 1024).toFixed(2);
    console.log(`  → ${job.pdf} (${mb} MB)`);
  }

  // 3. Social posts → PNG
  {
    const tpl = fs.readFileSync(path.join(kitDir, 'templates', 'social.html'), 'utf8');
    const htmlPath = path.join(buildDir, `${slug}-social.html`);
    fs.writeFileSync(htmlPath, render(tpl, vars), 'utf8');

    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1400, deviceScaleFactor: 1 });
    await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0', timeout: 120000 });
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    });

    if (!(await assertNoOverflow(page, ['.s-pad', '.post'], 'social posts'))) ok = false;

    for (const [id, name] of [
      ['social-square', `${slug}-social-square.png`],
      ['social-portrait', `${slug}-social-portrait.png`],
    ]) {
      const el = await page.$('#' + id);
      if (!el) continue;
      await el.screenshot({ path: path.join(outDir, name) });
      console.log(`  → ${name}`);
    }
    await page.close();
  }

  // 4. Landing page
  {
    const tplPath = path.join(kitDir, 'templates', 'landing.html');
    if (fs.existsSync(tplPath)) {
      const tpl = fs.readFileSync(tplPath, 'utf8');
      fs.writeFileSync(path.join(repoRoot, `${slug}.html`), render(tpl, vars), 'utf8');
      console.log(`  → ${slug}.html  (serves at /${slug})`);
    }
  }

  return ok;
}

// ---------- gated admin index (all chapters, always regenerated) ----------
function buildAdminIndex() {
  const shell = fs.readFileSync(path.join(kitDir, 'templates', 'admin-index.html'), 'utf8');
  const card = fs.readFileSync(path.join(kitDir, 'templates', 'admin-chapter-card.html'), 'utf8');

  const cards = fs
    .readdirSync(path.join(kitDir, 'chapters'))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => {
      const cfg = JSON.parse(fs.readFileSync(path.join(kitDir, 'chapters', f), 'utf8'));
      return render(card, buildVars(cfg));
    })
    .join('\n\n');

  fs.writeFileSync(
    path.join(repoRoot, 'chapters.html'),
    shell.replace('{{chapterCards}}', cards),
    'utf8'
  );
  console.log(`\n  → chapters.html  (gated admin index, serves at /chapters)`);
}

(async () => {
  const only = process.argv[2];
  const slugs = only
    ? [only]
    : fs
        .readdirSync(path.join(kitDir, 'chapters'))
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace(/\.json$/, ''));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--font-render-hinting=none'],
  });

  let allOk = true;
  for (const slug of slugs) {
    if (!(await buildChapter(browser, slug))) allOk = false;
  }
  await browser.close();

  buildAdminIndex();

  console.log(allOk ? '\ndone — all layouts clean.' : '\ndone WITH OVERFLOW — fix the boxes above.');
  process.exit(allOk ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
