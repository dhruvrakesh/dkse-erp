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
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type SortField = 'item_name' | 'current_qty' | 'days_of_cover' | 'category_name'
type SortOrder = 'asc' | 'desc'

const StockSummary = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockLevelFilter, setStockLevelFilter] = useState("all")
  const [sortField, setSortField] = useState<SortField>('item_name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const { data: stockData, isLoading, error, refetch } = useQuery({
    queryKey: ['stock-summary-detailed'],
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

  const filteredAndSortedData = useMemo(() => {
    if (!stockData) return []
    
    let filtered = stockData.filter(item => {
      const matchesSearch = item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.item_code?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = categoryFilter === "all" || item.category_name === categoryFilter
      
      const matchesStockLevel = stockLevelFilter === "all" || 
        (stockLevelFilter === "low" && (item.current_qty || 0) < 10) ||
        (stockLevelFilter === "medium" && (item.current_qty || 0) >= 10 && (item.current_qty || 0) < 100) ||
        (stockLevelFilter === "high" && (item.current_qty || 0) >= 100)
      
      return matchesSearch && matchesCategory && matchesStockLevel
    })

    // Sort the filtered data
    filtered.sort((a, b) => {
      let aValue = a[sortField] || 0
      let bValue = b[sortField] || 0
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = (bValue as string).toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [stockData, searchTerm, categoryFilter, stockLevelFilter, sortField, sortOrder])

  const getStockLevelBadge = (qty: number) => {
    if (qty < 10) return <Badge variant="destructive">Low</Badge>
    if (qty < 100) return <Badge variant="secondary">Medium</Badge>
    return <Badge variant="default" className="bg-green-100 text-green-800">High</Badge>
  }

  const getDaysOfCoverBadge = (days: number | null) => {
    if (!days || days === 999999) return <Badge variant="secondary">∞ (No Usage)</Badge>
    if (days > 30) return <Badge variant="default" className="bg-green-100 text-green-800">Good ({days.toFixed(0)}d)</Badge>
    if (days > 10) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium ({days.toFixed(0)}d)</Badge>
    return <Badge variant="destructive">Critical ({days.toFixed(0)}d)</Badge>
  }

  const getValidationBadge = (status: string) => {
    if (status === 'OK') return <Badge variant="default" className="bg-green-100 text-green-800">✓ OK</Badge>
    return <Badge variant="destructive">⚠ Mismatch</Badge>
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const exportToCSV = () => {
    const csvData = filteredAndSortedData.map(item => ({
      'Item Code': item.item_code,
      'Item Name': item.item_name,
      'Category': item.category_name,
      'Opening Qty': item.opening_qty,
      'Current Qty': item.current_qty,
      'Calculated Qty': item.calculated_qty,
      'Total GRN': item.total_grn_qty,
      'Total Issued': item.total_issued_qty,
       'Issue 30d': item.issue_30d,
       'Days of Cover': item.days_of_cover,
      'Stock Validation': item.stock_validation_status
    }))

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stock-summary-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = useMemo(() => {
    const totalItems = filteredAndSortedData.length
    const lowStock = filteredAndSortedData.filter(item => (item.current_qty || 0) < 10).length
    const totalValue = filteredAndSortedData.reduce((sum, item) => sum + (item.current_qty || 0), 0)
    const zeroStock = filteredAndSortedData.filter(item => (item.current_qty || 0) === 0).length
    
    return { totalItems, lowStock, totalValue, zeroStock }
  }, [filteredAndSortedData])

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading stock data: {error.message}
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
          <h1 className="text-3xl font-bold">Stock Summary Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive inventory overview and management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToCSV} disabled={!filteredAndSortedData.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">In current view</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground">Below threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Units in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zero Stock</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.zeroStock}</div>
            <p className="text-xs text-muted-foreground">Out of stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filters & Search
          </CardTitle>
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
              <label className="text-sm font-medium">Stock Level</label>
              <Select value={stockLevelFilter} onValueChange={setStockLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="low">Low (&lt;10)</SelectItem>
                  <SelectItem value="medium">Medium (10-99)</SelectItem>
                  <SelectItem value="high">High (100+)</SelectItem>
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
                  setStockLevelFilter("all")
                }}
                className="w-full"
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Inventory ({filteredAndSortedData.length} items)</CardTitle>
          <CardDescription>
            Detailed view of all inventory items with current stock levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('item_name')}
                  >
                    <div className="flex items-center">
                      Item Name
                      {sortField === 'item_name' && (
                        sortOrder === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Item Code</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('category_name')}
                  >
                    <div className="flex items-center">
                      Category
                      {sortField === 'category_name' && (
                        sortOrder === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Opening</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('current_qty')}
                  >
                    <div className="flex items-center">
                      Current
                      {sortField === 'current_qty' && (
                        sortOrder === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                   <TableHead>Total GRN</TableHead>
                   <TableHead>Total Issued</TableHead>
                   <TableHead>30d Issues</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Validation</TableHead>
                   <TableHead 
                     className="cursor-pointer hover:bg-muted"
                     onClick={() => handleSort('days_of_cover')}
                   >
                     <div className="flex items-center">
                       Days Cover
                       {sortField === 'days_of_cover' && (
                         sortOrder === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                       )}
                     </div>
                   </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {isLoading ? (
                   <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                       <div className="flex items-center justify-center">
                         <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                         Loading stock data...
                       </div>
                     </TableCell>
                   </TableRow>
                 ) : filteredAndSortedData.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={10} className="text-center py-8">
                       No items found matching your criteria
                     </TableCell>
                   </TableRow>
                 ) : (
                   filteredAndSortedData.map((item) => (
                     <TableRow key={item.item_code}>
                       <TableCell className="font-medium">{item.item_name}</TableCell>
                       <TableCell className="font-mono text-sm">{item.item_code}</TableCell>
                       <TableCell>
                         <Badge variant="outline">{item.category_name || 'Uncategorized'}</Badge>
                       </TableCell>
                       <TableCell className="font-mono">{item.opening_qty || 0}</TableCell>
                       <TableCell className="font-mono font-bold">{item.current_qty || 0}</TableCell>
                       <TableCell className="font-mono text-green-600">{item.total_grn_qty || 0}</TableCell>
                       <TableCell className="font-mono text-red-600">{item.total_issued_qty || 0}</TableCell>
                        <TableCell className="font-mono text-orange-600">{item.issue_30d || 0}</TableCell>
                        <TableCell>{getStockLevelBadge(item.current_qty || 0)}</TableCell>
                       <TableCell>{getValidationBadge(item.stock_validation_status || 'OK')}</TableCell>
                       <TableCell>{getDaysOfCoverBadge(item.days_of_cover)}</TableCell>
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

export default StockSummary