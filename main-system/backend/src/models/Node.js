const mongoose = require('mongoose');

const NodeSchema = new mongoose.Schema({
    url: { type: String, required: true },
    name: { type: String, required: true },
    publicKey: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ['PENDING', 'ACTIVE', 'FRAUDULENT'], default: 'PENDING' },
    reputation: { type: Number, default: 50 },
    history: [{
        action: String,
        timestamp: { type: Date, default: Date.now }
    }],
    registeredAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Node', NodeSchema);
