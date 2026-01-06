# Email OTP Setup Guide

## ✅ Implementation Complete

Email OTP functionality has been successfully implemented! You can now send OTP codes to email addresses for verification and password reset purposes.

## 📧 Features

- **Send OTP via Email**: Send 6-digit OTP codes to any email address
- **Verify OTP**: Verify the OTP code sent to email
- **Password Reset**: Use email OTP for password reset (alternative to phone OTP)
- **Email Verification**: Use email OTP for email verification
- **Free Tier Support**: Works with Resend's free tier (100 emails/day)

## 🚀 Quick Start

### 1. Setup Resend (Free Email Service)

1. **Sign up at [Resend.com](https://resend.com)**
   - Free tier: 100 emails per day
   - No credit card required for free tier

2. **Get your API Key**
   - Go to Dashboard → API Keys
   - Click "Create API Key"
   - Copy your API key

3. **Add to Backend `.env` file**
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

4. **Restart your backend server**
   ```bash
   cd backend
   npm run dev
   ```

### 2. API Endpoints

#### Send OTP to Email
```http
POST /api/auth/send-email-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "purpose": "verification" // optional: "verification" or "password-reset"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "OTP has been sent to your email address.",
    "otp": "123456" // Only in development mode
  }
}
```

#### Verify Email OTP
```http
POST /api/auth/verify-email-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "OTP verified successfully.",
    "purpose": "verification"
  }
}
```

### 3. Frontend Usage

```typescript
import { authApi } from '@/lib/api/auth';

// Send OTP to email
const sendOTP = async () => {
  try {
    const result = await authApi.sendEmailOTP('user@example.com', 'verification');
    console.log(result.message);
    // In development, OTP is returned for testing
    if (result.otp) {
      console.log('OTP:', result.otp);
    }
  } catch (error) {
    console.error('Failed to send OTP:', error);
  }
};

// Verify OTP
const verifyOTP = async () => {
  try {
    const result = await authApi.verifyEmailOTP('user@example.com', '123456');
    console.log(result.message);
  } catch (error) {
    console.error('OTP verification failed:', error);
  }
};
```

## 📝 How It Works

1. **OTP Generation**: 6-digit random code is generated
2. **Storage**: OTP is stored in memory with 10-minute expiration
3. **Email Sending**: OTP is sent via Resend API (or logged in development)
4. **Verification**: User submits OTP, which is verified against stored value
5. **Expiration**: OTP expires after 10 minutes

## 🔧 Configuration

### Development Mode
- If `RESEND_API_KEY` is not set, OTPs are logged to console
- OTP is returned in API response for testing
- Email HTML preview is logged

### Production Mode
- Requires `RESEND_API_KEY` in `.env`
- OTP is NOT returned in API response
- Emails are sent via Resend API

## 📧 Email Template

The OTP email includes:
- Professional HTML template
- Large, easy-to-read OTP code
- 10-minute expiration notice
- Security warnings
- Taaza branding

## 🆓 Free Tier Limits

**Resend Free Tier:**
- 100 emails per day
- 3,000 emails per month
- No credit card required
- Perfect for development and small apps

**Upgrade Options:**
- Pro: $20/month - 50,000 emails
- Business: Custom pricing

## 🔒 Security Features

- OTP expires after 10 minutes
- OTP can only be used once (after verification)
- Email format validation
- Rate limiting recommended (not implemented yet)

## 🐛 Troubleshooting

### Emails Not Sending

1. **Check API Key**
   ```bash
   # In backend/.env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

2. **Check Console Logs**
   - Look for "✅ OTP email sent successfully via Resend"
   - Or "📧 EMAIL CONTENT (Not sent - Resend API not configured)"

3. **Verify Resend Account**
   - Check Resend dashboard for email logs
   - Verify API key is active

### OTP Not Working

1. **Check Expiration**: OTP expires after 10 minutes
2. **Check Email**: Ensure email matches exactly (case-insensitive)
3. **Check OTP Format**: Must be 6 digits

## 📚 Example Use Cases

### 1. Email Verification During Signup
```typescript
// Step 1: Send OTP
await authApi.sendEmailOTP(userEmail, 'verification');

// Step 2: User enters OTP
await authApi.verifyEmailOTP(userEmail, enteredOTP);

// Step 3: Proceed with signup
```

### 2. Password Reset via Email
```typescript
// Step 1: Send OTP
await authApi.sendEmailOTP(userEmail, 'password-reset');

// Step 2: Verify OTP
await authApi.verifyEmailOTP(userEmail, enteredOTP);

// Step 3: Reset password
await authApi.resetPassword(userEmail, newPassword);
```

## 🎉 Ready to Use!

Your email OTP system is now fully functional. Just add your Resend API key to start sending emails!

For questions or issues, check:
- Resend Documentation: https://resend.com/docs
- Backend Logs: Check console for email sending status
- Resend Dashboard: View email delivery status

