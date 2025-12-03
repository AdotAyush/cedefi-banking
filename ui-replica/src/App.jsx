import { useMemo, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaBolt, FaExchangeAlt, FaChartPie, FaCubes, FaCog, FaBell, FaMoon, FaSun, FaSearch, FaPlus, FaChevronRight } from 'react-icons/fa'
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts'

// Redesigned, self-contained UI shell with new layout and pages
// This file intentionally avoids importing previous project pages/components
// to deliver a completely fresh visual experience.

const navItems = [
  { to: '/', label: 'Overview', icon: FaBolt },
  { to: '/transactions', label: 'Transactions', icon: FaExchangeAlt },
  { to: '/analytics', label: 'Analytics', icon: FaChartPie },
  { to: '/simulator', label: 'Simulator', icon: FaCubes },
  { to: '/settings', label: 'Settings', icon: FaCog },
]

function App() {
  const [theme, setTheme] = useState('corporate')

  return (
    <Router>
      <div className="min-h-screen w-full bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-slate-100" data-theme={theme}>
        <div className="grid grid-cols-[260px_1fr] lg:grid-cols-[300px_1fr]">
          <Sidebar theme={theme} setTheme={setTheme} />
          <Main />
        </div>
      </div>
    </Router>
  )
}

function Sidebar({ theme, setTheme }) {
  const [open, setOpen] = useState(true)
  const toggleTheme = () => setTheme((t) => (t === 'corporate' ? 'business' : 'corporate'))

  return (
    <aside className={`sticky top-0 h-screen p-4 md:p-6 transition-all duration-300 ${open ? 'w-[260px] lg:w-[300px]' : 'w-[100px]'} backdrop-blur-xl bg-white/5 border-r border-white/10`}>      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 grid place-items-center shadow-lg shadow-indigo-500/20">
            <FaBolt />
          </div>
          {open && (
            <div>
              <div className="text-lg font-bold">CeDeFi Neo</div>
              <div className="text-xs text-slate-400">Hyper Interactive</div>
            </div>
          )}
        </div>
        <button onClick={() => setOpen(!open)} className="btn btn-circle btn-ghost btn-xs">
          <FaChevronRight className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
        <FaSearch className="text-slate-400" />
        {open && <input className="bg-transparent outline-none text-sm w-full placeholder:text-slate-400" placeholder="Search…" />}
      </div>

      <nav className="mt-6 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2 transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-white ring-1 ring-indigo-500/30 shadow-md shadow-indigo-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <div className="h-9 w-9 grid place-items-center rounded-lg bg-white/5 ring-1 ring-white/10">
              <Icon className="text-lg" />
            </div>
            {open && <span className="font-medium">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-8">
        <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Theme</div>
              <div className="font-semibold">{theme === 'corporate' ? 'Light' : 'Dark'}</div>
            </div>
            <button onClick={toggleTheme} className="btn btn-sm btn-outline border-white/20">
              {theme === 'corporate' ? <FaMoon /> : <FaSun />}
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

function Main() {
  return (
    <div className="p-4 md:p-8">
      <Topbar />
      <div className="mt-6">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  )
}

function Topbar() {
  return (
    <div className="flex items-center gap-3">
      <div className="text-2xl font-extrabold tracking-tight">Dashboard</div>
      <span className="badge badge-primary badge-outline">Live</span>
      <div className="ml-auto flex items-center gap-2">
        <button className="btn btn-sm btn-primary gap-2">
          <FaPlus /> New Transfer
        </button>
        <button className="btn btn-sm btn-ghost">
          <FaBell />
        </button>
        <div className="avatar">
          <div className="w-9 rounded-xl ring ring-offset-2 ring-indigo-500/30">
            <img src="https://i.pravatar.cc/100?img=5" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Overview Page
function Overview() {
  const kpis = [
    { label: 'Total Volume', value: '$148,290', delta: '+12.4%', color: 'from-emerald-500 to-teal-500' },
    { label: 'Active Nodes', value: '32', delta: '+3', color: 'from-indigo-500 to-violet-500' },
    { label: 'Success Rate', value: '96.2%', delta: '+1.2%', color: 'from-sky-500 to-cyan-500' },
  ]

  const areaData = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({ name: `M${i + 1}`, volume: 400 + Math.round(Math.random() * 600) })),
    []
  )

  const barData = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => ({ name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i], txs: 10 + Math.round(Math.random() * 40) })),
    []
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-2xl p-5 bg-gradient-to-tr ${k.color} text-white shadow-lg shadow-black/20`}
          >
            <div className="text-sm/5 opacity-90">{k.label}</div>
            <div className="mt-2 text-3xl font-extrabold">{k.value}</div>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-white"></span>
              {k.delta} vs last period
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
          <div className="flex items-center justify-between p-2">
            <div>
              <div className="text-sm text-slate-300">Monthly Volume</div>
              <div className="text-xl font-bold">$84,120</div>
            </div>
            <div className="join">
              <button className="btn btn-xs join-item btn-ghost">1M</button>
              <button className="btn btn-xs join-item btn-ghost">3M</button>
              <button className="btn btn-xs join-item btn-primary">1Y</button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.1} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: 'rgba(2,6,23,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                <Area type="monotone" dataKey="volume" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#grad1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
          <div className="text-sm text-slate-300">Weekly Transactions</div>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.1} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: 'rgba(2,6,23,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                <Bar dataKey="txs" radius={[6, 6, 0, 0]} fill="#22d3ee" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Recent Activity</div>
            <button className="btn btn-xs btn-ghost">View all</button>
          </div>
          <div className="mt-2 divide-y divide-white/5">
            {[...Array(6)].map((_, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 py-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-500 grid place-items-center">💸</div>
                <div className="flex-1">
                  <div className="font-medium">TX-{1023 + i} sent</div>
                  <div className="text-xs text-slate-400">to did:cedefi:0x...{(90 + i).toString(16)}</div>
                </div>
                <div className="text-emerald-400 font-semibold">+$ {(20 + i * 3).toFixed(2)}</div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
          <div className="text-lg font-semibold">Quick Actions</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[
              { label: 'New Transfer', color: 'from-emerald-500 to-green-500' },
              { label: 'Register Node', color: 'from-indigo-500 to-violet-500' },
              { label: 'Import Key', color: 'from-fuchsia-500 to-pink-500' },
              { label: 'Claim Funds', color: 'from-amber-500 to-orange-500' },
            ].map((a) => (
              <button key={a.label} className={`h-24 rounded-xl text-sm font-semibold text-white bg-gradient-to-tr ${a.color} hover:brightness-110 transition-all shadow-lg shadow-black/20`}>{a.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Transactions Page
function Transactions() {
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const data = useMemo(() =>
    Array.from({ length: 12 }).map((_, i) => ({
      id: `TX-${1000 + i}`,
      sender: `did:cedefi:0x${(Math.random() * 1e16).toString(16).slice(0, 8)}`,
      recipient: `did:cedefi:0x${(Math.random() * 1e16).toString(16).slice(0, 8)}`,
      amount: (50 + Math.random() * 500).toFixed(2),
      status: ['APPROVED', 'PENDING', 'REJECTED'][Math.floor(Math.random() * 3)],
    })),
  [])

  const filtered = data.filter((d) =>
    (filter === 'ALL' || d.status === filter) &&
    (d.id.toLowerCase().includes(search.toLowerCase()) || d.sender.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="text-2xl font-bold">Transactions</div>
        <div className="md:ml-auto flex items-center gap-2">
          <div className="join bg-white/5 ring-1 ring-white/10 rounded-xl">
            {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map((s) => (
              <button key={s} onClick={() => setFilter(s)} className={`btn join-item btn-xs ${filter === s ? 'btn-primary' : 'btn-ghost'}`}>{s}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
            <FaSearch className="text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent outline-none text-sm w-48" placeholder="Search…" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white/5 ring-1 ring-white/10">
        <table className="table table-zebra-zebra">
          <thead>
            <tr className="text-slate-300">
              <th>ID</th>
              <th>Sender</th>
              <th>Recipient</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={row.id} className="hover:bg-white/5">
                <td className="font-mono text-sm">{row.id}</td>
                <td className="font-mono text-xs text-slate-300">{row.sender}</td>
                <td className="font-mono text-xs text-slate-300">{row.recipient}</td>
                <td className="font-semibold text-emerald-400">${row.amount}</td>
                <td>
                  <span className={`badge ${row.status === 'APPROVED' ? 'badge-success' : row.status === 'REJECTED' ? 'badge-error' : 'badge-warning'} badge-outline`}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Analytics Page
function Analytics() {
  const areaData = useMemo(
    () => Array.from({ length: 10 }).map((_, i) => ({ name: `W${i + 1}`, volume: 200 + Math.round(Math.random() * 500) })),
    []
  )
  const areaData2 = useMemo(
    () => Array.from({ length: 10 }).map((_, i) => ({ name: `W${i + 1}`, approvals: 100 + Math.round(Math.random() * 200) })),
    []
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
        <div className="text-lg font-semibold">Network Volume</div>
        <div className="h-72 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.1} />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: 'rgba(2,6,23,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
              <Area type="monotone" dataKey="volume" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
        <div className="text-lg font-semibold">Bank Approvals</div>
        <div className="h-72 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData2}>
              <defs>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.1} />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: 'rgba(2,6,23,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
              <Area type="monotone" dataKey="approvals" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#g2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// Simulator Page (visual grid only for this redesign snapshot)
function Simulator() {
  const nodes = useMemo(
    () => Array.from({ length: 12 }).map((_, i) => ({
      name: `Node-${i + 1}`,
      key: `0x${(Math.random() * 1e16).toString(16).slice(0, 10)}`,
      status: ['ACTIVE', 'PENDING', 'FRAUDULENT'][Math.floor(Math.random() * 3)],
      isActive: Math.random() > 0.2,
    })),
    []
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold">Network Simulator</div>
        <button className="btn btn-primary btn-sm">Register Node</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {nodes.map((n, i) => (
          <motion.div key={n.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`rounded-2xl p-4 ring-1 ring-white/10 bg-white/5 ${n.status === 'PENDING' ? 'border border-amber-500/40' : ''} ${n.status === 'FRAUDULENT' ? 'border border-rose-500/40' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 grid place-items-center font-bold">{n.name.charAt(0)}</div>
              <div className="flex-1 overflow-hidden">
                <div className="font-semibold truncate">{n.name}</div>
                <div className="text-xs text-slate-400 truncate">{n.key}</div>
              </div>
              <span className={`badge ${n.isActive ? 'badge-success' : 'badge-ghost'} badge-outline`}>{n.isActive ? 'Online' : 'Idle'}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="btn btn-xs btn-ghost">Approve</button>
              <button className="btn btn-xs btn-ghost">Reject</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Settings Page
function Settings() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
        <div className="text-lg font-semibold">Profile</div>
        <div className="mt-4 grid gap-3">
          <label className="text-sm text-slate-300">Display Name</label>
          <input className="input input-sm bg-white/10" defaultValue="Alice" />
          <label className="text-sm text-slate-300 mt-2">Email</label>
          <input className="input input-sm bg-white/10" defaultValue="alice@example.com" />
          <button className="btn btn-primary btn-sm mt-3">Save</button>
        </div>
      </div>
      <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
        <div className="text-lg font-semibold">Preferences</div>
        <div className="mt-4 grid gap-3">
          <label className="text-sm text-slate-300">Notifications</label>
          <select className="select select-sm bg-white/10">
            <option>All</option>
            <option>Important only</option>
            <option>None</option>
          </select>
          <label className="text-sm text-slate-300 mt-2">Currency</label>
          <select className="select select-sm bg-white/10">
            <option>USD</option>
            <option>EUR</option>
            <option>INR</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default App
