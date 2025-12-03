import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const History = () => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('http://localhost:5000/transactions');
                const transactions = res.data;

                // Transform data for display
                const formattedHistory = transactions.map(tx => ({
                    id: tx.transactionId,
                    action: tx.status === 'PENDING' ? 'Created' : tx.status,
                    user: tx.sender,
                    timestamp: new Date(tx.createdAt).toLocaleString(),
                    status: tx.status,
                    recipientStatus: tx.recipientStatus
                }));
                setHistory(formattedHistory);
            } catch (error) {
                console.error("Error fetching history", error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            <div className="text-2xl font-bold">System History</div>

            <div className="rounded-2xl bg-theme-subtle ring-1 ring-theme p-4">
                <div className="text-lg font-semibold mb-4">Audit Log</div>
                <div className="overflow-x-auto">
                    <div className="min-w-full inline-block align-middle">
                        <table className="table w-full">
                            <thead>
                                <tr className="border-b data-[theme=corporate]:text-gray-700 data-[theme=corporate]:border-gray-200 data-[theme=business]:text-slate-300 data-[theme=business]:border-theme" data-theme={typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : 'business'}>
                                    <th className="min-w-[120px]">Transaction ID</th>
                                    <th className="min-w-[100px]">Action</th>
                                    <th className="min-w-[150px]">User</th>
                                    <th className="min-w-[120px]">Recipient Status</th>
                                    <th className="min-w-[150px]">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {history.map((item, i) => (
                                        <motion.tr
                                            key={item.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            className="hover:bg-theme-subtle border-b border-white/5 last:border-0"
                                        >
                                            <td className="font-mono text-sm">{item.id}</td>
                                            <td>
                                                <span className={`badge ${item.status === 'APPROVED' ? 'badge-success' : item.status === 'REJECTED' ? 'badge-error' : 'badge-warning'} badge-outline`}>
                                                    {item.action}
                                                </span>
                                            </td>
                                            <td className="font-mono text-xs text-slate-300">
                                                <div className="max-w-[150px] truncate" title={item.user}>{item.user}</div>
                                            </td>
                                            <td>
                                                <span className="badge badge-ghost badge-outline">
                                                    {item.recipientStatus}
                                                </span>
                                            </td>
                                            <td className="text-slate-400 text-sm">{item.timestamp}</td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-8 text-slate-400">
                                            No history records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default History;
