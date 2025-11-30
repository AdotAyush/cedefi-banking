import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Simulator from './pages/Simulator';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import History from './pages/History';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
    console.log("App component rendering");
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Layout>
                                <Dashboard />
                            </Layout>
                        </ProtectedRoute>
                    } />
                    <Route path="/analytics" element={
                        <ProtectedRoute>
                            <Layout>
                                <Analytics />
                            </Layout>
                        </ProtectedRoute>
                    } />
                    <Route path="/transactions" element={
                        <ProtectedRoute>
                            <Layout>
                                <Transactions />
                            </Layout>
                        </ProtectedRoute>
                    } />
                    <Route path="/history" element={
                        <ProtectedRoute>
                            <Layout>
                                <History />
                            </Layout>
                        </ProtectedRoute>
                    } />
                    <Route path="/simulator" element={
                        <ProtectedRoute>
                            <Layout>
                                <Simulator />
                            </Layout>
                        </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                        <ProtectedRoute>
                            <Layout>
                                <Settings />
                            </Layout>
                        </ProtectedRoute>
                    } />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
