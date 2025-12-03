import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaCheckCircle, FaKey, FaIdCard, FaCopy, FaArrowRight } from 'react-icons/fa';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState(null);
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await register(username, email, 'dummy_password');
        if (result.success) {
            setSuccessData(result.user);
        } else {
            setError(result.message);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    if (successData) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 p-4">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative w-full max-w-2xl"
                >
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/50 mb-4">
                            <FaCheckCircle className="text-2xl text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Registration Successful!</h1>
                        <p className="text-slate-400">Your decentralized identity has been created</p>
                    </div>

                    <div className="rounded-3xl bg-theme-subtle backdrop-blur-xl ring-1 ring-theme p-8 shadow-2xl space-y-6">
                        {/* Warning Alert */}
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
                            <div className="text-2xl">⚠️</div>
                            <div>
                                <h3 className="font-bold text-amber-400 mb-1">IMPORTANT: Save Your Private Key</h3>
                                <p className="text-sm text-amber-300/80">You will need this key to login. It will NOT be shown again.</p>
                            </div>
                        </div>

                        {/* DID */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                                <FaIdCard />
                                Your DID
                            </label>
                            <div className="relative group">
                                <div className="p-4 rounded-xl bg-theme-subtle border border-theme font-mono text-sm text-slate-100 break-all">
                                    {successData.did}
                                </div>
                                <button
                                    onClick={() => copyToClipboard(successData.did)}
                                    className="absolute top-2 right-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <FaCopy />
                                </button>
                            </div>
                        </div>

                        {/* Private Key */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                                <FaKey />
                                Your Private Key
                            </label>
                            <div className="relative group">
                                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-mono text-sm text-emerald-300 break-all">
                                    {successData.privateKey}
                                </div>
                                <button
                                    onClick={() => copyToClipboard(successData.privateKey)}
                                    className="absolute top-2 right-2 p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <FaCopy />
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:shadow-emerald-500/50 hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            Go to Login
                            <FaArrowRight className="text-sm" />
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-4">
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
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/50 mb-4">
                        <FaUser className="text-2xl text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Create Identity</h1>
                    <p className="text-slate-400">Join the decentralized finance network</p>
                </div>

                <div className="rounded-3xl bg-theme-subtle backdrop-blur-xl ring-1 ring-theme p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                <FaUser className="inline mr-2" />
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                placeholder="Enter your username"
                                className="w-full px-4 py-3 rounded-xl bg-theme-subtle border border-theme focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-100 placeholder:text-slate-500 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                <FaEnvelope className="inline mr-2" />
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Enter your email"
                                className="w-full px-4 py-3 rounded-xl bg-theme-subtle border border-theme focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-100 placeholder:text-slate-500 transition-all"
                            />
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
                            Create Identity
                            <FaArrowRight className="text-sm" />
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-theme text-center">
                        <p className="text-sm text-slate-400">
                            Already have an identity?{' '}
                            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                                Login
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-slate-500 text-xs mt-6">
                    By registering, you agree to our decentralized terms of service
                </p>
            </motion.div>
        </div>
    );
};

export default Register;
