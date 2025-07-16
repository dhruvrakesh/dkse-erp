import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Download, AlertTriangle, CheckCircle, X, FileText, AlertCircle } from 'lucide-react';

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

interface ConflictItem {
  row: number;
  item_code: string;
  action: 'skip' | 'update' | 'error';
  data: any;
}

interface ItemMasterCSVUploadProps {
  categories: any[];
  onUploadComplete: () => void;
}

export const ItemMasterCSVUpload: React.FC<ItemMasterCSVUploadProps> = ({
  categories,
  onUploadComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    errors: any[];
    total: number;
  } | null>(null);

  const requiredHeaders = ['item_name', 'category_name', 'uom'];
  const optionalHeaders = ['qualifier', 'gsm', 'size_mm', 'usage_type', 'status'];

  const downloadTemplate = () => {
    const headers = [...requiredHeaders, ...optionalHeaders];
    const sampleData = [
      'Sample Item 1,Raw Materials,PCS,PREMIUM,80,100x200,Production,active',
      'Sample Item 2,Finished Goods,KG,,150,,Maintenance,active'
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'item_master_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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

    // Required field validation
    if (!rowData.item_name?.trim()) {
      errors.push({
        row: rowIndex + 2,
        field: 'item_name',
        message: 'Item name is required',
        data: rowData
      });
    }

    if (!rowData.category_name?.trim()) {
      errors.push({
        row: rowIndex + 2,
        field: 'category_name',
        message: 'Category name is required',
        data: rowData
      });
    } else {
      // Check if category exists
      const categoryExists = categories.find(cat => 
        cat.category_name.toLowerCase() === rowData.category_name.toLowerCase()
      );
      if (!categoryExists) {
        errors.push({
          row: rowIndex + 2,
          field: 'category_name',
          message: `Category '${rowData.category_name}' does not exist`,
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

    // GSM validation
    if (rowData.gsm && isNaN(parseFloat(rowData.gsm))) {
      errors.push({
        row: rowIndex + 2,
        field: 'gsm',
        message: 'GSM must be a valid number',
        data: rowData
      });
    }

    // Status validation
    if (rowData.status && !['active', 'inactive'].includes(rowData.status.toLowerCase())) {
      errors.push({
        row: rowIndex + 2,
        field: 'status',
        message: 'Status must be either "active" or "inactive"',
        data: rowData
      });
    }

    return errors;
  };

  const checkForConflicts = async (dataObjects: any[]): Promise<ConflictItem[]> => {
    const conflicts: ConflictItem[] = [];
    
    for (let i = 0; i < dataObjects.length; i++) {
      const row = dataObjects[i];
      
      // Generate item code to check for conflicts
      const category = categories.find(cat => 
        cat.category_name.toLowerCase() === row.category_name?.toLowerCase()
      );
      
      if (category) {
        try {
          const { data: generatedCode, error } = await supabase
            .rpc('generate_item_code', {
              category_name: category.category_name,
              qualifier: row.qualifier || '',
              size_mm: row.size_mm || '',
              gsm: row.gsm ? parseFloat(row.gsm) : null
            });

          if (!error && generatedCode) {
            // Check if item code already exists
            const { data: existingItem, error: checkError } = await supabase
              .from('item_master')
              .select('item_code, item_name')
              .eq('item_code', generatedCode)
              .single();

            if (!checkError && existingItem) {
              conflicts.push({
                row: i + 2,
                item_code: generatedCode,
                action: 'skip',
                data: { ...row, generated_code: generatedCode }
              });
            }
          }
        } catch (error) {
          console.error('Error checking for conflicts:', error);
        }
      }
    }
    
    return conflicts;
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
    setConflicts([]);

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

        setValidationErrors(allErrors);

        // Check for conflicts only if no validation errors
        if (allErrors.length === 0) {
          const conflicts = await checkForConflicts(dataObjects);
          setConflicts(conflicts);
        }

      } catch (error) {
        toast({
          title: "Error parsing CSV",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive"
        });
      }
    };
    
    reader.readAsText(selectedFile);
  }, [categories]);

  const processUpload = async () => {
    if (!csvData || !file) return;

    // Show conflict dialog if there are conflicts
    if (conflicts.length > 0) {
      setShowConflictDialog(true);
      return;
    }

    await executeUpload();
  };

  const executeUpload = async () => {
    if (!csvData || !file) return;

    setIsProcessing(true);
    setProgress(0);
    setShowConflictDialog(false);

    try {
      // Convert CSV data to objects
      const dataObjects = csvData.rows.map((row, index) => {
        const obj: any = {};
        csvData.headers.forEach((header, headerIndex) => {
          obj[header.toLowerCase()] = row[headerIndex] || '';
        });
        return { ...obj, originalRowIndex: index + 2 };
      });

      // Filter out conflicted items based on user selection
      const itemsToProcess = dataObjects.filter((item, index) => {
        const conflict = conflicts.find(c => c.row === index + 2);
        return !conflict || conflict.action !== 'skip';
      });

      // Process data in batches
      const batchSize = 10;
      let totalSuccess = 0;
      let allErrors: any[] = [];

      for (let i = 0; i < itemsToProcess.length; i += batchSize) {
        const batch = itemsToProcess.slice(i, i + batchSize);
        
        for (const item of batch) {
          try {
            // Find category
            const category = categories.find(cat => 
              cat.category_name.toLowerCase() === item.category_name?.toLowerCase()
            );

            if (!category) {
              allErrors.push({
                row: item.originalRowIndex,
                message: `Category '${item.category_name}' not found`
              });
              continue;
            }

            // Generate item code
            const { data: itemCode, error: codeError } = await supabase
              .rpc('generate_item_code', {
                category_name: category.category_name,
                qualifier: item.qualifier || '',
                size_mm: item.size_mm || '',
                gsm: item.gsm ? parseFloat(item.gsm) : null
              });

            if (codeError) {
              allErrors.push({
                row: item.originalRowIndex,
                message: `Error generating item code: ${codeError.message}`
              });
              continue;
            }

            // Check if we should update existing item
            const conflict = conflicts.find(c => c.row === item.originalRowIndex);
            if (conflict && conflict.action === 'update') {
              // Update existing item
              const { error: updateError } = await supabase
                .from('item_master')
                .update({
                  item_name: item.item_name,
                  category_id: category.id,
                  qualifier: item.qualifier || null,
                  gsm: item.gsm ? parseFloat(item.gsm) : null,
                  size_mm: item.size_mm || null,
                  uom: item.uom,
                  usage_type: item.usage_type || null,
                  status: item.status || 'active',
                  updated_at: new Date().toISOString()
                })
                .eq('item_code', itemCode);

              if (updateError) {
                allErrors.push({
                  row: item.originalRowIndex,
                  message: `Error updating item: ${updateError.message}`
                });
              } else {
                totalSuccess++;
              }
            } else {
              // Create new item
              const { data: newItem, error: insertError } = await supabase
                .from('item_master')
                .insert({
                  item_code: itemCode,
                  item_name: item.item_name,
                  category_id: category.id,
                  qualifier: item.qualifier || null,
                  gsm: item.gsm ? parseFloat(item.gsm) : null,
                  size_mm: item.size_mm || null,
                  uom: item.uom,
                  usage_type: item.usage_type || null,
                  status: item.status || 'active',
                  auto_code: itemCode
                })
                .select()
                .single();

              if (insertError) {
                allErrors.push({
                  row: item.originalRowIndex,
                  message: `Error inserting item: ${insertError.message}`
                });
              } else {
                // Initialize stock entry
                await supabase
                  .from('stock')
                  .insert({
                    item_code: itemCode,
                    opening_qty: 0,
                    current_qty: 0
                  });
                
                totalSuccess++;
              }
            }
          } catch (error) {
            allErrors.push({
              row: item.originalRowIndex,
              message: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
        
        setProgress(Math.round(((i + batch.length) / itemsToProcess.length) * 100));
      }

      // Log the upload
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('csv_upload_log').insert({
          user_id: userData.user.id,
          file_name: file.name,
          file_type: 'item_master',
          total_rows: dataObjects.length,
          success_rows: totalSuccess,
          error_rows: allErrors.length,
          errors: allErrors as any
        });
      }

      setUploadResult({
        success: totalSuccess,
        errors: allErrors,
        total: dataObjects.length
      });

      toast({
        title: "Upload Complete",
        description: `Successfully processed ${totalSuccess} out of ${dataObjects.length} rows`
      });

      onUploadComplete();

    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setCsvData(null);
    setUploadResult(null);
    setValidationErrors([]);
    setConflicts([]);
    setProgress(0);
  };

  const updateConflictAction = (rowIndex: number, action: 'skip' | 'update' | 'error') => {
    setConflicts(prev => 
      prev.map(conflict => 
        conflict.row === rowIndex ? { ...conflict, action } : conflict
      )
    );
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Item Master CSV Upload
          </CardTitle>
          <CardDescription>
            Upload item master data via CSV file. Download the template to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!uploadResult && (
            <>
              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                <Button variant="outline" asChild>
                  <a href="#" onClick={(e) => { e.preventDefault(); /* Add help functionality */ }}>
                    <FileText className="h-4 w-4 mr-2" />
                    View Format Guide
                  </a>
                </Button>
              </div>

              <div>
                <Label htmlFor="csv-file">Select CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="mt-2"
                />
              </div>

              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Found {validationErrors.length} validation errors. Please fix them before uploading.
                  </AlertDescription>
                </Alert>
              )}

              {csvData && validationErrors.length === 0 && (
                <>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Found {csvData.rows.length} rows ready for processing
                      {conflicts.length > 0 && ` (${conflicts.length} conflicts detected)`}
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h4 className="font-medium mb-2">Preview (first 5 rows)</h4>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {csvData.headers.map((header, index) => (
                              <TableHead key={index}>{header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvData.rows.slice(0, 5).map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <TableCell key={cellIndex}>{cell}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={processUpload} 
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? 'Processing...' : conflicts.length > 0 ? 'Review Conflicts & Upload' : 'Upload Data'}
                    </Button>
                    <Button variant="outline" onClick={resetUpload}>
                      <X className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>

                  {isProcessing && (
                    <div>
                      <Progress value={progress} className="w-full" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Processing... {progress}% complete
                      </p>
                    </div>
                  )}
                </>
              )}

              {validationErrors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-destructive">Validation Errors ({validationErrors.length})</h4>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-muted">
                    {validationErrors.slice(0, 20).map((error, index) => (
                      <div key={index} className="text-sm text-destructive mb-1">
                        Row {error.row}, {error.field}: {error.message}
                      </div>
                    ))}
                    {validationErrors.length > 20 && (
                      <div className="text-sm text-muted-foreground">
                        ... and {validationErrors.length - 20} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {uploadResult && (
            <div className="space-y-4">
              <Alert className={uploadResult.errors.length === 0 ? "border-green-200 bg-green-50" : ""}>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Upload completed: {uploadResult.success} successful, {uploadResult.errors.length} failed out of {uploadResult.total} total rows
                </AlertDescription>
              </Alert>

              {uploadResult.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-destructive">Errors ({uploadResult.errors.length})</h4>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-muted">
                    {uploadResult.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="text-sm text-destructive mb-1">
                        Row {error.row}: {error.message}
                      </div>
                    ))}
                    {uploadResult.errors.length > 10 && (
                      <div className="text-sm text-muted-foreground">
                        ... and {uploadResult.errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button onClick={resetUpload} variant="outline" className="w-full">
                Upload Another File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Resolve Conflicts</DialogTitle>
            <DialogDescription>
              The following items already exist. Choose how to handle each conflict:
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Row</TableHead>
                  <TableHead>Item Code</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conflicts.map((conflict, index) => (
                  <TableRow key={index}>
                    <TableCell>{conflict.row}</TableCell>
                    <TableCell className="font-mono">{conflict.item_code}</TableCell>
                    <TableCell>{conflict.data.item_name}</TableCell>
                    <TableCell>
                      <Select 
                        value={conflict.action} 
                        onValueChange={(value: 'skip' | 'update' | 'error') => 
                          updateConflictAction(conflict.row, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">Skip</SelectItem>
                          <SelectItem value="update">Update</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConflictDialog(false)}>
              Cancel
            </Button>
            <Button onClick={executeUpload}>
              Proceed with Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};