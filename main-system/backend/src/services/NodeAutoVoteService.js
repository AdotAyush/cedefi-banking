const Node = require('../models/Node');
const Transaction = require('../models/Transaction');
const { getNodeReputation } = require('./ReputationService');
const { checkConsensus } = require('./ConsensusService');
const blockchainService = require('./BlockchainService');
const { updateNodeReputations } = require('./ReputationService');

/**
 * Derive a deterministic personality from a node's public key.
 * Balanced 20% distribution across 5 distinct types.
 * MUST match derivePersonality() in Simulator.jsx and nodeController.js.
 */
function derivePersonality(publicKey) {
    const sum = (publicKey || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const types = ['standard', 'conservative', 'fraud-detection', 'liberal', 'strict'];
    return types[sum % types.length];
}

/**
 * Fetch rich behavioural context for a transaction from the database.
 * Called once before the voting loop — all nodes share the same computed signals.
 *
 * Returned fields
 * ───────────────
 * hourVelocity     – sender tx count in last 1 h (excluding this tx)
 * dayVelocity      – sender tx count in last 24 h
 * rejectionCount   – total lifetime rejections for sender
 * recipientRepeat  – times sender sent to THIS recipient in last 1 h
 * amountDeviation  – this amount ÷ sender's historical average
 * historicalCount  – number of past txs used for the average
 *
 * New behavioural signals
 * ───────────────────────
 * senderScore      – 0-100 composite reliability score derived from full tx history
 * isStructuring    – amount is 95-99 % of a round-number threshold (avoidance signal)
 * velocityPattern  – 'burst' | 'new' | 'normal'
 * escalating       – last 3 txs each grew >20 % and this tx is the largest
 * recipientRisk    – 0-100 score; high when recipient receives from many senders rapidly
 */
async function getTransactionContext(transaction) {
    const { sender, recipient, transactionId, amount } = transaction;
    const now           = new Date();
    const thirtyMinAgo  = new Date(now - 30 * 60 * 1000);
    const oneHourAgo    = new Date(now - 60 * 60 * 1000);
    const oneDayAgo     = new Date(now - 24 * 60 * 60 * 1000);
    const sixHoursAgo   = new Date(now - 6 * 60 * 60 * 1000);
    const baseFilter    = { sender, transactionId: { $ne: transactionId } };

    try {
        const [
            hourVelocity,
            dayVelocity,
            burstCount,            // tx in last 30 min — for burst detection
            rejectionCount,
            recipientRepeat,
            allSenderTxs,          // full history for senderScore + escalation
            recentRecipientSenders // distinct senders to recipient in last 6 h
        ] = await Promise.all([
            Transaction.countDocuments({ ...baseFilter, createdAt: { $gte: oneHourAgo } }),
            Transaction.countDocuments({ ...baseFilter, createdAt: { $gte: oneDayAgo } }),
            Transaction.countDocuments({ ...baseFilter, createdAt: { $gte: thirtyMinAgo } }),
            Transaction.countDocuments({ ...baseFilter, status: 'REJECTED' }),
            Transaction.countDocuments({
                sender, recipient,
                transactionId: { $ne: transactionId },
                createdAt: { $gte: oneHourAgo }
            }),
            Transaction.find({ ...baseFilter })
                .select('amount status createdAt')
                .sort({ createdAt: -1 })
                .limit(50)
                .lean(),
            Transaction.distinct('sender', {
                recipient,
                transactionId: { $ne: transactionId },
                createdAt: { $gte: sixHoursAgo }
            })
        ]);

        // ── senderScore (0–100) ───────────────────────────────────────────────
        // Combines approval rate with recency bias:
        //  - recent outcomes (last 10 txs) count double
        //  - brand-new senders (< 3 txs) get a cautious 40
        let senderScore = 50; // neutral default
        const totalHistory = allSenderTxs.length;
        if (totalHistory >= 3) {
            const recent   = allSenderTxs.slice(0, 10);
            const older    = allSenderTxs.slice(10);
            const approvedRecent = recent.filter(t => t.status === 'APPROVED').length;
            const approvedOlder  = older.filter(t => t.status === 'APPROVED').length;
            // Weight: recent = 2×, older = 1×
            const weightedApproved = approvedRecent * 2 + approvedOlder;
            const weightedTotal    = recent.length * 2 + older.length;
            senderScore = Math.round((weightedApproved / weightedTotal) * 100);
        } else if (totalHistory > 0 && totalHistory < 3) {
            senderScore = 40; // insufficient history → cautious default
        }

        // ── amountDeviation ───────────────────────────────────────────────────
        const approvedAmounts = allSenderTxs
            .filter(t => t.status === 'APPROVED')
            .map(t => t.amount)
            .filter(a => a > 0);
        const avgAmount = approvedAmounts.length > 0
            ? approvedAmounts.reduce((s, a) => s + a, 0) / approvedAmounts.length
            : amount;
        const amountDeviation = avgAmount > 0 ? amount / avgAmount : 1;

        // ── isStructuring ─────────────────────────────────────────────────────
        // Flags amounts that are 95-99% of a round threshold (e.g. 9,850 → just below 10k)
        const THRESHOLDS = [1_000, 5_000, 10_000, 25_000, 50_000, 100_000, 500_000];
        const isStructuring = THRESHOLDS.some(t => amount >= t * 0.95 && amount < t);

        // ── velocityPattern ───────────────────────────────────────────────────
        let velocityPattern = 'normal';
        if (totalHistory < 3) {
            velocityPattern = 'new'; // brand-new or very sparse account
        } else if (burstCount >= 3) {
            // 3+ transactions in the last 30 minutes is a burst
            velocityPattern = 'burst';
        }

        // ── escalating ────────────────────────────────────────────────────────
        // True when the last 3 non-rejected amounts each grew >20% and this tx is bigger still
        let escalating = false;
        const recentApproved = allSenderTxs
            .filter(t => t.status !== 'REJECTED')
            .slice(0, 3)
            .map(t => t.amount);
        if (recentApproved.length === 3) {
            const [a3, a2, a1] = recentApproved; // newest first
            if (a1 > a2 * 1.2 && a2 > a3 * 1.2 && amount > a1 * 1.2) {
                escalating = true;
            }
        }

        // ── recipientRisk (0–100) ─────────────────────────────────────────────
        // How many distinct senders sent to this recipient in the last 6 hours?
        // More than 5 distinct senders → possible money-mule target
        const distinctSenders = recentRecipientSenders.length;
        const recipientRisk = Math.min(distinctSenders * 15, 100); // 0→0, 7+→100

        return {
            hourVelocity, dayVelocity, rejectionCount, recipientRepeat,
            amountDeviation, avgAmount, historicalCount: approvedAmounts.length,
            senderScore, isStructuring, velocityPattern, escalating, recipientRisk,
        };
    } catch {
        return {
            hourVelocity: 0, dayVelocity: 0, rejectionCount: 0,
            recipientRepeat: 0, amountDeviation: 1, avgAmount: amount, historicalCount: 0,
            senderScore: 50, isStructuring: false, velocityPattern: 'normal',
            escalating: false, recipientRisk: 0,
        };
    }
}

/**
 * Rule-based transaction evaluation using behavioural context signals.
 * Each personality weighs different signals from the sender's history.
 * Returns { decision: boolean, reason: string }.
 */
function evaluateTransaction(node, transaction, ctx = {}) {
    const { amount, sender, recipient } = transaction;
    const {
        hourVelocity    = 0,
        rejectionCount  = 0,
        recipientRepeat = 0,
        amountDeviation = 1,
        historicalCount = 0,
        senderScore     = 50,
        isStructuring   = false,
        velocityPattern = 'normal',
        escalating      = false,
        recipientRisk   = 0,
    } = ctx;

    // ── Universal checks (every honest node enforces these) ──────────────────
    if (!amount || amount <= 0)
        return { decision: false, reason: 'Rejected: amount must be positive' };
    if (amount > 1_000_000)
        return { decision: false, reason: 'Rejected: exceeds system maximum (1,000,000)' };
    if (!sender?.startsWith('did:cedefi:'))
        return { decision: false, reason: 'Rejected: sender DID format invalid' };
    if (!recipient?.startsWith('did:cedefi:'))
        return { decision: false, reason: 'Rejected: recipient DID format invalid' };
    if (sender === recipient)
        return { decision: false, reason: 'Rejected: self-transaction detected' };

    const personality = node.personality || derivePersonality(node.publicKey);

    // ── CONSERVATIVE ─────────────────────────────────────────────────────────
    // Demands strong sender history, low velocity, no suspicious patterns at all
    if (personality === 'conservative') {
        if (amount > 10_000)
            return { decision: false,
                reason: `Rejected [conservative]: amount ${amount} exceeds 10,000 limit` };
        if (senderScore < 55 && historicalCount >= 3)
            return { decision: false,
                reason: `Rejected [conservative]: sender reliability score ${senderScore}/100 is below threshold (55)` };
        if (velocityPattern === 'new' && amount > 500)
            return { decision: false,
                reason: `Rejected [conservative]: new account with no established history — amount capped at 500 until trust is built` };
        if (velocityPattern === 'burst')
            return { decision: false,
                reason: `Rejected [conservative]: burst velocity pattern detected — ${hourVelocity} tx in last hour` };
        if (recipientRepeat > 0)
            return { decision: false,
                reason: `Rejected [conservative]: repeated transfer to same recipient within 1 hour — possible structuring` };
        if (rejectionCount > 0)
            return { decision: false,
                reason: `Rejected [conservative]: sender has ${rejectionCount} prior rejection(s) — zero tolerance` };
        if (isStructuring)
            return { decision: false,
                reason: `Rejected [conservative]: amount ${amount} appears designed to stay just below a reporting threshold` };
        if (escalating)
            return { decision: false,
                reason: `Rejected [conservative]: escalating transaction pattern detected across last 4 transfers` };
        return { decision: true,
            reason: `Approved [conservative]: score ${senderScore}/100, small amount, clean history, low velocity` };
    }

    // ── FRAUD-DETECTION ───────────────────────────────────────────────────────
    // Specialist in laundering, smurfing, structuring, and mule detection
    if (personality === 'fraud-detection') {
        if (amount >= 5_000 && amount % 1_000 === 0)
            return { decision: false,
                reason: `Rejected [fraud-detection]: round-number transfer of ${amount} — common structuring signal` };
        if (isStructuring)
            return { decision: false,
                reason: `Rejected [fraud-detection]: amount ${amount} is just below a reporting threshold — structuring detected` };
        if (amount < 1 && amount > 0)
            return { decision: false,
                reason: 'Rejected [fraud-detection]: micro-transaction — possible structuring probe' };
        if (velocityPattern === 'burst')
            return { decision: false,
                reason: `Rejected [fraud-detection]: burst velocity — ${hourVelocity} transactions in last hour (smurfing pattern)` };
        if (escalating)
            return { decision: false,
                reason: `Rejected [fraud-detection]: escalating amounts across last 4 transactions — probing behaviour` };
        if (recipientRisk >= 60)
            return { decision: false,
                reason: `Rejected [fraud-detection]: recipient received funds from ${Math.round(recipientRisk / 15)} distinct senders in last 6 h — possible money mule` };
        if (recipientRepeat > 1)
            return { decision: false,
                reason: `Rejected [fraud-detection]: ${recipientRepeat} repeated transfers to same recipient this hour` };
        if (rejectionCount >= 2)
            return { decision: false,
                reason: `Rejected [fraud-detection]: sender has ${rejectionCount} prior rejections — established fraud pattern` };
        if (senderScore < 30 && historicalCount >= 5)
            return { decision: false,
                reason: `Rejected [fraud-detection]: sender score ${senderScore}/100 — high-risk account based on full history` };
        if (amountDeviation > 8 && historicalCount >= 3)
            return { decision: false,
                reason: `Rejected [fraud-detection]: amount is ${amountDeviation.toFixed(1)}× sender's typical amount — anomalous spike` };
        return { decision: true,
            reason: 'Approved [fraud-detection]: passed all fraud and pattern heuristics' };
    }

    // ── STRICT ────────────────────────────────────────────────────────────────
    // High standards: requires established reliable history for non-trivial amounts
    if (personality === 'strict') {
        if (amount > 50_000)
            return { decision: false,
                reason: `Rejected [strict]: high-value transfer (${amount}) exceeds 50,000 — requires bank pre-approval` };
        if (velocityPattern === 'new' && amount > 5_000)
            return { decision: false,
                reason: `Rejected [strict]: new account — transfers above 5,000 require established history` };
        if (senderScore < 55 && amount > 1_000 && historicalCount >= 3)
            return { decision: false,
                reason: `Rejected [strict]: sender score ${senderScore}/100 insufficient for transfers over 1,000` };
        if (rejectionCount > 0)
            return { decision: false,
                reason: `Rejected [strict]: zero-tolerance — sender has ${rejectionCount} rejection(s) on record` };
        if (hourVelocity > 5)
            return { decision: false,
                reason: `Rejected [strict]: velocity exceeded — ${hourVelocity} tx in last hour (max 5)` };
        if (isStructuring)
            return { decision: false,
                reason: `Rejected [strict]: amount ${amount} is suspiciously close to a round threshold` };
        if (escalating)
            return { decision: false,
                reason: `Rejected [strict]: escalating transaction pattern — risk of probing attack` };
        if (amountDeviation > 10 && historicalCount >= 2)
            return { decision: false,
                reason: `Rejected [strict]: amount is ${amountDeviation.toFixed(1)}× above sender's norm — strict anomaly flag` };
        return { decision: true,
            reason: `Approved [strict]: score ${senderScore}/100, all strict policy checks passed` };
    }

    // ── LIBERAL ───────────────────────────────────────────────────────────────
    // Only blocks confirmed bad actors and extreme cases
    if (personality === 'liberal') {
        if (amount > 500_000)
            return { decision: false,
                reason: `Rejected [liberal]: extreme amount (${amount}) exceeds 500,000` };
        if (senderScore < 20 && historicalCount >= 5)
            return { decision: false,
                reason: `Rejected [liberal]: sender score ${senderScore}/100 — confirmed bad actor based on long history` };
        if (hourVelocity > 20)
            return { decision: false,
                reason: `Rejected [liberal]: extreme velocity — ${hourVelocity} tx in last hour` };
        if (rejectionCount > 5)
            return { decision: false,
                reason: `Rejected [liberal]: persistent fraud pattern — ${rejectionCount} total rejections` };
        if (recipientRisk >= 90)
            return { decision: false,
                reason: `Rejected [liberal]: recipient shows extreme money-mule risk score (${recipientRisk}/100)` };
        return { decision: true,
            reason: `Approved [liberal]: score ${senderScore}/100, within acceptable bounds` };
    }

    // ── STANDARD (default) ────────────────────────────────────────────────────
    if (amount > 100_000)
        return { decision: false,
            reason: `Rejected [standard]: amount ${amount} exceeds 100,000` };
    if (velocityPattern === 'new' && amount > 2_000)
        return { decision: false,
            reason: `Rejected [standard]: new account — transfers above 2,000 require established history` };
    if (senderScore < 35 && historicalCount >= 3)
        return { decision: false,
            reason: `Rejected [standard]: sender score ${senderScore}/100 below acceptable threshold (35)` };
    if (hourVelocity > 8)
        return { decision: false,
            reason: `Rejected [standard]: velocity — ${hourVelocity} transactions in last hour (max 8)` };
    if (isStructuring && rejectionCount > 0)
        return { decision: false,
            reason: `Rejected [standard]: structuring pattern combined with ${rejectionCount} prior rejection(s)` };
    if (rejectionCount > 3)
        return { decision: false,
            reason: `Rejected [standard]: sender reliability poor — ${rejectionCount} prior rejections` };
    if (escalating && amountDeviation > 5)
        return { decision: false,
            reason: `Rejected [standard]: escalating amounts (${amountDeviation.toFixed(1)}× average) — suspicious growth pattern` };
    if (amountDeviation > 10 && historicalCount >= 5)
        return { decision: false,
            reason: `Rejected [standard]: amount is ${amountDeviation.toFixed(1)}× above sender's historical average` };
    return { decision: true,
        reason: `Approved [standard]: score ${senderScore}/100, passes all standard validation checks` };
}

/**
 * Trigger all active nodes that haven't yet voted on a transaction.
 * Nodes vote in randomized order to ensure equal opportunities for all.
 * Each node applies its rule set with a realistic staggered delay (50–400 ms).
 * ALL nodes are allowed to vote even if bank approvals change the status,
 * ensuring equal participation for reputation and learning purposes.
 *
 * Ground truth for reputation updates:
 *   - If banks participated → bank decision is truth
 *   - If no banks → consensus result is truth (avoids penalising everyone when banks offline)
 */
async function triggerAutoVotesForTransaction(transactionId) {
    try {
        const transaction = await Transaction.findOne({ transactionId });
        if (!transaction) {
            console.warn(`[AutoVote] Transaction ${transactionId} not found`);
            return;
        }
        if (transaction.status !== 'PENDING') {
            console.log(`[AutoVote] Skipping ${transactionId} — already ${transaction.status}`);
            return;
        }

        const activeNodes = await Node.find({ status: 'ACTIVE', isActive: true });
        if (activeNodes.length === 0) {
            console.warn('[AutoVote] No active nodes to vote');
            return;
        }

        const alreadyVotedSet = new Set(transaction.votes.map(v => v.voter));
        let unvotedNodes = activeNodes.filter(n => !alreadyVotedSet.has(n.publicKey));

        console.log(`\n🤖 [AutoVote] ${unvotedNodes.length} node(s) will vote on ${transactionId}`);

        // Fetch behavioural context once — it's the same for all nodes
        const ctx = await getTransactionContext(transaction);
        console.log(
            `[AutoVote] Context — score:${ctx.senderScore} velocity:${ctx.hourVelocity}/h ` +
            `rejections:${ctx.rejectionCount} pattern:${ctx.velocityPattern} ` +
            `structuring:${ctx.isStructuring} escalating:${ctx.escalating} ` +
            `recipientRisk:${ctx.recipientRisk} amtDeviation:${ctx.amountDeviation.toFixed(2)}×`
        );

        // Randomize voting order to ensure fair opportunity for all nodes to vote
        // Fisher-Yates shuffle
        for (let i = unvotedNodes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [unvotedNodes[i], unvotedNodes[j]] = [unvotedNodes[j], unvotedNodes[i]];
        }

        for (const node of unvotedNodes) {
            // Realistic per-node network / processing delay
            await new Promise(r => setTimeout(r, 50 + Math.random() * 350));

            try {
                // Re-fetch to avoid stale state between nodes
                const fresh = await Transaction.findOne({ transactionId });
                if (!fresh) {
                    console.log(`[AutoVote] Transaction ${transactionId} not found, stopping`);
                    break;
                }

                // Allow voting even if status changed (e.g., bank approval), but don't override bank decisions
                const wasPending = fresh.status === 'PENDING';
                if (fresh.votes.some(v => v.voter === node.publicKey)) continue;

                const { decision, reason } = evaluateTransaction(node, fresh, ctx);
                const weight = await getNodeReputation(node.publicKey);

                fresh.votes.push({ voter: node.publicKey, decision, weight, reason, timestamp: new Date() });
                await fresh.save();

                const symbol = decision ? '✓' : '✗';
                const personality = node.personality || derivePersonality(node.publicKey);
                console.log(`  ${symbol} [${node.name}] (${personality}, rep=${weight}): ${reason}`);

                // If transaction was pending and now has consensus, log it but don't stop voting
                if (wasPending && fresh.status !== 'PENDING') {
                    console.log(`[AutoVote] Transaction ${transactionId} status changed to ${fresh.status} during voting, but continuing to collect all votes`);
                }

                // Note: We continue voting even if consensus reached, to ensure all nodes participate equally
            } catch (nodeErr) {
                console.error(`[AutoVote] Error for node ${node.name}:`, nodeErr.message);
            }
        }

        // After all nodes have voted, check consensus once (only if no bank decision made)
        try {
            const final = await Transaction.findOne({ transactionId });
            if (final && final.status === 'PENDING') {
                const finalStatus = await checkConsensus(transactionId);
                if (finalStatus && finalStatus !== final.status) {
                    final.status = finalStatus;
                    await final.save();

                    if (finalStatus === 'APPROVED' || finalStatus === 'REJECTED') {
                        await blockchainService.recordTransactionResult(transactionId, finalStatus);

                        // Ground truth: bank decision if banks participated; otherwise consensus
                        const hasBankInput = final.bankApprovals.length > 0 ||
                            (final.bankRejections && final.bankRejections.length > 0);
                        const groundTruth = hasBankInput
                            ? final.bankApprovals.length > 0
                            : (finalStatus === 'APPROVED');

                        await updateNodeReputations(
                            transactionId,
                            groundTruth,
                            final.votes.map(v => ({ nodeAddress: v.voter, decision: v.decision })),
                            final.bankApprovals.length
                        );

                        console.log(`\n✅ [AutoVote] Final Consensus → ${finalStatus} for ${transactionId} (${final.votes.length} total votes)\n`);
                    }
                }
            } else if (final) {
                // Transaction was decided by banks, but all nodes still voted for reputation purposes
                console.log(`\n✅ [AutoVote] Bank-decided transaction ${transactionId} (${final.status}) — collected ${final.votes.length} node votes for reputation training\n`);

                // Still update reputations based on bank decision
                const hasBankInput = final.bankApprovals.length > 0 ||
                    (final.bankRejections && final.bankRejections.length > 0);
                if (hasBankInput) {
                    const groundTruth = final.bankApprovals.length > 0;
                    await updateNodeReputations(
                        transactionId,
                        groundTruth,
                        final.votes.map(v => ({ nodeAddress: v.voter, decision: v.decision })),
                        final.bankApprovals.length
                    );
                }
            }
        } catch (consensusErr) {
            console.error('[AutoVote] Error in final consensus check:', consensusErr.message);
        }

    } catch (err) {
        console.error('[AutoVote] Fatal error:', err.message);
    }
}

module.exports = { triggerAutoVotesForTransaction, evaluateTransaction, derivePersonality };
