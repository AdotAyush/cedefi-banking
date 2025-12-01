import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaServer, FaThumbsUp, FaThumbsDown, FaPlus, FaCheck, FaTimes, FaMoneyBillWave } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const Simulator = () => {
    const [nodes, setNodes] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [selectedTx, setSelectedTx] = useState('');

    // New Transaction State
    const [newTx, setNewTx] = useState({ sender: 'User1', recipient: 'User2', amount: 100 });

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

    const handleCreateTx = async () => {
        const id = 'TX-' + Math.floor(Math.random() * 10000);
        try {
            await axios.post('http://localhost:5000/transactions', {
                transactionId: id,
                sender: newTx.sender,
                recipient: newTx.recipient,
                amount: Number(newTx.amount)
            });
            fetchData();
        } catch (error) {
            alert('Error creating transaction');
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

    const getTxStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-500';
            case 'REJECTED': return 'bg-red-500';
            default: return 'bg-yellow-500';
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Network Simulator</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Node Management */}
                <Card className="border-t-4 border-t-blue-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FaServer className="text-blue-500" />
                            Node Management
                        </CardTitle>
                        <CardDescription>Spawn new validator nodes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleRegisterNode} className="w-full gap-2">
                            <FaPlus /> Register Node
                        </Button>
                    </CardContent>
                </Card>

                {/* Transaction Creation */}
                {/* <Card className="border-t-4 border-t-green-500">
                    <CardHeader>
                        <CardTitle>Create Transaction</CardTitle>
                        <CardDescription>Simulate a new transfer.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <input
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Sender DID (did:cedefi:...)"
                            value={newTx.sender}
                            onChange={e => setNewTx({ ...newTx, sender: e.target.value })}
                        />
                        <input
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Recipient DID (did:cedefi:...)"
                            value={newTx.recipient}
                            onChange={e => setNewTx({ ...newTx, recipient: e.target.value })}
                        />
                        <input
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            type="number"
                            placeholder="Amount"
                            value={newTx.amount}
                            onChange={e => setNewTx({ ...newTx, amount: e.target.value })}
                        />
                        <Button onClick={handleCreateTx} className="w-full">Create Transaction</Button>
                    </CardContent>
                </Card> */}

                {/*Transaction Selection*/}
                <Card className="border-t-4 border-t-purple-500">
                    <CardHeader>
                        <CardTitle>Voting & Claims</CardTitle>
                        <CardDescription>Select transaction to vote or claim.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <select
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            onChange={e => setSelectedTx(e.target.value)}
                            value={selectedTx}
                        >
                            <option value="">-- Choose Transaction --</option>
                            {transactions.map(t => (
                                <option key={t._id} value={t.transactionId}>
                                    {t.transactionId} [{t.status}]
                                </option>
                            ))}
                        </select>
                        {selectedTx && (
                            <div className="mt-4 space-y-2">
                                <div className="p-2 bg-muted rounded text-sm">
                                    <p><strong>Status:</strong> {transactions.find(t => t.transactionId === selectedTx)?.status}</p>
                                    <p><strong>Recipient Status:</strong> {transactions.find(t => t.transactionId === selectedTx)?.recipientStatus}</p>
                                </div>
                                {transactions.find(t => t.transactionId === selectedTx)?.status === 'APPROVED' &&
                                    transactions.find(t => t.transactionId === selectedTx)?.recipientStatus === 'PENDING' && (
                                        <Button onClick={handleClaim} className="w-full bg-yellow-500 hover:bg-yellow-600">
                                            <FaMoneyBillWave className="mr-2" /> Claim Funds
                                        </Button>
                                    )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Visual Node Grid */}
            <Card>
                <CardHeader>
                    <CardTitle>Active Nodes & Voting</CardTitle>
                    <CardDescription>Verify pending nodes and cast votes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {nodes.map((node, i) => {
                            const currentTx = transactions.find(t => t.transactionId === selectedTx);
                            const hasVoted = currentTx?.votes?.some(v => v.voter === node.publicKey);
                            const voteDecision = currentTx?.votes?.find(v => v.voter === node.publicKey)?.decision;

                            return (
                                <motion.div
                                    key={node._id}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`flex flex-col p-4 border rounded-xl bg-card hover:shadow-md transition-all ${node.status === 'PENDING' ? 'border-yellow-400 bg-yellow-50' : ''} ${node.status === 'FRAUDULENT' ? 'border-red-400 bg-red-50 opacity-50' : ''}`}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {node.name.charAt(0)}
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="font-bold text-sm truncate">{node.name}</div>
                                            <div className="text-xs text-muted-foreground truncate w-24">{node.publicKey}</div>
                                            <Badge variant="outline" className="mt-1 text-[10px]">{node.status}</Badge>
                                        </div>
                                        <div className={`ml-auto w-2 h-2 rounded-full ${node.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                    </div>

                                    {/* Node Verification UI */}
                                    {node.status === 'PENDING' && (
                                        <div className="flex gap-2 mt-2">
                                            <Button size="sm" variant="outline" className="flex-1 border-green-200 hover:bg-green-100" onClick={() => handleVerifyNode(node.publicKey, 'APPROVE')}>
                                                <FaCheck className="text-green-600" />
                                            </Button>
                                            <Button size="sm" variant="outline" className="flex-1 border-red-200 hover:bg-red-100" onClick={() => handleVerifyNode(node.publicKey, 'REJECT')}>
                                                <FaTimes className="text-red-600" />
                                            </Button>
                                        </div>
                                    )}

                                    {/* Voting UI */}
                                    {node.status === 'ACTIVE' && selectedTx && currentTx?.status === 'PENDING' && !hasVoted && (
                                        <div className="flex gap-2 mt-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 hover:bg-green-100 hover:text-green-700 border-green-200"
                                                onClick={() => handleVote(node.publicKey, true)}
                                            >
                                                <FaThumbsUp className="mr-1" /> YES
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 hover:bg-red-100 hover:text-red-700 border-red-200"
                                                onClick={() => handleVote(node.publicKey, false)}
                                            >
                                                <FaThumbsDown className="mr-1" /> NO
                                            </Button>
                                        </div>
                                    )}

                                    {selectedTx && hasVoted && (
                                        <div className={`mt-2 text-center text-sm font-bold py-1 rounded ${voteDecision ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            Voted {voteDecision ? 'YES' : 'NO'}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                        {nodes.length === 0 && <div className="col-span-full text-center text-muted-foreground py-10">No nodes active</div>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Simulator;
