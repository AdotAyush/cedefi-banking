const Node = require('../models/Node');

const registerNode = async (req, res) => {
    try {
        const { url, name, publicKey } = req.body;

        // Check if exists
        let node = await Node.findOne({ url });
        if (node) {
            return res.status(400).json({ error: 'Node already registered' });
        }

        node = new Node({ url, name, publicKey });
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

module.exports = { registerNode, getNodes };
