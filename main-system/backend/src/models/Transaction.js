const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    transactionId: { type: String, required: true, unique: true },
    sender: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    votes: [{
        voter: String,
        decision: Boolean, // true = YES, false = NO
        timestamp: { type: Date, default: Date.now }
    }],
    bankApprovals: [{
        bankId: String,
        signature: String,
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
