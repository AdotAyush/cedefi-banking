const { Wallet } = require('ethers');

// Generate or load wallet from private key
const getWallet = (privateKey) => {
    if (!privateKey) {
        console.log('No private key provided, generating random wallet...');
        return Wallet.createRandom();
    }
    return new Wallet(privateKey);
};

module.exports = { getWallet };
