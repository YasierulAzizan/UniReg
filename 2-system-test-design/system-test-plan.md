# System test plan: UniReg

## 1. Purpose and scope

Test UniReg as a whole running system, beyond single features: how it behaves end to end, under bad input, under many simultaneous students, as the number of users grows, and in different browsers. Single-feature checks are covered by Functional Testing (FT-xx); the user's accept/reject decision is in Acceptance Testing (UAT-xx).

**In scope:** login, view courses, register, drop, timetable, session handling, concurrency, response time, browsers and phone screens.
**Out of scope:** real university servers, payment, admin pages, security penetration testing.

## 2. Approach

| Category | Brief requirement | Method | Tool |
|---|---|---|---|
| Functional (end to end) | System test cases | One student's complete journey through the system | `system_test.py` |
| Robustness | "max enrolment" | Simultaneous requests for the last seats; clashing requests at once; malformed requests | `system_test.py` (threads released together by a barrier) |
| Performance | "many students registering at once" | Time every request for 1 user and for 50 simultaneous users | `system_test.py` |
| Scalability | Scalability test cases | Repeat the 50-user test at 10, 20, 40 and 60 users and compare | `system_test.py` |
| Interoperability | Interoperability test cases | Same journey in 3 browser engines and on a phone-size screen | `interop.js` (Playwright) |

## 3. Environment

| Item | Value |
|---|---|
| System under test | UniReg prototype `app.py` (build v1.2, current); `app_v1_1.py` and `app_v1_0.py` for before/after comparison |
| Server | Python 3 built-in web server (ThreadingHTTPServer) with SQLite |
| Client machine | The same laptop as the server (local network, so network delay is not measured) |
| Test data | Students S001 to S060 (password Pass@123); 9 courses; SWC4413 starts full (30/30); SWC4823 has 10 seats |
| Reset | Every test case starts its own UniReg with a clean database |

## 4. Entry and exit criteria

**Entry:** Functional Testing has been run and its defects are logged; the app starts and S001 can log in.
**Exit:** all 11 cases executed (or marked NOT RUN with a reason); every FAIL is logged as a defect with severity; Critical and High defects are fixed and re-tested, or the risk is accepted in the report.

## 5. Test cases

| ID | Category | NFR | Test | Steps / input | Expected result |
|---|---|---|---|---|---|
| ST-01 | Functional | NFR-01 | Full student journey | S001 logs in, registers SWC4263, SWC4213, SWC4323, views timetable, drops SWC4213, logs out, opens Courses | 3 confirmed; timetable 3 rows, 10 credits; after drop 2 rows, 7 credits; after logout redirected to login |
| ST-02 | Robustness | NFR-03 | Max enrolment race | 50 logged-in students press Register for SWC4823 (10 seats) at the same instant; repeat 3 times | Exactly 10 enrolled every run |
| ST-03 | Robustness | NFR-03 | Clashes under concurrency | 30 students holding SWC4263 (Mon 09-11) all register SWC4113 (Mon 10-12) at once | 0 clashing enrolments stored |
| ST-04 | Robustness | NFR-04 | Bad and malformed requests | Register with no course code; 10 KB student ID; broken form encoding; unknown page `/admin` | Normal page or 404 for each; server still running |
| ST-05 | Performance | NFR-01 | Single-user response time | 20 × Courses, 20 × Timetable, 5 registrations | Every response under 2 s |
| ST-06 | Performance | NFR-02 | 50 simultaneous registrations | 50 logged-in students register for open courses at the same instant | All 50 confirmed; p95 under 5 s |
| ST-07 | Scalability | NFR-05 | Growing load | Repeat ST-06 with 10, 20, 40 and 60 students | Every level: all confirmed, p95 under 5 s |
| ST-08 | Interoperability | NFR-06 | Chromium (Chrome, Edge) | Login, register SWC4263, timetable, drop at 1280×800 | All 4 steps work |
| ST-09 | Interoperability | NFR-06 | Firefox | Same journey | All 4 steps work |
| ST-10 | Interoperability | NFR-06 | WebKit (Safari) | Same journey | All 4 steps work |
| ST-11 | Interoperability | NFR-06 | Phone (iPhone 13 screen) | Same journey on a 390×844 touch screen | All 4 steps work; no sideways scrolling |

## 6. Defect severity scale

| Severity | Meaning |
|---|---|
| Critical | Breaks a rule from the brief (e.g. over-enrolment) or loses data |
| High | A main task fails for some users with no workaround |
| Medium | A task fails or is insecure, but there is a workaround or low likelihood |
| Low | Cosmetic or minor inconvenience |

## 7. Schedule and responsibilities

| Activity | Who | When |
|---|---|---|
| Design factors, NFRs and cases | Ramzi | Week 10 |
| Execute and log results | Ramzi | Week 11 |
| Fix defects | Group (developer role) | Week 11 |
| Re-test and hand results to Aliff | Ramzi | Week 11 |

Replace the weeks with your real dates in the report.
