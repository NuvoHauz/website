-- ROLLBACK PLAN for supabase/migrations/20260810170000_add_owner_reservation_dashboard.sql
-- Run manually in Supabase SQL Editor ONLY if you need to undo the owner dashboard migration.
-- Review carefully before executing. This does not restore dropped data inside new columns.

BEGIN;

-- 1) Remove admin/dashboard RPCs (safe if public booking never depended on them)
DROP FUNCTION IF EXISTS public.admin_deactivate_manual_block(uuid, text);
DROP FUNCTION IF EXISTS public.admin_create_manual_block(text, date, date, text, text, text);
DROP FUNCTION IF EXISTS public.admin_update_booking_request(uuid, text, text);
DROP FUNCTION IF EXISTS public.expire_owner_holds();
DROP FUNCTION IF EXISTS public.expire_elapsed_approval_holds();

-- 2) Remove overlap/index objects added by the migration
ALTER TABLE public.availability_blocks
  DROP CONSTRAINT IF EXISTS availability_blocks_no_active_overlap;

DROP INDEX IF EXISTS public.availability_blocks_one_active_per_request_idx;

-- 3) Remove dashboard columns (only if no production data relies on them yet)
ALTER TABLE public.availability_blocks
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS block_expires_at,
  DROP COLUMN IF EXISTS booking_request_id;

ALTER TABLE public.booking_requests
  DROP COLUMN IF EXISTS reviewed_by,
  DROP COLUMN IF EXISTS reviewed_at,
  DROP COLUMN IF EXISTS hold_expires_at;

-- btree_gist may be shared; drop only if nothing else needs it.
-- DROP EXTENSION IF EXISTS btree_gist;

NOTIFY pgrst, 'reload schema';

COMMIT;
