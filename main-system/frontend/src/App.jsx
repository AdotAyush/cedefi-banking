import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Simulator from './pages/Simulator';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import History from './pages/History';

function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/simulator" element={<Simulator />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
