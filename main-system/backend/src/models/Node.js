const mongoose = require('mongoose');

const NodeSchema = new mongoose.Schema({
    url: { type: String, required: true },
    name: { type: String, required: true },
    publicKey: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    registeredAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Node', NodeSchema);
