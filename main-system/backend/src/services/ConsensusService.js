const Transaction = require('../models/Transaction');
const Node = require('../models/Node');

const checkConsensus = async (transactionId) => {
    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) return null;
    if (transaction.status !== 'PENDING') return transaction.status;

    const totalNodes = await Node.countDocuments({ isActive: true });

    // If no nodes, we can't really have consensus unless we define a fallback.
    // Assuming at least 1 node for now.
    if (totalNodes === 0) return 'PENDING';

    const yesVotes = transaction.votes.filter(v => v.decision).length;
    const bankApprovals = transaction.bankApprovals.length;

    // Rule A: >= 2/3 nodes approve
    const ruleAThreshold = Math.ceil((2 / 3) * totalNodes);

    // Rule B: >= 1 bank approval AND >= 1/2 node votes
    const ruleBNodeThreshold = Math.ceil((1 / 2) * totalNodes);

    console.log(`Checking Consensus for ${transactionId}:`);
    console.log(`Total Nodes: ${totalNodes}, Yes Votes: ${yesVotes}, Bank Approvals: ${bankApprovals}`);
    console.log(`Rule A Threshold: ${ruleAThreshold}, Rule B Node Threshold: ${ruleBNodeThreshold}`);

    if (yesVotes >= ruleAThreshold) {
        console.log('Consensus Reached: Rule A');
        return 'APPROVED';
    }

    if (bankApprovals >= 1 && yesVotes >= ruleBNodeThreshold) {
        console.log('Consensus Reached: Rule B');
        return 'APPROVED';
    }

    return 'PENDING';
};

module.exports = { checkConsensus };
