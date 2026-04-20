const Transaction = require('../models/Transaction');
const Node = require('../models/Node');

/**
 * Check consensus using ACTUAL node reputations from the DB as weights.
 *
 * Bug fix: the old code used (totalNodes * 100 * 2/3) as threshold — that assumed
 * every node has reputation 100. Real nodes start at 50, so the threshold was
 * unreachable. Now we sum actual DB reputations as the denominator.
 *
 * Rules:
 *  Hard rejection : any bank rejection present → immediate REJECTED
 *  Rule A         : YES weight >= 2/3 of total active-node weight → APPROVED
 *  Rule B         : YES weight >= 1/2 of total + at least 1 bank approval → APPROVED
 *  Soft rejection : NO weight >  1/2 of total active-node weight → REJECTED
 */
const checkConsensus = async (transactionId) => {
    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) return null;
    if (transaction.status !== 'PENDING') return transaction.status;

    // Hard rule — a bank rejection immediately settles the transaction
    if (transaction.bankRejections && transaction.bankRejections.length > 0) {
        console.log(`\n✗ REJECTED — bank veto for ${transactionId}`);
        return 'REJECTED';
    }

    // Fetch live reputations from DB (blockchain may be offline)
    const activeNodes = await Node.find({ isActive: true, status: 'ACTIVE' });
    const totalNodes = activeNodes.length;
    if (totalNodes === 0) return 'PENDING';

    // Use ACTUAL reputation sum as denominator (fixes the "threshold unreachable" bug)
    const totalNodeWeight = activeNodes.reduce((sum, n) => sum + (n.reputation || 50), 0);

    // Tally weighted votes (weight was snapshotted at vote time)
    let yesWeight = 0;
    let noWeight = 0;
    for (const vote of transaction.votes) {
        const w = vote.weight || 50;
        if (vote.decision) yesWeight += w;
        else noWeight += w;
    }

    const bankApprovals = transaction.bankApprovals.length;

    // Thresholds — fractions of REAL total weight
    const ruleAThreshold  = totalNodeWeight * (2 / 3); // 2/3 YES → approved without bank
    const ruleBThreshold  = totalNodeWeight * (1 / 2); // 1/2 YES + bank → approved
    const rejectThreshold = totalNodeWeight * (1 / 2); // >1/2 NO  → rejected

    console.log(`\n=== CONSENSUS: ${transactionId} ===`);
    console.log(`Active nodes: ${totalNodes} | Total weight: ${totalNodeWeight} | Voted: ${transaction.votes.length}`);
    console.log(`YES: ${yesWeight.toFixed(1)} | NO: ${noWeight.toFixed(1)} | Bank approvals: ${bankApprovals}`);
    console.log(`Rule A ≥ ${ruleAThreshold.toFixed(1)} | Rule B ≥ ${ruleBThreshold.toFixed(1)} w/bank | Reject > ${rejectThreshold.toFixed(1)}`);

    // Rejection: majority of weight voted NO
    if (noWeight > rejectThreshold) {
        console.log('✗ REJECTED — NO weight exceeded majority threshold');
        console.log('='.repeat(50));
        return 'REJECTED';
    }

    // Rule A: 2/3 supermajority by weight — no bank required
    if (yesWeight >= ruleAThreshold) {
        console.log('✓ APPROVED — Rule A: YES weight ≥ 2/3 of total node weight');
        console.log('='.repeat(50));
        return 'APPROVED';
    }

    // Rule B: simple majority by weight + at least one bank signed off
    if (bankApprovals >= 1 && yesWeight >= ruleBThreshold) {
        console.log('✓ APPROVED — Rule B: bank approval + YES weight ≥ 1/2');
        console.log('='.repeat(50));
        return 'APPROVED';
    }

    console.log('⏳ PENDING — thresholds not yet met');
    console.log('='.repeat(50));
    return 'PENDING';
};

module.exports = { checkConsensus };
