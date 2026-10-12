# 3. Acceptance Testing (Yasierul, 25 marks)

Checks UniReg from the student's point of view against measurable acceptance criteria, then decides whether to accept the build.

## What's in this folder

| File | What it is | Rubric item |
|---|---|---|
| [docs/Acceptance_Testing_UniReg_Yasierul_SHORT.docx](docs/Acceptance_Testing_UniReg_Yasierul_SHORT.docx) | **Report section to submit** (3 pages): criteria, plan, cases, results, defect, decision | All three items |
| [docs/Acceptance_Testing_UniReg_Yasierul.docx](docs/Acceptance_Testing_UniReg_Yasierul.docx) | Full version (12 pages) with roles, severity scale, traceability and screenshots. Use it for the appendix. | Extra evidence |
| [docs/Presentation_Script_Acceptance_Testing_Yasierul.docx](docs/Presentation_Script_Acceptance_Testing_Yasierul.docx) | Slide-by-slide speaking script (about 3 minutes) | Presentation |
| [build/](build/) | Scripts that rebuild the three docx files from the evidence (`node 3-acceptance-testing/build/make_short.js out.docx`, needs `npm install docx`) | |
| [acceptance.js](acceptance.js) | Runs UAT-01 to UAT-15 in a real browser, plus the 50-student load tests | Execution |
| [evidence/cycle1_v1.0/](evidence/cycle1_v1.0/) | Cycle 1 results and screenshots on the original build (14 / 15, DEF-01 found) | Report evidence |
| [evidence/cycle2_v1.1/](evidence/cycle2_v1.1/) | Cycle 2 results and screenshots after the DEF-01 fix (15 / 15) | Report evidence |
| [evidence/cycle3_v1.2/](evidence/cycle3_v1.2/) | Cycle 3 regression run after the DEF-02 and DEF-03 fixes (15 / 15) | Report evidence |

Slides: https://claude.ai/artifact/2TCBnr5cZ8QdBDanPKBreh (6 slides, purple style).

## Acceptance criteria

| ID | Criterion | Measure | Source |
|---|---|---|---|
| AC-01 | Registration confirmation | Confirmation with a reference number within 5 s | Brief |
| AC-02 | No over-enrolment | Enrolled never exceeds capacity, even with simultaneous requests | Brief |
| AC-03 | Secure access | Bad logins rejected; lock after 3 failures; logout ends access | Derived |
| AC-04 | Drop course | Course leaves the timetable and the seat is released at once | Derived |
| AC-05 | Timetable accuracy | Exactly the registered courses, correct day/time/venue and total credits | Derived |
| AC-06 | Clash prevention | Overlapping course rejected and the clash named | Derived |
| AC-07 | Credit limit | Total never above 20 credits | Derived |
| AC-08 | Duplicate prevention | Same course can't be registered twice | Derived |
| AC-09 | Performance under load | 50 students at the same moment all answered within 5 s | Brief |

## Results

| Cycle | Build | Passed | Notes |
|---|---|---|---|
| 1 | v1.0 (`app_v1_0.py`) | 14 / 15 | UAT-14 failed: 50 students raced for 10 seats and **16** were enrolled (DEF-01, Critical) |
| 2 | v1.1 (`app_v1_1.py`) | 15 / 15 | DEF-01 fixed: exactly 10 enrolled. UAT-15: 50 / 50 confirmed, slowest about 1.5 s |
| 3 | v1.2 (`app.py`) | 15 / 15 | Regression run after DEF-02 and DEF-03 (found by Amir and Ramzi) were fixed. UAT-15: 50 / 50 confirmed, slowest 0.56 s |

**Decision:** v1.0 REJECTED (breaks AC-02). v1.2 ACCEPTED: all 9 criteria met, all 15 tests pass, and all 3 defects found across the project are fixed and re-tested.

Why cycle 3? DEF-02 (logout didn't end the server session) touches AC-03, and DEF-03 (some connections refused when 40+ students submit at exactly the same instant) touches AC-09. UAT-13 and UAT-15 still passed on v1.1, because they don't test those exact cases. Functional and system testing found them. After the fixes, the whole acceptance suite was re-run as a regression check before accepting the build.

## Steps

1. **Run the app** (`python3 app.py`, open http://localhost:8000, log in as S001 / Pass@123) and try UAT-01 to UAT-13 by hand once, so you can talk about them confidently.
2. **Re-run the tests yourself** (needs Node.js), from the repo's top folder:
   ```bash
   npm install playwright && npx playwright install chromium
   UNIREG_APP=app_v1_0.py node 3-acceptance-testing/acceptance.js 3-acceptance-testing/evidence/my-cycle1   # 14/15, shows DEF-01
   node 3-acceptance-testing/acceptance.js 3-acceptance-testing/evidence/my-cycle3                         # 15/15 on v1.2
   ```
   Each run writes `results.json` and screenshots UAT-01 to UAT-12 into that folder.
3. **Send Aliff** the SHORT docx for section 4 of the report, and the full docx if the group wants appendices.
4. **Practise with the script docx**: aim for about 3 minutes.

## Suggestions for full marks

- **Every criterion needs a number or a yes/no check.** "Fast" isn't measurable; "within 5 s" is. All 9 criteria above already have one.
- **Show all three cycles.** A failed first cycle, a fix, a passing re-test and a final regression run is exactly what the rubric's "defects" and "accept/reject decision" are looking for.
- **Give the reason with the decision**, not just the word "Accepted": which criteria passed, which defect was fixed, and any conditions.
- **Use 2 or 3 screenshots in the main text** (UAT-04 confirmation, UAT-05 full course, UAT-08 clash) and put the rest in the appendix.
- **Cross-reference Ramzi's ST-02 and ST-06** where you talk about over-enrolment and load, so the stages read as one process.
