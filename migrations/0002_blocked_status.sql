-- Allow status `blocked` (sibling slots closed when another session that day is booked).
PRAGMA foreign_keys=OFF;

CREATE TABLE slots_new (
  id TEXT PRIMARY KEY NOT NULL,
  experience_slug TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  day TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('open', 'held', 'booked', 'cancelled', 'blocked')
  ),
  hold_token TEXT,
  hold_expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO slots_new (
  id, experience_slug, starts_at, day, status,
  hold_token, hold_expires_at, created_at, updated_at
)
SELECT
  id, experience_slug, starts_at, day, status,
  hold_token, hold_expires_at, created_at, updated_at
FROM slots;

DROP TABLE slots;
ALTER TABLE slots_new RENAME TO slots;

CREATE INDEX idx_slots_slug_status ON slots (experience_slug, status);
CREATE INDEX idx_slots_day_status ON slots (day, status);
CREATE INDEX idx_slots_hold_expires ON slots (status, hold_expires_at);

PRAGMA foreign_keys=ON;
