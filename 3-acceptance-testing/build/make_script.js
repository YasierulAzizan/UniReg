const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle, Footer, PageNumber } = require('docx');
const FONT = 'Arial';
const say = (t) => new Paragraph({ spacing: { after: 160, line: 320 }, alignment: AlignmentType.LEFT, children: [new TextRun({ text: t, size: 26 })] });
const cue = (t) => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: t, italics: true, size: 22, color: '7B3FA0' })] });
const page = (n, title, time, show) => [
  new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 320, after: 80 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'C27AE3', space: 4 } },
    children: [new TextRun(`${n}  ${title}`), new TextRun({ text: `   (${time})`, bold: false, size: 22, color: '6B6478' })] }),
  cue(show),
];
const children = [
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Presentation Script: Acceptance Testing')] }),
  new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: 'Yasierul · UniReg · SWC4263 / SWC4603 · about 4 minutes at a calm pace', size: 22, color: '6B6478' })] }),
  cue('Purple lines in italics are notes for you, not things to say. Speak slowly and pause briefly between slides.'),

  ...page('Intro', 'Opening my part', '25 sec', 'Show: Slide 1 (Acceptance Criteria). Say this right after Ramzi hands over to you.'),
  say('Thank you, Ramzi. Assalamualaikum and good day, everyone. My name is Yasierul, and I am responsible for the third stage of our testing process, which is Acceptance Testing.'),
  say('Functional and system testing check whether UniReg works as designed. Acceptance testing asks a different question: is UniReg good enough for students to actually use, and should we accept it for delivery? I will cover four things: our acceptance criteria, our test plan, the results, and our final decision.'),

  ...page('Page 1', 'Acceptance Criteria', '40 sec', 'Show: the criteria table. Point at the three bold rows.'),
  say('First, we defined nine acceptance criteria. Three of them come directly from the project brief, shown in bold.'),
  say('Registration must be confirmed within five seconds. A course must never be over-enrolled. And the system must still respond within five seconds when fifty students register at the same time.'),
  say('The other six criteria cover the student\'s main tasks: logging in, dropping a course, viewing the timetable, blocking timetable clashes, the twenty-credit limit, and duplicate registration. Every criterion is measurable, so each one is simply met or not met.'),

  ...page('Page 2', 'Acceptance Test Plan', '40 sec', 'Show: the three purple cards, then the table.'),
  say('For our approach, we used black-box user acceptance testing. This means we tested the system as a student would use it, without looking at the code.'),
  say('We automated the browser steps with a tool called Playwright, so we could time every registration exactly. We also wrote a script that makes fifty students register at the same moment.'),
  say('We planned two test cycles. If any test fails, the defect is fixed and every test is run again. We wrote fifteen test cases in total, and here are five of them. Please remember the last one, UAT-14, where fifty students race for ten seats.'),

  ...page('Page 3', 'Acceptance Report', '25 sec', 'Show: the two big numbers. Point left, then right.'),
  say('Here are the results. In Cycle 1, on version 1.0, fourteen out of fifteen tests passed. Everything worked when students registered one at a time.'),
  say('But UAT-14 failed. When fifty students tried to register for ten seats at the same moment, sixteen students were enrolled. After the fix, version 1.1 passed all fifteen tests. Later, Amir and Ramzi found two more defects, which were fixed in version 1.2, so we ran all fifteen tests a third time. They all passed again.'),

  ...page('Page 4', 'Defect Found', '45 sec', 'Show: the three cards. Go left to right: Problem, Cause, Fix.'),
  say('Let me explain this defect, DEF-01. We rated it Critical, because it breaks one of the criteria set by the brief.'),
  say('The problem: a ten-seat course accepted sixteen students. This happened every time we tried, with sixteen, twelve and eleven students enrolled.'),
  say('The cause: the system checked for a free seat and saved the enrolment as two separate steps. So when many requests arrived together, they all saw the same free seat.'),
  say('The fix: version 1.1 locks the course while it checks and saves. When we retested, exactly ten students were enrolled, three times out of three. So the defect is now closed.'),

  ...page('Page 5', 'Analysis & Acceptance Decision', '40 sec', 'Show: the three numbers on the left, then the two decision boxes on the right.'),
  say('So what do the results tell us? A single registration was confirmed in about 0.1 seconds, far inside the five-second target. Even with fifty students at once, the slowest response was only 1.5 seconds, and on version 1.2 about half a second.'),
  say('The only bug appeared when students competed for the same seats at the same moment. That is exactly what happens on registration day, so it is a good thing we tested for it.'),
  say('Our decision: version 1.0 is rejected, because it can over-enrol a course. Version 1.2 is accepted. All nine criteria are met, all fifteen tests passed, and all three defects found in the project are closed.'),

  ...page('Page 6', 'Test Evidence', '15 sec', 'Show: the two screenshots.'),
  say('Finally, here is some evidence from our tests. On the left, a registration is confirmed with a reference number. On the right, a student tries to join a full course and is clearly rejected. All screenshots were captured automatically during testing.'),

  ...page('Closing', 'Handover', '5 sec', 'Say this, then let Aliff start.'),
  say('That concludes the Acceptance Testing section. I will now hand over to Aliff, who will present the overall results and conclusion. Thank you.'),
];
const doc = new Document({
  styles: {
    default: { document: { run: { font: FONT, size: 24 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 36, bold: true, color: 'B85FD9' }, paragraph: { spacing: { after: 80 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 28, bold: true, color: '2A1F33' }, paragraph: { outlineLevel: 1 } },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, right: 1300, bottom: 1300, left: 1300 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['Acceptance Testing script  |  ', PageNumber.CURRENT], size: 18 })] })] }) },
    children,
  }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(process.argv[2], b); console.log('ok'); });
