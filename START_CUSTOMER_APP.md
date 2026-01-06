# 🚀 Start Customer App - Fix "Body Already Read" Error

## The Error
```
TypeError: Body is unusable: Body has already been read
```

This is an Expo CLI bug when checking package versions. It's not your code!

## ✅ Quick Fix Options

### Option 1: Skip Dependency Check (FASTEST - Use This!)

```bash
npx expo start -c --no-dev
```

Or just:

```bash
npx expo start
```

The `--clear` flag sometimes triggers this bug. Try without it!

---

### Option 2: Update Expo CLI

```bash
npm install -g expo-cli@latest
npx expo start
```

---

### Option 3: Use Environment Variable

```bash
# Windows PowerShell:
$env:EXPO_NO_DOCTOR="1"
npx expo start -c

# Or Windows CMD:
set EXPO_NO_DOCTOR=1
npx expo start -c
```

---

### Option 4: Delete Cache and Reinstall

```bash
# Clear all caches
npx expo start -c

# If still doesn't work:
rm -rf node_modules
npm install
npx expo start
```

---

## 🎯 Recommended Command

**Just use this:**

```bash
npx expo start
```

Without the `-c` flag! The cache is fine, the error is in Expo's dependency checker.

---

## Alternative: Use Expo Go Tunnel

If you're on the same network but it's not working:

```bash
npx expo start --tunnel
```

This uses ngrok tunnel and is slower but more reliable.

---

## What's Happening?

The error occurs when Expo CLI tries to:
1. Fetch native module versions from Expo servers
2. Read the response body twice (bug in Expo CLI)
3. Crashes because HTTP bodies can only be read once

**This doesn't affect your app code!** It's purely an Expo CLI issue.

---

## Status Check

After starting, you should see:

```
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ ▄▄▄▄▄ █ [QR CODE] █
█ █   █ █           █
█ █▄▄▄█ █           █
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄

› Metro waiting on exp://192.168.0.5:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

If you see this = SUCCESS! ✅

---

## Still Not Working?

Try this nuclear option:

```bash
# 1. Stop all Expo processes
taskkill /F /IM node.exe

# 2. Clear everything
npx expo start -c --reset-cache

# 3. If STILL failing:
npm cache clean --force
rm -rf node_modules
npm install
npx expo start
```

---

## Quick Reference

| Command | What It Does | Speed |
|---------|--------------|-------|
| `npx expo start` | Normal start (RECOMMENDED) | ⚡ Fast |
| `npx expo start -c` | Clear cache (sometimes triggers bug) | 🐌 Slow |
| `npx expo start --no-dev` | Skip development checks | ⚡⚡ Fastest |
| `npx expo start --tunnel` | Use ngrok tunnel | 🐌🐌 Slowest but most compatible |

---

**TL;DR: Just use `npx expo start` without the `-c` flag!**

