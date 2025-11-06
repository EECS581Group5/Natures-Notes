-- Spotify Integration Database Migration
-- Run this script to add Spotify-related tables to your database

-- Table to store user Spotify authentication tokens
CREATE TABLE IF NOT EXISTS user_spotify_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  spotify_user_id VARCHAR(255) NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Table to store weather condition to Spotify playlist mappings
CREATE TABLE IF NOT EXISTS weather_spotify_playlists (
  id SERIAL PRIMARY KEY,
  weather_condition VARCHAR(100) NOT NULL UNIQUE,
  spotify_playlist_id VARCHAR(255) NOT NULL,
  playlist_name VARCHAR(255),
  playlist_image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_spotify_tokens_user_id ON user_spotify_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_weather_spotify_playlists_condition ON weather_spotify_playlists(weather_condition);

-- Optional: Insert default weather conditions (you can customize these)
INSERT INTO weather_spotify_playlists (weather_condition, spotify_playlist_id, playlist_name, playlist_image)
VALUES
  ('Clear', '', 'Sunny Weather Playlist', NULL),
  ('Clouds', '', 'Cloudy Weather Playlist', NULL),
  ('Rain', '', 'Rainy Weather Playlist', NULL),
  ('Drizzle', '', 'Drizzle Weather Playlist', NULL),
  ('Thunderstorm', '', 'Stormy Weather Playlist', NULL),
  ('Snow', '', 'Snowy Weather Playlist', NULL),
  ('Mist', '', 'Misty Weather Playlist', NULL),
  ('Smoke', '', 'Smoky Weather Playlist', NULL),
  ('Haze', '', 'Hazy Weather Playlist', NULL),
  ('Dust', '', 'Dusty Weather Playlist', NULL),
  ('Fog', '', 'Foggy Weather Playlist', NULL),
  ('Sand', '', 'Sandy Weather Playlist', NULL),
  ('Ash', '', 'Ashy Weather Playlist', NULL),
  ('Squall', '', 'Squall Weather Playlist', NULL),
  ('Tornado', '', 'Tornado Weather Playlist', NULL)
ON CONFLICT (weather_condition) DO NOTHING;
