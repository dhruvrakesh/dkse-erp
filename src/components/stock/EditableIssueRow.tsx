import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { Edit, Save, X, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface IssueData {
  id: string;
  date: string;
  item_code: string;
  qty_issued: number;
  purpose: string | null;
  remarks: string | null;
}

interface EditableIssueRowProps {
  issue: IssueData;
  availableStock?: number;
}

export const EditableIssueRow: React.FC<EditableIssueRowProps> = ({ 
  issue, 
  availableStock = 0 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(issue);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<IssueData>) => {
      const { error } = await supabase
        .from('issue_log')
        .update(data)
        .eq('id', issue.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-issues'] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Issue entry updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update issue: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('issue_log')
        .delete()
        .eq('id', issue.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-issues'] });
      toast({
        title: "Success",
        description: "Issue entry deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete issue: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (editData.qty_issued <= 0) {
      toast({
        title: "Validation Error",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    // Check if new quantity exceeds available stock + current issue quantity
    const maxAllowedQty = availableStock + issue.qty_issued;
    if (editData.qty_issued > maxAllowedQty) {
      toast({
        title: "Validation Error",
        description: `Insufficient stock. Maximum allowed: ${maxAllowedQty}`,
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      date: editData.date,
      qty_issued: editData.qty_issued,
      purpose: editData.purpose,
      remarks: editData.remarks,
    });
  };

  const handleCancel = () => {
    setEditData(issue);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>
          <Input
            type="date"
            value={editData.date}
            onChange={(e) => setEditData({...editData, date: e.target.value})}
          />
        </TableCell>
        <TableCell>{editData.item_code}</TableCell>
        <TableCell>
          <Input
            type="number"
            value={editData.qty_issued}
            onChange={(e) => setEditData({...editData, qty_issued: Number(e.target.value)})}
          />
        </TableCell>
        <TableCell>
          <Input
            value={editData.purpose || ''}
            onChange={(e) => setEditData({...editData, purpose: e.target.value})}
          />
        </TableCell>
        <TableCell>
          <Input
            value={editData.remarks || ''}
            onChange={(e) => setEditData({...editData, remarks: e.target.value})}
          />
        </TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>{issue.date}</TableCell>
      <TableCell>{issue.item_code}</TableCell>
      <TableCell>{issue.qty_issued}</TableCell>
      <TableCell>{issue.purpose || '-'}</TableCell>
      <TableCell>{issue.remarks || '-'}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Issue Entry</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this issue entry? This will reverse the stock deduction and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
};