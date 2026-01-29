/**
 * Email Service for sending OTP codes
 * 
 * NOTE: This is a mock implementation for development/testing.
 * In production, replace with actual email service like:
 * - SendGrid
 * - AWS SES
 * - NodeMailer with SMTP
 */

class EmailService {
    /**
     * Send OTP code via email
     * @param {string} email - Recipient email address
     * @param {string} code - OTP code to send
     */
    async sendOTPEmail(email, code) {
        try {
            console.log('=====================================');
            console.log('📧 EMAIL OTP SERVICE');
            console.log('=====================================');
            console.log(`To: ${email}`);
            console.log(`OTP Code: ${code}`);
            console.log('Subject: Your CeDeFi Verification Code');
            console.log('');
            console.log('Message:');
            console.log(`Your verification code is: ${code}`);
            console.log('This code will expire in 10 minutes.');
            console.log('If you did not request this code, please ignore this email.');
            console.log('=====================================');
            console.log('');

            // Production email service (SendGrid)
            // Only attempt to send if we have valid credentials
            if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.')) {
                try {
                    const sgMail = require('@sendgrid/mail');
                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

                    const msg = {
                        to: email,
                        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@cedefi.com',
                        subject: 'Your CeDeFi Verification Code',
                        text: `Your verification code is: ${code}. This code will expire in 10 minutes.`,
                        html: this.getEmailTemplate(code)
                    };

                    await sgMail.send(msg);
                    console.log('✅ Email sent successfully via SendGrid');

                    return {
                        success: true,
                        message: 'Email sent successfully via SendGrid'
                    };
                } catch (sendGridError) {
                    const errorDetail = sendGridError.response ? JSON.stringify(sendGridError.response.body) : sendGridError.message;
                    console.error('❌ SendGrid error:', errorDetail);
                    if (sendGridError.code === 403) {
                        console.error('💡 TIP: This usually means your "From" email is not verified in SendGrid or your API key lacks permissions.');
                    }
                    console.warn('⚠️  Falling back to console-only mode');
                    // Fall through to return success (console logged above)
                }
            } else {
                console.warn('⚠️  SENDGRID_API_KEY not configured or invalid - using mock mode');
                console.log('💡 To enable real emails, set SENDGRID_API_KEY in .env file');
            }

            return {
                success: true,
                message: 'OTP logged to console (development mode)'
            };
        } catch (error) {
            console.error('Email service error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate HTML email template
     */
    getEmailTemplate(code) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .otp-code { font-size: 32px; font-weight: bold; color: #667eea; text-align: center; letter-spacing: 8px; margin: 20px 0; padding: 20px; background: white; border-radius: 8px; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>CeDeFi Verification</h1>
                    </div>
                    <div class="content">
                        <h2>Your Verification Code</h2>
                        <p>Please use the following code to complete your registration:</p>
                        <div class="otp-code">${code}</div>
                        <p><strong>This code will expire in 10 minutes.</strong></p>
                        <p>If you did not request this code, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 CeDeFi Banking. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}

module.exports = new EmailService();
