# Functional test execution log

Build: `app.py` · Run: 2026-10-12 09:02 · **31 / 32 passed**

| ID | Technique | Req | Test | Input | Expected | Actual | Status |
|---|---|---|---|---|---|---|---|
| FT-01 | EP | FR-01 | Login, valid ID and password | S001 / Pass@123 | Logged in, Available Courses page shown | Logged in, Available Courses page shown | PASS |
| FT-02 | EP | FR-02 | Login, valid ID, wrong password | S002 / wrong | Rejected: 'Invalid ... 2 attempt(s) left' | Rejected: 'Invalid student ID or password. 2 attempt(s) left.' | PASS |
| FT-03 | EP | FR-02 | Login, ID that does not exist | S999 / Pass@123 | Rejected: 'Invalid student ID or password' | Rejected: 'Invalid student ID or password.' | PASS |
| FT-04 | EP | FR-02 | Login, ID in wrong format | ABC / Pass@123 | Rejected: 'Invalid student ID or password' | Rejected: 'Invalid student ID or password.' | PASS |
| FT-05 | EP | FR-03 | Login, empty student ID | '' / Pass@123 | Rejected: 'Student ID and password are required.' | Rejected: 'Student ID and password are required.' | PASS |
| FT-06 | EP | FR-03 | Login, empty password | S001 / '' | Rejected: 'Student ID and password are required.' | Rejected: 'Student ID and password are required.' | PASS |
| FT-07 | EP | FR-06 | Register, open course | S001 registers SWC4263 (0/40) | Confirmed with REG-XXXXXXXX; seats 1/40 | 'Registration confirmed for SWC4263 Software Testing and Qual...' in 0.01 s; seats 1/40 | PASS |
| FT-08 | EP | FR-07 | Register, full course | S001 registers SWC4413 (30/30) | Rejected as full; seats stay 30/30 | Rejected: 'SWC4413 is full (30/30). Registration rejected.'; seats 30/30 | PASS |
| FT-09 | EP | FR-05 | View course list | S001 opens Courses | 9 courses, each with credits, schedule, venue, seats | 9 courses listed with Code, Course, Credits, Schedule, Venue, Seats | PASS |
| FT-10 | BVA | FR-04 | Failed logins = 2 (just below lock limit) | 2 wrong, then correct password | Not locked; correct password logs in | Logged in after 2 failures | PASS |
| FT-11 | BVA | FR-04 | Failed logins = 3 (at lock limit) | 3 wrong, then correct password | Account locked; correct password refused | Refused: 'Account locked after 3 failed attempts. Contact the Registry.' | PASS |
| FT-12 | BVA | FR-07 | Seats = capacity - 1 (last seat) | SWC4613 at 29/30, S001 registers | Confirmed; seats 30/30 | Confirmed; seats 30/30 | PASS |
| FT-13 | BVA | FR-07 | Seats = capacity (course just filled) | SWC4613 at 30/30, S002 registers | Rejected as full; seats stay 30/30 | Rejected: 'SWC4613 is full (30/30). Registration rejected.'; seats 30/30 | PASS |
| FT-14 | BVA | FR-09 | Credits = 20 (at maximum) | 16 credits + SWC4723 (4) | Confirmed; total 20 / 20 | Confirmed; total 20 / 20 | PASS |
| FT-15 | BVA | FR-09 | Credits above maximum | 19 credits + SWC4723 (4) = 23 | Rejected: 'Credit limit exceeded'; total stays 19 | Rejected: 'Credit limit exceeded: 19 + 4 credits is more than the maximum of 20.'; total 19 | PASS |
| FT-16 | BVA | FR-12 | Timetable with 0 courses (minimum) | S001 opens My Timetable, nothing registered | 'No registered courses.'; total 0 / 20 | 0 rows, 'No registered courses.' shown; total 0 / 20 | PASS |
| FT-17 | Pairwise | FR-06..09 | Open course, no clash, within credits | S001 has SWC4263; registers SWC4213 | Confirmed | Confirmed | PASS |
| FT-18 | Pairwise | FR-06..09 | Open course, clash, over credits | S001 has 19 credits incl. SWC4263; registers SWC4113 | Rejected | Rejected: 'Credit limit exceeded: 19 + 3 credits is more than the maximum of 20.' | PASS |
| FT-19 | Pairwise | FR-06..09 | Full course, no clash, over credits | S001 has 19 credits; registers SWC4413 (full) | Rejected | Rejected: 'SWC4413 is full (30/30). Registration rejected.' | PASS |
| FT-20 | Pairwise | FR-06..09 | Full course, clash, within credits | SWC4113 filled to 40/40; S001 has SWC4263; registers SWC4113 | Rejected | Rejected: 'SWC4113 is full (40/40). Registration rejected.' | PASS |
| FT-21 | EP | FR-08 | Timetable clash | S001 has SWC4263 (Mon 09-11); registers SWC4113 (Mon 10-12) | Rejected; message names SWC4263 | Rejected: 'Timetable clash with SWC4263 (Mon 09:00-11:00).' | PASS |
| FT-22 | EP | FR-10 | Duplicate registration | S001 registers SWC4263 twice | Second attempt rejected; seats stay 1/40 | Rejected: 'You are already registered for SWC4263.'; seats 1/40 | PASS |
| FT-23 | EP | FR-11 | Drop a registered course | S001 registers then drops SWC4263 | Removed from timetable; seats back to 0/40 | 'SWC4263 dropped. Your seat has been released.' Timetable has 0 courses; seats 0/40 | PASS |
| FT-24 | EP | FR-12 | Timetable order and total | S001 registers 6 courses in random order | Listed Mon to Fri by start time; total 19 | Order: SWC4263, SWC4823, SWC4213, SWC4323, SWC4513, SWC4613; total 19 | PASS |
| FT-25 | Error guessing | FR-02 | SQL injection in student ID | ' OR '1'='1 / anything | Rejected; not logged in | Rejected: 'Invalid student ID or password.' | PASS |
| FT-26 | Error guessing | FR-06 | Register a course code that does not exist | POST code=XYZ999 | Rejected: 'Course not found.' | Rejected: 'Course not found.' | PASS |
| FT-27 | Error guessing | FR-13 | Open My Timetable without logging in | GET /timetable, no session | Redirected to the login page | Ended on /login | PASS |
| FT-28 | Error guessing | FR-11 | Drop a course that is not registered | S001 drops SWC4723 | Message: 'You are not registered for SWC4723.' | 'You are not registered for SWC4723.' | PASS |
| FT-29 | Error guessing | FR-01 | Lower-case student ID | s001 / Pass@123 | Logged in (IDs are not case-sensitive) | Logged in | PASS |
| FT-30 | Error guessing | FR-13 | Use the site after logout | Log out, then open Courses | Redirected to the login page | Ended on /login | PASS |
| FT-31 | Error guessing | FR-13 | Reuse an old session cookie after logout | Copy the cookie, log out, send the old cookie again | Old cookie no longer works; redirected to login | Old cookie still opens My Timetable after logout (session not ended on the server) | FAIL |
| FT-32 | Random | FR-06..11 | 300 random register/drop actions | Seed 42, 20 students, random courses | No course over capacity, no student over 20 credits, no clashes | 104 confirmed, 112 rejected, 84 drops. Courses over capacity: 0; students over 20 credits: 0; clashes: 0 | PASS |
