import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
        setInitialLoad(false);
    }, []);

    /**
     * Step 1: Initiate registration
     * Check for existing users and send OTPs
     */
    const initiateRegistration = async (email, phoneNumber) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register/initiate', {
                email,
                phoneNumber
            });

            if (res.data.existingUser) {
                return {
                    success: true,
                    existingUser: true,
                    emailExists: res.data.emailExists,
                    phoneExists: res.data.phoneExists,
                    message: res.data.message
                };
            }

            return {
                success: true,
                existingUser: false,
                expiresAt: res.data.expiresAt,
                message: res.data.message
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to initiate registration'
            };
        }
    };

    /**
     * Step 2a: Handle existing user choice
     */
    const handleExistingUser = async (choice, email, phoneNumber) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register/handle-existing', {
                email,
                phoneNumber,
                choice
            });

            return {
                success: true,
                redirectToLogin: res.data.redirectToLogin,
                expiresAt: res.data.expiresAt,
                message: res.data.message
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to handle user choice'
            };
        }
    };

    /**
     * Step 2b/3: Verify OTPs and complete registration
     */
    const verifyAndCompleteRegistration = async (email, phoneNumber, emailOTP, phoneOTP) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register/verify-complete', {
                email,
                phoneNumber,
                emailOTP,
                phoneOTP
            });

            return {
                success: true,
                user: res.data
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Verification failed'
            };
        }
    };

    /**
     * Legacy register function - deprecated
     */
    const register = async (username, email) => {
        return {
            success: false,
            message: 'This registration method is deprecated. Please use the new flow.'
        };
    };

    /**
     * Login function - unchanged
     */
    const login = async (privateKey) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { privateKey });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data));
            setUser(res.data);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    /**
     * Logout function - unchanged
     */
    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            loading,
            // New registration methods
            initiateRegistration,
            handleExistingUser,
            verifyAndCompleteRegistration,
            // Legacy method (deprecated)
            register
        }}>
            {!initialLoad && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
