import { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Settings, Activity, Users } from 'lucide-react';
import Dashboard from './components/Dashboard';
import NodeManagement from './components/NodeManagement';
import BankSettings from './components/Settings';

function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [bankInfo, setBankInfo] = useState(null);
    const [currentBankPort, setCurrentBankPort] = useState(3001);

    useEffect(() => {
        axios.get(`http://localhost:${currentBankPort}/bank/info`)
            .then(res => setBankInfo(res.data))
            .catch(err => console.error(err));
    }, [currentBankPort]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-slate-100 relative">
            {/* Animated background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur relative z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl text-blue-400">
                        <Shield className="w-6 h-6" />
                        <span>Bank Service Admin</span>
                    </div>

                    {/* Bank Selector */}
                    <select
                        className="bg-slate-800/80 border border-slate-700 rounded px-2 py-1 text-sm text-slate-100"
                        value={currentBankPort}
                        onChange={(e) => setCurrentBankPort(Number(e.target.value))}
                    >
                        <option value={3001}>Bank A (3001)</option>
                        <option value={3002}>Bank B (3002)</option>
                        <option value={3003}>Bank C (3003)</option>
                    </select>

                    <div className="flex gap-1">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${activeTab === 'dashboard' ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-slate-800'}`}
                        >
                            <Activity className="w-4 h-4" /> Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('nodes')}
                            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${activeTab === 'nodes' ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-slate-800'}`}
                        >
                            <Users className="w-4 h-4" /> Nodes
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${activeTab === 'settings' ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-slate-800'}`}
                        >
                            <Settings className="w-4 h-4" /> Settings
                        </button>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8 relative z-10">
                {activeTab === 'dashboard' && <Dashboard bankInfo={bankInfo} apiPort={currentBankPort} />}
                {activeTab === 'nodes' && <NodeManagement apiPort={currentBankPort} />}
                {activeTab === 'settings' && <BankSettings apiPort={currentBankPort} />}
            </main>
        </div>
    );
}

export default App;
