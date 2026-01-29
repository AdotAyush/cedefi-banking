const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const otpService = require('../services/otpService');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

/**
 * STEP 1: Initiate Registration
 * Accept email and phone number, check for existing users, send OTPs
 */
exports.initiateRegistration = async (req, res) => {
    const { email, phoneNumber } = req.body;

    try {
        // Validate inputs
        if (!email || !phoneNumber) {
            return res.status(400).json({ message: 'Email and phone number are required' });
        }

        // Normalize inputs
        const normalizedEmail = email.toLowerCase().trim();

        // Validate and normalize Indian phone number
        if (!smsService.validatePhoneNumber(phoneNumber)) {
            return res.status(400).json({
                message: smsService.getValidationErrorMessage()
            });
        }

        let normalizedPhone;
        try {
            normalizedPhone = smsService.normalizeIndianPhoneNumber(phoneNumber);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }

        // Check if user already exists with this email or phone
        const existingEmailUser = await User.findOne({ email: normalizedEmail });
        const existingPhoneUser = await User.findOne({ phoneNumber: normalizedPhone });

        // If either exists, return existing user flag
        if (existingEmailUser || existingPhoneUser) {
            return res.status(200).json({
                existingUser: true,
                message: 'An account with this email or phone number already exists',
                emailExists: !!existingEmailUser,
                phoneExists: !!existingPhoneUser
            });
        }

        // Generate and send OTPs
        const emailOTPResult = await otpService.createOTPRecord(normalizedEmail, 'email');
        const phoneOTPResult = await otpService.createOTPRecord(normalizedPhone, 'phone');

        if (!emailOTPResult.success) {
            return res.status(429).json({ message: emailOTPResult.error });
        }

        if (!phoneOTPResult.success) {
            return res.status(429).json({ message: phoneOTPResult.error });
        }

        // Send OTPs via email and SMS
        await emailService.sendOTPEmail(normalizedEmail, emailOTPResult.code);
        await smsService.sendOTPSMS(normalizedPhone, phoneOTPResult.code);

        res.status(200).json({
            success: true,
            message: 'OTP codes sent to email and phone',
            expiresAt: emailOTPResult.expiresAt
        });
    } catch (error) {
        console.error('Initiate registration error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * STEP 2a: Handle Existing User Choice
 * User chooses to either create new account (delete old) or use existing
 */
exports.handleExistingUserChoice = async (req, res) => {
    const { email, phoneNumber, choice } = req.body;

    try {
        // Validate inputs
        if (!email || !phoneNumber || !choice) {
            return res.status(400).json({ message: 'Email, phone number, and choice are required' });
        }

        if (!['create_new', 'use_existing'].includes(choice)) {
            return res.status(400).json({ message: 'Invalid choice. Must be "create_new" or "use_existing"' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Validate and normalize phone number
        if (!smsService.validatePhoneNumber(phoneNumber)) {
            return res.status(400).json({
                message: smsService.getValidationErrorMessage()
            });
        }

        let normalizedPhone;
        try {
            normalizedPhone = smsService.normalizeIndianPhoneNumber(phoneNumber);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }

        if (choice === 'use_existing') {
            return res.status(200).json({
                success: true,
                redirectToLogin: true,
                message: 'Please log in with your existing private key'
            });
        }

        // Choice is 'create_new' - delete existing user data
        const existingUser = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { phoneNumber: normalizedPhone }
            ]
        });

        if (existingUser) {
            // Delete the existing user and all associated data
            await User.deleteOne({ _id: existingUser._id });
            console.log(`Deleted existing user: ${existingUser.did}`);

            // TODO: Delete any associated banking data, transactions, etc.
            // This should cascade delete all related records
        }

        // Generate and send new OTPs
        const emailOTPResult = await otpService.createOTPRecord(normalizedEmail, 'email');
        const phoneOTPResult = await otpService.createOTPRecord(normalizedPhone, 'phone');

        if (!emailOTPResult.success) {
            return res.status(429).json({ message: emailOTPResult.error });
        }

        if (!phoneOTPResult.success) {
            return res.status(429).json({ message: phoneOTPResult.error });
        }

        // Send OTPs
        await emailService.sendOTPEmail(normalizedEmail, emailOTPResult.code);
        await smsService.sendOTPSMS(normalizedPhone, phoneOTPResult.code);

        res.status(200).json({
            success: true,
            message: 'Previous account deleted. OTP codes sent to email and phone',
            expiresAt: emailOTPResult.expiresAt
        });
    } catch (error) {
        console.error('Handle existing user error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * STEP 2b/3: Verify OTPs and Complete Registration
 * Verify both OTPs, then generate private key and create user
 */
exports.verifyAndCompleteRegistration = async (req, res) => {
    const { email, phoneNumber, emailOTP, phoneOTP } = req.body;

    try {
        // Validate inputs
        if (!email || !phoneNumber || !emailOTP || !phoneOTP) {
            return res.status(400).json({
                message: 'Email, phone number, and both OTP codes are required'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Validate and normalize phone number
        if (!smsService.validatePhoneNumber(phoneNumber)) {
            return res.status(400).json({
                message: smsService.getValidationErrorMessage()
            });
        }

        let normalizedPhone;
        try {
            normalizedPhone = smsService.normalizeIndianPhoneNumber(phoneNumber);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }

        // Verify email OTP
        const emailVerification = await otpService.verifyOTP(normalizedEmail, 'email', emailOTP);

        if (!emailVerification.success) {
            return res.status(400).json({
                message: `Email verification failed: ${emailVerification.error}`,
                field: 'email'
            });
        }

        // Verify phone OTP
        const phoneVerification = await otpService.verifyOTP(normalizedPhone, 'phone', phoneOTP);

        if (!phoneVerification.success) {
            return res.status(400).json({
                message: `Phone verification failed: ${phoneVerification.error}`,
                field: 'phone'
            });
        }

        // Both verified - check one more time if user already exists
        // (to prevent race conditions)
        const existingUser = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { phoneNumber: normalizedPhone }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists. Please use the existing user flow.'
            });
        }

        // Generate Wallet (Identity) - ONLY AFTER SUCCESSFUL OTP VERIFICATION
        const wallet = ethers.Wallet.createRandom();
        const did = `did:cedefi:${wallet.address.toLowerCase()}`;
        const publicKey = wallet.signingKey.publicKey;

        // Create DID Document
        const didDocument = {
            "@context": "https://www.w3.org/ns/did/v1",
            "id": did,
            "verificationMethod": [{
                "id": `${did}#keys-1`,
                "type": "EcdsaSecp256k1VerificationKey2019",
                "controller": did,
                "publicKeyHex": publicKey
            }],
            "authentication": [`${did}#keys-1`]
        };

        // Create user with verified status
        const user = await User.create({
            email: normalizedEmail,
            phoneNumber: normalizedPhone,
            did,
            publicKey,
            didDocument,
            role: 'user',
            isVerified: true,
            emailVerified: true,
            phoneVerified: true,
            emailVerifiedAt: new Date(),
            phoneVerifiedAt: new Date()
        });

        // Return Private Key ONLY ONCE upon registration
        res.status(201).json({
            _id: user._id,
            email: user.email,
            phoneNumber: user.phoneNumber,
            did: user.did,
            role: user.role,
            privateKey: wallet.privateKey, // CRITICAL: User must save this
            didDocument,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Verify and complete registration error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Existing login function - UNCHANGED
 */
exports.login = async (req, res) => {
    const { privateKey } = req.body;

    try {
        if (!privateKey) {
            return res.status(400).json({ message: 'Private Key is required' });
        }

        let wallet;
        try {
            wallet = new ethers.Wallet(privateKey);
        } catch (e) {
            return res.status(401).json({ message: 'Invalid Private Key' });
        }

        const did = `did:cedefi:${wallet.address.toLowerCase()}`;
        const user = await User.findOne({ did });

        if (user) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                phoneNumber: user.phoneNumber,
                did: user.did,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Identity not found. Please register.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * LEGACY: Keep old register endpoint for backwards compatibility
 * Mark as deprecated
 */
exports.register = async (req, res) => {
    res.status(410).json({
        message: 'This endpoint is deprecated. Please use the new multi-step registration flow.',
        endpoints: {
            step1: '/api/auth/register/initiate',
            step2a: '/api/auth/register/handle-existing',
            step2b: '/api/auth/register/verify-complete'
        }
    });
};
