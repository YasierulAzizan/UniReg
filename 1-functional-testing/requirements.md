# Functional requirements

Each requirement has a clear input and an expected output, so it can be tested.

| ID | Area | Requirement | Input | Expected output | Tested by |
|---|---|---|---|---|---|
| FR-01 | Login | A student with a valid ID and password can log in. IDs are not case-sensitive. | S001 / Pass@123 | Available Courses page | FT-01, FT-29 |
| FR-02 | Login | Wrong or unknown credentials are rejected and the remaining attempts are shown. | S002 / wrong | "Invalid student ID or password. 2 attempt(s) left." | FT-02 to FT-04, FT-25 |
| FR-03 | Login | An empty student ID or password is rejected. | blank field | "Student ID and password are required." | FT-05, FT-06 |
| FR-04 | Login | The account locks after 3 failed attempts in a row. | 3 wrong passwords | "Account locked after 3 failed attempts." | FT-10, FT-11 |
| FR-05 | Courses | The course list shows code, name, credits, schedule, venue and seats taken / capacity. | open Courses | 9 courses with all 6 columns | FT-09 |
| FR-06 | Register | Registering for an open course confirms it with a reference number and takes one seat. | Register SWC4263 | "Registration confirmed ... Reference: REG-XXXXXXXX" | FT-07, FT-17, FT-26 |
| FR-07 | Register | A full course cannot be registered. | Register SWC4413 (30/30) | "... is full ... Registration rejected." | FT-08, FT-12, FT-13 |
| FR-08 | Register | A course that overlaps a registered class is rejected and the clashing course is named. | SWC4113 while holding SWC4263 | "Timetable clash with SWC4263 ..." | FT-21 |
| FR-09 | Register | Total credits cannot go above 20. | 19 credits + 4 | "Credit limit exceeded ..." | FT-14, FT-15 |
| FR-10 | Register | A student cannot register for the same course twice. | Register SWC4263 again | "You are already registered for SWC4263." | FT-22 |
| FR-11 | Drop | Dropping a course removes it from the timetable and frees its seat. | Drop SWC4263 | "SWC4263 dropped. Your seat has been released." | FT-23, FT-28 |
| FR-12 | Timetable | The timetable lists registered courses from Monday to Friday by start time, with total credits. | open My Timetable | sorted rows, "Total credits: N / 20" | FT-16, FT-24 |
| FR-13 | Session | Pages need a login. Logging out ends the session. | open a page after logout | login page | FT-27, FT-30, FT-31 |

Pairwise (FT-17 to FT-20) and random testing (FT-32) cover FR-06 to FR-11 together.
