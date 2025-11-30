const Node = require('../models/Node');

const registerNode = async (req, res) => {
    try {
        const { url, name, publicKey } = req.body;

        // Check if exists
        let node = await Node.findOne({ url });
        if (node) {
            return res.status(400).json({ error: 'Node already registered' });
        }

        node = new Node({
            url,
            name,
            publicKey,
            status: 'PENDING',
            reputation: 50
        });
        await node.save();

        res.status(201).json(node);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getNodes = async (req, res) => {
    try {
        const nodes = await Node.find();
        res.json(nodes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const verifyNode = async (req, res) => {
    try {
        const { publicKey } = req.params;
        const { action } = req.body; // 'APPROVE' or 'REJECT'

        const node = await Node.findOne({ publicKey });
        if (!node) return res.status(404).json({ error: 'Node not found' });

        if (action === 'APPROVE') {
            node.status = 'ACTIVE';
            node.isActive = true;
            node.reputation += 10;
            node.history.push({ action: 'Verified by Admin', timestamp: new Date() });
        } else if (action === 'REJECT') {
            node.status = 'FRAUDULENT';
            node.isActive = false;
            node.reputation = 0;
            node.history.push({ action: 'Rejected by Admin', timestamp: new Date() });
        }

        await node.save();
        res.json(node);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { registerNode, getNodes, verifyNode };
