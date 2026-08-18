-- Migration number: 0001 	 2026-08-18T08:53:00.013Z
-- Drop table เดิมถ้ามี (ถ้าอยากเริ่มใหม่)
DROP TABLE IF EXISTS tasks;

-- Create games table
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  genre TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'want_to_play'
    CHECK(status IN ('want_to_play', 'playing', 'completed', 'dropped')),
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  review TEXT,
  image_url TEXT,
  played_hours INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_genre ON games(genre);
CREATE INDEX idx_games_platform ON games(platform);