"""Real Firefox acceptance checks via its built-in Marionette protocol; stdlib only.

Run from the repository root: python3 scripts/verify-browser.py
Requires local MongoDB, Firefox, and installed server/client dependencies.
Creates a unique DB, isolated app ports, and ignored Firefox profiles. Never deletes data.
"""
import atexit
import base64
import hashlib
import hmac
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
RUN = str(int(time.time())) + "_" + secrets.token_hex(4)
WORK = ROOT / ".release-check" / ("browser_" + RUN)
WORK.mkdir(parents=True)
DATABASE = "messenger_ia06_browser_" + RUN
PASSWORD = secrets.token_hex(16)
CHILDREN = []
LOGS = []


def free_port():
    with socket.socket() as server:
        server.bind(("127.0.0.1", 0))
        return server.getsockname()[1]


def start(args, cwd, env, name):
    log = (WORK / (name + ".log")).open("wb")
    LOGS.append(log)
    child = subprocess.Popen(args, cwd=cwd, env={**os.environ, **env}, stdout=log, stderr=log)
    CHILDREN.append(child)
    return child


def cleanup():
    for child in reversed(CHILDREN):
        if child.poll() is None:
            child.terminate()
            try:
                child.wait(timeout=5)
            except subprocess.TimeoutExpired:
                child.kill()
                child.wait(timeout=5)
    for log in LOGS:
        log.close()


atexit.register(cleanup)


def wait_for(check, description, timeout=20):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            value = check()
            if value:
                return value
        except (OSError, AssertionError):
            pass
        time.sleep(0.1)
    raise AssertionError("Timed out: " + description)


class Browser:
    def __init__(self, name):
        profile = WORK / name
        profile.mkdir()
        port = free_port()
        (profile / "user.js").write_text(
            f'user_pref("marionette.port", {port});\n'
            'user_pref("browser.shell.checkDefaultBrowser", false);\n'
            'user_pref("browser.startup.homepage_override.mstone", "ignore");\n'
        )
        self.child = start(["firefox", "--headless", "--no-remote", "--profile", str(profile), "--marionette"], ROOT, {}, name)
        self.connection = wait_for(lambda: socket.create_connection(("127.0.0.1", port), timeout=1), "Firefox " + name)
        self.connection.settimeout(20)
        self.number = 0
        self.read()
        self.command("WebDriver:NewSession", {"capabilities": {"alwaysMatch": {"acceptInsecureCerts": False}}})
        self.command("WebDriver:SetTimeouts", {"script": 10000, "pageLoad": 20000, "implicit": 0})
        self.command("WebDriver:Navigate", {"url": BASE})
        self.wait_text("Log in")

    def read(self):
        size = b""
        while True:
            char = self.connection.recv(1)
            if not char:
                raise AssertionError("Firefox control connection ended")
            if char == b":":
                break
            size += char
        remaining = int(size)
        data = b""
        while remaining:
            chunk = self.connection.recv(remaining)
            if not chunk:
                raise AssertionError("Firefox control connection ended")
            data += chunk
            remaining -= len(chunk)
        return json.loads(data)

    def command(self, name, parameters):
        self.number += 1
        payload = json.dumps([0, self.number, name, parameters]).encode()
        self.connection.sendall(str(len(payload)).encode() + b":" + payload)
        reply = self.read()
        if reply[2]:
            # Error messages are kept short; never echo arguments containing credentials.
            raise AssertionError("Firefox command failed: " + name + ": " + reply[2].get("error", "unknown"))
        return reply[3]

    def script(self, script, args=None, asynchronous=False):
        result = self.command("WebDriver:ExecuteAsyncScript" if asynchronous else "WebDriver:ExecuteScript", {
            "script": script, "args": args or [], "newSandbox": False,
        })
        return result.get("value") if isinstance(result, dict) and "value" in result else result

    def text(self):
        return self.script("return document.body.innerText")

    def wait_text(self, value):
        return wait_for(lambda: value in self.text(), "browser text: " + value)

    def click(self, label):
        found = self.script("const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===arguments[0]); if(!b || b.disabled)return false; b.click(); return true", [label])
        assert found, "Button unavailable: " + label

    def fill(self, element_id, value):
        assert self.script("const e=document.getElementById(arguments[0]); if(!e)return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,arguments[1]); e.dispatchEvent(new Event('input',{bubbles:true})); return true", [element_id, value])

    def register(self, name):
        self.click("Create an account")
        self.fill("username", name)
        self.fill("password", PASSWORD)
        self.click("Register")
        self.wait_text("Account created.")
        self.login(name)

    def login(self, name):
        self.fill("username", name)
        self.fill("password", PASSWORD)
        self.click("Log in")
        self.wait_text("Logged in as " + name)

    def select(self, text):
        wait_for(lambda: self.script("const b=[...document.querySelectorAll('li button')].find(b=>b.textContent.includes(arguments[0])); if(!b)return false; b.click(); return true", [text]), "conversation " + text)
        self.wait_text("Live connection: live")
        wait_for(lambda: "Loading messages..." not in self.text(), "history loaded")

    def send(self, content):
        self.fill("message-content", content)
        self.click("Send")
        self.wait_text(content)
        self.wait_text("Sent — saved by the server.")

    def refresh_list(self):
        wait_for(lambda: self.script("const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Refresh conversations'); if(!b || b.disabled)return false; b.click(); return true"), "refresh conversation list")

    def denied(self, name, conversation_id):
        return self.script("""
          const [name,password,id,done]=arguments;
          (async()=>{
            const login=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:name,password})});
            const {token}=await login.json();
            const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
            const read=await fetch(`/api/conversations/${id}/messages`,{headers});
            const write=await fetch(`/api/conversations/${id}/messages`,{method:'POST',headers,body:JSON.stringify({content:'forbidden'})});
            return {read:read.status,write:write.status};
          })().then(done).catch(()=>done({error:'Unauthorized-access check could not execute'}));
        """, [name, PASSWORD, conversation_id], asynchronous=True)


API_PORT = free_port()
CLIENT_PORT = free_port()
BASE = f"http://127.0.0.1:{CLIENT_PORT}"
SERVER_ENV = {
    "PORT": str(API_PORT), "MONGO_URI": f"mongodb://127.0.0.1:{os.environ.get('MESSENGER_TEST_MONGO_PORT', '27017')}/{DATABASE}",
    "JWT_SECRET": secrets.token_hex(32), "NODE_ENV": "test",
}
backend = start(["node", "index.js"], ROOT / "server", SERVER_ENV, "backend")
wait_for(lambda: urllib.request.urlopen(f"http://127.0.0.1:{API_PORT}/health", timeout=1).status == 200, "isolated backend")
start(["node", "node_modules/vite/bin/vite.js"], ROOT / "client", {
    "MESSENGER_API_PORT": str(API_PORT), "MESSENGER_CLIENT_PORT": str(CLIENT_PORT),
}, "vite")
wait_for(lambda: urllib.request.urlopen(BASE, timeout=1).status == 200, "isolated Vite")
print("Disposable browser database:", DATABASE, flush=True)
browsers = {}
for name in ["alice", "bob", "carol", "dave"]:
    browsers[name] = Browser(name)
    browsers[name].register(name)
    print("PASS browser registration/login:", name, flush=True)

alice, bob, carol, dave = [browsers[name] for name in ["alice", "bob", "carol", "dave"]]
alice.fill("invitees", "bob")
alice.click("Create conversation")
alice.wait_text("Conversation created.")
alice.wait_text("Live connection: live")
bob.refresh_list()
bob.select("direct")
direct_id = alice.script("return [...document.querySelectorAll('li button')].find(b=>b.textContent.includes('direct')).parentElement.textContent")
# Obtain IDs from browser-observed history requests, without asking users to enter IDs.
direct_id = alice.script("return performance.getEntriesByType('resource').map(e=>e.name).find(n=>/conversations\\/[^/]+\\/messages/.test(n))?.match(/conversations\\/([^/]+)\\/messages/)[1]")
assert direct_id
alice.send("IA06 Alice direct live")
bob.wait_text("IA06 Alice direct live")
bob.send("IA06 Bob direct reply")
alice.wait_text("IA06 Bob direct reply")
bob.script("const e=document.getElementById('message-transport');e.value='socket';e.dispatchEvent(new Event('change',{bubbles:true}))")
bob.send("IA06 browser Socket.IO send")
alice.wait_text("IA06 browser Socket.IO send")
for browser in [alice, bob]:
    assert browser.script("return [...document.querySelectorAll('section li')].filter(e=>e.textContent.includes('IA06 browser Socket.IO send')).length") == 1
print("PASS scenarios 1/2: independent Firefox profiles exchange live messages", flush=True)

bob.click("Log out")
bob.wait_text("Log in")
alice.send("IA06 while Bob logged out")
bob.login("bob")
bob.select("direct")
bob.wait_text("IA06 while Bob logged out")
print("PASS scenario 3: logout, missed message, login, persistent recovery", flush=True)

# Reselecting the current conversation must preserve history and avoid stuck loading.
bob.select("direct")
bob.wait_text("IA06 while Bob logged out")
alice.script("const e=document.getElementById('conversation-type');e.value='group';e.dispatchEvent(new Event('change',{bubbles:true}))")
alice.fill("invitees", "bob, carol")
alice.fill("group-name", "IA06 Browser Group")
alice.click("Create conversation")
alice.wait_text("IA06 Browser Group")
alice.wait_text("Live connection: live")
alice.send("IA06 group activity notice")
for browser in [bob, carol]:
    browser.wait_text("New message in")
assert "IA06 group activity notice" not in bob.text()
print("PASS transient activity notice while another conversation is open", flush=True)
for browser in [bob, carol]:
    browser.refresh_list()
    browser.select("IA06 Browser Group")
for name, browser in [("Alice", alice), ("Bob", bob), ("Carol", carol)]:
    browser.send("IA06 group from " + name)
    for member in [alice, bob, carol]:
        member.wait_text("IA06 group from " + name)
group_id = alice.script("return performance.getEntriesByType('resource').map(e=>e.name).filter(n=>/conversations\\/[^/]+\\/messages/.test(n)).at(-1)?.match(/conversations\\/([^/]+)\\/messages/)[1]")
assert group_id and group_id != direct_id
dave.refresh_list()
assert "IA06 Browser Group" not in dave.text()
assert dave.denied("dave", group_id) == {"read": 404, "write": 404}
print("PASS scenario 4: browser-created group, all three contribute/read; unrelated Dave denied HTTP access", flush=True)
assert carol.denied("carol", direct_id) == {"read": 404, "write": 404}
assert dave.denied("dave", direct_id) == {"read": 404, "write": 404}
print("PASS scenario 5: unrelated browser users rejected by private HTTP API", flush=True)
print("PASS browser reselection regression; no manual observations inferred from API tests", flush=True)

# Observe real backend connectivity loss, preserving the unsent draft, then recovery.
backend.terminate()
backend.wait(timeout=5)
alice.fill("message-content", "IA06 outage draft")
alice.click("Send")
alice.wait_text("Delivery is unconfirmed")
assert alice.script("return document.getElementById('message-content').value") == "IA06 outage draft"
assert alice.script("return [...document.querySelectorAll('section li')].some(e=>e.textContent.includes('IA06 outage draft'))") is False
backend = start(["node", "index.js"], ROOT / "server", SERVER_ENV, "backend-restarted")
wait_for(lambda: urllib.request.urlopen(f"http://127.0.0.1:{API_PORT}/health", timeout=1).status == 200, "restarted isolated backend")
alice.wait_text("Live connection: live")
alice.wait_text("IA06 group from Carol")
print("PASS browser backend outage: no false success, draft retained, reconnect/history restored", flush=True)

# Replace only this disposable browser's next login response with a short-lived test JWT.
# The default backend policy remains eight hours. No key/token is printed or persisted.
alice_id = alice.script("""
  const [password,done]=arguments;
  fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'alice',password})})
    .then(r=>r.json()).then(data=>done(data.user.id));
""", [PASSWORD], asynchronous=True)
alice.click("Log out")
alice.wait_text("Log in")
encode = lambda value: base64.urlsafe_b64encode(json.dumps(value, separators=(",", ":")).encode()).rstrip(b"=")
unsigned = encode({"alg": "HS256", "typ": "JWT"}) + b"." + encode({
    "sub": alice_id, "iss": "messenger-api", "aud": "messenger-client", "exp": int(time.time()) + 8,
})
signature = base64.urlsafe_b64encode(hmac.new(SERVER_ENV["JWT_SECRET"].encode(), unsigned, hashlib.sha256).digest()).rstrip(b"=")
short_token = (unsigned + b"." + signature).decode()
alice.script("""
  const testToken=arguments[0],original=window.fetch;
  window.fetch=async(...args)=>{
    const response=await original(...args);
    if(args[0]==='/api/auth/login' && response.ok){
      window.fetch=original;
      const data=await response.json();data.token=testToken;
      return new Response(JSON.stringify(data),{status:response.status});
    }
    return response;
  };
""", [short_token])
alice.login("alice")
alice.wait_text("Session expired or ended by the server")
assert "Logged in as alice" not in alice.text()
assert alice.script("return document.getElementById('message-content')") is None
print("PASS browser JWT expiry: login restored and private composer/history cleared", flush=True)
print("Firefox profiles/logs retained under", WORK.relative_to(ROOT), flush=True)
