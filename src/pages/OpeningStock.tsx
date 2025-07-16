import React from 'react';
import { CSVUpload } from '@/components/csv/CSVUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const OpeningStock = () => {
  const expectedHeaders = [
    'item_code',
    'opening_qty',
    'item_name',
    'category',
    'uom'
  ];

  const processOpeningStock = async (data: any[]) => {
    const results = { success: 0, errors: [] as any[] };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Find or create category
        let categoryId = null;
        if (row.category) {
          const { data: existingCategory } = await supabase
            .from('categories')
            .select('id')
            .ilike('category_name', row.category)
            .single();

          if (existingCategory) {
            categoryId = existingCategory.id;
          } else {
            const { data: newCategory, error: categoryError } = await supabase
              .from('categories')
              .insert({
                category_name: row.category,
                description: `Auto-created from CSV import`
              })
              .select('id')
              .single();

            if (categoryError) throw categoryError;
            categoryId = newCategory.id;
          }
        }

        // Create or update item master
        const { error: itemError } = await supabase
          .from('item_master')
          .upsert({
            item_code: row.item_code,
            item_name: row.item_name || row.item_code,
            category_id: categoryId,
            uom: row.uom || 'PCS',
            status: 'active'
          });

        if (itemError) throw itemError;

        // Create or update stock record
        const openingQty = parseFloat(row.opening_qty) || 0;
        
        const { error: stockError } = await supabase
          .from('stock')
          .upsert({
            item_code: row.item_code,
            opening_qty: openingQty,
            current_qty: openingQty
          });

        if (stockError) throw stockError;

        results.success++;
      } catch (error) {
        results.errors.push({
          row: i + 1,
          message: error instanceof Error ? error.message : 'Unknown error',
          data: row
        });
      }
    }

    return results;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Opening Stock Import</h1>
        <p className="text-muted-foreground mt-2">
          Import your opening stock data from CSV files. The system will automatically create items and categories if they don't exist.
        </p>
      </div>

      <div className="max-w-4xl">
        <CSVUpload
          title="Opening Stock CSV Upload"
          description="Upload a CSV file with opening stock data. Required columns: item_code, opening_qty. Optional: item_name, category, uom"
          expectedHeaders={expectedHeaders}
          onDataProcessed={processOpeningStock}
        />
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">CSV Format Example:</h3>
          <pre className="text-sm overflow-x-auto">
{`item_code,item_name,category,opening_qty,uom
RAW001,Raw Material 1,Raw Materials,100,KG
PKG001,Packaging Item 1,Packaging,500,PCS
FIN001,Finished Product 1,Finished Goods,50,PCS`}
          </pre>
          
          <div className="mt-4">
            <h4 className="font-medium mb-2">Important Notes:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• item_code and opening_qty are required fields</li>
              <li>• Categories will be auto-created if they don't exist</li>
              <li>• Default UOM is 'PCS' if not specified</li>
              <li>• Existing items will be updated with new opening stock</li>
              <li>• Current stock will be set to opening stock value</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpeningStock;