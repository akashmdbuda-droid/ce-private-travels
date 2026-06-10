-- 1. Create Drivers Table
CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    languages TEXT[],
    active BOOLEAN DEFAULT TRUE,
    rating NUMERIC(3,2) DEFAULT 5.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_name TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    passenger_capacity INT,
    luggage_capacity INT,
    registration_number TEXT,
    active BOOLEAN DEFAULT TRUE,
    next_service_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Extend Leads Table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS source_campaign TEXT,
ADD COLUMN IF NOT EXISTS landing_page TEXT,
ADD COLUMN IF NOT EXISTS first_contacted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS booked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS assigned_driver UUID REFERENCES public.drivers(id),
ADD COLUMN IF NOT EXISTS assigned_vehicle UUID REFERENCES public.vehicles(id),
ADD COLUMN IF NOT EXISTS estimated_distance_km NUMERIC(8,2),
ADD COLUMN IF NOT EXISTS fuel_cost NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS toll_cost NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS driver_cost NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS calculated_profit NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS review_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS review_received BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS review_rating INT;

-- 4. Set up Row Level Security (RLS) for the new tables
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated operators to read/write drivers" 
ON public.drivers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated operators to read/write vehicles" 
ON public.vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);
