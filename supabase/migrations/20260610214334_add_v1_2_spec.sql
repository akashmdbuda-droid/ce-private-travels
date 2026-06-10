-- Addendum v1.2 Specifications

-- Drivers table extensions
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS years_experience INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS biography TEXT,
ADD COLUMN IF NOT EXISTS languages_spoken TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profile_display BOOLEAN DEFAULT TRUE;

-- Leads table extensions
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS special_requests TEXT,
ADD COLUMN IF NOT EXISTS competitor_quote_url TEXT;

-- Create storage bucket for competitor quotes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('quotes', 'quotes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Quotes Bucket
-- Allow public to upload
CREATE POLICY "Public Upload Quotes" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'quotes');

-- Allow public to read
CREATE POLICY "Public Read Quotes" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'quotes');

-- Seed Drivers (Henry and Fawzi)
INSERT INTO public.drivers (full_name, phone_number, active, years_experience, biography, languages_spoken, specialties, profile_display)
VALUES 
  ('Henry', '+43 000 000 0001', true, 8, 'Professional chauffeur with extensive experience in Central Europe cross-border logistics. Focuses on executive comfort and safety.', ARRAY['English', 'German'], ARRAY['Airport Transfers', 'Business Travel'], true),
  ('Fawzi', '+43 000 000 0002', true, 5, 'Specialist in luxury travel and long-distance transfers. Known for exceptional client service and local tourism knowledge.', ARRAY['English', 'German', 'Arabic'], ARRAY['Cross-Border Travel', 'VIP Services'], true);
