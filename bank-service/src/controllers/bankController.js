const { getWallet } = require('../utils/crypto');

let bankWallet = null;
let bankId = process.env.BANK_ID || 'UnknownBank';
let bankDID = null;

const initBank = () => {
    const privateKey = process.env.BANK_PRIVATE_KEY;
    bankWallet = getWallet(privateKey);
    bankDID = `did:cedefi:bank:${bankWallet.address.toLowerCase()}`;
    console.log(`[${bankId}] Initialized. DID: ${bankDID}`);
};

const getInfo = (req, res) => {
    if (!bankWallet) initBank();
    res.json({
        bankId,
        address: bankWallet.address,
        publicKey: bankWallet.signingKey.publicKey,
        did: bankDID
    });
};

const axios = require('axios');

// State
let trustedNodes = []; // List of public keys
let securityPolicy = {
    minTrustedVotes: 1,
    requireBankConsensus: false
};

const getSettings = (req, res) => {
    res.json({ trustedNodes, securityPolicy });
};

const updateSettings = (req, res) => {
    const { trustedNodes: newNodes, securityPolicy: newPolicy } = req.body;
    if (newNodes) trustedNodes = newNodes;
    if (newPolicy) securityPolicy = { ...securityPolicy, ...newPolicy };
    console.log(`[${bankId}] Settings updated. Trusted Nodes: ${trustedNodes.length}, Min Votes: ${securityPolicy.minTrustedVotes}`);
    res.json({ success: true, trustedNodes, securityPolicy });
};

const approveTransaction = async (req, res) => {
    if (!bankWallet) initBank();
    const { transactionId, sender, amount, force } = req.body;

    if (!transactionId) {
        return res.status(400).json({ error: 'Missing transactionId' });
    }

    // 1. Check Amount Limit (Skip if forced)
    if (!force && amount && amount > 1000000) {
        console.log(`[${bankId}] Auto-rejecting transaction ${transactionId} (Amount too high)`);
        return res.json({ approved: false, bankId, reason: "Amount exceeds limit" });
    }

    // 2. Dynamic Consensus Check (Skip if forced)
    if (!force) {
        try {
            // Fetch current transaction state from Main System
            const mainSystemUrl = process.env.MAIN_SYSTEM_URL || 'http://localhost:5000';
            const txRes = await axios.get(`${mainSystemUrl}/transactions`);
            const transaction = txRes.data.find(t => t.transactionId === transactionId);

            if (!transaction) {
                console.log(`[${bankId}] Transaction ${transactionId} not found in main system.`);
                // If not found, we can't verify votes.
            } else {
                // Count Trusted Votes
                const validVotes = transaction.votes.filter(v =>
                    v.decision === true && trustedNodes.includes(v.voter)
                ).length;

                console.log(`[${bankId}] Validating ${transactionId}. Trusted Votes: ${validVotes}/${securityPolicy.minTrustedVotes}`);

                if (validVotes < securityPolicy.minTrustedVotes) {
                    return res.json({
                        approved: false,
                        bankId,
                        reason: `Insufficient trusted votes (${validVotes}/${securityPolicy.minTrustedVotes})`
                    });
                }
            }
        } catch (error) {
            console.error(`[${bankId}] Error fetching transaction details:`, error.message);
            return res.json({ approved: false, bankId, reason: "Verification failed (Main System Unreachable)" });
        }
    } else {
        console.log(`[${bankId}] Manual Force Approval for ${transactionId}`);
    }

    // 3. Sign Approval
    try {
        const signature = await bankWallet.signMessage(transactionId);
        console.log(`[${bankId}] Approved transaction ${transactionId}`);

        // Notify Main System
        const mainSystemUrl = process.env.MAIN_SYSTEM_URL || 'http://localhost:5000';
        try {
            await axios.post(`${mainSystemUrl}/transactions/${transactionId}/bank-approval`, {
                bankId,
                signature,
                approved: true
            });
            console.log(`[${bankId}] Notified Main System of approval`);
        } catch (notifyError) {
            console.error(`[${bankId}] Failed to notify Main System:`, notifyError.message);
        }

        res.json({
            approved: true,
            bankId,
            signature,
            signerAddress: bankWallet.address
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Signing failed' });
    }
};

const rejectTransaction = async (req, res) => {
    const { transactionId } = req.body;
    console.log(`[${bankId}] Rejected transaction ${transactionId}`);

    // Notify Main System
    const mainSystemUrl = process.env.MAIN_SYSTEM_URL || 'http://localhost:5000';
    try {
        await axios.post(`${mainSystemUrl}/transactions/${transactionId}/bank-approval`, {
            bankId,
            approved: false
        });
    } catch (notifyError) {
        console.error(`[${bankId}] Failed to notify Main System:`, notifyError.message);
    }

    res.json({
        approved: false,
        bankId
    });
};

const initiateTransfer = async (req, res) => {
    if (!bankWallet) initBank();
    const { recipient, amount } = req.body;
    const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[${bankId}] Initiating transfer of ${amount} to ${recipient}`);

    const mainSystemUrl = process.env.MAIN_SYSTEM_URL || 'http://localhost:5000';
    try {
        const response = await axios.post(`${mainSystemUrl}/transactions`, {
            transactionId,
            sender: bankDID,
            recipient,
            amount
        });
        res.json(response.data);
    } catch (error) {
        console.error(`[${bankId}] Transfer failed:`, error.message);
        res.status(500).json({ error: 'Transfer failed' });
    }
};

const requestFunds = async (req, res) => {
    if (!bankWallet) initBank();
    const { amount } = req.body;
    console.log(`[${bankId}] Requesting ${amount} from Blockchain Faucet`);

    const mainSystemUrl = process.env.MAIN_SYSTEM_URL || 'http://localhost:5000';
    try {
        const response = await axios.post(`${mainSystemUrl}/transactions/faucet`, {
            recipient: bankDID,
            amount
        });
        res.json(response.data);
    } catch (error) {
        console.error(`[${bankId}] Faucet request failed:`, error.message);
        res.status(500).json({ error: 'Faucet request failed' });
    }
};

const healthCheck = (req, res) => {
    res.sendStatus(200);
};

module.exports = {
    initBank,
    getInfo,
    approveTransaction,
    rejectTransaction,
    healthCheck,
    getSettings,
    updateSettings,
    initiateTransfer,
    requestFunds
};
