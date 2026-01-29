const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
    identifier: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    type: {
        type: String,
        required: true,
        enum: ['email', 'phone']
    },
    code: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }  // TTL index - auto-delete after expiration
    },
    verified: {
        type: Boolean,
        default: false
    },
    attempts: {
        type: Number,
        default: 0
    },
    maxAttempts: {
        type: Number,
        default: 3
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for efficient lookups
OTPSchema.index({ identifier: 1, type: 1, verified: 1 });

// Method to check if OTP is expired
OTPSchema.methods.isExpired = function () {
    return new Date() > this.expiresAt;
};

// Method to check if max attempts reached
OTPSchema.methods.isLocked = function () {
    return this.attempts >= this.maxAttempts;
};

module.exports = mongoose.model('OTP', OTPSchema);
