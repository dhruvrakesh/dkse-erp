import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Edit,
  Save,
  X,
  Calendar,
  BarChart3
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

const OpeningStockSummary = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: openingStockData, isLoading, error, refetch } = useQuery({
    queryKey: ['opening-stock-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock')
        .select(`
          *,
          item_master (
            item_name,
            uom,
            category_id,
            categories (
              category_name
            )
          )
        `)
        .order('item_code')
      
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

  const updateOpeningStockMutation = useMutation({
    mutationFn: async ({ itemCode, newOpeningQty }: { itemCode: string, newOpeningQty: number }) => {
      const { data, error } = await supabase
        .from('stock')
        .update({ 
          opening_qty: newOpeningQty,
          last_updated: new Date().toISOString()
        })
        .eq('item_code', itemCode)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opening-stock-summary'] })
      queryClient.invalidateQueries({ queryKey: ['stock-summary'] })
      toast({
        title: "Success",
        description: "Opening stock updated successfully",
      })
      setEditingItem(null)
      setEditValue("")
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  })

  const filteredData = useMemo(() => {
    if (!openingStockData) return []
    
    return openingStockData.filter(item => {
      const matchesSearch = item.item_master?.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.item_code?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = categoryFilter === "all" || 
                             item.item_master?.categories?.category_name === categoryFilter
      
      return matchesSearch && matchesCategory
    })
  }, [openingStockData, searchTerm, categoryFilter])

  const handleEdit = (itemCode: string, currentValue: number) => {
    setEditingItem(itemCode)
    setEditValue(currentValue.toString())
  }

  const handleSave = (itemCode: string) => {
    const newValue = parseFloat(editValue)
    if (isNaN(newValue) || newValue < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid positive number",
        variant: "destructive",
      })
      return
    }
    
    updateOpeningStockMutation.mutate({ itemCode, newOpeningQty: newValue })
  }

  const handleCancel = () => {
    setEditingItem(null)
    setEditValue("")
  }

  const exportToCSV = () => {
    const csvData = filteredData.map(item => ({
      'Item Code': item.item_code,
      'Item Name': item.item_master?.item_name,
      'Category': item.item_master?.categories?.category_name,
      'UOM': item.item_master?.uom,
      'Opening Qty': item.opening_qty,
      'Current Qty': item.current_qty,
      'Last Updated': new Date(item.last_updated).toLocaleString()
    }))

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `opening-stock-summary-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = useMemo(() => {
    const totalItems = filteredData.length
    const totalOpeningQty = filteredData.reduce((sum, item) => sum + (item.opening_qty || 0), 0)
    const totalCurrentQty = filteredData.reduce((sum, item) => sum + (item.current_qty || 0), 0)
    const zeroOpeningStock = filteredData.filter(item => (item.opening_qty || 0) === 0).length
    
    return { totalItems, totalOpeningQty, totalCurrentQty, zeroOpeningStock }
  }, [filteredData])

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading opening stock data: {error.message}
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
          <h1 className="text-3xl font-bold">Opening Stock Summary</h1>
          <p className="text-muted-foreground">View and manage initial stock quantities for all items</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToCSV} disabled={!filteredData.length}>
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
            <p className="text-xs text-muted-foreground">With opening stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Opening Qty</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOpeningQty.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Initial stock quantity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Total Qty</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCurrentQty.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Present stock quantity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zero Opening Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.zeroOpeningStock}</div>
            <p className="text-xs text-muted-foreground">Items without opening stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="text-sm font-medium">Clear Filters</label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setCategoryFilter("all")
                }}
                className="w-full"
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opening Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Opening Stock Details ({filteredData.length} items)</CardTitle>
          <CardDescription>
            Click the edit icon to update opening stock quantities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Code</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead>Opening Qty</TableHead>
                  <TableHead>Current Qty</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Loading opening stock data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No items found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.item_code}>
                      <TableCell className="font-mono text-sm">{item.item_code}</TableCell>
                      <TableCell className="font-medium">{item.item_master?.item_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.item_master?.categories?.category_name || 'Uncategorized'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.item_master?.uom}</TableCell>
                      <TableCell>
                        {editingItem === item.item_code ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-20"
                              step="0.01"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSave(item.item_code)}
                              disabled={updateOpeningStockMutation.isPending}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{item.opening_qty || 0}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(item.item_code, item.opening_qty || 0)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">{item.current_qty || 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(item.last_updated).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(item.opening_qty || 0) === 0 && (
                          <Badge variant="destructive" className="text-xs">
                            No Opening Stock
                          </Badge>
                        )}
                      </TableCell>
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

export default OpeningStockSummary