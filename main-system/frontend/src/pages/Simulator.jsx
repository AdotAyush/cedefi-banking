import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaServer, FaVoteYea, FaVoteNay, FaPlus } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const Simulator = () => {
    const [nodes, setNodes] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [selectedTx, setSelectedTx] = useState('');
    const [selectedNode, setSelectedNode] = useState('');

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

    const handleVote = async (decision) => {
        if (!selectedTx || !selectedNode) return alert('Select transaction and node');
        try {
            await axios.post(`http://localhost:5000/transactions/${selectedTx}/vote`, {
                voter: selectedNode,
                decision
            });
            fetchData();
        } catch (error) {
            alert('Error voting: ' + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Network Simulator</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Node Management */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <Card className="h-full border-t-4 border-t-blue-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FaServer className="text-blue-500" />
                                Node Management
                            </CardTitle>
                            <CardDescription>Simulate adding new validator nodes to the network.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 bg-muted/50 rounded-lg border border-dashed text-center">
                                <p className="text-sm text-muted-foreground mb-4">Click below to spawn a new validator node instance.</p>
                                <Button onClick={handleRegisterNode} className="w-full gap-2">
                                    <FaPlus />
                                    Register Random Node
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Voting Simulator */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <Card className="h-full border-t-4 border-t-purple-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FaVoteYea className="text-purple-500" />
                                Voting Simulator
                            </CardTitle>
                            <CardDescription>Cast votes from registered nodes on pending transactions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Transaction</label>
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
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Node</label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    onChange={e => setSelectedNode(e.target.value)}
                                    value={selectedNode}
                                >
                                    <option value="">-- Choose Node --</option>
                                    {nodes.map(n => (
                                        <option key={n._id} value={n.publicKey}>{n.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <Button variant="destructive" onClick={() => handleVote(false)} disabled={!selectedTx || !selectedNode} className="gap-2">
                                    <FaVoteNay /> Vote NO
                                </Button>
                                <Button variant="default" onClick={() => handleVote(true)} disabled={!selectedTx || !selectedNode} className="bg-green-600 hover:bg-green-700 gap-2">
                                    <FaVoteYea /> Vote YES
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Visual Node Grid */}
            <Card>
                <CardHeader>
                    <CardTitle>Active Nodes Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {nodes.map((node, i) => (
                            <motion.div
                                key={node._id}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex flex-col items-center p-4 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
                            >
                                <div className="relative mb-3">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl group-hover:scale-110 transition-transform">
                                        {node.name.charAt(0)}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                                </div>
                                <span className="font-bold text-sm">{node.name}</span>
                                <span className="text-xs text-muted-foreground truncate w-full text-center">{node.publicKey.substring(0, 8)}...</span>
                            </motion.div>
                        ))}
                        {nodes.length === 0 && <div className="col-span-full text-center text-muted-foreground py-10">No nodes active</div>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Simulator;
