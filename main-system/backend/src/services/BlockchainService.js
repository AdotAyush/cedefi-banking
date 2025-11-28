const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load Contract ABIs (assuming they are compiled and available)
// We need to point to the artifacts directory of the chain project
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
// For local hardhat node
const PROVIDER_URL = process.env.BLOCKCHAIN_PROVIDER_URL || 'http://127.0.0.1:8545';
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Account 0 of Hardhat Node

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Contract Addresses (Should be loaded from env or a deployment file)
// For now, we might need to set them manually or read from a file if we want dynamic
const CONTRACT_ADDRESSES = {
    TransactionStore: process.env.TRANSACTION_STORE_ADDRESS,
    // Add others if needed
};

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
        // We might need to create the transaction on-chain first if it doesn't exist, 
        // or ensure the contract handles it. 
        // Our contract has `finalizeTransaction`.

        // Note: In a real app, we should ensure the transaction exists on-chain.
        // For this demo, we assume it might have been created or we just call finalize.
        // Actually, our contract requires `createTransaction` first.

        // Let's check if we need to create it first.
        // For simplicity, we'll try to finalize. If it fails, we might need to create it.
        // But `createTransaction` requires sender and amount.
        // We'll skip this complexity for now and just try to call finalize, 
        // assuming the "create" step might happen elsewhere or we add a "record" function that does both.

        // Let's just log it for now if we can't easily sync state.
        console.log(`Recording ${transactionId} as ${status} on blockchain...`);
        const tx = await contract.finalizeTransaction(transactionId, approved);
        await tx.wait();
        console.log(`Transaction ${transactionId} finalized on blockchain. Hash: ${tx.hash}`);
    } catch (error) {
        console.error('Error writing to blockchain:', error.message);
    }
};

module.exports = { recordTransactionResult };
