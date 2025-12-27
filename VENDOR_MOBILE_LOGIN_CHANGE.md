# Vendor App - Mobile Number Login

## 📱 Change Summary

Changed vendor app sign-in from **Email + Password** to **Mobile Number + Password**.

---

## ✅ What Was Changed

### 1. Login Screen UI (`vendor -app/app/(auth)/login.tsx`)

**Before:**
```typescript
- Email address input field
- Email validation (checking for @)
- Error: "Please enter a valid email address"
```

**After:**
```typescript
- Mobile number input field
- 10-digit mobile number validation
- Phone pad keyboard
- Error: "Please enter a valid 10-digit mobile number"
```

**UI Changes:**
- ✅ Icon changed from `User` to `Phone`
- ✅ Placeholder changed from "Email Address" to "Mobile Number"
- ✅ Keyboard type changed from "email-address" to "phone-pad"
- ✅ Added `maxLength={10}` validation
- ✅ Error messages now mention "mobile number" instead of "email"

---

### 2. Authentication Logic (`vendor -app/services/shops.ts`)

**Function:** `signInVendor()`

**Before:**
```typescript
signInVendor(email: string, password: string)
// Directly signs in with email
```

**After:**
```typescript
signInVendor(mobileNumberOrEmail: string, password: string)
// 1. Checks if input is mobile number (10 digits)
// 2. If mobile number, looks up email from shops table
// 3. Signs in with the found email
// 4. If email, signs in directly
```

**Logic Flow:**

```
User Input: 9876543210
    ↓
Is it a mobile number? (10 digits)
    ↓ YES
Look up email from shops table
    ↓
SELECT email FROM shops WHERE mobile_number = '9876543210'
    ↓
Found: vendor@example.com
    ↓
Sign in with email + password
    ↓
Success! ✅
```

---

### 3. Auth Context (`vendor -app/contexts/AuthContext.tsx`)

**Function:** `signIn()`

**Before:**
```typescript
signIn(email: string, password: string)
```

**After:**
```typescript
signIn(mobileNumberOrEmail: string, password: string)
// Parameter name updated to reflect dual support
```

---

## 🔄 How It Works

### User Experience

1. **Vendor opens login screen**
   - Sees "Mobile Number" field instead of "Email Address"
   - Phone pad keyboard appears

2. **Vendor enters mobile number**
   - Example: `9876543210`
   - System validates: must be exactly 10 digits

3. **Vendor enters password**
   - Same as before

4. **Vendor clicks "Sign In"**
   - System looks up email associated with mobile number
   - Signs in using email + password with Supabase Auth
   - Vendor is logged in! ✅

### Technical Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Login Screen                                                 │
│ Input: Mobile Number (9876543210) + Password                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ AuthContext.signIn(mobileNumber, password)                  │
│ Calls: signInVendor(mobileNumber, password)                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ signInVendor() - Check input type                           │
│ Is "9876543210" a mobile number? YES (10 digits)            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Query Supabase: shops table                                 │
│ SELECT email FROM shops                                     │
│ WHERE mobile_number = '9876543210'                          │
│ Result: vendor@example.com                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Sign in with Supabase Auth                                  │
│ supabase.auth.signInWithPassword({                          │
│   email: 'vendor@example.com',                              │
│   password: password                                        │
│ })                                                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Success! Vendor logged in ✅                                 │
│ User data + Shop data stored                                │
│ Navigate to dashboard                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Validation

### Mobile Number Format

```typescript
// Accepts only 10-digit numbers
const cleanMobile = mobileNumber.trim().replace(/[^\d]/g, '');
if (cleanMobile.length !== 10) {
  // Error: "Please enter a valid 10-digit mobile number"
}

// Examples:
✅ "9876543210"     → Valid
✅ "98-765-432-10" → Valid (cleaned to 9876543210)
❌ "987654321"     → Invalid (9 digits)
❌ "98765432100"   → Invalid (11 digits)
❌ "abc9876543"    → Invalid (contains letters)
```

---

## 🔍 Database Lookup

### Query Used

```sql
SELECT email 
FROM shops 
WHERE mobile_number = '9876543210'
LIMIT 1;
```

### Error Handling

**Case 1: Mobile number not found**
```
Error: "Mobile number not registered. Please check your number or sign up."
```

**Case 2: Wrong password**
```
Error: "Invalid mobile number or password"
```

**Case 3: Network error**
```
Error: "An unexpected error occurred. Please check your internet connection and try again."
```

---

## 🧪 Testing

### Test Cases

| Input | Password | Expected Result |
|-------|----------|----------------|
| Valid 10-digit mobile | Correct password | ✅ Sign in successful |
| Valid 10-digit mobile | Wrong password | ❌ "Invalid mobile number or password" |
| Unregistered mobile | Any password | ❌ "Mobile number not registered" |
| 9-digit number | Any password | ❌ "Please enter a valid 10-digit mobile number" |
| 11-digit number | Any password | ❌ "Please enter a valid 10-digit mobile number" |
| Letters/symbols | Any password | ❌ "Please enter a valid 10-digit mobile number" |

### Manual Testing Steps

1. **Open vendor app**
2. **Navigate to login screen**
3. **Verify UI changes:**
   - Phone icon displayed ✓
   - "Mobile Number" placeholder ✓
   - Phone pad keyboard ✓
   - Max 10 digits ✓
4. **Test valid login:**
   - Enter registered mobile: `9876543210`
   - Enter correct password
   - Click "Sign In"
   - Should log in successfully ✅
5. **Test invalid mobile:**
   - Enter 9 digits: `987654321`
   - Should show error ❌
6. **Test unregistered mobile:**
   - Enter unregistered number
   - Should show "Mobile number not registered" ❌

---

## 🔄 Backward Compatibility

### Email Login Still Works!

The system supports **BOTH** email and mobile number:

```typescript
// User can sign in with email (contains @)
signIn("vendor@example.com", "password") ✅

// User can sign in with mobile (10 digits)
signIn("9876543210", "password") ✅
```

**How it detects:**
```typescript
const isMobileNumber = /^\d{10}$/.test(input);
// If 10 digits → Mobile number → Look up email
// If contains @ → Email → Sign in directly
```

---

## 📁 Files Modified

| File | Changes |
|------|---------|
| `vendor -app/app/(auth)/login.tsx` | UI: Email → Mobile number input |
| `vendor -app/contexts/AuthContext.tsx` | Parameter: email → mobileNumberOrEmail |
| `vendor -app/services/shops.ts` | Logic: Lookup email from mobile number |

---

## 🎯 Benefits

✅ **Easier for vendors** - Don't need to remember email  
✅ **Familiar UX** - Mobile number login is common in India  
✅ **No breaking changes** - Email login still works  
✅ **Fast lookup** - Query shops table by mobile_number  
✅ **Secure** - Uses same Supabase Auth system

---

## ⚠️ Important Notes

1. **Mobile number must be registered during sign-up**
   - Stored in `shops.mobile_number` field
   - Must be exactly 10 digits

2. **Email is still used internally**
   - Supabase Auth requires email
   - Mobile number is mapped to email

3. **Unique mobile numbers**
   - Each mobile number should be unique
   - Duplicate mobile numbers will cause lookup issues

4. **Registration unchanged**
   - Vendors still provide email during registration
   - Mobile number is also collected and stored

---

## 🐛 Troubleshooting

### Issue: "Mobile number not registered"

**Cause:** Mobile number not found in shops table

**Solution:**
1. Check if mobile number was saved during registration
2. Query database: `SELECT * FROM shops WHERE mobile_number = '...'`
3. Ensure mobile number is exactly 10 digits (no spaces/dashes)

### Issue: "Invalid mobile number or password"

**Cause:** Correct mobile, wrong password

**Solution:**
- User should try forgot password flow
- Or use correct password

### Issue: Still shows email field

**Cause:** App not reloaded after code changes

**Solution:**
- Stop the app
- Run: `npm start` (or restart Expo)
- Clear cache if needed: `npm start -- --clear`

---

## ✅ Summary

**Changed:** Vendor login from Email → Mobile Number  
**Method:** Mobile number → Lookup email → Sign in with email  
**Compatibility:** Email login still works  
**Status:** ✅ Implemented and tested  

Vendors can now sign in using their 10-digit mobile number instead of email! 🎉

