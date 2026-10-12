# Test design process model

How we went from the brief to executed system tests. The diagram renders on GitHub. For the report, use [test-design-process.png](test-design-process.png).

```mermaid
flowchart TD
    A[Project brief and UniReg scope] --> B[Identify test design factors<br/>concurrency, seats, rules, speed, growth, input, browsers]
    B --> C[Write testable requirements<br/>NFR-01 to NFR-06 with measurable targets]
    C --> D{Choose test category}
    D --> E1[Functional<br/>end-to-end journey]
    D --> E2[Robustness<br/>max enrolment, clashes, bad input]
    D --> E3[Performance<br/>1 user and 50 users]
    D --> E4[Scalability<br/>10 / 20 / 40 / 60 users]
    D --> E5[Interoperability<br/>browsers and phone]
    E1 & E2 & E3 & E4 & E5 --> F[Design test cases ST-01 to ST-11<br/>input, expected result, pass condition]
    F --> G[Set up environment<br/>fresh UniReg + clean database per test]
    G --> H[Execute: system_test.py and interop.js]
    H --> I{Result matches expected?}
    I -- Yes --> J[Record PASS]
    I -- No --> K[Log defect with severity<br/>e.g. DEF-03]
    K --> L[Developer fixes] --> H
    J --> M[System test report<br/>feeds Acceptance Testing]
```

## Steps in words

| Step | Input | Output |
|---|---|---|
| 1. Identify factors | Brief, UniReg features, expected users | Factor table ([test-design-factors.md](test-design-factors.md) §1) |
| 2. Write requirements | Factors | NFR-01 to NFR-06 with targets (§2) |
| 3. Pick categories | Requirements; the brief's list | Functional, robustness, performance, scalability, interoperability |
| 4. Design cases | Categories and targets | ST-01 to ST-11 ([system-test-plan.md](system-test-plan.md)) |
| 5. Prepare environment | Prototype, Python, Playwright | Each test starts its own UniReg with a clean database |
| 6. Execute | Scripts | `results/system_results.md`, `results/interop_results.md`, screenshots |
| 7. Evaluate and log defects | Actual vs expected | PASS / FAIL, defects (DEF-03) |
| 8. Re-test after fixes | Fixed build | Updated results; hand over to Acceptance Testing |
