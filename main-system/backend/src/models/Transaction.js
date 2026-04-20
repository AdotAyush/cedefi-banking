const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    sender: {
        type: String, // Stores DID
        required: true
    },
    recipient: {
        type: String, // Stores DID
        required: true
    },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    recipientStatus: { type: String, enum: ['PENDING', 'CLAIMED'], default: 'PENDING' },
    votes: [{
        voter: String,
        decision: Boolean, // true = YES, false = NO
        weight: { type: Number, default: 50 }, // Vote weight based on reputation (0-100)
        reason: { type: String, default: '' },  // Explanation from the node's evaluation
        timestamp: { type: Date, default: Date.now }
    }],
    bankApprovals: [{
        bankId: String,
        signature: String,
        timestamp: { type: Date, default: Date.now }
    }],
    bankRejections: [{
        bankId: String,
        reason: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
