import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FaChartLine, FaExchangeAlt, FaNetworkWired, FaHistory, FaCog, FaChartPie, FaSignOutAlt } from 'react-icons/fa'
import { motion } from 'framer-motion'
import { useContext } from 'react'
import AuthContext from '../context/AuthContext.jsx'

const SidebarItem = ({ to, icon: Icon, label, active, onClick }) => (
  <Link to={to} onClick={onClick}>
    <motion.div
      whileHover={{ x: 6 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
        active
          ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-white ring-1 ring-indigo-500/30 shadow-md shadow-indigo-500/10'
          : 'text-slate-300 hover:text-white hover:bg-white/5'
      }`}
    >
      <div className="h-9 w-9 grid place-items-center rounded-lg bg-white/5 ring-1 ring-white/10">
        <Icon className="text-lg" />
      </div>
      <span className="font-medium text-sm">{label}</span>
    </motion.div>
  </Link>
)

const Layout = ({ children }) => {
  const location = useLocation()
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 p-4 md:p-6 border-r border-white/10 glass flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 grid place-items-center text-white font-bold shadow-lg shadow-indigo-500/20">
            C
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">CeDeFi</h1>
            <p className="text-xs text-slate-400">Secure. Hybrid. Fast.</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          <SidebarItem to="/" icon={FaChartLine} label="Dashboard" active={location.pathname === '/'} />
          <SidebarItem to="/analytics" icon={FaChartPie} label="Analytics" active={location.pathname === '/analytics'} />
          <SidebarItem to="/transactions" icon={FaExchangeAlt} label="Transactions" active={location.pathname === '/transactions'} />
          <SidebarItem to="/history" icon={FaHistory} label="History" active={location.pathname === '/history'} />
          <SidebarItem to="/simulator" icon={FaNetworkWired} label="Simulator" active={location.pathname === '/simulator'} />
          <div className="pt-3 mt-3 border-t border-white/10">
            <SidebarItem to="/settings" icon={FaCog} label="Settings" active={location.pathname === '/settings'} />
          </div>
        </nav>

        <div className="mt-auto rounded-xl p-4 glass">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 grid place-items-center font-bold">
              {user?.username?.substring(0, 2) || 'US'}
            </div>
            <div className="overflow-hidden">
              <div className="font-semibold text-sm truncate">{user?.username || 'User'}</div>
              <div className="text-xs text-slate-400 truncate">{user?.email || 'user@example.com'}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {children}
        </motion.div>
      </div>
    </div>
  )
}

export default Layout
