import { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import AuthContext from '../context/AuthContext.jsx'

const Dashboard = () => {
  const { user } = useContext(AuthContext)
  const [nodes, setNodes] = useState([])
  const [transactions, setTransactions] = useState([])
  const [activeNodes, setActiveNodes] = useState(0)

  const fetchData = async () => {
    try {
      const [nodesRes, txRes] = await Promise.all([
        axios.get('http://localhost:5000/nodes'),
        axios.get('http://localhost:5000/transactions'),
      ])
      setNodes(nodesRes.data)
      setActiveNodes(nodesRes.data.filter((n) => n.isActive).length)
      setTransactions(txRes.data)
    } catch (error) {
      console.error('Error fetching dashboard data', error)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 3000)
    return () => clearInterval(interval)
  }, [])

  const userTransactions = transactions.filter((t) => t.sender === user?.did || t.recipient === user?.did)
  const userBalance = userTransactions.reduce((acc, t) => {
    if (t.status !== 'APPROVED') return acc
    if (t.recipient === user?.did) return acc + t.amount
    if (t.sender === user?.did) return acc - t.amount
    return acc
  }, 0)

  const displayTxs = user?.role === 'admin' ? transactions : userTransactions
  const approvedTxs = displayTxs.filter((t) => t.status === 'APPROVED').length
  const rejectedTxs = displayTxs.filter((t) => t.status === 'REJECTED').length
  const pendingTxs = displayTxs.filter((t) => t.status === 'PENDING').length

  const pieData = [
    { name: 'Approved', value: approvedTxs, color: '#22c55e' },
    { name: 'Rejected', value: rejectedTxs, color: '#ef4444' },
    { name: 'Pending', value: pendingTxs, color: '#eab308' },
  ]

  const chartData = displayTxs
    .map((t, i) => ({ name: `Tx ${i + 1}`, amount: t.amount }))
    .slice(-10)

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {user?.role === 'admin' ? 'Global Dashboard' : `Welcome, ${user?.username}`}
        </h1>
        <div className="flex gap-2">
          <Badge variant="outline">{user?.role === 'admin' ? 'Admin Access' : 'User Access'}</Badge>
          <Badge variant="outline" className="px-4 py-2 text-sm gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live Network
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {user?.role === 'admin' ? (
          <>
            <StatsCard title="Active Nodes" value={activeNodes} desc={`Total Registered: ${nodes.length}`} />
            <StatsCard title="Total Volume" value={`$${transactions.reduce((acc, t) => acc + t.amount, 0)}`} desc="All time volume" />
            <StatsCard title="Total Transactions" value={transactions.length} desc={`${approvedTxs} Approved`} />
          </>
        ) : (
          <>
            <StatsCard title="My Balance" value={`$${userBalance}`} desc="Net Balance" />
            <StatsCard title="My Volume" value={`$${userTransactions.reduce((acc, t) => acc + t.amount, 0)}`} desc="Total Sent/Received" />
            <StatsCard title="My Transactions" value={userTransactions.length} desc={`${approvedTxs} Approved`} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{user?.role === 'admin' ? 'Global Volume' : 'My Transaction History'}</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="amount" stroke="#8884d8" fillOpacity={1} fill="url(#colorAmt)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 ml-4">
                {pieData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-sm font-medium">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const StatsCard = ({ title, value, desc }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </CardContent>
  </Card>
)

export default Dashboard
