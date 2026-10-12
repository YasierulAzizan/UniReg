"""System tests for UniReg (Ramzi's section): end-to-end, robustness, performance and scalability.

    python3 2-system-test-design/system_test.py               # tests app.py (v1.1)
    python3 2-system-test-design/system_test.py app_v1_0.py   # the original build

Writes results/system_results.md. Interoperability (browsers, mobile) is in interop.js.
Python 3 only, nothing to install.
"""
import os
import sqlite3
import statistics
import sys
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "tools"))
from unireg_client import Student, start_app  # noqa: E402

APP = sys.argv[1] if len(sys.argv) > 1 else "app.py"
results = []
perf_rows = []


def record(cid, category, nfr, title, expected, actual, passed):
    results.append(dict(id=cid, category=category, nfr=nfr, title=title, expected=expected, actual=actual,
                        status="PASS" if passed else "FAIL"))
    print(f"{cid}  {'PASS' if passed else 'FAIL'}  {title}: {actual}")


def sid(n):
    return f"S{n:03d}"


def at_once(fns):
    """Run every function at the same instant (one thread each). Returns their results in order."""
    out = [None] * len(fns)
    gate = threading.Barrier(len(fns))

    def run(i, fn):
        gate.wait()
        try:
            out[i] = fn()
        except Exception as e:  # a refused or dropped request counts as a failed response
            out[i] = e
    threads = [threading.Thread(target=run, args=(i, f)) for i, f in enumerate(fns)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    return out


def p95(xs):
    xs = sorted(xs)
    return xs[max(0, int(round(0.95 * len(xs))) - 1)]


def enrolled(db, code):
    con = sqlite3.connect(db)
    n = con.execute("SELECT COUNT(*) FROM enrolments WHERE code=?", (code,)).fetchone()[0]
    con.close()
    return n


def alive(base):
    try:
        return urllib.request.urlopen(base + "/login", timeout=5).status == 200
    except OSError:
        return False


def raw(base, path, data=None, headers=None):
    req = urllib.request.Request(base + path, data=data, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code


# ---------------- Functional (end to end) ----------------
def st01():
    base, stop, db = start_app(APP)
    try:
        s = Student(base)
        steps = []
        ok, _ = s.login("S001"); steps.append(ok)
        for c in ("SWC4263", "SWC4213", "SWC4323"):
            steps.append(s.register(c)[0])
        rows, total = s.timetable(); steps.append(len(rows) == 3 and total == 10)
        s.drop("SWC4213"); rows, total = s.timetable(); steps.append(len(rows) == 2 and total == 7)
        s.get("/logout"); url, _ = s.get("/courses"); steps.append(url.endswith("/login"))
        record("ST-01", "Functional (end to end)", "NFR-01", "Full student journey",
               "Login, register 3, view timetable (10 credits), drop 1 (7 credits), logout",
               f"{sum(steps)} of {len(steps)} steps behaved as expected", all(steps))
    finally:
        stop()


# ---------------- Robustness ----------------
def st02():
    runs = []
    for _ in range(3):
        base, stop, db = start_app(APP)
        try:
            students = [Student(base) for _ in range(50)]
            for i, s in enumerate(students, 1):
                s.login(sid(i))
            at_once([lambda s=s: s.register("SWC4823") for s in students])
            runs.append(enrolled(db, "SWC4823"))
        finally:
            stop()
    record("ST-02", "Robustness", "NFR-03", "Max enrolment: 50 students race for 10 seats (3 runs)",
           "Exactly 10 enrolled in every run", f"Enrolled per run: {', '.join(map(str, runs))} (capacity 10)",
           all(n == 10 for n in runs))


def st03():
    base, stop, db = start_app(APP)
    try:
        students = [Student(base) for _ in range(30)]
        for i, s in enumerate(students, 1):
            s.login(sid(i)); s.register("SWC4263")
        at_once([lambda s=s: s.register("SWC4113") for s in students])
        n = enrolled(db, "SWC4113")
        record("ST-03", "Robustness", "NFR-03", "Clashing timetables: 30 students try a clashing course at once",
               "0 clashing enrolments stored", f"{n} clashing enrolments stored", n == 0)
    finally:
        stop()


def st04():
    base, stop, db = start_app(APP)
    try:
        s = Student(base); s.login("S001")
        cookie = "; ".join(f"{c.name}={c.value}" for c in s.jar)
        form = {"Content-Type": "application/x-www-form-urlencoded", "Cookie": cookie}
        checks = {
            "register with no course code": raw(base, "/register", b"", form),
            "10 KB student ID": raw(base, "/login", b"student_id=" + b"A" * 10240 + b"&password=x", {"Content-Type": "application/x-www-form-urlencoded"}),
            "broken form encoding": raw(base, "/register", b"%%%=&&==", form),
            "page that does not exist": raw(base, "/admin", None, {"Cookie": cookie}),
        }
        up = alive(base)
        handled = all(code in (200, 303, 404) for code in checks.values())
        detail = "; ".join(f"{k}: HTTP {v}" for k, v in checks.items())
        record("ST-04", "Robustness", "NFR-04", "Bad and malformed requests",
               "Each one answered with a normal page or 404; server keeps running",
               f"{detail}. Server still up: {'yes' if up else 'no'}", handled and up)
    finally:
        stop()


# ---------------- Performance ----------------
def st05():
    base, stop, db = start_app(APP)
    try:
        s = Student(base); s.login("S001")
        times = {"View courses": [], "Register": [], "View timetable": []}
        codes = ["SWC4263", "SWC4213", "SWC4323", "SWC4513", "SWC4613"]
        for i in range(20):
            t = time.perf_counter(); s.get("/courses"); times["View courses"].append(time.perf_counter() - t)
            t = time.perf_counter(); s.get("/timetable"); times["View timetable"].append(time.perf_counter() - t)
        for c in codes:
            times["Register"].append(s.register(c)[2])
        worst = max(max(v) for v in times.values())
        detail = "; ".join(f"{k} avg {statistics.mean(v)*1000:.0f} ms" for k, v in times.items())
        record("ST-05", "Performance", "NFR-01", "Single-user response time", "Every page under 2 s",
               f"{detail}; slowest {worst*1000:.0f} ms", worst < 2)
    finally:
        stop()


def load_level(n):
    """n students log in, then all register at the same instant; returns timings."""
    base, stop, db = start_app(APP)
    try:
        students = [Student(base) for _ in range(n)]
        for i, s in enumerate(students, 1):
            s.login(sid(i))
        course = lambda i: "SWC4263" if i < 40 else "SWC4213"
        res = at_once([lambda i=i, s=s: s.register(course(i)) for i, s in enumerate(students)])
        errors = [r for r in res if isinstance(r, Exception)]
        good = [r for r in res if not isinstance(r, Exception)]
        secs = [r[2] for r in good] or [0]
        ok = sum(r[0] for r in good)
        return dict(users=n, confirmed=ok, errors=len(errors), error_text=str(errors[0]) if errors else "",
                    avg=statistics.mean(secs), p95=p95(secs), max=max(secs))
    finally:
        stop()


def st06():
    r = load_level(50)
    perf_rows.append(r)
    record("ST-06", "Performance", "NFR-02", "50 students register at the same moment",
           "All 50 confirmed; 95% of responses under 5 s",
           f"{r['confirmed']}/50 confirmed, {r['errors']} refused with 'connection reset'; avg {r['avg']:.2f} s, 95th percentile {r['p95']:.2f} s, slowest {r['max']:.2f} s",
           r["confirmed"] == 50 and r["p95"] < 5)


# ---------------- Scalability ----------------
def st07():
    rows = [load_level(n) for n in (10, 20, 40, 60)]
    perf_rows.extend(rows)
    ok = all(r["confirmed"] == r["users"] and r["p95"] < 5 for r in rows)
    detail = "; ".join(f"{r['users']} users: {r['confirmed']} confirmed, {r['errors']} refused, p95 {r['p95']:.2f} s" for r in rows)
    record("ST-07", "Scalability", "NFR-05", "Growing load: 10, 20, 40, 60 simultaneous students",
           "Every level: all confirmed, 95th percentile under 5 s", detail, ok)


def main():
    print(f"UniReg system tests on {APP}\n")
    for t in (st01, st02, st03, st04, st05, st06, st07):
        t()
    out = os.path.join(HERE, "results")
    os.makedirs(out, exist_ok=True)
    stamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    passed = sum(r["status"] == "PASS" for r in results)
    with open(os.path.join(out, "system_results.md"), "w") as f:
        f.write(f"# System test execution log\n\nBuild: `{APP}` · Run: {stamp} · **{passed} / {len(results)} passed**\n\n")
        f.write("| ID | Category | NFR | Test | Expected | Actual | Status |\n|---|---|---|---|---|---|---|\n")
        for r in results:
            f.write("| " + " | ".join(r[k].replace("|", "/") for k in ("id", "category", "nfr", "title", "expected", "actual", "status")) + " |\n")
        f.write("\n## Load and scalability measurements\n\n| Simultaneous students | Confirmed | Refused (connection reset) | Average (s) | 95th percentile (s) | Slowest (s) |\n|---|---|---|---|---|---|\n")
        for r in sorted(perf_rows, key=lambda r: r["users"]):
            f.write(f"| {r['users']} | {r['confirmed']} | {r['errors']} | {r['avg']:.2f} | {r['p95']:.2f} | {r['max']:.2f} |\n")
    print(f"\n{passed} / {len(results)} passed. Log saved to {os.path.relpath(out)}/")


if __name__ == "__main__":
    main()
