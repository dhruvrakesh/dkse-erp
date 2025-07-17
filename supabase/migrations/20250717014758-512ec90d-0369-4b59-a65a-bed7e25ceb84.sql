-- Phase 1: Fix stock_summary view with corrected calculation logic
-- This addresses the critical issue where Days_of_Cover was incorrectly calculated

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
  
  -- Validation field: calculated vs actual stock
  (s.opening_qty + COALESCE(grn_totals.total_grn_qty, 0) - COALESCE(issue_totals.total_issued_qty, 0)) as calculated_qty,
  
  -- NEW: 30-day consumption tracking
  COALESCE(recent_consumption.issue_30d, 0) as issue_30d,
  COALESCE(recent_consumption.unique_issue_days, 0) as unique_issue_days,
  
  -- CORRECTED: Days of Cover calculation using unique issue days
  CASE 
    WHEN COALESCE(recent_consumption.issue_30d, 0) > 0 AND COALESCE(recent_consumption.unique_issue_days, 0) > 0
    THEN s.current_qty / (recent_consumption.issue_30d / recent_consumption.unique_issue_days)
    WHEN s.current_qty > 0 AND COALESCE(recent_consumption.issue_30d, 0) = 0
    THEN 999999  -- Infinite days of cover (no recent consumption)
    ELSE 0  -- No stock
  END as days_of_cover,
  
  -- Validation and debugging fields
  CASE 
    WHEN ABS((s.opening_qty + COALESCE(grn_totals.total_grn_qty, 0) - COALESCE(issue_totals.total_issued_qty, 0)) - s.current_qty) > 0.01
    THEN 'MISMATCH'
    ELSE 'OK'
  END as stock_validation_status,
  
  CASE 
    WHEN COALESCE(recent_consumption.unique_issue_days, 0) > 0
    THEN ROUND(recent_consumption.issue_30d / recent_consumption.unique_issue_days, 2)
    ELSE 0
  END as consumption_rate_per_day

FROM stock s
LEFT JOIN item_master im ON s.item_code = im.item_code
LEFT JOIN categories c ON im.category_id = c.id

-- Total GRN quantities (all time)
LEFT JOIN (
  SELECT 
    item_code,
    SUM(qty_received) as total_grn_qty
  FROM grn_log
  GROUP BY item_code
) grn_totals ON s.item_code = grn_totals.item_code

-- Total issue quantities (all time)
LEFT JOIN (
  SELECT 
    item_code,
    SUM(qty_issued) as total_issued_qty
  FROM issue_log
  GROUP BY item_code
) issue_totals ON s.item_code = issue_totals.item_code

-- NEW: 30-day consumption analysis with unique issue days
LEFT JOIN (
  SELECT 
    item_code,
    SUM(qty_issued) as issue_30d,
    COUNT(DISTINCT DATE(created_at)) as unique_issue_days,
    MIN(created_at) as first_issue_date,
    MAX(created_at) as last_issue_date
  FROM issue_log
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY item_code
) recent_consumption ON s.item_code = recent_consumption.item_code;