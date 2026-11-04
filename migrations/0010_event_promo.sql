-- Early bird promo on trainer-organised event slots.
-- All three promo_* fields must be set together (or all null).
ALTER TABLE slots ADD COLUMN promo_price_eur REAL;
ALTER TABLE slots ADD COLUMN promo_ends_on TEXT;
ALTER TABLE slots ADD COLUMN promo_max_bookings INTEGER;
-- Claimed early-bird seats (paid promo bookings + active promo holds).
ALTER TABLE slots ADD COLUMN promo_seats_taken INTEGER NOT NULL DEFAULT 0;

-- Soft holds that reserved an early-bird seat until Stripe TTL.
ALTER TABLE event_reservations ADD COLUMN promo INTEGER NOT NULL DEFAULT 0;

-- Paid bookings that used the early-bird price.
ALTER TABLE bookings ADD COLUMN promo_applied INTEGER NOT NULL DEFAULT 0;
