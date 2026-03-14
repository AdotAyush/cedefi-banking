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
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Contract Addresses
const CONTRACTS_FILE = path.resolve(__dirname, '../config/contracts.json');
let CONTRACT_ADDRESSES = {};

try {
    if (fs.existsSync(CONTRACTS_FILE)) {
        CONTRACT_ADDRESSES = JSON.parse(fs.readFileSync(CONTRACTS_FILE, 'utf8'));
    }
} catch (error) {
    console.error('Error loading contract addresses:', error.message);
}

/**
 * Update node reputation after transaction finalization
 * HYBRID APPROACH: Uses bank approval as ground truth (external validator)
 * with reputation caps to prevent excessive dominance
 * 
 * @param {string} transactionId - Transaction ID
 * @param {boolean} bankApproved - True if banks approved (GROUND TRUTH)
 * @param {Array} votes - Array of vote objects {nodeAddress, decision}
 * @param {number} bankApprovalCount - Number of banks that approved
 */
const updateNodeReputations = async (transactionId, bankApproved, votes, bankApprovalCount = 0) => {
    if (!CONTRACT_ADDRESSES.NodeRegistry) {
        console.warn('NodeRegistry address not set. Skipping reputation update.');
        return;
    }

    const abi = getContractABI('NodeRegistry');
    if (!abi) return;

    const contract = new ethers.Contract(CONTRACT_ADDRESSES.NodeRegistry, abi, wallet);

    console.log(`\n=== HYBRID REPUTATION UPDATE for ${transactionId} ===`);
    console.log(`Ground Truth (Bank Decision): ${bankApproved ? 'APPROVED' : 'REJECTED'}`);
    console.log(`Bank Approvals: ${bankApprovalCount}`);
    console.log(`Total Votes: ${votes.length}`);
    console.log(`Strategy: Nodes judged against BANK decision (external truth)`);
    console.log('='.repeat(60));

    for (const vote of votes) {
        try {
            // CRITICAL: Compare vote against BANK decision, not consensus
            const agreedWithBank = vote.decision === bankApproved;
            
            // Get current reputation to apply caps
            const currentReputation = await contract.getNodeReputation(vote.nodeAddress);
            const currentRep = Number(currentReputation);

            let reputationChange = 0;
            let action = '';
            
            if (agreedWithBank) {
                // Node agreed with external bank validators
                if (currentRep >= 85) {
                    // Cap at 85: Slower growth to prevent dominance
                    reputationChange = 2;
                    action = 'CORRECT (capped growth +2)';
                } else if (currentRep >= 70) {
                    // Moderate growth
                    reputationChange = 3;
                    action = 'CORRECT (moderate +3)';
                } else {
                    // Normal growth for lower reputation nodes
                    reputationChange = 5;
                    action = 'CORRECT (normal +5)';
                }
                
                console.log(`✓ Node ${vote.nodeAddress.slice(0, 10)}... agreed with bank: ${action}`);
                
                // Manually update with custom increment
                if (reputationChange > 0) {
                    const newRep = Math.min(currentRep + reputationChange, 95); // Hard cap at 95
                    const tx = await contract.updateReputation(vote.nodeAddress, newRep);
                    await tx.wait();
                    
                    // Also increment vote counters
                    const txVote = await contract.incrementCorrectVote(vote.nodeAddress);
                    await txVote.wait();
                }
                
            } else {
                // Node disagreed with bank validators
                reputationChange = -3;
                action = 'WRONG (-3)';
                
                console.log(`✗ Node ${vote.nodeAddress.slice(0, 10)}... disagreed with bank: ${action}`);
                const tx = await contract.incrementIncorrectVote(vote.nodeAddress);
                await tx.wait();
            }

            // Get final reputation
            const finalReputation = await contract.getNodeReputation(vote.nodeAddress);
            console.log(`  Reputation: ${currentRep} → ${finalReputation.toString()} (${reputationChange >= 0 ? '+' : ''}${reputationChange})`);

        } catch (error) {
            console.error(`Error updating reputation for ${vote.nodeAddress}:`, error.message);
        }
    }

    console.log('=== Reputation Update Complete ===\n');
};

/**
 * Get reputation for a specific node
 * @param {string} nodeAddress - Node wallet address
 */
const getNodeReputation = async (nodeAddress) => {
    if (!CONTRACT_ADDRESSES.NodeRegistry) {
        return 50; // Default reputation
    }

    const abi = getContractABI('NodeRegistry');
    if (!abi) return 50;

    const contract = new ethers.Contract(CONTRACT_ADDRESSES.NodeRegistry, abi, provider);

    try {
        const reputation = await contract.getNodeReputation(nodeAddress);
        return Number(reputation);
    } catch (error) {
        console.error('Error getting node reputation:', error.message);
        return 50;
    }
};

/**
 * Get all active nodes with their reputations
 */
const getAllNodeReputations = async () => {
    if (!CONTRACT_ADDRESSES.NodeRegistry) {
        return [];
    }

    const abi = getContractABI('NodeRegistry');
    if (!abi) return [];

    const contract = new ethers.Contract(CONTRACT_ADDRESSES.NodeRegistry, abi, provider);

    try {
        const nodeCount = await contract.getActiveNodeCount();
        const nodes = [];

        // Get all node addresses
        for (let i = 0; i < nodeCount; i++) {
            const address = await contract.nodeAddresses(i);
            const nodeData = await contract.nodes(address);
            
            if (nodeData.isActive) {
                nodes.push({
                    address: address,
                    name: nodeData.name,
                    reputation: Number(nodeData.reputation),
                    totalVotes: Number(nodeData.totalVotes),
                    correctVotes: Number(nodeData.correctVotes),
                    accuracy: nodeData.totalVotes > 0 
                        ? (Number(nodeData.correctVotes) / Number(nodeData.totalVotes) * 100).toFixed(2) + '%'
                        : 'N/A'
                });
            }
        }

        return nodes;
    } catch (error) {
        console.error('Error getting all node reputations:', error.message);
        return [];
    }
};

module.exports = {
    updateNodeReputations,
    getNodeReputation,
    getAllNodeReputations
};
