// Builds UniReg_Report_Template.docx: ISO-style cover, Arial 11 justified, all report sections in order.
//   npm install docx && node 4-report-and-presentation/build/make_template.js
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType,
  HeadingLevel, ImageRun, LevelFormat, BorderStyle, PageBreak, Footer, PageNumber, TableOfContents, VerticalAlign } = require('docx');

const HERE = path.join(__dirname, '..');
const FONT = 'Arial';
const W = 9026;
const J = AlignmentType.JUSTIFIED;
const C = AlignmentType.CENTER;

const run = (t) => (typeof t === 'string' ? new TextRun(t) : t);
const p = (t, o = {}) => new Paragraph({ alignment: o.align || J, spacing: { after: o.after ?? 120, line: 276 }, children: (Array.isArray(t) ? t : [t]).map(run) });
const b = (t) => new TextRun({ text: t, bold: true });
const todo = (t) => new TextRun({ text: `[${t}]`, color: 'B00020', italics: true });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const bullet = (t) => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, alignment: J, spacing: { after: 60 }, children: (Array.isArray(t) ? t : [t]).map(run) });
const caption = (t) => new Paragraph({ alignment: C, spacing: { before: 60, after: 200 }, children: [new TextRun({ text: t, italics: true, size: 20 })] });
const brk = () => new Paragraph({ children: [new PageBreak()] });

const border = { style: BorderStyle.SINGLE, size: 4, color: '8C9BAB' };
const borders = { top: border, bottom: border, left: border, right: border };
function table(headers, rows, widths) {
  const sum = widths.reduce((a, x) => a + x, 0);
  const ws = widths.map((x) => Math.round((x / sum) * W));
  ws[ws.length - 1] += W - ws.reduce((a, x) => a + x, 0);
  const cell = (text, i, header) => new TableCell({
    width: { size: ws[i], type: WidthType.DXA }, borders, verticalAlign: VerticalAlign.TOP,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    shading: header ? { fill: '1F3A5F', type: ShadingType.CLEAR, color: 'auto' } : undefined,
    children: [new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 40 }, children: [new TextRun({ text: String(text), size: 20, bold: header, color: header ? 'FFFFFF' : undefined })] })],
  });
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: ws,
    rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, i, true)) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, i, false)) }))] });
}
function figure(file, w, h, cap) {
  return [new Paragraph({ alignment: C, spacing: { before: 120 }, children: [new ImageRun({ type: 'png', data: fs.readFileSync(file),
    transformation: { width: w, height: h }, altText: { title: cap, description: cap, name: path.basename(file) } })] }), caption(cap)];
}
const coverLine = (t, o = {}) => new Paragraph({ alignment: C, spacing: { after: o.after ?? 120 }, children: [new TextRun({ text: t, bold: o.bold, size: o.size || 22, color: o.color })] });
const coverTodo = (t) => new Paragraph({ alignment: C, spacing: { after: 120 }, children: [todo(t)] });

const pending = (who, folder) => [p([todo(`${who}: paste your section here. Material and results are in the repo folder ${folder}. Keep test IDs and headings as they are.`)])];

// ---------------- content ----------------
const children = [
  // Cover page (replace with the faculty's official ISO cover if one is provided)
  coverTodo('University logo'),
  coverLine('', { after: 400 }),
  coverTodo('UNIVERSITY NAME'),
  coverTodo('FACULTY NAME'),
  coverLine('', { after: 400 }),
  coverLine('SWC4263 / SWC4603', { bold: true, size: 28 }),
  coverLine('SOFTWARE TESTING AND QUALITY ASSURANCE', { bold: true, size: 28, after: 400 }),
  coverLine('GROUP PROJECT', { bold: true, size: 26 }),
  coverLine('Project 5: Student Course Registration System (UniReg)', { size: 24, after: 600 }),
  table(['No.', 'Name', 'Student ID', 'Section owned'], [
    ['1', 'Amir [full name]', '[ID]', 'Functional Testing'],
    ['2', 'Ramzi [full name]', '[ID]', 'System Test Design'],
    ['3', 'Yasierul [full name]', '[ID]', 'Acceptance Testing'],
    ['4', 'Aliff [full name]', '[ID]', 'Results Analysis, Report and Presentation'],
  ], [1, 5, 3, 5]),
  coverLine('', { after: 400 }),
  new Paragraph({ alignment: C, spacing: { after: 120 }, children: [b('Section: '), todo('section number')] }),
  new Paragraph({ alignment: C, spacing: { after: 120 }, children: [b('Lecturer: '), todo('lecturer name')] }),
  new Paragraph({ alignment: C, spacing: { after: 120 }, children: [b('Submission date: '), todo('date')] }),
  brk(),

  h1('Table of Contents'),
  new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-2' }),
  p([todo('In Word: right-click the table above and choose Update Field, then Update entire table.')]),
  brk(),

  // 1. Introduction (shared)
  h1('1. Introduction'),
  h2('1.1 System Background'),
  p('UniReg is a web-based Student Course Registration System. Students log in with their student ID and password, view the courses on offer with their schedule and remaining seats, register for or drop courses, and view their weekly timetable. The system enforces four business rules: a maximum of 20 credit hours per student, no timetable clashes, no registration beyond a course\'s capacity, and an account lock after three failed logins.'),
  h2('1.2 Objective and Scope'),
  p('This report applies the software testing process to UniReg in three stages: functional testing of each feature, system test design covering robustness, performance, interoperability and scalability, and acceptance testing against measurable criteria with a final accept or reject decision. Admin functions, payment and real university infrastructure are out of scope.'),
  h2('1.3 Test Environment'),
  p('So that every test could be executed and actual results recorded, the group built a working UniReg prototype (Python 3 web server with an SQLite database) with 60 student accounts and 9 courses. Tests were automated with Python scripts and Playwright browser automation and run on a laptop. Each test starts a fresh copy of the system with a clean database so results are repeatable. The source code and all test scripts are at https://github.com/YasierulAzizan/UniReg.'),
  brk(),

  h1('2. Functional Testing'),
  h2('2.1 Requirements Identification'),
  ...pending('Amir', '1-functional-testing (requirements.md)'),
  h2('2.2 Test Case Design'),
  ...pending('Amir', '1-functional-testing (test-cases.md)'),
  h2('2.3 Test Execution and Results'),
  ...pending('Amir', '1-functional-testing/results'),
  brk(),

  h1('3. System Test Design'),
  h2('3.1 Test Design Factors and Requirements'),
  ...pending('Ramzi', '2-system-test-design (test-design-factors.md)'),
  h2('3.2 Test Design Process Model'),
  ...figure(path.join(HERE, '..', '2-system-test-design', 'test-design-process.png'), 430, 549, 'Figure 3.1: System test design process'),
  ...pending('Ramzi', '2-system-test-design (test-design-process.md)'),
  h2('3.3 System Test Plan and Test Cases'),
  ...pending('Ramzi', '2-system-test-design (system-test-plan.md, results)'),
  brk(),

  h1('4. Acceptance Testing'),
  h2('4.1 Acceptance Criteria'),
  h2('4.2 Acceptance Test Plan and Cases'),
  h2('4.3 Acceptance Test Report'),
  p([todo('Yasierul: paste sections 4.1 to 4.3 from 3-acceptance-testing/docs/Acceptance_Testing_UniReg_Yasierul_SHORT.docx and delete these three empty headings.')]),
  brk(),

  // 5. Results and analysis (Aliff)
  h1('5. Results and Analysis'),
  h2('5.1 Summary of Execution'),
  table(['Stage', 'Owner', 'Cases', 'Passed', 'Failed', 'Not run', 'Build'], [
    ['Functional Testing', 'Amir', '32', '31', '1', '0', 'v1.1'],
    ['System Testing', 'Ramzi', '7', '5', '2', '0', 'v1.1'],
    ['Interoperability', 'Ramzi', '4', '2', '0', '2', 'v1.1'],
    ['Acceptance, cycle 1', 'Yasierul', '15', '14', '1', '0', 'v1.0'],
    ['Acceptance, cycle 2', 'Yasierul', '15', '15', '0', '0', 'v1.1'],
  ], [4, 2, 1.3, 1.3, 1.3, 1.3, 1.3]),
  caption('Table 5.1: Test execution summary'),
  ...figure(path.join(HERE, 'charts', 'results-by-stage.png'), 520, 230, 'Figure 5.1: Test results by stage'),
  h2('5.2 Defects Found'),
  table(['ID', 'Found by', 'Description', 'Severity', 'Status'], [
    ['DEF-01', 'UAT-14, ST-02 (v1.0)', 'When 50 students register for the last 10 seats at the same moment, 15 to 24 are enrolled.', 'Critical', 'Fixed in v1.1, re-test passed'],
    ['DEF-02', 'FT-31', 'Logout does not end the session on the server, so a copied cookie still opens the student\'s timetable.', 'Medium', 'Open'],
    ['DEF-03', 'ST-06, ST-07', 'When 40 or more requests arrive at exactly the same instant, a few connections are sometimes refused.', 'High', 'Open'],
  ], [1.2, 2, 5, 1.3, 2]),
  caption('Table 5.2: Defects'),
  h2('5.3 Analysis'),
  p([b('Each stage found something the others could not. '), 'Functional testing checks one student at a time, so it confirmed every business rule but could not see DEF-01, which only appears when requests overlap. Acceptance testing simulated registration day and caught DEF-01. System testing released requests at exactly the same instant and found DEF-03, a limit in the web server rather than in UniReg\'s own logic. Error guessing found DEF-02, a security gap that no requirement-based test looked for.']),
  p([b('The core rules are sound. '), 'Across 32 functional cases, a 300-action random run and the concurrent robustness tests, no student exceeded 20 credits, held clashing courses, or got a seat in a full course on v1.1. The fix for DEF-01 held in all three runs of ST-02 and in UAT-14.']),
  p([b('Performance is well inside the target. '), 'A single registration takes a few milliseconds. With 50 students at once, the 95th-percentile response was about 1.1 to 1.6 seconds, well under the 5-second limit. The weakness is capacity, not speed: from about 40 truly simultaneous connections a few are sometimes refused.']),
  ...figure(path.join(HERE, 'charts', 'scalability.png'), 480, 263, 'Figure 5.2: Scalability (ST-07)'),
  p([b('Readiness. '), 'UniReg v1.1 meets all nine acceptance criteria in the acceptance run and is functionally ready. Before real registration day, DEF-03 should be fixed (a one-line server setting, verified to give 60 out of 60) and DEF-02 should be fixed (end the session on logout). ', todo('Update this paragraph if the group fixes DEF-02 and DEF-03 in v1.2.')]),
  p([b('Limitations. '), 'Tests ran on one laptop, so network delay was not measured and a production server would be larger. Firefox and Safari were not installed on the test machine (ST-09, ST-10). The prototype has no admin side, so staff functions were not tested.']),
  brk(),

  h1('6. Conclusion'),
  p('The group designed and executed 58 test cases across three stages (32 functional, 11 system and 15 acceptance). Testing found three defects. The most serious, over-enrolment when many students register for the last seats at once (DEF-01), was found in acceptance testing, fixed in build v1.1 and confirmed by re-testing. System testing found that the server sometimes refuses a few connections when 40 or more students submit at exactly the same moment (DEF-03), and error guessing found that logout does not end the session on the server (DEF-02). Both have simple, verified fixes.'),
  p('UniReg v1.1 meets all nine acceptance criteria, responds well within the 5-second target even with 50 simultaneous students, and was accepted. The project showed that each testing level catches different problems: single-user functional tests confirmed the business rules, while only concurrent tests exposed the defects that would matter most on registration day.'),
  brk(),

  h1('References'),
  p([todo('Add the lecture notes, the project brief and any tools cited (Python, SQLite, Playwright) in the required referencing style.')]),
  h1('Appendices'),
  p([todo('Appendix A: full functional test log. Appendix B: system test logs. Appendix C: full acceptance test screenshots.')]),
];

const doc = new Document({
  creator: 'UniReg group', title: 'SWC4263 Software Testing Group Project - UniReg',
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 28, bold: true, color: '1F3A5F' }, paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 24, bold: true, color: '1F3A5F' }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    ],
  },
  features: { updateFields: true },
  numbering: { config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: C, children: [new TextRun({ children: ['UniReg Software Testing Report  |  ', PageNumber.CURRENT], size: 18 })] })] }) },
    children,
  }],
});
const out = process.argv[2] || path.join(HERE, 'UniReg_Report_Template.docx');
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(out, buf); console.log('wrote', out); });
