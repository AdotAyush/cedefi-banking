const Transaction = require('../models/Transaction');
const Node = require('../models/Node');
const { getNodeReputation } = require('./ReputationService');

/**
 * Check consensus with weighted voting based on node reputation
 * @param {string} transactionId - Transaction ID to check
 * @param {boolean} useWeightedVoting - Use reputation-based weights (default: true)
 */
const checkConsensus = async (transactionId, useWeightedVoting = true) => {
    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) return null;
    if (transaction.status !== 'PENDING') return transaction.status;

    const totalNodes = await Node.countDocuments({ isActive: true });

    if (totalNodes === 0) return 'PENDING';

    let yesVotes, noVotes, totalWeight;

    if (useWeightedVoting) {
        // Calculate weighted votes based on reputation
        let yesWeight = 0;
        let noWeight = 0;
        let maxPossibleWeight = 0;

        for (const vote of transaction.votes) {
            // Get node reputation from blockchain or use default
            const reputation = vote.weight || 50; // Use stored weight or default
            
            if (vote.decision) {
                yesWeight += reputation;
            } else {
                noWeight += reputation;
            }
        }

        // Calculate max possible weight (all active nodes at 100 reputation)
        maxPossibleWeight = totalNodes * 100;
        totalWeight = yesWeight + noWeight;

        yesVotes = yesWeight;
        noVotes = noWeight;

        console.log(`\n=== WEIGHTED Consensus Check for ${transactionId} ===`);
        console.log(`Total Nodes: ${totalNodes}`);
        console.log(`Yes Weight: ${yesWeight.toFixed(2)} | No Weight: ${noWeight.toFixed(2)}`);
        console.log(`Total Weight Cast: ${totalWeight.toFixed(2)} / ${maxPossibleWeight} (max possible)`);

    } else {
        // Traditional unweighted voting (1 node = 1 vote)
        yesVotes = transaction.votes.filter(v => v.decision).length;
        noVotes = transaction.votes.filter(v => !v.decision).length;
        
        console.log(`\n=== UNWEIGHTED Consensus Check for ${transactionId} ===`);
        console.log(`Total Nodes: ${totalNodes}, Yes Votes: ${yesVotes}, No Votes: ${noVotes}`);
    }

    const bankApprovals = transaction.bankApprovals.length;

    // Weighted voting thresholds
    const ruleAThreshold = useWeightedVoting 
        ? (totalNodes * 100 * 2 / 3) // 2/3 of max possible weight
        : Math.ceil((2 / 3) * totalNodes);

    const ruleBNodeThreshold = useWeightedVoting
        ? (totalNodes * 100 / 2) // 1/2 of max possible weight
        : Math.ceil((1 / 2) * totalNodes);

    const rejectionThreshold = useWeightedVoting
        ? (totalNodes * 100 / 2) // >1/2 of max possible weight
        : Math.floor(totalNodes / 2) + 1;

    console.log(`Bank Approvals: ${bankApprovals}`);
    console.log(`Rule A Threshold: ${ruleAThreshold.toFixed(2)} (2/3 approval)`);
    console.log(`Rule B Threshold: ${ruleBNodeThreshold.toFixed(2)} (1/2 with bank approval)`);
    console.log(`Rejection Threshold: ${rejectionThreshold.toFixed(2)} (>1/2 rejection)`);

    // Rejection Rule: > 1/2 nodes reject
    if (totalNodes > 0 && noVotes > rejectionThreshold) {
        console.log('✗ Consensus: REJECTED (majority rejection)');
        console.log('===========================================\n');
        return 'REJECTED';
    }

    // Rule A: >= 2/3 nodes approve
    if (totalNodes > 0 && yesVotes >= ruleAThreshold) {
        console.log('✓ Consensus: APPROVED (Rule A - 2/3 majority)');
        console.log('===========================================\n');
        return 'APPROVED';
    }

    // Rule B: >= 1 bank approval AND >= 1/2 node votes
    if (totalNodes > 0 && bankApprovals >= 1 && yesVotes >= ruleBNodeThreshold) {
        console.log('✓ Consensus: APPROVED (Rule B - bank + 1/2 nodes)');
        console.log('===========================================\n');
        return 'APPROVED';
    }

    console.log('⏳ Consensus: PENDING (thresholds not met)');
    console.log('===========================================\n');
    return 'PENDING';
};

module.exports = { checkConsensus };
