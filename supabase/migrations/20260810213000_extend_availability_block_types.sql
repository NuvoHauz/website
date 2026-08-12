-- Extend availability_blocks.block_type for owner dashboard approval holds.
-- Safe to apply after 20260810170000_add_owner_reservation_dashboard.sql.
-- Production CHECK constraint currently allows manual block types only.

ALTER TABLE public.availability_blocks
  DROP CONSTRAINT IF EXISTS availability_valid_block_type;

ALTER TABLE public.availability_blocks
  ADD CONSTRAINT availability_valid_block_type
  CHECK (block_type IN (
    'owner_stay',
    'maintenance',
    'other',
    'approval_hold',
    'confirmed_reservation'
  ));

NOTIFY pgrst, 'reload schema';
