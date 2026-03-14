const axios = require('axios');

// Simple rule-based auto-voting
class AutoVoteService {
    constructor(nodeAddress, mainSystemUrl = 'http://localhost:5000') {
        this.nodeAddress = nodeAddress;
        this.mainSystemUrl = mainSystemUrl;
        this.rules = {
            // Auto-approve small transactions
            smallAmount: (amount) => amount < 1000,
            
            // Auto-reject large transactions
            largeAmount: (amount) => amount > 50000,
        };
    }

    // Evaluate transaction and decide vote
    evaluateTransaction(transaction) {
        const { amount, sender, recipient } = transaction;

        // Rule 1: Small transactions - auto approve
        if (this.rules.smallAmount(amount)) {
            return { decision: true, reason: 'Small amount - auto approved' };
        }

        // Rule 2: Large transactions - auto reject (needs manual review)
        if (this.rules.largeAmount(amount)) {
            return { decision: false, reason: 'Large amount - needs review' };
        }

        // Default: Approve medium transactions
        return { decision: true, reason: 'Standard transaction approved' };
    }

    // Automatically vote on a transaction
    async autoVote(transactionId) {
        try {
            // Get transaction details
            const response = await axios.get(`${this.mainSystemUrl}/api/transactions`);
            const transactions = response.data;
            const transaction = transactions.find(t => t.transactionId === transactionId);

            if (!transaction) {
                console.log(`Transaction ${transactionId} not found`);
                return;
            }

            // Evaluate and make decision
            const { decision, reason } = this.evaluateTransaction(transaction);
            console.log(`[AutoVote] ${transactionId}: ${decision ? 'APPROVE' : 'REJECT'} - ${reason}`);

            // Cast vote
            await axios.post(`${this.mainSystemUrl}/api/transactions/${transactionId}/vote`, {
                voter: this.nodeAddress,
                decision: decision
            });

            console.log(`✓ Vote cast successfully for ${transactionId}`);
        } catch (error) {
            console.error(`Error auto-voting on ${transactionId}:`, error.message);
        }
    }

    // Monitor for new transactions and auto-vote
    async startMonitoring(intervalMs = 10000) {
        console.log(`🤖 Auto-voting service started for node ${this.nodeAddress}`);
        console.log(`   Checking every ${intervalMs / 1000} seconds...`);

        setInterval(async () => {
            try {
                // Get all pending transactions
                const response = await axios.get(`${this.mainSystemUrl}/api/transactions`);
                const transactions = response.data;

                const pendingTxs = transactions.filter(t => 
                    t.status === 'PENDING' && 
                    !t.votes.some(v => v.voter === this.nodeAddress)
                );

                if (pendingTxs.length > 0) {
                    console.log(`\n📋 Found ${pendingTxs.length} pending transactions to vote on`);
                    
                    for (const tx of pendingTxs) {
                        await this.autoVote(tx.transactionId);
                        // Small delay between votes
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            } catch (error) {
                console.error('Error monitoring transactions:', error.message);
            }
        }, intervalMs);
    }
}

module.exports = AutoVoteService;
