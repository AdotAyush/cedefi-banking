import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaPaperPlane, FaMoneyBillWave, FaHashtag } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [formData, setFormData] = useState({ transactionId: '', sender: '', amount: '' });
    const [filter, setFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredTransactions = transactions.filter(tx => {
        const matchesFilter = filter === 'ALL' || tx.status === filter;
        const matchesSearch = tx.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.sender.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            </div>

            {/* Create Transaction Card */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FaPaperPlane className="text-primary" />
                            New Transaction
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Transaction ID</label>
                                <div className="relative">
                                    <FaHashtag className="absolute left-3 top-3 text-muted-foreground text-xs" />
                                    <Input placeholder="TX-123" className="pl-8"
                                        value={formData.transactionId} onChange={e => setFormData({ ...formData, transactionId: e.target.value })} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Sender</label>
                                <Input placeholder="Alice"
                                    value={formData.sender} onChange={e => setFormData({ ...formData, sender: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Amount</label>
                                <div className="relative">
                                    <FaMoneyBillWave className="absolute left-3 top-3 text-muted-foreground text-xs" />
                                    <Input type="number" placeholder="100" className="pl-8"
                                        value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
                                </div>
                            </div>
                            <div className="flex items-end">
                                <Button type="submit" className="w-full">
                                    Submit Request
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex p-1 bg-muted rounded-lg">
                    {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map(status => (
                        <button key={status}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === status ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => setFilter(status)}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-64">
                    <FaSearch className="absolute left-3 top-3 text-muted-foreground text-xs" />
                    <Input
                        placeholder="Search ID or Sender..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Transactions Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Sender</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Bank Approvals</TableHead>
                                <TableHead>Node Votes (Yes)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence>
                                {filteredTransactions.map((tx, index) => (
                                    <TableRow key={tx._id}>
                                        <TableCell className="font-mono font-medium">{tx.transactionId}</TableCell>
                                        <TableCell>{tx.sender}</TableCell>
                                        <TableCell className="font-bold text-green-600">${tx.amount}</TableCell>
                                        <TableCell>
                                            <Badge variant={tx.status === 'APPROVED' ? 'success' : tx.status === 'REJECTED' ? 'destructive' : 'warning'}>
                                                {tx.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap">
                                                {tx.bankApprovals.map((b, i) => (
                                                    <Badge key={i} variant="outline" className="text-xs">{b.bankId}</Badge>
                                                ))}
                                                {tx.bankApprovals.length === 0 && <span className="text-muted-foreground text-xs italic">Waiting...</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary transition-all duration-500"
                                                        style={{ width: `${(tx.votes.filter(v => v.decision).length / 10) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="font-bold text-xs">{tx.votes.filter(v => v.decision).length}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </AnimatePresence>
                            {filteredTransactions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan="6" className="text-center py-8 text-muted-foreground">
                                        No transactions found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default Transactions;
