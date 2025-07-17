-- Create audit trail table for GRN modifications
CREATE TABLE public.grn_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_id UUID NOT NULL REFERENCES grn_log(id),
  action TEXT NOT NULL CHECK (action IN ('UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create audit trail table for Issue modifications  
CREATE TABLE public.issue_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issue_log(id),
  action TEXT NOT NULL CHECK (action IN ('UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit tables
ALTER TABLE public.grn_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit tables
CREATE POLICY "Admin full access to grn_audit_log" ON public.grn_audit_log
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin full access to issue_audit_log" ON public.issue_audit_log  
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to handle GRN updates with stock recalculation
CREATE OR REPLACE FUNCTION public.update_grn_with_stock_adjustment()
RETURNS TRIGGER AS $$
DECLARE
  qty_difference NUMERIC;
BEGIN
  -- Calculate quantity difference
  qty_difference := NEW.qty_received - OLD.qty_received;
  
  -- Log the change
  INSERT INTO public.grn_audit_log (grn_id, action, old_values, new_values, user_id)
  VALUES (
    NEW.id,
    'UPDATE',
    to_jsonb(OLD),
    to_jsonb(NEW),
    auth.uid()
  );
  
  -- Adjust stock by the difference
  UPDATE public.stock 
  SET 
    current_qty = current_qty + qty_difference,
    last_updated = now()
  WHERE item_code = NEW.item_code;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle GRN deletions with stock reversal
CREATE OR REPLACE FUNCTION public.delete_grn_with_stock_reversal()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the deletion
  INSERT INTO public.grn_audit_log (grn_id, action, old_values, new_values, user_id)
  VALUES (
    OLD.id,
    'DELETE', 
    to_jsonb(OLD),
    NULL,
    auth.uid()
  );
  
  -- Reverse the stock addition
  UPDATE public.stock 
  SET 
    current_qty = current_qty - OLD.qty_received,
    last_updated = now()
  WHERE item_code = OLD.item_code;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle Issue updates with stock recalculation
CREATE OR REPLACE FUNCTION public.update_issue_with_stock_adjustment()
RETURNS TRIGGER AS $$
DECLARE
  qty_difference NUMERIC;
BEGIN
  -- Calculate quantity difference (reverse old, apply new)
  qty_difference := OLD.qty_issued - NEW.qty_issued;
  
  -- Log the change
  INSERT INTO public.issue_audit_log (issue_id, action, old_values, new_values, user_id)
  VALUES (
    NEW.id,
    'UPDATE',
    to_jsonb(OLD),
    to_jsonb(NEW), 
    auth.uid()
  );
  
  -- Adjust stock by the difference
  UPDATE public.stock 
  SET 
    current_qty = current_qty + qty_difference,
    last_updated = now()
  WHERE item_code = NEW.item_code;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle Issue deletions with stock reversal
CREATE OR REPLACE FUNCTION public.delete_issue_with_stock_reversal()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the deletion
  INSERT INTO public.issue_audit_log (issue_id, action, old_values, new_values, user_id)
  VALUES (
    OLD.id,
    'DELETE',
    to_jsonb(OLD),
    NULL,
    auth.uid()
  );
  
  -- Reverse the stock deduction
  UPDATE public.stock 
  SET 
    current_qty = current_qty + OLD.qty_issued,
    last_updated = now()
  WHERE item_code = OLD.item_code;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for GRN modifications
CREATE TRIGGER grn_update_trigger
  AFTER UPDATE ON public.grn_log
  FOR EACH ROW
  EXECUTE FUNCTION update_grn_with_stock_adjustment();

CREATE TRIGGER grn_delete_trigger
  BEFORE DELETE ON public.grn_log
  FOR EACH ROW
  EXECUTE FUNCTION delete_grn_with_stock_reversal();

-- Create triggers for Issue modifications  
CREATE TRIGGER issue_update_trigger
  AFTER UPDATE ON public.issue_log
  FOR EACH ROW
  EXECUTE FUNCTION update_issue_with_stock_adjustment();

CREATE TRIGGER issue_delete_trigger
  BEFORE DELETE ON public.issue_log
  FOR EACH ROW
  EXECUTE FUNCTION delete_issue_with_stock_reversal();