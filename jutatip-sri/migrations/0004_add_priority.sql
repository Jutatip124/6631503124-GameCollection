ALTER TABLE games ADD COLUMN priority TEXT DEFAULT 'medium'
  CHECK(priority IN ('low', 'medium', 'high'));
