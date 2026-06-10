CREATE TYPE vehicle_preference AS ENUM ('Premium Sedan', 'Luxury Van', 'Executive Minibus');

ALTER TABLE public.leads 
  ADD COLUMN vehicle_preference vehicle_preference,
  ADD COLUMN assigned_operator_notes TEXT DEFAULT NULL;
