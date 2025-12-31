/**
 * Vendor Routes
 */

import express from 'express';
import { registerVendor, getVendorProfile, approveVendor } from '../controllers/vendorController.js';
import { getVendorOrders, getVendorOrderById, updateVendorOrderStatus } from '../controllers/ordersController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Vendor registration (public)
router.post('/register', registerVendor);

// Get vendor profile (requires authentication)
router.get('/profile', authenticate, getVendorProfile);

// Get vendor orders (requires authentication)
router.get('/orders', authenticate, getVendorOrders);

// Get vendor order by ID (requires authentication)
router.get('/orders/:id', authenticate, getVendorOrderById);

// Update vendor order status (requires authentication)
router.patch('/orders/:id/status', authenticate, updateVendorOrderStatus);

// Approve shop (admin only - add admin auth middleware if needed)
router.post('/approve/:shopId', approveVendor);

export default router;

