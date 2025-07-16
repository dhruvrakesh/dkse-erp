import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Download, Upload } from 'lucide-react';

interface ItemMasterBulkActionsProps {
  selectedItems: any[];
  onSelectionChange: (items: any[]) => void;
  allItems: any[];
  categories: any[];
}

export const ItemMasterBulkActions: React.FC<ItemMasterBulkActionsProps> = ({
  selectedItems,
  onSelectionChange,
  allItems,
  categories
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'status' | 'category' | 'export'>('status');
  const [newStatus, setNewStatus] = useState<'active' | 'inactive'>('active');
  const [newCategoryId, setNewCategoryId] = useState('');
  const queryClient = useQueryClient();

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ action, value }: { action: string, value: any }) => {
      const itemCodes = selectedItems.map(item => item.item_code);
      
      if (action === 'status') {
        const { error } = await supabase
          .from('item_master')
          .update({ status: value, updated_at: new Date().toISOString() })
          .in('item_code', itemCodes);
        
        if (error) throw error;
      } else if (action === 'category') {
        const { error } = await supabase
          .from('item_master')
          .update({ category_id: value, updated_at: new Date().toISOString() })
          .in('item_code', itemCodes);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-master'] });
      setIsDialogOpen(false);
      onSelectionChange([]);
      toast({
        title: "Success",
        description: `Updated ${selectedItems.length} items successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleBulkUpdate = () => {
    if (bulkAction === 'status') {
      bulkUpdateMutation.mutate({ action: 'status', value: newStatus });
    } else if (bulkAction === 'category') {
      if (!newCategoryId) {
        toast({
          title: "Error",
          description: "Please select a category",
          variant: "destructive",
        });
        return;
      }
      bulkUpdateMutation.mutate({ action: 'category', value: newCategoryId });
    }
  };

  const exportToCSV = () => {
    const itemsToExport = selectedItems.length > 0 ? selectedItems : allItems;
    
    const headers = [
      'item_code', 'item_name', 'category_name', 'qualifier', 
      'gsm', 'size_mm', 'uom', 'usage_type', 'status', 'current_stock'
    ];
    
    const csvData = itemsToExport.map(item => [
      item.item_code,
      item.item_name,
      item.categories?.category_name || '',
      item.qualifier || '',
      item.gsm || '',
      item.size_mm || '',
      item.uom,
      item.usage_type || '',
      item.status,
      item.stock?.[0]?.current_qty || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `item_master_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${itemsToExport.length} items to CSV`,
    });
  };

  const selectAll = () => {
    onSelectionChange(allItems);
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Bulk Actions
        </CardTitle>
        <CardDescription>
          Perform actions on multiple items at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedItems.length} of {allItems.length} items selected
            </span>
            {selectedItems.length > 0 && (
              <Badge variant="secondary">
                {selectedItems.length}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={selectedItems.length === 0}
              >
                <Upload className="h-4 w-4 mr-2" />
                Bulk Update
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Update Items</DialogTitle>
                <DialogDescription>
                  Update {selectedItems.length} selected items
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Action Type</Label>
                  <Select value={bulkAction} onValueChange={(value: 'status' | 'category') => setBulkAction(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="status">Update Status</SelectItem>
                      <SelectItem value="category">Change Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {bulkAction === 'status' && (
                  <div className="space-y-2">
                    <Label>New Status</Label>
                    <Select value={newStatus} onValueChange={(value: 'active' | 'inactive') => setNewStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {bulkAction === 'category' && (
                  <div className="space-y-2">
                    <Label>New Category</Label>
                    <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.category_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                  <p className="text-sm font-medium mb-2">Items to update:</p>
                  {selectedItems.slice(0, 5).map((item, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      {item.item_code} - {item.item_name}
                    </div>
                  ))}
                  {selectedItems.length > 5 && (
                    <div className="text-sm text-muted-foreground">
                      ... and {selectedItems.length - 5} more items
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleBulkUpdate} 
                  disabled={bulkUpdateMutation.isPending}
                >
                  {bulkUpdateMutation.isPending ? "Updating..." : "Update Items"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {selectedItems.length > 0 && (
          <div className="border rounded-md p-3 bg-muted/50">
            <p className="text-sm font-medium mb-2">Selected Items:</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {selectedItems.slice(0, 6).map((item, index) => (
                <div key={index} className="truncate">
                  {item.item_code}
                </div>
              ))}
              {selectedItems.length > 6 && (
                <div className="text-muted-foreground col-span-2">
                  ... {selectedItems.length - 6} more
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};