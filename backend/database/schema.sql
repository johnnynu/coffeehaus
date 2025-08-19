-- Coffee Shops table
CREATE TABLE IF NOT EXISTS coffee_shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT,
    country TEXT NOT NULL DEFAULT 'US',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone TEXT,
    website TEXT,
    email TEXT,
    
    -- Business details
    rating DECIMAL(2, 1) CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    price_level INTEGER CHECK (price_level >= 1 AND price_level <= 4),
    
    -- Hours stored as JSONB
    hours JSONB,
    
    -- Categories as array
    categories TEXT[] DEFAULT '{}',
    
    -- Photos as array of URLs
    photos TEXT[] DEFAULT '{}',
    
    -- External API identifiers
    google_place_id TEXT UNIQUE,
    yelp_id TEXT UNIQUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_synced_at TIMESTAMP WITH TIME ZONE,
    
    -- Search indexes
    CONSTRAINT unique_google_place CHECK (google_place_id IS NOT NULL OR yelp_id IS NOT NULL)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_coffee_shops_location ON coffee_shops USING GIST (ll_to_earth(latitude, longitude));
CREATE INDEX IF NOT EXISTS idx_coffee_shops_name ON coffee_shops USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_coffee_shops_address ON coffee_shops USING GIN (to_tsvector('english', address || ' ' || city));
CREATE INDEX IF NOT EXISTS idx_coffee_shops_categories ON coffee_shops USING GIN (categories);
CREATE INDEX IF NOT EXISTS idx_coffee_shops_rating ON coffee_shops (rating);
CREATE INDEX IF NOT EXISTS idx_coffee_shops_price_level ON coffee_shops (price_level);
CREATE INDEX IF NOT EXISTS idx_coffee_shops_google_place_id ON coffee_shops (google_place_id);

-- POSTGIS
CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_coffee_shops_updated_at 
    BEFORE UPDATE ON coffee_shops 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(lat1 float, lon1 float, lat2 float, lon2 float)
RETURNS float AS $$
BEGIN
    RETURN earth_distance(ll_to_earth(lat1, lon1), ll_to_earth(lat2, lon2));
END;
$$ LANGUAGE plpgsql;