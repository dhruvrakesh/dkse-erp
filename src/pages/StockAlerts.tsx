import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  AlertTriangle, 
  AlertCircle, 
  Package, 
  TrendingDown, 
  Search,
  Bell,
  Clock,
  XCircle,
  CheckCircle,
  RefreshCw,
  Download
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

const StockAlerts = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [alertType, setAlertType] = useState("all")

  const { data: stockData, isLoading, error, refetch } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_summary')
        .select('*')
        .order('current_qty', { ascending: true })
      
      if (error) throw error
      return data || []
    }
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('category_name')
      
      if (error) throw error
      return data || []
    }
  })

  const alertsData = useMemo(() => {
    if (!stockData) return { critical: [], low: [], medium: [], outOfStock: [] }
    
    const alerts = {
      critical: stockData.filter(item => 
        (item.current_qty || 0) > 0 && 
        (item.current_qty || 0) < 5 &&
        (item.days_of_cover || 0) < 7
      ),
      low: stockData.filter(item => 
        (item.current_qty || 0) >= 5 && 
        (item.current_qty || 0) < 10 &&
        (item.days_of_cover || 0) < 14
      ),
      medium: stockData.filter(item => 
        (item.current_qty || 0) >= 10 && 
        (item.current_qty || 0) < 50 &&
        (item.days_of_cover || 0) < 30
      ),
      outOfStock: stockData.filter(item => (item.current_qty || 0) === 0)
    }
    
    return alerts
  }, [stockData])

  const filteredAlerts = useMemo(() => {
    let filtered = stockData || []
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_code?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (categoryFilter !== "all") {
      filtered = filtered.filter(item => item.category_name === categoryFilter)
    }
    
    if (alertType !== "all") {
      switch (alertType) {
        case "critical":
          filtered = filtered.filter(item => 
            (item.current_qty || 0) > 0 && 
            (item.current_qty || 0) < 5 &&
            (item.days_of_cover || 0) < 7
          )
          break
        case "low":
          filtered = filtered.filter(item => 
            (item.current_qty || 0) >= 5 && 
            (item.current_qty || 0) < 10 &&
            (item.days_of_cover || 0) < 14
          )
          break
        case "medium":
          filtered = filtered.filter(item => 
            (item.current_qty || 0) >= 10 && 
            (item.current_qty || 0) < 50 &&
            (item.days_of_cover || 0) < 30
          )
          break
        case "outOfStock":
          filtered = filtered.filter(item => (item.current_qty || 0) === 0)
          break
      }
    }
    
    return filtered
  }, [stockData, searchTerm, categoryFilter, alertType])

  const getAlertBadge = (item: any) => {
    const qty = item.current_qty || 0
    const days = item.days_of_cover || 0
    
    if (qty === 0) return <Badge variant="destructive">Out of Stock</Badge>
    if (qty < 5 && days < 7) return <Badge variant="destructive">Critical</Badge>
    if (qty < 10 && days < 14) return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Low Stock</Badge>
    if (qty < 50 && days < 30) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium Alert</Badge>
    return <Badge variant="default" className="bg-green-100 text-green-800">Normal</Badge>
  }

  const getStockLevel = (qty: number) => {
    if (qty === 0) return 0
    if (qty < 5) return 10
    if (qty < 10) return 25
    if (qty < 50) return 50
    return 100
  }

  const chartData = Object.entries(alertsData).map(([key, items]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: items.length,
    color: key === 'critical' ? '#EF4444' : 
           key === 'low' ? '#F59E0B' : 
           key === 'medium' ? '#F59E0B' : 
           '#6B7280'
  }))

  const exportToCSV = () => {
    const csvData = filteredAlerts.map(item => ({
      'Item Code': item.item_code,
      'Item Name': item.item_name,
      'Category': item.category_name,
      'Current Qty': item.current_qty,
      'Days of Cover': item.days_of_cover,
      'Alert Level': item.current_qty === 0 ? 'Out of Stock' :
                    item.current_qty < 5 ? 'Critical' :
                    item.current_qty < 10 ? 'Low Stock' :
                    item.current_qty < 50 ? 'Medium Alert' : 'Normal'
    }))

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stock-alerts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading stock alerts: {error.message}
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2">
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Stock Alerts & Monitoring</h1>
          <p className="text-muted-foreground">Monitor stock levels and manage alerts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alertsData.critical.length}</div>
            <p className="text-xs text-muted-foreground">Immediate attention required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{alertsData.low.length}</div>
            <p className="text-xs text-muted-foreground">Reorder soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{alertsData.medium.length}</div>
            <p className="text-xs text-muted-foreground">Monitor closely</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{alertsData.outOfStock.length}</div>
            <p className="text-xs text-muted-foreground">Zero inventory</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Distribution</CardTitle>
          <CardDescription>Visual breakdown of stock alert levels</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[200px]">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="hsl(var(--chart-1))" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Items</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map(cat => (
                    <SelectItem key={cat.id} value={cat.category_name}>
                      {cat.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Alert Type</label>
              <Select value={alertType} onValueChange={setAlertType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Alerts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Alerts</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="medium">Medium Alert</SelectItem>
                  <SelectItem value="outOfStock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Clear Filters</label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setCategoryFilter("all")
                  setAlertType("all")
                }}
                className="w-full"
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Alerts ({filteredAlerts.length} items)</CardTitle>
          <CardDescription>
            Detailed view of all stock alerts requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Item Code</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Days of Cover</TableHead>
                  <TableHead>Alert Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Loading alerts...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No alerts found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map((item) => (
                    <TableRow key={item.item_code}>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell className="font-mono text-sm">{item.item_code}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category_name || 'Uncategorized'}</Badge>
                      </TableCell>
                      <TableCell className="font-mono font-bold">{item.current_qty || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={getStockLevel(item.current_qty || 0)} className="w-16" />
                          <span className="text-sm">{getStockLevel(item.current_qty || 0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {item.days_of_cover ? `${item.days_of_cover.toFixed(0)} days` : 'N/A'}
                      </TableCell>
                      <TableCell>{getAlertBadge(item)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StockAlerts