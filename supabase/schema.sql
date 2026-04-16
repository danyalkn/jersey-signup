-- ============================================================
-- Jersey Signup Schema
-- Run this in the Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

-- 1. Create the jersey_signups table
CREATE TABLE IF NOT EXISTS jersey_signups (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  jersey_number int         UNIQUE NOT NULL
                            CHECK (jersey_number >= 1 AND jersey_number <= 999),
  player_name   text        NOT NULL
                            CHECK (length(trim(player_name)) > 0
                              AND length(player_name) <= 100),
  size          text        NOT NULL
                            CHECK (size IN ('S', 'M', 'L', 'XL')),
  created_at    timestamptz DEFAULT now() NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE jersey_signups ENABLE ROW LEVEL SECURITY;

-- 3. Allow anyone to read (needed for the public grid)
CREATE POLICY "Allow public read"
  ON jersey_signups FOR SELECT
  USING (true);

-- 4. Allow anyone to insert (players claiming jerseys)
CREATE POLICY "Allow public insert"
  ON jersey_signups FOR INSERT
  WITH CHECK (true);

-- 5. Enable real-time for this table
--    (Supabase > Database > Replication — or run this SQL)
ALTER PUBLICATION supabase_realtime ADD TABLE jersey_signups;
