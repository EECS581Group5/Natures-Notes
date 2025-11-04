-- Migration: Add city_name and country_code columns to user_recent_locations table
-- Date: 2025-01-04

-- Add city_name column
ALTER TABLE user_recent_locations
ADD COLUMN IF NOT EXISTS city_name VARCHAR(255);

-- Add country_code column
ALTER TABLE user_recent_locations
ADD COLUMN IF NOT EXISTS country_code VARCHAR(10);

-- Add comment to document the columns
COMMENT ON COLUMN user_recent_locations.city_name IS 'Name of the city for this location';
COMMENT ON COLUMN user_recent_locations.country_code IS 'ISO country code (e.g., US, GB, FR)';
