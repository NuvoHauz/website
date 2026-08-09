-- Forward fix for claim_booking_notification (SECURITY INVOKER).
-- Safe to apply after 20260809190000_add_booking_notification_fields.sql.
-- Does not alter existing row data.

DROP FUNCTION IF EXISTS public.claim_booking_notification(text);

GRANT UPDATE
ON TABLE public.booking_requests
TO service_role;

NOTIFY pgrst, 'reload schema';
