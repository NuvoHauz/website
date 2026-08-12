-- Extend availability_blocks.status for deactivate/cancel/decline flows.
-- Safe to apply after owner dashboard migrations.
-- Production CHECK constraint currently allows active only.

ALTER TABLE public.availability_blocks
  DROP CONSTRAINT IF EXISTS availability_valid_status;

ALTER TABLE public.availability_blocks
  ADD CONSTRAINT availability_valid_status
  CHECK (status IN ('active', 'inactive'));

NOTIFY pgrst, 'reload schema';
