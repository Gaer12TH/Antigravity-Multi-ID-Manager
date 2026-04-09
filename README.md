# 🚀 Antigravity Multi-ID Quota Dashboard

**Monitor your Antigravity AI quota usage in real-time — fully standalone, no dependencies required.**

![Version](https://img.shields.io/badge/version-1.0.9-blue)
![VS Code](https://img.shields.io/badge/VS%20Code-1.85+-green)
![License](https://img.shields.io/badge/license-MIT-success)
![Status](https://img.shields.io/badge/status-Standalone-blueviolet)

---

## 🌟 Overview

**Antigravity Multi-ID Quota** is a lightweight, fully self-contained VS Code extension that tracks your AI coding assistant quota in real-time.

It works by scanning running **Antigravity Language Server** processes, extracting their internal ports and CSRF tokens, and fetching live quota data directly from the IDE's internal API — no third-party extensions or log files needed.

---

## ✨ Features

### 🔌 Native Process Scanner
- Detects all running Antigravity Language Server instances automatically
- Extracts runtime port and CSRF token directly from process arguments
- Communicates with the IDE internal API over HTTP/HTTPS

### 📊 Multi-Account Dashboard
- Supports **multiple accounts simultaneously** — each account gets its own tab
- Displays live **quota percentage** per AI model with circular gauges
- Shows **prompt credits** and **flow credits** usage (when available)
- Displays raw **tier name** from API (e.g. `TEAMS_TIER_PRO`, `Google AI Pro`)
- Shows **reset time** countdown per model

### 🔔 Status Bar Integration
- Color-coded indicator: 🟢 Green → 🟡 Yellow → 🔴 Red based on usage
- Auto-refreshes every **15 seconds** in the background

### 🗂 Sidebar Panel
- Lightweight sidebar view for quick overview without opening the full dashboard

---

## 🛠 Installation

### From `.vsix` (Recommended)
1. Download the latest `.vsix` from [Releases](https://github.com/ManaphatDev/Antigravity-Multi-ID-Quota/releases)
2. In VS Code: `Extensions` → `...` → `Install from VSIX...`

### Build from Source
```bash
git clone https://github.com/ManaphatDev/Antigravity-Multi-ID-Quota.git
cd Antigravity-Multi-ID-Quota
npm install
npm run package
```
Then install the generated `.vsix` file in your VS Code / Antigravity workspace.

---

## 💻 Commands

| Command | Description |
|---|---|
| `AGQ: Open Quota Dashboard` | Open the full multi-account dashboard |
| `AGQ: Refresh Quota` | Force an immediate data refresh |

---

## ⚙️ Settings

Configure via `settings.json` under the `agq.*` namespace:

| Property | Default | Description |
|---|---|---|
| `agq.refreshInterval` | `30` | Auto-refresh interval in seconds |
| `agq.warningThreshold` | `70` | Usage % to show warning (yellow) |
| `agq.criticalThreshold` | `90` | Usage % to show critical (red) |
| `agq.showTokens` | `true` | Show token usage in status bar |
| `agq.statusBarPosition` | `right` | Status bar position (`left` / `right`) |
| `agq.enableNotifications` | `true` | Enable threshold notifications |

---

## 🧠 How It Works

1. **Process Scan** — Runs `netstat` + `wmic` to find Antigravity Language Server processes
2. **Token Extraction** — Parses `--csrf_token` from process command-line arguments
3. **API Fetch** — Calls `GetUserStatus` on the internal language server port
4. **Data Parsing** — Extracts quota, model usage, credits, and tier info from the JSON response
5. **Live Update** — Fires events to refresh the dashboard and sidebar automatically

---

## 📋 Requirements

- VS Code `1.85+` or Antigravity IDE
- Antigravity Language Server must be running (i.e., you are logged in and using the IDE)
- Windows OS (uses `netstat` + `wmic` for process scanning)

---

## 📜 License

MIT © [ManaphatDev](https://github.com/ManaphatDev)
