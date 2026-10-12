# 1. Functional Testing (Amir, 25 marks)

Checks that each UniReg feature does what it should: login, view courses, register, drop and view timetable.

## What's in this folder

| File | What it is | Rubric item |
|---|---|---|
| [requirements.md](requirements.md) | 13 testable functional requirements (FR-01 to FR-13) | Requirements Identification (5) |
| [test-cases.md](test-cases.md) | 32 test cases labelled by technique: EP, BVA, pairwise, error guessing, random | Test Case Design (10) |
| [functional_test.py](functional_test.py) | Runs all 32 cases automatically | Test Execution (10) |
| [results/functional_results.md](results/functional_results.md) | Execution log: expected vs actual, PASS/FAIL | Test Execution & Documentation (10) |

## Results so far

**31 / 32 passed** on build v1.1. One real defect was found:

| ID | Found by | Problem | Suggested severity |
|---|---|---|---|
| DEF-02 | FT-31 (error guessing) | After logout, the old session cookie still works. Logout only clears the cookie in the browser and doesn't end the session on the server. Anyone who copied the cookie (for example on a shared lab PC) can still open the student's timetable. | Medium |

Suggested fix for the report: on `/logout`, remove the session token from `SESSIONS` before redirecting. Then re-run the suite to show FT-31 passing.

## Steps

1. **Run the app once and click around** to understand each feature.
   `python3 app.py`, then open http://localhost:8000 and log in with S001 / Pass@123.
2. **Read [requirements.md](requirements.md).** Reword the requirements in your own words for the report if you like, but keep the FR IDs.
3. **Read [test-cases.md](test-cases.md).** For the report, put the summary table and one sample of each technique in the main text, and the full list in an appendix.
4. **Run the tests** from the repo's top folder:
   ```bash
   python3 1-functional-testing/functional_test.py
   ```
   It takes about a minute and writes `results/functional_results.md` and `.csv`. Open the CSV in Excel to build your results table.
5. **Write up DEF-02.** Include the ID, steps to reproduce, expected vs actual result, severity, and the suggested fix.
6. **Optional, but it earns marks:** run the original build too (`python3 1-functional-testing/functional_test.py app_v1_0.py`). It gives the same 31 / 32, because DEF-01 (over-enrolment) only appears when many students register at the same moment, which a one-at-a-time functional test can't trigger. That links your section to Ramzi's and Yasierul's.
7. **Send Aliff** your section and the results table.

## Suggestions for full marks

- **Label the technique on every test case.** The rubric's "correct techniques (BVA, EP, etc.)" means the marker wants to see which technique each case uses.
- **Explain your partitions** in one or two sentences, for example: student ID classes are valid / non-existent / wrong format / empty.
- **Show boundaries as a small table** (the one in test-cases.md): below, on and above each limit. Mention why 21 and 22 credits cannot be reached.
- **Explain pairwise:** 3 factors × 2 values would need 8 full combinations, but 4 runs cover every pair.
- **For random testing, give the seed (42)** so the run can be repeated, and say what was checked afterwards (capacity, credits, clashes).
- **Keep test IDs as FT-xx** so they don't clash with Ramzi's ST-xx or Yasierul's UAT-xx.
- **Include a screenshot or two** of the app for the FAIL case and one PASS case. Use `python3 app.py` and your browser.
