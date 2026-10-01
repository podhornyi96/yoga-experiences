-- Optional per-slot overrides (null = use event template defaults).
ALTER TABLE slots ADD COLUMN price_eur REAL;
ALTER TABLE slots ADD COLUMN duration_minutes INTEGER;
