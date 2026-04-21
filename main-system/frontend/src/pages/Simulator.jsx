import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaServer, FaThumbsUp, FaThumbsDown, FaPlus, FaCheck, FaTimes,
    FaMoneyBillWave, FaRobot, FaShieldAlt, FaBalanceScale, FaBolt,
    FaExclamationTriangle, FaClock
} from 'react-icons/fa';

const API = 'http://localhost:5000';

// Must match derivePersonality() in NodeAutoVoteService.js and nodeController.js
function derivePersonality(publicKey) {
    const sum = (publicKey || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    // Balanced 20% distribution across 5 distinct types
    const types = ['standard', 'conservative', 'fraud-detection', 'liberal', 'strict'];
    return types[sum % types.length];
}

const PERSONALITY_META = {
    conservative:      { label: 'Conservative',     icon: <FaShieldAlt />,           color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30' },
    'fraud-detection': { label: 'Fraud Detection',  icon: <FaExclamationTriangle />,  color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30' },
    strict:            { label: 'Strict',            icon: <FaBalanceScale />,         color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30' },
    liberal:           { label: 'Liberal',           icon: <FaBolt />,                 color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    standard:          { label: 'Standard',          icon: <FaServer />,               color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/30' },
};

const STATUS_COLORS = {
    PENDING:  'text-amber-400  bg-amber-500/10  border-amber-500/30',
    APPROVED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    REJECTED: 'text-red-400    bg-red-500/10    border-red-500/30',
};

const Simulator = () => {
    const [nodes, setNodes] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [selectedTx, setSelectedTx] = useState('');
    const [triggeringVotes, setTriggeringVotes] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [nodesRes, txRes] = await Promise.all([
                axios.get(`${API}/nodes`),
                axios.get(`${API}/transactions`),
            ]);
            setNodes(nodesRes.data);
            setTransactions(txRes.data);
        } catch (error) {
            console.error('Error fetching data', error);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleRegisterNode = async () => {
        const id = Math.floor(Math.random() * 9000) + 1000;
        try {
            await axios.post(`${API}/nodes/register`, {
                url: `http://node-${id}.cedefi.local`,
                name: `Node-${id}`,
                publicKey: `0xnode${id}pubkey${Math.random().toString(36).slice(2, 10)}`
            });
            fetchData();
        } catch (error) {
            alert('Error registering node: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleVerifyNode = async (publicKey, action) => {
        try {
            await axios.post(`${API}/nodes/${publicKey}/verify`, { action });
            fetchData();
        } catch (error) {
            alert('Error verifying node');
        }
    };

    const handleManualVote = async (nodePublicKey, decision) => {
        if (!selectedTx) return alert('Select a transaction first');
        try {
            await axios.post(`${API}/transactions/${selectedTx}/vote`, {
                voter: nodePublicKey,
                decision
            });
            fetchData();
        } catch (error) {
            alert('Error voting: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleTriggerAutoVotes = async () => {
        if (!selectedTx) return alert('Select a transaction first');
        setTriggeringVotes(true);
        try {
            await axios.post(`${API}/transactions/${selectedTx}/trigger-votes`);
            // Poll faster while votes trickle in
            const rapid = setInterval(fetchData, 800);
            setTimeout(() => { clearInterval(rapid); setTriggeringVotes(false); }, 15000);
        } catch (error) {
            alert('Error triggering votes: ' + (error.response?.data?.error || error.message));
            setTriggeringVotes(false);
        }
    };

    const handleClaim = async () => {
        if (!selectedTx) return alert('Select a transaction first');
        try {
            await axios.post(`${API}/transactions/${selectedTx}/claim`);
            fetchData();
        } catch (error) {
            alert('Error claiming: ' + (error.response?.data?.error || error.message));
        }
    };

    // ── Derived data ──────────────────────────────────────────────────────────
    const currentTx   = transactions.find(t => t.transactionId === selectedTx);
    const activeNodes = nodes.filter(n => n.status === 'ACTIVE');
    const totalActive = activeNodes.length;
    const yesVotes    = currentTx?.votes?.filter(v => v.decision).length ?? 0;
    const noVotes     = currentTx?.votes?.filter(v => !v.decision).length ?? 0;
    const totalVotes  = yesVotes + noVotes;
    const yesWeight   = currentTx?.votes?.filter(v => v.decision).reduce((s, v) => s + (v.weight ?? 50), 0) ?? 0;
    const noWeight    = currentTx?.votes?.filter(v => !v.decision).reduce((s, v) => s + (v.weight ?? 50), 0) ?? 0;
    // Use actual reputation sum as denominator (matches backend ConsensusService.js)
    const maxWeight   = activeNodes.reduce((sum, n) => sum + (n.reputation || 50), 0);
    
    // Calculate exact thresholds based on actual weights (matches backend)
    const ruleAThreshold = maxWeight * (2 / 3);
    const ruleBThreshold = maxWeight * (1 / 2);
    const ruleAThresholdPct = (ruleAThreshold / maxWeight) * 100;
    const ruleBThresholdPct = (ruleBThreshold / maxWeight) * 100;
    
    // Calculate percentages for display and check thresholds
    const approvalPct = maxWeight > 0 ? Math.min(100, (yesWeight / maxWeight) * 100) : 0;
    const isRuleAMet = yesWeight >= ruleAThreshold;
    const isRuleBMet = yesWeight >= ruleBThreshold;
    const bankApprovals = currentTx?.bankApprovals?.length ?? 0;
    const pendingCount  = totalActive - totalVotes;

    return (
        <div className="space-y-6">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3 justify-between">
                <div>
                    <div className="text-2xl font-bold">Voting Network</div>
                    <p className="text-sm text-slate-400 mt-0.5">
                        Nodes autonomously validate transactions using rule-based evaluation
                    </p>
                </div>
                <button
                    onClick={handleRegisterNode}
                    className="btn btn-primary btn-sm gap-2 bg-gradient-to-tr from-indigo-500 to-violet-500 border-none text-white shadow-lg shadow-indigo-500/20"
                >
                    <FaPlus /> Register Node
                </button>
            </div>

            {/* ── Transaction selector + consensus meter ───────────────── */}
            <div className="rounded-2xl bg-theme-subtle ring-1 ring-theme p-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex-1 w-full">
                        <label className="text-sm font-medium text-slate-300 mb-1 block">
                            Select Transaction to Inspect
                        </label>
                        <select
                            className="select select-bordered w-full bg-theme-subtle border-theme focus:border-indigo-500 text-slate-100"
                            onChange={e => setSelectedTx(e.target.value)}
                            value={selectedTx}
                        >
                            <option value="" className="bg-slate-800">-- Choose Transaction --</option>
                            {transactions.map(t => (
                                <option key={t._id} value={t.transactionId} className="bg-slate-800">
                                    {t.transactionId} [{t.status}]
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedTx && currentTx && (
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${STATUS_COLORS[currentTx.status] ?? ''}`}>
                                {currentTx.status}
                            </div>
                            <div className="text-sm text-slate-400">
                                <span className="text-slate-200 font-mono">{currentTx.amount}</span> units
                            </div>
                            {bankApprovals > 0 && (
                                <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                                    <FaShieldAlt className="text-[10px]" />
                                    {bankApprovals} bank approval{bankApprovals > 1 ? 's' : ''}
                                </div>
                            )}
                            {currentTx.status === 'PENDING' && (
                                <button
                                    onClick={handleTriggerAutoVotes}
                                    disabled={triggeringVotes || pendingCount === 0}
                                    className="btn btn-sm gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 border-none text-white disabled:opacity-50"
                                >
                                    <FaRobot className={triggeringVotes ? 'animate-pulse' : ''} />
                                    {triggeringVotes ? 'Voting in progress…' : `Auto-Vote (${pendingCount} pending)`}
                                </button>
                            )}
                            {currentTx.status === 'APPROVED' && currentTx.recipientStatus === 'PENDING' && (
                                <button onClick={handleClaim} className="btn btn-warning btn-sm gap-2">
                                    <FaMoneyBillWave /> Claim Funds
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Consensus meter */}
                {selectedTx && currentTx && totalActive > 0 && (
                    <div className="space-y-2 pt-3 border-t border-white/5">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span className="flex items-center gap-1.5">
                                <FaThumbsUp className="text-emerald-400" />
                                YES weight: <strong className="text-emerald-300">{yesWeight}</strong> / {maxWeight.toFixed(0)}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="text-slate-600">({noVotes} votes)</span>
                                <strong className="text-red-300">{noWeight}</strong>
                                NO weight <FaThumbsDown className="text-red-400" />
                            </span>
                        </div>

                        <div className="relative h-3 rounded-full bg-slate-700 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${approvalPct}%` }}
                                transition={{ duration: 0.5 }}
                                className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                            />
                            {/* ⅔ rule A threshold */}
                            <div className="absolute top-0 h-full w-0.5 bg-white/40" style={{ left: `${ruleAThresholdPct}%` }} title="Rule A: 2/3 threshold" />
                            {/* ½ rule B threshold */}
                            <div className="absolute top-0 h-full w-0.5 bg-white/20" style={{ left: `${ruleBThresholdPct}%` }} title="Rule B: 1/2 threshold" />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className={`text-xs p-2 rounded-lg border ${isRuleAMet ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
                                <strong>Rule A:</strong> ≥ ⅔ weighted approval → APPROVED
                            </div>
                            <div className={`text-xs p-2 rounded-lg border ${(isRuleBMet && bankApprovals >= 1) ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
                                <strong>Rule B:</strong> ≥ ½ approval + ≥ 1 bank → APPROVED
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Node Grid ────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {nodes.map((node, i) => {
                    const personality = derivePersonality(node.publicKey);
                    const meta        = PERSONALITY_META[personality] ?? PERSONALITY_META.standard;
                    const vote        = currentTx?.votes?.find(v => v.voter === node.publicKey);
                    const hasVoted    = !!vote;

                    return (
                        <motion.div
                            key={node._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className={`rounded-2xl p-4 ring-1 ring-theme bg-theme-subtle flex flex-col gap-3 ${node.status === 'FRAUDULENT' ? 'opacity-40' : ''}`}
                        >
                            {/* Identity row */}
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 grid place-items-center font-bold text-white shrink-0">
                                    {node.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold truncate">{node.name}</div>
                                    <div className="text-xs text-theme-muted truncate">{node.publicKey}</div>
                                </div>
                                <span className={`badge badge-outline text-xs shrink-0 ${node.isActive ? 'badge-success' : 'badge-ghost'}`}>
                                    {node.isActive ? 'Online' : node.status}
                                </span>
                            </div>

                            {/* Personality + reputation */}
                            <div className="flex items-center justify-between gap-2">
                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border ${meta.bg} ${meta.border} ${meta.color}`}>
                                    {meta.icon}
                                    {meta.label}
                                </div>
                                <div className="text-xs text-slate-400">
                                    Rep: <span className={`font-bold ${node.reputation >= 75 ? 'text-emerald-400' : node.reputation >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{node.reputation}</span>
                                    <span className="text-slate-600">/100</span>
                                </div>
                            </div>

                            {/* Reputation bar */}
                            <div className="h-1.5 rounded-full bg-slate-700">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${node.reputation >= 75 ? 'bg-emerald-500' : node.reputation >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${node.reputation}%` }}
                                />
                            </div>

                            {/* Vote result with reason */}
                            <AnimatePresence>
                                {selectedTx && hasVoted && (
                                    <motion.div
                                        key="voted"
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`rounded-xl p-2.5 border text-xs ${vote.decision ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}
                                    >
                                        <div className={`flex items-center gap-1.5 font-bold mb-1 ${vote.decision ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {vote.decision ? <FaThumbsUp /> : <FaThumbsDown />}
                                            Voted {vote.decision ? 'YES' : 'NO'}
                                            <span className="ml-auto font-normal text-slate-500">w={vote.weight ?? 50}</span>
                                        </div>
                                        {vote.reason && (
                                            <p className="text-slate-400 leading-snug">{vote.reason}</p>
                                        )}
                                    </motion.div>
                                )}
                                {selectedTx && !hasVoted && currentTx?.status === 'PENDING' && node.status === 'ACTIVE' && triggeringVotes && (
                                    <motion.div
                                        key="evaluating"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center gap-2 text-xs text-slate-500 animate-pulse"
                                    >
                                        <FaClock /> Evaluating…
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Admin: approve/reject pending nodes */}
                            {node.status === 'PENDING' && (
                                <div className="flex gap-2">
                                    <button className="btn btn-xs btn-success btn-outline flex-1" onClick={() => handleVerifyNode(node.publicKey, 'APPROVE')}>
                                        <FaCheck /> Approve
                                    </button>
                                    <button className="btn btn-xs btn-error btn-outline flex-1" onClick={() => handleVerifyNode(node.publicKey, 'REJECT')}>
                                        <FaTimes /> Reject
                                    </button>
                                </div>
                            )}

                            {/* Manual override: only shown if node hasn't voted yet */}
                            {node.status === 'ACTIVE' && selectedTx && currentTx?.status === 'PENDING' && !hasVoted && (
                                <div className="flex gap-2">
                                    <button className="btn btn-xs btn-success btn-outline flex-1" onClick={() => handleManualVote(node.publicKey, true)}>
                                        <FaThumbsUp /> YES
                                    </button>
                                    <button className="btn btn-xs btn-error btn-outline flex-1" onClick={() => handleManualVote(node.publicKey, false)}>
                                        <FaThumbsDown /> NO
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    );
                })}

                {nodes.length === 0 && (
                    <div className="col-span-full text-center text-slate-500 py-16">
                        <FaServer className="text-4xl mx-auto mb-3 opacity-30" />
                        <p>No nodes registered. Click "Register Node" to add one.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Simulator;
