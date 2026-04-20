import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFlask, FaSyncAlt, FaEnvelope, FaPhone, FaCopy, FaCheck } from 'react-icons/fa';
import axios from 'axios';

/**
 * Development-only OTP Viewer
 * Fetches and displays pending OTP codes from the backend.
 * Automatically hidden in production (backend returns 404 for the route).
 */
const DevOTPViewer = ({ email, phone, visible }) => {
    const [otpData, setOtpData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchOTPs = useCallback(async () => {
        if (!email && !phone) return;
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (email) params.email = email;
            if (phone) params.phone = phone;
            const res = await axios.get('http://localhost:5000/api/auth/dev/otp', { params });
            setOtpData(res.data);
        } catch (e) {
            if (e.response?.status === 404) {
                // Production mode – silently hide
                setOtpData(null);
            } else {
                setError('Could not fetch OTPs');
            }
        }
        setLoading(false);
    }, [email, phone]);

    useEffect(() => {
        if (visible) fetchOTPs();
    }, [visible, fetchOTPs]);

    if (!visible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <FaFlask className="text-amber-400 text-sm" />
                        <span className="text-amber-400 font-semibold text-sm">Dev OTP Viewer</span>
                        <span className="text-[10px] text-amber-400/70 bg-amber-500/20 px-2 py-0.5 rounded-full">
                            Development Only
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={fetchOTPs}
                        title="Refresh OTPs"
                        className="text-amber-400/70 hover:text-amber-300 transition-colors"
                    >
                        <FaSyncAlt className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {error && (
                    <p className="text-red-400/80 text-xs mb-2">{error}</p>
                )}

                {otpData ? (
                    <div className="space-y-2">
                        {otpData.emailOTP && (
                            <OTPRow
                                icon={<FaEnvelope />}
                                label="Email OTP"
                                code={otpData.emailOTP.code}
                                expiresAt={otpData.emailOTP.expiresAt}
                            />
                        )}
                        {otpData.phoneOTP && (
                            <OTPRow
                                icon={<FaPhone />}
                                label="Phone OTP"
                                code={otpData.phoneOTP.code}
                                expiresAt={otpData.phoneOTP.expiresAt}
                            />
                        )}
                        {!otpData.emailOTP && !otpData.phoneOTP && (
                            <p className="text-amber-400/60 text-xs">
                                No pending OTPs found. Click refresh after requesting.
                            </p>
                        )}
                    </div>
                ) : (
                    !error && (
                        <p className="text-amber-400/60 text-xs animate-pulse">
                            {loading ? 'Fetching OTP codes…' : 'Click refresh to load OTPs.'}
                        </p>
                    )
                )}
            </motion.div>
        </AnimatePresence>
    );
};

const OTPRow = ({ icon, label, code, expiresAt }) => {
    const [copied, setCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calc = () => {
            const diff = new Date(expiresAt) - new Date();
            if (diff <= 0) { setTimeLeft('Expired'); return; }
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
        };
        calc();
        const id = setInterval(calc, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const expired = timeLeft === 'Expired';

    return (
        <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${expired ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
            <div className="flex items-center gap-2">
                <span className="text-amber-400/60 text-xs">{icon}</span>
                <span className="text-amber-300/70 text-xs">{label}:</span>
                <span className={`font-mono font-bold text-sm tracking-[0.25em] ${expired ? 'text-red-400/60 line-through' : 'text-amber-200'}`}>
                    {code}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-xs ${expired ? 'text-red-400/60' : 'text-amber-400/50'}`}>
                    {timeLeft}
                </span>
                {!expired && (
                    <button
                        type="button"
                        onClick={handleCopy}
                        title="Copy code"
                        className="text-amber-400/60 hover:text-amber-300 transition-colors text-xs"
                    >
                        {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                    </button>
                )}
            </div>
        </div>
    );
};

export default DevOTPViewer;
