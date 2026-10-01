-- Event multi-booking capacity + manual participants.
ALTER TABLE slots ADD COLUMN seats_taken INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN added_manually INTEGER NOT NULL DEFAULT 0;

-- Soft seat reservations for events (do not flip slot status to held).
CREATE TABLE event_reservations (
  id TEXT PRIMARY KEY NOT NULL,
  slot_id TEXT NOT NULL,
  hold_token TEXT NOT NULL UNIQUE,
  people INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (slot_id) REFERENCES slots(id)
);

CREATE INDEX idx_event_reservations_slot ON event_reservations (slot_id);
CREATE INDEX idx_event_reservations_expires ON event_reservations (expires_at);
