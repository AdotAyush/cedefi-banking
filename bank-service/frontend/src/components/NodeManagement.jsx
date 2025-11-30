import { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, ShieldCheck, ShieldAlert } from 'lucide-react';

const NodeManagement = ({ apiPort }) => {
    const [nodes, setNodes] = useState([]);
    const [trustedNodes, setTrustedNodes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            // Fetch all nodes from Main System
            const nodesRes = await axios.get('http://localhost:5000/nodes');
            // Fetch trusted nodes from Bank Backend
            const settingsRes = await axios.get(`http://localhost:${apiPort}/bank/settings`);

            setNodes(nodesRes.data);
            setTrustedNodes(settingsRes.data.trustedNodes || []);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [apiPort]);

    const toggleTrust = async (publicKey, isTrusted) => {
        let newTrusted = [...trustedNodes];
        if (isTrusted) {
            newTrusted = newTrusted.filter(k => k !== publicKey);
        } else {
            newTrusted.push(publicKey);
        }

        try {
            await axios.post(`http://localhost:${apiPort}/bank/settings`, { trustedNodes: newTrusted });
            setTrustedNodes(newTrusted);
        } catch (error) {
            console.error("Error updating settings", error);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Node Trust Management</h2>
                <div className="text-sm text-slate-400">
                    Trusted Nodes: {trustedNodes.length} / {nodes.length}
                </div>
            </div>

            <div className="grid gap-4">
                {nodes.map(node => {
                    const isTrusted = trustedNodes.includes(node.publicKey);
                    return (
                        <div key={node._id} className={`p-4 rounded-lg border flex items-center justify-between ${isTrusted ? 'bg-blue-950/30 border-blue-500/50' : 'bg-slate-800 border-slate-700'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${isTrusted ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                                    {isTrusted ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{node.name}</h3>
                                    <p className="text-sm text-slate-400 font-mono">{node.publicKey}</p>
                                    <div className="flex gap-2 mt-1">
                                        <span className={`text-xs px-2 py-0.5 rounded ${node.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {node.status}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                                            Rep: {node.reputation}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleTrust(node.publicKey, isTrusted)}
                                className={`px-4 py-2 rounded font-medium transition-colors ${isTrusted
                                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                    : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                                    }`}
                            >
                                {isTrusted ? 'Revoke Trust' : 'Mark Trusted'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NodeManagement;
