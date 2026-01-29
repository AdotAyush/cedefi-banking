/**
 * SMS Service for sending OTP codes
 * 
 * NOTE: This is a mock implementation for development/testing.
 * In production, replace with actual SMS service like:
 * - Twilio
 * - AWS SNS
 * - Other SMS gateway
 */

class SMSService {
    /**
     * Send OTP code via SMS
     * @param {string} phoneNumber - Recipient phone number (will be normalized)
     * @param {string} code - OTP code to send
     */
    async sendOTPSMS(phoneNumber, code) {
        try {
            console.log('=====================================');
            console.log('📱 SMS OTP SERVICE');
            console.log('=====================================');
            console.log(`To: ${phoneNumber}`);
            console.log(`OTP Code: ${code}`);
            console.log('');
            console.log('Message:');
            console.log(`CeDeFi: Your verification code is ${code}. Valid for 10 minutes.`);
            console.log('=====================================');
            console.log('');

            // Production SMS service - India-friendly options
            // MSG91 is popular in India, or use Fast2SMS as alternative

            // Option 1: MSG91 (Recommended for India)
            if (process.env.MSG91_AUTH_KEY && process.env.MSG91_SENDER_ID) {
                try {
                    const axios = require('axios');

                    const response = await axios.get('https://api.msg91.com/api/v5/otp', {
                        params: {
                            authkey: process.env.MSG91_AUTH_KEY,
                            mobile: phoneNumber.replace(/\+/g, ''), // Remove + sign
                            otp: code,
                            template_id: process.env.MSG91_TEMPLATE_ID || 'default',
                            sender: process.env.MSG91_SENDER_ID
                        },
                        timeout: 10000
                    });

                    if (response.data.type === 'success') {
                        console.log('✅ SMS sent successfully via MSG91');
                        return {
                            success: true,
                            message: 'SMS sent successfully via MSG91'
                        };
                    }
                } catch (msg91Error) {
                    console.error('❌ MSG91 error:', msg91Error.message);
                    console.warn('⚠️  MSG91 failed, trying Fast2SMS...');
                }
            }

            // Option 2: Fast2SMS (Alternative for India)
            if (process.env.FAST2SMS_API_KEY && process.env.FAST2SMS_SENDER_ID) {
                try {
                    const axios = require('axios');

                    const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
                        route: 'otp',
                        sender_id: process.env.FAST2SMS_SENDER_ID,
                        message: code,
                        variables_values: code,
                        flash: 0,
                        numbers: phoneNumber.replace(/\+91/g, '') // Remove +91 prefix
                    }, {
                        headers: {
                            'authorization': process.env.FAST2SMS_API_KEY,
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    });

                    if (response.data.return === true) {
                        console.log('✅ SMS sent successfully via Fast2SMS');
                        return {
                            success: true,
                            message: 'SMS sent successfully via Fast2SMS'
                        };
                    }
                } catch (fast2smsError) {
                    const errorDetail = fast2smsError.response ? JSON.stringify(fast2smsError.response.data) : fast2smsError.message;
                    console.error('❌ Fast2SMS error:', errorDetail);
                    console.warn('⚠️  Fast2SMS failed, falling back to console mode');
                }
            }

            // No valid SMS service configured
            if (!process.env.MSG91_AUTH_KEY && !process.env.FAST2SMS_API_KEY) {
                console.warn('⚠️  No SMS service configured - using mock mode');
                console.log('💡 To enable real SMS in India, configure one of these:');
                console.log('   Option 1 (MSG91): MSG91_AUTH_KEY, MSG91_SENDER_ID, MSG91_TEMPLATE_ID');
                console.log('   Option 2 (Fast2SMS): FAST2SMS_API_KEY, FAST2SMS_SENDER_ID');
            }

            return {
                success: true,
                message: 'OTP logged to console (development mode)'
            };
        } catch (error) {
            console.error('SMS service error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Normalize Indian phone number to +91XXXXXXXXXX format
     * @param {string} phoneNumber - Input phone number
     * @returns {string} Normalized phone number
     */
    normalizeIndianPhoneNumber(phoneNumber) {
        // Remove all non-digit characters except +
        let cleaned = phoneNumber.replace(/[^\d+]/g, '');

        // If starts with +91, check if it has 10 digits after
        if (cleaned.startsWith('+91')) {
            const digits = cleaned.substring(3);
            if (digits.length === 10) {
                return cleaned; // Already in correct format
            }
        }

        // If starts with 91 (without +), add +
        if (cleaned.startsWith('91') && cleaned.length === 12) {
            return '+' + cleaned;
        }

        // If 10 digits only, add +91
        if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
            return '+91' + cleaned;
        }

        // If has + but not +91, invalid
        if (cleaned.startsWith('+')) {
            throw new Error('Only Indian phone numbers (+91) are supported');
        }

        // Otherwise, invalid format
        throw new Error('Invalid Indian phone number format');
    }

    /**
     * Validate Indian phone number format
     * Accepts: +919876543210, 919876543210, 9876543210
     * Format: 10-digit number starting with 6-9
     */
    validatePhoneNumber(phoneNumber) {
        try {
            // Remove all whitespace and special characters except +
            const cleaned = phoneNumber.replace(/[^\d+]/g, '');

            // Pattern 1: +91XXXXXXXXXX (E.164 format)
            const e164Pattern = /^\+91[6-9]\d{9}$/;
            if (e164Pattern.test(cleaned)) {
                return true;
            }

            // Pattern 2: 91XXXXXXXXXX (without +)
            const withoutPlusPattern = /^91[6-9]\d{9}$/;
            if (withoutPlusPattern.test(cleaned)) {
                return true;
            }

            // Pattern 3: XXXXXXXXXX (10 digits starting with 6-9)
            const tenDigitPattern = /^[6-9]\d{9}$/;
            if (tenDigitPattern.test(cleaned)) {
                return true;
            }

            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get validation error message
     */
    getValidationErrorMessage() {
        return 'Invalid Indian phone number. Expected format: +919876543210, 919876543210, or 9876543210 (10 digits starting with 6-9)';
    }
}

module.exports = new SMSService();
