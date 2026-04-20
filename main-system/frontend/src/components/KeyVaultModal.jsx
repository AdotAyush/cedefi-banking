import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaShieldAlt, FaLock, FaDownload, FaEye, FaEyeSlash,
    FaCheckCircle, FaTimes, FaKey
} from 'react-icons/fa';

/**
 * Derive a 256-bit AES-GCM key from a password using PBKDF2.
 */
async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 310_000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt the private key and return a downloadable JSON payload.
 * Schema: { version, did, salt (hex), iv (hex), data (hex) }
 */
async function encryptPrivateKey(privateKey, password, did) {
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const enc = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        enc.encode(privateKey)
    );
    const toHex = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    return {
        version: 1,
        did: did ?? '',
        salt: toHex(salt),
        iv: toHex(iv),
        data: toHex(encrypted)
    };
}

/**
 * Decrypt a vault JSON payload back to the plaintext private key.
 */
export async function decryptPrivateKey(vault, password) {
    if (vault.version !== 1) throw new Error('Unsupported vault version');
    const fromHex = (hex) => new Uint8Array(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
    const salt = fromHex(vault.salt);
    const iv = fromHex(vault.iv);
    const data = fromHex(vault.data);
    const key = await deriveKey(password, salt);
    const dec = new TextDecoder();
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return dec.decode(decrypted);
}

/**
 * KeyVaultModal
 * Shown on the registration success page. Lets the user set a password,
 * encrypts the private key, and downloads a .cedefi-key file for local storage.
 */
const KeyVaultModal = ({ isOpen, onClose, privateKey, did }) => {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [step, setStep] = useState('form'); // 'form' | 'success'
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const reset = () => {
        setPassword('');
        setConfirm('');
        setError('');
        setStep('form');
        setLoading(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleEncrypt = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const vault = await encryptPrivateKey(privateKey, password, did);
            const blob = new Blob([JSON.stringify(vault, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            // Use a safe filename derived from DID (last 8 chars) 
            const suffix = did ? did.slice(-8).replace(/[^a-z0-9]/gi, '') : 'key';
            a.download = `cedefi-key-${suffix}.cedefi-key`;
            a.click();
            URL.revokeObjectURL(url);
            setStep('success');
        } catch (err) {
            setError('Encryption failed: ' + err.message);
        }
        setLoading(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-emerald-500/20 p-6 shadow-2xl"
                    >
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                            <FaTimes />
                        </button>

                        {step === 'form' ? (
                            <>
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                        <FaShieldAlt className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-white font-bold text-lg">Encrypt & Save Key</h2>
                                        <p className="text-slate-400 text-xs">
                                            AES-256-GCM + PBKDF2 — encrypted locally in your browser
                                        </p>
                                    </div>
                                </div>

                                {/* Info box */}
                                <div className="mb-5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs space-y-1">
                                    <p className="font-semibold">How it works:</p>
                                    <p>Your private key is encrypted with your password using AES-256-GCM.
                                        The encrypted file is saved on your device — your password never leaves your browser.</p>
                                    <p className="text-blue-400/70 mt-1">
                                        ⚠️ If you forget this password, the backup cannot be decrypted.
                                    </p>
                                </div>

                                {/* Key preview */}
                                <div className="mb-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FaKey className="text-emerald-400/70 text-xs" />
                                        <span className="text-slate-400 text-xs">Private key to encrypt</span>
                                    </div>
                                    <span className="font-mono text-emerald-300/70 text-xs break-all">
                                        {privateKey ? `${privateKey.slice(0, 10)}…${privateKey.slice(-6)}` : '—'}
                                    </span>
                                </div>

                                <form onSubmit={handleEncrypt} className="space-y-4">
                                    {/* Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">
                                            <FaLock className="inline mr-1 text-xs" />
                                            Encryption Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPwd ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                minLength={8}
                                                placeholder="Choose a strong password (min 8 chars)"
                                                className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-100 placeholder:text-slate-500 text-sm transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPwd(v => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                                            >
                                                {showPwd ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                        <PasswordStrength password={password} />
                                    </div>

                                    {/* Confirm */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">
                                            Confirm Password
                                        </label>
                                        <input
                                            type={showPwd ? 'text' : 'password'}
                                            value={confirm}
                                            onChange={(e) => setConfirm(e.target.value)}
                                            required
                                            placeholder="Re-enter password"
                                            className={`w-full px-4 py-3 rounded-xl bg-slate-800 border focus:ring-2 outline-none text-slate-100 placeholder:text-slate-500 text-sm transition-all ${
                                                confirm && confirm !== password
                                                    ? 'border-red-500/60 focus:ring-red-500/20'
                                                    : confirm && confirm === password
                                                    ? 'border-green-500/60 focus:ring-green-500/20'
                                                    : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20'
                                            }`}
                                        />
                                    </div>

                                    {error && (
                                        <p className="text-red-400 text-xs">{error}</p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                </svg>
                                                Encrypting…
                                            </span>
                                        ) : (
                                            <>
                                                <FaDownload />
                                                Encrypt & Download Backup
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        ) : (
                            /* Success state */
                            <div className="text-center py-4">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                                    <FaCheckCircle className="text-emerald-400 text-3xl" />
                                </div>
                                <h2 className="text-white font-bold text-xl mb-2">Backup Downloaded!</h2>
                                <p className="text-slate-400 text-sm mb-1">
                                    Your encrypted key file has been saved to your device.
                                </p>
                                <p className="text-slate-500 text-xs mb-6">
                                    Keep this file safe. You can use it on the login page with your password to recover access.
                                </p>
                                <button
                                    onClick={handleClose}
                                    className="w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

/** Visual password strength meter */
const PasswordStrength = ({ password }) => {
    if (!password) return null;
    const score = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
        password.length >= 12,
    ].filter(Boolean).length;

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-green-500'];

    return (
        <div className="mt-1.5">
            <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map(i => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${i <= score ? colors[score] : 'bg-slate-700'}`}
                    />
                ))}
            </div>
            <p className={`text-xs ${score >= 4 ? 'text-emerald-400' : score >= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                {labels[score] || ''}
            </p>
        </div>
    );
};

export default KeyVaultModal;
