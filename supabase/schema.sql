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
  email         text        CHECK (email IS NULL OR length(email) <= 255),
  size          text        NOT NULL
                            CHECK (size IN ('S', 'M', 'L', 'XL')),
  notified      boolean     NOT NULL DEFAULT false,
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

-- 5. Allow anyone to update (editing jersey number / size)
CREATE POLICY "Allow public update"
  ON jersey_signups FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 6. Enable real-time for this table
--    (Supabase > Database > Replication — or run this SQL)
ALTER PUBLICATION supabase_realtime ADD TABLE jersey_signups;


-- ============================================================
-- Lineups (pre-match planning)
-- Adds three tables: lineups, lineup_slots, lineup_subs.
-- Slot indices 0–10 are starters, 11–15 are bench.
-- ============================================================

-- 7. lineups — one row per saved formation
CREATE TABLE IF NOT EXISTS lineups (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL
                          CHECK (length(trim(name)) > 0
                            AND length(name) <= 100),
  formation   text        NOT NULL
                          CHECK (length(trim(formation)) > 0
                            AND length(formation) <= 20),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 8. lineup_slots — 11 starters (0–10) + 5 bench (11–15) per lineup
CREATE TABLE IF NOT EXISTS lineup_slots (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  lineup_id     uuid        NOT NULL
                            REFERENCES lineups(id) ON DELETE CASCADE,
  slot_index    int         NOT NULL
                            CHECK (slot_index BETWEEN 0 AND 15),
  -- Starters carry a position_code from a fixed set; bench slots are NULL.
  position_code text        CHECK (
                              (slot_index BETWEEN 0 AND 10
                                AND position_code IN
                                  ('GK','CB','LB','RB','CDM','CM','CAM','LM','RM','LW','RW','ST'))
                           OR (slot_index BETWEEN 11 AND 15 AND position_code IS NULL)
                            ),
  -- Removing a player from jersey_signups frees their slot rather than
  -- destroying the lineup structure.
  player_id     uuid        REFERENCES jersey_signups(id) ON DELETE SET NULL,
  UNIQUE (lineup_id, slot_index)
);

-- A player can occupy at most one slot in a given lineup (only enforced
-- when actually assigned — NULL player_ids are ignored).
CREATE UNIQUE INDEX IF NOT EXISTS lineup_slots_one_player_per_lineup
  ON lineup_slots (lineup_id, player_id)
  WHERE player_id IS NOT NULL;

-- 9. lineup_subs — bench→starter "covers" links, scoped to a lineup
CREATE TABLE IF NOT EXISTS lineup_subs (
  id                 uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  lineup_id          uuid        NOT NULL
                                 REFERENCES lineups(id) ON DELETE CASCADE,
  -- If either player is deleted from jersey_signups, the link disappears.
  bench_player_id    uuid        NOT NULL
                                 REFERENCES jersey_signups(id) ON DELETE CASCADE,
  starter_player_id  uuid        NOT NULL
                                 REFERENCES jersey_signups(id) ON DELETE CASCADE,
  created_at         timestamptz NOT NULL DEFAULT now(),
  CHECK (bench_player_id <> starter_player_id),
  UNIQUE (lineup_id, bench_player_id, starter_player_id)
);

-- Trigger: verify each sub link references a bench player and a starter
-- player that are both currently assigned in the same lineup.
CREATE OR REPLACE FUNCTION lineup_subs_validate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM lineup_slots
    WHERE lineup_id = NEW.lineup_id
      AND player_id = NEW.bench_player_id
      AND slot_index BETWEEN 11 AND 15
  ) THEN
    RAISE EXCEPTION 'bench_player_id % is not in a bench slot of lineup %',
      NEW.bench_player_id, NEW.lineup_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM lineup_slots
    WHERE lineup_id = NEW.lineup_id
      AND player_id = NEW.starter_player_id
      AND slot_index BETWEEN 0 AND 10
  ) THEN
    RAISE EXCEPTION 'starter_player_id % is not in a starter slot of lineup %',
      NEW.starter_player_id, NEW.lineup_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lineup_subs_validate_trigger ON lineup_subs;
CREATE TRIGGER lineup_subs_validate_trigger
  BEFORE INSERT OR UPDATE ON lineup_subs
  FOR EACH ROW EXECUTE FUNCTION lineup_subs_validate();

-- Bump lineups.updated_at whenever slots or subs change, so the sidebar
-- (sorted by updated_at desc) reflects recency of any edit.
CREATE OR REPLACE FUNCTION touch_lineup_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  lid uuid;
BEGIN
  lid := COALESCE(NEW.lineup_id, OLD.lineup_id);
  UPDATE lineups SET updated_at = now() WHERE id = lid;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS lineup_slots_touch_lineup ON lineup_slots;
CREATE TRIGGER lineup_slots_touch_lineup
  AFTER INSERT OR UPDATE OR DELETE ON lineup_slots
  FOR EACH ROW EXECUTE FUNCTION touch_lineup_updated_at();

DROP TRIGGER IF EXISTS lineup_subs_touch_lineup ON lineup_subs;
CREATE TRIGGER lineup_subs_touch_lineup
  AFTER INSERT OR UPDATE OR DELETE ON lineup_subs
  FOR EACH ROW EXECUTE FUNCTION touch_lineup_updated_at();

-- Direct edits to lineups (e.g. rename) also bump updated_at.
CREATE OR REPLACE FUNCTION lineups_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lineups_set_updated_at_trigger ON lineups;
CREATE TRIGGER lineups_set_updated_at_trigger
  BEFORE UPDATE ON lineups
  FOR EACH ROW EXECUTE FUNCTION lineups_set_updated_at();

-- 10. RLS — public read/insert/update/delete, matching the jersey_signups pattern.
ALTER TABLE lineups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineup_slots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineup_subs   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read"   ON lineups      FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON lineups      FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON lineups      FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON lineups      FOR DELETE USING (true);

CREATE POLICY "Allow public read"   ON lineup_slots FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON lineup_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON lineup_slots FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON lineup_slots FOR DELETE USING (true);

CREATE POLICY "Allow public read"   ON lineup_subs  FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON lineup_subs  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON lineup_subs  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON lineup_subs  FOR DELETE USING (true);

-- 11. Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE lineups;
ALTER PUBLICATION supabase_realtime ADD TABLE lineup_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE lineup_subs;
