import { useState, useEffect } from 'react';
import axios from 'axios';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [formData, setFormData] = useState({ transactionId: '', sender: '', amount: '' });

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
            setFormData({ transactionId: '', sender: '', amount: '' });
            fetchTransactions();
        } catch (error) {
            alert('Error creating transaction');
        }
    };

    return (
        <div className="space-y-6">
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title">Create Transaction</h2>
                    <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                        <div className="form-control w-full max-w-xs">
                            <label className="label"><span className="label-text">Transaction ID</span></label>
                            <input type="text" placeholder="TX-123" className="input input-bordered w-full max-w-xs"
                                value={formData.transactionId} onChange={e => setFormData({ ...formData, transactionId: e.target.value })} required />
                        </div>
                        <div className="form-control w-full max-w-xs">
                            <label className="label"><span className="label-text">Sender</span></label>
                            <input type="text" placeholder="Alice" className="input input-bordered w-full max-w-xs"
                                value={formData.sender} onChange={e => setFormData({ ...formData, sender: e.target.value })} required />
                        </div>
                        <div className="form-control w-full max-w-xs">
                            <label className="label"><span className="label-text">Amount</span></label>
                            <input type="number" placeholder="100" className="input input-bordered w-full max-w-xs"
                                value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
                        </div>
                        <button type="submit" className="btn btn-primary">Submit</button>
                    </form>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="table bg-base-100 shadow-xl">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Sender</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Bank Approvals</th>
                            <th>Node Votes (Yes)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(tx => (
                            <tr key={tx._id}>
                                <td>{tx.transactionId}</td>
                                <td>{tx.sender}</td>
                                <td>{tx.amount}</td>
                                <td>
                                    <span className={`badge ${tx.status === 'APPROVED' ? 'badge-success' : tx.status === 'REJECTED' ? 'badge-error' : 'badge-warning'}`}>
                                        {tx.status}
                                    </span>
                                </td>
                                <td>{tx.bankApprovals.length}</td>
                                <td>{tx.votes.filter(v => v.decision).length}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Transactions;
