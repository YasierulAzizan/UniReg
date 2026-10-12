# Introduction and Conclusion (shared group task, draft)

The breakdown says to write these together once all sections are done. Here is a starting draft based on what was actually built and tested. It's already in the report template. Edit it as a group.

## 1. Introduction

### 1.1 System background

UniReg is a web-based Student Course Registration System. Students log in with their student ID and password, view the courses on offer with their schedule and remaining seats, register for or drop courses, and view their weekly timetable. The system enforces four business rules: a maximum of 20 credit hours per student, no timetable clashes, no registration beyond a course's capacity, and an account lock after three failed logins.

### 1.2 Objective and scope

This report applies the software testing process to UniReg in three stages: functional testing of each feature, system test design covering robustness, performance, interoperability and scalability, and acceptance testing against measurable criteria with a final accept/reject decision. Admin functions, payment and real university infrastructure are out of scope.

### 1.3 Test environment

So that every test could be executed and actual results recorded, the group built a working UniReg prototype (Python 3 web server with an SQLite database) with 60 student accounts and 9 courses. Tests were automated with Python scripts and Playwright browser automation and run on a laptop; each test starts a fresh copy of the system with a clean database so results are repeatable. Three builds were tested: v1.0 (original), v1.1 and v1.2 (after defect fixes). The source code and all test scripts are at https://github.com/YasierulAzizan/UniReg.

## 6. Conclusion

The group designed and executed 58 test cases across three stages (32 functional, 11 system, 15 acceptance). Testing found three defects. The most serious, over-enrolment when many students register for the last seats at once (DEF-01), was found in acceptance testing and fixed in build v1.1. System testing found that the server sometimes refused a few connections when 40 or more students submitted at exactly the same moment (DEF-03), and error guessing found that logout did not end the session on the server (DEF-02). Both were fixed in v1.2, and every suite was re-run with no failures.

UniReg v1.2 meets all nine acceptance criteria, answers 95% of registrations in under a second even with 60 simultaneous students, and was accepted. The project showed that each testing level catches different problems: single-user functional tests confirmed the business rules, while only concurrent tests exposed the defects that would matter most on registration day.
