#!/usr/bin/env node
/* visual-qa.js — real-scroll visual check for any page.
   Derived from the ad-hoc Playwright scripts used in the Ahmed Omani session
   (real mouse-wheel scrolling, clipped-text detector, overflow + console checks).

   Usage:
     node visual-qa.js --url http://localhost:8000/index.html --out ./qa \
        --vp 1440x900,390x844 --sections "#home,#about,#contact"
   Env: PLAYWRIGHT_MODULE (path to the playwright package), CHROME_PATH (browser binary).
   Output: PNG per viewport/section + a JSON report; exit code 1 if any check fails.
   It reports facts only — it does NOT judge design quality. Look at the PNGs. */
const fs = require('fs'), path = require('path');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const url = arg('url'); if (!url) { console.error('--url required'); process.exit(2); }
const out = arg('out', './qa'); fs.mkdirSync(out, { recursive: true });
const vps = arg('vp', '1440x900,390x844').split(',').map(s => { const [w, h] = s.split('x').map(Number); return { w, h }; });
const sections = arg('sections', '').split(',').filter(Boolean);
let pw; try { pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright'); } catch (e) {
  try { pw = require('/opt/node22/lib/node_modules/playwright'); } catch (e2) { console.error('playwright not found; set PLAYWRIGHT_MODULE'); process.exit(2); } }

async function wheelTo(p, y) {            // scroll like a user: wheel events, not scrollTo
  let cur = await p.evaluate(() => scrollY), guard = 0;
  while (Math.abs(cur - y) > 80 && guard++ < 300) {
    await p.mouse.wheel(0, (y > cur ? 1 : -1) * 300); await p.waitForTimeout(35);
    const n = await p.evaluate(() => scrollY); if (n === cur) break; cur = n;
  }
  await p.waitForTimeout(900);
}
const clipDetector = () => {              // text whose box sticks out of an overflow:hidden ancestor
  const res = [];
  document.querySelectorAll('h1,h2,h3,h4,p,span,a,b,li,div,button').forEach(el => {
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) return;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height || getComputedStyle(el).display === 'none') return;
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (/(hidden|clip)/.test(cs.overflow + cs.overflowX + cs.overflowY)) {
        const ar = a.getBoundingClientRect();
        if (ar.height > 0 && r.bottom > 0 && (r.top < ar.top - 2 || r.bottom > ar.bottom + 2 || r.left < ar.left - 2 || r.right > ar.right + 2))
          res.push(`${el.tagName}.${el.className} | "${el.textContent.trim().slice(0, 30)}" | clipped by .${a.className}`);
        break;
      }
    }
  });
  return res.slice(0, 20);
};

(async () => {
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--ignore-certificate-errors'] });
  const report = []; let failed = false;
  for (const vp of vps) {
    const p = await b.newPage({ viewport: { width: vp.w, height: vp.h }, ignoreHTTPSErrors: true });
    const errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type() === 'error' && errors.push('console: ' + m.text()));
    await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(2000);
    const tag = `${vp.w}x${vp.h}`;
    await p.screenshot({ path: path.join(out, `${tag}_top.png`) });
    const targets = sections.length ? sections : [];
    for (const s of targets) {
      const y = await p.evaluate(sel => { const e = document.querySelector(sel); return e ? e.getBoundingClientRect().top + scrollY : null; }, s);
      if (y === null) { report.push({ vp: tag, section: s, missing: true }); failed = true; continue; }
      await wheelTo(p, Math.max(0, y - 60));
      await p.screenshot({ path: path.join(out, `${tag}_${s.replace(/[^\w]/g, '')}.png`) });
    }
    await p.evaluate(() => scrollTo(0, 0));
    const H = await p.evaluate(() => document.documentElement.scrollHeight);   // walk the whole page so lazy/reveal logic runs
    for (let y = 0; y < H; y += 400) { await p.mouse.wheel(0, 400); await p.waitForTimeout(40); }
    await p.waitForTimeout(800);
    const r = {
      vp: tag,
      horizontalOverflow: await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      brokenImages: await p.evaluate(() => [...document.images].filter(i => i.complete && !i.naturalWidth && i.currentSrc).map(i => i.currentSrc.slice(0, 80))),
      clippedText: await p.evaluate(clipDetector), errors
    };
    if (r.horizontalOverflow || r.brokenImages.length || r.errors.length) failed = true;   // clippedText is advisory: review manually
    report.push(r); await p.close();
  }
  await b.close();
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(failed ? 1 : 0);
})();
