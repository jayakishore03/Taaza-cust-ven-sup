import express from 'express';
import { verifyBankAccount } from '../controllers/bankController.js';

const router = express.Router();

// POST /api/bank/verify-account
router.post('/verify-account', verifyBankAccount);

export default router;


