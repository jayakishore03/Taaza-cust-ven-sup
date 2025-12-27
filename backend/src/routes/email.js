/**
 * Email Routes
 */

import express from 'express';
import { sendWelcomeEmail } from '../services/emailService.js';
import { supabase } from '../config/database.js';

const router = express.Router();

/**
 * Send welcome email to vendor
 * POST /api/email/welcome/:shopId
 */
router.post('/welcome/:shopId', async (req, res, next) => {
  try {
    const { shopId } = req.params;
    
    // Fetch shop data from Supabase
    const { data: shop, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .single();
    
    if (error || !shop) {
      return res.status(404).json({
        success: false,
        error: { message: 'Shop not found' }
      });
    }
    
    if (!shop.email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Shop email not found' }
      });
    }
    
    // Send welcome email
    const result = await sendWelcomeEmail(shop.email, shop);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          message: 'Welcome email sent successfully',
          shopName: shop.name,
          email: shop.email,
          // For development: include email preview
          ...(process.env.NODE_ENV === 'development' && { emailPreview: result.emailPreview })
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: result.error || 'Failed to send email' }
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;











