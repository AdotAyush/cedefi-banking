import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaPaperPlane, FaMoneyBillWave, FaHashtag } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';

const Transactions = () => {
    const { user } = useContext(AuthContext);
    const [transactions, setTransactions] = useState([]);
    const [formData, setFormData] = useState({ transactionId: '', sender: user?.did || '', recipient: '', amount: '' });
    const [filter, setFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user?.did) {
            setFormData(prev => ({ ...prev, sender: user.did }));
        }
    }, [user]);

    const fetchTransactions = async () => {
        try {
            const res = await axios.get('http://localhost:5000/transactions');
            setTransactions(res.data);
        } catch (error) {
            console.error("Error fetching transactions", error);
        }
    };

    useEffect(() => {
        fetchTransactions();
        const interval = setInterval(fetchTransactions, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/transactions', formData);
            setFormData({ transactionId: '', sender: user?.did || '', recipient: '', amount: '' });
            fetchTransactions();
        } catch (error) {
            alert('Error creating transaction');
        }
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesFilter = filter === 'ALL' || tx.status === filter;
        const matchesSearch = tx.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.sender.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
                <div className="text-2xl font-bold">Transactions</div>
                <div className="md:ml-auto flex items-center gap-2">
                    <div className="join bg-theme-subtle ring-1 ring-theme rounded-xl">
                        {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map((s) => (
                            <button key={s} onClick={() => setFilter(s)} className={`btn join-item btn-xs ${filter === s ? 'btn-primary' : 'btn-ghost'}`}>{s}</button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-theme-subtle px-3 py-2 ring-1 ring-theme">
                        <FaSearch className="text-slate-400" />
                        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent outline-none text-sm w-48" placeholder="Search…" />
                    </div>
                </div>
            </div>

            {/* Create Transaction Card */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-theme-subtle ring-1 ring-theme p-6"
            >
                <div className="flex items-center gap-2 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 grid place-items-center shadow-lg shadow-indigo-500/20">
                        <FaPaperPlane className="text-white" />
                    </div>
                    <div className="text-lg font-semibold">New Transaction</div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium data-[theme=corporate]:text-gray-700 data-[theme=business]:text-slate-300" data-theme={document.documentElement.getAttribute('data-theme')}>Transaction ID</label>
                        <div className="relative">
                            <FaHashtag className="absolute left-3 top-3 text-slate-500 text-xs" />
                            <input placeholder="TX-123" className="input input-bordered w-full pl-8 bg-theme-subtle border-theme focus:border-indigo-500"
                                value={formData.transactionId} onChange={e => setFormData({ ...formData, transactionId: e.target.value })} required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium data-[theme=corporate]:text-gray-700 data-[theme=business]:text-slate-300" data-theme={document.documentElement.getAttribute('data-theme')}>Sender (DID)</label>
                        <input placeholder="did:cedefi:0x..."
                            value={formData.sender} readOnly className="input input-bordered w-full bg-theme-subtle border-theme opacity-50 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium data-[theme=corporate]:text-gray-700 data-[theme=business]:text-slate-300" data-theme={document.documentElement.getAttribute('data-theme')}>Recipient (DID)</label>
                        <input placeholder="did:cedefi:0x..." className="input input-bordered w-full bg-theme-subtle border-theme focus:border-indigo-500"
                            value={formData.recipient} onChange={e => setFormData({ ...formData, recipient: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium data-[theme=corporate]:text-gray-700 data-[theme=business]:text-slate-300" data-theme={document.documentElement.getAttribute('data-theme')}>Amount</label>
                        <div className="relative">
                            <FaMoneyBillWave className="absolute left-3 top-3 text-slate-500 text-xs" />
                            <input type="number" placeholder="100" className="input input-bordered w-full pl-8 bg-theme-subtle border-theme focus:border-indigo-500"
                                value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
                        </div>
                    </div>
                    <div className="flex items-end md:col-span-4 lg:col-span-1 lg:col-start-4">
                        <button type="submit" className="btn btn-primary w-full bg-gradient-to-tr from-indigo-500 to-violet-500 border-none text-white shadow-lg shadow-indigo-500/20">
                            Submit Request
                        </button>
                    </div>
                </form>
            </motion.div>

            {/* Transactions Table */}
            <div className="overflow-x-auto rounded-2xl bg-theme-subtle ring-1 ring-theme">
                <div className="min-w-full inline-block align-middle">
                    <table className="table w-full">
                        <thead>
                            <tr className="border-b data-[theme=corporate]:text-gray-700 data-[theme=corporate]:border-gray-200 data-[theme=business]:text-slate-300 data-[theme=business]:border-theme" data-theme={typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : 'business'}>
                                <th className="min-w-[120px]">ID</th>
                                <th className="min-w-[150px]">Sender</th>
                                <th className="min-w-[150px]">Recipient</th>
                                <th className="min-w-[100px]">Amount</th>
                                <th className="min-w-[100px]">Status</th>
                                <th className="min-w-[150px]">Bank Approvals</th>
                                <th className="min-w-[120px]">Node Votes</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {filteredTransactions.map((tx) => (
                                    <motion.tr
                                        key={tx._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-theme-subtle border-b border-white/5 last:border-0"
                                    >
                                        <td className="font-mono text-sm">{tx.transactionId}</td>
                                        <td className="font-mono text-xs text-slate-300">
                                            <div className="max-w-[150px] truncate" title={tx.sender}>{tx.sender}</div>
                                        </td>
                                        <td className="font-mono text-xs text-slate-300">
                                            <div className="max-w-[150px] truncate" title={tx.recipient}>{tx.recipient}</div>
                                        </td>
                                        <td className="font-semibold text-emerald-400">${tx.amount}</td>
                                        <td>
                                            <span className={`badge ${tx.status === 'APPROVED' ? 'badge-success' : tx.status === 'REJECTED' ? 'badge-error' : 'badge-warning'} badge-outline`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-1 flex-wrap max-w-[150px]">
                                                {tx.bankApprovals.map((b, i) => (
                                                    <span key={i} className="badge badge-ghost badge-xs truncate">{b.bankId}</span>
                                                ))}
                                                {tx.bankApprovals.length === 0 && <span className="text-slate-500 text-xs italic">Waiting...</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 transition-all duration-500"
                                                        style={{ width: `${(tx.votes.filter(v => v.decision).length / 10) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="font-bold text-xs">{tx.votes.filter(v => v.decision).length}</span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center py-8 text-slate-400">
                                        No transactions found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Transactions;
