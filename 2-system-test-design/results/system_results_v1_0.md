# System test execution log

Build: `app_v1_0.py` · Run: 2026-10-12 09:14 · **5 / 7 passed**

| ID | Category | NFR | Test | Expected | Actual | Status |
|---|---|---|---|---|---|---|
| ST-01 | Functional (end to end) | NFR-01 | Full student journey | Login, register 3, view timetable (10 credits), drop 1 (7 credits), logout | 7 of 7 steps behaved as expected | PASS |
| ST-02 | Robustness | NFR-03 | Max enrolment: 50 students race for 10 seats (3 runs) | Exactly 10 enrolled in every run | Enrolled per run: 16, 15, 24 (capacity 10) | FAIL |
| ST-03 | Robustness | NFR-03 | Clashing timetables: 30 students try a clashing course at once | 0 clashing enrolments stored | 0 clashing enrolments stored | PASS |
| ST-04 | Robustness | NFR-04 | Bad and malformed requests | Each one answered with a normal page or 404; server keeps running | register with no course code: HTTP 200; 10 KB student ID: HTTP 200; broken form encoding: HTTP 200; page that does not exist: HTTP 404. Server still up: yes | PASS |
| ST-05 | Performance | NFR-01 | Single-user response time | Every page under 2 s | View courses avg 2 ms; Register avg 5 ms; View timetable avg 1 ms; slowest 8 ms | PASS |
| ST-06 | Performance | NFR-02 | 50 students register at the same moment | All 50 confirmed; 95% of responses under 5 s | 50/50 confirmed, 0 refused with 'connection reset'; avg 0.40 s, 95th percentile 1.27 s, slowest 1.28 s | PASS |
| ST-07 | Scalability | NFR-05 | Growing load: 10, 20, 40, 60 simultaneous students | Every level: all confirmed, 95th percentile under 5 s | 10 users: 10 confirmed, 0 refused, p95 0.08 s; 20 users: 20 confirmed, 0 refused, p95 0.24 s; 40 users: 35 confirmed, 5 refused, p95 1.06 s; 60 users: 57 confirmed, 3 refused, p95 1.09 s | FAIL |

## Load and scalability measurements

| Simultaneous students | Confirmed | Refused (connection reset) | Average (s) | 95th percentile (s) | Slowest (s) |
|---|---|---|---|---|---|
| 10 | 10 | 0 | 0.04 | 0.08 | 0.08 |
| 20 | 20 | 0 | 0.10 | 0.24 | 0.28 |
| 40 | 35 | 5 | 0.34 | 1.06 | 1.09 |
| 50 | 50 | 0 | 0.40 | 1.27 | 1.28 |
| 60 | 57 | 3 | 0.44 | 1.09 | 1.10 |
