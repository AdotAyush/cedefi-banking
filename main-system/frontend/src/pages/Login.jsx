import { useState, useRef, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaKey, FaLock, FaArrowRight, FaShieldAlt, FaUpload, FaEye, FaEyeSlash, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { decryptPrivateKey } from '../components/KeyVaultModal';

const Login = () => {
    const [privateKey, setPrivateKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    // Key vault import state
    const [showImporter, setShowImporter] = useState(false);
    const [vaultFile, setVaultFile] = useState(null);
    const [vaultPassword, setVaultPassword] = useState('');
    const [vaultError, setVaultError] = useState('');
    const [vaultLoading, setVaultLoading] = useState(false);
    const [showVaultPwd, setShowVaultPwd] = useState(false);
    const fileInputRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(privateKey);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setVaultFile(file);
        setVaultError('');
    };

    const handleVaultDecrypt = async () => {
        if (!vaultFile) { setVaultError('Please select a .cedefi-key file.'); return; }
        if (!vaultPassword) { setVaultError('Please enter the backup password.'); return; }
        setVaultLoading(true);
        setVaultError('');
        try {
            const text = await vaultFile.text();
            const vault = JSON.parse(text);
            const key = await decryptPrivateKey(vault, vaultPassword);
            setPrivateKey(key);
            setShowImporter(false);
            setVaultFile(null);
            setVaultPassword('');
        } catch (err) {
            setVaultError('Decryption failed. Wrong password or corrupted file.');
        }
        setVaultLoading(false);
    };

    const resetImporter = () => {
        setShowImporter(false);
        setVaultFile(null);
        setVaultPassword('');
        setVaultError('');
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-4">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md"
            >
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/50 mb-4">
                        <FaLock className="text-2xl text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-slate-400">Sign in to access your CeDeFi account</p>
                </div>

                {/* Login Card */}
                <div className="rounded-3xl bg-theme-subtle backdrop-blur-xl ring-1 ring-theme p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                <FaKey className="inline mr-2" />
                                Private Key
                            </label>
                            <div className="relative">
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={privateKey}
                                    onChange={(e) => setPrivateKey(e.target.value)}
                                    required
                                    placeholder="0x..."
                                    className="w-full px-4 py-3 pr-10 rounded-xl bg-theme-subtle border border-theme focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-100 placeholder:text-slate-500 font-mono text-sm transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                                >
                                    {showKey ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        {/* Import from backup file */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setShowImporter(v => !v)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-sm font-medium transition-all"
                            >
                                <FaShieldAlt className="text-xs" />
                                Unlock from Encrypted Backup
                            </button>

                            <AnimatePresence>
                                {showImporter && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-3 p-4 rounded-xl border border-slate-700 bg-slate-800/60 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-slate-300 text-xs font-semibold flex items-center gap-1">
                                                    <FaShieldAlt className="text-emerald-400" />
                                                    Import .cedefi-key backup
                                                </p>
                                                <button type="button" onClick={resetImporter} className="text-slate-500 hover:text-slate-300">
                                                    <FaTimes className="text-xs" />
                                                </button>
                                            </div>

                                            {/* File picker */}
                                            <div>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept=".cedefi-key,application/json"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-dashed border-slate-600 hover:border-emerald-500/50 bg-slate-700/40 text-slate-400 hover:text-emerald-300 text-xs transition-all"
                                                >
                                                    <FaUpload />
                                                    {vaultFile ? (
                                                        <span className="text-emerald-300 flex items-center gap-1">
                                                            <FaCheckCircle /> {vaultFile.name}
                                                        </span>
                                                    ) : 'Choose backup file…'}
                                                </button>
                                            </div>

                                            {/* Password */}
                                            <div className="relative">
                                                <input
                                                    type={showVaultPwd ? 'text' : 'password'}
                                                    value={vaultPassword}
                                                    onChange={(e) => setVaultPassword(e.target.value)}
                                                    placeholder="Backup password"
                                                    className="w-full px-3 py-2 pr-9 rounded-lg bg-slate-700 border border-slate-600 focus:border-emerald-500 outline-none text-slate-100 placeholder:text-slate-500 text-xs transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowVaultPwd(v => !v)}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
                                                >
                                                    {showVaultPwd ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            </div>

                                            {vaultError && (
                                                <p className="text-red-400 text-xs">{vaultError}</p>
                                            )}

                                            <button
                                                type="button"
                                                onClick={handleVaultDecrypt}
                                                disabled={vaultLoading}
                                                className="w-full py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all disabled:opacity-50"
                                            >
                                                {vaultLoading ? 'Decrypting…' : 'Decrypt & Fill Key'}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:shadow-indigo-500/50 hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            Authenticate
                            <FaArrowRight className="text-sm" />
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-theme text-center">
                        <p className="text-sm text-slate-400">
                            Need an identity?{' '}
                            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                                Register
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer Text */}
                <p className="text-center text-slate-500 text-xs mt-6">
                    Secured by decentralized identity verification
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
