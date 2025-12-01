const axios = require('axios');
const { ethers } = require('ethers');

let bankId = process.env.BANK_ID || 'UnknownBank';
let bankWallet = null; // Will be set by init

const init = (wallet, id) => {
    bankWallet = wallet;
    bankId = id;
    console.log(`[ValidatorService] Initialized for ${bankId}`);
    startPolling();
};

const startPolling = () => {
    setInterval(async () => {
        try {
            const mainSystemUrl = process.env.MAIN_SYSTEM_URL || 'http://localhost:5000';
            const res = await axios.get(`${mainSystemUrl}/transactions`);
            const transactions = res.data;

            // Find pending transactions that this bank hasn't voted on yet
            const pendingTxs = transactions.filter(tx =>
                tx.status === 'PENDING' &&
                !tx.votes.some(v => v.voter.includes(bankWallet.address.toLowerCase())) // Check if we voted
            );

            for (const tx of pendingTxs) {
                await validateAndVote(tx, mainSystemUrl);
            }
        } catch (error) {
            // console.error("Polling Error:", error.message); // Silence polling errors to avoid log spam
        }
    }, 5000); // Poll every 5 seconds
};

const validateAndVote = async (tx, mainSystemUrl) => {
    console.log(`[ValidatorService] Validating Transaction ${tx.transactionId}...`);

    let isValid = true;
    let reason = "";

    // 1. Verify Signature Presence
    if (!tx.signature) {
        isValid = false;
        reason = "Missing Signature";
    }

    // 2. Verify Balance (Mock)
    // In a real system, we'd check the ledger. Here we assume < 10000 is valid.
    if (tx.amount > 10000) {
        isValid = false;
        reason = "Insufficient Balance (Mock Limit)";
    }

    // 3. Verify Signature Cryptography (Optional for Demo)
    // if (tx.signature) {
    //    const recovered = ethers.verifyMessage(tx.transactionId, tx.signature);
    //    // Check if recovered matches sender... (Skipped as we use random wallets in Sim)
    // }

    console.log(`[ValidatorService] Decision for ${tx.transactionId}: ${isValid ? 'APPROVE' : 'REJECT'} (${reason})`);

    try {
        // Vote
        const voterDID = `did:cedefi:bank:${bankWallet.address.toLowerCase()}`;
        await axios.post(`${mainSystemUrl}/transactions/${tx.transactionId}/vote`, {
            voter: voterDID,
            decision: isValid
        });
        console.log(`[ValidatorService] Voted on ${tx.transactionId}`);
    } catch (error) {
        console.error(`[ValidatorService] Failed to vote: ${error.message}`);
    }
};

module.exports = { init };
