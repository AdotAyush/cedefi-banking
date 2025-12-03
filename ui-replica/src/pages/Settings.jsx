import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const Settings = () => {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Node Configuration</CardTitle>
          <CardDescription>Manage your validator node settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Node Name</label>
            <Input placeholder="My Validator Node" defaultValue="Node-Alpha" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">RPC URL</label>
            <Input placeholder="http://localhost:8545" defaultValue="http://localhost:8545" />
          </div>
        </CardContent>
        <CardFooter>
          <Button>Save Changes</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank API Keys</CardTitle>
          <CardDescription>Securely manage keys for bank integrations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Bank A API Key</label>
            <Input type="password" value="••••••••••••••••" readOnly />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Bank B API Key</label>
            <Input type="password" value="••••••••••••••••" readOnly />
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline">Rotate Keys</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Settings
