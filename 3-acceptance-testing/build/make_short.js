const fs = require('fs');
const path = require('path');
const d = require('docx');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType,
  HeadingLevel, ImageRun, LevelFormat, BorderStyle, PageBreak, Footer, PageNumber, VerticalAlign } = d;

const EV = path.join(__dirname, '..', 'evidence');
const c1 = JSON.parse(fs.readFileSync(path.join(EV, 'cycle1_v1.0', 'results.json')));
const c2 = JSON.parse(fs.readFileSync(path.join(EV, 'cycle2_v1.1', 'results.json')));
const byId = (arr) => Object.fromEntries(arr.map((r) => [r.id, r]));
const c3 = JSON.parse(fs.readFileSync(path.join(EV, 'cycle3_v1.2', 'results.json')));
const R1 = byId(c1), R2 = byId(c2), R3 = byId(c3);

const FONT = 'Arial';
const W = 9026; // A4 text width with 1" margins
const J = AlignmentType.JUSTIFIED;

const p = (text, opts = {}) => new Paragraph({ alignment: opts.align || J, spacing: { after: 120, line: 276 },
  children: (Array.isArray(text) ? text : [text]).map((t) => typeof t === 'string' ? new TextRun({ text: t, ...(opts.run || {}) }) : t) });
const b = (t) => new TextRun({ text: t, bold: true });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const h3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
const bullet = (t) => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, alignment: J, spacing: { after: 60 },
  children: (Array.isArray(t) ? t : [t]).map((x) => typeof x === 'string' ? new TextRun(x) : x) });
const caption = (t) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 200 },
  children: [new TextRun({ text: t, italics: true, size: 20 })] });

const border = { style: BorderStyle.SINGLE, size: 4, color: '8C9BAB' };
const borders = { top: border, bottom: border, left: border, right: border };
function table(headers, rows, widths, opts = {}) {
  const sum = widths.reduce((a, x) => a + x, 0);
  const ws = widths.map((x) => Math.round((x / sum) * W));
  ws[ws.length - 1] += W - ws.reduce((a, x) => a + x, 0);
  const cell = (content, i, header, fill) => new TableCell({
    width: { size: ws[i], type: WidthType.DXA }, borders, verticalAlign: VerticalAlign.TOP,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    shading: header ? { fill: '1F3A5F', type: ShadingType.CLEAR, color: 'auto' } : fill ? { fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
    children: String(content).split('\n').map((line) => new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 40 },
      children: [new TextRun({ text: line, size: 18, bold: header || (opts.boldFirst && i === 0), color: header ? 'FFFFFF' : undefined })] })),
  });
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: ws,
    rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, i, true)) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => {
        const fill = opts.status && i === opts.status ? (c === 'PASS' || c === 'Met' || c === 'Closed' ? 'DFF3E3' : (c === 'FAIL' || c.startsWith('Not met') ? 'FBE3E3' : undefined)) : undefined;
        return cell(c, i, false, fill);
      }) }))],
  });
}
const gap = () => new Paragraph({ spacing: { after: 120 }, children: [] });
function figure(file, cap) {
  const data = fs.readFileSync(file);
  return [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120 }, children: [new ImageRun({ type: 'png', data,
    transformation: { width: 560, height: Math.round(560 * 650 / 1100) },
    altText: { title: cap, description: cap, name: path.basename(file) } })] }), caption(cap)];
}

// ---------- content ----------
const AC = [
  ['AC-01', 'Registration confirmation', 'Confirmation with a reference number is shown within 5 seconds of registering.', 'Project brief'],
  ['AC-02', 'No over-enrolment', 'A course never holds more students than its capacity, even when many students register for the last seats at once.', 'Project brief'],
  ['AC-03', 'Secure access', 'Invalid logins are rejected, the account locks after 3 failed attempts, and logout ends access.', 'Derived'],
  ['AC-04', 'Drop course', 'A dropped course leaves the timetable and its seat is released immediately.', 'Derived'],
  ['AC-05', 'Timetable accuracy', 'The timetable shows exactly the registered courses with correct day, time, venue and total credits.', 'Derived'],
  ['AC-06', 'Clash prevention', 'A course that overlaps an existing class is rejected and the clashing course is named.', 'Derived'],
  ['AC-07', 'Credit limit', 'Total credits cannot exceed 20 per semester.', 'Derived'],
  ['AC-08', 'Duplicate prevention', 'A student cannot register for the same course twice.', 'Derived'],
  ['AC-09', 'Performance under load', '50 students registering at the same moment all get a response within 5 seconds.', 'Project brief'],
];

const TC = [
  ['UAT-01', 'AC-03', 'Log in as S001 with the correct password.', 'Taken to the Available Courses page.'],
  ['UAT-02', 'AC-03', 'Log in as S002 with a wrong password.', 'Refused with "Invalid student ID or password".'],
  ['UAT-03', 'AC-03', 'Enter two more wrong passwords for S002, then the correct one.', 'Account locked; correct password also refused.'],
  ['UAT-04', 'AC-01', 'Register for SWC4263 (0/40 seats taken).', 'Confirmation with reference in < 5 s; seats 1/40.'],
  ['UAT-05', 'AC-02', 'Register for SWC4413, which is full (30/30).', 'Rejected as full; seats stay 30/30.'],
  ['UAT-06', 'AC-02', 'S001 takes the last seat of SWC4613 (29/30); S060 then tries.', 'S001 confirmed; S060 rejected; 30/30.'],
  ['UAT-07', 'AC-08', 'Re-submit the SWC4263 registration.', 'Rejected as already registered.'],
  ['UAT-08', 'AC-06', 'Register SWC4113 (Mon 10-12) while holding SWC4263 (Mon 9-11).', 'Rejected; SWC4263 named as the clash.'],
  ['UAT-09', 'AC-07', 'Fill up to 20 credits, then register a 3-credit course.', 'Rejected with "Credit limit exceeded".'],
  ['UAT-10', 'AC-05', 'Open My Timetable.', '6 courses in day/time order; 20 / 20 credits.'],
  ['UAT-11', 'AC-04', 'Drop SWC4613.', 'Removed; 17 credits; seats 29/30.'],
  ['UAT-12', 'AC-04, AC-07', 'Register SWC4823; S060 retries SWC4613.', 'Both confirmed.'],
  ['UAT-13', 'AC-03', 'Log out, then open My Timetable.', 'Redirected to login.'],
  ['UAT-14', 'AC-02, AC-09', '50 students register for the 10 seats of SWC4823 at the same instant.', 'Exactly 10 confirmed and stored.'],
  ['UAT-15', 'AC-01, AC-09', '50 students register for open courses at the same instant.', 'All 50 confirmed in < 5 s.'],
];

const s = (x) => x.toFixed(2);
const short = (R) => ({
  'UAT-01': 'Logged in; Available Courses shown.',
  'UAT-02': 'Refused; "2 attempt(s) left" shown.',
  'UAT-03': 'Locked after 3rd failure; correct password refused.',
  'UAT-04': `Confirmed with reference in ${s(R['UAT-04'].seconds)} s; seats 1/40.`,
  'UAT-05': 'Rejected: "SWC4413 is full (30/30)".',
  'UAT-06': `S001 confirmed (${s(R['UAT-06'].seconds)} s); S060 rejected; 30/30.`,
  'UAT-07': 'Rejected: "already registered".',
  'UAT-08': 'Rejected: "Timetable clash with SWC4263".',
  'UAT-09': 'Four courses confirmed; 5th rejected: credit limit.',
  'UAT-10': '6 courses, correct order; 20 / 20 credits.',
  'UAT-11': 'Removed; 17 / 20 credits; seats 29/30.',
  'UAT-12': 'Both confirmed.',
  'UAT-13': 'Redirected to login.',
  'UAT-14': `${R['UAT-14'].confirmed} confirmed, ${R['UAT-14'].enrolled} stored (capacity 10).`,
  'UAT-15': `50/50 confirmed; slowest ${s(R['UAT-15'].maxSeconds)} s.`,
});
const S1 = short(R1), S2 = short(R2);
const count = (R) => Object.values(R).filter((r) => r.status === 'PASS').length;

const children = [
  h1('4. ACCEPTANCE TESTING'),
  p('Acceptance testing confirms, from the student\'s point of view, that UniReg meets the agreed acceptance criteria and is ready for delivery. It ends with a formal decision to accept or reject the system.'),

  h2('4.1 Acceptance Criteria'),
  p('The criteria combine the two given in the project brief for UniReg with the core student tasks. Each one is measurable, so the result is an objective Met or Not met.'),
  table(['ID', 'Criterion', 'Measurable requirement', 'Source'], AC, [9, 19, 56, 16], { boldFirst: true }),
  caption('Table 4.1: Acceptance criteria'),

  h2('4.2 Acceptance Test Plan'),
  p([b('Scope: '), 'login, lockout and logout; viewing courses; registering (capacity, clash, credit limit, duplicates); dropping; viewing the timetable; and 50 simultaneous registrations. Administrator functions and email/SMS notifications are out of scope.']),
  p([b('Approach: '), 'black-box user acceptance testing in the student role. UAT-01 to UAT-13 follow one student\'s journey through the web interface, scripted with Playwright so response times are measured exactly. UAT-14 and UAT-15 simulate 50 students registering at the same moment. If any test fails, the defect is fixed and the whole suite is re-run.']),
  p([b('Environment: '), 'UniReg web prototype (Python, SQLite) tested in the Chromium browser; 60 student accounts (S001 to S060, password Pass@123); 9 courses with 10 to 40 seats, SWC4413 pre-filled to 30/30.']),
  p([b('Entry criteria: '), 'build installed and test data loaded. ', b('Exit criteria: '), 'all test cases executed, every criterion Met, and no open Critical or High defects.']),
  table(['ID', 'Criterion', 'Test steps', 'Expected result'], TC, [11, 13, 44, 32], { boldFirst: true }),
  caption('Table 4.2: Acceptance test cases'),

  h2('4.3 Acceptance Test Report'),
  p(`Three cycles were run on 12 October 2026. In Cycle 1 (build v1.0), ${count(R1)} of 15 tests passed. In Cycle 2 (build v1.1, after the DEF-01 fix), all ${count(R2)} of 15 passed. Cycle 3 (build v1.2, after fixing DEF-02 and DEF-03 from the other stages) passed all ${count(R3)} of 15 again; the slowest UAT-15 response fell to ${s(R3['UAT-15'].maxSeconds)} s.`),
  table(['ID', 'Cycle 1 actual result (v1.0)', 'Status', 'Cycle 2 actual result (v1.1)', 'Status'],
    TC.map((t) => [t[0], S1[t[0]], R1[t[0]].status, S2[t[0]], R2[t[0]].status]), [10, 34, 9, 38, 9], { boldFirst: true, status: 2 }),
  caption('Table 4.3: Actual results'),
  h3('Defects'),
  table(['ID', 'Found by', 'Problem and cause', 'Severity', 'Fix and retest'], [
    ['DEF-01', 'UAT-14', 'With 50 students registering for 10 seats at once, 16, 12 and 11 were enrolled in three runs. The seat check and the save were separate steps, so simultaneous requests saw the same free seat (AC-02).', 'Critical', 'v1.1 locks the course while checking and saving. Exactly 10 enrolled in 3 of 3 runs. Closed.'],
    ['DEF-02', 'FT-31', 'Logout did not end the session on the server, so a copied cookie still worked (AC-03).', 'Medium', 'v1.2 ends the session on logout. Cycle 3 passed. Closed.'],
    ['DEF-03', 'ST-06, ST-07', 'With 40+ requests at the same instant, a few connections were refused (AC-09).', 'High', 'v1.2 queues up to 128 connections. Cycle 3 passed. Closed.'],
  ], [9, 11, 44, 10, 26], { boldFirst: true }),
  caption('Table 4.4: Defects (DEF-02 and DEF-03 were found by functional and system testing)'),
  h3('Analysis'),
  p(`All business rules worked for individual students, and confirmations took at most ${s(Math.max(R2['UAT-04'].seconds, R2['UAT-06'].seconds))} s, well under the 5-second target. Under 50 simultaneous registrations the slowest response was ${s(R2['UAT-15'].maxSeconds)} s, so performance still meets AC-09. The acceptance defect appeared only when students competed for the same seats at the same moment. It cannot be found by testing one student at a time, which is why the simultaneous test was included.`),
  h3('Acceptance decision'),
  p([b('Build v1.0: REJECTED '), 'because DEF-01 breaks AC-02.']),
  p([b('Build v1.2: ACCEPTED. '), 'All 9 criteria are met, all 15 tests pass in Cycle 3, and all three defects found across the project are closed. Before release, we recommend re-running the load tests on the real server with more students and keeping UAT-14 in the regression suite.']),
];

const doc = new Document({
  creator: 'Yasierul', title: 'Acceptance Testing - UniReg',
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 28, bold: true, color: '1F3A5F' }, paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 24, bold: true, color: '1F3A5F' }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 22, bold: true }, paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: { config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['Acceptance Testing  |  ', PageNumber.CURRENT], size: 18 })] })] }) },
    children,
  }],
});
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(process.argv[2], buf); console.log('wrote', process.argv[2]); });
