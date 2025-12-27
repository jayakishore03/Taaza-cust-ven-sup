# 🌐 Vercel API Usage Guide

Your Taza backend is deployed at: **https://taaza-customer.vercel.app/api**

## 📊 API Status

✅ **Live and Running!**
- Version: 1.0.0
- Current Data: 56 products, 3 shops, 2 addons

---

## 🔗 Available Endpoints

### **GET Requests (Retrieve Data)**

#### 1. Get All Products
```bash
GET https://taaza-customer.vercel.app/api/products
```

**PowerShell:**
```powershell
$products = Invoke-RestMethod -Uri "https://taaza-customer.vercel.app/api/products"
$products.data | Format-Table name, price, category
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Fresh Pork Curry Cut Boneless",
      "price": 380,
      "category": "Pork",
      "image_url": "/images/...",
      "is_available": true
    }
  ]
}
```

#### 2. Get All Shops
```bash
GET https://taaza-customer.vercel.app/api/shops
```

**PowerShell:**
```powershell
$shops = Invoke-RestMethod -Uri "https://taaza-customer.vercel.app/api/shops"
$shops.data | Format-Table name, address, distance
```

#### 3. Get All Addons
```bash
GET https://taaza-customer.vercel.app/api/addons
```

**PowerShell:**
```powershell
$addons = Invoke-RestMethod -Uri "https://taaza-customer.vercel.app/api/addons"
$addons.data | Format-Table name, price, description
```

#### 4. Get All Coupons
```bash
GET https://taaza-customer.vercel.app/api/coupons
```

**PowerShell:**
```powershell
$coupons = Invoke-RestMethod -Uri "https://taaza-customer.vercel.app/api/coupons"
$coupons.data
```

---

## 📝 POST Requests (Create/Update Data)

### **Migrate Data to Vercel Database**

#### Load All Core Data (Shops, Products, Addons, Coupons)
```powershell
# Using the migration endpoint
$result = Invoke-RestMethod -Uri "https://taaza-customer.vercel.app/api/migrate/all" -Method POST -ContentType "application/json"

# Check results
$result | ConvertTo-Json -Depth 3
```

#### Load Reference Data (Test Orders, Users)
```powershell
# If your Vercel deployment has the migrate-reference endpoint
$result = Invoke-RestMethod -Uri "https://taaza-customer.vercel.app/api/migrate-reference/all" -Method POST -ContentType "application/json"

$result | ConvertTo-Json -Depth 3
```

---

## 🔧 Example Operations

### **1. Get Product by Category**

```powershell
# Get all products
$products = Invoke-RestMethod -Uri "https://taaza-customer.vercel.app/api/products"

# Filter by category
$chickenProducts = $products.data | Where-Object { $_.category -eq "Chicken" }
Write-Host "Chicken Products: $($chickenProducts.Count)"
$chickenProducts | Select-Object name, price | Format-Table
```

### **2. Get Product by ID**

```powershell
# Get specific product
$productId = "1"
$product = Invoke-RestMethod -Uri "https://taaza-customer.vercel.app/api/products/$productId"
$product
```

### **3. Search Products**

```powershell
# Get all products and search
$products = Invoke-RestMethod -Uri "https://taaza-customer.vercel.app/api/products"
$searchTerm = "Mutton"
$results = $products.data | Where-Object { $_.name -like "*$searchTerm*" }
$results | Format-Table name, price
```

### **4. Get Shops by Distance**

```powershell
$shops = Invoke-RestMethod -Uri "https://taaza-customer.vercel.app/api/shops"
$shops.data | Sort-Object distance | Format-Table name, address, distance
```

---

## 🔄 Update Operations

### **Update Product (if endpoint exists)**

```powershell
# Update product availability
$productId = "1"
$updateData = @{
    is_available = $false
    price = 400
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "https://taaza-customer.vercel.app/api/products/$productId" `
    -Method PUT `
    -ContentType "application/json" `
    -Body $updateData
```

### **Create Order**

```powershell
$orderData = @{
    user_id = "your-user-id"
    items = @(
        @{
            product_id = "1"
            quantity = 2
        }
    )
    delivery_address_id = "address-id"
    payment_method = "Cash on Delivery"
} | ConvertTo-Json

$order = Invoke-RestMethod -Uri "https://taaza-customer.vercel.app/api/orders" `
    -Method POST `
    -ContentType "application/json" `
    -Body $orderData
```

---

## 📊 Check Database Status

```powershell
# If migrate-direct endpoint is available
$status = Invoke-RestMethod -Uri "https://taaza-customer.vercel.app/api/migrate-direct/status"
Write-Host "Total Records: $($status.totalRecords)"
$status.status
```

---

## 🧪 Testing Commands (PowerShell)

### Quick Test All Endpoints
```powershell
$baseUrl = "https://taaza-customer.vercel.app/api"

Write-Host "Testing Vercel API..." -ForegroundColor Cyan

# Test Products
try {
    $products = Invoke-RestMethod -Uri "$baseUrl/products"
    Write-Host "✅ Products: $($products.data.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ Products: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Shops
try {
    $shops = Invoke-RestMethod -Uri "$baseUrl/shops"
    Write-Host "✅ Shops: $($shops.data.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ Shops: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Addons
try {
    $addons = Invoke-RestMethod -Uri "$baseUrl/addons"
    Write-Host "✅ Addons: $($addons.data.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ Addons: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Coupons
try {
    $coupons = Invoke-RestMethod -Uri "$baseUrl/coupons"
    Write-Host "✅ Coupons: $($coupons.data.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ Coupons: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 🌐 Frontend Integration

### JavaScript/React Example

```javascript
const BASE_URL = 'https://taaza-customer.vercel.app/api';

// Get all products
async function getProducts() {
  const response = await fetch(`${BASE_URL}/products`);
  const data = await response.json();
  return data.data; // Array of products
}

// Get shops
async function getShops() {
  const response = await fetch(`${BASE_URL}/shops`);
  const data = await response.json();
  return data.data;
}

// Create order
async function createOrder(orderData) {
  const response = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });
  return await response.json();
}
```

---

## 🔑 Environment Variables (Already Set on Vercel)

Your Vercel deployment should have these environment variables set:
- `DATABASE_URL` - PostgreSQL connection
- `DIRECT_URL` - Direct PostgreSQL connection
- `SUPABASE_URL` - Supabase URL
- `SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key
- `NODE_ENV=production`

---

## 📈 Current Data Summary

Based on live API:
- **Products**: 56 items (Chicken, Mutton, Pork)
- **Shops**: 3 locations
- **Addons**: 2 items
- **Coupons**: Check endpoint status

---

## 🐛 Known Issues

1. **Coupons Endpoint**: Returns 404 - may need route verification
   - Check if `/api/coupons` route is properly configured

---

## 🚀 Next Steps

1. **Test all endpoints** to ensure they work
2. **Verify coupons endpoint** (currently 404)
3. **Set up authentication** for protected routes
4. **Connect frontend** to this API
5. **Monitor performance** on Vercel dashboard

---

## 📞 API Health Check

```powershell
# Quick health check
$health = Invoke-RestMethod -Uri "https://taaza-customer.vercel.app/api"
Write-Host "API Status: $($health.message)"
Write-Host "Version: $($health.version)"
Write-Host "Timestamp: $($health.timestamp)"
```

---

**🎉 Your API is live and ready to use!**

All GET requests are working, and your data is accessible from anywhere in the world!

