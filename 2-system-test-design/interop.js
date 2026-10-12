// Interoperability tests for UniReg (Ramzi's section): the same student journey in
// different browsers and screen sizes.
//
//   npm install playwright && npx playwright install chromium firefox webkit
//   node 2-system-test-design/interop.js
//
// Starts UniReg itself. Writes results/interop_results.md and a screenshot per browser.
const { chromium, firefox, webkit, devices } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'results');
const PORT = 8766;
const BASE = `http://127.0.0.1:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TARGETS = [
  { id: 'ST-08', name: 'Chromium (Chrome / Edge engine), desktop 1280x800', type: chromium, ctx: { viewport: { width: 1280, height: 800 } } },
  { id: 'ST-09', name: 'Firefox, desktop 1280x800', type: firefox, ctx: { viewport: { width: 1280, height: 800 } } },
  { id: 'ST-10', name: 'WebKit (Safari engine), desktop 1280x800', type: webkit, ctx: { viewport: { width: 1280, height: 800 } } },
  { id: 'ST-11', name: 'Mobile phone (iPhone 13 screen, Chromium)', type: chromium, ctx: devices['iPhone 13'], mobile: true },
];

async function startApp() {
  const db = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'unireg-')), 'interop.db');
  const proc = spawn('python3', [path.join(ROOT, process.env.UNIREG_APP || 'app.py'), String(PORT)], { env: { ...process.env, UNIREG_DB: db } });
  for (let i = 0; i < 50; i++) {
    try { await fetch(`${BASE}/login`); return proc; } catch { await sleep(100); }
  }
  throw new Error('app did not start');
}

async function journey(browserType, ctxOpts, shot) {
  const launchOpts = process.env.PW_CHROMIUM_PATH && browserType === chromium ? { executablePath: process.env.PW_CHROMIUM_PATH } : {};
  const browser = await browserType.launch(launchOpts);
  try {
    const page = await (await browser.newContext(ctxOpts)).newPage();
    const steps = [];
    await page.goto(`${BASE}/login`);
    await page.fill('#student_id', 'S001');
    await page.fill('#password', 'Pass@123');
    await page.click('#login');
    steps.push(['login', page.url().endsWith('/courses')]);
    await page.click('#reg-SWC4263');
    const msg = await page.textContent('#message');
    steps.push(['register', msg.includes('Registration confirmed')]);
    await page.screenshot({ path: shot });
    await page.goto(`${BASE}/timetable`);
    steps.push(['timetable', !!(await page.$('#tt-SWC4263'))]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await page.click('#drop-SWC4263');
    steps.push(['drop', !(await page.$('#tt-SWC4263'))]);
    return { steps, overflow };
  } finally {
    await browser.close();
  }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const rows = [];
  for (const t of TARGETS) {
    const app = await startApp();
    try {
      const shot = path.join(OUT, `${t.id}.png`);
      const { steps, overflow } = await journey(t.type, t.ctx, shot);
      const passed = steps.every(([, ok]) => ok);
      let actual = steps.map(([s, ok]) => `${s} ${ok ? 'ok' : 'FAILED'}`).join(', ');
      let status = passed ? 'PASS' : 'FAIL';
      if (t.mobile) {
        actual += overflow > 0 ? `; page is ${overflow}px wider than the screen (sideways scrolling needed)` : '; fits the screen width';
        if (overflow > 0) status = 'FAIL';
      }
      rows.push({ ...t, actual, status });
    } catch (e) {
      rows.push({ ...t, actual: `Not run on this machine: ${String(e.message).split('\n')[0].slice(0, 90)}`, status: 'NOT RUN' });
    } finally {
      app.kill();
      await sleep(300);
    }
    const r = rows[rows.length - 1];
    console.log(`${r.id}  ${r.status}  ${r.name}: ${r.actual}`);
  }
  let md = `# Interoperability test log\n\nRun: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} · Journey: login, register SWC4263, view timetable, drop.\n\n`;
  md += '| ID | Browser / device | Actual | Status |\n|---|---|---|---|\n';
  for (const r of rows) md += `| ${r.id} | ${r.name} | ${r.actual} | ${r.status} |\n`;
  fs.writeFileSync(path.join(OUT, 'interop_results.md'), md);
  console.log('Saved results/interop_results.md');
})();
