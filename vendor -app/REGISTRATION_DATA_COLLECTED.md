# Vendor Registration - Complete Data Collection Summary

## Overview
The vendor registration process collects comprehensive information across **6 steps** to register a new vendor shop on the Taaza platform.

---

## 📋 Step 1: Basic Details (`index.tsx`)

### Shop Type Selection
- **Shop Type** (Required)
  - Options: Chicken 🍗, Mutton 🍖, Pork 🥩, Meat 🥓, Multi 🛒
  - User must select one type before proceeding

### Shop Owner Information
- **Owner Name** (Required) - Full name of shop owner
- **Shop Name** (Required) - Name of the Taaza shop/store

### Shop Address Details
- **Shop/Plot Number** (Required)
- **Floor** (Optional)
- **Building/Complex Name** (Required)
- **Pincode** (Required)

### Shop Location
- **GPS Coordinates** (Auto-fetched)
  - Latitude
  - Longitude
- **Area** (Auto-detected from reverse geocoding)
- **City** (Auto-detected from reverse geocoding)
- Location displayed on interactive map with marker

### Shop Photos
- **Store Photos** (Optional but recommended)
  - Multiple photos can be uploaded
  - Photos stored as image URIs
  - Can be removed after upload

---

## 📞 Step 2: Contact Details (`contact.tsx`)

### Contact Information
- **Email Address** (Required)
  - Email format validation
  - Used for account creation and communication

- **Mobile Number** (Required)
  - Minimum 10 digits
  - **OTP Verification Required**
    - OTP sent via 2Factor.in API
    - 30-second cooldown for resend
    - Must be verified before proceeding
    - Session ID stored for verification

- **WhatsApp Number** (Optional)
  - Can be same as mobile number
  - Used for WhatsApp communication

### Validation
- Email format must be valid
- Mobile number must be verified via OTP
- OTP verification is mandatory

---

## 🕐 Step 3: Working Days (`working-days.tsx`)

### Working Days Selection
- **Selected Days** (Required - at least one)
  - Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
  - Can select individual days or all days
  - "Select All" / "Deselect All" options available

### Shop Timings
Two configuration options:

#### Option 1: Same Time for All Days
- **Common Opening Time** (Required if selected)
  - Time picker (e.g., 9:00 AM)
- **Common Closing Time** (Required if selected)
  - Time picker (e.g., 6:00 PM)

#### Option 2: Day-wise Timings
- **Individual timings for each selected day**
  - Opening time per day
  - Closing time per day
  - Each day can have different hours

---

## 📄 Step 4: Documents (`documents.tsx`)

### Required Documents
1. **PAN Card** (Required)
   - Shop Owner/Business PAN
   - Upload via: File, Camera, or Gallery

2. **FSSAI License** (Required)
   - Food Safety and Standards Authority of India license
   - Required for meat business
   - Upload via: File, Camera, or Gallery

3. **Aadhaar Card** (Required)
   - Shop Owner's Aadhaar card
   - Upload via: File, Camera, or Gallery

4. **Shop License / Trade License** (Required)
   - Business/trade license document
   - Upload via: File, Camera, or Gallery

### Optional Documents
5. **GSTIN Document** (Optional)
   - Goods and Services Tax Identification Number
   - Upload via: File, Camera, or Gallery

### Document Storage
Each document stores:
- Document URI (file path)
- Document name
- Document MIME type

---

## 🏦 Step 5: Bank Details (`bank.tsx`)

### Banking Information (All Required)
- **IFSC Code** (Required)
  - Indian Financial System Code
  - Format: 11 characters (4 letters + 0 + 6 digits)

- **Account Number** (Required)
  - Bank account number
  - Must match confirmation

- **Confirm Account Number** (Required)
  - Re-enter account number for verification
  - Must match account number exactly

- **Account Holder Name** (Required)
  - Name as per bank records

- **Bank Name** (Required)
  - Name of the bank

### Validation
- Account numbers must match
- All fields are required
- Auto-saved to registration context

---

## ✍️ Step 6: Contract & Password (`contract.tsx`)

### Contract Terms
- **Terms and Conditions Acceptance** (Required)
  - Must accept terms to proceed
  - Checkbox confirmation

- **Profit Share** (Pre-set)
  - Default: 20%
  - Displayed in contract

- **Signature** (Required)
  - Can be captured via:
    - Camera (take photo)
    - Gallery (select image)
    - Note: Drawing signature not implemented in current version
  - Stored as image URI

### Account Creation
- **Password** (Required)
  - Minimum 6 characters
  - Must match confirmation

- **Confirm Password** (Required)
  - Re-enter password for verification
  - Must match password exactly
  - Show/hide password toggle available

### Final Submission
- All data validated before submission
- Creates vendor account in Supabase Auth
- Creates shop record in database
- Stores all registration data
- Clears registration context after success

---

## 📊 Complete Data Structure

### Registration Data Object
```typescript
{
  // Step 1: Basic Details
  shopType: 'chicken' | 'mutton' | 'pork' | 'meat' | 'multi',
  ownerName: string,
  storeName: string,
  shopPlot?: string,
  floor?: string,
  building: string,
  pincode: string,
  location: {
    latitude: number,
    longitude: number
  },
  area?: string,
  city?: string,
  storePhotos?: Array<{ uri: string }>,

  // Step 2: Contact Details
  email: string,
  mobileNumber: string,
  whatsappNumber?: string,
  isWhatsAppSame?: boolean,
  otpVerified: boolean,

  // Step 3: Working Days
  workingDays: string[], // ['Monday', 'Tuesday', ...]
  sameTime?: boolean,
  commonOpenTime?: string, // If sameTime = true
  commonCloseTime?: string, // If sameTime = true
  dayTimes?: { // If sameTime = false
    [day: string]: {
      open: Date | string,
      close: Date | string
    }
  },

  // Step 4: Documents
  documents: {
    pan: { uri: string, name: string, type: string },
    gst?: { uri: string, name: string, type: string },
    fssai: { uri: string, name: string, type: string },
    shopLicense: { uri: string, name: string, type: string },
    aadhaar: { uri: string, name: string, type: string }
  },

  // Step 5: Bank Details
  bankDetails: {
    ifsc: string,
    accountNumber: string,
    accountHolderName: string,
    bankName: string
  },

  // Step 6: Contract
  contractAccepted: boolean,
  profitShare: number, // Default: 20
  signature: string, // URI of signature image
  password: string // Not stored in context, only used for submission
}
```

---

## ✅ Required vs Optional Fields

### Required Fields (Must be filled)
1. **Shop Type** - One of: chicken, mutton, pork, meat, multi
2. **Owner Name** - Full name
3. **Shop Name** - Store name
4. **Shop/Plot Number** - Address component
5. **Building Name** - Address component
6. **Pincode** - Postal code
7. **Email** - Valid email format
8. **Mobile Number** - 10+ digits, OTP verified
9. **Working Days** - At least one day selected
10. **PAN Document** - Uploaded document
11. **FSSAI License** - Uploaded document
12. **Aadhaar Card** - Uploaded document
13. **Shop License** - Uploaded document
14. **IFSC Code** - Bank code
15. **Account Number** - Bank account (with confirmation)
16. **Account Holder Name** - Bank account holder
17. **Bank Name** - Bank name
18. **Contract Acceptance** - Terms accepted
19. **Signature** - Signature image
20. **Password** - Minimum 6 characters (with confirmation)

### Optional Fields
- **Floor** - Address component
- **WhatsApp Number** - Can be same as mobile
- **Store Photos** - Multiple photos
- **GSTIN Document** - Tax document
- **Day-wise Timings** - Can use same time for all days

---

## 🔄 Data Flow

### During Registration
1. Data stored in `RegistrationContext` (React Context)
2. Persisted to `AsyncStorage` for offline access
3. Data persists across app restarts
4. Can navigate back and forth between steps
5. Auto-saved as user fills forms

### After Submission
1. All data validated
2. Data sent to backend API (`completeVendorRegistration`)
3. Vendor account created in Supabase Auth
4. Shop record created in Supabase database
5. Documents uploaded to storage
6. Registration data cleared from context
7. Vendor data stored for immediate login

---

## 🔐 Security & Privacy

### Sensitive Data Collected
- **Personal Information**: Owner name, email, mobile number
- **Identity Documents**: PAN, Aadhaar
- **Business Documents**: FSSAI, Shop License, GSTIN
- **Financial Information**: Bank account details, IFSC code
- **Location Data**: GPS coordinates, address
- **Authentication**: Password (hashed before storage)

### Data Protection
- Password is hashed (not stored in plain text)
- Documents stored securely
- OTP verification for mobile number
- Email verification (via Supabase)
- Data encrypted in transit and at rest

---

## 📝 Validation Rules

1. **Mobile Number**: 
   - Minimum 10 digits
   - OTP verification mandatory
   - 30-second cooldown for resend

2. **Email**: 
   - Valid email format required
   - Must be unique (checked by Supabase)

3. **Account Number**: 
   - Must match confirmation exactly
   - No validation on format (user responsibility)

4. **Password**: 
   - Minimum 6 characters
   - Must match confirmation

5. **Working Days**: 
   - At least one day must be selected
   - Timings required for selected days

6. **Documents**: 
   - PAN, FSSAI, Aadhaar, Shop License are mandatory
   - GSTIN is optional
   - All documents must be uploaded (not just selected)

7. **Location**: 
   - Auto-fetched when shop type selected
   - Can be manually adjusted if needed

---

## 🎯 Registration Flow

```
Step 1: Select Shop Type
  ↓
Step 1: Basic Details (Owner, Shop Name, Address, Photos, Location)
  ↓
Step 2: Contact Details (Email, Mobile with OTP, WhatsApp)
  ↓
Step 3: Working Days (Days selection, Timings)
  ↓
Step 4: Documents (PAN, FSSAI, Aadhaar, Shop License, GSTIN)
  ↓
Step 5: Bank Details (IFSC, Account Number, Holder Name, Bank Name)
  ↓
Step 6: Contract & Password (Terms, Signature, Password)
  ↓
Submission → Account Created → Login Ready
```

---

## 📱 Features

### User Experience
- ✅ Step-by-step wizard interface
- ✅ Progress indicator (step 1/6, 2/6, etc.)
- ✅ Back navigation between steps
- ✅ Auto-save functionality
- ✅ Data persistence across app restarts
- ✅ Form validation with helpful error messages
- ✅ OTP verification with resend option (30s cooldown)
- ✅ Multiple upload options (camera, gallery, file)
- ✅ Interactive map for location
- ✅ Password show/hide toggle

### Technical Features
- ✅ React Context for state management
- ✅ AsyncStorage for data persistence
- ✅ Supabase integration for backend
- ✅ 2Factor.in API for OTP
- ✅ Image picker for photos/documents
- ✅ Location services for GPS
- ✅ Form validation
- ✅ Error handling

---

## 📌 Notes

- All steps can be navigated back and forth
- Data is auto-saved in RegistrationContext
- OTP verification is required for mobile number
- Location is automatically fetched when shop type is selected
- Documents can be uploaded via multiple methods
- Signature can be captured via camera or gallery
- All data is validated before final submission
- Registration creates both user account and shop record
- Vendor can login immediately after successful registration

