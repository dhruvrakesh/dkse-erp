import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ItemMasterInlineEditorProps {
  item: any;
  categories: any[];
  onSave: (updatedItem: any) => void;
  onCancel: () => void;
}

export const ItemMasterInlineEditor: React.FC<ItemMasterInlineEditorProps> = ({
  item,
  categories,
  onSave,
  onCancel
}) => {
  const [editedItem, setEditedItem] = useState(item);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setEditedItem(item);
  }, [item]);

  const handleFieldChange = (field: string, value: any) => {
    setEditedItem(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update the item in the database
      const { error } = await supabase
        .from('item_master')
        .update({
          item_name: editedItem.item_name,
          category_id: editedItem.category_id,
          qualifier: editedItem.qualifier || null,
          gsm: editedItem.gsm || null,
          size_mm: editedItem.size_mm || null,
          uom: editedItem.uom,
          usage_type: editedItem.usage_type || null,
          status: editedItem.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item updated successfully",
      });

      onSave(editedItem);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update item",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <tr className="bg-muted/50">
      <td className="p-2"></td>
      <td className="p-2">
        <div className="font-mono text-sm">{item.item_code}</div>
      </td>
      <td className="p-2">
        <Input
          value={editedItem.item_name || ''}
          onChange={(e) => handleFieldChange('item_name', e.target.value)}
          className="h-8 text-sm"
          placeholder="Item name"
        />
      </td>
      <td className="p-2">
        <Select
          value={editedItem.category_id || ''}
          onValueChange={(value) => handleFieldChange('category_id', value)}
        >
          <SelectTrigger className="h-8 text-sm">
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
      </td>
      <td className="p-2">
        <div className="font-mono text-sm">{item.stock?.[0]?.current_qty || 0}</div>
      </td>
      <td className="p-2">
        <Select
          value={editedItem.uom || ''}
          onValueChange={(value) => handleFieldChange('uom', value)}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PCS">PCS</SelectItem>
            <SelectItem value="KG">KG</SelectItem>
            <SelectItem value="MTR">MTR</SelectItem>
            <SelectItem value="SQM">SQM</SelectItem>
            <SelectItem value="LTR">LTR</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="p-2">
        <Select
          value={editedItem.status || ''}
          onValueChange={(value) => handleFieldChange('status', value)}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="p-2">
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 w-8 p-0"
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
            className="h-8 w-8 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

interface ItemMasterRowProps {
  item: any;
  categories: any[];
  isSelected: boolean;
  onSelectionChange: (item: any) => void;
  onUpdate: () => void;
  onDelete: (item: any) => void;
}

export const ItemMasterRow: React.FC<ItemMasterRowProps> = ({
  item,
  categories,
  isSelected,
  onSelectionChange,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    onUpdate();
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <ItemMasterInlineEditor
        item={item}
        categories={categories}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <tr className="hover:bg-muted/50">
      <td className="p-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelectionChange(item)}
          className="rounded border-gray-300"
        />
      </td>
      <td className="p-2 font-mono text-sm">{item.item_code}</td>
      <td className="p-2 font-medium">{item.item_name}</td>
      <td className="p-2">{item.categories?.category_name || 'N/A'}</td>
      <td className="p-2 font-mono">{item.stock?.[0]?.current_qty || 0}</td>
      <td className="p-2">{item.uom}</td>
      <td className="p-2">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          item.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {item.status}
        </span>
      </td>
      <td className="p-2">
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(item)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </td>
    </tr>
  );
};