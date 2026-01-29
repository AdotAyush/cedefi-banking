import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaClock } from 'react-icons/fa';

const OTPInput = ({ length = 6, onComplete, onResend, expiresAt, type = 'email' }) => {
    const [otp, setOtp] = useState(new Array(length).fill(''));
    const [timeLeft, setTimeLeft] = useState(0);
    const inputRefs = useRef([]);

    // Calculate time remaining
    useEffect(() => {
        if (!expiresAt) return;

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const expiry = new Date(expiresAt).getTime();
            const diff = Math.max(0, Math.floor((expiry - now) / 1000));
            setTimeLeft(diff);
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return;

        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        // Auto-focus next input
        if (element.value && index < length - 1) {
            inputRefs.current[index + 1].focus();
        }

        // Call onComplete when all digits are entered
        if (newOtp.every(digit => digit !== '') && onComplete) {
            onComplete(newOtp.join(''));
        }
    };

    const handleKeyDown = (e, index) => {
        // Handle backspace
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                inputRefs.current[index - 1].focus();
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, length);

        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = [...otp];
        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i];
        }
        setOtp(newOtp);

        // Focus the next empty input or the last input
        const nextIndex = Math.min(pastedData.length, length - 1);
        inputRefs.current[nextIndex].focus();

        // Call onComplete if all digits are filled
        if (newOtp.every(digit => digit !== '') && onComplete) {
            onComplete(newOtp.join(''));
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const isExpired = timeLeft === 0;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                    {type === 'email' ? 'Email' : 'Phone'} Verification Code
                </label>
                {expiresAt && (
                    <div className={`flex items-center gap-1 text-sm ${isExpired ? 'text-red-400' : 'text-slate-400'}`}>
                        <FaClock className="text-xs" />
                        <span>{isExpired ? 'Expired' : formatTime(timeLeft)}</span>
                    </div>
                )}
            </div>

            <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                    <motion.input
                        key={index}
                        ref={(ref) => (inputRefs.current[index] = ref)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(e.target, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onPaste={handlePaste}
                        disabled={isExpired}
                        className={`w-12 h-14 text-center text-2xl font-bold rounded-xl bg-theme-subtle border-2 
                            ${digit ? 'border-indigo-500 text-white' : 'border-theme text-slate-400'}
                            ${isExpired ? 'opacity-50 cursor-not-allowed' : 'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}
                            outline-none transition-all`}
                        whileFocus={{ scale: 1.05 }}
                    />
                ))}
            </div>

            {onResend && (
                <button
                    type="button"
                    onClick={() => {
                        setOtp(new Array(length).fill(''));
                        onResend();
                    }}
                    disabled={!isExpired && timeLeft > 540} // Allow resend after 1 minute (600 - 540 = 60s)
                    className="text-sm text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                >
                    {isExpired ? 'Resend Code' : timeLeft <= 540 ? 'Resend Code' : `Wait ${formatTime(timeLeft - 540)} to resend`}
                </button>
            )}
        </div>
    );
};

export default OTPInput;
