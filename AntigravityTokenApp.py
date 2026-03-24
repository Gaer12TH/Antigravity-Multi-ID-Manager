import sqlite3
import json
import tkinter as tk
from tkinter import messagebox

def get_token():
    db_path = r"C:\Users\Gman\AppData\Roaming\Antigravity\User\globalStorage\state.vscdb"
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM ItemTable WHERE key = 'antigravityAuthStatus'")
        row = cursor.fetchone()
        conn.close()
        
        if row:
            val = row[0]
            auth_data = json.loads(val)
            return auth_data.get("apiKey", "")
        return "Not found"
    except Exception as e:
        return f"Error: {str(e)}"

def copy_to_clipboard():
    root.clipboard_clear()
    root.clipboard_append(token_text.get("1.0", tk.END).strip())
    root.update()
    
    # Change button text temporarily
    orig_text = copy_btn['text']
    copy_btn.config(text="✔ Copied to Clipboard!", bg="#10b981")
    root.after(2000, lambda: copy_btn.config(text=orig_text, bg="#3b82f6"))

# ---- UI Setup ----
root = tk.Tk()
root.title("Antigravity Token Extractor")
root.geometry("540x260")
root.configure(bg="#0a0a0a")
root.resizable(False, False)

# Window Icon (Optional, fallback to default)
try:
    root.iconbitmap(default='')
except:
    pass

# Header
header = tk.Label(root, text="Antigravity Access Token", font=("Segoe UI", 14, "bold"), fg="#ffffff", bg="#0a0a0a")
header.pack(pady=(20, 5))

desc = tk.Label(root, text="คลิกปุ่ม Copy ด้านล่างเพื่อนำ Token ไปใส่ในหน้า Dashboard", font=("Segoe UI", 9), fg="#a3a3a3", bg="#0a0a0a")
desc.pack(pady=(0, 15))

# Token Display Box
token = get_token()

token_text = tk.Text(root, height=4, width=60, font=("Consolas", 10), bg="#171717", fg="#34d399", wrap="char", bd=0, padx=10, pady=10)
token_text.pack(padx=20)
token_text.insert(tk.END, token)
token_text.config(state=tk.DISABLED) # Make read-only

# Copy Button
copy_btn = tk.Button(root, text="📋 Copy Token", font=("Segoe UI", 10, "bold"), bg="#3b82f6", fg="#ffffff", 
                     activebackground="#2563eb", activeforeground="#ffffff",
                     command=copy_to_clipboard, relief="flat", cursor="hand2", padx=20, pady=6)
copy_btn.pack(pady=20)

# Center Window on Screen
root.eval('tk::PlaceWindow . center')

root.mainloop()
