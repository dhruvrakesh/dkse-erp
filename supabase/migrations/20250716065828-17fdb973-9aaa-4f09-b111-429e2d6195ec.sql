-- Create categories table for structured item organization
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enhanced item_master table
CREATE TABLE public.item_master (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_code TEXT NOT NULL UNIQUE,
  item_name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  qualifier TEXT,
  gsm NUMERIC,
  size_mm TEXT,
  uom TEXT NOT NULL DEFAULT 'PCS',
  usage_type TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  auto_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock table for real-time inventory tracking
CREATE TABLE public.stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_code TEXT NOT NULL REFERENCES public.item_master(item_code) ON UPDATE CASCADE,
  opening_qty NUMERIC NOT NULL DEFAULT 0,
  current_qty NUMERIC NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(item_code)
);

-- Create GRN (Goods Received Note) log table
CREATE TABLE public.grn_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grn_number TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  item_code TEXT NOT NULL REFERENCES public.item_master(item_code) ON UPDATE CASCADE,
  uom TEXT NOT NULL,
  qty_received NUMERIC NOT NULL,
  invoice_number TEXT,
  amount_inr NUMERIC,
  vendor TEXT,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create issue log table for stock consumption tracking
CREATE TABLE public.issue_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  item_code TEXT NOT NULL REFERENCES public.item_master(item_code) ON UPDATE CASCADE,
  qty_issued NUMERIC NOT NULL,
  purpose TEXT,
  total_issued_qty NUMERIC,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grn_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_log ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON public.categories FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.item_master FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.stock FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.grn_log FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.issue_log FOR ALL USING (true);

-- Create function to auto-generate item codes
CREATE OR REPLACE FUNCTION public.generate_item_code(
  category_name TEXT,
  qualifier TEXT DEFAULT '',
  size_mm TEXT DEFAULT '',
  gsm NUMERIC DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  category_code TEXT;
  final_code TEXT;
BEGIN
  -- Get first 3 letters of category name
  category_code := UPPER(LEFT(REGEXP_REPLACE(category_name, '[^A-Za-z]', '', 'g'), 3));
  
  -- Build item code
  final_code := category_code;
  
  IF qualifier IS NOT NULL AND qualifier != '' THEN
    final_code := final_code || '_' || UPPER(qualifier);
  END IF;
  
  IF size_mm IS NOT NULL AND size_mm != '' THEN
    final_code := final_code || '_' || size_mm;
  END IF;
  
  IF gsm IS NOT NULL THEN
    final_code := final_code || '_' || gsm::TEXT;
  END IF;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Create function to update stock on GRN
CREATE OR REPLACE FUNCTION public.update_stock_on_grn()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.stock (item_code, current_qty, last_updated)
  VALUES (NEW.item_code, NEW.qty_received, now())
  ON CONFLICT (item_code)
  DO UPDATE SET 
    current_qty = stock.current_qty + NEW.qty_received,
    last_updated = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update stock on issue
CREATE OR REPLACE FUNCTION public.update_stock_on_issue()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.stock 
  SET 
    current_qty = current_qty - NEW.qty_issued,
    last_updated = now()
  WHERE item_code = NEW.item_code;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic stock updates
CREATE TRIGGER grn_stock_update
  AFTER INSERT ON public.grn_log
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_on_grn();

CREATE TRIGGER issue_stock_update
  AFTER INSERT ON public.issue_log
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_on_issue();

-- Create stock summary view
CREATE OR REPLACE VIEW public.stock_summary AS
SELECT 
  im.item_code,
  im.item_name,
  c.category_name,
  s.opening_qty,
  COALESCE(grn_totals.total_grn_qty, 0) as total_grn_qty,
  COALESCE(issue_totals.total_issued_qty, 0) as total_issued_qty,
  s.current_qty,
  CASE 
    WHEN COALESCE(issue_totals.avg_daily_consumption, 0) > 0 
    THEN s.current_qty / issue_totals.avg_daily_consumption
    ELSE NULL
  END as days_of_cover
FROM public.item_master im
LEFT JOIN public.categories c ON im.category_id = c.id
LEFT JOIN public.stock s ON im.item_code = s.item_code
LEFT JOIN (
  SELECT 
    item_code,
    SUM(qty_received) as total_grn_qty
  FROM public.grn_log
  GROUP BY item_code
) grn_totals ON im.item_code = grn_totals.item_code
LEFT JOIN (
  SELECT 
    item_code,
    SUM(qty_issued) as total_issued_qty,
    AVG(qty_issued) as avg_daily_consumption
  FROM public.issue_log
  WHERE date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY item_code
) issue_totals ON im.item_code = issue_totals.item_code;

-- Insert default categories
INSERT INTO public.categories (category_name, description) VALUES
('Raw Materials', 'Primary materials for production'),
('Packaging', 'Packaging materials and supplies'),
('Chemicals', 'Chemical compounds and additives'),
('Tools', 'Manufacturing tools and equipment'),
('Consumables', 'General consumable items');

-- Create update timestamp triggers
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_item_master_updated_at
  BEFORE UPDATE ON public.item_master
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();