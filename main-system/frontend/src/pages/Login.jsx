import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FaKey, FaLock, FaArrowRight } from 'react-icons/fa';

const Login = () => {
    const [privateKey, setPrivateKey] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

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
                                    type="password"
                                    value={privateKey}
                                    onChange={(e) => setPrivateKey(e.target.value)}
                                    required
                                    placeholder="0x..."
                                    className="w-full px-4 py-3 rounded-xl bg-theme-subtle border border-theme focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-100 placeholder:text-slate-500 font-mono text-sm transition-all"
                                />
                            </div>
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
