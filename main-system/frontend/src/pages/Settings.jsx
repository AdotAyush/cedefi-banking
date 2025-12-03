import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCog, FaKey, FaServer, FaShieldAlt, FaBell, FaUser } from 'react-icons/fa';

const Settings = () => {
    const [apiKey, setApiKey] = useState('sk_live_51Mz...');
    const [nodeUrl, setNodeUrl] = useState('http://localhost:5000');
    const [notifications, setNotifications] = useState(true);

    const sections = [
        {
            id: 'general',
            title: 'General',
            icon: FaCog,
            content: (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-theme-subtle ring-1 ring-theme">
                        <div>
                            <div className="font-medium">System Notifications</div>
                            <div className="text-sm text-slate-400">Receive alerts for new transactions</div>
                        </div>
                        <input type="checkbox" className="toggle toggle-primary" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />
                    </div>
                </div>
            )
        },
        {
            id: 'network',
            title: 'Network Configuration',
            icon: FaServer,
            content: (
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-theme-subtle ring-1 ring-theme space-y-3">
                        <label className="text-sm font-medium text-slate-300">Primary Node URL</label>
                        <input type="text" value={nodeUrl} onChange={(e) => setNodeUrl(e.target.value)} className="input input-bordered w-full bg-black/20 border-theme" />
                        <div className="flex justify-end">
                            <button className="btn btn-sm btn-primary">Save Configuration</button>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'security',
            title: 'Security & API',
            icon: FaShieldAlt,
            content: (
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-theme-subtle ring-1 ring-theme space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <FaKey className="text-amber-400" />
                            <span className="font-medium">Bank API Key</span>
                        </div>
                        <div className="join w-full">
                            <input type="password" value={apiKey} readOnly className="input input-bordered join-item w-full bg-black/20 border-theme font-mono text-sm" />
                            <button className="btn join-item btn-square btn-ghost border-theme" onClick={() => navigator.clipboard.writeText(apiKey)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-xs text-theme-subtle">Use this key to authenticate requests from your banking infrastructure.</p>
                        <button className="btn btn-sm btn-outline btn-error w-full">Regenerate Key</button>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-2xl font-bold">Settings</div>

            <div className="grid gap-6">
                {sections.map((section, i) => (
                    <motion.div
                        key={section.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="rounded-2xl bg-theme-subtle ring-1 ring-theme p-6"
                    >
                        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-600 grid place-items-center shadow-lg">
                                <section.icon className="text-white" />
                            </div>
                            <div className="text-lg font-semibold">{section.title}</div>
                        </div>
                        {section.content}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Settings;
