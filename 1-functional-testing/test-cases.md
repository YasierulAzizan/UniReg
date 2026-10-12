# Functional test case design

32 test cases, grouped by technique. Every case is automated in `functional_test.py`, which runs each one on a fresh copy of UniReg.

| Technique | Cases | What it checks |
|---|---|---|
| EP | 13 (FT-01–FT-24) | One value from each valid and invalid input class |
| BVA | 7 (FT-10–FT-16) | Values on and next to the limits (3 failed logins, last seat, 20 credits, empty timetable) |
| Pairwise | 4 (FT-17–FT-20) | Every pair of capacity (open/full) × clash (no/yes) × credits (within/over) in 4 runs |
| Error guessing | 7 (FT-25–FT-31) | Inputs a careless or malicious user might try |
| Random | 1 (FT-32) | 300 random actions, then checks the rules were never broken |

## Pairwise table

| Case | Course capacity | Timetable clash | Credits after | Expected |
|---|---|---|---|---|
| FT-17 | Open | No | Within 20 | Confirmed |
| FT-18 | Open | Yes | Over 20 | Rejected |
| FT-19 | Full | No | Over 20 | Rejected |
| FT-20 | Full | Yes | Within 20 | Rejected |

## Boundary values

| Factor | Below | On the limit | Above |
|---|---|---|---|
| Failed logins (limit 3) | 2: not locked (FT-10) | 3: locked (FT-11) | n/a |
| Seats (capacity 30) | 29 taken: accepted (FT-12) | 30 taken: rejected (FT-13) | n/a |
| Credits (max 20) | 19 (FT-15 start) | 20: accepted (FT-14) | 23: rejected (FT-15)* |
| Courses in timetable (min 0) | n/a | 0: empty message (FT-16) | 1+ (FT-24) |

*With UniReg's 3- and 4-credit courses, 21 and 22 credits cannot be reached without a clash, so 23 is the nearest value above the limit.

## All cases

| ID | Technique | Requirement | Test | Input | Expected result |
|---|---|---|---|---|---|
| FT-01 | EP | FR-01 | Login, valid ID and password | S001 / Pass@123 | Logged in, Available Courses page shown |
| FT-02 | EP | FR-02 | Login, valid ID, wrong password | S002 / wrong | Rejected: 'Invalid ... 2 attempt(s) left' |
| FT-03 | EP | FR-02 | Login, ID that does not exist | S999 / Pass@123 | Rejected: 'Invalid student ID or password' |
| FT-04 | EP | FR-02 | Login, ID in wrong format | ABC / Pass@123 | Rejected: 'Invalid student ID or password' |
| FT-05 | EP | FR-03 | Login, empty student ID | '' / Pass@123 | Rejected: 'Student ID and password are required.' |
| FT-06 | EP | FR-03 | Login, empty password | S001 / '' | Rejected: 'Student ID and password are required.' |
| FT-07 | EP | FR-06 | Register, open course | S001 registers SWC4263 (0/40) | Confirmed with REG-XXXXXXXX; seats 1/40 |
| FT-08 | EP | FR-07 | Register, full course | S001 registers SWC4413 (30/30) | Rejected as full; seats stay 30/30 |
| FT-09 | EP | FR-05 | View course list | S001 opens Courses | 9 courses, each with credits, schedule, venue, seats |
| FT-21 | EP | FR-08 | Timetable clash | S001 has SWC4263 (Mon 09-11); registers SWC4113 (Mon 10-12) | Rejected; message names SWC4263 |
| FT-22 | EP | FR-10 | Duplicate registration | S001 registers SWC4263 twice | Second attempt rejected; seats stay 1/40 |
| FT-23 | EP | FR-11 | Drop a registered course | S001 registers then drops SWC4263 | Removed from timetable; seats back to 0/40 |
| FT-24 | EP | FR-12 | Timetable order and total | S001 registers 6 courses in random order | Listed Mon to Fri by start time; total 19 |
| FT-10 | BVA | FR-04 | Failed logins = 2 (just below lock limit) | 2 wrong, then correct password | Not locked; correct password logs in |
| FT-11 | BVA | FR-04 | Failed logins = 3 (at lock limit) | 3 wrong, then correct password | Account locked; correct password refused |
| FT-12 | BVA | FR-07 | Seats = capacity - 1 (last seat) | SWC4613 at 29/30, S001 registers | Confirmed; seats 30/30 |
| FT-13 | BVA | FR-07 | Seats = capacity (course just filled) | SWC4613 at 30/30, S002 registers | Rejected as full; seats stay 30/30 |
| FT-14 | BVA | FR-09 | Credits = 20 (at maximum) | 16 credits + SWC4723 (4) | Confirmed; total 20 / 20 |
| FT-15 | BVA | FR-09 | Credits above maximum | 19 credits + SWC4723 (4) = 23 | Rejected: 'Credit limit exceeded'; total stays 19 |
| FT-16 | BVA | FR-12 | Timetable with 0 courses (minimum) | S001 opens My Timetable, nothing registered | 'No registered courses.'; total 0 / 20 |
| FT-17 | Pairwise | FR-06..09 | Open course, no clash, within credits | S001 has SWC4263; registers SWC4213 | Confirmed |
| FT-18 | Pairwise | FR-06..09 | Open course, clash, over credits | S001 has 19 credits incl. SWC4263; registers SWC4113 | Rejected |
| FT-19 | Pairwise | FR-06..09 | Full course, no clash, over credits | S001 has 19 credits; registers SWC4413 (full) | Rejected |
| FT-20 | Pairwise | FR-06..09 | Full course, clash, within credits | SWC4113 filled to 40/40; S001 has SWC4263; registers SWC4113 | Rejected |
| FT-25 | Error guessing | FR-02 | SQL injection in student ID | ' OR '1'='1 / anything | Rejected; not logged in |
| FT-26 | Error guessing | FR-06 | Register a course code that does not exist | POST code=XYZ999 | Rejected: 'Course not found.' |
| FT-27 | Error guessing | FR-13 | Open My Timetable without logging in | GET /timetable, no session | Redirected to the login page |
| FT-28 | Error guessing | FR-11 | Drop a course that is not registered | S001 drops SWC4723 | Message: 'You are not registered for SWC4723.' |
| FT-29 | Error guessing | FR-01 | Lower-case student ID | s001 / Pass@123 | Logged in (IDs are not case-sensitive) |
| FT-30 | Error guessing | FR-13 | Use the site after logout | Log out, then open Courses | Redirected to the login page |
| FT-31 | Error guessing | FR-13 | Reuse an old session cookie after logout | Copy the cookie, log out, send the old cookie again | Old cookie no longer works; redirected to login |
| FT-32 | Random | FR-06..11 | 300 random register/drop actions | Seed 42, 20 students, random courses | No course over capacity, no student over 20 credits, no clashes |
