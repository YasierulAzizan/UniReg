"""Functional test suite for UniReg (Amir's section).

Runs every functional test case against a fresh copy of the app and writes the
execution log to results/functional_results.md and results/functional_results.csv.

    python3 1-functional-testing/functional_test.py            # tests app.py (v1.1)
    python3 1-functional-testing/functional_test.py app_v1_0.py

Python 3 only, nothing to install.
"""
import csv
import os
import random
import sqlite3
import sys
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "tools"))
from unireg_client import Student, start_app  # noqa: E402

APP = sys.argv[1] if len(sys.argv) > 1 else "app.py"
CASES = []


def case(cid, technique, req, title, inp, expected):
    def wrap(fn):
        CASES.append(dict(id=cid, technique=technique, req=req, title=title, input=inp, expected=expected, fn=fn))
        return fn
    return wrap


def sid(n):
    return f"S{n:03d}"


def logged_in(base, n):
    s = Student(base)
    ok, _ = s.login(sid(n))
    assert ok, f"could not log in {sid(n)}"
    return s


def fill(base, code, students):
    for n in students:
        logged_in(base, n).register(code)


# Courses that never clash with each other (3 credits unless noted)
NO_CLASH_19 = ["SWC4263", "SWC4213", "SWC4823", "SWC4513", "SWC4613", "SWC4323"]  # 3+3+3+3+3+4 = 19


# ---------------- Equivalence partitioning ----------------
@case("FT-01", "EP", "FR-01", "Login, valid ID and password", "S001 / Pass@123", "Logged in, Available Courses page shown")
def t(base, db):
    ok, msg = Student(base).login("S001")
    return ok, "Logged in, Available Courses page shown" if ok else f"Not logged in: {msg}"


@case("FT-02", "EP", "FR-02", "Login, valid ID, wrong password", "S002 / wrong", "Rejected: 'Invalid ... 2 attempt(s) left'")
def t(base, db):
    ok, msg = Student(base).login("S002", "wrong")
    return (not ok and "2 attempt(s) left" in msg), f"Rejected: '{msg}'" if not ok else "Logged in"


@case("FT-03", "EP", "FR-02", "Login, ID that does not exist", "S999 / Pass@123", "Rejected: 'Invalid student ID or password'")
def t(base, db):
    ok, msg = Student(base).login("S999")
    return (not ok and msg.startswith("Invalid student ID")), f"Rejected: '{msg}'" if not ok else "Logged in"


@case("FT-04", "EP", "FR-02", "Login, ID in wrong format", "ABC / Pass@123", "Rejected: 'Invalid student ID or password'")
def t(base, db):
    ok, msg = Student(base).login("ABC")
    return (not ok and msg.startswith("Invalid student ID")), f"Rejected: '{msg}'" if not ok else "Logged in"


@case("FT-05", "EP", "FR-03", "Login, empty student ID", "'' / Pass@123", "Rejected: 'Student ID and password are required.'")
def t(base, db):
    ok, msg = Student(base).login("")
    return (not ok and "required" in msg), f"Rejected: '{msg}'" if not ok else "Logged in"


@case("FT-06", "EP", "FR-03", "Login, empty password", "S001 / ''", "Rejected: 'Student ID and password are required.'")
def t(base, db):
    ok, msg = Student(base).login("S001", "")
    return (not ok and "required" in msg), f"Rejected: '{msg}'" if not ok else "Logged in"


@case("FT-07", "EP", "FR-06", "Register, open course", "S001 registers SWC4263 (0/40)", "Confirmed with REG-XXXXXXXX; seats 1/40")
def t(base, db):
    s = logged_in(base, 1)
    ok, msg, secs = s.register("SWC4263")
    seats = s.seats("SWC4263")
    return (ok and "REG-" in msg and seats == (1, 40)), f"'{msg[:60]}...' in {secs:.2f} s; seats {seats[0]}/{seats[1]}"


@case("FT-08", "EP", "FR-07", "Register, full course", "S001 registers SWC4413 (30/30)", "Rejected as full; seats stay 30/30")
def t(base, db):
    s = logged_in(base, 1)
    ok, msg, _ = s.register("SWC4413")
    seats = s.seats("SWC4413")
    return (not ok and "full" in msg and seats == (30, 30)), f"Rejected: '{msg}'; seats {seats[0]}/{seats[1]}"


@case("FT-09", "EP", "FR-05", "View course list", "S001 opens Courses", "9 courses, each with credits, schedule, venue, seats")
def t(base, db):
    s = logged_in(base, 1)
    _, page = s.get("/courses")
    rows = page.count('<tr id="row-')
    return rows == 9 and "Seats" in page and "Venue" in page, f"{rows} courses listed with Code, Course, Credits, Schedule, Venue, Seats"


# ---------------- Boundary value analysis ----------------
@case("FT-10", "BVA", "FR-04", "Failed logins = 2 (just below lock limit)", "2 wrong, then correct password", "Not locked; correct password logs in")
def t(base, db):
    s = Student(base)
    s.login("S002", "x1"); s.login("S002", "x2")
    ok, msg = s.login("S002")
    return ok, "Logged in after 2 failures" if ok else f"Refused: '{msg}'"


@case("FT-11", "BVA", "FR-04", "Failed logins = 3 (at lock limit)", "3 wrong, then correct password", "Account locked; correct password refused")
def t(base, db):
    s = Student(base)
    for p in ("x1", "x2", "x3"):
        s.login("S002", p)
    ok, msg = s.login("S002")
    return (not ok and "locked" in msg), f"Refused: '{msg}'" if not ok else "Logged in"


@case("FT-12", "BVA", "FR-07", "Seats = capacity - 1 (last seat)", "SWC4613 at 29/30, S001 registers", "Confirmed; seats 30/30")
def t(base, db):
    fill(base, "SWC4613", range(31, 60))
    s = logged_in(base, 1)
    ok, msg, _ = s.register("SWC4613")
    seats = s.seats("SWC4613")
    return ok and seats == (30, 30), f"{'Confirmed' if ok else 'Rejected'}; seats {seats[0]}/{seats[1]}"


@case("FT-13", "BVA", "FR-07", "Seats = capacity (course just filled)", "SWC4613 at 30/30, S002 registers", "Rejected as full; seats stay 30/30")
def t(base, db):
    fill(base, "SWC4613", range(30, 60))
    s = logged_in(base, 2)
    ok, msg, _ = s.register("SWC4613")
    seats = s.seats("SWC4613")
    return (not ok and "full" in msg and seats == (30, 30)), f"Rejected: '{msg}'; seats {seats[0]}/{seats[1]}"


@case("FT-14", "BVA", "FR-09", "Credits = 20 (at maximum)", "16 credits + SWC4723 (4)", "Confirmed; total 20 / 20")
def t(base, db):
    s = logged_in(base, 1)
    for c in ["SWC4263", "SWC4213", "SWC4513", "SWC4613", "SWC4323"]:
        s.register(c)
    ok, msg, _ = s.register("SWC4723")
    _, total = s.timetable()
    return ok and total == 20, f"{'Confirmed' if ok else 'Rejected: ' + msg}; total {total} / 20"


@case("FT-15", "BVA", "FR-09", "Credits above maximum", "19 credits + SWC4723 (4) = 23", "Rejected: 'Credit limit exceeded'; total stays 19")
def t(base, db):
    s = logged_in(base, 1)
    for c in NO_CLASH_19:
        s.register(c)
    ok, msg, _ = s.register("SWC4723")
    _, total = s.timetable()
    return (not ok and "Credit limit" in msg and total == 19), f"Rejected: '{msg}'; total {total}" if not ok else "Confirmed"


@case("FT-16", "BVA", "FR-12", "Timetable with 0 courses (minimum)", "S001 opens My Timetable, nothing registered", "'No registered courses.'; total 0 / 20")
def t(base, db):
    s = logged_in(base, 1)
    rows, total = s.timetable()
    _, page = s.get("/timetable")
    return (not rows and total == 0 and "No registered courses" in page), f"{len(rows)} rows, 'No registered courses.' shown; total {total} / 20"


# ---------------- Pairwise (capacity x clash x credits) ----------------
@case("FT-17", "Pairwise", "FR-06..09", "Open course, no clash, within credits", "S001 has SWC4263; registers SWC4213", "Confirmed")
def t(base, db):
    s = logged_in(base, 1)
    s.register("SWC4263")
    ok, msg, _ = s.register("SWC4213")
    return ok, "Confirmed" if ok else f"Rejected: '{msg}'"


@case("FT-18", "Pairwise", "FR-06..09", "Open course, clash, over credits", "S001 has 19 credits incl. SWC4263; registers SWC4113", "Rejected")
def t(base, db):
    s = logged_in(base, 1)
    for c in NO_CLASH_19:
        s.register(c)
    ok, msg, _ = s.register("SWC4113")
    return not ok, f"Rejected: '{msg}'" if not ok else "Confirmed"


@case("FT-19", "Pairwise", "FR-06..09", "Full course, no clash, over credits", "S001 has 19 credits; registers SWC4413 (full)", "Rejected")
def t(base, db):
    s = logged_in(base, 1)
    for c in NO_CLASH_19:
        s.register(c)
    ok, msg, _ = s.register("SWC4413")
    return not ok, f"Rejected: '{msg}'" if not ok else "Confirmed"


@case("FT-20", "Pairwise", "FR-06..09", "Full course, clash, within credits", "SWC4113 filled to 40/40; S001 has SWC4263; registers SWC4113", "Rejected")
def t(base, db):
    fill(base, "SWC4113", range(11, 51))
    s = logged_in(base, 1)
    s.register("SWC4263")
    ok, msg, _ = s.register("SWC4113")
    return not ok, f"Rejected: '{msg}'" if not ok else "Confirmed"


# ---------------- Other functional requirements ----------------
@case("FT-21", "EP", "FR-08", "Timetable clash", "S001 has SWC4263 (Mon 09-11); registers SWC4113 (Mon 10-12)", "Rejected; message names SWC4263")
def t(base, db):
    s = logged_in(base, 1)
    s.register("SWC4263")
    ok, msg, _ = s.register("SWC4113")
    return (not ok and "clash" in msg and "SWC4263" in msg), f"Rejected: '{msg}'" if not ok else "Confirmed"


@case("FT-22", "EP", "FR-10", "Duplicate registration", "S001 registers SWC4263 twice", "Second attempt rejected; seats stay 1/40")
def t(base, db):
    s = logged_in(base, 1)
    s.register("SWC4263")
    ok, msg, _ = s.register("SWC4263")
    seats = s.seats("SWC4263")
    return (not ok and "already registered" in msg and seats == (1, 40)), f"Rejected: '{msg}'; seats {seats[0]}/{seats[1]}"


@case("FT-23", "EP", "FR-11", "Drop a registered course", "S001 registers then drops SWC4263", "Removed from timetable; seats back to 0/40")
def t(base, db):
    s = logged_in(base, 1)
    s.register("SWC4263")
    msg = s.drop("SWC4263")
    rows, total = s.timetable()
    seats = s.seats("SWC4263")
    return (not rows and seats == (0, 40)), f"'{msg}' Timetable has {len(rows)} courses; seats {seats[0]}/{seats[1]}"


@case("FT-24", "EP", "FR-12", "Timetable order and total", "S001 registers 6 courses in random order", "Listed Mon to Fri by start time; total 19")
def t(base, db):
    s = logged_in(base, 1)
    for c in ["SWC4613", "SWC4323", "SWC4263", "SWC4513", "SWC4823", "SWC4213"]:
        s.register(c)
    rows, total = s.timetable()
    order = [r[0] for r in rows]
    want = ["SWC4263", "SWC4823", "SWC4213", "SWC4323", "SWC4513", "SWC4613"]
    return order == want and total == 19, f"Order: {', '.join(order)}; total {total}"


# ---------------- Error guessing ----------------
@case("FT-25", "Error guessing", "FR-02", "SQL injection in student ID", "' OR '1'='1 / anything", "Rejected; not logged in")
def t(base, db):
    ok, msg = Student(base).login("' OR '1'='1", "' OR '1'='1")
    return not ok, f"Rejected: '{msg}'" if not ok else "Logged in (security hole)"


@case("FT-26", "Error guessing", "FR-06", "Register a course code that does not exist", "POST code=XYZ999", "Rejected: 'Course not found.'")
def t(base, db):
    ok, msg, _ = logged_in(base, 1).register("XYZ999")
    return (not ok and "not found" in msg), f"Rejected: '{msg}'" if not ok else "Confirmed"


@case("FT-27", "Error guessing", "FR-13", "Open My Timetable without logging in", "GET /timetable, no session", "Redirected to the login page")
def t(base, db):
    url, _ = Student(base).get("/timetable")
    return url.endswith("/login"), f"Ended on {url.split(base)[-1]}"


@case("FT-28", "Error guessing", "FR-11", "Drop a course that is not registered", "S001 drops SWC4723", "Message: 'You are not registered for SWC4723.'")
def t(base, db):
    msg = logged_in(base, 1).drop("SWC4723")
    return "not registered" in msg, f"'{msg}'"


@case("FT-29", "Error guessing", "FR-01", "Lower-case student ID", "s001 / Pass@123", "Logged in (IDs are not case-sensitive)")
def t(base, db):
    ok, msg = Student(base).login("s001")
    return ok, "Logged in" if ok else f"Refused: '{msg}'"


@case("FT-30", "Error guessing", "FR-13", "Use the site after logout", "Log out, then open Courses", "Redirected to the login page")
def t(base, db):
    s = logged_in(base, 1)
    s.get("/logout")
    url, _ = s.get("/courses")
    return url.endswith("/login"), f"Ended on {url.split(base)[-1]}"


@case("FT-31", "Error guessing", "FR-13", "Reuse an old session cookie after logout", "Copy the cookie, log out, send the old cookie again",
      "Old cookie no longer works; redirected to login")
def t(base, db):
    import urllib.request
    s = logged_in(base, 1)
    token = next(c.value for c in s.jar if c.name == "sid")
    s.get("/logout")
    req = urllib.request.Request(base + "/timetable", headers={"Cookie": f"sid={token}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        url = r.geturl()
    ok = url.endswith("/login")
    return ok, "Redirected to login" if ok else "Old cookie still opens My Timetable after logout (session not ended on the server)"


# ---------------- Random testing ----------------
@case("FT-32", "Random", "FR-06..11", "300 random register/drop actions", "Seed 42, 20 students, random courses",
      "No course over capacity, no student over 20 credits, no clashes")
def t(base, db):
    rng = random.Random(42)
    codes = [c for c in ["SWC4263", "SWC4113", "SWC4213", "SWC4323", "SWC4413", "SWC4513", "SWC4613", "SWC4723", "SWC4823"]]
    students = {n: logged_in(base, n) for n in range(1, 21)}
    confirmed = rejected = drops = 0
    for _ in range(300):
        s = students[rng.randint(1, 20)]
        code = rng.choice(codes)
        if rng.random() < 0.25:
            s.drop(code); drops += 1
        else:
            ok, _, _ = s.register(code)
            confirmed += ok; rejected += not ok
    con = sqlite3.connect(db)
    over_cap = con.execute("SELECT COUNT(*) FROM courses c WHERE (SELECT COUNT(*) FROM enrolments e WHERE e.code=c.code) > c.capacity").fetchone()[0]
    over_cr = con.execute("SELECT COUNT(*) FROM (SELECT e.student_id, SUM(c.credits) t FROM enrolments e JOIN courses c ON c.code=e.code GROUP BY e.student_id) WHERE t > 20").fetchone()[0]
    clashes = con.execute("""SELECT COUNT(*) FROM enrolments a JOIN enrolments b ON a.student_id=b.student_id AND a.code<b.code
        JOIN courses x ON x.code=a.code JOIN courses y ON y.code=b.code
        WHERE x.day=y.day AND x.start<y.end AND y.start<x.end""").fetchone()[0]
    con.close()
    ok = over_cap == 0 and over_cr == 0 and clashes == 0
    return ok, (f"{confirmed} confirmed, {rejected} rejected, {drops} drops. Courses over capacity: {over_cap}; "
                f"students over 20 credits: {over_cr}; clashes: {clashes}")


def main():
    print(f"UniReg functional tests on {APP}\n")
    results = []
    for c in CASES:
        base, stop, db = start_app(APP)
        try:
            passed, actual = c["fn"](base, db)
        except Exception as e:  # a crash counts as a failure, with the reason recorded
            passed, actual = False, f"ERROR: {e}"
        finally:
            stop()
        status = "PASS" if passed else "FAIL"
        results.append({**{k: c[k] for k in ("id", "technique", "req", "title", "input", "expected")}, "actual": actual, "status": status})
        print(f"{c['id']}  {status}  {c['title']}: {actual}")

    out = os.path.join(HERE, "results")
    os.makedirs(out, exist_ok=True)
    stamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    keys = ["id", "technique", "req", "title", "input", "expected", "actual", "status"]
    with open(os.path.join(out, "functional_results.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        w.writerows(results)
    passed = sum(r["status"] == "PASS" for r in results)
    with open(os.path.join(out, "functional_results.md"), "w") as f:
        f.write(f"# Functional test execution log\n\nBuild: `{APP}` · Run: {stamp} · **{passed} / {len(results)} passed**\n\n")
        f.write("| ID | Technique | Req | Test | Input | Expected | Actual | Status |\n|---|---|---|---|---|---|---|---|\n")
        for r in results:
            cells = [r[k].replace("|", "/") for k in keys]
            f.write("| " + " | ".join(cells) + " |\n")
    print(f"\n{passed} / {len(results)} passed. Log saved to {os.path.relpath(out)}/")


if __name__ == "__main__":
    main()
