import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TemplateDownload } from "@/components/ui/template-download"
import { ItemCombobox } from "@/components/ui/item-combobox"
import { PaginatedTable } from "@/components/ui/paginated-table"
import { useItemsWithStock } from "@/hooks/useItemsWithStock"
import { useToast } from "@/hooks/use-toast"
import { Plus, Minus, AlertCircle, RefreshCw } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GRNCSVUpload } from "@/components/csv/GRNCSVUpload"
import { IssueCSVUpload } from "@/components/csv/IssueCSVUpload"
import { EditableGRNRow } from "@/components/stock/EditableGRNRow"
import { EditableIssueRow } from "@/components/stock/EditableIssueRow"

const StockOperations = () => {
  const [selectedItem, setSelectedItem] = useState("")
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: items = [], isLoading: itemsLoading, error: itemsError, refetch: refetchItems } = useItemsWithStock()

  const { data: recentGRNs } = useQuery({
    queryKey: ['recent-grn'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grn_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      return data || []
    }
  })

  const { data: recentIssues } = useQuery({
    queryKey: ['recent-issues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issue_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      return data || []
    }
  })

  const createGRNMutation = useMutation({
    mutationFn: async (grnData: any) => {
      const { data, error } = await supabase
        .from('grn_log')
        .insert(grnData)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-grn'] })
      queryClient.invalidateQueries({ queryKey: ['stock-summary'] })
      queryClient.invalidateQueries({ queryKey: ['items-with-stock'] })
      toast({
        title: "Success",
        description: "GRN entry created successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  })

  const createIssueMutation = useMutation({
    mutationFn: async (issueData: any) => {
      // Check available stock first
      const { data: stockData, error: stockError } = await supabase
        .from('stock')
        .select('current_qty')
        .eq('item_code', issueData.item_code)
        .single()

      if (stockError) throw new Error('Could not check stock levels')
      
      if (!stockData || stockData.current_qty < issueData.qty_issued) {
        throw new Error('Insufficient stock available')
      }

      const { data, error } = await supabase
        .from('issue_log')
        .insert(issueData)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-issues'] })
      queryClient.invalidateQueries({ queryKey: ['stock-summary'] })
      queryClient.invalidateQueries({ queryKey: ['items-with-stock'] })
      toast({
        title: "Success",
        description: "Issue entry created successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  })

  const handleGRNSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const grnData = {
      grn_number: formData.get('grn_number') as string,
      date: formData.get('date') as string,
      item_code: selectedItem,
      uom: formData.get('uom') as string,
      qty_received: parseFloat(formData.get('qty_received') as string),
      invoice_number: formData.get('invoice_number') as string,
      amount_inr: formData.get('amount_inr') ? parseFloat(formData.get('amount_inr') as string) : null,
      vendor: formData.get('vendor') as string,
      remarks: formData.get('remarks') as string
    }

    createGRNMutation.mutate(grnData)
    ;(e.target as HTMLFormElement).reset()
    setSelectedItem("")
  }

  const handleIssueSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const issueData = {
      date: formData.get('date') as string,
      item_code: selectedItem,
      qty_issued: parseFloat(formData.get('qty_issued') as string),
      purpose: formData.get('purpose') as string,
      remarks: formData.get('remarks') as string
    }

    createIssueMutation.mutate(issueData)
    ;(e.target as HTMLFormElement).reset()
    setSelectedItem("")
  }

  const selectedItemDetails = items.find(item => item.item_code === selectedItem)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stock Operations</h1>
        <p className="text-muted-foreground">Manage stock receipts (GRN) and issues</p>
      </div>

      {itemsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading items: {itemsError.message}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchItems()}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="grn" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grn">Goods Receipt Note (GRN)</TabsTrigger>
          <TabsTrigger value="issue">Stock Issue</TabsTrigger>
        </TabsList>

        <TabsContent value="grn" className="space-y-6">
          <Tabs defaultValue="single" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Entry</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Template Download */}
                <div className="lg:col-span-1">
                  <TemplateDownload
                    templateType="grn"
                    title="Download GRN Template"
                    description="CSV template for bulk GRN entry with sample data and all required fields"
                    showPreview={false}
                  />
                </div>

                {/* GRN Form */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Stock Receipt
                      </CardTitle>
                      <CardDescription>Record incoming stock items</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleGRNSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="grn_number">GRN Number *</Label>
                            <Input
                              id="grn_number"
                              name="grn_number"
                              placeholder="GRN-001"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="date">Date *</Label>
                            <Input
                              id="date"
                              name="date"
                              type="date"
                              defaultValue={new Date().toISOString().split('T')[0]}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="item_code">Item *</Label>
                          <ItemCombobox
                            items={items}
                            value={selectedItem}
                            onValueChange={setSelectedItem}
                            placeholder="Search and select item..."
                            showStockLevel={true}
                            isLoading={itemsLoading}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="qty_received">Quantity Received *</Label>
                            <Input
                              id="qty_received"
                              name="qty_received"
                              type="number"
                              step="0.01"
                              placeholder="0"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="uom">UOM</Label>
                            <Input
                              id="uom"
                              name="uom"
                              value={selectedItemDetails?.uom || ''}
                              readOnly
                              placeholder="Select item first"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="invoice_number">Invoice Number</Label>
                            <Input
                              id="invoice_number"
                              name="invoice_number"
                              placeholder="INV-001"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="amount_inr">Amount (INR)</Label>
                            <Input
                              id="amount_inr"
                              name="amount_inr"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="vendor">Vendor</Label>
                          <Input
                            id="vendor"
                            name="vendor"
                            placeholder="Vendor name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="remarks">Remarks</Label>
                          <Textarea
                            id="remarks"
                            name="remarks"
                            placeholder="Additional notes..."
                          />
                        </div>

                        <Button type="submit" className="w-full" disabled={createGRNMutation.isPending || !selectedItem}>
                          {createGRNMutation.isPending ? "Processing..." : "Add GRN Entry"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bulk">
              <GRNCSVUpload onUploadComplete={() => {
                queryClient.invalidateQueries({ queryKey: ['recent-grn'] });
                queryClient.invalidateQueries({ queryKey: ['stock-summary'] });
                queryClient.invalidateQueries({ queryKey: ['items-with-stock'] });
              }} />
            </TabsContent>
          </Tabs>

          {/* Recent GRNs with Edit/Delete */}
          <Card>
            <CardHeader>
              <CardTitle>Recent GRN Entries</CardTitle>
              <CardDescription>Manage stock receipts with inline editing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>GRN Number</TableHead>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>UOM</TableHead>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Amount (INR)</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentGRNs?.map((grn) => (
                      <EditableGRNRow key={grn.id} grn={grn} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issue" className="space-y-6">
          <Tabs defaultValue="single" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Entry</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Template Download */}
                <div className="lg:col-span-1">
                  <TemplateDownload
                    templateType="issue"
                    title="Download Issue Template"
                    description="CSV template for bulk issue entry with sample data and all required fields"
                    showPreview={false}
                  />
                </div>

                {/* Issue Form */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Minus className="mr-2 h-4 w-4" />
                        Issue Stock
                      </CardTitle>
                      <CardDescription>Record stock consumption/issues</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleIssueSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Date *</Label>
                          <Input
                            id="date"
                            name="date"
                            type="date"
                            defaultValue={new Date().toISOString().split('T')[0]}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="item_code">Item *</Label>
                          <ItemCombobox
                            items={items}
                            value={selectedItem}
                            onValueChange={setSelectedItem}
                            placeholder="Search and select item..."
                            showStockLevel={true}
                            isLoading={itemsLoading}
                          />
                        </div>

                        {selectedItemDetails && (
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">
                              Available Stock: <span className="font-medium text-foreground">{selectedItemDetails.current_qty} {selectedItemDetails.uom}</span>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="qty_issued">Quantity Issued *</Label>
                          <Input
                            id="qty_issued"
                            name="qty_issued"
                            type="number"
                            step="0.01"
                            placeholder="0"
                            max={selectedItemDetails?.current_qty || undefined}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="purpose">Purpose *</Label>
                          <select 
                            name="purpose" 
                            required
                            className="w-full px-3 py-2 border border-input rounded-md bg-background"
                          >
                            <option value="">Select purpose</option>
                            <option value="production">Production</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="r&d">R&D</option>
                            <option value="sample">Sample</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="remarks">Remarks</Label>
                          <Textarea
                            id="remarks"
                            name="remarks"
                            placeholder="Additional notes..."
                          />
                        </div>

                        <Button type="submit" className="w-full" disabled={createIssueMutation.isPending || !selectedItem}>
                          {createIssueMutation.isPending ? "Processing..." : "Issue Stock"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bulk">
              <IssueCSVUpload onUploadComplete={() => {
                queryClient.invalidateQueries({ queryKey: ['recent-issues'] });
                queryClient.invalidateQueries({ queryKey: ['stock-summary'] });
                queryClient.invalidateQueries({ queryKey: ['items-with-stock'] });
              }} />
            </TabsContent>
          </Tabs>

          {/* Recent Issues with Edit/Delete */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Issues</CardTitle>
              <CardDescription>Manage stock consumption with inline editing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Quantity Issued</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentIssues?.map((issue) => {
                      const itemStock = items?.find(item => item.item_code === issue.item_code);
                      return (
                        <EditableIssueRow 
                          key={issue.id} 
                          issue={issue} 
                          availableStock={itemStock?.current_qty || 0}
                        />
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default StockOperations
