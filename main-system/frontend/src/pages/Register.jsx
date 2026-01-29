import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaCheckCircle, FaKey, FaIdCard, FaCopy, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import OTPInput from '../components/OTPInput';
import ExistingUserDialog from '../components/ExistingUserDialog';

const STEPS = {
    EMAIL_PHONE: 1,
    OTP_VERIFICATION: 2,
    SUCCESS: 3
};

const Register = () => {
    // Step management
    const [currentStep, setCurrentStep] = useState(STEPS.EMAIL_PHONE);

    // Form inputs
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [emailOTP, setEmailOTP] = useState('');
    const [phoneOTP, setPhoneOTP] = useState('');

    // State management
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [otpExpiresAt, setOtpExpiresAt] = useState(null);

    // Existing user dialog
    const [showExistingDialog, setShowExistingDialog] = useState(false);
    const [existingUserData, setExistingUserData] = useState(null);

    const { initiateRegistration, handleExistingUser, verifyAndCompleteRegistration } = useContext(AuthContext);
    const navigate = useNavigate();

    // Step 1: Submit email and phone
    const handleInitialSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await initiateRegistration(email, phoneNumber);

        if (result.success) {
            if (result.existingUser) {
                // Show existing user dialog
                setExistingUserData({
                    emailExists: result.emailExists,
                    phoneExists: result.phoneExists
                });
                setShowExistingDialog(true);
            } else {
                // Proceed to OTP verification
                setOtpExpiresAt(result.expiresAt);
                setCurrentStep(STEPS.OTP_VERIFICATION);
            }
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    // Handle existing user choice
    const handleUserChoice = async (choice) => {
        setShowExistingDialog(false);

        if (choice === 'use_existing') {
            navigate('/login');
            return;
        }

        // choice === 'create_new'
        setError('');
        setLoading(true);

        const result = await handleExistingUser(choice, email, phoneNumber);

        if (result.success) {
            if (result.redirectToLogin) {
                navigate('/login');
            } else {
                setOtpExpiresAt(result.expiresAt);
                setCurrentStep(STEPS.OTP_VERIFICATION);
            }
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    // Resend OTP
    const handleResendOTP = async () => {
        setError('');
        setLoading(true);

        const result = await initiateRegistration(email, phoneNumber);

        if (result.success && !result.existingUser) {
            setOtpExpiresAt(result.expiresAt);
            setEmailOTP('');
            setPhoneOTP('');
        } else {
            setError(result.message || 'Failed to resend OTP');
        }

        setLoading(false);
    };

    // Step 2: Verify OTPs and complete registration
    const handleOTPSubmit = async (e) => {
        e.preventDefault();

        if (!emailOTP || emailOTP.length !== 6) {
            setError('Please enter the 6-digit email verification code');
            return;
        }

        if (!phoneOTP || phoneOTP.length !== 6) {
            setError('Please enter the 6-digit phone verification code');
            return;
        }

        setError('');
        setLoading(true);

        const result = await verifyAndCompleteRegistration(email, phoneNumber, emailOTP, phoneOTP);

        if (result.success) {
            setSuccessData(result.user);
            setCurrentStep(STEPS.SUCCESS);
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    // Success screen
    if (currentStep === STEPS.SUCCESS && successData) {
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

            {/* Existing User Dialog */}
            <ExistingUserDialog
                isOpen={showExistingDialog}
                onClose={() => setShowExistingDialog(false)}
                onChoice={handleUserChoice}
                emailExists={existingUserData?.emailExists}
                phoneExists={existingUserData?.phoneExists}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/50 mb-4">
                        <FaUser className="text-2xl text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Create Identity</h1>
                    <p className="text-slate-400">Join the decentralized finance network</p>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    {[1, 2, 3].map((step) => (
                        <div
                            key={step}
                            className={`h-1.5 rounded-full transition-all duration-300 ${step === currentStep
                                ? 'w-8 bg-indigo-500'
                                : step < currentStep
                                    ? 'w-6 bg-indigo-500/50'
                                    : 'w-6 bg-slate-700'
                                }`}
                        />
                    ))}
                </div>

                <div className="rounded-3xl bg-theme-subtle backdrop-blur-xl ring-1 ring-theme p-8 shadow-2xl">
                    {/* Step 1: Email & Phone */}
                    {currentStep === STEPS.EMAIL_PHONE && (
                        <form onSubmit={handleInitialSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <FaEnvelope className="inline mr-2" />
                                    Email Address
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

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <FaPhone className="inline mr-2" />
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    required
                                    placeholder="+919876543210 or 9876543210"
                                    pattern="^(\+91|91)?[6-9]\d{9}$"
                                    title="Enter Indian mobile number (10 digits starting with 6-9)"
                                    className="w-full px-4 py-3 rounded-xl bg-theme-subtle border border-theme focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-100 placeholder:text-slate-500 transition-all"
                                />
                                <p className="text-xs text-slate-500 mt-1">Format: +91XXXXXXXXXX (10 digits starting with 6-9)</p>
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
                                disabled={loading}
                                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:shadow-indigo-500/50 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : 'Continue'}
                                <FaArrowRight className="text-sm" />
                            </button>
                        </form>
                    )}

                    {/* Step 2: OTP Verification */}
                    {currentStep === STEPS.OTP_VERIFICATION && (
                        <form onSubmit={handleOTPSubmit} className="space-y-6">
                            <div className="text-center mb-4">
                                <p className="text-slate-300 text-sm">
                                    We've sent verification codes to:
                                </p>
                                <p className="text-indigo-400 font-medium">{email}</p>
                                <p className="text-indigo-400 font-medium">{phoneNumber}</p>
                            </div>

                            <OTPInput
                                type="email"
                                onComplete={setEmailOTP}
                                onResend={handleResendOTP}
                                expiresAt={otpExpiresAt}
                            />

                            <OTPInput
                                type="phone"
                                onComplete={setPhoneOTP}
                                onResend={handleResendOTP}
                                expiresAt={otpExpiresAt}
                            />

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(STEPS.EMAIL_PHONE)}
                                    className="px-4 py-3 rounded-xl border border-theme hover:bg-white/5 text-slate-300 transition-all flex items-center gap-2"
                                >
                                    <FaArrowLeft className="text-sm" />
                                    Back
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading || !emailOTP || !phoneOTP}
                                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:shadow-indigo-500/50 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Verifying...' : 'Verify & Create Identity'}
                                    <FaArrowRight className="text-sm" />
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Footer */}
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
