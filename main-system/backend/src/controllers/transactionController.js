const Transaction = require('../models/Transaction');
const bankService = require('../services/BankIntegrationService');
const consensusService = require('../services/ConsensusService');
const blockchainService = require('../services/BlockchainService');

const createTransaction = async (req, res) => {
    try {
        const { transactionId, sender, recipient, amount } = req.body;

        // Validate DIDs
        if (!sender.startsWith('did:cedefi:') || !recipient.startsWith('did:cedefi:')) {
            return res.status(400).json({ message: 'Sender and Recipient must be valid DIDs (did:cedefi:...)' });
        }

        // Create in DB
        const transaction = await Transaction.create({
            transactionId,
            sender,
            recipient,
            amount,
            status: 'PENDING',
            recipientStatus: 'PENDING'
        });

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

        // Trigger Bank Approvals asynchronously (Real-time check)
        // We wait for this to ensure we have the latest bank signatures before consensus
        try {
            const approvals = await bankService.broadcastToBanks(transaction);
            if (approvals.length > 0) {
                console.log(`Received ${approvals.length} bank approvals for ${transactionId} after vote`);
                // Update DB with new approvals (avoiding duplicates)
                const existingBankIds = new Set(transaction.bankApprovals.map(b => b.bankId));
                approvals.forEach(a => {
                    if (!existingBankIds.has(a.bankId)) {
                        transaction.bankApprovals.push({
                            bankId: a.bankId,
                            signature: a.signature,
                            timestamp: new Date()
                        });
                    }
                });
                await transaction.save();
            }
        } catch (bankError) {
            console.error("Error contacting banks:", bankError.message);
            // Continue to consensus even if bank fails (it just won't have bank approval yet)
        }

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

const claimTransaction = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const transaction = await Transaction.findOne({ transactionId });

        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
        if (transaction.status !== 'APPROVED') return res.status(400).json({ error: 'Transaction not approved' });
        if (transaction.recipientStatus === 'CLAIMED') return res.status(400).json({ error: 'Already claimed' });

        transaction.recipientStatus = 'CLAIMED';
        await transaction.save();

        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const bankApproval = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const { bankId, signature, approved } = req.body;

        const transaction = await Transaction.findOne({ transactionId });
        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

        if (approved) {
            // Check if already approved by this bank
            const existing = transaction.bankApprovals.find(b => b.bankId === bankId);
            if (!existing) {
                transaction.bankApprovals.push({
                    bankId,
                    signature,
                    timestamp: new Date()
                });
                await transaction.save();
                console.log(`[Main System] Received approval from ${bankId} for ${transactionId}`);
            }
        } else {
            console.log(`[Main System] Received REJECTION from ${bankId} for ${transactionId}`);
            // Logic for rejection could be added here (e.g., if any bank rejects, fail tx?)
            // For now, we just log it. ConsensusService handles the "needs approval" logic.
        }

        // Check Consensus immediately
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

const faucet = async (req, res) => {
    try {
        const { recipient, amount } = req.body;
        const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const sender = 'did:cedefi:blockchain:0000000000000000000000000000000000000000';

        const transaction = await Transaction.create({
            transactionId,
            sender,
            recipient,
            amount,
            status: 'APPROVED', // Faucet is auto-approved
            recipientStatus: 'PENDING',
            bankApprovals: [] // System tx doesn't need bank approval
        });

        await blockchainService.recordTransactionResult(transactionId, 'APPROVED');

        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createTransaction, voteOnTransaction, getTransactions, claimTransaction, bankApproval, faucet };
