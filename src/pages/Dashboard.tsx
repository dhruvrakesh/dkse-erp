import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, TrendingUp, AlertTriangle, ShoppingCart } from "lucide-react"

const Dashboard = () => {
  const { data: stockSummary } = useQuery({
    queryKey: ['stock-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_summary')
        .select('*')
        .order('current_qty', { ascending: true })
      
      if (error) throw error
      return data || []
    }
  })

  const { data: recentGRNs } = useQuery({
    queryKey: ['recent-grns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grn_log')
        .select('*, item_master(item_name)')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (error) throw error
      return data || []
    }
  })

  const { data: recentIssues } = useQuery({
    queryKey: ['recent-issues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issue_log')
        .select('*, item_master(item_name)')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (error) throw error
      return data || []
    }
  })

  const totalItems = stockSummary?.length || 0
  const lowStockItems = stockSummary?.filter(item => (item.current_qty || 0) < 10).length || 0
  const totalValue = stockSummary?.reduce((sum, item) => sum + (item.current_qty || 0), 0) || 0

  const getDaysOfCoverBadge = (days: number | null) => {
    if (!days) return <Badge variant="secondary">N/A</Badge>
    if (days > 30) return <Badge variant="default" className="bg-green-100 text-green-800">Good ({days.toFixed(0)} days)</Badge>
    if (days > 10) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium ({days.toFixed(0)} days)</Badge>
    return <Badge variant="destructive">Low ({days.toFixed(0)} days)</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ERP Dashboard</h1>
        <p className="text-muted-foreground">Overview of your inventory management system</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Active inventory items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Items below threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Qty</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Units in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(recentGRNs?.length || 0) + (recentIssues?.length || 0)}</div>
            <p className="text-xs text-muted-foreground">Last 5 entries</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Status */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Status</CardTitle>
            <CardDescription>Current inventory levels and days of cover</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stockSummary?.slice(0, 10).map((item) => (
                <div key={item.item_code} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{item.item_name}</p>
                    <p className="text-sm text-muted-foreground">Code: {item.item_code}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-mono">{item.current_qty || 0}</p>
                    {getDaysOfCoverBadge(item.days_of_cover)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest GRN and Issue transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentGRNs?.map((grn) => (
                <div key={grn.id} className="flex items-center justify-between p-2 border rounded bg-green-50">
                  <div>
                    <p className="font-medium text-green-800">GRN: {grn.grn_number}</p>
                    <p className="text-sm text-muted-foreground">{grn.item_master?.item_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-green-600">+{grn.qty_received}</p>
                    <p className="text-xs text-muted-foreground">{new Date(grn.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              
              {recentIssues?.map((issue) => (
                <div key={issue.id} className="flex items-center justify-between p-2 border rounded bg-red-50">
                  <div>
                    <p className="font-medium text-red-800">Issue: {issue.purpose}</p>
                    <p className="text-sm text-muted-foreground">{issue.item_master?.item_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-red-600">-{issue.qty_issued}</p>
                    <p className="text-xs text-muted-foreground">{new Date(issue.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard