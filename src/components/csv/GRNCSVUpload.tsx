import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Download, AlertTriangle, CheckCircle, X, FileText, AlertCircle } from 'lucide-react';
import { downloadCSVTemplate } from '@/utils/templateGenerator';

interface CSVData {
  headers: string[];
  rows: any[][];
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  data: any;
}

interface GRNCSVUploadProps {
  onUploadComplete: () => void;
}

export const GRNCSVUpload: React.FC<GRNCSVUploadProps> = ({
  onUploadComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    errors: any[];
    total: number;
  } | null>(null);

  const requiredHeaders = ['grn_number', 'date', 'item_code', 'qty_received', 'uom'];
  const optionalHeaders = ['invoice_number', 'amount_inr', 'vendor', 'remarks'];

  const downloadTemplate = () => {
    downloadCSVTemplate('grn');
  };

  const parseCSV = (text: string): CSVData => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) throw new Error('CSV file is empty');
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      const cells = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cells.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current.trim().replace(/^"|"$/g, ''));
      return cells;
    });
    
    return { headers, rows };
  };

  const validateRow = (rowData: any, rowIndex: number): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!rowData.grn_number?.trim()) {
      errors.push({
        row: rowIndex + 2,
        field: 'grn_number',
        message: 'GRN number is required',
        data: rowData
      });
    }

    if (!rowData.date?.trim()) {
      errors.push({
        row: rowIndex + 2,
        field: 'date',
        message: 'Date is required',
        data: rowData
      });
    } else {
      const date = new Date(rowData.date);
      if (isNaN(date.getTime())) {
        errors.push({
          row: rowIndex + 2,
          field: 'date',
          message: 'Invalid date format',
          data: rowData
        });
      }
    }

    if (!rowData.item_code?.trim()) {
      errors.push({
        row: rowIndex + 2,
        field: 'item_code',
        message: 'Item code is required',
        data: rowData
      });
    }

    if (!rowData.qty_received?.trim()) {
      errors.push({
        row: rowIndex + 2,
        field: 'qty_received',
        message: 'Quantity received is required',
        data: rowData
      });
    } else {
      const qty = parseFloat(rowData.qty_received);
      if (isNaN(qty) || qty <= 0) {
        errors.push({
          row: rowIndex + 2,
          field: 'qty_received',
          message: 'Quantity must be a positive number',
          data: rowData
        });
      }
    }

    if (!rowData.uom?.trim()) {
      errors.push({
        row: rowIndex + 2,
        field: 'uom',
        message: 'UOM is required',
        data: rowData
      });
    }

    return errors;
  };

  const validateItemCodes = async (dataObjects: any[]): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];
    
    // Get all unique item codes
    const itemCodes = [...new Set(dataObjects.map(row => row.item_code))];
    
    // Check if all item codes exist
    const { data: existingItems, error } = await supabase
      .from('item_master')
      .select('item_code, item_name, uom')
      .in('item_code', itemCodes);
    
    if (error) {
      throw error;
    }

    const existingItemCodes = new Set(existingItems?.map(item => item.item_code) || []);
    
    dataObjects.forEach((row, index) => {
      if (!existingItemCodes.has(row.item_code)) {
        errors.push({
          row: index + 2,
          field: 'item_code',
          message: `Item code '${row.item_code}' does not exist in item master`,
          data: row
        });
      }
    });

    return errors;
  };

  const checkDuplicateGRNs = async (dataObjects: any[]): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];
    
    // Check for duplicates within the CSV (grn_number + item_code combination)
    const seen = new Set();
    dataObjects.forEach((row, index) => {
      const grnItemKey = `${row.grn_number}|${row.item_code}`;
      if (seen.has(grnItemKey)) {
        errors.push({
          row: index + 2,
          field: 'grn_number',
          message: `Duplicate GRN number '${row.grn_number}' with item code '${row.item_code}' found in CSV`,
          data: row
        });
      }
      seen.add(grnItemKey);
    });

    // Check for duplicates in database (grn_number + item_code combination)
    const { data: existingGRNs, error } = await supabase
      .from('grn_log')
      .select('grn_number, item_code')
      .in('grn_number', [...new Set(dataObjects.map(row => row.grn_number))]);
    
    if (error) {
      throw error;
    }

    const existingGRNItemCombinations = new Set(
      existingGRNs?.map(grn => `${grn.grn_number}|${grn.item_code}`) || []
    );
    
    dataObjects.forEach((row, index) => {
      const grnItemKey = `${row.grn_number}|${row.item_code}`;
      if (existingGRNItemCombinations.has(grnItemKey)) {
        errors.push({
          row: index + 2,
          field: 'grn_number',
          message: `GRN number '${row.grn_number}' with item code '${row.item_code}' already exists in database`,
          data: row
        });
      }
    });

    return errors;
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);
    setValidationErrors([]);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvData = parseCSV(event.target?.result as string);
        setCsvData(csvData);
        
        // Validate headers
        const missingHeaders = requiredHeaders.filter(
          header => !csvData.headers.some(h => 
            h.toLowerCase() === header.toLowerCase()
          )
        );
        
        if (missingHeaders.length > 0) {
          toast({
            title: "Missing required columns",
            description: `Please ensure your CSV has: ${missingHeaders.join(', ')}`,
            variant: "destructive"
          });
          return;
        }

        // Convert to objects and validate
        const dataObjects = csvData.rows.map(row => {
          const obj: any = {};
          csvData.headers.forEach((header, index) => {
            obj[header.toLowerCase()] = row[index] || '';
          });
          return obj;
        });

        // Validate each row
        const allErrors: ValidationError[] = [];
        dataObjects.forEach((rowData, index) => {
          const errors = validateRow(rowData, index);
          allErrors.push(...errors);
        });

        // Check item codes exist
        if (allErrors.length === 0) {
          const itemCodeErrors = await validateItemCodes(dataObjects);
          allErrors.push(...itemCodeErrors);
        }

        // Check for duplicate GRNs
        if (allErrors.length === 0) {
          const duplicateErrors = await checkDuplicateGRNs(dataObjects);
          allErrors.push(...duplicateErrors);
        }

        setValidationErrors(allErrors);

      } catch (error) {
        toast({
          title: "Error parsing CSV",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive"
        });
      }
    };
    
    reader.readAsText(selectedFile);
  }, []);

  const processUpload = async () => {
    if (!csvData || !file || validationErrors.length > 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Convert CSV data to objects
      const dataObjects = csvData.rows.map((row, index) => {
        const obj: any = {};
        csvData.headers.forEach((header, headerIndex) => {
          obj[header.toLowerCase()] = row[headerIndex] || '';
        });
        return { ...obj, originalRowIndex: index + 2 };
      });

      // Process data in batches
      const batchSize = 10;
      let totalSuccess = 0;
      let allErrors: any[] = [];

      for (let i = 0; i < dataObjects.length; i += batchSize) {
        const batch = dataObjects.slice(i, i + batchSize);
        
        for (const item of batch) {
          try {
            // Prepare data for insertion
            const grnData = {
              grn_number: item.grn_number,
              date: item.date,
              item_code: item.item_code,
              qty_received: parseFloat(item.qty_received),
              uom: item.uom,
              invoice_number: item.invoice_number || null,
              amount_inr: item.amount_inr ? parseFloat(item.amount_inr) : null,
              vendor: item.vendor || null,
              remarks: item.remarks || null
            };

            // Insert GRN record
            const { error: insertError } = await supabase
              .from('grn_log')
              .insert(grnData);

            if (insertError) {
              allErrors.push({
                row: item.originalRowIndex,
                message: `Error inserting GRN: ${insertError.message}`,
                data: item
              });
            } else {
              totalSuccess++;
            }
          } catch (error) {
            allErrors.push({
              row: item.originalRowIndex,
              message: error instanceof Error ? error.message : 'Unknown error',
              data: item
            });
          }
        }
        
        setProgress(Math.round(((i + batch.length) / dataObjects.length) * 100));
      }

      // Log the upload
      try {
        await supabase.from('csv_upload_log').insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          file_name: file.name,
          file_type: 'grn',
          total_rows: dataObjects.length,
          success_rows: totalSuccess,
          error_rows: allErrors.length,
          errors: allErrors.length > 0 ? allErrors : null
        });
      } catch (logError) {
        console.error('Error logging upload:', logError);
      }

      setUploadResult({
        success: totalSuccess,
        errors: allErrors,
        total: dataObjects.length
      });

      if (totalSuccess > 0) {
        toast({
          title: "Upload completed",
          description: `Successfully processed ${totalSuccess} out of ${dataObjects.length} GRN records`,
        });
        onUploadComplete();
      }

    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="mr-2 h-4 w-4" />
          Bulk GRN Upload
        </CardTitle>
        <CardDescription>
          Upload multiple GRN records from a CSV file. Same GRN number can be used for multiple items.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Download */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="font-medium">Download Template</p>
            <p className="text-sm text-muted-foreground">
              Get the CSV template with required columns
            </p>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="csv-file">Select CSV File</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={isProcessing}
          />
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">
                  Found {validationErrors.length} validation errors:
                </p>
                <div className="max-h-40 overflow-y-auto">
                  {validationErrors.slice(0, 10).map((error, index) => (
                    <div key={index} className="text-sm">
                      Row {error.row}, {error.field}: {error.message}
                    </div>
                  ))}
                  {validationErrors.length > 10 && (
                    <div className="text-sm text-muted-foreground">
                      ... and {validationErrors.length - 10} more errors
                    </div>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* File Preview */}
        {csvData && validationErrors.length === 0 && (
          <div className="space-y-2">
            <Label>File Preview ({csvData.rows.length} rows)</Label>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {csvData.headers.map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.rows.slice(0, 5).map((row, index) => (
                    <TableRow key={index}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {csvData.rows.length > 5 && (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  ... and {csvData.rows.length - 5} more rows
                </div>
              )}
            </div>
          </div>
        )}

        {/* Process Button */}
        {csvData && validationErrors.length === 0 && (
          <Button
            onClick={processUpload}
            disabled={isProcessing || validationErrors.length > 0}
            className="w-full"
          >
            {isProcessing ? (
              <>Processing... ({progress}%)</>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Process {csvData.rows.length} GRN Records
              </>
            )}
          </Button>
        )}

        {/* Progress Bar */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing GRN records...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Results */}
        {uploadResult && (
          <Alert variant={uploadResult.errors.length > 0 ? "destructive" : "default"}>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Upload Summary:</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total:</span> {uploadResult.total}
                  </div>
                  <div>
                    <span className="font-medium text-green-600">Success:</span> {uploadResult.success}
                  </div>
                  <div>
                    <span className="font-medium text-red-600">Errors:</span> {uploadResult.errors.length}
                  </div>
                </div>
                {uploadResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-red-600">Errors:</p>
                    <div className="max-h-40 overflow-y-auto">
                      {uploadResult.errors.slice(0, 5).map((error, index) => (
                        <div key={index} className="text-sm">
                          Row {error.row}: {error.message}
                        </div>
                      ))}
                      {uploadResult.errors.length > 5 && (
                        <div className="text-sm text-muted-foreground">
                          ... and {uploadResult.errors.length - 5} more errors
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};