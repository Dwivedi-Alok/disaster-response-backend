-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create disasters table
CREATE TABLE IF NOT EXISTS disasters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  location_name TEXT,
  location GEOGRAPHY(POINT),
  description TEXT,
  tags TEXT[],
  owner_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  audit_trail JSONB DEFAULT '[]'::jsonb
);

-- Create indexes for disasters
CREATE INDEX IF NOT EXISTS disasters_location_idx ON disasters USING GIST (location);
CREATE INDEX IF NOT EXISTS disasters_tags_idx ON disasters USING GIN (tags);
CREATE INDEX IF NOT EXISTS disasters_owner_idx ON disasters (owner_id);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
  user_id VARCHAR(255),
  content TEXT,
  image_url TEXT,
  verification_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
  name VARCHAR(255),
  location_name TEXT,
  location GEOGRAPHY(POINT),
  type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for resources
CREATE INDEX IF NOT EXISTS resources_location_idx ON resources USING GIST (location);

-- Create cache table
CREATE TABLE IF NOT EXISTS cache (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create index for cache
CREATE INDEX IF NOT EXISTS cache_expires_idx ON cache (expires_at);

-- Create function to get nearby disasters
CREATE OR REPLACE FUNCTION get_nearby_disasters(
  lat FLOAT,
  lon FLOAT,
  radius_km FLOAT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  location_name TEXT,
  description TEXT,
  tags TEXT[],
  distance_km FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.location_name,
    d.description,
    d.tags,
    ST_Distance(
      d.location::geography,
      ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
    ) / 1000 AS distance_km
  FROM disasters d
  WHERE ST_DWithin(
    d.location::geography,
    ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
    radius_km * 1000
  )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Create function to get nearby resources
CREATE OR REPLACE FUNCTION get_nearby_resources(
  disaster_id UUID,
  lat FLOAT,
  lon FLOAT,
  radius_km FLOAT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  location_name TEXT,
  type VARCHAR,
  distance_km FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.location_name,
    r.type,
    ST_Distance(
      r.location::geography,
      ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
    ) / 1000 AS distance_km
  FROM resources r
  WHERE r.disaster_id = get_nearby_resources.disaster_id
    AND ST_DWithin(
      r.location::geography,
      ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;
