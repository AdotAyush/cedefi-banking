import { useState, useContext } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AuthContext from '../context/AuthContext';

const Layout = ({ children }) => {
    const [theme, setTheme] = useState('corporate');
    const { user, logout } = useContext(AuthContext);

    const isLight = theme === 'corporate';

    return (
        <div className={`min-h-screen w-full overflow-x-hidden relative ${isLight ? 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900' : 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-slate-100'}`} data-theme={theme}>
            {/* Animated background orbs for dark mode */}
            {!isLight && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>
            )}

            <div className="flex h-screen overflow-hidden relative z-10">
                <Sidebar theme={theme} setTheme={setTheme} user={user} logout={logout} />
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
                        <Topbar user={user} />
                        <div className="mt-6">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Layout;
