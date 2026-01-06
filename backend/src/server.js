/**
 * Express Server
 * Main entry point for the Taza backend API
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Routes
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';
import usersRoutes from './routes/users.js';
import shopsRoutes from './routes/shops.js';
import couponsRoutes from './routes/coupons.js';
import addonsRoutes from './routes/addons.js';
import paymentsRoutes from './routes/payments.js';
import paymentMethodsRoutes from './routes/paymentMethods.js';
import migrateRoutes from './routes/migrate.js';
import migrateDirectRoutes from './routes/migrate-direct.js';
import migrateReferenceRoutes from './routes/migrate-reference-data.js';
import vendorRoutes from './routes/vendor.js';
import emailRoutes from './routes/email.js';
import bankRoutes from './routes/bank.js';
import deliveryAgentsRoutes from './routes/deliveryAgents.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve static images from backend/images folder (if exists)
try {
  const imagesPath = join(__dirname, '../images');
  app.use('/images', express.static(imagesPath));
} catch (error) {
  console.warn('⚠️ Images directory not found, skipping static file serving');
}

// Handle favicon requests (browsers automatically request this)
// These must be defined early, before any other routes
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content - browser will use default
});

app.get('/favicon.png', (req, res) => {
  res.status(204).end(); // No Content - browser will use default
});

app.get('/favicon', (req, res) => {
  res.status(204).end(); // No Content - browser will use default
});

// Root path - redirect to API info
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Taza API - Welcome!',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      products: '/api/products',
      shops: '/api/shops',
      orders: '/api/orders',
      auth: '/api/auth',
    },
    documentation: 'Visit /api for full API documentation',
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Taza API is running',
    timestamp: new Date().toISOString(),
  });
});

// Supabase configuration check (diagnostic endpoint)
app.get('/health/supabase', async (req, res) => {
  try {
    const { supabaseAdmin } = await import('./config/database.js');
    
    // Check if Supabase is configured
    const hasUrl = !!process.env.SUPABASE_URL;
    const hasAnonKey = !!process.env.SUPABASE_ANON_KEY;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Show partial keys for verification (first 20 chars)
    const urlPreview = process.env.SUPABASE_URL ? 
      `${process.env.SUPABASE_URL.substring(0, 30)}...` : 'NOT SET';
    const anonKeyPreview = process.env.SUPABASE_ANON_KEY ? 
      `${process.env.SUPABASE_ANON_KEY.substring(0, 20)}...` : 'NOT SET';
    const serviceKeyPreview = process.env.SUPABASE_SERVICE_ROLE_KEY ? 
      `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : 'NOT SET';
    
    // Try a simple query to verify connection
    let connectionTest = { success: false, error: null, details: null };
    if (supabaseAdmin && supabaseAdmin.from) {
      try {
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('id')
          .limit(1);
        
        if (error) {
          connectionTest = { 
            success: false, 
            error: error.message,
            code: error.code,
            hint: error.hint,
            details: error.details
          };
        } else {
          connectionTest = { success: true, error: null };
        }
      } catch (err) {
        connectionTest = { 
          success: false, 
          error: err.message,
          stack: err.stack
        };
      }
    } else {
      connectionTest = { 
        success: false, 
        error: 'Supabase admin client not initialized' 
      };
    }
    
    res.json({
      success: true,
      supabase: {
        configured: hasUrl && hasAnonKey && hasServiceKey,
        hasUrl,
        hasAnonKey,
        hasServiceKey,
        urlPreview,
        anonKeyPreview,
        serviceKeyPreview,
        connectionTest,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to check Supabase configuration',
        details: error.message,
        stack: error.stack,
      },
    });
  }
});

// Diagnostic endpoint for vendor orders debugging
app.get('/api/vendor/debug', async (req, res) => {
  try {
    const { supabaseAdmin } = await import('./config/database.js');
    const userId = req.userId; // From auth middleware if present
    
    // Get vendor's auth user info
    let authUserInfo = null;
    if (userId) {
      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (!authError && authUser) {
          authUserInfo = {
            id: authUser.user.id,
            email: authUser.user.email,
            phone: authUser.user.phone,
            created_at: authUser.user.created_at
          };
        }
      } catch (err) {
        console.error('Error fetching auth user:', err);
      }
    }
    
    // Get shop by user_id
    let vendorShop = null;
    if (userId) {
      const { data: shop, error: shopError } = await supabaseAdmin
        .from('shops')
        .select('id, name, user_id, email, mobile_number')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();
      
      if (!shopError && shop) {
        vendorShop = shop;
      }
    }
    
    // Get all shops
    const { data: allShops } = await supabaseAdmin
      .from('shops')
      .select('id, name, user_id, email, mobile_number')
      .limit(50);
    
    // Get all orders with shop_id
    const { data: allOrders } = await supabaseAdmin
      .from('orders')
      .select('id, shop_id, order_number, status, created_at')
      .not('shop_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);
    
    // Get unique shop_ids from orders
    const shopIdsInOrders = [...new Set(allOrders?.map(o => o.shop_id) || [])];
    
    // Get orders for vendor's shop if found
    let vendorOrders = [];
    if (vendorShop) {
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, status, subtotal, delivery_charge, created_at')
        .eq('shop_id', vendorShop.id)
        .order('created_at', { ascending: false })
        .limit(10);
      vendorOrders = orders || [];
    }
    
    res.json({
      success: true,
      debug: {
        authenticated: !!userId,
        vendorUserId: userId || 'Not authenticated - No token provided',
        authUserInfo: authUserInfo || 'Not found in auth.users',
        vendorShop: vendorShop || 'No shop found for this user_id',
        vendorOrdersCount: vendorOrders.length,
        vendorOrders: vendorOrders,
        fixRequired: !vendorShop && userId ? {
          message: 'Shop user_id does not match vendor auth user_id',
          sql: `UPDATE shops SET user_id = '${userId}' WHERE id = 'shop-1766319629349-etq87nd4v';`
        } : null,
        totalShops: allShops?.length || 0,
        totalOrders: allOrders?.length || 0,
        shopIdsInOrders,
        shops: allShops?.map(s => ({
          id: s.id,
          name: s.name,
          user_id: s.user_id,
          hasOrders: shopIdsInOrders.includes(s.id),
          matchesVendor: s.user_id === userId
        })),
        recentOrders: allOrders?.map(o => ({
          id: o.id,
          shop_id: o.shop_id,
          order_number: o.order_number,
          status: o.status,
          created_at: o.created_at
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
});

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Taza API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      users: '/api/users',
      shops: '/api/shops',
      coupons: '/api/coupons',
      addons: '/api/addons',
      payments: '/api/payments',
      vendor: '/api/vendor',
      bank: '/api/bank',
      migrate: '/api/migrate (POST /api/migrate/all to load data)',
    },
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/addons', addonsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/payment-methods', paymentMethodsRoutes);
app.use('/api/migrate', migrateRoutes);
app.use('/api/migrate-direct', migrateDirectRoutes);
app.use('/api/migrate-reference', migrateReferenceRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/delivery-agents', deliveryAgentsRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server - only for local development
// Vercel handles server startup automatically for serverless functions
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Taza Backend API running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API base: http://localhost:${PORT}/api`);
    console.log(`📱 Mobile access: http://192.168.0.8:${PORT}/api (or your computer's IP)`);
  });
}

export default app;

