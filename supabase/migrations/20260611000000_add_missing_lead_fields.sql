-- Add missing fields for leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS lead_source TEXT DEFAULT 'Google Organic',
ADD COLUMN IF NOT EXISTS suggested_budget NUMERIC;
