"""Small helpers shared by the group's test scripts (Python standard library only).

- start_app(): starts UniReg on a free port with a fresh database, returns (base_url, stop()).
- Student: one logged-in browser-like session (keeps its own cookie).
"""
import http.cookiejar
import os
import re
import socket
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def start_app(app="app.py"):
    """Start a fresh copy of UniReg. Every call gets a brand-new database."""
    port = free_port()
    db = os.path.join(tempfile.mkdtemp(prefix="unireg-"), "test.db")
    env = dict(os.environ, UNIREG_DB=db)
    proc = subprocess.Popen([sys.executable, os.path.join(ROOT, app), str(port)], env=env,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    base = f"http://127.0.0.1:{port}"
    for _ in range(100):
        try:
            urllib.request.urlopen(base + "/login", timeout=1)
            break
        except OSError:
            time.sleep(0.05)
    else:
        proc.kill()
        raise RuntimeError("UniReg did not start")

    def stop():
        proc.kill()
        proc.wait()

    return base, stop, db


class Student:
    def __init__(self, base):
        self.base = base
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def get(self, path):
        with self.opener.open(self.base + path, timeout=30) as r:
            return r.geturl(), r.read().decode()

    def post(self, path, **form):
        data = urllib.parse.urlencode(form).encode()
        with self.opener.open(self.base + path, data=data, timeout=30) as r:
            return r.geturl(), r.read().decode()

    def login(self, student_id, password="Pass@123"):
        url, page = self.post("/login", student_id=student_id, password=password)
        return url.endswith("/courses"), message(page)

    def register(self, code):
        t0 = time.perf_counter()
        _, page = self.post("/register", code=code)
        secs = time.perf_counter() - t0
        return 'class="msg ok"' in page, message(page), secs

    def drop(self, code):
        _, page = self.post("/drop", code=code)
        return message(page)

    def seats(self, code):
        _, page = self.get("/courses")
        m = re.search(rf'id="row-{code}".*?class="seats">(\d+)/(\d+)<', page, re.S)
        return (int(m.group(1)), int(m.group(2))) if m else None

    def timetable(self):
        _, page = self.get("/timetable")
        rows = re.findall(r'<tr id="tt-([A-Z0-9]+)"><td>(\w+)</td><td>([\d:]+-[\d:]+)</td>', page)
        total = re.search(r"Total credits: (\d+)", page)
        return rows, int(total.group(1)) if total else None


def message(page):
    m = re.search(r'id="message">(.*?)</div>', page, re.S)
    return re.sub(r"<[^>]+>", "", m.group(1)).strip() if m else ""
