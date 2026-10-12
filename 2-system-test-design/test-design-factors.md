# Test design factors and testable requirements

## 1. Test design factors

These are the things about UniReg and its users that shaped which system tests we wrote.

| Factor | Why it matters for UniReg | How the tests handle it |
|---|---|---|
| **Registration-day concurrency** | Hundreds of students open registration at the same minute and compete for the same last seats. | ST-02, ST-03, ST-06 and ST-07 fire requests at the same instant using a thread barrier. |
| **Limited seats** | Courses hold 10 to 40 students. Over-enrolment is the worst failure the brief names. | ST-02 races 50 students for the 10 seats of SWC4823, three times. |
| **Business rules** | Credit limit (20), clash check and duplicate check must hold under load too, not only one at a time. | ST-03 checks the clash rule under concurrency; ST-01 checks the full journey. |
| **Response time** | The brief's acceptance target is confirmation in under 5 seconds. | ST-05 (one user) and ST-06 (50 users) time every request. |
| **Growth in users** | The faculty may grow; the system should degrade gracefully, not fail. | ST-07 measures 10, 20, 40 and 60 simultaneous students. |
| **Bad input** | Students mistype, bookmark old links or send broken forms. | ST-04 sends empty, oversized and malformed requests. |
| **Browsers and devices** | Students use Chrome, Edge, Safari, Firefox and phones. | ST-08 to ST-11 run the same journey in each browser engine and on a phone screen. |
| **Test environment** | The prototype runs on one laptop (Python 3, SQLite). Results are a baseline, not production numbers. | Every test starts a fresh copy of UniReg with a clean database, so runs are repeatable. |

## 2. Testable non-functional requirements

Each requirement has a measurable target, so a test can pass or fail it.

| ID | Type | Requirement | Measure / pass condition | Tested by |
|---|---|---|---|---|
| NFR-01 | Performance | Pages respond quickly for a single student. | Every page and registration under 2 s; the full journey completes. | ST-01, ST-05 |
| NFR-02 | Performance | The system copes with 50 students registering at the same moment. | All 50 get a confirmation; 95th-percentile response under 5 s. | ST-06 |
| NFR-03 | Robustness | Concurrent registrations never break the business rules. | Enrolled count never exceeds capacity; no clashing enrolment is stored. | ST-02, ST-03 |
| NFR-04 | Robustness | Bad or malformed requests are handled without crashing. | Each gets a normal page or 404; the server is still running afterwards. | ST-04 |
| NFR-05 | Scalability | Performance degrades gracefully as users grow. | At 10, 20, 40 and 60 simultaneous students, all are confirmed and p95 stays under 5 s. | ST-07 |
| NFR-06 | Interoperability | The system works the same in the main browsers and on a phone. | Login, register, timetable and drop all work in Chromium, Firefox, WebKit and an iPhone-size screen, with no sideways scrolling on the phone. | ST-08 to ST-11 |

## 3. Traceability to the other sections

| Brief focus | Functional (Amir) | System (Ramzi) | Acceptance (Yasierul) |
|---|---|---|---|
| Registration confirmation < 5 s | FT-07 | ST-05, ST-06 | UAT-04, UAT-15 (AC-01) |
| Prevent over-enrolment | FT-12, FT-13 | ST-02 | UAT-05, UAT-06, UAT-14 (AC-02) |
| Many students at once | n/a (one at a time) | ST-06, ST-07 | UAT-15 (AC-09) |
| Timetable clash | FT-21 | ST-03 | UAT-08 (AC-06) |
