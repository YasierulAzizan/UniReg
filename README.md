# UniReg: Student Course Registration System

The system under test for our SWC4263 / SWC4603 Software Testing and Quality Assurance group project (Project 5, UniReg).

Students log in, view courses, register for and drop courses, and view their timetable.

## Who does what

Each member has a folder with their materials, a script that runs their tests, real results, and a README with **steps** and **suggestions for full marks**. Start with your own folder's README.

| Folder | Member | Section (marks) | Results so far |
|---|---|---|---|
| [1-functional-testing](1-functional-testing/) | Amir | Functional Testing (25) | 32 / 32 on v1.2 (DEF-02 found on v1.1, fixed) |
| [2-system-test-design](2-system-test-design/) | Ramzi | System Test Design (25) | 7 / 7 + 2 / 2 browsers on v1.2 (DEF-03 found on v1.1, fixed) |
| [3-acceptance-testing](3-acceptance-testing/) | Yasierul | Acceptance Testing (25) | v1.0 14 / 15 (DEF-01), v1.1 and v1.2 15 / 15. Accepted |
| [4-report-and-presentation](4-report-and-presentation/) | Aliff | Results Analysis, Report and Presentation (25) | Report template, analysis draft, charts, presentation plan |
| Introduction and Conclusion | Everyone | Shared | Draft in [4-report-and-presentation/intro-and-conclusion-draft.md](4-report-and-presentation/intro-and-conclusion-draft.md) |

## Run the app

Needs Python 3 only, no installs.

```bash
python3 app.py          # then open http://localhost:8000
```

On a Mac you can instead double-click **Start UniReg.command**. On Windows, use `python app.py`.

- Logins: student IDs **S001** to **S060**, password **Pass@123**
- The database resets every time the app starts.
- Human Computer Interaction (SWC4413) starts full (30/30). Final Year Project Seminar (SWC4823) has only 10 seats.

## Run the tests

All commands run from this top folder. Each script starts its own copy of UniReg, so you don't need the app running.

| Suite | Command | Needs |
|---|---|---|
| Functional (FT-01 to FT-32) | `python3 1-functional-testing/functional_test.py` | Python 3 |
| System (ST-01 to ST-07) | `python3 2-system-test-design/system_test.py` | Python 3 |
| Interoperability (ST-08 to ST-11) | `node 2-system-test-design/interop.js` | Node.js + Playwright |
| Acceptance (UAT-01 to UAT-15) | `node 3-acceptance-testing/acceptance.js` | Node.js + Playwright |

Add `app_v1_0.py` or `app_v1_1.py` (Python scripts), or `UNIREG_APP=app_v1_1.py` (Node scripts), to test an older build. Install Playwright once with:

```bash
npm install playwright && npx playwright install chromium firefox webkit
```

## Business rules

| Rule | Value |
|---|---|
| Maximum credit hours per student | 20 |
| Timetable clashes | Not allowed |
| Course capacity | Per course (10 to 40 seats) |
| Failed logins before lockout | 3 |

## Versions and defects

| File | Build | Notes |
|---|---|---|
| `app.py` | **v1.2** (current) | All known defects fixed |
| `app_v1_1.py` | v1.1 | DEF-01 fixed; still has DEF-02 and DEF-03. Kept for before/after comparison |
| `app_v1_0.py` | v1.0 | Original build with DEF-01 |

| ID | Found by | Problem | Severity | Status |
|---|---|---|---|---|
| DEF-01 | Acceptance (UAT-14), System (ST-02 on v1.0) | Many students registering for the last seats at once over-enrolled the course | Critical | Fixed in v1.1, re-tested |
| DEF-02 | Functional (FT-31) | Logout didn't end the session on the server; an old cookie still worked | Medium | Fixed in v1.2, re-tested |
| DEF-03 | System (ST-06, ST-07) | 40+ requests at exactly the same instant: a few connections were sometimes refused | High | Fixed in v1.2, re-tested |

`tools/unireg_client.py` is a small helper the Python test scripts share (starts the app, logs in, registers).
