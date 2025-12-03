import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import axios from 'axios'

const History = () => {
  const [history, setHistory] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/transactions')
        const transactions = res.data
        const formattedHistory = transactions.map((tx) => ({
          id: tx.transactionId,
          action: tx.status === 'PENDING' ? 'Created' : tx.status,
          user: tx.sender,
          timestamp: new Date(tx.createdAt).toLocaleString(),
          status: tx.status,
          recipientStatus: tx.recipientStatus,
        }))
        setHistory(formattedHistory)
      } catch (error) {
        console.error('Error fetching history', error)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const getBadgeVariant = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'success'
      case 'REJECTED':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System History</h1>

      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Recipient Status</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono">{item.id}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(item.status)}>{item.action}</Badge>
                  </TableCell>
                  <TableCell>{item.user}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.recipientStatus}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default History
