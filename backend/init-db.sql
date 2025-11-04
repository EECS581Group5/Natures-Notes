-- Initialize database tables for Natures Notes application

-- 1) Ensure base tables exist
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2) Add notes.user_id if missing
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- 3) Backfill user_id here if your data model requires it.
-- Example placeholder (replace with real mapping logic):
-- UPDATE notes n
-- SET user_id = u.id
-- FROM users u
-- WHERE n.user_id IS NULL AND u.email = n.author_email;

-- 4) Enforce NOT NULL only after backfill is complete
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='notes' AND column_name='user_id') THEN
    -- Only set NOT NULL if there are no NULLs
    IF NOT EXISTS (SELECT 1 FROM notes WHERE user_id IS NULL) THEN
      ALTER TABLE notes ALTER COLUMN user_id SET NOT NULL;
    END IF;
  END IF;
END$$;

-- 5) Add FK constraint if missing (works on PG <16)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'notes_user_id_fkey'
      AND conrelid = 'notes'::regclass
  ) THEN
    ALTER TABLE notes
      ADD CONSTRAINT notes_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END$$;

-- 6) Indexes
-- DESC is fine on Postgres btree; it matches common ORDER BY created_at DESC queries.
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);

-- 7) Recent locations table
CREATE TABLE IF NOT EXISTS user_recent_locations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10,8) NOT NULL,   -- fits -90..90
  longitude DECIMAL(11,8) NOT NULL,  -- fits -180..180
  city_name VARCHAR(255),            -- city name for display
  country_code VARCHAR(10),          -- ISO country code (e.g., US, GB, FR)
  accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_recent_locations_user_time
  ON user_recent_locations(user_id, accessed_at DESC);

-- 8) Add city_name and country_code columns if they don't exist (for existing databases)
ALTER TABLE user_recent_locations
  ADD COLUMN IF NOT EXISTS city_name VARCHAR(255);

ALTER TABLE user_recent_locations
  ADD COLUMN IF NOT EXISTS country_code VARCHAR(10);
