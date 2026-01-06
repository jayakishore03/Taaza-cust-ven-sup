# 🔧 Fix "Body is unusable" Error in Expo Start

## The Error
```
TypeError: Body is unusable: Body has already been read
```

This happens when Expo CLI tries to validate dependencies and reads the response body multiple times.

## ✅ Solution 1: Skip Dependency Validation (Quickest Fix)

Add this environment variable to skip the doctor checks:

```powershell
$env:EXPO_NO_DOCTOR="1"; npx expo start -c
```

Or create a `.env` file in the root directory:
```
EXPO_NO_DOCTOR=1
```

## ✅ Solution 2: Update package.json Script

Update your `package.json` scripts to include the flag:

```json
{
  "scripts": {
    "dev": "EXPO_NO_DOCTOR=1 EXPO_NO_TELEMETRY=1 expo start",
    "start": "EXPO_NO_DOCTOR=1 expo start -c"
  }
}
```

Then run:
```powershell
npm run dev
```

## ✅ Solution 3: Clear Cache and Retry

```powershell
# Clear Expo cache
npx expo start -c --clear

# Or clear Metro bundler cache
npx expo start --clear
```

## ✅ Solution 4: Update Expo CLI

```powershell
npm install -g expo-cli@latest
# Or
npm install -g @expo/cli@latest
```

## ✅ Solution 5: Use Different Start Command

Try starting without the `-c` flag first:

```powershell
npx expo start
```

If that works, the issue is specifically with cache clearing.

## 🎯 Recommended Fix

**Use Solution 1** - It's the quickest and most reliable:

```powershell
$env:EXPO_NO_DOCTOR="1"; npx expo start -c
```

This skips the dependency validation that's causing the error. Your app will still work perfectly - it just won't check for version mismatches.

## Why This Happens

Expo CLI tries to fetch native module versions from their API to validate your dependencies. Sometimes the response body gets read multiple times, causing this error. It's a bug in Expo CLI, not your code.

## Note

This error is **non-critical** - your app will still start and work normally. It's just a warning from Expo's dependency checker.

