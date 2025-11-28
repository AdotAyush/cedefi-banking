import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Simulator from './pages/Simulator';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-base-200">
                <div className="navbar bg-base-100 shadow-lg">
                    <div className="flex-1">
                        <Link to="/" className="btn btn-ghost normal-case text-xl">CeDeFi Voting</Link>
                    </div>
                    <div className="flex-none">
                        <ul className="menu menu-horizontal px-1">
                            <li><Link to="/">Dashboard</Link></li>
                            <li><Link to="/transactions">Transactions</Link></li>
                            <li><Link to="/simulator">Simulator</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="p-4">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/transactions" element={<Transactions />} />
                        <Route path="/simulator" element={<Simulator />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
