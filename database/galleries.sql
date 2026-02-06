-- Gallery system tables for Atacama Dark Sky
-- Run this in Neon SQL editor

-- Galleries table
CREATE TABLE IF NOT EXISTS galleries (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  date DATE NOT NULL,
  tour_type VARCHAR(50) NOT NULL DEFAULT 'regular',
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  bortle SMALLINT DEFAULT 1,
  conditions VARCHAR(100),
  highlights TEXT,
  guests JSONB DEFAULT '[]'::jsonb,
  objects JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gallery photos table
CREATE TABLE IF NOT EXISTS gallery_photos (
  id SERIAL PRIMARY KEY,
  gallery_id INTEGER NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_galleries_status ON galleries(status);
CREATE INDEX IF NOT EXISTS idx_galleries_date ON galleries(date DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_gallery ON gallery_photos(gallery_id);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_order ON gallery_photos(gallery_id, sort_order);
