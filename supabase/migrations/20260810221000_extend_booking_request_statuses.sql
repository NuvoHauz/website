-- Extend booking_requests.status for owner dashboard review workflow.
-- Safe to apply after 20260810170000_add_owner_reservation_dashboard.sql.
-- Production CHECK constraint currently rejects approved_hold and related statuses.

ALTER TABLE public.booking_requests
  DROP CONSTRAINT IF EXISTS booking_valid_status;

ALTER TABLE public.booking_requests
  ADD CONSTRAINT booking_valid_status
  CHECK (status IN (
    'submitted',
    'pending',
    'under_review',
    'approved',
    'approved_hold',
    'confirmed',
    'declined',
    'rejected',
    'cancelled',
    'expired'
  ));

NOTIFY pgrst, 'reload schema';
