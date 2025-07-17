import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Search, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  Package, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Calendar
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts"

const StockAnalytics = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [analyticsView, setAnalyticsView] = useState("overview")

  const { data: stockData, isLoading, error, refetch } = useQuery({
    queryKey: ['stock-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_summary')
        .select('*')
        .order('item_name')
      
      if (error) throw error
      return data || []
    }
  })

  const { data: categories } = useQuery({
    queryKey: ['categories-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('category_name')
      
      if (error) throw error
      return data || []
    }
  })

  const { data: grnData } = useQuery({
    queryKey: ['grn-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grn_log')
        .select('*')
        .order('date', { ascending: false })
        .limit(30)
      
      if (error) throw error
      return data || []
    }
  })

  const { data: issueData } = useQuery({
    queryKey: ['issue-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issue_log')
        .select('*')
        .order('date', { ascending: false })
        .limit(30)
      
      if (error) throw error
      return data || []
    }
  })

  const filteredStockData = useMemo(() => {
    if (!stockData) return []
    
    return stockData.filter(item => {
      const matchesSearch = item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.item_code?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "all" || item.category_name === categoryFilter
      
      return matchesSearch && matchesCategory
    })
  }, [stockData, searchTerm, categoryFilter])

  // Analytics calculations
  const analytics = useMemo(() => {
    if (!stockData) return null

    const totalItems = stockData.length
    const lowStockItems = stockData.filter(item => (item.current_qty || 0) < 10).length
    const outOfStockItems = stockData.filter(item => (item.current_qty || 0) === 0).length
    const criticalStockItems = stockData.filter(item => 
      item.days_of_cover && item.days_of_cover < 10 && item.days_of_cover !== 999999
    ).length

    const totalCurrentValue = stockData.reduce((sum, item) => sum + (item.current_qty || 0), 0)
    const totalGRNValue = stockData.reduce((sum, item) => sum + (item.total_grn_qty || 0), 0)
    const totalIssuedValue = stockData.reduce((sum, item) => sum + (item.total_issued_qty || 0), 0)

    // Validation discrepancies
    const validationIssues = stockData.filter(item => 
      item.stock_validation_status === 'MISMATCH'
    ).length

    // Stock movement trend (last 30 days)
    const stockMovementData = stockData.map(item => ({
      name: item.item_name?.substring(0, 20) + '...',
      current: item.current_qty || 0,
      grn_30d: item.total_grn_qty || 0,
      issued_30d: item.issue_30d || 0,
      turnover: ((item.issue_30d || 0) / (item.current_qty || 1)) * 100
    })).slice(0, 10)

    // Category distribution
    const categoryData = categories?.map(cat => {
      const categoryItems = stockData.filter(item => item.category_name === cat.category_name)
      return {
        name: cat.category_name,
        count: categoryItems.length,
        value: categoryItems.reduce((sum, item) => sum + (item.current_qty || 0), 0)
      }
    }) || []

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      criticalStockItems,
      totalCurrentValue,
      totalGRNValue,
      totalIssuedValue,
      validationIssues,
      stockMovementData,
      categoryData
    }
  }, [stockData, categories])

  // Chart colors
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))']

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading analytics data: {error.message}
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
          <h1 className="text-3xl font-bold">Stock Analytics Dashboard</h1>
          <p className="text-muted-foreground">Advanced inventory analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalCurrentValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Units in stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{analytics.criticalStockItems}</div>
              <p className="text-xs text-muted-foreground">&lt;10 days cover</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Validation Issues</CardTitle>
              <Activity className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{analytics.validationIssues}</div>
              <p className="text-xs text-muted-foreground">Stock mismatches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Issues (30d)</CardTitle>
              <TrendingDown className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{analytics.totalIssuedValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Units issued</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs value={analyticsView} onValueChange={setAnalyticsView} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stock Movement Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Top 10 Stock Movement
                </CardTitle>
                <CardDescription>Current stock vs 30-day issues</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.stockMovementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="current" fill="hsl(var(--primary))" name="Current Stock" />
                    <Bar dataKey="issued_30d" fill="hsl(var(--destructive))" name="30d Issues" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="mr-2 h-4 w-4" />
                  Category Distribution
                </CardTitle>
                <CardDescription>Stock value by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart data={analytics?.categoryData}>
                    <Pie
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                    >
                      {analytics?.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Trend Analysis</CardTitle>
              <CardDescription>Historical stock movement patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4" />
                <p>Advanced trend analysis coming soon...</p>
                <p className="text-sm">Will include historical data, forecasting, and seasonal patterns</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Validation Dashboard</CardTitle>
              <CardDescription>Stock discrepancies and data integrity checks</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Validation Issues Table */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search validation issues..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48">
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

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Calculated Stock</TableHead>
                        <TableHead>Variance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStockData
                          .filter(item => item.stock_validation_status === 'MISMATCH')
                          .map((item) => (
                            <TableRow key={item.item_code}>
                              <TableCell className="font-medium">{item.item_name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.category_name || 'Uncategorized'}</Badge>
                              </TableCell>
                              <TableCell className="font-mono">{item.current_qty || 0}</TableCell>
                              <TableCell className="font-mono">{item.calculated_qty || 0}</TableCell>
                              <TableCell className="font-mono text-red-600">
                                {((item.current_qty || 0) - (item.calculated_qty || 0))}
                              </TableCell>
                              <TableCell>
                                <Badge variant="destructive">Mismatch</Badge>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Reports</CardTitle>
              <CardDescription>Custom reporting and data export tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Download className="h-12 w-12 mx-auto mb-4" />
                <p>Advanced reporting suite coming soon...</p>
                <p className="text-sm">Will include custom report builder, scheduled reports, and multiple export formats</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default StockAnalytics