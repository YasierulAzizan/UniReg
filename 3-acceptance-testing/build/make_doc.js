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
  ['AC-01', 'Registration confirmation', 'After a valid registration, a confirmation message with a unique reference number is displayed within 5 seconds.', 'Response time < 5 s; reference in format REG-XXXXXXXX', 'Project brief', 'High'],
  ['AC-02', 'No over-enrolment', 'The system never enrols more students than a course\'s capacity, including when many students register for the last seats at the same time.', 'Enrolled count <= capacity in 100% of attempts', 'Project brief', 'Critical'],
  ['AC-03', 'Secure access', 'Only valid students can log in. Invalid credentials are rejected with a message, the account locks after 3 failed attempts, and logout ends access.', 'Lock after exactly 3 failures; 0 protected pages reachable after logout', 'Derived', 'High'],
  ['AC-04', 'Drop course', 'A dropped course is removed from the student\'s timetable and its seat is released immediately for other students.', 'Seat count reduced by 1; course absent from timetable', 'Derived', 'High'],
  ['AC-05', 'Timetable accuracy', 'The timetable lists exactly the registered courses with the correct day, time and venue, in day/time order, with total credits.', '100% match with registered courses', 'Derived', 'High'],
  ['AC-06', 'Clash prevention', 'Registration is rejected when the new course overlaps an already registered course, and the clashing course is named.', 'Clash detected in 100% of overlapping cases', 'Derived', 'Medium'],
  ['AC-07', 'Credit limit', 'A student cannot exceed the maximum of 20 credit hours per semester.', 'Registration rejected when total > 20', 'Derived', 'Medium'],
  ['AC-08', 'Duplicate prevention', 'A student cannot register for the same course twice (e.g. by re-submitting the form).', '0 duplicate enrolments', 'Derived', 'Medium'],
  ['AC-09', 'Performance under load', 'When 50 students submit registrations at the same moment, every request is answered within 5 seconds and no valid registration fails.', 'Slowest response < 5 s; 100% of valid requests confirmed', 'Project brief', 'High'],
];

const TC = [
  ['UAT-01', 'AC-03', 'Valid login', 'Student S001 exists (password Pass@123).', '1. Open UniReg login page.\n2. Enter S001 / Pass@123.\n3. Click Login.', 'Student is logged in and taken to the Available Courses page.'],
  ['UAT-02', 'AC-03', 'Invalid password', 'Student S002 exists.', '1. Enter S002 with a wrong password.\n2. Click Login.', 'Login refused with "Invalid student ID or password" and the remaining attempts shown.'],
  ['UAT-03', 'AC-03', 'Account lockout', 'UAT-02 done (1 failed attempt).', '1. Enter two more wrong passwords for S002.\n2. Enter the correct password.', 'After the 3rd failure the account is locked; the correct password is also refused while locked.'],
  ['UAT-04', 'AC-01', 'Register an open course', 'S001 logged in; SWC4263 has 0/40 seats taken.', '1. Click Register for SWC4263.\n2. Time from click to message.', 'Confirmation with reference REG-XXXXXXXX shown in < 5 s; seats become 1/40.'],
  ['UAT-05', 'AC-02', 'Register a full course', 'SWC4413 is full (30/30).', '1. Click Register for SWC4413.', 'Registration rejected with a "full" message; seats remain 30/30.'],
  ['UAT-06', 'AC-01, AC-02', 'Last remaining seat', 'SWC4613 has 29/30 seats taken.', '1. S001 registers for SWC4613.\n2. Student S060 then tries the same course.', 'S001 is confirmed (30/30). S060 is rejected; seats stay 30/30.'],
  ['UAT-07', 'AC-08', 'Duplicate registration', 'S001 already registered for SWC4263.', '1. Re-submit the SWC4263 registration form (Back + resubmit).', 'Rejected with "already registered"; seats stay 1/40.'],
  ['UAT-08', 'AC-06', 'Timetable clash', 'S001 has SWC4263 (Mon 09:00-11:00).', '1. Register for SWC4113 (Mon 10:00-12:00).', 'Rejected; message names the clashing course SWC4263.'],
  ['UAT-09', 'AC-07', 'Credit limit', 'S001 has 6 credits.', '1. Register SWC4213, SWC4323, SWC4513, SWC4723 (total 20).\n2. Register SWC4823 (3 credits).', 'First four confirmed. SWC4823 rejected with "Credit limit exceeded".'],
  ['UAT-10', 'AC-05', 'View timetable', 'S001 has 6 courses (20 credits).', '1. Open My Timetable.', 'Exactly 6 courses listed with correct day, time and venue in day/time order; "Total credits: 20 / 20".'],
  ['UAT-11', 'AC-04', 'Drop a course', 'S001 registered for SWC4613 (30/30).', '1. Click Drop for SWC4613.\n2. Check timetable and seat count.', 'Course removed, total becomes 17 credits, SWC4613 seats become 29/30.'],
  ['UAT-12', 'AC-04, AC-07', 'Reuse freed capacity', 'UAT-11 done.', '1. S001 registers SWC4823 (17 + 3 = 20).\n2. S060 retries SWC4613.', 'Both registrations confirmed.'],
  ['UAT-13', 'AC-03', 'Logout', 'S001 logged in.', '1. Click Logout.\n2. Try to open My Timetable.', 'Redirected to the login page.'],
  ['UAT-14', 'AC-02, AC-09', 'Race for last seats', 'Fresh system. SWC4823 has 10 free seats; 50 students logged in.', '1. All 50 students submit SWC4823 at the same instant.\n2. Count confirmations and stored enrolments.', 'Exactly 10 confirmed and 10 stored; 40 rejected; all responses < 5 s.'],
  ['UAT-15', 'AC-01, AC-09', 'Concurrent registration load', '50 students logged in; enough seats (40 x SWC4263, 10 x SWC4213).', '1. All 50 students submit at the same instant.\n2. Record each response time.', 'All 50 confirmed; slowest response < 5 s.'],
];

const statusOf = (R, ids) => ids.every((i) => R[i].status === 'PASS') ? 'Met' : 'Not met';
const acMap = { 'AC-01': ['UAT-04', 'UAT-06', 'UAT-09', 'UAT-12', 'UAT-15'], 'AC-02': ['UAT-05', 'UAT-06', 'UAT-14'], 'AC-03': ['UAT-01', 'UAT-02', 'UAT-03', 'UAT-13'],
  'AC-04': ['UAT-11', 'UAT-12'], 'AC-05': ['UAT-10'], 'AC-06': ['UAT-08'], 'AC-07': ['UAT-09', 'UAT-12'], 'AC-08': ['UAT-07'], 'AC-09': ['UAT-14', 'UAT-15'] };

const count = (R) => { const v = Object.values(R); const pass = v.filter((r) => r.status === 'PASS').length; return [v.length, pass, v.length - pass]; };
const [n1, p1, f1] = count(R1), [n2, p2, f2] = count(R2), [n3, p3, f3] = count(R3);
const regTimes = (R) => ['UAT-04', 'UAT-06', 'UAT-09', 'UAT-12'].map((i) => R[i].seconds).filter((x) => x != null);
const maxSingle2 = Math.max(...regTimes(R2));
const fmt = (x) => x.toFixed(2);

const children = [
  h1('4. ACCEPTANCE TESTING'),
  p('Acceptance testing is the final stage of the testing process. Its purpose is to confirm, from the point of view of the end user (the student), that UniReg meets the agreed acceptance criteria and is ready for delivery. Unlike functional and system testing, which check the system against its specification, acceptance testing checks the system against what the customer needs, and ends with a formal decision to accept or reject the system.'),
  p('This section defines the acceptance criteria for UniReg (4.1), presents the acceptance test plan and test cases (4.2 and 4.3), and reports the results of executing them, including the defects found and the final acceptance decision (4.4).'),

  h2('4.1 Acceptance Criteria'),
  p('The acceptance criteria were derived from two sources: the criteria given in the project brief for UniReg (registration confirmation in under 5 seconds and prevention of over-enrolment), and the core student activities that UniReg must support (log in, view courses, register, drop and view timetable). Each criterion is measurable, so that its outcome is an objective Met or Not met rather than a matter of opinion.'),
  table(['ID', 'Criterion', 'Description', 'Measure / threshold', 'Source', 'Priority'], AC, [8, 13, 34, 22, 11, 10], { boldFirst: true }),
  caption('Table 4.1: UniReg acceptance criteria'),

  h2('4.2 Acceptance Test Plan'),
  h3('4.2.1 Objectives'),
  bullet('Verify that every acceptance criterion in Table 4.1 is met by the delivered system.'),
  bullet('Exercise UniReg through realistic end-to-end student journeys rather than isolated functions.'),
  bullet('Record and report any defect that would stop the system being accepted, and confirm its fix by retesting.'),
  bullet('Provide evidence for a formal accept or reject decision.'),
  h3('4.2.2 Scope'),
  p([b('In scope: '), 'student login, account lockout and logout; viewing available courses; course registration including capacity, clash, credit-limit and duplicate rules; dropping a course; viewing the timetable; and registration response time when 50 students register at the same moment.']),
  p([b('Out of scope: '), 'administrator and lecturer functions, payment of fees, email/SMS notifications, and load beyond 50 simultaneous users. Load and stress limits are covered by the System Test Design section.']),
  h3('4.2.3 Test Approach'),
  p('Acceptance testing was carried out as black-box user acceptance testing (UAT) from the student role. Test cases UAT-01 to UAT-13 follow one continuous student journey through the web interface, so the result of one step forms the starting state of the next, as it would for a real student. The browser steps were scripted with Playwright so that every click could be replayed exactly and response times measured precisely from the moment the Register button is clicked to the moment the confirmation message appears. Test cases UAT-14 and UAT-15 simulate 50 students submitting registrations at the same instant, which cannot be done reliably by hand.'),
  p('Two test cycles were planned: Cycle 1 runs every test case on the delivered build. If any test fails, the defect is reported to the development team and, after a fix, Cycle 2 re-runs the complete set of test cases (not only the failed one) to confirm the fix and check that nothing else has broken (regression). The same rule applies to any later build: when defects found by the functional and system test stages were fixed in build v1.2, the full suite was re-run as Cycle 3.'),
  h3('4.2.4 Test Environment and Test Data'),
  table(['Item', 'Details'], [
    ['System under test', 'UniReg web prototype. Cycle 1: build v1.0. Cycle 2: build v1.1 (contains the fix for DEF-01). Cycle 3: build v1.2 (also fixes DEF-02 and DEF-03, found in functional and system testing).'],
    ['Server', 'Python 3.13 web server with SQLite database, Linux'],
    ['Client', 'Chromium browser (headless), 1100 x 650 window, driven by Playwright 1.56'],
    ['Load simulation', 'Node.js script sending 50 simultaneous registration requests from 50 logged-in student sessions'],
    ['Student accounts', '60 accounts, S001 to S060, password Pass@123'],
    ['Courses', '9 courses (3 or 4 credits each) with capacities from 10 to 40. SWC4413 Human Computer Interaction is pre-filled to 30/30 to test a full course.'],
    ['Business rules', 'Maximum 20 credit hours per student; no overlapping classes; account locks after 3 failed logins'],
  ], [25, 75], { boldFirst: true }),
  caption('Table 4.2: Test environment and test data'),
  h3('4.2.5 Entry and Exit Criteria'),
  p([b('Entry criteria: '), 'functional and system testing completed; the build installed in the test environment; test accounts and course data loaded; no open Critical defects from earlier stages.']),
  p([b('Exit criteria: '), 'all acceptance test cases executed; every acceptance criterion Met; no open Critical or High severity defects; acceptance test report completed and signed off.']),
  h3('4.2.6 Roles and Responsibilities'),
  table(['Role', 'Responsibility', 'Person'], [
    ['Acceptance test lead', 'Defines criteria and test cases, executes tests, logs defects, writes the acceptance test report', 'Yasierul'],
    ['Development team', 'Analyses and fixes reported defects, delivers the new build', 'Group (simulated)'],
    ['Reviewers', 'Review the acceptance criteria and the final decision', 'Amir, Ramzi, Aliff'],
  ], [25, 55, 20], { boldFirst: true }),
  caption('Table 4.3: Roles and responsibilities'),
  h3('4.2.7 Defect Severity Classification'),
  table(['Severity', 'Meaning', 'Effect on acceptance'], [
    ['Critical', 'Breaks a business rule or corrupts data; no workaround', 'System cannot be accepted until fixed'],
    ['High', 'Major function fails, a workaround exists', 'Must be fixed before acceptance'],
    ['Medium', 'Function works but incorrectly in some cases', 'May be accepted with a fix plan'],
    ['Low', 'Cosmetic or wording issue', 'Does not block acceptance'],
  ], [15, 50, 35], { boldFirst: true }),
  caption('Table 4.4: Defect severity levels'),
  h3('4.2.8 Requirements Traceability'),
  p('Table 4.5 links each acceptance criterion to the test cases that verify it. Every criterion is covered by at least one test case, and the two criteria from the brief (AC-01 and AC-02) are covered by several.'),
  table(['Criterion', 'Verified by test cases'], Object.entries(acMap).map(([k, v]) => [k + ' ' + AC.find((a) => a[0] === k)[1], v.join(', ')]), [40, 60], { boldFirst: true }),
  caption('Table 4.5: Traceability between acceptance criteria and test cases'),

  h2('4.3 Acceptance Test Cases'),
  p('Table 4.6 lists the fifteen acceptance test cases. Each case states the criterion it verifies, its preconditions, the steps a student follows, and the expected result.'),
  table(['ID', 'AC', 'Scenario', 'Preconditions', 'Steps', 'Expected result'], TC, [9, 9, 13, 20, 26, 23], { boldFirst: true }),
  caption('Table 4.6: Acceptance test cases'),

  h2('4.4 Acceptance Test Report'),
  h3('4.4.1 Execution Summary'),
  table(['Cycle', 'Build', 'Date', 'Executed', 'Passed', 'Failed', 'Outcome'], [
    ['1', 'v1.0', '12 Oct 2026', String(n1), String(p1), String(f1), 'Rejected: DEF-01 (Critical) raised'],
    ['2', 'v1.1', '12 Oct 2026', String(n2), String(p2), String(f2), 'All criteria met'],
    ['3', 'v1.2', '12 Oct 2026', String(n3), String(p3), String(f3), 'All criteria met; regression after DEF-02 and DEF-03 fixes'],
  ], [8, 9, 15, 12, 11, 10, 35]),
  caption('Table 4.7: Summary of acceptance test cycles'),
  h3('4.4.2 Cycle 1 Results (build v1.0)'),
  table(['ID', 'Actual result', 'Status'], TC.map((t) => [t[0], R1[t[0]].actual, R1[t[0]].status]), [10, 76, 14], { status: 2, boldFirst: true }),
  caption('Table 4.8: Cycle 1 actual results'),
  p(`Fourteen of the fifteen test cases passed in Cycle 1. Every rule worked correctly when students registered one at a time: full courses, clashes, duplicates and the credit limit were all rejected with clear messages, and confirmations appeared in at most ${fmt(Math.max(...regTimes(R1)))} seconds. However, UAT-14 failed: when 50 students tried to register for the 10 remaining seats of SWC4823 at the same moment, the system confirmed and stored ${R1['UAT-14'].enrolled} students. This is the over-enrolment the brief explicitly requires the system to prevent, so it was logged as defect DEF-01.`),
  h3('4.4.3 Defect Report'),
  table(['Field', 'Details'], [
    ['Defect ID', 'DEF-01'],
    ['Title', 'Course over-enrolled when several students register for the last seats at the same time'],
    ['Found in', 'Cycle 1, build v1.0, test case UAT-14'],
    ['Criterion violated', 'AC-02 No over-enrolment (also AC-09)'],
    ['Severity', 'Critical: breaks a business rule from the brief and stores invalid data; there is no workaround for students or staff'],
    ['Steps to reproduce', '1. Start with SWC4823 at 0/10 seats.\n2. Log in 50 students.\n3. Submit all 50 registrations for SWC4823 at the same instant.\n4. Count stored enrolments for SWC4823.'],
    ['Expected result', 'Exactly 10 enrolments stored; 40 requests rejected as full.'],
    ['Actual result', `${R1['UAT-14'].enrolled} enrolments stored (capacity 10). Reproduced in 3 out of 3 runs, with 16, 12 and 11 students enrolled.`],
    ['Root cause', 'The system checks the number of free seats and then saves the enrolment as two separate steps. Requests arriving together all read the seat count before any of them saved, so several saw the same last seat as free.'],
    ['Fix', 'Build v1.1 locks the course record before checking the seat count, so registrations for the same seats are processed one after another.'],
    ['Retest', `Cycle 2, UAT-14: ${R2['UAT-14'].actual} Repeated 3 times, exactly 10 enrolled each time.`],
    ['Status', 'Closed'],
  ], [22, 78], { boldFirst: true, status: 1 }),
  caption('Table 4.9: Defect DEF-01'),
  h3('4.4.4 Cycle 2 Results (build v1.1, full regression)'),
  table(['ID', 'Actual result', 'Status'], TC.map((t) => [t[0], R2[t[0]].actual, R2[t[0]].status]), [10, 76, 14], { status: 2, boldFirst: true }),
  caption('Table 4.10: Cycle 2 actual results'),
  h3('4.4.5 Defects Found by Other Test Stages'),
  p('Two further defects were found by the functional and system test stages after Cycle 2. Both touch acceptance criteria, so they are recorded here and the acceptance suite was re-run once they were fixed.'),
  table(['ID', 'Found by', 'Problem', 'Criterion', 'Severity', 'Fix (v1.2) and status'], [
    ['DEF-02', 'FT-31 (functional, error guessing)', 'Logout cleared the browser cookie but did not end the session on the server, so a copied cookie still opened the student\'s timetable.', 'AC-03', 'Medium', 'Logout now deletes the session on the server. FT-31 passes. Closed.'],
    ['DEF-03', 'ST-06, ST-07 (system, load)', 'When 40 or more requests arrived at exactly the same instant, a few connections were refused because the server queued only 5 waiting connections.', 'AC-09', 'High', 'Connection queue raised to 128. 60 of 60 confirmed in ST-07. Closed.'],
  ], [9, 15, 32, 9, 9, 26], { boldFirst: true }),
  caption('Table 4.11: Defects DEF-02 and DEF-03'),
  p('UAT-13 and UAT-15 passed on v1.1 because they do not test these exact cases: UAT-13 checks that the browser is sent back to the login page, and UAT-15 sends its 50 requests from one process, which spreads the connections slightly. This shows the value of testing at several levels.'),
  h3('4.4.6 Cycle 3 Results (build v1.2, full regression)'),
  table(['ID', 'Actual result', 'Status'], TC.map((t) => [t[0], R3[t[0]].actual, R3[t[0]].status]), [10, 76, 14], { status: 2, boldFirst: true }),
  caption('Table 4.12: Cycle 3 actual results'),
  h3('4.4.7 Acceptance Criteria Status'),
  table(['Criterion', 'Evidence', 'Cycle 1', 'Cycle 2', 'Cycle 3'], AC.map((a) => [`${a[0]} ${a[1]}`, acMap[a[0]].join(', '), statusOf(R1, acMap[a[0]]), statusOf(R2, acMap[a[0]]), statusOf(R3, acMap[a[0]])]), [31, 33, 12, 12, 12], { status: 3, boldFirst: true }),
  caption('Table 4.13: Acceptance criteria status after each cycle'),
  h3('4.4.8 Analysis of Results'),
  bullet([b('Response time comfortably meets the 5-second target. '), `A single registration was confirmed in at most ${fmt(maxSingle2)} s in Cycle 2. With 50 students registering at once, the slowest response was ${fmt(R2['UAT-15'].maxSeconds)} s on v1.1 and ${fmt(R3['UAT-15'].maxSeconds)} s on v1.2, well under 5 s. The DEF-03 fix also made responses under load faster.`]),
  bullet([b('Business rules hold for individual students. '), 'Capacity, clash, credit-limit and duplicate rules were all enforced with clear messages that tell the student why the registration was refused.']),
  bullet([b('Concurrency was the real risk. '), 'The only defect appeared when students competed for the same seats at the same time, a situation that occurs on registration day and cannot be found by testing one student at a time. This shows why the acceptance plan included a simultaneous-registration test even though the functional tests had already passed.']),
  bullet([b('The fixes did not introduce regressions. '), 'All 15 test cases passed when the full suite was re-run on v1.1 and again on v1.2.']),
  h3('4.4.9 Acceptance Decision'),
  p([b('Cycle 1 (v1.0): REJECTED. '), 'Build v1.0 could not be accepted because DEF-01 breaks acceptance criterion AC-02, one of the two criteria set by the brief.']),
  p([b('Final decision (v1.2): ACCEPTED. '), 'Build v1.2 meets all nine acceptance criteria, all 15 acceptance test cases pass in Cycle 3, and all three defects found across the project (DEF-01, DEF-02 and DEF-03) are closed. UniReg v1.2 is therefore accepted for delivery, with the following recommendations:']),
  bullet('Repeat UAT-14 and UAT-15 with a larger number of students (for example 500) on the real server before the first registration day, since only up to 60 simultaneous users were tested.'),
  bullet('Include the over-enrolment race test (UAT-14) permanently in the regression suite so that DEF-01 cannot return unnoticed.'),
  bullet('Carry out a short usability session with real students, since this cycle confirmed behaviour and timing but not ease of use.'),
  gap(),
  table(['Prepared by', 'Role', 'Signature', 'Date'], [['Yasierul', 'Acceptance test lead', '', '12 October 2026']], [30, 30, 20, 20]),

  new Paragraph({ children: [new PageBreak()] }),
  h2('4.5 Test Evidence'),
  p('The screenshots below were captured automatically during Cycle 3 (build v1.2) at the moment each expected result was checked. Screenshots and raw result files for all three cycles are kept with the test scripts.'),
  ...figure(path.join(EV, 'cycle3_v1.2/screenshots/UAT-03.png'), 'Figure 4.1: UAT-03 account locked after three failed login attempts'),
  ...figure(path.join(EV, 'cycle3_v1.2/screenshots/UAT-04.png'), 'Figure 4.2: UAT-04 registration confirmation with reference number'),
  ...figure(path.join(EV, 'cycle3_v1.2/screenshots/UAT-05.png'), 'Figure 4.3: UAT-05 registration for a full course rejected'),
  ...figure(path.join(EV, 'cycle3_v1.2/screenshots/UAT-08.png'), 'Figure 4.4: UAT-08 timetable clash detected'),
  ...figure(path.join(EV, 'cycle3_v1.2/screenshots/UAT-09.png'), 'Figure 4.5: UAT-09 credit limit enforced'),
  ...figure(path.join(EV, 'cycle3_v1.2/screenshots/UAT-10.png'), 'Figure 4.6: UAT-10 timetable showing 6 courses and 20 credits'),
  ...figure(path.join(EV, 'cycle3_v1.2/screenshots/UAT-11.png'), 'Figure 4.7: UAT-11 course dropped and seat released'),
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
