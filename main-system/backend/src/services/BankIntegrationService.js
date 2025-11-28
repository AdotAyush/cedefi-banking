const axios = require('axios');

const BANKS = [
    process.env.BANK_A_URL || 'http://localhost:3001',
    process.env.BANK_B_URL || 'http://localhost:3002',
    process.env.BANK_C_URL || 'http://localhost:3003'
];

const requestApproval = async (bankUrl, transaction) => {
    try {
        const response = await axios.post(`${bankUrl}/bank/approve`, {
            transactionId: transaction.transactionId,
            sender: transaction.sender,
            amount: transaction.amount
        });
        return response.data;
    } catch (error) {
        console.error(`Error requesting approval from ${bankUrl}:`, error.message);
        return null;
    }
};

const broadcastToBanks = async (transaction) => {
    const promises = BANKS.map(url => requestApproval(url, transaction));
    const results = await Promise.all(promises);
    return results.filter(res => res && res.approved);
};

module.exports = { broadcastToBanks };
