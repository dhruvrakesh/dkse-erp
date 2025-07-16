import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  Tag,
  Package
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

const Categories = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: categories, isLoading, error, refetch } = useQuery({
    queryKey: ['categories-management'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('category_name')
      
      if (error) throw error
      return data || []
    }
  })

  const { data: itemCounts } = useQuery({
    queryKey: ['category-item-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_master')
        .select('category_id, categories(category_name)')
        .eq('status', 'active')
      
      if (error) throw error
      
      const counts: Record<string, number> = {}
      data?.forEach(item => {
        const categoryName = item.categories?.category_name || 'Uncategorized'
        counts[categoryName] = (counts[categoryName] || 0) + 1
      })
      
      return counts
    }
  })

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: { category_name: string, description?: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .insert(categoryData)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-management'] })
      queryClient.invalidateQueries({ queryKey: ['category-item-counts'] })
      toast({
        title: "Success",
        description: "Category created successfully",
      })
      setIsCreateOpen(false)
      setNewCategory({ name: '', description: '' })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  })

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, categoryData }: { id: string, categoryData: { category_name: string, description?: string } }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', id)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-management'] })
      toast({
        title: "Success",
        description: "Category updated successfully",
      })
      setEditingCategory(null)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      // Check if category has items
      const { data: items, error: itemError } = await supabase
        .from('item_master')
        .select('id')
        .eq('category_id', categoryId)
        .limit(1)

      if (itemError) throw itemError
      
      if (items && items.length > 0) {
        throw new Error('Cannot delete category that has items. Please reassign items first.')
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-management'] })
      queryClient.invalidateQueries({ queryKey: ['category-item-counts'] })
      toast({
        title: "Success",
        description: "Category deleted successfully",
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

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      })
      return
    }
    
    createCategoryMutation.mutate({
      category_name: newCategory.name.trim(),
      description: newCategory.description.trim() || undefined
    })
  }

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory.category_name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      })
      return
    }
    
    updateCategoryMutation.mutate({
      id: editingCategory.id,
      categoryData: {
        category_name: editingCategory.category_name.trim(),
        description: editingCategory.description?.trim() || undefined
      }
    })
  }

  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      deleteCategoryMutation.mutate(categoryId)
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading categories: {error.message}
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
          <h1 className="text-3xl font-bold">Categories Management</h1>
          <p className="text-muted-foreground">Manage item categories and their organization</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
                <DialogDescription>
                  Add a new category to organize your items
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Category Name *</Label>
                  <Input
                    id="category-name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="Enter category name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category-description">Description</Label>
                  <Textarea
                    id="category-description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    placeholder="Enter category description"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCategoryMutation.isPending}>
                    {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {itemCounts ? Object.values(itemCounts).reduce((sum, count) => sum + count, 0) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Categorized items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Items per Category</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories?.length && itemCounts ? 
                Math.round(Object.values(itemCounts).reduce((sum, count) => sum + count, 0) / categories.length) : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">Items per category</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Categories ({categories?.length || 0})</CardTitle>
          <CardDescription>
            Manage your item categories and their descriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Items Count</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Loading categories...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : categories?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No categories found. Create your first category to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories?.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.category_name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {itemCounts?.[category.category_name] || 0} items
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(category.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={deleteCategoryMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category name and description
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category-name">Category Name *</Label>
                <Input
                  id="edit-category-name"
                  value={editingCategory.category_name}
                  onChange={(e) => setEditingCategory({
                    ...editingCategory,
                    category_name: e.target.value
                  })}
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category-description">Description</Label>
                <Textarea
                  id="edit-category-description"
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({
                    ...editingCategory,
                    description: e.target.value
                  })}
                  placeholder="Enter category description"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCategoryMutation.isPending}>
                  {updateCategoryMutation.isPending ? "Updating..." : "Update Category"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Categories