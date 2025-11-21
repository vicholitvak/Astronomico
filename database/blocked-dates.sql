-- Blocked Dates Table for Atacama NightSky
-- Run this in Neon SQL Editor

CREATE TABLE IF NOT EXISTS blocked_dates (
    id SERIAL PRIMARY KEY,
    blocked_date DATE UNIQUE NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_blocked_dates_date ON blocked_dates(blocked_date);
