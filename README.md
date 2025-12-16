# Taaza Super Admin Dashboard

Modern, responsive admin dashboard for managing the Taaza meat delivery platform.

## 🚀 Features

- **Dashboard**: Real-time statistics, charts, and analytics
- **Orders Management**: View and manage all orders
- **Delivery Agents**: Track and manage delivery personnel
- **Customers**: View customer information
- **Partners**: Manage shop partners (fetches real data from Supabase)
- **Analytics**: Business insights and reports
- **Settings**: Admin configuration

## 📦 Tech Stack

- **React 18.3.1** - UI Library
- **TypeScript** - Type Safety
- **Vite 5.4.2** - Build Tool
- **Tailwind CSS 3.4.1** - Styling
- **Supabase 2.57.4** - Backend & Database
- **Recharts 3.5.0** - Data Visualization
- **Lucide React** - Icons

## 🛠️ Setup & Installation

### 1. Install Dependencies

```bash
cd "meat super admin"
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://fcrhcwvpivkadkkbxcom.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Or copy from the example:

```bash
cp .env.example .env
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📱 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript type checking

## 🔐 Login

The login page requires email and password authentication. Currently, it's a simple authentication flow that can be connected to your backend API.

## 📊 Partners Section

The Partners section now displays **real shop data from Supabase**:

- ✅ Fetches shops from `shops` table
- ✅ Real-time data with refresh button
- ✅ Search functionality (by shop name, owner, phone, email, address)
- ✅ View detailed partner information
- ✅ Direct contact buttons (Call/Email)
- ✅ Status indicators (Active/Inactive)
- ✅ Loading and error states

### Supabase Integration

The dashboard connects to Supabase and fetches data from:

```typescript
shops table:
- id: string (uuid)
- name: string
- owner_name: string
- mobile_number: string
- email: string
- address: string
- is_active: boolean
- created_at: timestamp
- rating: number (optional)
- shop_image_url: string (optional)
```

## 🎨 Design

- Modern gradient UI with red theme
- Fully responsive layout
- Beautiful cards and modals
- Smooth transitions and hover effects
- Professional color scheme
- Clean and intuitive interface

## 📁 Project Structure

```
meat super admin/
├── src/
│   ├── components/
│   │   ├── Header.tsx       # Top navigation bar
│   │   └── Sidebar.tsx      # Side navigation menu
│   ├── lib/
│   │   └── supabase.ts      # Supabase client configuration
│   ├── pages/
│   │   ├── Analytics.tsx    # Analytics page
│   │   ├── Customers.tsx    # Customers management
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── DeliveryAgents.tsx  # Agents management
│   │   ├── Login.tsx        # Login page
│   │   ├── Orders.tsx       # Orders management
│   │   ├── Partners.tsx     # Partners/Shops (Supabase connected)
│   │   └── Settings.tsx     # Settings page
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

## 🔧 Troubleshooting

### Supabase Connection Issues

If you see "Error Loading Partners":
1. Check your `.env` file has correct Supabase credentials
2. Verify Supabase project is active
3. Check browser console for detailed errors
4. Ensure `shops` table exists in your Supabase database

### Build Errors

If build fails:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` folder.

### Deploy to Vercel/Netlify

1. Push code to GitHub
2. Connect repository to Vercel/Netlify
3. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

## 📝 Notes

- The login currently uses basic authentication
- Partners data is fetched from real Supabase database
- Other sections (Orders, Customers, etc.) currently show dummy data
- Can be extended to connect all sections to Supabase

## 🔗 Related Projects

- **Customer App** - Mobile app for customers
- **Vendor App** - Mobile app for shop vendors
- **Backend API** - Node.js/Express backend server

---

Made with ❤️ for Taaza Meat Delivery Platform

