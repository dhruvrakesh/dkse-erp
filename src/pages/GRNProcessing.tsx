import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Package, Search, Calendar, User, FileText, AlertCircle, CheckCircle, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { ItemCombobox } from "@/components/ui/item-combobox"
import { GRNCSVUpload } from "@/components/csv/GRNCSVUpload"

interface GRNFormData {
  grn_number: string
  item_code: string
  vendor: string
  qty_received: number
  uom: string
  amount_inr: number
  invoice_number: string
  date: string
  remarks: string
}

const GRNProcessing = () => {
  const [formData, setFormData] = useState<GRNFormData>({
    grn_number: '',
    item_code: '',
    vendor: '',
    qty_received: 0,
    uom: 'PCS',
    amount_inr: 0,
    invoice_number: '',
    date: new Date().toISOString().split('T')[0],
    remarks: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: items } = useQuery({
    queryKey: ['items-for-grn'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_master')
        .select('*')
        .eq('status', 'active')
        .order('item_name')
      
      if (error) throw error
      return data || []
    }
  })

  const { data: recentGRNs } = useQuery({
    queryKey: ['recent-grns-detailed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grn_log')
        .select('*, item_master(item_name, uom)')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      return data || []
    }
  })

  const processingMutation = useMutation({
    mutationFn: async (data: GRNFormData) => {
      const { error } = await supabase
        .from('grn_log')
        .insert([{
          grn_number: data.grn_number,
          item_code: data.item_code,
          vendor: data.vendor,
          qty_received: data.qty_received,
          uom: data.uom,
          amount_inr: data.amount_inr,
          invoice_number: data.invoice_number,
          date: data.date,
          remarks: data.remarks
        }])
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-grns-detailed'] })
      queryClient.invalidateQueries({ queryKey: ['stock-summary'] })
      toast({
        title: "GRN Processed Successfully",
        description: `GRN ${formData.grn_number} has been processed and stock updated`,
      })
      setFormData({
        grn_number: '',
        item_code: '',
        vendor: '',
        qty_received: 0,
        uom: 'PCS',
        amount_inr: 0,
        invoice_number: '',
        date: new Date().toISOString().split('T')[0],
        remarks: ''
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error Processing GRN",
        description: error.message,
        variant: "destructive",
      })
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await processingMutation.mutateAsync(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedItem = items?.find(item => item.item_code === formData.item_code)

  const handleBulkUploadComplete = () => {
    // Refresh all queries after bulk upload
    queryClient.invalidateQueries({ queryKey: ['recent-grns-detailed'] });
    queryClient.invalidateQueries({ queryKey: ['stock-summary'] });
    queryClient.invalidateQueries({ queryKey: ['items-with-stock'] });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">GRN Processing</h1>
        <p className="text-muted-foreground">Process Goods Receipt Notes and update inventory</p>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single" className="flex items-center">
            <Package className="mr-2 h-4 w-4" />
            Single Entry
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center">
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* GRN Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="mr-2 h-4 w-4" />
                    New GRN Entry
                  </CardTitle>
                  <CardDescription>
                    Enter details for goods received note
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="grn_number">GRN Number *</Label>
                        <Input
                          id="grn_number"
                          value={formData.grn_number}
                          onChange={(e) => setFormData({...formData, grn_number: e.target.value})}
                          placeholder="Enter GRN number"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vendor">Vendor</Label>
                        <Input
                          id="vendor"
                          value={formData.vendor}
                          onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                          placeholder="Enter vendor name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="invoice_number">Invoice Number</Label>
                        <Input
                          id="invoice_number"
                          value={formData.invoice_number}
                          onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                          placeholder="Enter invoice number"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="item_code">Item *</Label>
                        <ItemCombobox
                          items={items || []}
                          value={formData.item_code}
                          onValueChange={(value) => {
                            const item = items?.find(i => i.item_code === value)
                            setFormData({
                              ...formData, 
                              item_code: value,
                              uom: item?.uom || 'PCS'
                            })
                          }}
                          placeholder="Select item..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="qty_received">Quantity Received *</Label>
                        <Input
                          id="qty_received"
                          type="number"
                          value={formData.qty_received}
                          onChange={(e) => setFormData({...formData, qty_received: Number(e.target.value)})}
                          placeholder="Enter quantity"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="uom">UOM</Label>
                        <Select value={formData.uom} onValueChange={(value) => setFormData({...formData, uom: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PCS">PCS</SelectItem>
                            <SelectItem value="KG">KG</SelectItem>
                            <SelectItem value="MT">MT</SelectItem>
                            <SelectItem value="LTR">LTR</SelectItem>
                            <SelectItem value="M">M</SelectItem>
                            <SelectItem value="SQM">SQM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amount_inr">Amount (INR)</Label>
                        <Input
                          id="amount_inr"
                          type="number"
                          value={formData.amount_inr}
                          onChange={(e) => setFormData({...formData, amount_inr: Number(e.target.value)})}
                          placeholder="Enter amount"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="remarks">Remarks</Label>
                      <Textarea
                        id="remarks"
                        value={formData.remarks}
                        onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                        placeholder="Enter any remarks"
                        rows={3}
                      />
                    </div>

                    {selectedItem && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Selected Item: <strong>{selectedItem.item_name}</strong> (Code: {selectedItem.item_code})
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Process GRN
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Recent GRNs */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Recent GRNs
                  </CardTitle>
                  <CardDescription>
                    Last 10 processed GRNs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentGRNs?.map((grn) => (
                      <div key={grn.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{grn.grn_number}</p>
                            <p className="text-sm text-muted-foreground">{grn.item_master?.item_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-green-600">+{grn.qty_received}</p>
                            <p className="text-xs text-muted-foreground">{new Date(grn.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {grn.vendor && (
                          <div className="mt-2">
                            <Badge variant="outline">{grn.vendor}</Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <GRNCSVUpload onUploadComplete={handleBulkUploadComplete} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default GRNProcessing