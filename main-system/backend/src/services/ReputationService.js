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
    console.log(`\n=== REPUTATION UPDATE for ${transactionId} ===`);
    console.log(`Ground Truth: ${bankApproved ? 'APPROVED' : 'REJECTED'} (${bankApprovalCount > 0 ? 'bank-sourced' : 'consensus-sourced'})`);
    console.log(`Total Votes: ${votes.length}`);
    console.log('='.repeat(60));

    // Build blockchain contract reference if available (optional — DB always updates)
    let contract = null;
    if (CONTRACT_ADDRESSES.NodeRegistry) {
        try {
            const abi = getContractABI('NodeRegistry');
            if (abi) contract = new ethers.Contract(CONTRACT_ADDRESSES.NodeRegistry, abi, wallet);
        } catch { /* blockchain offline */ }
    }

    const Node = require('../models/Node');

    for (const vote of votes) {
        try {
            const agreedWithTruth = vote.decision === bankApproved;

            // Read current reputation from DB (always available)
            const dbNode = await Node.findOne({ publicKey: vote.nodeAddress });
            const currentRep = dbNode ? (dbNode.reputation || 50) : 50;

            let reputationChange = 0;

            if (agreedWithTruth) {
                if (currentRep >= 85) {
                    reputationChange = 2;
                } else if (currentRep >= 70) {
                    reputationChange = 3;
                } else {
                    reputationChange = 5;
                }
                console.log(`✓ Node ${vote.nodeAddress.slice(0, 10)}... correct (+${reputationChange})`);

                if (contract) {
                    try {
                        const newRep = Math.min(currentRep + reputationChange, 95);
                        const tx = await contract.updateReputation(vote.nodeAddress, newRep);
                        await tx.wait();
                        const txVote = await contract.incrementCorrectVote(vote.nodeAddress);
                        await txVote.wait();
                    } catch { /* blockchain update optional */ }
                }
            } else {
                reputationChange = -3;
                console.log(`✗ Node ${vote.nodeAddress.slice(0, 10)}... wrong (${reputationChange})`);

                if (contract) {
                    try {
                        const tx = await contract.incrementIncorrectVote(vote.nodeAddress);
                        await tx.wait();
                    } catch { /* blockchain update optional */ }
                }
            }

            // Always update DB so reputation actually changes over time
            if (dbNode) {
                const newRep = Math.min(Math.max(currentRep + reputationChange, 10), 95);
                dbNode.reputation = newRep;
                await dbNode.save();
                console.log(`  DB reputation: ${currentRep} → ${newRep}`);
            }
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
    // Try blockchain first
    if (CONTRACT_ADDRESSES.NodeRegistry) {
        try {
            const abi = getContractABI('NodeRegistry');
            if (abi) {
                const contract = new ethers.Contract(CONTRACT_ADDRESSES.NodeRegistry, abi, provider);
                const reputation = await contract.getNodeReputation(nodeAddress);
                const rep = Number(reputation);
                if (rep > 0) return rep;
            }
        } catch {
            // Fall through to DB
        }
    }

    // DB fallback — works when blockchain is offline
    try {
        const Node = require('../models/Node');
        const node = await Node.findOne({ publicKey: nodeAddress });
        return node ? (node.reputation || 50) : 50;
    } catch {
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
