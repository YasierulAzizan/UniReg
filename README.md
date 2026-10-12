# UniReg: Student Course Registration System

The system under test for our SWC4263 / SWC4603 Software Testing and Quality Assurance group project (Project 5, UniReg).

Students log in, view courses, register for and drop courses, and view their timetable.

## Run it

Needs Python 3 only, no installs.

```bash
python3 app.py          # then open http://localhost:8000
```

On a Mac you can instead double-click **Start UniReg.command**. On Windows, use `python app.py`.

- Logins: student IDs **S001** to **S060**, password **Pass@123**
- The database resets every time the app starts.
- Human Computer Interaction (SWC4413) starts full (30/30).

## Business rules

| Rule | Value |
|---|---|
| Maximum credit hours per student | 20 |
| Timetable clashes | Not allowed |
| Course capacity | Per course (10 to 40 seats) |
| Failed logins before lockout | 3 |

## Versions

- `app.py`: build **v1.1** (current).
- `app_v1_0.py`: build **v1.0**, the original build. It has defect **DEF-01**: when many students register for the last seats at the same moment, the course gets over-enrolled. This was found in acceptance testing and fixed in v1.1.

## Acceptance tests

`tests/acceptance.js` runs the 15 acceptance test cases (UAT-01 to UAT-15). It drives a real browser and simulates 50 students registering at the same time. You need Node.js and Playwright:

```bash
npm install playwright && npx playwright install chromium
node tests/acceptance.js evidence/                         # tests v1.1
UNIREG_APP=app_v1_0.py node tests/acceptance.js evidence/  # reproduces DEF-01 on v1.0
```

Results go to `evidence/results.json` and screenshots go to `evidence/screenshots/`.

## Who does what

| Member | Section |
|---|---|
| Amir | Functional Testing |
| Ramzi | System Test Design |
| Yasierul | Acceptance Testing |
| Aliff | Results analysis, report and presentation |
