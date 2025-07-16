import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';
import { 
  CalendarIcon, 
  Download, 
  Search, 
  MessageSquare, 
  BarChart3, 
  Filter,
  RefreshCw,
  Database,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface StockSnapshot {
  id: string;
  snapshot_date: string;
  snapshot_data: any;
  record_count: number;
  created_at: string;
  metadata?: any;
}

interface AnalyticsQuery {
  id: string;
  query_text: string;
  query_result: any;
  created_at: string;
}

const LegacyData = () => {
  const [activeTab, setActiveTab] = useState('historical');
  const [snapshots, setSnapshots] = useState<StockSnapshot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<StockSnapshot | null>(null);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [recentQueries, setRecentQueries] = useState<AnalyticsQuery[]>([]);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const { toast } = useToast();

  // Fetch historical snapshots
  const fetchSnapshots = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_stock_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(30);

      if (error) throw error;
      setSnapshots(data || []);
      
      // Set the most recent snapshot as selected by default
      if (data && data.length > 0) {
        setSelectedSnapshot(data[0]);
      }
    } catch (error) {
      console.error('Error fetching snapshots:', error);
      toast({
        title: "Error",
        description: "Failed to fetch historical data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent analytics queries
  const fetchRecentQueries = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_analytics_queries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentQueries(data || []);
    } catch (error) {
      console.error('Error fetching recent queries:', error);
    }
  };

  // Capture new snapshot
  const captureSnapshot = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('capture-daily-stock-summary');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Daily stock snapshot captured successfully",
      });
      
      fetchSnapshots(); // Refresh the list
    } catch (error) {
      console.error('Error capturing snapshot:', error);
      toast({
        title: "Error",
        description: "Failed to capture stock snapshot",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle AI analysis
  const handleAiAnalysis = async () => {
    if (!aiQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a query for analysis",
        variant: "destructive",
      });
      return;
    }

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-stock-patterns', {
        body: {
          query: aiQuery,
          dateRange: {
            start: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
            end: new Date().toISOString().split('T')[0]
          },
          filters: {
            searchTerm: searchTerm || null
          }
        }
      });

      if (error) throw error;
      
      setAiResponse(data.insight);
      setAiQuery(''); // Clear the input
      fetchRecentQueries(); // Refresh recent queries
      
      toast({
        title: "Analysis Complete",
        description: "AI analysis generated successfully",
      });
    } catch (error) {
      console.error('Error in AI analysis:', error);
      toast({
        title: "Error",
        description: "Failed to analyze stock patterns",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Handle data export
  const handleExport = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('https://rtggqfnzjeqhopqouthv.supabase.co/functions/v1/export-historical-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0Z2dxZm56amVxaG9wcW91dGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMTc3NDUsImV4cCI6MjA1ODU5Mzc0NX0._ulZsOJcKucn2X0Xi4c0JJfMGCB48fKFTdvfQiU3cko'}`,
        },
        body: JSON.stringify({
          format: exportFormat,
          dateRange: {
            start: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
            end: new Date().toISOString().split('T')[0]
          },
          filters: {
            searchTerm: searchTerm || null
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Get the response as a blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock_history_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `Data exported as ${exportFormat.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter snapshot data based on search term
  const filteredSnapshotData = Array.isArray(selectedSnapshot?.snapshot_data) 
    ? selectedSnapshot.snapshot_data.filter(item => 
        !searchTerm || 
        item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
      ) 
    : [];

  useEffect(() => {
    fetchSnapshots();
    fetchRecentQueries();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Legacy Data Analytics</h1>
          <p className="text-muted-foreground">
            Analyze historical stock data patterns and trends
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={captureSnapshot} disabled={loading}>
            <Database className="mr-2 h-4 w-4" />
            Capture Snapshot
          </Button>
          <Button onClick={fetchSnapshots} variant="outline" disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="historical">Historical Data</TabsTrigger>
          <TabsTrigger value="analytics">AI Analytics</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="historical" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Left Panel - Snapshot List */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Available Snapshots
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {snapshots.map((snapshot) => (
                      <div 
                        key={snapshot.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedSnapshot?.id === snapshot.id 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedSnapshot(snapshot)}
                      >
                        <div className="font-medium">
                          {format(new Date(snapshot.snapshot_date), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm opacity-75">
                          {snapshot.record_count} records
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Right Panel - Snapshot Details */}
            <Card className="md:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {selectedSnapshot ? (
                      `Stock Data - ${format(new Date(selectedSnapshot.snapshot_date), 'MMMM dd, yyyy')}`
                    ) : (
                      'Select a snapshot to view data'
                    )}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Button size="sm" variant="outline">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedSnapshot ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{filteredSnapshotData.length}</div>
                        <div className="text-sm text-muted-foreground">Items</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {filteredSnapshotData.reduce((sum, item) => sum + (item.current_qty || 0), 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Stock</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {filteredSnapshotData.filter(item => (item.days_of_cover || 0) < 30).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Low Stock</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {filteredSnapshotData.filter(item => (item.days_of_cover || 0) > 365).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Overstocked</div>
                      </div>
                    </div>

                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {filteredSnapshotData.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex-1">
                              <div className="font-medium">{item.item_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.item_code} • {item.category_name}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{item.current_qty} units</div>
                              <div className="text-sm">
                                {item.days_of_cover ? (
                                  <Badge variant={
                                    item.days_of_cover < 30 ? 'destructive' : 
                                    item.days_of_cover > 365 ? 'secondary' : 'default'
                                  }>
                                    {Math.round(item.days_of_cover)} days
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">N/A</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-2 text-muted-foreground">
                      Select a snapshot from the left panel to view detailed data
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AI Chat Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  AI Stock Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Ask me about stock patterns, trends, or specific items..."
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAiAnalysis} disabled={aiLoading}>
                    {aiLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Analyze'}
                  </Button>
                </div>
                
                {aiResponse && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="font-medium mb-2">AI Analysis:</div>
                    <div className="whitespace-pre-wrap text-sm">{aiResponse}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Queries */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {recentQueries.map((query) => (
                      <div key={query.id} className="p-3 border rounded">
                        <div className="font-medium text-sm">{query.query_text}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(query.created_at), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Export Historical Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Export Format</label>
                  <Select value={exportFormat} onValueChange={(value: 'json' | 'csv') => setExportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Date Range</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Search Filter</label>
                  <Input
                    placeholder="Filter by item name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <Button onClick={handleExport} disabled={loading} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Stock Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-2 text-muted-foreground">
                    Charts and visualizations coming soon
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Snapshots</span>
                    <Badge variant="default">{snapshots.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Latest Snapshot</span>
                    <Badge variant="outline">
                      {snapshots.length > 0 ? format(new Date(snapshots[0].snapshot_date), 'MMM dd') : 'None'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>AI Queries</span>
                    <Badge variant="secondary">{recentQueries.length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LegacyData;