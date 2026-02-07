-- Migration: Add gallery_testimonials table
-- Stores guest quotes/testimonials linked to gallery pages

CREATE TABLE IF NOT EXISTS gallery_testimonials (
  id SERIAL PRIMARY KEY,
  gallery_id INTEGER NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  quote TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_testimonials_gallery_id ON gallery_testimonials(gallery_id);
CREATE INDEX idx_testimonials_status ON gallery_testimonials(status);

-- Prevent duplicate testimonials: one per name+gallery combo
CREATE UNIQUE INDEX idx_testimonials_unique_name_gallery ON gallery_testimonials(gallery_id, LOWER(name));
