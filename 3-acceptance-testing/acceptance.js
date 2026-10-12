// UniReg acceptance test run (browser-driven UAT + concurrent load).
// Usage (from the repo's top folder): node 3-acceptance-testing/acceptance.js [outDir]
// Starts and stops UniReg itself on port 8765. Default outDir: 3-acceptance-testing/evidence/latest-run
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(process.argv[2] || path.join(__dirname, 'evidence', 'latest-run'));
const SHOTS = path.join(OUT, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const PORT = 8765;
const BASE = `http://localhost:${PORT}`;
const APP = path.join(__dirname, '..', process.env.UNIREG_APP || 'app.py');
const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function startApp() {
  const proc = spawn('python3', [APP, String(PORT)], { env: { ...process.env, UNIREG_DB: path.join(OUT, 'unireg-test.db') } });
  return new Promise(async (resolve) => {
    for (let i = 0; i < 50; i++) {
      try { await fetch(`${BASE}/login`); return resolve(proc); } catch { await sleep(100); }
    }
    throw new Error('app did not start');
  });
}

function record(id, actual, pass, extra = {}) {
  results.push({ id, actual, status: pass ? 'PASS' : 'FAIL', executed: new Date().toISOString(), ...extra });
  console.log(`${id}: ${pass ? 'PASS' : 'FAIL'} - ${actual}`);
}

async function login(page, id, pw) {
  await page.goto(`${BASE}/login`);
  await page.fill('#student_id', id);
  await page.fill('#password', pw);
  await page.click('#login');
}

async function seats(page, code) {
  await page.goto(`${BASE}/courses`);
  return (await page.textContent(`#row-${code} .seats`)).trim();
}

async function registerUI(page, code) {
  await page.goto(`${BASE}/courses`);
  const t0 = Date.now();
  await page.click(`#reg-${code}`);
  await page.waitForSelector('#message');
  const secs = (Date.now() - t0) / 1000;
  const msg = (await page.textContent('#message')).trim();
  return { msg, secs, ok: (await page.getAttribute('#message', 'class')).includes('ok') };
}

async function apiLogin(id) {
  const r = await fetch(`${BASE}/login`, { method: 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `student_id=${id}&password=Pass@123` });
  return r.headers.get('set-cookie').split(';')[0];
}

async function apiRegister(cookie, code) {
  const t0 = Date.now();
  const r = await fetch(`${BASE}/register`, { method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookie, Accept: 'text/plain' }, body: `code=${code}` });
  const text = await r.text();
  return { ok: text.startsWith('OK'), text, secs: (Date.now() - t0) / 1000 };
}

async function countEnrolled(code) {
  const sqlite = spawn('python3', ['-c',
    `import sqlite3,sys;print(sqlite3.connect(sys.argv[1]).execute("select count(*) from enrolments where code=?",(sys.argv[2],)).fetchone()[0])`,
    path.join(OUT, 'unireg-test.db'), code]);
  let out = ''; for await (const c of sqlite.stdout) out += c; return parseInt(out);
}

(async () => {
  // ---------------- Cycle 1: browser-driven UAT, one student journey ----------------
  let app = await startApp();
  const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 650 } });
  const page = await ctx.newPage();
  const shot = (n) => page.screenshot({ path: path.join(SHOTS, `${n}.png`) });

  // UAT-01 valid login
  await login(page, 'S001', 'Pass@123');
  const onCourses = page.url().endsWith('/courses');
  await shot('UAT-01');
  record('UAT-01', onCourses ? 'Logged in as S001 and redirected to Available Courses page.' : `Stayed on ${page.url()}`, onCourses);

  // UAT-02 wrong password
  const ctx2 = await browser.newContext({ viewport: { width: 1100, height: 650 } });
  const p2 = await ctx2.newPage();
  await p2.goto(`${BASE}/login`); await p2.fill('#student_id', 'S002'); await p2.fill('#password', 'wrong1'); await p2.click('#login');
  let m = (await p2.textContent('#message')).trim();
  await p2.screenshot({ path: path.join(SHOTS, 'UAT-02.png') });
  record('UAT-02', `Message shown: "${m}"`, m.includes('Invalid') && p2.url().includes('/login'));

  // UAT-03 lockout after 3 failed attempts, then correct password still refused
  for (const pw of ['wrong2', 'wrong3']) { await p2.fill('#student_id', 'S002'); await p2.fill('#password', pw); await p2.click('#login'); }
  const m3 = (await p2.textContent('#message')).trim();
  await p2.fill('#student_id', 'S002'); await p2.fill('#password', 'Pass@123'); await p2.click('#login');
  const m4 = (await p2.textContent('#message')).trim();
  await p2.screenshot({ path: path.join(SHOTS, 'UAT-03.png') });
  record('UAT-03', `After 3rd wrong attempt: "${m3}". Correct password then gives: "${m4}"`, m3.includes('locked') && m4.includes('locked'));
  await ctx2.close();

  // UAT-04 register an open course, confirmation < 5 s with reference number
  let r = await registerUI(page, 'SWC4263');
  await shot('UAT-04');
  const s4 = await seats(page, 'SWC4263');
  record('UAT-04', `"${r.msg}" displayed in ${r.secs.toFixed(2)} s; seats now ${s4}.`, r.ok && r.secs < 5 && /REG-[0-9A-F]{8}/.test(r.msg) && s4 === '1/40', { seconds: r.secs });

  // UAT-05 full course is rejected, seat count unchanged
  const before5 = await seats(page, 'SWC4413');
  r = await registerUI(page, 'SWC4413');
  await shot('UAT-05');
  const after5 = await seats(page, 'SWC4413');
  record('UAT-05', `"${r.msg}" Seats before ${before5}, after ${after5}.`, !r.ok && after5 === '30/30', { seconds: r.secs });

  // UAT-06 last remaining seat: S001 takes seat 30/30, next student is rejected
  for (let i = 31; i <= 59; i++) await apiRegister(await apiLogin(`S${String(i).padStart(3, '0')}`), 'SWC4613');
  const before6 = await seats(page, 'SWC4613');
  r = await registerUI(page, 'SWC4613');
  await shot('UAT-06a');
  const c3 = await apiLogin('S060');
  const late = await apiRegister(c3, 'SWC4613');
  const after6 = await seats(page, 'SWC4613');
  await shot('UAT-06b');
  record('UAT-06', `Seats before ${before6}. S001: "${r.msg}" (${r.secs.toFixed(2)} s). S060 then: "${late.text.split('|')[1]}". Seats after ${after6}.`,
    r.ok && !late.ok && after6 === '30/30', { seconds: r.secs });

  // UAT-07 duplicate registration (re-submitting the form, e.g. Back + resubmit)
  const dup = await page.request.post(`${BASE}/register`, { form: { code: 'SWC4263' } });
  const dupHtml = await dup.text();
  const dupMsg = (dupHtml.match(/id="message">([^<]*)/) || [])[1] || '';
  const s7 = await seats(page, 'SWC4263');
  record('UAT-07', `Re-submitted SWC4263: "${dupMsg}"; seats remain ${s7}.`, dupMsg.includes('already registered') && s7 === '1/40');

  // UAT-08 timetable clash (SWC4113 Mon 10-12 vs SWC4263 Mon 09-11)
  r = await registerUI(page, 'SWC4113');
  await shot('UAT-08');
  record('UAT-08', `"${r.msg}"`, !r.ok && r.msg.includes('clash'), { seconds: r.secs });

  // UAT-09 credit limit: fill to 20 credits, then a further 3-credit course must be rejected
  const fill = [];
  for (const code of ['SWC4213', 'SWC4323', 'SWC4513', 'SWC4723']) { const x = await registerUI(page, code); fill.push(`${code} ${x.ok ? 'confirmed' : 'REJECTED'} (${x.secs.toFixed(2)} s)`); }
  r = await registerUI(page, 'SWC4823');
  await shot('UAT-09');
  record('UAT-09', `${fill.join(', ')}. Then SWC4823: "${r.msg}"`, !r.ok && r.msg.includes('Credit limit'), { seconds: r.secs });

  // UAT-10 timetable accuracy
  await page.goto(`${BASE}/timetable`);
  await shot('UAT-10');
  const rows = await page.$$eval('tr[id^=tt-]', (trs) => trs.map((t) => [...t.children].slice(0, 5).map((c) => c.textContent).join(' ')));
  const total = (await page.textContent('#total')).trim();
  const expected = ['Mon 09:00-11:00 SWC4263', 'Tue 14:00-16:00 SWC4213', 'Wed 09:00-12:00 SWC4323', 'Thu 14:00-16:00 SWC4513', 'Fri 09:00-11:00 SWC4613', 'Fri 14:00-17:00 SWC4723'];
  const okTT = rows.length === 6 && expected.every((e, i) => rows[i].startsWith(e)) && total === 'Total credits: 20 / 20';
  record('UAT-10', `${rows.length} courses listed in day/time order (${rows.map((x) => x.split(' ').slice(0, 3).join(' ')).join('; ')}). ${total}.`, okTT);

  // UAT-11 drop course releases the seat
  await page.click('#drop-SWC4613');
  const dropMsg = (await page.textContent('#message')).trim();
  const stillThere = await page.$('#tt-SWC4613');
  const total11 = (await page.textContent('#total')).trim();
  await shot('UAT-11');
  const s11 = await seats(page, 'SWC4613');
  record('UAT-11', `"${dropMsg}" Course removed from timetable: ${!stillThere}. ${total11}. SWC4613 seats now ${s11}.`, !stillThere && s11 === '29/30' && total11.includes('17'));

  // UAT-12 freed credits and seat can be used again
  r = await registerUI(page, 'SWC4823');
  await shot('UAT-12');
  const late2 = await apiRegister(c3, 'SWC4613');
  record('UAT-12', `S001 registers SWC4823: "${r.msg.split(' Reference')[0]}" (${r.secs.toFixed(2)} s). S060 retries the released SWC4613 seat: ${late2.ok ? 'confirmed' : 'rejected'}.`, r.ok && late2.ok, { seconds: r.secs });

  // UAT-13 (part of AC-01) logout ends access
  await page.goto(`${BASE}/logout`);
  await page.goto(`${BASE}/timetable`);
  const backToLogin = page.url().endsWith('/login');
  record('UAT-13', backToLogin ? 'After logout, opening My Timetable redirects to the login page.' : 'Timetable still reachable after logout.', backToLogin);

  await browser.close();
  app.kill(); await sleep(300);

  // ---------------- Cycle 2: concurrent load on a fresh system ----------------
  app = await startApp();
  const ids = Array.from({ length: 50 }, (_, i) => `S${String(i + 1).padStart(3, '0')}`);
  const cookies = await Promise.all(ids.map(apiLogin));

  // UAT-14: 50 students race for the 10 seats in SWC4823 at the same instant
  let res = await Promise.all(cookies.map((c) => apiRegister(c, 'SWC4823')));
  let okN = res.filter((x) => x.ok).length;
  let enrolled = await countEnrolled('SWC4823');
  let maxT = Math.max(...res.map((x) => x.secs));
  record('UAT-14', `50 simultaneous requests for 10 seats: ${okN} confirmed, ${50 - okN} rejected; ${enrolled} students stored as enrolled (capacity 10). Slowest response ${maxT.toFixed(2)} s.`,
    okN === 10 && enrolled === 10, { confirmed: okN, enrolled, maxSeconds: maxT });

  // UAT-15: 50 students register at the same instant for courses with enough seats (40 x SWC4263, 10 x SWC4213)
  res = await Promise.all(cookies.map((c, i) => apiRegister(c, i < 40 ? 'SWC4263' : 'SWC4213')));
  okN = res.filter((x) => x.ok).length;
  const times = res.map((x) => x.secs).sort((a, b) => a - b);
  const p95 = times[Math.ceil(0.95 * times.length) - 1];
  maxT = times[times.length - 1];
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  record('UAT-15', `${okN}/50 confirmed. Average ${avg.toFixed(2)} s, 95th percentile ${p95.toFixed(2)} s, slowest ${maxT.toFixed(2)} s.`,
    okN === 50 && maxT < 5, { confirmed: okN, avgSeconds: avg, p95Seconds: p95, maxSeconds: maxT });

  app.kill();
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`Saved ${results.length} results to ${OUT}`);
})().catch((e) => { console.error(e); process.exit(1); });
