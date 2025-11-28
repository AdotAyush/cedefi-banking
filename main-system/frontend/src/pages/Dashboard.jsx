import { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
    const [nodes, setNodes] = useState([]);
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
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
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const activeNodes = nodes.filter(n => n.isActive).length;
    const approvedTxs = transactions.filter(t => t.status === 'APPROVED').length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="stats shadow bg-base-100">
                <div className="stat">
                    <div className="stat-title">Active Nodes</div>
                    <div className="stat-value text-primary">{activeNodes}</div>
                    <div className="stat-desc">Total Registered: {nodes.length}</div>
                </div>
                <div className="stat">
                    <div className="stat-title">Approved Transactions</div>
                    <div className="stat-value text-secondary">{approvedTxs}</div>
                    <div className="stat-desc">Total: {transactions.length}</div>
                </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title">System Status</h2>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <span>Bank Service A</span>
                            <span className="badge badge-success">Online</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Bank Service B</span>
                            <span className="badge badge-success">Online</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Bank Service C</span>
                            <span className="badge badge-success">Online</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Blockchain Network</span>
                            <span className="badge badge-info">Localhost</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
