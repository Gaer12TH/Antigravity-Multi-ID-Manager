import sqlite3
import json
import base64
import re

db_path = r"C:\Users\Gman\AppData\Roaming\Antigravity\User\globalStorage\state.vscdb"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT value FROM ItemTable WHERE key = 'antigravityAuthStatus'")
row = cursor.fetchone()

if row:
    val = row[0]
    auth_data = json.loads(val)
    token = auth_data.get("apiKey", "")
    print(f"Here is your Antigravity (Google) Token: \n{token}\n")

cursor.execute("SELECT value FROM ItemTable WHERE key = 'cursorAuthToken'")
row2 = cursor.fetchone()
if row2:
    print(f"Here is your Cursor Token: \n{row2[0]}\n")

conn.close()
