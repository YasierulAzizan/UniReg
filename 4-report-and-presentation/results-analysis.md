# Consolidated results and analysis (draft)

A draft of the combined results section, written from the actual runs in this repo. Edit the wording, then paste it into the report as section 5. It's already in [UniReg_Report_Template.docx](UniReg_Report_Template.docx).

## 5.1 Summary of execution

| Stage | Owner | Cases | Before fixes | Final build v1.2 |
|---|---|---|---|---|
| Functional Testing | Amir | 32 (FT-01 to FT-32) | 31 / 32 on v1.1 (DEF-02) | 32 / 32 |
| System Testing | Ramzi | 7 (ST-01 to ST-07) | 5 / 7 on v1.1 (DEF-03) | 7 / 7 |
| Interoperability | Ramzi | 4 (ST-08 to ST-11) | 2 / 2 run | 2 / 2 run, 2 not run (Firefox, Safari not installed) |
| Acceptance Testing | Yasierul | 15 (UAT-01 to UAT-15) | 14 / 15 on v1.0 (DEF-01); 15 / 15 on v1.1 | 15 / 15 |

![Results by stage](charts/results-by-stage.png)

## 5.2 Defects found

| ID | Found by | Description | Severity | Fixed in | Re-test |
|---|---|---|---|---|---|
| DEF-01 | UAT-14 (also ST-02 on v1.0) | When 50 students registered for the last 10 seats at the same moment, 15 to 24 were enrolled. | Critical | v1.1: database lock around the seat check and insert | UAT-14, ST-02 pass |
| DEF-02 | FT-31 | Logout cleared the browser cookie but didn't end the session on the server, so a copied cookie still opened the student's timetable. | Medium | v1.2: logout deletes the session on the server | FT-31 passes |
| DEF-03 | ST-06, ST-07 | When 40 or more requests arrived at exactly the same instant, a few connections were sometimes refused, because the server only queued 5 waiting connections. | High | v1.2: connection queue raised to 128 | ST-06, ST-07 pass; 60 / 60 confirmed |

## 5.3 Analysis

**Each stage found something the others couldn't.** Functional testing checks one student at a time, so it confirmed every business rule (credits, clashes, capacity, duplicates) but couldn't see DEF-01, which only appears when requests overlap. Acceptance testing simulated registration day and caught DEF-01. System testing pushed harder, with requests released at exactly the same instant, and found DEF-03, a limit in the web server rather than in UniReg's own logic. Error guessing found DEF-02, a security gap that no requirement-based test would have looked for. Using several techniques and levels was worth it.

**The core rules are sound.** Across 32 functional cases, a 300-action random run and the concurrent robustness tests, no student ever exceeded 20 credits, held clashing courses, or got a seat in a full course after v1.1. The fix for DEF-01 held in every run of ST-02 and UAT-14.

**Performance is well inside the target.** A single registration takes a few milliseconds. On v1.2, with 50 students at once, the 95th-percentile response was 0.46 s, against the brief's 5-second limit. Fixing DEF-03 also made responses faster under load (from 1.12 s to 0.46 s at 50 students), because refused connections no longer had to be retried by the operating system.

![Scalability](charts/scalability.png)

**Readiness.** UniReg v1.2 passes every executed test in all three stages, meets all nine acceptance criteria, and all three defects found during the project are fixed and re-tested. It is ready for release, subject to the limitations below.

**Limitations.** Tests ran on one laptop, so network delay wasn't measured and a production server would be larger. Firefox and Safari weren't installed on the test machine (ST-09, ST-10 not run). The prototype has no admin side, so staff functions weren't tested.

## 5.4 Traceability (brief focus areas to test cases)

| Brief requirement | Functional | System | Acceptance | Result on v1.2 |
|---|---|---|---|---|
| Course registration | FT-07, FT-17 to FT-20 | ST-01 | UAT-04 | Pass |
| Drop course | FT-23, FT-28 | ST-01 | UAT-11, UAT-12 | Pass |
| Timetable generation | FT-16, FT-24 | ST-01 | UAT-10 | Pass |
| Max enrolment (robustness) | FT-12, FT-13 | ST-02 | UAT-05, UAT-06, UAT-14 | Pass (DEF-01 fixed) |
| Many students at once (performance) | n/a | ST-06, ST-07 | UAT-15 | Pass (DEF-03 fixed) |
| Confirmation < 5 s | FT-07 | ST-05, ST-06 | UAT-04, UAT-15 | Pass |
| Secure login / logout | FT-01 to FT-06, FT-10, FT-11, FT-27, FT-30, FT-31 | n/a | UAT-01 to UAT-03, UAT-13 | Pass (DEF-02 fixed) |
