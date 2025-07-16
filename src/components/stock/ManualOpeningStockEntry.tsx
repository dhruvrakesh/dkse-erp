
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ItemCombobox } from "@/components/ui/item-combobox"
import { useItemsWithStock } from "@/hooks/useItemsWithStock"
import { useToast } from "@/hooks/use-toast"
import { Plus, Package, AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ManualOpeningStockEntry() {
  const [selectedItem, setSelectedItem] = useState("")
  const [isNewItem, setIsNewItem] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: items = [], isLoading: itemsLoading, error: itemsError, refetch: refetchItems } = useItemsWithStock()

  const createOpeningStockMutation = useMutation({
    mutationFn: async (data: any) => {
      let itemCode = data.item_code

      // If creating a new item, create it first
      if (isNewItem) {
        const { data: newItem, error: itemError } = await supabase
          .from('item_master')
          .insert({
            item_code: data.item_code,
            item_name: data.item_name,
            uom: data.uom || 'PCS',
            status: 'active'
          })
          .select('item_code')
          .single()

        if (itemError) throw itemError
        itemCode = newItem.item_code
      }

      // Create or update stock record
      const { error: stockError } = await supabase
        .from('stock')
        .upsert({
          item_code: itemCode,
          opening_qty: data.opening_qty,
          current_qty: data.opening_qty
        })

      if (stockError) throw stockError
      return { item_code: itemCode }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items-with-stock'] })
      queryClient.invalidateQueries({ queryKey: ['stock-summary'] })
      toast({
        title: "Success",
        description: "Opening stock entry created successfully",
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const data = {
      item_code: isNewItem ? formData.get('new_item_code') : selectedItem,
      item_name: formData.get('item_name') as string,
      uom: formData.get('uom') as string,
      opening_qty: parseFloat(formData.get('opening_qty') as string)
    }

    createOpeningStockMutation.mutate(data)
    ;(e.target as HTMLFormElement).reset()
    setSelectedItem("")
    setIsNewItem(false)
  }

  const selectedItemDetails = items.find(item => item.item_code === selectedItem)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="mr-2 h-4 w-4" />
          Manual Opening Stock Entry
        </CardTitle>
        <CardDescription>Add opening stock for individual items</CardDescription>
      </CardHeader>
      <CardContent>
        {itemsError && (
          <Alert variant="destructive" className="mb-4">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Item Selection</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={!isNewItem ? "default" : "outline"}
                onClick={() => setIsNewItem(false)}
                className="flex-1"
              >
                Existing Item
              </Button>
              <Button
                type="button"
                variant={isNewItem ? "default" : "outline"}
                onClick={() => setIsNewItem(true)}
                className="flex-1"
              >
                New Item
              </Button>
            </div>
          </div>

          {!isNewItem ? (
            <div className="space-y-2">
              <Label htmlFor="item_code">Select Item *</Label>
              <ItemCombobox
                items={items}
                value={selectedItem}
                onValueChange={setSelectedItem}
                placeholder="Search and select item..."
                showStockLevel={true}
                isLoading={itemsLoading}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new_item_code">Item Code *</Label>
                <Input
                  id="new_item_code"
                  name="new_item_code"
                  placeholder="Enter item code"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item_name">Item Name *</Label>
                <Input
                  id="item_name"
                  name="item_name"
                  placeholder="Enter item name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uom">UOM *</Label>
                <Input
                  id="uom"
                  name="uom"
                  placeholder="e.g., PCS, KG, L"
                  defaultValue="PCS"
                  required
                />
              </div>
            </div>
          )}

          {!isNewItem && selectedItemDetails && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm space-y-1">
                <div><span className="font-medium">Current Stock:</span> {selectedItemDetails.current_qty} {selectedItemDetails.uom}</div>
                <div><span className="font-medium">Category:</span> {selectedItemDetails.category_name}</div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="opening_qty">Opening Quantity *</Label>
            <Input
              id="opening_qty"
              name="opening_qty"
              type="number"
              step="0.01"
              placeholder="0"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={createOpeningStockMutation.isPending || (!isNewItem && !selectedItem)}
          >
            {createOpeningStockMutation.isPending ? "Processing..." : "Add Opening Stock"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
