-- Fix stock_summary view to correctly calculate days of cover
-- Current issues:
-- 1. Using 30-day window creates inconsistent time periods  
-- 2. All transactions on same day gives unrealistic daily consumption rates
-- 3. No fallback for items with no recent consumption

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
  -- Enhanced days of cover calculation with multiple fallback strategies
  CASE 
    -- Strategy 1: Use historical average based on transaction frequency
    WHEN consumption_analysis.total_consumed > 0 AND consumption_analysis.transaction_count > 0
    THEN CASE
      -- If we have a reasonable time span, use time-based calculation
      WHEN consumption_analysis.days_span >= 7 
      THEN s.current_qty / (consumption_analysis.total_consumed / consumption_analysis.days_span)
      -- If transactions are clustered (< 7 days), use transaction-based calculation
      -- Assume transactions represent periodic consumption (e.g., weekly/monthly)
      WHEN consumption_analysis.transaction_count >= 3
      THEN s.current_qty / (consumption_analysis.total_consumed / consumption_analysis.transaction_count) * 
           CASE 
             WHEN consumption_analysis.transaction_count >= 10 THEN 7  -- Assume weekly if many transactions
             WHEN consumption_analysis.transaction_count >= 5 THEN 14   -- Assume bi-weekly 
             ELSE 30  -- Assume monthly for few transactions
           END
      -- Single or very few transactions - use conservative estimate
      ELSE s.current_qty / (consumption_analysis.total_consumed / GREATEST(consumption_analysis.transaction_count, 1)) * 30
    END
    -- Strategy 2: Items with no consumption history get NULL (will show as "N/A")
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
    SUM(qty_issued) as total_consumed,
    COUNT(*) as transaction_count,
    GREATEST(EXTRACT(DAY FROM (MAX(created_at) - MIN(created_at))), 1) as days_span,
    MIN(created_at) as first_transaction,
    MAX(created_at) as last_transaction
  FROM issue_log
  GROUP BY item_code
) consumption_analysis ON s.item_code = consumption_analysis.item_code;