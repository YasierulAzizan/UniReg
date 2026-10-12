# System test execution log

Build: `app.py` · Run: 2026-10-12 09:19 · **7 / 7 passed**

| ID | Category | NFR | Test | Expected | Actual | Status |
|---|---|---|---|---|---|---|
| ST-01 | Functional (end to end) | NFR-01 | Full student journey | Login, register 3, view timetable (10 credits), drop 1 (7 credits), logout | 7 of 7 steps behaved as expected | PASS |
| ST-02 | Robustness | NFR-03 | Max enrolment: 50 students race for 10 seats (3 runs) | Exactly 10 enrolled in every run | Enrolled per run: 10, 10, 10 (capacity 10) | PASS |
| ST-03 | Robustness | NFR-03 | Clashing timetables: 30 students try a clashing course at once | 0 clashing enrolments stored | 0 clashing enrolments stored | PASS |
| ST-04 | Robustness | NFR-04 | Bad and malformed requests | Each one answered with a normal page or 404; server keeps running | register with no course code: HTTP 200; 10 KB student ID: HTTP 200; broken form encoding: HTTP 200; page that does not exist: HTTP 404. Server still up: yes | PASS |
| ST-05 | Performance | NFR-01 | Single-user response time | Every page under 2 s | View courses avg 2 ms; Register avg 6 ms; View timetable avg 2 ms; slowest 9 ms | PASS |
| ST-06 | Performance | NFR-02 | 50 students register at the same moment | All 50 confirmed; 95% of responses under 5 s | 50/50 confirmed, 0 refused with 'connection reset'; avg 0.18 s, 95th percentile 0.46 s, slowest 0.56 s | PASS |
| ST-07 | Scalability | NFR-05 | Growing load: 10, 20, 40, 60 simultaneous students | Every level: all confirmed, 95th percentile under 5 s | 10 users: 10 confirmed, 0 refused, p95 0.20 s; 20 users: 20 confirmed, 0 refused, p95 0.15 s; 40 users: 40 confirmed, 0 refused, p95 0.35 s; 60 users: 60 confirmed, 0 refused, p95 0.77 s | PASS |

## Load and scalability measurements

| Simultaneous students | Confirmed | Refused (connection reset) | Average (s) | 95th percentile (s) | Slowest (s) |
|---|---|---|---|---|---|
| 10 | 10 | 0 | 0.07 | 0.20 | 0.20 |
| 20 | 20 | 0 | 0.08 | 0.15 | 0.21 |
| 40 | 40 | 0 | 0.14 | 0.35 | 0.45 |
| 50 | 50 | 0 | 0.18 | 0.46 | 0.56 |
| 60 | 60 | 0 | 0.25 | 0.77 | 1.09 |
