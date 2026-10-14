-- Gift certificates. A row exists only after Stripe payment.
-- Redeeming creates a paid-in-full booking and sets status to redeemed.

CREATE TABLE gifts (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL,
  experience_slug TEXT NOT NULL,
  people INTEGER NOT NULL,
  amount_eur REAL NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  message TEXT,
  -- YYYY-MM-DD Lisbon date. NULL means the recipient email (if any) is not scheduled.
  deliver_on TEXT,
  buyer_email_sent_at TEXT,
  recipient_email_sent_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'redeemed')),
  expires_at TEXT NOT NULL,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  hold_token TEXT,
  hold_slot_id TEXT,
  hold_expires_at TEXT,
  redeemed_booking_id TEXT,
  redeemed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_gifts_code ON gifts(code);

CREATE UNIQUE INDEX idx_gifts_stripe_session
  ON gifts(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

CREATE INDEX idx_gifts_status ON gifts(status, expires_at);
CREATE INDEX idx_gifts_deliver ON gifts(deliver_on, recipient_email_sent_at);
CREATE INDEX idx_gifts_created ON gifts(created_at);
