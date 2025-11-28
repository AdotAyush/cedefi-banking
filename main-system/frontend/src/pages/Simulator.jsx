import { useState, useEffect } from 'react';
import axios from 'axios';

const Simulator = () => {
    const [nodes, setNodes] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [selectedTx, setSelectedTx] = useState('');
    const [selectedNode, setSelectedNode] = useState('');

    const fetchData = async () => {
        const nodesRes = await axios.get('http://localhost:5000/nodes');
        setNodes(nodesRes.data);
        const txRes = await axios.get('http://localhost:5000/transactions');
        setTransactions(txRes.data);
    };

    useEffect(() => {
        fetchData();
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
            alert('Vote cast!');
            fetchData();
        } catch (error) {
            alert('Error voting: ' + error.response?.data?.error || error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title">Node Simulator</h2>
                    <button onClick={handleRegisterNode} className="btn btn-secondary w-48">Register New Node</button>

                    <div className="divider"></div>

                    <h3 className="text-lg font-bold">Cast Vote</h3>
                    <div className="flex gap-4">
                        <select className="select select-bordered w-full max-w-xs" onChange={e => setSelectedTx(e.target.value)} value={selectedTx}>
                            <option value="">Select Transaction</option>
                            {transactions.map(t => <option key={t._id} value={t.transactionId}>{t.transactionId} ({t.status})</option>)}
                        </select>

                        <select className="select select-bordered w-full max-w-xs" onChange={e => setSelectedNode(e.target.value)} value={selectedNode}>
                            <option value="">Select Node</option>
                            {nodes.map(n => <option key={n._id} value={n.publicKey}>{n.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-4 mt-4">
                        <button onClick={() => handleVote(true)} className="btn btn-success">Vote YES</button>
                        <button onClick={() => handleVote(false)} className="btn btn-error">Vote NO</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Simulator;
