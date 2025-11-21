-- Supabase SQL Schema for Atacama NightSky Bookings
-- Run this in Supabase SQL Editor

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    booking_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Tour details
    date DATE NOT NULL,
    time VARCHAR(20) NOT NULL,
    tour_type VARCHAR(50) NOT NULL,
    persons INTEGER NOT NULL CHECK (persons > 0 AND persons <= 20),
    
    -- Customer information
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    message TEXT,
    
    -- Booking metadata
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_amount DECIMAL(10, 2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional fields
    source VARCHAR(50) DEFAULT 'website',
    language VARCHAR(10) DEFAULT 'es',
    reminder_sent BOOLEAN DEFAULT FALSE,
    notes TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_email ON bookings(email);
CREATE INDEX idx_bookings_booking_id ON bookings(booking_id);

-- Create a view for upcoming tours
CREATE VIEW upcoming_bookings AS
SELECT 
    booking_id,
    date,
    time,
    tour_type,
    persons,
    name,
    phone,
    status
FROM bookings
WHERE date >= CURRENT_DATE
    AND status = 'confirmed'
ORDER BY date, time;

-- Create a view for statistics
CREATE VIEW booking_stats AS
SELECT 
    DATE_TRUNC('month', date) as month,
    COUNT(*) as total_bookings,
    SUM(persons) as total_persons,
    SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
    AVG(persons) as avg_persons_per_booking
FROM bookings
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;

-- Row Level Security (RLS)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable insert for anon" ON bookings
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON bookings
    FOR SELECT TO authenticated
    USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE
    ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - remove in production)
INSERT INTO bookings (
    booking_id, 
    date, 
    time, 
    tour_type, 
    persons, 
    name, 
    email, 
    phone, 
    status
) VALUES 
    ('ATK-TEST-001', '2025-08-10', '21:00', 'regular', 2, 'Juan Pérez', 'juan@example.com', '+56912345678', 'confirmed'),
    ('ATK-TEST-002', '2025-08-12', '21:30', 'private', 4, 'María González', 'maria@example.com', '+56987654321', 'pending');

-- =====================================================
-- REVIEWS TABLE - Para reseñas post-tour
-- =====================================================

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    review_id VARCHAR(50) UNIQUE NOT NULL,

    -- Link to booking
    booking_id VARCHAR(50) REFERENCES bookings(booking_id),

    -- Ratings (1-5 stars)
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    guide_rating INTEGER CHECK (guide_rating >= 1 AND guide_rating <= 5),
    equipment_rating INTEGER CHECK (equipment_rating >= 1 AND equipment_rating <= 5),
    location_rating INTEGER CHECK (location_rating >= 1 AND location_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),

    -- Review content
    title VARCHAR(200),
    comment TEXT,

    -- Reviewer info
    reviewer_name VARCHAR(100) NOT NULL,
    reviewer_email VARCHAR(255) NOT NULL,
    reviewer_country VARCHAR(100),
    language VARCHAR(10) DEFAULT 'es',

    -- Tour info
    tour_type VARCHAR(50),
    tour_date DATE,

    -- Media
    photos JSONB,

    -- Engagement
    helpful_count INTEGER DEFAULT 0,

    -- Status and moderation
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    is_featured BOOLEAN DEFAULT FALSE,
    moderation_notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Table for owner responses to reviews
CREATE TABLE IF NOT EXISTS review_responses (
    id SERIAL PRIMARY KEY,
    review_id VARCHAR(50) UNIQUE REFERENCES reviews(review_id),
    response_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for reviews
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_overall_rating ON reviews(overall_rating);
CREATE INDEX idx_reviews_featured ON reviews(is_featured);
CREATE INDEX idx_reviews_booking_id ON reviews(booking_id);

-- View for approved public reviews
CREATE VIEW public_reviews AS
SELECT
    review_id,
    reviewer_name,
    reviewer_country,
    overall_rating,
    title,
    comment,
    tour_type,
    tour_date,
    created_at
FROM reviews
WHERE status = 'approved'
ORDER BY created_at DESC;

-- View for featured testimonials (for homepage)
CREATE VIEW featured_reviews AS
SELECT
    review_id,
    reviewer_name,
    reviewer_country,
    overall_rating,
    title,
    comment,
    tour_type,
    created_at
FROM reviews
WHERE status = 'approved'
    AND is_featured = TRUE
ORDER BY created_at DESC
LIMIT 6;

-- RLS for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a review
CREATE POLICY "Enable insert for anon reviews" ON reviews
    FOR INSERT TO anon
    WITH CHECK (true);

-- Only authenticated users can read all reviews
CREATE POLICY "Enable read for authenticated reviews" ON reviews
    FOR SELECT TO authenticated
    USING (true);

-- Anon can only read approved reviews
CREATE POLICY "Enable read approved reviews for anon" ON reviews
    FOR SELECT TO anon
    USING (status = 'approved');

-- Grant permissions for reviews
GRANT ALL ON reviews TO anon;
GRANT ALL ON reviews_id_seq TO anon;
GRANT ALL ON review_responses TO anon;
GRANT ALL ON review_responses_id_seq TO anon;

-- =====================================================
-- ORIGINAL GRANTS
-- =====================================================

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON bookings TO anon;
GRANT ALL ON bookings_id_seq TO anon;