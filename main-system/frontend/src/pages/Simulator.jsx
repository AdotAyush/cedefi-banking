import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaServer, FaThumbsUp, FaThumbsDown, FaPlus, FaCheck, FaTimes, FaMoneyBillWave } from 'react-icons/fa';

const Simulator = () => {
    const [nodes, setNodes] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [selectedTx, setSelectedTx] = useState('');

    const fetchData = async () => {
        try {
            const nodesRes = await axios.get('http://localhost:5000/nodes');
            setNodes(nodesRes.data);
            const txRes = await axios.get('http://localhost:5000/transactions');
            setTransactions(txRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleRegisterNode = async () => {
        const id = Math.floor(Math.random() * 1000);
        try {
            await axios.post('http://localhost:5000/nodes/register', {
                url: `http://node-${id}.local`,
                name: `Node-${id}`,
                publicKey: `0xpubkey${id}`
            });
            fetchData();
        } catch (error) {
            alert('Error registering node');
        }
    };

    const handleVerifyNode = async (publicKey, action) => {
        try {
            await axios.post(`http://localhost:5000/nodes/${publicKey}/verify`, { action });
            fetchData();
        } catch (error) {
            alert('Error verifying node');
        }
    };

    const handleVote = async (nodePublicKey, decision) => {
        if (!selectedTx) return alert('Select a transaction first');
        try {
            await axios.post(`http://localhost:5000/transactions/${selectedTx}/vote`, {
                voter: nodePublicKey,
                decision
            });
            fetchData();
        } catch (error) {
            alert('Error voting: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleClaim = async () => {
        if (!selectedTx) return alert('Select a transaction first');
        try {
            await axios.post(`http://localhost:5000/transactions/${selectedTx}/claim`);
            fetchData();
        } catch (error) {
            alert('Error claiming: ' + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">Network Simulator</div>
                <button onClick={handleRegisterNode} className="btn btn-primary btn-sm gap-2 bg-gradient-to-tr from-indigo-500 to-violet-500 border-none text-white shadow-lg shadow-indigo-500/20">
                    <FaPlus /> Register Node
                </button>
            </div>

            {/* Transaction Selection & Actions */}
            <div className="rounded-2xl bg-theme-subtle ring-1 ring-theme p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 w-full">
                    <label className="text-sm font-medium data-[theme=corporate]:text-gray-700 data-[theme=business]:text-slate-300 mb-1 block" data-theme={typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : 'business'}>Active Transaction for Voting</label>
                    <select
                        className="select select-bordered w-full bg-theme-subtle border-theme focus:border-indigo-500 text-slate-100"
                        onChange={e => setSelectedTx(e.target.value)}
                        value={selectedTx}
                    >
                        <option value="" className="bg-slate-800 text-slate-100">-- Choose Transaction --</option>
                        {transactions.map(t => (
                            <option key={t._id} value={t.transactionId} className="bg-slate-800 text-slate-100">
                                {t.transactionId} [{t.status}]
                            </option>
                        ))}
                    </select>
                </div>

                {selectedTx && (
                    <div className="flex items-center gap-4 bg-theme-subtle p-3 rounded-xl border border-white/5">
                        <div className="text-sm">
                            <div className="text-theme-muted">Status</div>
                            <div className="font-bold">{transactions.find(t => t.transactionId === selectedTx)?.status}</div>
                        </div>
                        {transactions.find(t => t.transactionId === selectedTx)?.status === 'APPROVED' &&
                            transactions.find(t => t.transactionId === selectedTx)?.recipientStatus === 'PENDING' && (
                                <button onClick={handleClaim} className="btn btn-warning btn-sm gap-2">
                                    <FaMoneyBillWave /> Claim Funds
                                </button>
                            )}
                    </div>
                )}
            </div>

            {/* Nodes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {nodes.map((node, i) => {
                    const currentTx = transactions.find(t => t.transactionId === selectedTx);
                    const hasVoted = currentTx?.votes?.some(v => v.voter === node.publicKey);
                    const voteDecision = currentTx?.votes?.find(v => v.voter === node.publicKey)?.decision;

                    return (
                        <motion.div
                            key={node._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className={`rounded-2xl p-4 ring-1 ring-theme bg-theme-subtle ${node.status === 'PENDING' ? 'border border-amber-500/40' : ''} ${node.status === 'FRAUDULENT' ? 'border-rose-500/40' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 grid place-items-center font-bold text-white">
                                    {node.name.charAt(0)}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="font-semibold truncate">{node.name}</div>
                                    <div className="text-xs text-theme-muted truncate">{node.publicKey}</div>
                                </div>
                                <span className={`badge ${node.isActive ? 'badge-success' : 'badge-ghost'} badge-outline`}>
                                    {node.isActive ? 'Online' : node.status}
                                </span>
                            </div>

                            {/* Node Verification UI */}
                            {node.status === 'PENDING' && (
                                <div className="flex gap-2 mt-3">
                                    <button className="btn btn-xs btn-success btn-outline flex-1" onClick={() => handleVerifyNode(node.publicKey, 'APPROVE')}>
                                        <FaCheck /> Approve
                                    </button>
                                    <button className="btn btn-xs btn-error btn-outline flex-1" onClick={() => handleVerifyNode(node.publicKey, 'REJECT')}>
                                        <FaTimes /> Reject
                                    </button>
                                </div>
                            )}

                            {/* Voting UI */}
                            {node.status === 'ACTIVE' && selectedTx && currentTx?.status === 'PENDING' && !hasVoted && (
                                <div className="flex gap-2 mt-3">
                                    <button
                                        className="btn btn-xs btn-success btn-outline flex-1"
                                        onClick={() => handleVote(node.publicKey, true)}
                                    >
                                        <FaThumbsUp /> YES
                                    </button>
                                    <button
                                        className="btn btn-xs btn-error btn-outline flex-1"
                                        onClick={() => handleVote(node.publicKey, false)}
                                    >
                                        <FaThumbsDown /> NO
                                    </button>
                                </div>
                            )}

                            {selectedTx && hasVoted && (
                                <div className={`mt-3 text-center text-xs font-bold py-1 rounded ${voteDecision ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    Voted {voteDecision ? 'YES' : 'NO'}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
                {nodes.length === 0 && <div className="col-span-full text-center text-theme-muted py-10">No nodes active</div>}
            </div>
        </div>
    );
};

export default Simulator;
