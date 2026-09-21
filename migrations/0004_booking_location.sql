-- Park chosen at Private / Tandem checkout (null for group experiences).
ALTER TABLE bookings ADD COLUMN location_id TEXT;
