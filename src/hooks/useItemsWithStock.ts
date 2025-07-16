
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useItemsWithStock = () => {
  return useQuery({
    queryKey: ['items-with-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_master')
        .select(`
          item_code,
          item_name,
          uom,
          status,
          categories(category_name),
          stock(current_qty)
        `)
        .or('status.eq.active,status.eq.Active')
        .order('item_name')
      
      if (error) {
        console.error('Error fetching items with stock:', error)
        throw error
      }
      
      console.log('Fetched items:', data?.length || 0)
      
      return (data || []).map(item => ({
        item_code: item.item_code,
        item_name: item.item_name,
        uom: item.uom,
        category_name: item.categories?.category_name || 'Uncategorized',
        current_qty: item.stock?.current_qty || 0,
        status: item.status
      }))
    }
  })
}
