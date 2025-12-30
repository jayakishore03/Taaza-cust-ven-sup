/**
 * Authentication Routes
 */

import express from 'express';
import { signUp, signIn, verifyAuthToken, sendPasswordResetOTP, verifyPasswordResetOTP, resetPassword, checkPhoneExists, cleanupOrphanedProfile, confirmVendorEmail, sendEmailOTP, verifyEmailOTP, getVendorEmailByMobile, resetPasswordByEmail } from '../controllers/authController.js';

const router = express.Router();

// Sign up
router.post('/signup', signUp);

// Sign in
router.post('/signin', signIn);

// Verify token
router.get('/verify', verifyAuthToken);

// Check if phone exists
router.post('/check-phone', checkPhoneExists);

// Cleanup orphaned profile
router.post('/cleanup-orphaned-profile', cleanupOrphanedProfile);

// Forgot password - send OTP
router.post('/forgot-password', sendPasswordResetOTP);

// Verify password reset OTP
router.post('/verify-reset-otp', verifyPasswordResetOTP);

// Reset password - set new password (after OTP verification)
router.post('/reset-password', resetPassword);

// Auto-confirm vendor email (for development)
router.post('/confirm-vendor-email', confirmVendorEmail);

// Send OTP to email
router.post('/send-email-otp', sendEmailOTP);

// Verify email OTP
router.post('/verify-email-otp', verifyEmailOTP);

// Get vendor email by mobile number (for forgot password)
router.post('/get-vendor-email', getVendorEmailByMobile);

// Reset password by email (for vendors using Supabase Auth)
router.post('/reset-password-by-email', resetPasswordByEmail);

export default router;

