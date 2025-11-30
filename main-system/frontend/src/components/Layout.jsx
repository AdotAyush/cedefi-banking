import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaChartLine, FaExchangeAlt, FaNetworkWired, FaHistory, FaCog, FaChartPie, FaSignOutAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const SidebarItem = ({ to, icon: Icon, label, active, onClick }) => (
    <Link to={to} onClick={onClick}>
        <motion.div
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${active ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'}`}
        >
            <Icon className="text-lg" />
            <span className="font-medium text-sm">{label}</span>
        </motion.div>
    </Link>
);

const Layout = ({ children }) => {
    const location = useLocation();
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-background font-sans text-foreground">
            {/* Sidebar */}
            <div className="w-64 border-r bg-card flex flex-col p-4 z-20">
                <div className="flex items-center gap-3 px-2 mb-8 mt-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
                        C
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">
                        CeDeFi
                    </h1>
                </div>

                <nav className="space-y-1 flex-1">
                    <SidebarItem to="/" icon={FaChartLine} label="Dashboard" active={location.pathname === '/'} />
                    <SidebarItem to="/analytics" icon={FaChartPie} label="Analytics" active={location.pathname === '/analytics'} />
                    <SidebarItem to="/transactions" icon={FaExchangeAlt} label="Transactions" active={location.pathname === '/transactions'} />
                    <SidebarItem to="/history" icon={FaHistory} label="History" active={location.pathname === '/history'} />
                    <SidebarItem to="/simulator" icon={FaNetworkWired} label="Simulator" active={location.pathname === '/simulator'} />
                    <div className="pt-4 mt-4 border-t">
                        <SidebarItem to="/settings" icon={FaCog} label="Settings" active={location.pathname === '/settings'} />
                    </div>
                </nav>

                <div className="p-4 bg-muted/50 rounded-xl mt-auto border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                            {user?.username?.substring(0, 2) || 'US'}
                        </div>
                        <div className="overflow-hidden">
                            <div className="font-semibold text-sm truncate">{user?.username || 'User'}</div>
                            <div className="text-xs text-muted-foreground truncate">{user?.email || 'user@example.com'}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 p-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <FaSignOutAlt />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-background/50">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {children}
                </motion.div>
            </div>
        </div>
    );
};

export default Layout;
