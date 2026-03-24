# Antigravity Multi-ID Manager

A comprehensive dashboard to manage multiple AI accounts (Antigravity), monitor quotas, and track credits in a centralized interface.

## ✨ Key Features
- **Account & Token Management**: Easily add, view, and remove accounts and their respective tokens.
- **Quota Tracking**: Monitor remaining usage quotas and daily reset times in real time.
- **Automated Token Extraction**: Includes a GUI application (`AntigravityTokenApp.py`) to automatically pull the active token from your VS Code Antigravity session.
- **Hybrid Architecture**: Features an API structure that supports both a Local Development Server (Node.js) and production deployment on Vercel (Serverless Functions).

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS 4, Lucide React
- **Backend / Database**: Vercel KV (Redis), Vercel Serverless Functions
- **Local Dev Server**: Node.js (`server.js`)
- **Utility Scripts**: Python scripts for automated token extraction and testing.

## 🚀 Getting Started

### 1. Environment Variables Setup
Create a `.env` file in the root directory to connect to Vercel KV:
```env
KV_REST_API_URL="your_vercel_kv_url"
KV_REST_API_TOKEN="your_vercel_kv_token"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Running the Local Project
Start the local API Server (simulates Vercel KV serverless functions):
```bash
npm run dev:api
```

Start the Frontend (React/Vite):
```bash
npm run dev
```

### 4. Fetching the Active Token
This project comes with `AntigravityTokenApp.py` which opens a GUI window to automatically locate and fetch your token from the local VS Code Antigravity database (`globalStorage/state.vscdb`), allowing you to instantly copy it.

```bash
python AntigravityTokenApp.py
```
*\* You can also run the provided `GetToken.bat` shortcut to instantly launch the app.*

## 📁 Project Structure & Useful Scripts
- `src/` - React frontend source code and UI components.
- `api/` - API Routes for adding/removing accounts and quota refreshing (integrates with Vercel Serverless).
- `server.js` - Local dev server simulating Vercel Serverless Functions locally.
- `AntigravityTokenApp.py` - Token copy GUI application.
- `test-quota.py` - Script for testing quota retrieval.
- `test_refresh.cjs` - Script for testing API calls related to data refreshing.
- `dump_keys.py` / `print_token.py` - Additional utility scripts related to token inspection.
