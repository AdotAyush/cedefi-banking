import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaTrashAlt, FaSignInAlt } from 'react-icons/fa';

const ExistingUserDialog = ({ isOpen, onClose, onChoice, emailExists, phoneExists }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Dialog */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-md rounded-2xl bg-theme-subtle backdrop-blur-xl ring-1 ring-theme shadow-2xl p-6 z-10"
                >
                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <FaExclamationTriangle className="text-3xl text-amber-400" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">Account Already Exists</h2>
                        <p className="text-slate-400">
                            {emailExists && phoneExists
                                ? 'Both your email and phone number are already registered.'
                                : emailExists
                                    ? 'Your email address is already registered.'
                                    : 'Your phone number is already registered.'}
                        </p>
                    </div>

                    {/* Warning about data deletion */}
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <p className="text-sm text-red-300 leading-relaxed">
                            <strong>Warning:</strong> Creating a new account will permanently delete all data
                            associated with your existing account, including your DID credentials and banking information.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={() => onChoice('use_existing')}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:shadow-indigo-500/50 hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            <FaSignInAlt />
                            Use Existing Account
                        </button>

                        <button
                            onClick={() => onChoice('create_new')}
                            className="w-full py-3 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 hover:border-red-500/60 text-red-300 font-semibold transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            <FaTrashAlt />
                            Delete Old & Create New
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ExistingUserDialog;
