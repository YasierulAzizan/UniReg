# 2. System Test Design (Ramzi, 25 marks)

Tests UniReg as a whole running system: end to end, under bad input, with many students at once, as users grow, and in different browsers.

## What's in this folder

| File | What it is | Rubric item |
|---|---|---|
| [test-design-factors.md](test-design-factors.md) | 8 test design factors and 6 testable requirements (NFR-01 to NFR-06), with traceability to FT and UAT | Test Design Factors & Requirements (5) |
| [system-test-plan.md](system-test-plan.md) | Scope, approach, environment, entry/exit criteria, 11 cases (ST-01 to ST-11), severity scale | System Test Plan & Cases (10) |
| [test-design-process.md](test-design-process.md) + [test-design-process.png](test-design-process.png) | Flowchart of the test design process, plus the steps as a table | Test Design Process Model (5) |
| [system_test.py](system_test.py) | Runs ST-01 to ST-07 (functional, robustness, performance, scalability) | Test execution |
| [interop.js](interop.js) | Runs ST-08 to ST-11 (browsers and phone) | Test execution |
| [results/](results/) | Execution logs (v1.1, and v1.0 for comparison) and screenshots | Documentation & Clarity (5) |

## Results so far

**System tests (build v1.1): 5 / 7 passed** ([results/system_results.md](results/system_results.md))

| Simultaneous students | Confirmed | Refused | 95th percentile |
|---|---|---|---|
| 10 | 10 | 0 | 0.12 s |
| 20 | 20 | 0 | 0.36 s |
| 40 | 40 | 0 | 1.16 s |
| 50 | 49 | 1 | 1.12 s |
| 60 | 57 | 3 | 1.12 s |

Max enrolment (ST-02) held: exactly 10 of 50 got the 10 seats, in all 3 runs. No clashes slipped through (ST-03). Bad input didn't crash the server (ST-04). Single-user pages answer in a few milliseconds (ST-05).

**Interoperability: 2 run, 2 passed** ([results/interop_results.md](results/interop_results.md)). Chromium desktop and the iPhone-size screen both work and the phone page fits the screen. Firefox and Safari (WebKit) weren't installed on the machine that ran this, so ST-09 and ST-10 show NOT RUN. Run them on your own laptop (step 5).

### Defect found: DEF-03

| Field | Detail |
|---|---|
| Found by | ST-06 and ST-07 |
| Problem | When 50 or more students press Register at exactly the same moment, a few connections are refused ("connection reset") and those students get an error page instead of a confirmation. It's intermittent: it usually starts above 40 students, but one run refused 5 of 40. |
| Cause | Python's built-in web server only queues 5 waiting connections by default (`request_queue_size = 5`). Extra connections arriving in the same instant are dropped by the operating system. |
| Suggested severity | High: breaks NFR-02 and the brief's "many students registering at once" target for some students, though they can retry. |
| Suggested fix | One line in `app.py`, before the server starts: `ThreadingHTTPServer.request_queue_size = 128`. We tried it: 50 / 50 and 60 / 60 confirmed, 95th percentile about 0.5 s. |

Why did the acceptance test UAT-15 pass with 50 / 50? It sends its 50 requests from one Node.js process, which opens the connections one after another, very quickly. `system_test.py` releases 50 separate threads at exactly the same instant, which is harsher. So DEF-03 is intermittent: it depends on how tightly the requests overlap. Say this in the report: it shows why system testing goes further than acceptance testing.

## Steps

1. **Run the app once** (`python3 app.py`, open http://localhost:8000, log in as S001 / Pass@123) so you know what you're testing.
2. **Read [test-design-factors.md](test-design-factors.md).** Use the factor table and NFR table as they are, or reword them in your own words. Keep the IDs.
3. **Put the diagram in the report.** Insert [test-design-process.png](test-design-process.png) and add one sentence for each step from the table under it. You can redraw it in draw.io or Canva if you want it in the group's colours.
4. **Run the system tests** from the repo's top folder. Python 3 only, takes about 1 minute:
   ```bash
   python3 2-system-test-design/system_test.py
   python3 2-system-test-design/system_test.py app_v1_0.py   # optional: the old build
   ```
   On the old build ST-02 fails too: 16, 15 and 24 students got the 10 seats ([results/system_results_v1.0.md](results/system_results_v1.0.md)). That's DEF-01 from Acceptance Testing. Your numbers will differ a little from the ones above because they depend on the laptop.
5. **Run the browser tests** (needs Node.js):
   ```bash
   npm install playwright
   npx playwright install chromium firefox webkit
   node 2-system-test-design/interop.js
   ```
   This fills in ST-09 and ST-10 and saves a screenshot per browser in `results/`.
6. **Write up DEF-03** using the table above: steps to reproduce, expected vs actual, severity and fix. If the group fixes it (see the suggestion below), re-run step 4 and report both runs: before the fix and after.
7. **Send Aliff** the plan, the results tables and the diagram.

## Suggestions for full marks

- **Cover all five categories by name.** The rubric checks for performance, robustness, interoperability and scalability; use those exact headings in the report.
- **Every requirement needs a number.** "Fast" isn't testable; "95% of responses under 5 s with 50 users" is. The NFR table already does this.
- **Show the scalability table as a line chart** (users vs 95th percentile). It's the clearest picture in the section. Excel can make it from the table above.
- **Explain how "at the same moment" was done:** the script logs in N students first, then releases N threads together with a barrier, so the requests really overlap.
- **Mention the limits honestly:** server and client run on one laptop, so network delay isn't measured, and a real university server would be bigger. Markers like this.
- **Link to the other sections** with the traceability table (FT ↔ ST ↔ UAT). It shows the three stages fit together.
- **Fix DEF-03 and re-test** if the group agrees. A before/after table (57 / 60 → 60 / 60) is strong evidence of a complete test cycle.
