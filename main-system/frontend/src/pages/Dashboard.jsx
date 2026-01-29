import { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import AuthContext from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [nodes, setNodes] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [activeNodes, setActiveNodes] = useState(0);

    const fetchData = async () => {
        try {
            const [nodesRes, txRes] = await Promise.all([
                axios.get('http://localhost:5000/nodes'),
                axios.get('http://localhost:5000/transactions')
            ]);
            setNodes(nodesRes.data);
            setActiveNodes(nodesRes.data.filter(n => n.isActive).length);
            setTransactions(txRes.data);
        } catch (error) {
            console.error("Error fetching dashboard data", error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    // Stats Logic
    const totalVolume = transactions.reduce((acc, t) => acc + t.amount, 0);
    const successRate = transactions.length > 0
        ? ((transactions.filter(t => t.status === 'APPROVED').length / transactions.length) * 100).toFixed(1)
        : 0;

    // Calculate current month volume
    const currentMonthVolume = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return transactions
            .filter(tx => new Date(tx.createdAt) >= startOfMonth)
            .reduce((acc, tx) => acc + tx.amount, 0);
    }, [transactions]);

    const kpis = [
        { label: 'Total Volume', value: `$${totalVolume.toLocaleString()}`, delta: null, color: 'from-emerald-500 to-teal-500' },
        { label: 'Active Nodes', value: activeNodes.toString(), delta: null, color: 'from-indigo-500 to-violet-500' },
        { label: 'Success Rate', value: `${successRate}%`, delta: null, color: 'from-sky-500 to-cyan-500' },
    ];

    // Chart Data Preparation
    const areaData = useMemo(() => {
        const grouped = transactions.reduce((acc, tx) => {
            const date = new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!acc[date]) acc[date] = 0;
            acc[date] += tx.amount;
            return acc;
        }, {});

        const data = Object.entries(grouped).map(([name, volume]) => ({ name, volume }));
        return data.sort((a, b) => new Date(a.name) - new Date(b.name));
    }, [transactions]);

    const barData = useMemo(() => {
        // Group transactions by day of week
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const grouped = transactions.reduce((acc, tx) => {
            const date = new Date(tx.createdAt);
            const dayIndex = date.getDay();
            const dayName = daysOfWeek[dayIndex];
            if (!acc[dayName]) acc[dayName] = 0;
            acc[dayName] += 1;
            return acc;
        }, {});

        return daysOfWeek.map(day => ({
            name: day,
            txs: grouped[day] || 0
        }));
    }, [transactions]);


    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {kpis.map((k, i) => (
                    <motion.div
                        key={k.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`rounded-2xl p-5 bg-gradient-to-tr ${k.color} text-white shadow-lg shadow-black/20`}
                    >
                        <div className="text-sm/5 opacity-90">{k.label}</div>
                        <div className="mt-2 text-3xl font-extrabold">{k.value}</div>
                        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            Live data
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-2 rounded-2xl bg-theme-subtle ring-1 ring-theme p-4">
                    <div className="flex items-center justify-between p-2">
                        <div>
                            <div className="text-sm text-theme-secondary">Current Month Volume</div>
                            <div className="text-xl font-bold">${currentMonthVolume.toLocaleString()}</div>
                        </div>
                        <div className="join">
                            <button className="btn btn-xs join-item btn-primary">MTD</button>
                        </div>
                    </div>
                    <div className="h-64 relative">
                        {areaData.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-theme-muted italic text-sm">
                                No transaction data available for this period
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={areaData}>
                                    <defs>
                                        <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.6} />
                                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.1} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                    <YAxis stroke="#94a3b8" fontSize={12} />
                                    <Tooltip contentStyle={{ background: 'rgba(2,6,23,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                                    <Area type="monotone" dataKey="volume" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#grad1)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
                <div className="rounded-2xl bg-theme-subtle ring-1 ring-theme p-4">
                    <div className="text-sm text-theme-secondary">Weekly Distribution</div>
                    <div className="h-64 mt-2 relative">
                        {transactions.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-theme-muted italic text-sm">
                                Waiting for data...
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.1} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                    <YAxis stroke="#94a3b8" fontSize={12} />
                                    <Tooltip contentStyle={{ background: 'rgba(2,6,23,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                                    <Bar dataKey="txs" radius={[6, 6, 0, 0]} fill="#22d3ee" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl bg-theme-subtle ring-1 ring-theme p-4">
                <div className="text-lg font-semibold mb-4">Recent Activity</div>
                <div className="divide-y divide-white/5">
                    {transactions.slice(0, 6).map((tx, i) => (
                        <motion.div key={tx._id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 py-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-500 grid place-items-center">💸</div>
                            <div className="flex-1">
                                <div className="font-medium">{tx.transactionId}</div>
                                <div className="text-xs text-theme-muted">to {tx.recipient?.substring(0, 16)}...</div>
                            </div>
                            <div className={`font-semibold ${tx.status === 'REJECTED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {tx.status === 'REJECTED' ? '-' : '+'}$ {tx.amount.toLocaleString()}
                            </div>
                        </motion.div>
                    ))}
                    {transactions.length === 0 && <div className="p-4 text-center text-theme-muted">No recent activity</div>}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
