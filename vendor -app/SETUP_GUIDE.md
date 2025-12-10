# Chicken Shop Registration System - Setup Guide

## 🎯 Project Overview

Complete conversion from Laundry Vendor App to **Chicken Shop Registration System** with:
- ✅ Python FastAPI backend (matching reference structure)
- ✅ React Native Expo frontend
- ✅ Super Admin Dashboard (beautiful CSS design)
- ✅ Document management (PAN, GST, FSSAI, Shop License, Aadhaar)
- ✅ Step-by-step registration flow
- ✅ Swagger API documentation

## 📁 Project Structure

```
meat_vendor_app/
├── backend/                    # Python FastAPI Backend
│   ├── main.py                # FastAPI app entry point
│   ├── requirements.txt       # Python dependencies
│   ├── run.py                 # Run script
│   ├── app/
│   │   ├── core/              # Config & security
│   │   ├── database.py        # Database connection
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── routers/           # API route handlers
│   │   │   ├── registration.py
│   │   │   ├── vendors.py
│   │   │   └── ...
│   │   └── schemas/           # Pydantic schemas
│   ├── admin-panel.html       # Admin dashboard
│   └── document-viewer.html   # Document viewer
│
├── project/                    # React Native Expo Frontend
│   ├── app/                   # App screens
│   ├── contexts/              # React contexts
│   ├── services/              # API services
│   └── assets/                # Images
│
└── super-admin/               # Standalone admin dashboard
    └── index.html             # Modern admin interface
```

## 🚀 Backend Setup (Python FastAPI)

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Create Environment File

Create `backend/.env`:
```
DATABASE_URL=sqlite:///./chicken_shop.db
SECRET_KEY=your-secret-key-change-in-production
```

### 3. Start Backend Server

```bash
cd backend
python main.py
```

Or with auto-reload:
```bash
python run.py
```

**Backend will run on:** `http://localhost:8000`

**API Documentation:**
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Admin Panel: `http://localhost:8000/admin`

## 📱 Frontend Setup (React Native)

### 1. Install Dependencies

```bash
cd project
npm install
```

### 2. Update API URL (if needed)

If testing on Android device, update API URL in:
- `project/services/api.ts` - Change `localhost` to your computer's IP
- `project/contexts/RegistrationContext.tsx` - Same update

### 3. Start Expo

```bash
cd project
npm run dev
```

## 🌐 Super Admin Dashboard

### Option 1: Via Backend (Recommended)
Open: `http://localhost:8000/admin`

### Option 2: Standalone
Open: `super-admin/index.html` in browser
- Make sure backend is running on `http://localhost:8000`

## 📋 Registration Flow

1. **Step 1: Basic Details** - Owner name, shop name, address, location, photos
2. **Step 2: Contact Details** - Email, mobile (OTP verification), WhatsApp
3. **Step 3: Working Days** - Select days and timings
4. **Step 4: Documents** - Upload PAN, GST, **FSSAI**, **Shop License**, **Aadhaar**
5. **Step 5: Bank Details** - IFSC, account number, bank name
6. **Step 6: Contract** - Review and accept terms, submit

## 🔑 Key Features

### Backend (FastAPI)
- ✅ Step-by-step registration endpoints
- ✅ Complete registration endpoint
- ✅ File upload handling
- ✅ Admin vendor management
- ✅ Status updates (pending/approved/rejected)
- ✅ Support chat system
- ✅ Swagger documentation

### Frontend (React Native)
- ✅ Multi-step registration form
- ✅ Document upload (PAN, GST, FSSAI, Shop License, Aadhaar)
- ✅ Location services
- ✅ Photo upload
- ✅ OTP verification
- ✅ Data persistence with AsyncStorage

### Admin Dashboard
- ✅ Beautiful modern UI with gradient design
- ✅ Statistics dashboard
- ✅ Vendor list with filtering
- ✅ Document viewer
- ✅ Approve/Reject functionality
- ✅ Support chat interface

## 🍗 Product Pricing

Default prices (per kg):
- Whole Chicken: ₹180
- Chicken Legs: ₹220
- Chicken Breast: ₹250
- Chicken Wings: ₹200
- Chicken Thighs: ₹210
- Mutton: ₹600
- Goat Meat: ₹550
- Fish: ₹300

## 📝 API Endpoints

### Registration
- `POST /api/v1/registration/step1/basic-details`
- `POST /api/v1/registration/step2/contact-details`
- `POST /api/v1/registration/step3/working-days`
- `POST /api/v1/registration/step4/upload-documents`
- `POST /api/v1/registration/step5/bank-details`
- `POST /api/v1/registration/step6/contract`
- `POST /api/v1/registration/complete` - Submit all at once

### Admin
- `GET /api/v1/vendors/` - List all vendors
- `GET /api/v1/vendors/{id}` - Get vendor details
- `PUT /api/v1/vendors/admin/{id}/approve` - Approve/Reject vendor
- `GET /api/v1/vendors/admin/dashboard` - Dashboard statistics

## 🔧 Troubleshooting

### Backend Issues
- Make sure Python 3.8+ is installed
- Check if port 8000 is available
- Verify database file is created (`chicken_shop.db`)

### Frontend Issues
- For Android: Update `localhost` to your computer's IP address
- Make sure backend is running before starting frontend
- Check Expo logs for errors

### Admin Panel Issues
- Ensure backend is running on port 8000
- Check browser console for API errors
- Verify CORS is enabled in backend

## 📚 Documentation

- **Backend API Docs**: http://localhost:8000/docs
- **Backend README**: `backend/README_PYTHON.md`
- **Main README**: `README.md`

## ✨ What's New

1. ✅ **Python FastAPI Backend** - Complete conversion from Node.js
2. ✅ **Enhanced Documents** - Added FSSAI, Shop License, Aadhaar
3. ✅ **Modern Admin UI** - Beautiful gradient design with animations
4. ✅ **Chicken Shop Focus** - All references updated from laundry
5. ✅ **Product Pricing** - Chicken and meat products with per-kg pricing
6. ✅ **Swagger Docs** - Complete API documentation

## 🎨 Admin Panel Features

- Modern gradient purple background
- Smooth animations and transitions
- Responsive design
- Real-time statistics
- Document viewing and download
- Support chat interface
- Vendor approval workflow

