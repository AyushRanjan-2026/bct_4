# Fix Node.js Version - Windows Guide

## ⚠️ CRITICAL ERROR
You're using **Node.js v24.11.1**, but this project requires **Node.js 20**.

The error you're seeing is because Node.js v24 removed support for `assert { type: 'json' }` syntax that Veramo uses.

---

## Solution: Install Node.js 20

### Option 1: Use NVM for Windows (Recommended)

**Step 1: Install NVM for Windows**
1. Download from: https://github.com/coreybutler/nvm-windows/releases
2. Download `nvm-setup.exe` and run it
3. Restart your terminal/VS Code after installation

**Step 2: Install Node.js 20**
```powershell
nvm install 20
nvm use 20
node --version
```
**Must show:** `v20.x.x`

**Step 3: Set as Default (Optional)**
```powershell
nvm alias default 20
```

---

### Option 2: Direct Download (If you don't want NVM)

1. Go to: https://nodejs.org/
2. Download **Node.js 20 LTS** (Long Term Support)
3. Run the installer
4. Restart VS Code
5. Verify: `node --version` should show `v20.x.x`

---

## After Installing Node.js 20

### Step 1: Verify Version
```powershell
node --version
```
**Must show:** `v20.x.x` (NOT v24.x.x)

### Step 2: Clean and Reinstall Backend Dependencies
```powershell
cd "D:\Downloads\bct1-main (1)\bct1-main\backend"
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm install
```

### Step 3: Start Backend
```powershell
npm start
```

---

## Quick Fix Commands

If you have NVM installed:
```powershell
nvm install 20
nvm use 20
cd "D:\Downloads\bct1-main (1)\bct1-main\backend"
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm install
npm start
```

---

## Why This Happens

- **Node.js v22+**: Removed `assert { type: 'json' }` syntax
- **Veramo v5**: Built for Node.js 18-20
- **Solution**: Use Node.js 20 (LTS, stable, compatible)

---

## Verify It's Fixed

After switching to Node.js 20, you should see:
```
✅ Veramo database initialized
✅ Veramo agent initialized
✅ Backend server running on http://localhost:3001
```

Instead of the `SyntaxError: Unexpected identifier 'assert'` error.

---

**Once Node.js 20 is installed, restart VS Code and try again!** 🚀



