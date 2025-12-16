# Fix Vendor Registration Email Error

## Problem
Error during vendor registration:
```
ERROR [createVendorAccount] Auth error details: {
  "email": "akila@gmail.com", 
  "message": "Email address \"akila@gmail.com\" is invalid", 
  "name": "AuthApiError", 
  "status": 400
}
```

## Root Cause
Supabase Auth sometimes returns "Email address is invalid" (status 400) when:
1. **Email already exists** (most common)
2. Email confirmation is required but not configured properly
3. Email domain is blocked
4. Phone number format is invalid (if phone is required)

## Solution Applied

### 1. Improved Error Handling
- Better detection of "email already exists" errors
- Clearer error messages for users
- Handles Supabase's confusing "invalid email" response when email actually exists

### 2. Enhanced Phone Number Validation
- Better phone number formatting for Supabase (E.164 format)
- Handles Indian phone numbers (+91 prefix)
- Phone is optional if validation fails

### 3. Better Error Messages
- "This email address is already registered" - when email exists
- "Please sign in instead" - helpful guidance
- More specific error messages for different scenarios

## Changes Made

### File: `vendor -app/services/shops.ts`

1. **Improved email error detection:**
   - Checks for "already registered" in various forms
   - Detects when "invalid email" actually means "email exists"
   - Provides user-friendly messages

2. **Enhanced phone validation:**
   - Formats phone numbers in E.164 format (+91XXXXXXXXXX)
   - Makes phone optional if format is problematic
   - Better validation messages

3. **Better error logging:**
   - Logs full error details for debugging
   - Helps identify the actual issue

## Testing

### Test Case 1: Email Already Exists
1. Try to register with an email that's already registered
2. **Expected:** Clear message: "This email address is already registered. Please sign in or use a different email."

### Test Case 2: Invalid Email Format
1. Try to register with invalid email (e.g., "test@")
2. **Expected:** "Please enter a valid email address (e.g., name@example.com)."

### Test Case 3: Valid Registration
1. Register with new email and valid phone
2. **Expected:** Account created successfully

## Next Steps

If the error persists:

1. **Check Supabase Dashboard:**
   - Go to Authentication > Users
   - Check if email "akila@gmail.com" already exists
   - If it exists, user should sign in instead

2. **Check Email Confirmation Settings:**
   - Go to Authentication > Settings
   - Check "Enable email confirmations"
   - For development, you may want to disable it

3. **Check Phone Number Format:**
   - Ensure phone is in correct format
   - Try without phone number if issue persists

4. **Check Supabase Logs:**
   - Go to Logs > Auth Logs
   - Check for more detailed error information

## Common Solutions

### Solution 1: Email Already Exists
**Action:** User should sign in instead of registering

### Solution 2: Email Confirmation Required
**Action:** 
- Disable email confirmation in Supabase (for development)
- Or configure email redirect URL properly

### Solution 3: Phone Number Format
**Action:** 
- Ensure phone is in E.164 format: +919876543210
- Or make phone optional in registration

## Updated Error Messages

- ✅ "This email address is already registered. Please sign in or use a different email."
- ✅ "Please enter a valid email address (e.g., name@example.com)."
- ✅ "Invalid phone number format. Please enter a valid phone number."
- ✅ "Password is too weak. Please use a stronger password."
- ✅ "Too many registration attempts. Please wait a few minutes."
