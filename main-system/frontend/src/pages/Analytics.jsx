import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { FaMoneyBillWave, FaChartLine, FaCheckCircle, FaClock, FaServer } from 'react-icons/fa';

const Analytics = () => {
    const [transactions, setTransactions] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [txRes, nodeRes] = await Promise.all([
                    axios.get('http://localhost:5000/transactions'),
                    axios.get('http://localhost:5000/nodes')
                ]);
                setTransactions(txRes.data || []);
                setNodes(nodeRes.data || []);
                setError(null);
            } catch (error) {
                console.error("Error fetching analytics data", error);
                setError(error.message);
                // Set empty arrays on error
                setTransactions([]);
                setNodes([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    // Enhanced Statistics
    const stats = useMemo(() => {
        const totalVolume = transactions.reduce((acc, t) => acc + t.amount, 0);
        const avgTransactionValue = transactions.length > 0 ? totalVolume / transactions.length : 0;
        const approvedCount = transactions.filter(t => t.status === 'APPROVED').length;
        const rejectedCount = transactions.filter(t => t.status === 'REJECTED').length;
        const pendingCount = transactions.filter(t => t.status === 'PENDING').length;
        const approvalRate = transactions.length > 0 ? (approvedCount / transactions.length) * 100 : 0;
        const activeNodes = nodes.filter(n => n.status === 'ACTIVE' || n.status === 'VERIFIED').length;

        return {
            totalVolume,
            avgTransactionValue,
            totalTransactions: transactions.length,
            approvedCount,
            rejectedCount,
            pendingCount,
            approvalRate,
            activeNodes,
            totalNodes: nodes.length,
        };
    }, [transactions, nodes]);

    const kpis = [
        {
            label: 'Total Volume',
            value: `$${stats.totalVolume.toLocaleString()}`,
            subtext: `${stats.totalTransactions} transactions`,
            color: 'from-emerald-500 to-teal-500',
            icon: FaMoneyBillWave
        },
        {
            label: 'Avg Transaction',
            value: `$${Math.round(stats.avgTransactionValue).toLocaleString()}`,
            subtext: 'Per transaction',
            color: 'from-blue-500 to-cyan-500',
            icon: FaChartLine
        },
        {
            label: 'Approval Rate',
            value: `${stats.approvalRate.toFixed(1)}%`,
            subtext: `${stats.approvedCount} approved`,
            color: 'from-violet-500 to-purple-500',
            icon: FaCheckCircle
        },
        {
            label: 'Pending Review',
            value: stats.pendingCount.toString(),
            subtext: `${stats.rejectedCount} rejected`,
            color: 'from-amber-500 to-orange-500',
            icon: FaClock
        },
        {
            label: 'Active Nodes',
            value: stats.activeNodes.toString(),
            subtext: `${stats.totalNodes} total nodes`,
            color: 'from-indigo-500 to-blue-500',
            icon: FaServer
        },
    ];

    // Network Volume Chart Data
    const volumeData = useMemo(() => {
        const grouped = transactions.reduce((acc, tx) => {
            const date = new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!acc[date]) acc[date] = 0;
            acc[date] += tx.amount;
            return acc;
        }, {});

        return Object.entries(grouped).map(([name, volume]) => ({ name, volume })).slice(-10);
    }, [transactions]);

    // Transaction Status Chart Data
    const approvalData = useMemo(() => {
        const grouped = transactions.reduce((acc, tx) => {
            const date = new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!acc[date]) acc[date] = { approved: 0, rejected: 0, pending: 0 };
            if (tx.status === 'APPROVED') acc[date].approved += 1;
            else if (tx.status === 'REJECTED') acc[date].rejected += 1;
            else acc[date].pending += 1;
            return acc;
        }, {});

        return Object.entries(grouped).map(([name, data]) => ({
            name,
            approved: data.approved,
            rejected: data.rejected,
            pending: data.pending
        })).slice(-10);
    }, [transactions]);

    // Transaction Distribution Pie Chart
    const distributionData = useMemo(() => [
        { name: 'Approved', value: stats.approvedCount, color: '#10b981' },
        { name: 'Pending', value: stats.pendingCount, color: '#f59e0b' },
        { name: 'Rejected', value: stats.rejectedCount, color: '#ef4444' },
    ], [stats]);

    // Hourly Transaction Chart
    const hourlyData = useMemo(() => {
        const grouped = transactions.reduce((acc, tx) => {
            const hour = new Date(tx.createdAt).getHours();
            if (!acc[hour]) acc[hour] = 0;
            acc[hour] += 1;
            return acc;
        }, {});

        return Array.from({ length: 24 }, (_, i) => ({
            hour: `${i}:00`,
            count: grouped[i] || 0
        }));
    }, [transactions]);

    // Node Activity Chart
    const nodeActivityData = useMemo(() => {
        return nodes.map(node => ({
            name: node.name || 'Unknown',
            votes: node.voteCount || 0,
            status: node.status
        })).slice(0, 10);
    }, [nodes]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="text-red-400 mb-2">Error loading analytics data</div>
                    <div className="text-slate-500 text-sm">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-2xl font-bold">Analytics Dashboard</div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {kpis.map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                        <motion.div
                            key={kpi.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="rounded-2xl bg-theme-subtle ring-1 ring-theme p-4"
                        >
                            <div className={`h-12 w-12 rounded-xl bg-gradient-to-tr ${kpi.color} grid place-items-center mb-3 shadow-lg`}>
                                <Icon className="text-2xl text-white" />
                            </div>
                            <div className="text-3xl font-bold mb-1">{kpi.value}</div>
                            <div className="text-sm font-medium mb-1">{kpi.label}</div>
                            <div className="text-xs text-theme-muted">{kpi.subtext}</div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Network Volume Chart */}
                <div className="rounded-2xl bg-theme-subtle ring-1 ring-theme p-4">
                    <div className="text-lg font-semibold mb-4">Network Volume (Last 10 Days)</div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={volumeData}>
                            <defs>
                                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="volume" stroke="#06b6d4" fillOpacity={1} fill="url(#volumeGradient)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Transaction Status Trend */}
                <div className="rounded-2xl bg-theme-subtle ring-1 ring-theme p-4">
                    <div className="text-lg font-semibold mb-4">Transaction Status Trend</div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={approvalData}>
                            <defs>
                                <linearGradient id="approvedGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="rejectedGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="approved" stackId="1" stroke="#10b981" fillOpacity={1} fill="url(#approvedGradient)" />
                            <Area type="monotone" dataKey="pending" stackId="1" stroke="#f59e0b" fillOpacity={1} fill="url(#pendingGradient)" />
                            <Area type="monotone" dataKey="rejected" stackId="1" stroke="#ef4444" fillOpacity={1} fill="url(#rejectedGradient)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Status Distribution Pie Chart */}
                <div className="rounded-2xl bg-theme-subtle ring-1 ring-theme p-4">
                    <div className="text-lg font-semibold mb-4">Transaction Distribution</div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={distributionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {distributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Hourly Transaction Activity */}
                <div className="rounded-2xl bg-theme-subtle ring-1 ring-theme p-4">
                    <div className="text-lg font-semibold mb-4">Hourly Transaction Activity</div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={hourlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="hour" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                            <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Node Activity Chart */}
                {nodes.length > 0 && (
                    <div className="rounded-2xl bg-theme-subtle ring-1 ring-theme p-4 lg:col-span-2">
                        <div className="text-lg font-semibold mb-4">Node Activity (Votes Cast)</div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={nodeActivityData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                                <Bar dataKey="votes" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics;
