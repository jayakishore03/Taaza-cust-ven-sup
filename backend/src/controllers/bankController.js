import dotenv from 'dotenv';

dotenv.config();

/**
 * Verify bank account using IFSC + account number.
 * Currently this is a mock implementation that always succeeds and
 * returns sample bank details so the mobile flow works end‑to‑end.
 *
 * Expected request body:
 * { "ifsc": "SBIN0001234", "accountNumber": "1234567890" }
 */
export const verifyBankAccount = async (req, res) => {
  try {
    const { ifsc, accountNumber } = req.body || {};

    if (!ifsc || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'IFSC and accountNumber are required',
      });
    }

    // TODO: Replace this section with a real bank verification provider call.
    // For now we just echo back "verified" mock data.
    const details = {
      accountHolderName: 'Verified Account Holder',
      bankName: 'Demo Bank',
      branchName: 'Demo Branch',
      accountType: 'Savings',
      upiId: '',
    };

    return res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error('[verifyBankAccount] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while verifying bank account',
    });
  }
};


