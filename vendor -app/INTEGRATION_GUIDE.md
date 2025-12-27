# Backend Integration Guide

This guide explains how the vendor-app is integrated with the Express backend.

## 📋 Overview

The vendor-app is now fully integrated with the Express backend running on port 3000. The integration includes:

- ✅ Authentication (Login/Signup)
- ✅ Token management
- ✅ Dashboard statistics
- ✅ Orders management
- ✅ Shop information

## 🔧 Configuration

### 1. Update API Base URL

**IMPORTANT**: Before testing on a device, update the API base URL in `vendor -app/config/api.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://YOUR_COMPUTER_IP:3000/api' // ⚠️ CHANGE THIS
    : 'https://your-production-api.com/api',
  
  HEALTH_CHECK_URL: __DEV__
    ? 'http://YOUR_COMPUTER_IP:3000/health' // ⚠️ CHANGE THIS
    : 'https://your-production-api.com/health',
};
```

### 2. Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
```

### 3. Start the Backend

Make sure the backend is running:

```bash
cd backend
npm install
npm run dev
```

The backend should start on `http://localhost:3000` (or your configured port).

## 🔐 Authentication Flow

### Login
1. User enters email/phone and password
2. App calls `POST /api/auth/signin`
3. Backend returns user data and token
4. Token is stored in AsyncStorage
5. User is redirected to dashboard

### Token Management
- Tokens are automatically stored in AsyncStorage
- Tokens are included in all authenticated requests
- Token verification happens on app startup

## 📡 API Endpoints Used

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/verify` - Verify token

### Orders
- `GET /api/orders` - Get vendor orders (requires auth)
- `PATCH /api/orders/:id` - Update order status (requires auth)

### Shops
- `GET /api/shops/:id` - Get shop details

### Health Check
- `GET /health` - Backend health check

## 🏗️ Project Structure

```
vendor -app/
├── config/
│   └── api.ts              # API configuration
├── contexts/
│   ├── AuthContext.tsx     # Authentication context
│   └── RegistrationContext.tsx
├── services/
│   └── api.ts              # API service functions
└── app/
    ├── (auth)/
    │   └── login.tsx       # Login screen (integrated)
    └── (tabs)/
        └── index.tsx        # Dashboard (integrated)
```

## 🚀 Usage Examples

### Using Auth Context

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, signIn, signOut } = useAuth();
  
  // Check if user is logged in
  if (isAuthenticated) {
    console.log('User:', user);
  }
  
  // Sign in
  const handleLogin = async () => {
    const result = await signIn('user@example.com', 'password');
    if (result.success) {
      // Navigate to dashboard
    }
  };
  
  // Sign out
  const handleLogout = async () => {
    await signOut();
  };
}
```

### Using API Services

```typescript
import { getVendorOrders, updateOrderStatus, getDashboardStats } from '@/services/api';

// Get orders
const orders = await getVendorOrders();

// Update order status
await updateOrderStatus('order-id', 'preparing');

// Get dashboard stats
const stats = await getDashboardStats();
```

## 🐛 Troubleshooting

### Connection Issues

**Problem**: "Network request failed" or "Unable to connect"

**Solutions**:
1. Make sure backend is running: `cd backend && npm run dev`
2. Check if backend is accessible: Open `http://localhost:3000/health` in browser
3. Update IP address in `config/api.ts` if testing on device
4. Check firewall settings
5. Ensure device and computer are on the same network

### Authentication Issues

**Problem**: "Invalid or expired token"

**Solutions**:
1. Sign out and sign in again
2. Check if token is being stored: Check AsyncStorage
3. Verify backend token verification endpoint

### CORS Issues

**Problem**: CORS errors in browser console

**Solutions**:
1. Backend CORS is configured in `backend/src/server.js`
2. Make sure `CORS_ORIGIN` environment variable includes your app's origin
3. For development, backend allows all origins by default

## 📝 Next Steps

### To Complete Integration:

1. **Vendor Registration Endpoint**
   - Create vendor registration endpoint in backend
   - Update `submitVendorRegistration` in `services/api.ts`

2. **Orders Screen**
   - Create orders list screen
   - Integrate with `getVendorOrders` API

3. **Profile Management**
   - Add profile update functionality
   - Integrate with user profile endpoints

4. **Real-time Updates**
   - Consider adding WebSocket support for real-time order updates
   - Use polling as alternative

## 🔒 Security Notes

- Tokens are stored securely in AsyncStorage
- All authenticated requests include Bearer token
- Backend validates tokens on each request
- Tokens expire after 30 days

## 📚 Additional Resources

- Backend API Documentation: See `backend/API_USAGE_EXAMPLES.md`
- Backend README: See `backend/README.md`
- Expo Router Docs: https://docs.expo.dev/router/introduction/

