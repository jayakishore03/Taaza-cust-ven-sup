# Test Welcome Email Feature - Quick Start

## 🚀 Quick Testing Steps

### Step 1: Start Backend Server
```bash
cd backend
npm run dev
```

Wait for:
```
✅ Server running on port 3000
✅ Connected to Supabase
```

### Step 2: Open Super Admin Dashboard
1. Navigate to: http://localhost:5173 (or your Super Admin URL)
2. Go to **Partners** page
3. Select any approved shop (or approve one first)

### Step 3: Send Welcome Email
1. Scroll to **Approval Actions** section
2. Look for the **"Send Welcome Email"** button (blue button with mail icon)
3. Click the button
4. Confirm the email address in the dialog
5. Wait for success message

### Step 4: Verify Email Sent
Check backend console for:
```
===== SENDING WELCOME EMAIL =====
To: vendor@example.com
Shop: [Shop Name]
📧 EMAIL CONTENT:
Subject: 🎉 Welcome to Taaza - Your Shop is Now Live!
HTML Preview:
<!DOCTYPE html>
<html>
...full email HTML...
</html>
================================
```

## ✅ Success Indicators

1. **Frontend Alert:** "✅ Welcome email sent successfully to [email]!"
2. **Backend Console:** Full email HTML preview logged
3. **Button State:** Returns to normal after sending

## ❌ Troubleshooting

### Button is Disabled
- **Cause:** Shop has no email address
- **Fix:** Add email to shop in database or test with different shop

### Error: "Shop not found"
- **Cause:** Invalid shop ID
- **Fix:** Ensure you're clicking from a valid shop detail view

### Error: "Failed to fetch"
- **Cause:** Backend not running or wrong URL
- **Fix:** 
  1. Check backend is running on port 3000
  2. Update API URL in Partners.tsx if needed:
     ```typescript
     const response = await fetch(`http://localhost:3000/api/email/welcome/${partner.id}`, {
     ```

### Email Not Appearing in Console
- **Cause:** Backend code not saved or server not restarted
- **Fix:** Restart backend with `npm run dev`

## 📧 Configure Real Email Service (Optional)

### Using Resend (Recommended - Easy Setup)

1. **Sign up:** https://resend.com
2. **Get API Key:** Dashboard → API Keys → Create
3. **Add to .env:**
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
4. **Verify domain (for production):** Add your domain in Resend dashboard
5. **Uncomment code in emailService.js:**
   ```javascript
   // Lines 23-33 in backend/src/services/emailService.js
   const response = await fetch('https://api.resend.com/emails', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       from: 'Taaza <onboarding@yourdomain.com>',
       to: email,
       subject: '🎉 Welcome to Taaza - Your Shop is Now Live!',
       html: emailHTML
     })
   });
   ```
6. **Restart backend**
7. **Test with your email address**

### Using SendGrid

1. Install: `npm install @sendgrid/mail`
2. Get API key from SendGrid
3. Add to .env: `SENDGRID_API_KEY=xxx`
4. Replace email sending code in `emailService.js`:
   ```javascript
   import sgMail from '@sendgrid/mail';
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
   
   await sgMail.send({
     to: email,
     from: 'noreply@taaza.com',
     subject: '🎉 Welcome to Taaza - Your Shop is Now Live!',
     html: emailHTML
   });
   ```

## 🎨 Customize Email Template

Edit `backend/src/services/emailService.js`, function `generateWelcomeEmailHTML()`:

- **Change colors:** Update `background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%);`
- **Add logo:** Add `<img src="https://your-logo-url.com/logo.png" />`
- **Modify content:** Edit the paragraphs and sections
- **Add links:** Add CTA buttons or footer links

## 📱 Mobile Email Preview

To see how the email looks on mobile:
1. Send test email to your phone
2. Or use email testing tools:
   - Litmus (https://litmus.com)
   - Email on Acid (https://www.emailonacid.com)
   - Mailtrap (https://mailtrap.io) - Free for testing

## 🎯 Test Checklist

- [ ] Backend server running
- [ ] Super Admin dashboard accessible
- [ ] Approved shop with valid email selected
- [ ] "Send Welcome Email" button visible
- [ ] Button click triggers confirmation dialog
- [ ] Success alert appears after confirmation
- [ ] Email preview appears in backend console
- [ ] Email HTML contains correct shop details
- [ ] Button disabled state works (no email case)
- [ ] Loading spinner shows while sending
- [ ] Error handling works for network issues

## 📞 Need Help?

Check:
1. Backend console for detailed logs
2. Browser console for frontend errors
3. Network tab for API request/response
4. This documentation for common issues

---

**Ready to Test!** Follow Step 1 → Step 2 → Step 3 → Step 4 ✅











