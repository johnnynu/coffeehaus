-- Function to find specific coffee shops by name and location using full-text search
CREATE OR REPLACE FUNCTION find_specific_shop(
  shop_name TEXT,
  center_lng FLOAT,
  center_lat FLOAT,
  radius_meters INT DEFAULT 50000
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  phone TEXT,
  website TEXT,
  email TEXT,
  rating NUMERIC,
  review_count INT,
  price_level INT,
  hours JSONB,
  categories TEXT[],
  photos TEXT[],
  google_place_id TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  location GEOGRAPHY,
  distance_m FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.name,
    cs.address,
    cs.city,
    cs.state,
    cs.zip_code,
    cs.country,
    cs.latitude,
    cs.longitude,
    cs.phone,
    cs.website,
    cs.email,
    cs.rating,
    cs.review_count,
    cs.price_level,
    cs.hours,
    cs.categories,
    cs.photos,
    cs.google_place_id,
    cs.created_at,
    cs.updated_at,
    cs.last_synced_at,
    cs.location,
    ST_Distance(cs.location, ST_Point(center_lng, center_lat)::geography)::FLOAT as distance_m
  FROM coffee_shops cs
  WHERE ST_DWithin(cs.location, ST_Point(center_lng, center_lat)::geography, radius_meters)
    AND (
      cs.name ILIKE '%' || shop_name || '%'
      OR to_tsvector('english', cs.name) @@ plainto_tsquery('english', shop_name)
    )
  ORDER BY 
    CASE 
      WHEN cs.name ILIKE shop_name THEN 1  -- exact match
      WHEN cs.name ILIKE shop_name || '%' THEN 2  -- starts with
      WHEN cs.name ILIKE '%' || shop_name || '%' THEN 3  -- contains
      ELSE 4  -- full-text match
    END,
    ST_Distance(cs.location, ST_Point(center_lng, center_lat)::geography)
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;