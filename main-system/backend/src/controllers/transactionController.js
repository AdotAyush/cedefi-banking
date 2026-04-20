const Transaction = require('../models/Transaction');
const bankService = require('../services/BankIntegrationService');
const consensusService = require('../services/ConsensusService');
const blockchainService = require('../services/BlockchainService');
const { updateNodeReputations, getNodeReputation } = require('../services/ReputationService');
const { triggerAutoVotesForTransaction } = require('../services/NodeAutoVoteService');

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

        // Trigger auto-voting from all active nodes asynchronously (non-blocking)
        // Small delay gives bank approvals a chance to arrive first
        setTimeout(() => triggerAutoVotesForTransaction(transactionId), 2000);

        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const triggerVotes = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const transaction = await Transaction.findOne({ transactionId });
        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
        if (transaction.status !== 'PENDING') {
            return res.status(400).json({ error: `Transaction is already ${transaction.status}` });
        }
        // Fire and forget — client will poll for updates
        triggerAutoVotesForTransaction(transactionId);
        res.json({ message: 'Auto-voting triggered', transactionId });
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

        // Get voter's reputation weight (from blockchain or default)
        const weight = await getNodeReputation(voter);
        
        transaction.votes.push({ 
            voter, 
            decision, 
            weight,
            timestamp: new Date() 
        });
        await transaction.save();

        console.log(`Vote recorded: ${voter.slice(0, 10)}... voted ${decision ? 'YES' : 'NO'} with weight ${weight}`);

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
                
                // Ground truth: bank decision if banks participated; otherwise use consensus result
                const hasBankInput = transaction.bankApprovals.length > 0 ||
                    (transaction.bankRejections && transaction.bankRejections.length > 0);
                const groundTruth = hasBankInput
                    ? transaction.bankApprovals.length > 0
                    : (status === 'APPROVED');
                
                await updateNodeReputations(
                    transactionId,
                    groundTruth,
                    transaction.votes.map(v => ({ nodeAddress: v.voter, decision: v.decision })),
                    transaction.bankApprovals.length
                );
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
                console.log(`[Main System] Bank approval from ${bankId} for ${transactionId}`);
            }
        } else {
            // Bank veto — immediately reject the transaction (banks are ground truth)
            console.log(`[Main System] Bank ${bankId} VETOED ${transactionId} — rejecting immediately`);
            if (!transaction.bankRejections) transaction.bankRejections = [];
            transaction.bankRejections.push({
                bankId,
                reason: req.body.reason || 'Bank rejected transaction',
                timestamp: new Date()
            });
            transaction.status = 'REJECTED';
            await transaction.save();

            try { await blockchainService.recordTransactionResult(transactionId, 'REJECTED'); } catch {}

            // Nodes that voted NO were correct
            if (transaction.votes.length > 0) {
                await updateNodeReputations(
                    transactionId,
                    false,
                    transaction.votes.map(v => ({ nodeAddress: v.voter, decision: v.decision })),
                    0
                );
            }
            return res.json({ message: `Transaction ${transactionId} rejected by bank ${bankId}`, transaction });
        }

        // Check Consensus immediately
        const status = await consensusService.checkConsensus(transactionId);
        if (status && status !== transaction.status) {
            transaction.status = status;
            await transaction.save();
            
            // Write to Blockchain
            if (status === 'APPROVED' || status === 'REJECTED') {
                await blockchainService.recordTransactionResult(transactionId, status);
                
                // Bank approval path — bank approved (rejection already returned above)
                await updateNodeReputations(
                    transactionId,
                    true,
                    transaction.votes.map(v => ({ nodeAddress: v.voter, decision: v.decision })),
                    transaction.bankApprovals.length
                );
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

module.exports = { createTransaction, voteOnTransaction, getTransactions, claimTransaction, bankApproval, faucet, triggerVotes };
