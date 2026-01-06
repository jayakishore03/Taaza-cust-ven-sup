# PowerShell script to start Expo without dependency validation errors
$env:EXPO_NO_DOCTOR = "1"
$env:EXPO_NO_TELEMETRY = "1"
npx expo start -c

