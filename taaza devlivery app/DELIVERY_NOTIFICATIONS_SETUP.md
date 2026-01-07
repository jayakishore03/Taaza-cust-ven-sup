# 🔔 Delivery Order Notifications - Setup Guide

## ✅ Features Implemented

1. **Real-time Order Notifications** - Delivery agents receive notifications when orders are ready
2. **Ringing Sound** - Phone rings when new order arrives
3. **Order Details Display** - Shows shop, customer locations, and distance
4. **Accept/Reject** - Agents can accept or reject orders
5. **Auto-expire** - Notifications expire after 5 minutes
6. **Location Tracking** - Agent location updated in backend

---

## 📦 Installation Steps

### 1. Install Required Package

```bash
cd "taaza devlivery app"
npm install expo-av
```

### 2. Run SQL Migration in Supabase

Go to **Supabase Dashboard** → **SQL Editor** → Run the following:

```sql
-- Located in: backend/migrations/create_delivery_notifications_table.sql
```

Copy and paste the entire SQL file content and execute it.

### 3. Deploy Backend Changes

```bash
git add .
git commit -m "Add delivery agent notification system"
git push
```

Wait for Vercel to deploy (2-3 minutes).

---

## 🚀 How It Works

### **1. Vendor Marks Order as Ready**

When vendor updates order status to "ready", call this endpoint:

```javascript
// In vendor app
POST /api/delivery-agents/find-nearby
Body: {
  shop_latitude: 16.5062,
  shop_longitude: 80.6480,
  radius_km: 5  // Search within 5km
}

// Response: List of available agents sorted by distance
```

### **2. Send Notification to Agent**

```javascript
POST /api/delivery-agents/send-notification
Body: {
  order_id: "uuid",
  agent_user_id: "uuid",
  shop_name: "Shop Name",
  shop_address: "Shop Address",
  customer_address: "Customer Address",
  shop_latitude: 16.5062,
  shop_longitude: 80.6480,
  customer_latitude: 16.5070,
  customer_longitude: 80.6520
}
```

### **3. Delivery App Polling**

- When agent is "On Duty", app polls every 5 seconds
- Checks: `GET /api/delivery-agents/:userId/notifications`
- Shows notification modal with ringing sound
- Agent has 5 minutes to respond

### **4. Agent Accepts/Rejects**

**Accept:**
```javascript
POST /api/delivery-agents/notifications/:notificationId/accept
Body: { agent_user_id: "uuid" }

// - Updates order status
// - Assigns agent to order
// - Marks agent as unavailable
// - Stops ringing
// - Expires other pending notifications for this order
```

**Reject:**
```javascript
POST /api/delivery-agents/notifications/:notificationId/reject
Body: { agent_user_id: "uuid" }

// - Updates notification status
// - Agent stays available
// - Can send to next agent
```

---

## 🎯 Backend API Endpoints

### Find Nearby Agents
```
POST /api/delivery-agents/find-nearby
```

### Send Notification
```
POST /api/delivery-agents/send-notification
```

### Get Pending Notifications
```
GET /api/delivery-agents/:userId/notifications
```

### Accept Order
```
POST /api/delivery-agents/notifications/:notificationId/accept
```

### Reject Order
```
POST /api/delivery-agents/notifications/:notificationId/reject
```

### Update Location
```
PATCH /api/delivery-agents/:userId/location
Body: { latitude: number, longitude: number }
```

### Update Duty Status
```
PATCH /api/delivery-agents/:userId/duty-status
Body: { is_on_duty: boolean }
```

---

## 📱 Delivery App Features

### On Duty Toggle
- Located at top-right of home screen
- Toggles between "On Duty" / "Off Duty"
- Updates backend automatically
- Only receives notifications when "On Duty"

### Notification Modal
- Appears with ringing sound
- Shows pickup and delivery locations
- Displays total distance
- 5-minute countdown timer
- Accept/Reject buttons
- Auto-dismisses when expired

### Location Updates
- Location sent to backend on app start
- Updated automatically
- Used for finding nearby agents

---

## 🔄 Complete Flow

```
1. Customer places order
   ↓
2. Vendor accepts & prepares order
   ↓
3. Vendor marks order as "ready"
   ↓
4. Backend finds nearby agents (within 5km)
   ↓
5. Send notification to closest agent
   ↓
6. Agent's phone rings 🔔
   ↓
7. Modal shows order details
   ↓
8. Agent accepts → Assigned to order
   ↓
9. Agent rejects → Send to next agent
   ↓
10. Agent picks up from shop
    ↓
11. Agent delivers to customer
```

---

## 🎨 UI Components

### OrderNotification Component
- Full-screen modal
- Animated pulsing effect
- Ringing sound (loops until action)
- Countdown timer
- Clean black & white design
- Accept (green) / Reject (red) buttons

### Home Screen
- Empty state when no orders
- Shows "Waiting for Orders" when on duty
- Location display
- On/Off duty toggle

---

## 🔧 Configuration

### Notification Expiry Time
Change in backend controller:
```javascript
expires_at: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
```

### Polling Interval
Change in delivery app:
```javascript
setInterval(checkForNotifications, 5000); // Check every 5 seconds
```

### Search Radius
Change when finding agents:
```javascript
radius_km: 5  // Search within 5km
```

---

## 🎵 Sound File

The notification uses a public sound URL. You can replace it with your own:

```javascript
// In OrderNotification.tsx
const { sound } = await Audio.Sound.createAsync(
  { uri: 'YOUR_SOUND_URL_HERE' },
  { shouldPlay: true, isLooping: true }
);
```

---

## 🐛 Debugging

### Check Notifications
```sql
SELECT * FROM delivery_notifications 
WHERE agent_user_id = 'your-user-id'
ORDER BY created_at DESC;
```

### Check Agent Status
```sql
SELECT full_name, is_on_duty, is_available, current_latitude, current_longitude
FROM delivery_agents
WHERE user_id = 'your-user-id';
```

### Backend Logs
Check Vercel Function Logs for notification sending and acceptance.

---

## ✅ Testing Checklist

- [ ] Install expo-av package
- [ ] Run SQL migration in Supabase
- [ ] Deploy backend to Vercel
- [ ] Test "On Duty" toggle
- [ ] Test location updates
- [ ] Send test notification
- [ ] Verify ringing sound plays
- [ ] Test accept functionality
- [ ] Test reject functionality
- [ ] Test auto-expiry after 5 minutes
- [ ] Verify order assignment

---

## 🎉 You're Done!

The delivery notification system is now complete and ready to use! 

Agents will receive real-time notifications with ringing when orders are ready for pickup!

