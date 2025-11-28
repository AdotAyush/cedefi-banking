const { getWallet } = require('../utils/crypto');

let bankWallet = null;
let bankId = process.env.BANK_ID || 'UnknownBank';

const initBank = () => {
    const privateKey = process.env.BANK_PRIVATE_KEY;
    bankWallet = getWallet(privateKey);
    console.log(`[${bankId}] Initialized with address: ${bankWallet.address}`);
};

const getInfo = (req, res) => {
    if (!bankWallet) initBank();
    res.json({
        bankId,
        address: bankWallet.address,
        publicKey: bankWallet.signingKey.publicKey
    });
};

const approveTransaction = async (req, res) => {
    if (!bankWallet) initBank();
    const { transactionId, sender, amount } = req.body;

    if (!transactionId) {
        return res.status(400).json({ error: 'Missing transactionId' });
    }

    // Business Logic: Reject if amount > 1,000,000 (Example rule)
    if (amount && amount > 1000000) {
        console.log(`[${bankId}] Auto-rejecting transaction ${transactionId} (Amount too high)`);
        return res.json({
            approved: false,
            bankId,
            reason: "Amount exceeds limit"
        });
    }

    // Sign the transactionId to prove approval
    try {
        // We sign the transactionId string directly. 
        // In a real app, we might sign a hash of the full payload.
        const signature = await bankWallet.signMessage(transactionId);

        console.log(`[${bankId}] Approved transaction ${transactionId}`);
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

const rejectTransaction = (req, res) => {
    const { transactionId } = req.body;
    console.log(`[${bankId}] Rejected transaction ${transactionId}`);
    res.json({
        approved: false,
        bankId
    });
};

const healthCheck = (req, res) => {
    res.sendStatus(200);
};

module.exports = { initBank, getInfo, approveTransaction, rejectTransaction, healthCheck };
