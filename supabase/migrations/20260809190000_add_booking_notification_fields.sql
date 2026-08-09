-- Booking inquiry notification tracking for Riu House (Option B).
-- Safe to apply once on public.booking_requests only.
-- Does not modify existing row data beyond new column defaults.
-- Does not alter RLS policies or unrelated tables.

ALTER TABLE public.booking_requests
  ADD COLUMN notification_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN notification_sent_at timestamptz NULL,
  ADD COLUMN notification_claimed_at timestamptz NULL,
  ADD COLUMN notification_attempts smallint NOT NULL DEFAULT 0,
  ADD COLUMN notification_last_error_code text NULL,
  ADD COLUMN notification_provider_id text NULL;

ALTER TABLE public.booking_requests
  ADD CONSTRAINT booking_requests_notification_status_check
    CHECK (notification_status IN ('pending', 'sending', 'sent', 'failed'));

ALTER TABLE public.booking_requests
  ADD CONSTRAINT booking_requests_notification_attempts_check
    CHECK (notification_attempts >= 0);

-- Fail clearly if duplicate non-null idempotency keys exist; do not delete or alter rows.
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.booking_requests
    WHERE idempotency_key IS NOT NULL
    GROUP BY idempotency_key
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Migration aborted: public.booking_requests contains duplicate idempotency_key values';
  END IF;
END
$migration$;

-- Add single-column uniqueness only when no equivalent unique index exists.
DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_index AS index_row
    INNER JOIN pg_catalog.pg_class AS table_row
      ON index_row.indrelid = table_row.oid
    INNER JOIN pg_catalog.pg_namespace AS schema_row
      ON table_row.relnamespace = schema_row.oid
    INNER JOIN pg_catalog.pg_attribute AS attribute_row
      ON attribute_row.attrelid = table_row.oid
      AND attribute_row.attnum = index_row.indkey[0]
    WHERE schema_row.nspname = 'public'
      AND table_row.relname = 'booking_requests'
      AND index_row.indisunique
      AND index_row.indisvalid
      AND index_row.indisready
      AND index_row.indislive
      AND index_row.indnkeyatts = 1
      AND index_row.indpred IS NULL
      AND index_row.indexprs IS NULL
      AND attribute_row.attname = 'idempotency_key'
  ) THEN
    ALTER TABLE public.booking_requests
      ADD CONSTRAINT booking_requests_idempotency_key_key
      UNIQUE (idempotency_key);
  END IF;
END
$migration$;

-- Atomically claim a notification send attempt.
-- Returns the full row when claim succeeds; otherwise no rows.
-- Allows reclaim of stale 'sending' claims after 10 minutes.
CREATE OR REPLACE FUNCTION public.claim_booking_notification(p_idempotency_key uuid)
RETURNS SETOF public.booking_requests
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE public.booking_requests
  SET
    notification_status = 'sending',
    notification_claimed_at = now(),
    notification_attempts = notification_attempts + 1
  WHERE idempotency_key = p_idempotency_key
    AND (
      notification_status IN ('pending', 'failed')
      OR (
        notification_status = 'sending'
        AND notification_claimed_at IS NOT NULL
        AND notification_claimed_at < now() - interval '10 minutes'
      )
    )
  RETURNING *;
$$;

REVOKE ALL ON FUNCTION public.claim_booking_notification(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_booking_notification(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.claim_booking_notification(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_booking_notification(uuid) TO service_role;
