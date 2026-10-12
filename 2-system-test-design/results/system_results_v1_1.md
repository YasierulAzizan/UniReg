# System test execution log

Build: `app_v1_1.py` (v1.1) · Run: 2026-10-12 09:06 · **5 / 7 passed**

| ID | Category | NFR | Test | Expected | Actual | Status |
|---|---|---|---|---|---|---|
| ST-01 | Functional (end to end) | NFR-01 | Full student journey | Login, register 3, view timetable (10 credits), drop 1 (7 credits), logout | 7 of 7 steps behaved as expected | PASS |
| ST-02 | Robustness | NFR-03 | Max enrolment: 50 students race for 10 seats (3 runs) | Exactly 10 enrolled in every run | Enrolled per run: 10, 10, 10 (capacity 10) | PASS |
| ST-03 | Robustness | NFR-03 | Clashing timetables: 30 students try a clashing course at once | 0 clashing enrolments stored | 0 clashing enrolments stored | PASS |
| ST-04 | Robustness | NFR-04 | Bad and malformed requests | Each one answered with a normal page or 404; server keeps running | register with no course code: HTTP 200; 10 KB student ID: HTTP 200; broken form encoding: HTTP 200; page that does not exist: HTTP 404. Server still up: yes | PASS |
| ST-05 | Performance | NFR-01 | Single-user response time | Every page under 2 s | View courses avg 2 ms; Register avg 5 ms; View timetable avg 2 ms; slowest 6 ms | PASS |
| ST-06 | Performance | NFR-02 | 50 students register at the same moment | All 50 confirmed; 95% of responses under 5 s | 49/50 confirmed, 1 refused with 'connection reset'; avg 0.48 s, 95th percentile 1.12 s, slowest 1.17 s | FAIL |
| ST-07 | Scalability | NFR-05 | Growing load: 10, 20, 40, 60 simultaneous students | Every level: all confirmed, 95th percentile under 5 s | 10 users: 10 confirmed, 0 refused, p95 0.12 s; 20 users: 20 confirmed, 0 refused, p95 0.36 s; 40 users: 40 confirmed, 0 refused, p95 1.16 s; 60 users: 57 confirmed, 3 refused, p95 1.12 s | FAIL |

## Load and scalability measurements

| Simultaneous students | Confirmed | Refused (connection reset) | Average (s) | 95th percentile (s) | Slowest (s) |
|---|---|---|---|---|---|
| 10 | 10 | 0 | 0.05 | 0.12 | 0.12 |
| 20 | 20 | 0 | 0.15 | 0.36 | 1.03 |
| 40 | 40 | 0 | 0.54 | 1.16 | 1.35 |
| 50 | 49 | 1 | 0.48 | 1.12 | 1.17 |
| 60 | 57 | 3 | 0.51 | 1.12 | 1.16 |
