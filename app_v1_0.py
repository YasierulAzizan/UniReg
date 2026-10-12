"""UniReg v1.0 (original build, contains DEF-01) - Student Course Registration System (prototype used as the system under test).

Run:  python3 app.py [port]   (default 8000), then open http://localhost:8000
Demo login: student ID S001 .. S060, password Pass@123
"""
import html
import os
import secrets
import sqlite3
import sys
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

DB = os.environ.get("UNIREG_DB", os.path.join(os.path.dirname(os.path.abspath(__file__)), "unireg.db"))
MAX_CREDITS = 20
MAX_FAILED_LOGINS = 3
SESSIONS = {}  # token -> student_id

COURSES = [
    # code, name, credits, capacity, day, start, end, venue
    ("SWC4263", "Software Testing and Quality Assurance", 3, 40, "Mon", "09:00", "11:00", "Lab 2"),
    ("SWC4113", "Software Requirements Engineering", 3, 40, "Mon", "10:00", "12:00", "BK 1.04"),
    ("SWC4213", "Software Project Management", 3, 40, "Tue", "14:00", "16:00", "BK 2.01"),
    ("SWC4323", "Mobile Application Development", 4, 35, "Wed", "09:00", "12:00", "Lab 4"),
    ("SWC4413", "Human Computer Interaction", 3, 30, "Thu", "11:00", "13:00", "BK 1.02"),
    ("SWC4513", "Cloud Computing", 3, 30, "Thu", "14:00", "16:00", "Lab 1"),
    ("SWC4613", "Data Mining", 3, 30, "Fri", "09:00", "11:00", "BK 3.03"),
    ("SWC4723", "Information Security", 4, 25, "Fri", "14:00", "17:00", "Lab 3"),
    ("SWC4823", "Final Year Project Seminar", 3, 10, "Tue", "09:00", "11:00", "Seminar Rm"),
]


def db():
    con = sqlite3.connect(DB, timeout=30)
    con.row_factory = sqlite3.Row
    return con


def init_db(seed_full=True):
    if os.path.exists(DB):
        os.remove(DB)
    con = db()
    con.executescript("""
        CREATE TABLE students (id TEXT PRIMARY KEY, name TEXT, password TEXT,
                               failed INTEGER DEFAULT 0, locked INTEGER DEFAULT 0);
        CREATE TABLE courses (code TEXT PRIMARY KEY, name TEXT, credits INTEGER, capacity INTEGER,
                              day TEXT, start TEXT, end TEXT, venue TEXT);
        CREATE TABLE enrolments (ref TEXT PRIMARY KEY, student_id TEXT, code TEXT, created TEXT);
    """)
    for i in range(1, 61):
        con.execute("INSERT INTO students (id, name, password) VALUES (?,?,?)",
                    (f"S{i:03d}", f"Student {i:03d}", "Pass@123"))
    con.executemany("INSERT INTO courses VALUES (?,?,?,?,?,?,?,?)", COURSES)
    if seed_full:
        # Human Computer Interaction is already full (30/30) at the start of the test cycle.
        for i in range(31, 61):
            con.execute("INSERT INTO enrolments VALUES (?,?,?,?)",
                        (new_ref(), f"S{i:03d}", "SWC4413", now()))
    con.commit()
    con.close()


def new_ref():
    return "REG-" + secrets.token_hex(4).upper()


def now():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def overlaps(a, b):
    return a["day"] == b["day"] and a["start"] < b["end"] and b["start"] < a["end"]


def register(student_id, code):
    """Returns (ok, message, ref)."""
    con = db()
    try:
        course = con.execute("SELECT * FROM courses WHERE code=?", (code,)).fetchone()
        if not course:
            return False, "Course not found.", None
        mine = con.execute("SELECT c.* FROM enrolments e JOIN courses c ON c.code=e.code "
                           "WHERE e.student_id=?", (student_id,)).fetchall()
        if any(c["code"] == code for c in mine):
            return False, f"You are already registered for {code}.", None
        taken = con.execute("SELECT COUNT(*) FROM enrolments WHERE code=?", (code,)).fetchone()[0]
        if taken >= course["capacity"]:
            return False, f"{code} is full ({taken}/{course['capacity']}). Registration rejected.", None
        credits = sum(c["credits"] for c in mine)
        if credits + course["credits"] > MAX_CREDITS:
            return False, (f"Credit limit exceeded: {credits} + {course['credits']} credits "
                           f"is more than the maximum of {MAX_CREDITS}."), None
        for c in mine:
            if overlaps(c, course):
                return False, (f"Timetable clash with {c['code']} ({c['day']} "
                               f"{c['start']}-{c['end']})."), None
        ref = new_ref()
        con.execute("INSERT INTO enrolments VALUES (?,?,?,?)", (ref, student_id, code, now()))
        con.commit()
        return True, f"Registration confirmed for {code} {course['name']}.", ref
    finally:
        con.close()


def drop(student_id, code):
    con = db()
    cur = con.execute("DELETE FROM enrolments WHERE student_id=? AND code=?", (student_id, code))
    con.commit()
    con.close()
    return cur.rowcount > 0


PAGE = """<!doctype html><html><head><meta charset="utf-8"><title>UniReg - {title}</title>
<style>body{{font-family:Arial,sans-serif;margin:0;background:#f4f6f8}}
header{{background:#1f3a5f;color:#fff;padding:12px 24px;display:flex;justify-content:space-between}}
header a{{color:#fff}} main{{padding:24px}} table{{border-collapse:collapse;background:#fff;width:100%}}
th,td{{border:1px solid #ccd;padding:6px 8px;text-align:left;font-size:14px}} th{{background:#e8edf3}}
.msg{{padding:10px 14px;margin-bottom:16px;border-radius:4px}} .ok{{background:#dff3e3;border:1px solid #6c6}}
.err{{background:#fbe3e3;border:1px solid #d66}} form.inline{{display:inline}}
.box{{background:#fff;padding:24px;max-width:340px;margin:60px auto;border:1px solid #ccd}}
input{{padding:6px;margin:4px 0 10px;width:95%}} button{{padding:6px 14px}}</style></head>
<body><header><b>UniReg</b><span>{nav}</span></header><main>{body}</main></body></html>"""


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def student(self):
        for part in self.headers.get("Cookie", "").split(";"):
            k, _, v = part.strip().partition("=")
            if k == "sid" and v in SESSIONS:
                return SESSIONS[v]
        return None

    def send(self, body, title="UniReg", status=200, cookie=None):
        sid = self.student()
        nav = (f'{sid} | <a href="/courses">Courses</a> | <a href="/timetable">My Timetable</a> | '
               f'<a href="/logout">Logout</a>') if sid else ""
        data = PAGE.format(title=title, nav=nav, body=body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        if cookie:
            self.send_header("Set-Cookie", cookie)
        self.end_headers()
        self.wfile.write(data)

    def redirect(self, to, cookie=None):
        self.send_response(303)
        self.send_header("Location", to)
        if cookie:
            self.send_header("Set-Cookie", cookie)
        self.end_headers()

    def form(self):
        n = int(self.headers.get("Content-Length", 0))
        return {k: v[0] for k, v in parse_qs(self.rfile.read(n).decode()).items()}

    def login_page(self, msg=""):
        m = f'<div class="msg err" id="message">{html.escape(msg)}</div>' if msg else ""
        self.send(f"""<div class="box"><h2>Student Login</h2>{m}<form method="post" action="/login">
            <label>Student ID<input name="student_id" id="student_id"></label>
            <label>Password<input type="password" name="password" id="password"></label>
            <button id="login">Login</button></form></div>""", "Login")

    def do_GET(self):
        path = urlparse(self.path).path
        q = {k: v[0] for k, v in parse_qs(urlparse(self.path).query).items()}
        sid = self.student()
        if path in ("/", "/login"):
            return self.redirect("/courses") if sid else self.login_page()
        if path == "/logout":
            return self.redirect("/login", "sid=; Max-Age=0")
        if not sid:
            return self.redirect("/login")
        if path == "/courses":
            return self.courses_page(sid, q.get("msg", ""), q.get("ok") == "1", q.get("ref", ""))
        if path == "/timetable":
            return self.timetable_page(sid, q.get("msg", ""))
        self.send("<p>Not found</p>", status=404)

    def do_POST(self):
        path = urlparse(self.path).path
        f = self.form()
        if path == "/login":
            return self.do_login(f)
        sid = self.student()
        if not sid:
            return self.redirect("/login")
        if path == "/register":
            ok, msg, ref = register(sid, f.get("code", ""))
            if self.headers.get("Accept") == "text/plain":  # used by the load-test script
                data = f"{'OK' if ok else 'REJECTED'}|{msg}|{ref or ''}".encode()
                self.send_response(200 if ok else 409)
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
                return
            return self.courses_page(sid, msg, ok, ref or "")
        if path == "/drop":
            code = f.get("code", "")
            msg = f"{code} dropped. Your seat has been released." if drop(sid, code) else f"You are not registered for {code}."
            return self.timetable_page(sid, msg)
        self.send("<p>Not found</p>", status=404)

    def do_login(self, f):
        sid, pw = f.get("student_id", "").strip().upper(), f.get("password", "")
        con = db()
        row = con.execute("SELECT * FROM students WHERE id=?", (sid,)).fetchone()
        try:
            if not sid or not pw:
                return self.login_page("Student ID and password are required.")
            if not row:
                return self.login_page("Invalid student ID or password.")
            if row["locked"]:
                return self.login_page("Account locked after 3 failed attempts. Contact the Registry.")
            if row["password"] != pw:
                failed = row["failed"] + 1
                con.execute("UPDATE students SET failed=?, locked=? WHERE id=?",
                            (failed, int(failed >= MAX_FAILED_LOGINS), sid))
                con.commit()
                if failed >= MAX_FAILED_LOGINS:
                    return self.login_page("Account locked after 3 failed attempts. Contact the Registry.")
                return self.login_page(f"Invalid student ID or password. {MAX_FAILED_LOGINS - failed} attempt(s) left.")
            con.execute("UPDATE students SET failed=0 WHERE id=?", (sid,))
            con.commit()
            token = secrets.token_hex(16)
            SESSIONS[token] = sid
            return self.redirect("/courses", f"sid={token}; HttpOnly; Path=/")
        finally:
            con.close()

    def courses_page(self, sid, msg="", ok=False, ref=""):
        con = db()
        rows = con.execute("SELECT c.*, (SELECT COUNT(*) FROM enrolments e WHERE e.code=c.code) taken, "
                           "(SELECT COUNT(*) FROM enrolments e WHERE e.code=c.code AND e.student_id=?) mine "
                           "FROM courses c ORDER BY code", (sid,)).fetchall()
        con.close()
        m = ""
        if msg:
            extra = f' Reference: <b id="ref">{ref}</b> at {now()}.' if ok and ref else ""
            m = f'<div class="msg {"ok" if ok else "err"}" id="message">{html.escape(msg)}{extra}</div>'
        trs = "".join(
            f'<tr id="row-{r["code"]}"><td>{r["code"]}</td><td>{html.escape(r["name"])}</td><td>{r["credits"]}</td>'
            f'<td>{r["day"]} {r["start"]}-{r["end"]}</td><td>{r["venue"]}</td>'
            f'<td class="seats">{r["taken"]}/{r["capacity"]}</td><td>'
            + ("Registered" if r["mine"] else
               f'<form class="inline" method="post" action="/register"><input type="hidden" name="code" value="{r["code"]}">'
               f'<button id="reg-{r["code"]}">Register</button></form>')
            + "</td></tr>" for r in rows)
        self.send(f"""<h2>Available Courses (Semester Oct 2026)</h2>{m}<table><tr><th>Code</th><th>Course</th>
            <th>Credits</th><th>Schedule</th><th>Venue</th><th>Seats</th><th>Action</th></tr>{trs}</table>""", "Courses")

    def timetable_page(self, sid, msg=""):
        con = db()
        rows = con.execute("SELECT c.* FROM enrolments e JOIN courses c ON c.code=e.code WHERE e.student_id=?",
                           (sid,)).fetchall()
        con.close()
        order = {d: i for i, d in enumerate(["Mon", "Tue", "Wed", "Thu", "Fri"])}
        rows = sorted(rows, key=lambda r: (order[r["day"]], r["start"]))
        m = f'<div class="msg ok" id="message">{html.escape(msg)}</div>' if msg else ""
        trs = "".join(
            f'<tr id="tt-{r["code"]}"><td>{r["day"]}</td><td>{r["start"]}-{r["end"]}</td><td>{r["code"]}</td>'
            f'<td>{html.escape(r["name"])}</td><td>{r["venue"]}</td><td>{r["credits"]}</td>'
            f'<td><form class="inline" method="post" action="/drop"><input type="hidden" name="code" value="{r["code"]}">'
            f'<button id="drop-{r["code"]}">Drop</button></form></td></tr>' for r in rows)
        total = sum(r["credits"] for r in rows)
        empty = "" if rows else '<tr><td colspan="7">No registered courses.</td></tr>'
        self.send(f"""<h2>My Timetable</h2>{m}<table><tr><th>Day</th><th>Time</th><th>Code</th><th>Course</th>
            <th>Venue</th><th>Credits</th><th>Action</th></tr>{trs}{empty}</table>
            <p id="total">Total credits: {total} / {MAX_CREDITS}</p>""", "Timetable")


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    init_db()
    print(f"UniReg running on http://localhost:{port}")
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
