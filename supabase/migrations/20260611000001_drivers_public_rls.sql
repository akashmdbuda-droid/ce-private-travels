-- Enable public read access for the drivers table so the website can fetch driver profiles
CREATE POLICY "Enable public anonymous read access for drivers" 
ON public.drivers 
FOR SELECT 
TO anon 
USING (true);
