import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, CheckCircle, XCircle, Clock, AlertCircle, Check, X, RefreshCw } from 'lucide-react';

const Dashboard = ({ bankInfo, apiPort }) => {
    const [stats, setStats] = useState({ approved: 0, rejected: 0, pending: 0 });
    const [pendingTxs, setPendingTxs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = async () => {
        setIsRefreshing(true);
        try {
            // Fetch transactions from MAIN SYSTEM (Port 5000)
            const res = await axios.get('http://localhost:5000/transactions');
            const txs = res.data;
            const bankId = bankInfo?.bankId || 'UnknownBank';

            let approved = 0;
            let pending = [];

            txs.forEach(t => {
                const hasApproved = t.bankApprovals.some(b => b.bankId === bankId);
                if (hasApproved) {
                    approved++;
                } else if (t.status === 'PENDING') {
                    pending.push(t);
                }
            });

            setStats({ approved, rejected: 0, pending: pending.length });
            setPendingTxs(pending);
            setLastUpdated(new Date());
            setLoading(false);
        } catch (error) {
            console.error("Error fetching stats", error);
            setLoading(false);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (bankInfo) fetchData();
        const interval = setInterval(() => { if (bankInfo) fetchData(); }, 5000);
        return () => clearInterval(interval);
    }, [bankInfo, apiPort]);

    const handleDecision = async (transactionId, decision) => {
        try {
            const endpoint = decision === 'APPROVE' ? '/bank/approve' : '/bank/reject';
            const payload = { transactionId, force: true }; // Manual approval is forced

            await axios.post(`http://localhost:${apiPort}${endpoint}`, payload);
            fetchData(); // Refresh list
        } catch (error) {
            console.error("Error submitting decision", error);
            alert("Failed to submit decision");
        }
    };

    return (
        <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 flex items-center gap-4">
                    <div className="p-3 bg-green-500/20 text-green-400 rounded-full">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Total Approved</p>
                        <h3 className="text-3xl font-bold">{stats.approved}</h3>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/20 text-yellow-400 rounded-full">
                        <Clock className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Pending Review</p>
                        <h3 className="text-3xl font-bold">{stats.pending}</h3>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 text-blue-400 rounded-full">
                        <Activity className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Active Node</p>
                        <h3 className="text-lg font-bold truncate w-32">{bankInfo?.bankId}</h3>
                    </div>
                </div>
            </div>

            {/* Pending Transactions List */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                        Pending Transactions
                    </h3>
                    <div className="flex items-center gap-4">
                        {lastUpdated && (
                            <span className="text-xs text-slate-500">
                                Updated: {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                        <button
                            onClick={fetchData}
                            disabled={isRefreshing}
                            className={`p-2 rounded-full hover:bg-slate-700 transition-colors ${isRefreshing ? 'animate-spin text-blue-400' : 'text-slate-400'}`}
                            title="Refresh Data"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {pendingTxs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        No pending transactions requiring approval.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900/50 text-slate-400 uppercase font-medium">
                                <tr>
                                    <th className="px-6 py-3">Tx ID</th>
                                    <th className="px-6 py-3">Sender</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Votes</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {pendingTxs.map(tx => {
                                    const yesVotes = tx.votes.filter(v => v.decision).length;
                                    const noVotes = tx.votes.filter(v => !v.decision).length;
                                    return (
                                        <tr key={tx._id} className="hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4 font-mono">{tx.transactionId}</td>
                                            <td className="px-6 py-4">{tx.sender}</td>
                                            <td className="px-6 py-4 font-bold text-green-400">${tx.amount}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <span className="text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> {yesVotes}</span>
                                                    <span className="text-red-400 flex items-center gap-1"><X className="w-3 h-3" /> {noVotes}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleDecision(tx.transactionId, 'APPROVE')}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded border border-green-500/50 transition-colors"
                                                >
                                                    <Check className="w-4 h-4" /> Approve
                                                </button>
                                                <button
                                                    onClick={() => handleDecision(tx.transactionId, 'REJECT')}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded border border-red-500/50 transition-colors"
                                                >
                                                    <X className="w-4 h-4" /> Reject
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Bank Info & Transfers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" />
                        Bank Node Status
                    </h3>
                    <div className="space-y-4 text-sm">
                        <div className="p-4 bg-slate-900 rounded border border-slate-700">
                            <p className="text-slate-400 mb-1">Bank ID</p>
                            <p className="font-mono text-slate-200">{bankInfo?.bankId || 'Loading...'}</p>
                        </div>
                        <div className="p-4 bg-slate-900 rounded border border-slate-700">
                            <p className="text-slate-400 mb-1">Bank DID</p>
                            <p className="font-mono text-slate-200 break-all">{bankInfo?.did || 'Loading...'}</p>
                        </div>
                        <div className="p-4 bg-slate-900 rounded border border-slate-700">
                            <p className="text-slate-400 mb-1">Wallet Address</p>
                            <p className="font-mono text-slate-200 break-all">{bankInfo?.address || 'Loading...'}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-purple-400" />
                        Fund Operations
                    </h3>

                    <div className="space-y-6">
                        {/* Transfer Form */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-slate-300">Inter-Bank / User Transfer</h4>
                            <div className="grid gap-2">
                                <input
                                    placeholder="Recipient DID (did:cedefi:...)"
                                    className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm w-full"
                                    id="transferRecipient"
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm w-full"
                                        id="transferAmount"
                                    />
                                    <button
                                        onClick={async () => {
                                            const recipient = document.getElementById('transferRecipient').value;
                                            const amount = document.getElementById('transferAmount').value;
                                            if (!recipient || !amount) return alert("Fill all fields");
                                            try {
                                                await axios.post(`http://localhost:${apiPort}/bank/transfer`, { recipient, amount });
                                                alert("Transfer Initiated!");
                                                fetchData();
                                            } catch (e) { alert("Transfer Failed"); }
                                        }}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-700 pt-4 space-y-3">
                            <h4 className="font-medium text-slate-300">Blockchain Operations</h4>
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        const amount = prompt("Amount to request from Blockchain:");
                                        if (!amount) return;
                                        try {
                                            await axios.post(`http://localhost:${apiPort}/bank/request-funds`, { amount });
                                            alert("Funds Requested!");
                                            fetchData();
                                        } catch (e) { alert("Request Failed"); }
                                    }}
                                    className="flex-1 bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/50 px-4 py-2 rounded text-sm font-medium"
                                >
                                    Request from Blockchain
                                </button>
                                <button
                                    onClick={async () => {
                                        const amount = prompt("Amount to deposit to Blockchain:");
                                        if (!amount) return;
                                        const blockchainDID = 'did:cedefi:blockchain:0000000000000000000000000000000000000000';
                                        try {
                                            await axios.post(`http://localhost:${apiPort}/bank/transfer`, { recipient: blockchainDID, amount });
                                            alert("Deposit Initiated!");
                                            fetchData();
                                        } catch (e) { alert("Deposit Failed"); }
                                    }}
                                    className="flex-1 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-600/50 px-4 py-2 rounded text-sm font-medium"
                                >
                                    Deposit to Blockchain
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
