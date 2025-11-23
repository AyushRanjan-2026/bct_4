# VS Code Setup Guide - Windows PowerShell Commands

## ⚠️ IMPORTANT: Node.js Version
**You MUST use Node.js 20** (NOT 22 or higher)
- Check version: `node --version` (must show v20.x.x)
- If you need to install Node.js 20, download from: https://nodejs.org/

---

## 📋 First Time Setup (One-Time Only)

### Step 1: Install Dependencies

**Terminal 1: Root Dependencies**
```powershell
cd "D:\Downloads\bct1-main (1)\bct1-main"
npm install
```

**Terminal 2: Backend Dependencies**
```powershell
cd "D:\Downloads\bct1-main (1)\bct1-main\backend"
npm install
```

**Terminal 3: Frontend Dependencies**
```powershell
cd "D:\Downloads\bct1-main (1)\bct1-main\frontend"
npm install
```

### Step 2: Install IPFS (if not installed)
Download and install IPFS from: https://docs.ipfs.tech/install/command-line/#windows
Or use: `choco install ipfs` (if you have Chocolatey)

---

## 🚀 Running the Project (Every Time)

### Open 5 Terminals in VS Code:
1. Press `` Ctrl+` `` (backtick) to open terminal
2. Click the **"+"** button or press `` Ctrl+Shift+` `` to create new terminals
3. Create **5 terminals total**

---

### Terminal 1: Start IPFS
```powershell
ipfs daemon
```
**Wait for:** "Daemon is ready"

---

### Terminal 2: Start Hardhat Node
```powershell
cd "D:\Downloads\bct1-main (1)\bct1-main"
npm run node
```
**Wait for:** "Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/"
**⚠️ Keep this terminal running!**

---

### Terminal 3: Deploy Contracts
**Wait for Terminal 2 to show "Started HTTP..." before running this:**
```powershell
cd "D:\Downloads\bct1-main (1)\bct1-main"
npm run deploy
```
**Wait for:** "Deployment addresses saved to deployments.json"

---

### Terminal 4: Start Backend Server
```powershell
cd "D:\Downloads\bct1-main (1)\bct1-main\backend"
npm start
```
**Wait for:**
- ✅ "Veramo database initialized"
- ✅ "Veramo agent initialized"
- ✅ "Backend server running on http://localhost:3001"

---

### Terminal 5: Start Frontend
```powershell
cd "D:\Downloads\bct1-main (1)\bct1-main\frontend"
npm run dev
```
**Wait for:** "Local: http://localhost:5173"

---

## ✅ Verification

### Test Backend Health:
```powershell
curl http://localhost:3001/health
```
**Expected:** `{"status":"ok","timestamp":"..."}`

### Test DID Creation:
```powershell
curl -X POST http://localhost:3001/did/create
```
**Expected:** `{"did":"did:key:...","success":true}`

### Open Frontend in Browser:
Navigate to: **http://localhost:5173**

---

## 🔧 Troubleshooting

### Port Already in Use?
```powershell
# Find and kill processes on specific ports
netstat -ano | findstr :5001  # IPFS
netstat -ano | findstr :8545   # Hardhat
netstat -ano | findstr :3001   # Backend
netstat -ano | findstr :5173   # Frontend

# Kill process by PID (replace <PID> with actual process ID)
taskkill /PID <PID> /F
```

### Node.js Version Wrong?
```powershell
node --version
# Must show: v20.x.x
# If not, download Node.js 20 from nodejs.org
```

### Backend Errors?
```powershell
# Clean database and restart
cd "D:\Downloads\bct1-main (1)\bct1-main\backend"
Remove-Item -Force veramo.sqlite, veramo.sqlite-journal -ErrorAction SilentlyContinue
npm start
```

### Missing Dependencies?
```powershell
# Reinstall all dependencies
cd "D:\Downloads\bct1-main (1)\bct1-main"
npm install
cd backend
npm install
cd ../frontend
npm install
```

### Contracts Not Deployed?
```powershell
cd "D:\Downloads\bct1-main (1)\bct1-main"
npm run compile
npm run deploy
```

---

## 📝 Quick Reference

### Ports Used:
- **3001**: Backend API
- **5173**: Frontend (Vite)
- **8545**: Hardhat RPC
- **5001**: IPFS API

### Key Files:
- `deployments.json`: Contract addresses
- `backend/veramo.sqlite`: Veramo database
- `backend/vc-store.json`: VC storage
- `backend/policy-requests.json`: Policy requests

---

## 🛑 Stopping All Services

Press `Ctrl+C` in each terminal window, or:

```powershell
# Kill all Node processes (be careful - this kills ALL node processes)
Get-Process node | Stop-Process -Force

# Kill IPFS
Get-Process ipfs | Stop-Process -Force
```

---

## ✅ Success Checklist

Before using the app, verify:
- ✅ All 5 terminals running without errors
- ✅ Backend responds: `curl http://localhost:3001/health`
- ✅ Frontend loads: http://localhost:5173
- ✅ No red errors in browser console (F12)
- ✅ `deployments.json` exists with contract addresses
- ✅ MetaMask can connect to localhost:8545

---

## 📌 Summary

**Every time you want to run the project:**

1. Open VS Code in the project folder
2. Open 5 terminals
3. Run commands in order:
   - Terminal 1: `ipfs daemon`
   - Terminal 2: `npm run node` (wait for it to start)
   - Terminal 3: `npm run deploy` (after Terminal 2 is ready)
   - Terminal 4: `cd backend && npm start`
   - Terminal 5: `cd frontend && npm run dev`
4. Open browser: http://localhost:5173

**That's it! Your project should be running! 🚀**




