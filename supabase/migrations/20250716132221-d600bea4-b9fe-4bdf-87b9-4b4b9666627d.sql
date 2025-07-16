-- Set up cron job for automatic daily stock summary capture
-- First, ensure the pg_cron extension is available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to capture stock summary daily at 2 AM
SELECT cron.schedule(
    'daily-stock-snapshot',
    '0 2 * * *', -- Every day at 2 AM
    $$
    SELECT public.capture_daily_stock_snapshot();
    $$
);

-- Capture the initial stock summary for today
SELECT public.capture_daily_stock_snapshot();