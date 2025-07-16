import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StockSnapshot {
  id: string;
  snapshot_date: string;
  snapshot_data: any;
  record_count: number;
  created_at: string;
  metadata?: any;
}

interface UseLegacyDataOptions {
  autoFetch?: boolean;
  limit?: number;
}

export const useLegacyData = (options: UseLegacyDataOptions = {}) => {
  const { autoFetch = true, limit = 30 } = options;
  const [snapshots, setSnapshots] = useState<StockSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSnapshots = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('daily_stock_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      setSnapshots(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch snapshots';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const captureSnapshot = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('capture-daily-stock-summary');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Daily stock snapshot captured successfully",
      });
      
      // Refresh the snapshots
      await fetchSnapshots();
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture snapshot';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const analyzePattern = async (query: string, dateRange?: { start?: string; end?: string }, filters?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-stock-patterns', {
        body: {
          query,
          dateRange,
          filters
        }
      });

      if (error) throw error;
      
      toast({
        title: "Analysis Complete",
        description: "AI analysis generated successfully",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze patterns';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format: 'json' | 'csv' = 'json', dateRange?: { start?: string; end?: string }, filters?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('export-historical-data', {
        body: {
          format,
          dateRange,
          filters
        }
      });

      if (error) throw error;
      
      // Create download
      const blob = new Blob([data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock_history_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `Data exported as ${format.toUpperCase()}`,
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSnapshotByDate = (date: string) => {
    return snapshots.find(snapshot => snapshot.snapshot_date === date);
  };

  const getLatestSnapshot = () => {
    return snapshots.length > 0 ? snapshots[0] : null;
  };

  const getDateRange = () => {
    if (snapshots.length === 0) return null;
    
    const dates = snapshots.map(s => new Date(s.snapshot_date));
    return {
      start: new Date(Math.min(...dates.map(d => d.getTime()))),
      end: new Date(Math.max(...dates.map(d => d.getTime())))
    };
  };

  useEffect(() => {
    if (autoFetch) {
      fetchSnapshots();
    }
  }, [autoFetch, limit]);

  return {
    snapshots,
    loading,
    error,
    fetchSnapshots,
    captureSnapshot,
    analyzePattern,
    exportData,
    getSnapshotByDate,
    getLatestSnapshot,
    getDateRange
  };
};