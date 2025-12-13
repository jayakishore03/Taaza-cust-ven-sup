# Vendor Registration Process - Details Collected

## Overview
The vendor registration process consists of **7 steps** that collect comprehensive information about the shop owner, shop details, contact information, working hours, documents, banking details, and contract acceptance.

---

## Step 1: Basic Details (`index.tsx`)

### Shop Type Selection
- **Chicken** 🍗
- **Mutton** 🍖
- **Pork** 🥩
- **Meat** 🥓
- **Multi** 🛒

### Shop Owner Details
- **Owner Name** (Full Name) - *Required*
- **Shop Name** (Taaza Shop Name) - *Required*

### Shop Address
- **Shop/Plot Number** - *Required*
- **Floor** (Optional)
- **Building/Complex Name** - *Required*
- **Pincode** - *Required*

### Shop Photos
- Multiple store photos can be uploaded
- Photos are stored as image URIs

### Shop Location
- **GPS Coordinates** (Latitude, Longitude) - Auto-fetched using device location
- **Area** (Auto-detected from reverse geocoding)
- **City** (Auto-detected from reverse geocoding)
- Location is displayed on a map with marker

---

## Step 2: Contact Details (`contact.tsx`)

### Contact Information
- **Email Address** - *Required*
- **Mobile Number** - *Required*
  - OTP verification required
  - OTP sent via 2Factor.in API
  - OTP must be verified before proceeding
- **WhatsApp Number** - *Optional*
  - Can be same as mobile number or different

### Validation
- Mobile number must be at least 10 digits
- OTP verification is mandatory
- Email format validation

---

## Step 3: Working Days (`working-days.tsx`)

### Working Days Selection
- **Monday** through **Sunday**
- Can select all days or individual days
- At least one day must be selected

### Shop Timings
Two options available:

#### Option 1: Same Time for All Days
- **Opening Time** (e.g., 9:00 AM)
- **Closing Time** (e.g., 6:00 PM)

#### Option 2: Day-wise Timings
- Individual opening and closing times for each selected day
- Each day can have different timings

---

## Step 4: Documents (`documents.tsx`)

### Required Documents
1. **PAN Card** (Shop Owner/Business PAN) - *Required*
2. **FSSAI License** (For meat business) - *Required*
3. **Aadhaar Card** (Shop Owner) - *Required*

### Optional Documents
4. **GSTIN Document** - *Optional*
5. **Shop License / Trade License** - *Required*

### Upload Options
Each document can be uploaded via:
- **Document File** (PDF, images, etc.)
- **Camera** (Take photo)
- **Gallery** (Select from photos)

### Document Storage
- Document URI
- Document name
- Document MIME type

---

## Step 5: Bank Details (`bank.tsx`)

### Banking Information
- **IFSC Code** - *Required*
- **Account Number** - *Required*
- **Confirm Account Number** - *Required* (must match)
- **Account Holder Name** - *Required*
- **Bank Name** - *Required*

### Validation
- Account numbers must match
- All fields are required

---

## Step 6: Contract & Password (`contract.tsx`)

### Contract Terms
- **Terms and Conditions Acceptance** - *Required*
- **Profit Share**: 20% (pre-set)
- **Signature** - *Required*
  - Can be drawn on screen
  - Can be uploaded from gallery
  - Can be taken via camera

### Account Creation
- **Password** - *Required* (minimum 6 characters)
- **Confirm Password** - *Required* (must match)

### Final Submission
- All data is submitted to backend
- Creates vendor account
- Creates shop record
- Stores all registration data

---

## Complete Data Structure

### Registration Data Object
```typescript
{
  // Step 1: Basic Details
  shopType: string,                    // 'chicken', 'mutton', 'pork', 'meat', 'multi'
  ownerName: string,
  storeName: string,
  shopPlot: string,
  floor: string,                        // Optional
  building: string,
  pincode: string,
  storePhotos: Array<{ uri: string }>,
  location: {
    latitude: number,
    longitude: number
  },
  area: string,                         // Auto-detected
  city: string,                         // Auto-detected

  // Step 2: Contact Details
  email: string,
  mobileNumber: string,
  whatsappNumber: string,               // Optional
  otpVerified: boolean,

  // Step 3: Working Days
  workingDays: string[],                // ['Monday', 'Tuesday', ...]
  sameTimeForAllDays: boolean,
  commonOpenTime: Date,                 // If sameTimeForAllDays = true
  commonCloseTime: Date,                // If sameTimeForAllDays = true
  dayWiseTimings: {                     // If sameTimeForAllDays = false
    [day: string]: {
      open: Date,
      close: Date
    }
  },

  // Step 4: Documents
  documents: {
    pan: { uri: string, name: string, type: string },
    gst: { uri: string, name: string, type: string },      // Optional
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
  profitShare: number,                  // 20
  signature: string,                    // URI of signature image
  password: string
}
```

---

## Data Storage

### During Registration
- All data is stored in `RegistrationContext` using `AsyncStorage`
- Data persists across app restarts
- Can navigate back and forth between steps
- Data is auto-saved as user fills forms

### After Submission
- Data is sent to backend API
- Vendor account is created
- Shop record is created in database
- All documents are uploaded to storage
- Registration data is cleared from context

---

## Required vs Optional Fields

### Required Fields
- Shop Type
- Owner Name
- Shop Name
- Shop/Plot Number
- Building Name
- Pincode
- Email
- Mobile Number (with OTP verification)
- At least one Working Day
- PAN Document
- FSSAI License
- Aadhaar Card
- Shop License
- IFSC Code
- Account Number
- Account Holder Name
- Bank Name
- Contract Acceptance
- Signature
- Password

### Optional Fields
- Floor
- WhatsApp Number
- GSTIN Document
- Day-wise timings (can use same time for all days)

---

## Validation Rules

1. **Mobile Number**: Minimum 10 digits, OTP verification required
2. **Email**: Valid email format
3. **Account Number**: Must match confirmation
4. **Password**: Minimum 6 characters, must match confirmation
5. **Working Days**: At least one day must be selected
6. **Documents**: PAN, FSSAI, Aadhaar, and Shop License are mandatory
7. **Location**: Auto-fetched but can be manually adjusted

---

## Navigation Flow

```
Step 1: Basic Details
  ↓
Step 2: Contact Details
  ↓
Step 3: Working Days
  ↓
Step 4: Documents
  ↓
Step 5: Bank Details
  ↓
Step 6: Contract & Password
  ↓
Submission → Account Created
```

---

## Notes

- All steps can be navigated back and forth
- Data is auto-saved in RegistrationContext
- OTP verification is required for mobile number
- Location is automatically fetched when shop type is selected
- Documents can be uploaded via multiple methods (file, camera, gallery)
- Signature can be drawn, uploaded, or captured via camera
- All data is validated before final submission

