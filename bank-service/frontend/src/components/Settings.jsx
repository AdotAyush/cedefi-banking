import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save } from 'lucide-react';

const BankSettings = ({ apiPort }) => {
    const [policy, setPolicy] = useState({ minTrustedVotes: 1 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        axios.get(`http://localhost:${apiPort}/bank/settings`)
            .then(res => {
                setPolicy(res.data.securityPolicy);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, [apiPort]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.post(`http://localhost:${apiPort}/bank/settings`, { securityPolicy: policy });
            setSaving(false);
            alert('Settings saved!');
        } catch (error) {
            console.error("Error saving settings", error);
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Security Policy</h2>
                <p className="text-slate-400">Configure how the bank validates transactions before signing.</p>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Minimum Trusted Votes Required</label>
                        <input
                            type="number"
                            min="0"
                            value={policy.minTrustedVotes}
                            onChange={e => setPolicy({ ...policy, minTrustedVotes: parseInt(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            The number of YES votes required from "Trusted Nodes" for the bank to approve.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="requireConsensus"
                            checked={policy.requireBankConsensus}
                            onChange={e => setPolicy({ ...policy, requireBankConsensus: e.target.checked })}
                            className="w-4 h-4 rounded bg-slate-900 border-slate-700"
                        />
                        <label htmlFor="requireConsensus" className="text-sm font-medium">
                            Require Inter-Bank Consensus (Future Feature)
                        </label>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-700">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BankSettings;
