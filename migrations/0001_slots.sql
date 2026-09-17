-- Schedule slots for group experiences (Europe/Lisbon wall time).
CREATE TABLE slots (
  id TEXT PRIMARY KEY NOT NULL,
  experience_slug TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  day TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'held', 'booked', 'cancelled')),
  hold_token TEXT,
  hold_expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_slots_slug_status ON slots (experience_slug, status);
CREATE INDEX idx_slots_day_status ON slots (day, status);
CREATE INDEX idx_slots_hold_expires ON slots (status, hold_expires_at);
