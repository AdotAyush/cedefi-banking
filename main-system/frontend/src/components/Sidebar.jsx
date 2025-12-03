import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaBolt, FaExchangeAlt, FaChartPie, FaCubes, FaCog, FaChevronRight, FaMoon, FaSun, FaSignOutAlt, FaUser } from 'react-icons/fa';

const navItems = [
    { to: '/', label: 'Overview', icon: FaBolt },
    { to: '/transactions', label: 'Transactions', icon: FaExchangeAlt },
    { to: '/analytics', label: 'Analytics', icon: FaChartPie },
    { to: '/history', label: 'History', icon: FaExchangeAlt }, // Added History
    { to: '/simulator', label: 'Simulator', icon: FaCubes },
    { to: '/settings', label: 'Settings', icon: FaCog },
];

function Sidebar({ theme, setTheme, user, logout }) {
    const [open, setOpen] = useState(true);
    const toggleTheme = () => setTheme((t) => (t === 'corporate' ? 'business' : 'corporate'));

    const isLight = theme === 'corporate';

    return (
        <aside className={`sticky top-0 h-screen p-4 md:p-6 transition-all duration-300 flex flex-col ${open ? 'w-[260px] lg:w-[300px]' : 'w-[100px]'} ${isLight ? 'bg-white border-r border-gray-200' : 'backdrop-blur-xl bg-white/5 border-r border-white/10'}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 grid place-items-center shadow-lg shadow-indigo-500/20">
                        <FaBolt className="text-white" />
                    </div>
                    {open && (
                        <div>
                            <div className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>CeDeFi Neo</div>
                            <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Hyper Interactive</div>
                        </div>
                    )}
                </div>
                <button onClick={() => setOpen(!open)} className={`btn btn-circle btn-ghost btn-xs ${isLight ? 'hover:bg-gray-100' : ''}`}>
                    <FaChevronRight className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
            </div>

            <nav className="mt-6 space-y-1 flex-1">
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                            `group flex items-center gap-3 rounded-xl px-3 py-2 transition-all ${isActive
                                ? isLight
                                    ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-600 ring-1 ring-indigo-200 shadow-sm'
                                    : 'bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-white ring-1 ring-indigo-500/30 shadow-md shadow-indigo-500/10'
                                : isLight
                                    ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                            }`
                        }
                    >
                        <div className={`h-9 w-9 grid place-items-center rounded-lg ${isLight ? 'bg-gray-50 ring-1 ring-gray-200' : 'bg-white/5 ring-1 ring-white/10'}`}>
                            <Icon className="text-lg" />
                        </div>
                        {open && <span className="font-medium">{label}</span>}
                    </NavLink>
                ))}
            </nav>

            <div className="space-y-3 mt-auto">
                {/* User Profile */}
                {user && (
                    <div className={`rounded-xl p-3 ${isLight ? 'bg-gray-50 ring-1 ring-gray-200' : 'bg-white/5 ring-1 ring-white/10'}`}>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 grid place-items-center font-bold text-white">
                                {user.username?.charAt(0).toUpperCase() || <FaUser />}
                            </div>
                            {open && (
                                <div className="flex-1 overflow-hidden">
                                    <div className={`font-semibold truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{user.username}</div>
                                    <div className={`text-xs truncate ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>{user.role}</div>
                                </div>
                            )}
                        </div>
                        {open && logout && (
                            <button onClick={logout} className="btn btn-sm btn-outline btn-error w-full mt-3 gap-2">
                                <FaSignOutAlt /> Logout
                            </button>
                        )}
                    </div>
                )}

                {/* Theme Toggle */}
                <div className={`rounded-xl p-3 ${isLight ? 'bg-gray-50 ring-1 ring-gray-200' : 'bg-white/5 ring-1 ring-white/10'}`}>
                    <div className="flex items-center justify-between">
                        {open && (
                            <div>
                                <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Theme</div>
                                <div className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{theme === 'corporate' ? 'Light' : 'Dark'}</div>
                            </div>
                        )}
                        <button onClick={toggleTheme} className={`btn btn-sm btn-outline ${isLight ? 'border-gray-300 hover:bg-gray-100' : 'border-white/20'}`}>
                            {theme === 'corporate' ? <FaMoon /> : <FaSun />}
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
