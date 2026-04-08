# 🚀 Antigravity Multi-ID Quota Dashboard

**A high-performance, fully native quota tracking dashboard for Antigravity AI.**

![Version](https://img.shields.io/badge/version-1.0.5-blue)
![VS Code](https://img.shields.io/badge/VS%20Code-1.85+-green)
![Status](https://img.shields.io/badge/status-Standalone-success)

## 🌟 Overview

**Antigravity Multi-ID Quota** is a fully decoupled extension designed to monitor your AI coding assistant quota usage in real-time. Moving away from third-party toolkit dependencies, this extension now implements a highly efficient native process scanner that monitors the IDE's internal state—delivering instant, accurate quota updates directly into your workflow.

## ✨ Key Features

### 🔌 Native Decoupled Architecture
- **Standalone Operation:** Completely eliminates the need for the *"Toolkit for Antigravity"* extension.
- **Process Scanning:** Dynamically detects running Antigravity Language Server instances to extract runtime ports and CSRF tokens directly from process arguments.
- **Direct API Integration:** Communicates natively with the IDE's internal API for zero-latency quota fetching.

### 📊 Comprehensive Dashboard
- **Real-Time Data Visualization:** Circular usage gauges and dynamic progress bars.
- **7-Day Historical Analytics:** Track model usage over time with detailed charts.
- **Model-Specific Breakdowns:** Detailed insights for Gemini, Claude, and other AI models.
- **Interactive UI:** A highly polished webview with a responsive and accessible interface.

### 🔔 Smart Monitoring & Notifications
- **Status Bar Integration:** Persistent, color-coded indicators (Green → Yellow → Red) detailing token counts and request limits.
- **Customizable Alerts:** Set personal thresholds for warning (default: 70%) and critical (default: 90%) usage.
- **Auto-Refresh Core:** Silently polling system data every 30 seconds to assure data accuracy without performance overhead.

## 🛠 Installation

### Building from Source (.vsix)
```bash
git clone https://github.com/ManaphatDev/Antigravity-Multi-ID-Quota.git
cd Antigravity-Multi-ID-Quota
npm install
npm run compile
npx vsce package
```
Then install the generated `.vsix` file directly within your VS Code / Antigravity workspace.

### Developer Mode
```bash
cd Antigravity-Multi-ID-Quota
npm install
npm run watch
# Press F5 to trigger the Extension Development Host
```

## 💻 Commands Reference

| Command | Action |
|---------|-------------|
| `AGQ: Open Quota Dashboard` | Launch the interactive main dashboard panel |
| `AGQ: Refresh Quota` | Force an immediate synchronization with internal APIs |

## ⚙️ Configuration Settings

Access these settings via `settings.json` under the `agq.*` namespace.

| Property | Default | Description |
|----------|---------|-------------|
| `quotaLimit` | `1500` | Max daily request threshold |
| `tokenLimit` | `1000000` | Max daily token allocation |
| `refreshInterval` | `30` | Auto-refresh background polling interval (seconds) |
| `warningThreshold` | `70` | Warning alert trigger percentage |
| `criticalThreshold`| `90` | Critical alert trigger percentage |
| `showTokens` | `true` | Display token accumulation in the Status Bar |
| `statusBarPosition`| `right` | Customize where the indicator appears |
| `enableNotifications` | `true` | Toggle all threshold push notifications |

## 🧠 Architectural Insights

How does it work? 
Our refactored `QuotaManager` operates entirely independently. It invokes system-level process monitors to read the exact execution parameters of your IDE's language servers. By parsing command-line metrics, it dynamically builds authorized headers and reaches out to internal communication ports to extract quota limits without relying on explicit disk-logging. This provides an infinitely more stable, secure, and rapid ecosystem for quota tracking!

## 📜 License

MIT © Antigravity
