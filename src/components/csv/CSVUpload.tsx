import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface CSVData {
  headers: string[];
  rows: any[][];
}

interface CSVUploadProps {
  title: string;
  description: string;
  expectedHeaders: string[];
  onDataProcessed: (data: any[]) => Promise<{ success: number; errors: any[] }>;
}

export const CSVUpload: React.FC<CSVUploadProps> = ({
  title,
  description,
  expectedHeaders,
  onDataProcessed
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    errors: any[];
    total: number;
  } | null>(null);

  const parseCSV = (text: string): CSVData => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) throw new Error('CSV file is empty');
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => 
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    );
    
    return { headers, rows };
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvData = parseCSV(event.target?.result as string);
        setCsvData(csvData);
        
        // Validate headers
        const missingHeaders = expectedHeaders.filter(
          header => !csvData.headers.some(h => 
            h.toLowerCase().includes(header.toLowerCase())
          )
        );
        
        if (missingHeaders.length > 0) {
          toast({
            title: "Missing required columns",
            description: `Please ensure your CSV has: ${missingHeaders.join(', ')}`,
            variant: "destructive"
          });
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
  }, [expectedHeaders]);

  const processUpload = async () => {
    if (!csvData || !file) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Convert CSV data to objects
      const dataObjects = csvData.rows.map(row => {
        const obj: any = {};
        csvData.headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });

      // Process data in batches
      const batchSize = 50;
      let totalSuccess = 0;
      let allErrors: any[] = [];

      for (let i = 0; i < dataObjects.length; i += batchSize) {
        const batch = dataObjects.slice(i, i + batchSize);
        const result = await onDataProcessed(batch);
        totalSuccess += result.success;
        allErrors = [...allErrors, ...result.errors];
        
        setProgress(Math.round(((i + batch.length) / dataObjects.length) * 100));
      }

      // Log the upload
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('csv_upload_log').insert({
          user_id: userData.user.id,
          file_name: file.name,
          file_type: 'opening_stock',
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
    setProgress(0);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!uploadResult && (
          <>
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

            {csvData && (
              <>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Found {csvData.rows.length} rows with columns: {csvData.headers.join(', ')}
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
                    {isProcessing ? 'Processing...' : 'Upload Data'}
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
  );
};