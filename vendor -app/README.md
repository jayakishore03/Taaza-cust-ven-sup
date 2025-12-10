# 🍗 Chicken Shop Registration System

A comprehensive mobile app and backend system for chicken shop registration with super admin dashboard.

## ✨ Features

- 📱 **Mobile App** - React Native Expo app for chicken shop owners
- 🍗 **Product Management** - Manage chicken and meat prices (per kg)
- 📄 **Document Collection** - PAN, GST, FSSAI License, Shop License, Aadhaar
- 🌐 **Super Admin Dashboard** - Beautiful web interface to review registrations
- 📊 **Real-time Statistics** - Dashboard with pending/approved/rejected counts
- 🔐 **Secure Document Storage** - All documents stored and accessible
- 📚 **Swagger API Docs** - Complete interactive API documentation

## 🏗️ Architecture

### Backend (Python FastAPI)
- **Framework**: FastAPI
- **Database**: SQLite (can be upgraded to PostgreSQL)
- **ORM**: SQLAlchemy
- **API Docs**: Swagger/OpenAPI 3.0
- **Port**: 8000

### Frontend (React Native)
- **Framework**: Expo Router
- **Language**: TypeScript
- **State Management**: React Context API
- **Storage**: AsyncStorage

### Admin Dashboard
- **Technology**: HTML/CSS/JavaScript
- **Design**: Modern gradient UI with animations
- **Access**: Via backend at `/admin` or standalone HTML

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Backend runs on: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- Admin Panel: `http://localhost:8000/admin`

### Frontend Setup

```bash
cd project
npm install
npm run dev
```

### Super Admin Dashboard

Open `http://localhost:8000/admin` in browser (recommended)
OR
Open `super-admin/index.html` directly

## 📋 Registration Steps

1. **Basic Details** - Owner name, shop name, address, location, photos
2. **Contact Details** - Email, mobile (OTP verified), WhatsApp
3. **Working Days** - Select days and opening/closing times
4. **Documents** - Upload required documents:
   - PAN Card
   - GSTIN Document
   - FSSAI License (Required for food business)
   - Shop License / Trade License
   - Aadhaar Card
5. **Bank Details** - IFSC, account number, bank name
6. **Contract** - Review terms and submit registration

## 🍗 Product Pricing

Default prices (₹ per kg):
- 🍗 Whole Chicken: ₹180
- 🍖 Chicken Legs: ₹220
- 🍗 Chicken Breast: ₹250
- 🍖 Chicken Wings: ₹200
- 🍗 Chicken Thighs: ₹210
- 🍖 Mutton: ₹600
- 🍗 Goat Meat: ₹550
- 🍖 Fish: ₹300

Prices can be customized in the Store screen.

## 📁 Project Structure

```
├── backend/              # Python FastAPI Backend
│   ├── main.py           # FastAPI app
│   ├── app/              # Application code
│   │   ├── routers/      # API endpoints
│   │   ├── schemas/      # Pydantic schemas
│   │   └── models.py     # Database models
│   ├── admin-panel.html  # Admin dashboard
│   └── requirements.txt  # Python dependencies
│
├── project/              # React Native Frontend
│   ├── app/              # Screens & navigation
│   ├── contexts/         # React contexts
│   └── services/         # API services
│
└── super-admin/          # Standalone admin dashboard
    └── index.html        # Modern admin interface
```

## 🔌 API Endpoints

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
- `PUT /api/v1/vendors/admin/{id}/approve` - Update status
- `GET /api/v1/vendors/admin/dashboard` - Statistics

See full API docs at: `http://localhost:8000/docs`

## 🎨 Admin Dashboard Features

- **Modern Design**: Gradient purple background, smooth animations
- **Statistics Cards**: Total, Pending, Approved, Rejected counts
- **Vendor Management**: View, approve, reject registrations
- **Document Viewer**: View and download all uploaded documents
- **Support Chat**: Communicate with vendors
- **Filtering**: Filter by status (pending, approved, rejected)
- **Search**: Search vendors by name or owner

## 📝 Technologies

### Backend
- FastAPI
- SQLAlchemy
- Pydantic
- Python-JOSE (JWT)
- Passlib (Password hashing)
- Uvicorn

### Frontend
- React Native
- Expo
- TypeScript
- React Context API
- AsyncStorage
- Expo Router

## 🔒 Security

- JWT authentication
- Password hashing (bcrypt)
- CORS enabled
- File upload validation
- SQL injection protection (SQLAlchemy)

## 📚 Documentation

- **Setup Guide**: `SETUP_GUIDE.md`
- **Backend README**: `backend/README_PYTHON.md`
- **API Docs**: http://localhost:8000/docs (Swagger UI)

## 🎯 Key Differences from Reference

1. **Chicken Shop Focus** - All references updated from "laundry" to "chicken shop"
2. **Enhanced Documents** - Added FSSAI License, Shop License, Aadhaar Card
3. **Product Pricing** - Chicken and meat products instead of laundry services
4. **Modern Admin UI** - Enhanced CSS with gradient design

## 🐛 Troubleshooting

### Backend won't start
- Check Python version (3.8+)
- Install dependencies: `pip install -r requirements.txt`
- Check port 8000 is available

### Frontend can't connect
- Update API URL in `project/services/api.ts` and `project/contexts/RegistrationContext.tsx`
- For Android: Use your computer's IP instead of `localhost`
- Ensure backend is running

### Admin panel not loading
- Make sure backend is running on port 8000
- Check browser console for errors
- Verify API endpoints are accessible

## 📄 License

Private project
