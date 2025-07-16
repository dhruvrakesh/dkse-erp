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
import { Minus, Package, Search, Calendar, User, FileText, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { ItemCombobox } from "@/components/ui/item-combobox"

interface IssueFormData {
  item_code: string
  qty_issued: number
  purpose: string
  date: string
  remarks: string
}

const IssueProcessing = () => {
  const [formData, setFormData] = useState<IssueFormData>({
    item_code: '',
    qty_issued: 0,
    purpose: '',
    date: new Date().toISOString().split('T')[0],
    remarks: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: items } = useQuery({
    queryKey: ['items-with-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_master')
        .select('*, stock!inner(current_qty)')
        .gt('stock.current_qty', 0)
        .eq('status', 'active')
        .order('item_name')
      
      if (error) throw error
      return data || []
    }
  })

  const { data: recentIssues } = useQuery({
    queryKey: ['recent-issues-detailed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issue_log')
        .select('*, item_master(item_name, uom)')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      return data || []
    }
  })

  const processingMutation = useMutation({
    mutationFn: async (data: IssueFormData) => {
      const { error } = await supabase
        .from('issue_log')
        .insert([{
          item_code: data.item_code,
          qty_issued: data.qty_issued,
          purpose: data.purpose,
          date: data.date,
          remarks: data.remarks
        }])
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-issues-detailed'] })
      queryClient.invalidateQueries({ queryKey: ['stock-summary'] })
      queryClient.invalidateQueries({ queryKey: ['items-with-stock'] })
      toast({
        title: "Issue Processed Successfully",
        description: `${formData.qty_issued} units issued for ${formData.purpose}`,
      })
      setFormData({
        item_code: '',
        qty_issued: 0,
        purpose: '',
        date: new Date().toISOString().split('T')[0],
        remarks: ''
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error Processing Issue",
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
  const availableStock = selectedItem?.stock?.[0]?.current_qty || 0
  const isStockSufficient = availableStock >= formData.qty_issued

  const purposeOptions = [
    'Production',
    'Maintenance',
    'Sample',
    'R&D',
    'Quality Testing',
    'Wastage',
    'Transfer',
    'Other'
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Issue Processing</h1>
        <p className="text-muted-foreground">Process stock issues and update inventory</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Issue Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-4 w-4" />
                New Issue Entry
              </CardTitle>
              <CardDescription>
                Enter details for stock issue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="item_code">Item *</Label>
                    <ItemCombobox
                      items={items || []}
                      value={formData.item_code}
                      onValueChange={(value) => setFormData({...formData, item_code: value})}
                      placeholder="Select item..."
                      showStockLevel={true}
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
                    <Label htmlFor="qty_issued">Quantity to Issue *</Label>
                    <Input
                      id="qty_issued"
                      type="number"
                      value={formData.qty_issued}
                      onChange={(e) => setFormData({...formData, qty_issued: Number(e.target.value)})}
                      placeholder="Enter quantity"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose *</Label>
                    <Select value={formData.purpose} onValueChange={(value) => setFormData({...formData, purpose: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        {purposeOptions.map(purpose => (
                          <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <Alert className={isStockSufficient ? "border-green-200" : "border-red-200"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p>Selected Item: <strong>{selectedItem.item_name}</strong> (Code: {selectedItem.item_code})</p>
                        <p>Available Stock: <strong>{availableStock}</strong> units</p>
                        {!isStockSufficient && formData.qty_issued > 0 && (
                          <p className="text-red-600">
                            <AlertTriangle className="inline h-4 w-4 mr-1" />
                            Insufficient stock! Available: {availableStock}, Required: {formData.qty_issued}
                          </p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  disabled={isSubmitting || !isStockSufficient || formData.qty_issued === 0} 
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Minus className="mr-2 h-4 w-4" />
                      Process Issue
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Recent Issues */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Recent Issues
              </CardTitle>
              <CardDescription>
                Last 10 processed issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentIssues?.map((issue) => (
                  <div key={issue.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{issue.purpose}</p>
                        <p className="text-sm text-muted-foreground">{issue.item_master?.item_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-red-600">-{issue.qty_issued}</p>
                        <p className="text-xs text-muted-foreground">{new Date(issue.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default IssueProcessing