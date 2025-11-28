const Transaction = require('../models/Transaction');
const bankService = require('../services/BankIntegrationService');
const consensusService = require('../services/ConsensusService');
const blockchainService = require('../services/BlockchainService');

const createTransaction = async (req, res) => {
    try {
        const { transactionId, sender, amount } = req.body;

        // Create in DB
        const transaction = new Transaction({ transactionId, sender, amount });
        await transaction.save();

        // Trigger Bank Approvals asynchronously
        bankService.broadcastToBanks(transaction).then(async (approvals) => {
            if (approvals.length > 0) {
                console.log(`Received ${approvals.length} bank approvals for ${transactionId}`);
                // Update DB with approvals
                transaction.bankApprovals = approvals.map(a => ({
                    bankId: a.bankId,
                    signature: a.signature,
                    timestamp: new Date()
                }));
                await transaction.save();

                // Check Consensus
                const status = await consensusService.checkConsensus(transactionId);
                if (status && status !== transaction.status) {
                    transaction.status = status;
                    await transaction.save();
                    // Write to Blockchain
                    if (status === 'APPROVED' || status === 'REJECTED') {
                        await blockchainService.recordTransactionResult(transactionId, status);
                    }
                }
            }
        });

        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const voteOnTransaction = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const { voter, decision } = req.body; // decision: true/false

        const transaction = await Transaction.findOne({ transactionId });
        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

        // Check if already voted
        if (transaction.votes.some(v => v.voter === voter)) {
            return res.status(400).json({ error: 'Already voted' });
        }

        transaction.votes.push({ voter, decision, timestamp: new Date() });
        await transaction.save();

        // Check Consensus
        const status = await consensusService.checkConsensus(transactionId);
        if (status && status !== transaction.status) {
            transaction.status = status;
            await transaction.save();
            // Write to Blockchain
            if (status === 'APPROVED' || status === 'REJECTED') {
                await blockchainService.recordTransactionResult(transactionId, status);
            }
        }

        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ createdAt: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createTransaction, voteOnTransaction, getTransactions };
