-- Create database infrastructure for Legacy Data functionality

-- Create table for storing daily stock snapshots
CREATE TABLE public.daily_stock_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  snapshot_data JSONB NOT NULL,
  record_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create unique index on snapshot_date to prevent duplicates
CREATE UNIQUE INDEX idx_daily_stock_snapshots_date ON public.daily_stock_snapshots(snapshot_date);

-- Create index on created_at for efficient querying
CREATE INDEX idx_daily_stock_snapshots_created_at ON public.daily_stock_snapshots(created_at);

-- Create GIN index on snapshot_data for efficient JSON queries
CREATE INDEX idx_daily_stock_snapshots_data ON public.daily_stock_snapshots USING GIN(snapshot_data);

-- Enable Row Level Security
ALTER TABLE public.daily_stock_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_stock_snapshots
CREATE POLICY "Admin full access to daily_stock_snapshots" 
ON public.daily_stock_snapshots 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can read daily_stock_snapshots" 
ON public.daily_stock_snapshots 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

-- Create table for storing analytics queries and results
CREATE TABLE public.stock_analytics_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  query_text TEXT NOT NULL,
  query_type VARCHAR(50) NOT NULL DEFAULT 'user_query',
  query_result JSONB,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date_range_start DATE,
  date_range_end DATE,
  filters JSONB DEFAULT '{}'::jsonb
);

-- Create index on user_id for efficient user queries
CREATE INDEX idx_stock_analytics_queries_user_id ON public.stock_analytics_queries(user_id);

-- Create index on query_type for filtering
CREATE INDEX idx_stock_analytics_queries_type ON public.stock_analytics_queries(query_type);

-- Create index on created_at for chronological ordering
CREATE INDEX idx_stock_analytics_queries_created_at ON public.stock_analytics_queries(created_at);

-- Enable Row Level Security
ALTER TABLE public.stock_analytics_queries ENABLE ROW LEVEL SECURITY;

-- Create policies for stock_analytics_queries
CREATE POLICY "Users can manage their own analytics queries" 
ON public.stock_analytics_queries 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admin full access to analytics queries" 
ON public.stock_analytics_queries 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updating timestamps
CREATE TRIGGER update_daily_stock_snapshots_updated_at
BEFORE UPDATE ON public.daily_stock_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to capture current stock summary as JSON
CREATE OR REPLACE FUNCTION public.capture_daily_stock_snapshot()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  snapshot_data JSONB;
  record_count INTEGER;
BEGIN
  -- Get current stock summary data
  SELECT jsonb_agg(
    jsonb_build_object(
      'item_code', item_code,
      'item_name', item_name,
      'category_name', category_name,
      'opening_qty', opening_qty,
      'total_grn_qty', total_grn_qty,
      'total_issued_qty', total_issued_qty,
      'current_qty', current_qty,
      'calculated_qty', calculated_qty,
      'days_of_cover', days_of_cover
    )
  ), COUNT(*)
  INTO snapshot_data, record_count
  FROM stock_summary;

  -- Insert or update today's snapshot
  INSERT INTO public.daily_stock_snapshots (
    snapshot_date, 
    snapshot_data, 
    record_count,
    metadata
  ) VALUES (
    CURRENT_DATE, 
    snapshot_data, 
    record_count,
    jsonb_build_object(
      'captured_at', now(),
      'source', 'automated_capture',
      'version', '1.0'
    )
  )
  ON CONFLICT (snapshot_date) 
  DO UPDATE SET 
    snapshot_data = EXCLUDED.snapshot_data,
    record_count = EXCLUDED.record_count,
    updated_at = now(),
    metadata = EXCLUDED.metadata;

  RETURN jsonb_build_object(
    'success', true,
    'date', CURRENT_DATE,
    'record_count', record_count,
    'message', 'Stock snapshot captured successfully'
  );
END;
$$;