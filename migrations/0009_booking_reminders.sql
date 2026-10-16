-- Guest reminder send markers + teacher daily digest idempotency.

ALTER TABLE bookings ADD COLUMN reminder_24h_sent_at TEXT;
ALTER TABLE bookings ADD COLUMN reminder_12h_sent_at TEXT;
ALTER TABLE bookings ADD COLUMN reminder_3h_sent_at TEXT;

CREATE TABLE teacher_reminder_digests (
  id TEXT PRIMARY KEY NOT NULL,
  sent_at TEXT NOT NULL
);
