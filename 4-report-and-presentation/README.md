# 4. Results Analysis, Report and Presentation (Aliff, 25 marks)

Ties the three testing stages together, compiles the final report and coordinates the recorded presentation.

## What's in this folder

| File | What it is | Rubric item |
|---|---|---|
| [UniReg_Report_Template.docx](UniReg_Report_Template.docx) | The report, ready to fill: ISO-style cover, contents page, Arial 11 justified, every section in order. Introduction, Results & Analysis and Conclusion are already drafted. Red text marks what still needs filling in. | Report Structure & Format (5) |
| [results-analysis.md](results-analysis.md) | Draft of section 5: execution summary, defects table, analysis, traceability | Results & Analysis (5) |
| [charts/](charts/) | Results-by-stage chart and scalability chart, ready for the report and slides | Results & Analysis (5) |
| [intro-and-conclusion-draft.md](intro-and-conclusion-draft.md) | Draft Introduction and Conclusion for the group session | Shared task |
| [presentation-plan.md](presentation-plan.md) | Slide order, speaker per slide, timing (≈12 min), recording tips | Presentation Delivery (10) |
| [build/make_template.js](build/make_template.js) | Script that rebuilds the template if you change the numbers | |

## Report checklist (from the brief)

- [ ] Cover page in ISO format. The template has a standard layout; if the faculty gives an official ISO cover form, use that instead.
- [ ] Arial, size 11, justified, everywhere (including text pasted from members; use Paste > Keep Text Only, then reapply).
- [ ] Sections in this order: 1 Introduction, 2 Functional Testing, 3 System Test Design, 4 Acceptance Testing, 5 Results and Analysis, 6 Conclusion, References, Appendices.
- [ ] Table and figure captions numbered by section (Table 2.1, Figure 3.1, ...).
- [ ] Test IDs consistent: FR / FT-xx (Amir), NFR / ST-xx (Ramzi), AC / UAT-xx (Yasierul), DEF-xx for defects across all sections.
- [ ] Contents page updated (right-click > Update Field) as the last step before saving the PDF.
- [ ] Saved as PDF and named per the brief: all members' names, then section and assessment, e.g. `AMIR, RAMZI, YASIERUL, ALIFF_PROJECT_SECTION1.pdf` (use full names and your real section number).
- [ ] Submitted to **both** Google Classroom and LMS.

## Steps

1. **Collect the sections.** Amir: [1-functional-testing](../1-functional-testing/). Ramzi: [2-system-test-design](../2-system-test-design/). Yasierul: [3-acceptance-testing/docs](../3-acceptance-testing/docs/) (SHORT docx). Each folder's README says what goes in the report.
2. **Paste each section** into [UniReg_Report_Template.docx](UniReg_Report_Template.docx) where the red placeholders are, then delete the placeholders.
3. **Settle the open defects with the group.** DEF-02 and DEF-03 are still open. Either fix them in a v1.2 and re-run all suites, or keep them open and change the acceptance decision to "Accepted with conditions". Then update every paragraph marked ✱ in [results-analysis.md](results-analysis.md) (red text in the template).
4. **Hold the Introduction and Conclusion session.** Start from [intro-and-conclusion-draft.md](intro-and-conclusion-draft.md) (already in the template) and agree the final wording together.
5. **Proofread and standardise:** names of tests, defect IDs, build names (v1.0 / v1.1), units (s, ms), tense (past tense for what was done).
6. **Build the slides** from [presentation-plan.md](presentation-plan.md). Use the two charts on the results slide.
7. **Record** the presentation (10 to 15 minutes), export to PDF and MP4, and submit.

## Suggestions for full marks

- **Analyse, don't list.** The rubric's "insightful interpretation" means explaining *why* results came out as they did. The key insight: each stage found a defect the others couldn't (functional is one user at a time; only concurrent tests found DEF-01 and DEF-03).
- **One summary table and one chart** at the top of section 5 give the marker the whole picture in 10 seconds.
- **State readiness clearly:** "UniReg v1.1 is ready for release once DEF-02 and DEF-03 are fixed" (or "ready", if they're fixed).
- **Mention limitations** (one laptop, two browsers not run, no admin side). It shows judgement.
- **Keep the report consistent.** The rubric's "follows template" mark is lost on mixed fonts, different table styles and changing ID formats, more than on content.
- **Time the presentation.** The 10 delivery marks depend on staying within 10 to 15 minutes; rehearse once with a timer.
