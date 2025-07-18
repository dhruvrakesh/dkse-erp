-- Fix Days of Cover calculation in stock_summary view
-- The current calculation incorrectly uses unique_issue_days, which gives wrong results
-- Correct formula: current_qty / (consumption_over_period / period_length)

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
  
  -- Consumption tracking for multiple periods
  COALESCE(recent_consumption_7d.issue_7d, 0) as issue_7d,
  COALESCE(recent_consumption_30d.issue_30d, 0) as issue_30d,
  COALESCE(recent_consumption_90d.issue_90d, 0) as issue_90d,
  
  -- CORRECTED: Days of Cover calculation using proper daily consumption rate
  CASE 
    WHEN COALESCE(recent_consumption_30d.issue_30d, 0) > 0
    THEN ROUND(s.current_qty / (recent_consumption_30d.issue_30d / 30.0), 1)
    WHEN s.current_qty > 0 AND COALESCE(recent_consumption_30d.issue_30d, 0) = 0
    THEN 999999  -- Infinite days of cover (no recent consumption)
    ELSE 0  -- No stock
  END as days_of_cover,
  
  -- Additional days of cover for different periods
  CASE 
    WHEN COALESCE(recent_consumption_7d.issue_7d, 0) > 0
    THEN ROUND(s.current_qty / (recent_consumption_7d.issue_7d / 7.0), 1)
    WHEN s.current_qty > 0 AND COALESCE(recent_consumption_7d.issue_7d, 0) = 0
    THEN 999999
    ELSE 0
  END as days_of_cover_7d,
  
  CASE 
    WHEN COALESCE(recent_consumption_90d.issue_90d, 0) > 0
    THEN ROUND(s.current_qty / (recent_consumption_90d.issue_90d / 90.0), 1)
    WHEN s.current_qty > 0 AND COALESCE(recent_consumption_90d.issue_90d, 0) = 0
    THEN 999999
    ELSE 0
  END as days_of_cover_90d,
  
  -- Validation and debugging fields
  CASE 
    WHEN ABS((s.opening_qty + COALESCE(grn_totals.total_grn_qty, 0) - COALESCE(issue_totals.total_issued_qty, 0)) - s.current_qty) > 0.01
    THEN 'MISMATCH'
    ELSE 'OK'
  END as stock_validation_status,
  
  -- Daily consumption rates for different periods
  CASE 
    WHEN COALESCE(recent_consumption_7d.issue_7d, 0) > 0
    THEN ROUND(recent_consumption_7d.issue_7d / 7.0, 3)
    ELSE 0
  END as consumption_rate_7d,
  
  CASE 
    WHEN COALESCE(recent_consumption_30d.issue_30d, 0) > 0
    THEN ROUND(recent_consumption_30d.issue_30d / 30.0, 3)
    ELSE 0
  END as consumption_rate_30d,
  
  CASE 
    WHEN COALESCE(recent_consumption_90d.issue_90d, 0) > 0
    THEN ROUND(recent_consumption_90d.issue_90d / 90.0, 3)
    ELSE 0
  END as consumption_rate_90d

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

-- 7-day consumption analysis
LEFT JOIN (
  SELECT 
    item_code,
    SUM(qty_issued) as issue_7d
  FROM issue_log
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY item_code
) recent_consumption_7d ON s.item_code = recent_consumption_7d.item_code

-- 30-day consumption analysis
LEFT JOIN (
  SELECT 
    item_code,
    SUM(qty_issued) as issue_30d
  FROM issue_log
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY item_code
) recent_consumption_30d ON s.item_code = recent_consumption_30d.item_code

-- 90-day consumption analysis
LEFT JOIN (
  SELECT 
    item_code,
    SUM(qty_issued) as issue_90d
  FROM issue_log
  WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY item_code
) recent_consumption_90d ON s.item_code = recent_consumption_90d.item_code;