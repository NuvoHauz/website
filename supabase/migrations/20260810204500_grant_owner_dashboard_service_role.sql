-- Forward fix for owner dashboard SECURITY INVOKER RPCs.
-- Safe to apply after 20260810170000_add_owner_reservation_dashboard.sql.
-- Does not alter RLS policies, grants to anon/authenticated, or existing row data.

GRANT SELECT, UPDATE
ON TABLE public.booking_requests
TO service_role;

GRANT SELECT, INSERT, UPDATE
ON TABLE public.availability_blocks
TO service_role;

NOTIFY pgrst, 'reload schema';
