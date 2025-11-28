import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const History = () => {
    // Mock history data
    const history = [
        { id: "TX-991", action: "Created", timestamp: "2 mins ago", user: "Alice" },
        { id: "TX-990", action: "Vote Cast", timestamp: "5 mins ago", user: "Node-1" },
        { id: "TX-989", action: "Approved", timestamp: "10 mins ago", user: "System" },
        { id: "TX-988", action: "Rejected", timestamp: "1 hour ago", user: "Consensus" },
        { id: "TX-987", action: "Created", timestamp: "2 hours ago", user: "Bob" },
    ]

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
                                <TableHead>User/System</TableHead>
                                <TableHead>Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-mono">{item.id}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{item.action}</Badge>
                                    </TableCell>
                                    <TableCell>{item.user}</TableCell>
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
