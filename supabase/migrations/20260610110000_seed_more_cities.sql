-- Add remaining cities requested in Specification Addendum v1.1

INSERT INTO public.locations (city, latitude, longitude, country_code)
VALUES
  -- Germany
  ('Berlin', 52.5200, 13.4050, 'DE'),
  ('Hamburg', 53.5511, 9.9937, 'DE'),
  ('Cologne', 50.9375, 6.9603, 'DE'),
  ('Düsseldorf', 51.2277, 6.7735, 'DE'),
  ('Leipzig', 51.3397, 12.3731, 'DE'),
  ('Dresden', 51.0504, 13.7373, 'DE'),
  ('Hanover', 52.3759, 9.7320, 'DE'),
  ('Bremen', 53.0793, 8.8017, 'DE'),
  ('Stuttgart', 48.7758, 9.1829, 'DE'),
  ('Nuremberg', 49.4520, 11.0768, 'DE'),

  -- Austria
  ('Linz', 48.3069, 14.2858, 'AT'),
  ('Innsbruck', 47.2692, 11.4041, 'AT'),
  ('Klagenfurt', 46.6247, 14.3053, 'AT'),

  -- Hungary
  ('Pécs', 46.0727, 18.2323, 'HU'),
  ('Szeged', 46.2530, 20.1414, 'HU'),
  ('Miskolc', 48.1035, 20.7784, 'HU'),
  
  -- Czechia (For Prague routes)
  ('Prague', 50.0755, 14.4378, 'CZ')
ON CONFLICT (city) DO NOTHING;
