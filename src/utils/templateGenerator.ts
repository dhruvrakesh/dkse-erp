
export interface TemplateConfig {
  filename: string;
  headers: string[];
  sampleData: Record<string, any>[];
}

export const templateConfigs: Record<string, TemplateConfig> = {
  openingStock: {
    filename: 'opening_stock_template.csv',
    headers: ['item_code', 'item_name', 'category', 'opening_qty', 'uom'],
    sampleData: [
      {
        item_code: 'RAW001',
        item_name: 'Raw Material Sample',
        category: 'Raw Materials',
        opening_qty: '100',
        uom: 'KG'
      },
      {
        item_code: 'PKG001',
        item_name: 'Packaging Sample',
        category: 'Packaging',
        opening_qty: '500',
        uom: 'PCS'
      },
      {
        item_code: 'FIN001',
        item_name: 'Finished Product Sample',
        category: 'Finished Goods',
        opening_qty: '50',
        uom: 'PCS'
      }
    ]
  },
  grn: {
    filename: 'grn_template.csv',
    headers: ['grn_number', 'date', 'item_code', 'qty_received', 'uom', 'invoice_number', 'amount_inr', 'vendor', 'remarks'],
    sampleData: [
      {
        grn_number: 'GRN001',
        date: '2024-01-15',
        item_code: 'RAW001',
        qty_received: '100',
        uom: 'KG',
        invoice_number: 'INV001',
        amount_inr: '5000',
        vendor: 'ABC Supplier',
        remarks: 'Regular delivery'
      },
      {
        grn_number: 'GRN001',
        date: '2024-01-15',
        item_code: 'PKG001',
        qty_received: '200',
        uom: 'PCS',
        invoice_number: 'INV001',
        amount_inr: '1500',
        vendor: 'ABC Supplier',
        remarks: 'Same GRN with different item'
      },
      {
        grn_number: 'GRN002',
        date: '2024-01-16',
        item_code: 'RAW002',
        qty_received: '50',
        uom: 'KG',
        invoice_number: 'INV002',
        amount_inr: '2500',
        vendor: 'XYZ Supplier',
        remarks: 'Single item GRN'
      }
    ]
  },
  issue: {
    filename: 'issue_template.csv',
    headers: ['date', 'item_code', 'qty_issued', 'purpose', 'remarks'],
    sampleData: [
      {
        date: '2024-01-15',
        item_code: 'RAW001',
        qty_issued: '50',
        purpose: 'production',
        remarks: 'For batch A001'
      },
      {
        date: '2024-01-16',
        item_code: 'PKG001',
        qty_issued: '100',
        purpose: 'maintenance',
        remarks: 'Equipment repair'
      }
    ]
  }
};

export const generateCSVTemplate = (templateType: keyof typeof templateConfigs): string => {
  const config = templateConfigs[templateType];
  
  // Create header row
  const headerRow = config.headers.join(',');
  
  // Create sample data rows
  const dataRows = config.sampleData.map(row => 
    config.headers.map(header => row[header] || '').join(',')
  );
  
  return [headerRow, ...dataRows].join('\n');
};

export const downloadCSVTemplate = (templateType: keyof typeof templateConfigs): void => {
  const config = templateConfigs[templateType];
  const csvContent = generateCSVTemplate(templateType);
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', config.filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};
