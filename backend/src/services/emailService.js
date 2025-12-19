/**
 * Email Service
 * Sends welcome and notification emails to vendors
 */

/**
 * Send welcome email to vendor
 * @param {string} email - Vendor email address
 * @param {object} shopData - Shop information
 */
export async function sendWelcomeEmail(email, shopData) {
  try {
    console.log('===== SENDING WELCOME EMAIL =====');
    console.log('To:', email);
    console.log('Shop:', shopData.name);
    
    // Email template
    const emailHTML = generateWelcomeEmailHTML(shopData);
    
    // In production, use a service like Resend, SendGrid, or AWS SES
    // For now, we'll log the email (you'll need to configure an email service)
    
    // Example with Resend (uncomment and add RESEND_API_KEY to .env):
    /*
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
    */
    
    // For development: Log email content
    console.log('📧 EMAIL CONTENT:');
    console.log('Subject: 🎉 Welcome to Taaza - Your Shop is Now Live!');
    console.log('HTML Preview:');
    console.log(emailHTML);
    console.log('================================');
    
    return {
      success: true,
      message: 'Welcome email sent successfully',
      // In production, remove this preview
      emailPreview: emailHTML
    };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate welcome email HTML
 */
function generateWelcomeEmailHTML(shopData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Taaza</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Email Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">
                🎉 Congratulations!
              </h1>
              <p style="color: #FCA5A5; margin: 10px 0 0; font-size: 16px;">
                Welcome to Taaza Family
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Greeting -->
              <p style="color: #1F2937; font-size: 18px; line-height: 28px; margin: 0 0 20px;">
                Dear <strong>${shopData.owner_name || 'Partner'}</strong>,
              </p>
              
              <!-- Main Message -->
              <p style="color: #4B5563; font-size: 16px; line-height: 26px; margin: 0 0 20px;">
                We are thrilled to welcome <strong>${shopData.name}</strong> to the Taaza platform! Your shop has been successfully approved and is now live on our app.
              </p>
              
              <!-- Shop Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FEF2F2; border-radius: 12px; padding: 24px; margin: 30px 0;">
                <tr>
                  <td>
                    <h3 style="color: #DC2626; margin: 0 0 16px; font-size: 18px; font-weight: 600;">
                      📍 Your Shop Details
                    </h3>
                    <p style="color: #374151; margin: 0 0 8px; font-size: 15px;">
                      <strong>Shop Name:</strong> ${shopData.name}
                    </p>
                    ${shopData.shop_type ? `
                    <p style="color: #374151; margin: 0 0 8px; font-size: 15px;">
                      <strong>Shop Type:</strong> ${shopData.shop_type.charAt(0).toUpperCase() + shopData.shop_type.slice(1)}
                    </p>
                    ` : ''}
                    ${shopData.address ? `
                    <p style="color: #374151; margin: 0 0 8px; font-size: 15px;">
                      <strong>Address:</strong> ${shopData.address}
                    </p>
                    ` : ''}
                    <p style="color: #374151; margin: 0; font-size: 15px;">
                      <strong>Contact:</strong> ${shopData.mobile_number || 'N/A'}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- What's Next -->
              <h3 style="color: #1F2937; margin: 30px 0 16px; font-size: 20px; font-weight: 600;">
                🚀 What's Next?
              </h3>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                <tr>
                  <td style="padding: 12px 0;">
                    <p style="color: #4B5563; margin: 0; font-size: 15px; line-height: 24px;">
                      <span style="display: inline-block; width: 28px; height: 28px; background-color: #DC2626; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 700; margin-right: 12px;">1</span>
                      <strong>Add Your Products:</strong> Log in to your vendor dashboard and start adding your meat products with prices.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <p style="color: #4B5563; margin: 0; font-size: 15px; line-height: 24px;">
                      <span style="display: inline-block; width: 28px; height: 28px; background-color: #DC2626; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 700; margin-right: 12px;">2</span>
                      <strong>Manage Orders:</strong> Receive and fulfill customer orders through the Taaza vendor app.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <p style="color: #4B5563; margin: 0; font-size: 15px; line-height: 24px;">
                      <span style="display: inline-block; width: 28px; height: 28px; background-color: #DC2626; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 700; margin-right: 12px;">3</span>
                      <strong>Grow Your Business:</strong> Reach thousands of customers looking for fresh, quality meat in your area.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Benefits -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F0FDF4; border-radius: 12px; padding: 24px; margin: 30px 0;">
                <tr>
                  <td>
                    <h3 style="color: #15803D; margin: 0 0 16px; font-size: 18px; font-weight: 600;">
                      💎 Your Benefits
                    </h3>
                    <p style="color: #166534; margin: 0 0 8px; font-size: 14px;">
                      ✅ Zero listing fees - pay only when you sell
                    </p>
                    <p style="color: #166534; margin: 0 0 8px; font-size: 14px;">
                      ✅ Access to thousands of local customers
                    </p>
                    <p style="color: #166534; margin: 0 0 8px; font-size: 14px;">
                      ✅ Easy-to-use vendor dashboard
                    </p>
                    <p style="color: #166534; margin: 0; font-size: 14px;">
                      ✅ Regular payouts and transparent pricing
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Support -->
              <p style="color: #6B7280; font-size: 14px; line-height: 22px; margin: 30px 0 0; padding-top: 30px; border-top: 1px solid #E5E7EB;">
                Need help? Our support team is here for you. Contact us anytime for assistance with your shop.
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 14px; margin: 0 0 8px;">
                Thank you for choosing Taaza!
              </p>
              <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Taaza. All rights reserved.
              </p>
              <p style="color: #9CA3AF; font-size: 12px; margin: 8px 0 0;">
                This email was sent to ${shopData.email}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export default { sendWelcomeEmail };











