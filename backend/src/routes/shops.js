/**
 * Shops Routes
 */

import express from 'express';
import {
  getAllShops,
  getShopById,
} from '../controllers/shopsController.js';
import { getAllShopsDebug } from '../controllers/testShopsController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', optionalAuth, getAllShops);
router.get('/:id', optionalAuth, getShopById);

// Debug route (for testing)
router.get('/debug/all', getAllShopsDebug);

export default router;

