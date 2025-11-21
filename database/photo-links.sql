-- Photo Links Table for Atacama NightSky
-- Run this in Neon SQL Editor

-- Create photo_links table
CREATE TABLE IF NOT EXISTS photo_links (
    id SERIAL PRIMARY KEY,
    tour_date DATE UNIQUE NOT NULL,
    photo_url TEXT NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for date lookup
CREATE INDEX idx_photo_links_date ON photo_links(tour_date);

-- Function to upsert photo link
CREATE OR REPLACE FUNCTION upsert_photo_link(
    p_tour_date DATE,
    p_photo_url TEXT,
    p_description VARCHAR DEFAULT NULL
)
RETURNS photo_links AS $$
DECLARE
    result photo_links;
BEGIN
    INSERT INTO photo_links (tour_date, photo_url, description)
    VALUES (p_tour_date, p_photo_url, p_description)
    ON CONFLICT (tour_date)
    DO UPDATE SET
        photo_url = EXCLUDED.photo_url,
        description = EXCLUDED.description,
        updated_at = TIMEZONE('utc', NOW())
    RETURNING * INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;
