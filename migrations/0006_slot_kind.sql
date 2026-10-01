-- Inventory slots (instant book) vs trainer-organised events.
ALTER TABLE slots ADD COLUMN kind TEXT NOT NULL DEFAULT 'inventory';
