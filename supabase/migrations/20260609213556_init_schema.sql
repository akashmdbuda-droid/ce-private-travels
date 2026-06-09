-- ====================================================================
-- 1. EXTENSIONS & ENUMERATIONS INITIALIZATION
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE lead_status AS ENUM ('New', 'Contacted', 'Negotiating', 'Booked', 'Completed', 'Cancelled', 'Lost');

-- ====================================================================
-- 2. GEOGRAPHIC ROUTING ENGINE MATRIX TABLE
-- ====================================================================
CREATE TABLE public.locations (
    id SERIAL PRIMARY KEY,
    city TEXT NOT NULL UNIQUE,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    country_code VARCHAR(2) NOT NULL CHECK (country_code IN ('HU', 'AT', 'DE'))
);

-- ====================================================================
-- 3. CENTRAL BUSINESS CRM & TRANSACTION LEDGER TABLE
-- ====================================================================
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Routing Parameters
    pickup_location TEXT NOT NULL,
    destination_location TEXT NOT NULL,
    pax_count INT NOT NULL CHECK (pax_count > 0 AND pax_count <= 20),
    travel_datetime TIMESTAMPTZ NOT NULL,
    route_slug TEXT DEFAULT NULL,
    
    -- Client Parameters
    customer_name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    competitor_invoice_url TEXT DEFAULT NULL,
    
    -- Revenue Management & Business Intelligence Core
    current_status lead_status DEFAULT 'New'::lead_status NOT NULL,
    lost_reason TEXT DEFAULT NULL,
    lead_source TEXT DEFAULT 'Google Organic' NOT NULL,
    quoted_price NUMERIC(10, 2) DEFAULT NULL,
    final_price NUMERIC(10, 2) DEFAULT NULL,
    payment_received BOOLEAN DEFAULT false NOT NULL,
    
    -- Virality Attribution
    referred_by UUID REFERENCES public.leads(id) ON DELETE SET NULL DEFAULT NULL,
    review_token TEXT UNIQUE DEFAULT md5(random()::text) NOT NULL,
    review_solicited_at TIMESTAMPTZ DEFAULT NULL
);

-- ====================================================================
-- 4. PERFORMANCE TUNING DATABASE INDEX MATRIX
-- ====================================================================
CREATE INDEX idx_leads_workflow_status ON public.leads(current_status);
CREATE INDEX idx_leads_acquisition_source ON public.leads(lead_source);
CREATE INDEX idx_leads_seo_route_slug ON public.leads(route_slug);
CREATE INDEX idx_locations_city_lookup ON public.locations(city);

-- ====================================================================
-- 5. ROW LEVEL SECURITY (RLS) SECURITY POLICY ARCHITECTURE
-- ====================================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Form Submissions Access (Public Anonymous Insertion Permissions)
CREATE POLICY "Enable public anonymous data entry pipelines" 
ON public.leads 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Internal Micro-CRM Protection (Authenticated Service Role/Operator Read-Write Permissions)
CREATE POLICY "Restrict full table accessibility to operators" 
ON public.leads 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Geolocation Read Optimization (Public Global Extraction Access)
CREATE POLICY "Enable unrestricted lookup of location vectors" 
ON public.locations 
FOR SELECT 
TO anon 
USING (true);

-- ====================================================================
-- 6. SYSTEM SEED CONTENT GENERATION (CORE GEOGRAPHIC COORDS)
-- ====================================================================
INSERT INTO public.locations (city, latitude, longitude, country_code) VALUES
('Budapest', 47.497912, 19.040235, 'HU'),
('Debrecen', 47.531605, 21.627312, 'HU'),
('Győr', 47.687457, 17.650397, 'HU'),
('Pécs', 46.072735, 18.232266, 'HU'),
('Szeged', 46.253010, 20.141425, 'HU'),
('Miskolc', 48.103477, 20.784403, 'HU'),
('Vienna', 48.208174, 16.373819, 'AT'),
('Salzburg', 47.809490, 13.055010, 'AT'),
('Graz', 47.070713, 15.439504, 'AT'),
('Linz', 48.306940, 14.285830, 'AT'),
('Innsbruck', 47.269212, 11.404102, 'AT'),
('Klagenfurt', 46.636460, 14.312220, 'AT'),
('Berlin', 52.520008, 13.404954, 'DE'),
('Hamburg', 53.551086, 9.993682, 'DE'),
('Munich', 48.135125, 11.581981, 'DE'),
('Cologne', 50.937531, 6.960279, 'DE'),
('Frankfurt', 50.110922, 8.682127, 'DE'),
('Stuttgart', 48.775846, 9.182932, 'DE'),
('Düsseldorf', 51.227741, 6.773456, 'DE'),
('Leipzig', 51.339695, 12.373075, 'DE'),
('Dresden', 51.050407, 13.737262, 'DE'),
('Hanover', 52.375892, 9.732010, 'DE'),
('Nuremberg', 49.452102, 11.076665, 'DE'),
('Bremen', 53.079296, 8.801694, 'DE');

-- ====================================================================
-- 7. TELEGRAM EDGE FUNCTION TRIGGER
-- ====================================================================
CREATE TRIGGER dispatch_telegram_on_lead_insertion
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'https://udkiaurvvypmnuolnpce.supabase.co/functions/v1/telegram-alert',
  'POST',
  '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVka2lhdXJ2dnlwbW51b2xucGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1OTYxMzYsImV4cCI6MjA5NjE3MjEzNn0.My_qC5Ada2mVeDkb4VbQVw2MfTmHKFs6YAmy7ll51pA"}',
  '{}',
  '1000'
);
