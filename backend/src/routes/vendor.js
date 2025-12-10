/**
 * Vendor Routes
 */

import express from 'express';
import { registerVendor, getVendorProfile } from '../controllers/vendorController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Vendor registration (public)
router.post('/register', registerVendor);

// Get vendor profile (requires authentication)
router.get('/profile', authenticate, getVendorProfile);

export default router;

