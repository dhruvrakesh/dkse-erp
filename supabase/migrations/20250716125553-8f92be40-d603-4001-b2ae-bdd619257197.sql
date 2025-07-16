-- Fix stock_summary view to correctly calculate stock levels
-- The issue is that we're summing all GRN records but only 30 days of issue records
-- This creates inconsistency with the actual stock levels

DROP VIEW IF EXISTS stock_summary;

CREATE VIEW stock_summary AS
SELECT 
  s.item_code,
  im.item_name,
  c.category_name,
  s.opening_qty,
  COALESCE(grn_totals.total_grn_qty, 0) as total_grn_qty,
  COALESCE(issue_totals.total_issued_qty, 0) as total_issued_qty,
  s.current_qty,
  -- Add validation field to check calculation consistency
  (s.opening_qty + COALESCE(grn_totals.total_grn_qty, 0) - COALESCE(issue_totals.total_issued_qty, 0)) as calculated_qty,
  -- Calculate days of cover using 30-day consumption average
  CASE 
    WHEN COALESCE(recent_consumption.avg_daily_consumption, 0) > 0 
    THEN s.current_qty / recent_consumption.avg_daily_consumption
    ELSE NULL 
  END as days_of_cover
FROM stock s
LEFT JOIN item_master im ON s.item_code = im.item_code
LEFT JOIN categories c ON im.category_id = c.id
LEFT JOIN (
  SELECT 
    item_code,
    SUM(qty_received) as total_grn_qty
  FROM grn_log
  GROUP BY item_code
) grn_totals ON s.item_code = grn_totals.item_code
LEFT JOIN (
  SELECT 
    item_code,
    SUM(qty_issued) as total_issued_qty
  FROM issue_log
  GROUP BY item_code
) issue_totals ON s.item_code = issue_totals.item_code
LEFT JOIN (
  SELECT 
    item_code,
    AVG(daily_consumption) as avg_daily_consumption
  FROM (
    SELECT 
      item_code,
      DATE(created_at) as issue_date,
      SUM(qty_issued) as daily_consumption
    FROM issue_log
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY item_code, DATE(created_at)
  ) daily_totals
  GROUP BY item_code
) recent_consumption ON s.item_code = recent_consumption.item_code;