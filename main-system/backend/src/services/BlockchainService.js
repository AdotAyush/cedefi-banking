const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load Contract ABIs
const ARTIFACTS_PATH = path.resolve(__dirname, '../../../chain/artifacts/contracts');

const getContractABI = (contractName) => {
    try {
        const artifactPath = path.join(ARTIFACTS_PATH, `${contractName}.sol`, `${contractName}.json`);
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        return artifact.abi;
    } catch (error) {
        console.error(`Error loading ABI for ${contractName}:`, error.message);
        return null;
    }
};

// Provider and Signer
const PROVIDER_URL = process.env.BLOCKCHAIN_PROVIDER_URL || 'http://127.0.0.1:8545';
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Account 0 of Hardhat Node

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Contract Addresses
const CONTRACTS_FILE = path.resolve(__dirname, '../config/contracts.json');
let CONTRACT_ADDRESSES = {};

try {
    if (fs.existsSync(CONTRACTS_FILE)) {
        CONTRACT_ADDRESSES = JSON.parse(fs.readFileSync(CONTRACTS_FILE, 'utf8'));
        console.log('Loaded contract addresses:', CONTRACT_ADDRESSES);
    } else {
        console.warn('contracts.json not found. Make sure to deploy contracts first.');
    }
} catch (error) {
    console.error('Error loading contract addresses:', error.message);
}

const recordTransactionResult = async (transactionId, status) => {
    if (!CONTRACT_ADDRESSES.TransactionStore) {
        console.warn('TransactionStore address not set. Skipping blockchain write.');
        return;
    }

    const abi = getContractABI('TransactionStore');
    if (!abi) return;

    const contract = new ethers.Contract(CONTRACT_ADDRESSES.TransactionStore, abi, wallet);

    try {
        const approved = status === 'APPROVED';

        // Check if transaction exists on-chain first
        const txData = await contract.getTransaction(transactionId);

        if (txData.timestamp == 0) {
            console.log(`Creating transaction ${transactionId} on-chain before finalizing...`);
            const createTx = await contract.createTransaction(transactionId, "System", 0);
            await createTx.wait();
        }

        console.log(`Recording ${transactionId} as ${status} on blockchain...`);
        const tx = await contract.finalizeTransaction(transactionId, approved);
        await tx.wait();
        console.log(`Transaction ${transactionId} finalized on blockchain. Hash: ${tx.hash}`);
    } catch (error) {
        console.error('Error writing to blockchain:', error.message);
        if (error.message.includes("Already finalized")) {
            console.log("Transaction was already finalized on-chain.");
        }
    }
};

module.exports = { recordTransactionResult };
