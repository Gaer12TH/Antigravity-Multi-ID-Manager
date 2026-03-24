import urllib.request
import urllib.error
import ssl
import json
import sqlite3

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

db_path = r"C:\Users\Gman\AppData\Roaming\Antigravity\User\globalStorage\state.vscdb"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def get_token(query_key):
    cursor.execute("SELECT value FROM ItemTable WHERE key = ?", (query_key,))
    row = cursor.fetchone()
    if row:
        val = row[0]
        try:
            return json.loads(val).get("apiKey", val)
        except json.JSONDecodeError:
            return val
    return None

google_token = get_token('antigravityAuthStatus')

urls = [
    "https://api2.cursor.sh/exa.language_server_pb.LanguageServerService/GetUserStatus",
    "https://api3.cursor.sh/exa.language_server_pb.LanguageServerService/GetUserStatus"
]

for url in urls:
    req = urllib.request.Request(url, method="POST")
    req.add_header("Authorization", f"Bearer {google_token}")
    req.add_header("Content-Type", "application/connect+json")
    req.add_header("x-cursor-client-version", "0.45.0")
    req.data = b"{}"

    try:
        resp = urllib.request.urlopen(req, context=ctx)
        print(f"[SUCCESS] {url}")
        print(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"[HTTP {e.code}] {url}")
        print(e.read().decode('utf-8'))
    except Exception as e:
        print(f"[ERROR] {e}")

conn.close()
