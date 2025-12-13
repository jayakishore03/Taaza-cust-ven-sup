# Troubleshooting Login "Network Request Failed" Error

## Problem
When trying to login in the vendor app, you see the error: **"Network request failed"** or **"Cannot connect to server"**.

## Common Causes & Solutions

### 1. Backend Server Not Running
**Solution:** Start the backend server

```bash
cd backend
npm install  # if not already done
npm run dev
```

The server should start on `http://localhost:3000`

### 2. Incorrect IP Address in Config
**Solution:** Update the IP address in `vendor -app/config/api.ts`

1. Find your computer's IP address:
   - **Windows:** Open CMD and run `ipconfig`
   - Look for "IPv4 Address" under your active network adapter
   - **Mac/Linux:** Run `ifconfig` or `ip addr`

2. Update `vendor -app/config/api.ts`:
   ```typescript
   BASE_URL: __DEV__ 
     ? 'http://YOUR_IP_ADDRESS:3000/api'  // Replace YOUR_IP_ADDRESS
     : 'https://taaza-customer.vercel.app/api',
   ```

3. Restart your Expo app after making changes

### 3. Device and Computer Not on Same Network
**Solution:** Ensure both devices are on the same Wi-Fi network

- Your phone/emulator and computer must be on the same network
- If using a mobile data connection, it won't work with local IP addresses

### 4. Firewall Blocking Connection
**Solution:** Allow port 3000 through your firewall

- **Windows:** Add an exception for Node.js or port 3000 in Windows Firewall
- **Mac:** Check System Preferences > Security & Privacy > Firewall

### 5. Backend Server Not Listening on All Interfaces
**Solution:** Verify the backend is listening on `0.0.0.0` (all interfaces)

Check `backend/src/server.js` - it should have:
```javascript
app.listen(PORT, '0.0.0.0', () => {
  // ...
});
```

## Quick Test

1. **Test backend health check:**
   ```bash
   curl http://localhost:3000/health
   ```
   Should return: `{"success": true, "message": "Taza API is running"}`

2. **Test from your device's browser:**
   Open `http://YOUR_IP_ADDRESS:3000/health` in your phone's browser
   - If this works, the network is fine
   - If this fails, check IP address and firewall

3. **Check backend logs:**
   When you try to login, check the backend console for incoming requests
   - If you see the request, the network is working
   - If no request appears, the app can't reach the server

## Updated Error Messages

The app now shows more helpful error messages:
- If the server is unreachable, you'll see: "Cannot connect to server. Please check: 1. Backend server is running 2. Correct IP address in config 3. Device and computer are on same network"

## Still Having Issues?

1. Check backend console for errors
2. Verify Supabase connection in backend
3. Check that the `/api/auth/signin` endpoint exists
4. Try using `localhost` if testing on an emulator (Android emulator can use `10.0.2.2` instead of localhost)

