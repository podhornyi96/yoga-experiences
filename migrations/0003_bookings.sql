-- Bookings created after Stripe deposit (or later manually).
-- Slot inventory stays on `slots.status`; money state lives here.

CREATE TABLE bookings (
  id TEXT PRIMARY KEY NOT NULL,
  slot_id TEXT NOT NULL,
  experience_slug TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  guest_email TEXT,
  guest_name TEXT,
  guest_phone TEXT,
  people INTEGER NOT NULL DEFAULT 1,
  mats INTEGER NOT NULL DEFAULT 0,
  total_eur REAL NOT NULL,
  deposit_eur REAL NOT NULL,
  remaining_eur REAL NOT NULL,
  payment_status TEXT NOT NULL CHECK (
    payment_status IN ('deposit_paid', 'paid_in_full', 'cancelled', 'refunded')
  ),
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  notes TEXT,
  paid_in_full_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (slot_id) REFERENCES slots(id)
);

CREATE UNIQUE INDEX idx_bookings_stripe_session
  ON bookings(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

CREATE INDEX idx_bookings_slot ON bookings(slot_id);
CREATE INDEX idx_bookings_status ON bookings(payment_status);
CREATE INDEX idx_bookings_starts ON bookings(starts_at);
CREATE INDEX idx_bookings_created ON bookings(created_at);
