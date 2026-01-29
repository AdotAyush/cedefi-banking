const OTP = require('../models/OTP');
const crypto = require('crypto');

class OTPService {
    /**
     * Generate a 6-digit OTP code
     */
    generateOTP() {
        return crypto.randomInt(100000, 999999).toString();
    }

    /**
     * Create and store an OTP record in the database
     * @param {string} identifier - Email or phone number
     * @param {string} type - 'email' or 'phone'
     * @param {number} expirationMinutes - Minutes until OTP expires (default: 10)
     */
    async createOTPRecord(identifier, type, expirationMinutes = 10) {
        try {
            // Rate limiting: Check how many OTPs created in last hour
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const recentOTPs = await OTP.countDocuments({
                identifier,
                type,
                createdAt: { $gte: oneHourAgo }
            });

            if (recentOTPs >= 5) {
                throw new Error('Rate limit exceeded. Maximum 5 OTP requests per hour.');
            }

            // Generate OTP code
            const code = this.generateOTP();

            // Set expiration time
            const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

            // Invalidate any previous unverified OTPs for this identifier
            await OTP.updateMany(
                { identifier, type, verified: false },
                { $set: { verified: true } } // Mark as "used" to prevent reuse
            );

            // Create new OTP record
            const otpRecord = await OTP.create({
                identifier,
                type,
                code,
                expiresAt,
                attempts: 0,
                maxAttempts: 3
            });

            return {
                success: true,
                code,
                expiresAt
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verify an OTP code
     * @param {string} identifier - Email or phone number
     * @param {string} type - 'email' or 'phone'
     * @param {string} code - OTP code to verify
     */
    async verifyOTP(identifier, type, code) {
        try {
            // Find the most recent unverified OTP for this identifier
            const otpRecord = await OTP.findOne({
                identifier,
                type,
                verified: false
            }).sort({ createdAt: -1 });

            if (!otpRecord) {
                return {
                    success: false,
                    error: 'No OTP found. Please request a new one.'
                };
            }

            // Check if OTP is expired
            if (otpRecord.isExpired()) {
                return {
                    success: false,
                    error: 'OTP has expired. Please request a new one.'
                };
            }

            // Check if max attempts reached
            if (otpRecord.isLocked()) {
                return {
                    success: false,
                    error: 'Maximum verification attempts exceeded. Please request a new OTP.'
                };
            }

            // Verify the code using constant-time comparison to prevent timing attacks
            const isValid = this.constantTimeCompare(code, otpRecord.code);

            if (!isValid) {
                // Increment attempt counter
                otpRecord.attempts += 1;
                await otpRecord.save();

                return {
                    success: false,
                    error: `Invalid OTP. ${otpRecord.maxAttempts - otpRecord.attempts} attempts remaining.`
                };
            }

            // Mark OTP as verified
            otpRecord.verified = true;
            await otpRecord.save();

            return {
                success: true,
                message: 'OTP verified successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Constant-time string comparison to prevent timing attacks
     */
    constantTimeCompare(a, b) {
        if (a.length !== b.length) {
            return false;
        }

        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }

        return result === 0;
    }

    /**
     * Check if both email and phone OTPs are verified
     */
    async checkBothVerified(email, phoneNumber) {
        const emailOTP = await OTP.findOne({
            identifier: email.toLowerCase(),
            type: 'email',
            verified: true
        }).sort({ createdAt: -1 });

        const phoneOTP = await OTP.findOne({
            identifier: phoneNumber,
            type: 'phone',
            verified: true
        }).sort({ createdAt: -1 });

        const emailVerified = emailOTP && !emailOTP.isExpired();
        const phoneVerified = phoneOTP && !phoneOTP.isExpired();

        return {
            emailVerified,
            phoneVerified,
            bothVerified: emailVerified && phoneVerified
        };
    }

    /**
     * Clean up expired OTPs (can be run as a cron job)
     */
    async cleanupExpiredOTPs() {
        try {
            const result = await OTP.deleteMany({
                expiresAt: { $lt: new Date() }
            });

            return {
                success: true,
                deleted: result.deletedCount
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new OTPService();
