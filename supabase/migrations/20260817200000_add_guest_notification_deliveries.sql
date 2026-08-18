-- Guest notification delivery tracking and booking locale for multilingual emails.
-- Forward-only. Does not modify existing booking row data beyond new column defaults.

ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS guest_locale text NULL;

ALTER TABLE public.booking_requests
  ADD CONSTRAINT booking_requests_guest_locale_check
    CHECK (
      guest_locale IS NULL
      OR guest_locale IN ('en', 'es', 'fr', 'de')
    );

CREATE TABLE IF NOT EXISTS public.booking_notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_request_id uuid NOT NULL
    REFERENCES public.booking_requests(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  recipient_type text NOT NULL,
  recipient_masked text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempt_count smallint NOT NULL DEFAULT 0,
  resend_email_id text NULL,
  sent_at timestamptz NULL,
  delivered_at timestamptz NULL,
  last_error_code text NULL,
  claimed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_notification_deliveries_event_type_check
    CHECK (
      event_type IN (
        'request_received',
        'approved',
        'confirmed',
        'declined',
        'expired',
        'cancelled'
      )
    ),
  CONSTRAINT booking_notification_deliveries_recipient_type_check
    CHECK (recipient_type IN ('guest', 'owner')),
  CONSTRAINT booking_notification_deliveries_status_check
    CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'delivered')),
  CONSTRAINT booking_notification_deliveries_attempt_count_check
    CHECK (attempt_count >= 0),
  CONSTRAINT booking_notification_deliveries_unique_event
    UNIQUE (booking_request_id, event_type, recipient_type)
);

CREATE INDEX IF NOT EXISTS booking_notification_deliveries_booking_idx
  ON public.booking_notification_deliveries (booking_request_id);

ALTER TABLE public.booking_notification_deliveries ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.booking_notification_deliveries FROM PUBLIC;
REVOKE ALL ON TABLE public.booking_notification_deliveries FROM anon;
REVOKE ALL ON TABLE public.booking_notification_deliveries FROM authenticated;
GRANT ALL ON TABLE public.booking_notification_deliveries TO service_role;

CREATE OR REPLACE FUNCTION public.claim_guest_notification_delivery(
  p_booking_request_id uuid,
  p_event_type text,
  p_recipient_type text,
  p_recipient_masked text
)
RETURNS SETOF public.booking_notification_deliveries
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.booking_notification_deliveries (
    booking_request_id,
    event_type,
    recipient_type,
    recipient_masked,
    status
  ) VALUES (
    p_booking_request_id,
    p_event_type,
    p_recipient_type,
    p_recipient_masked,
    'pending'
  )
  ON CONFLICT (booking_request_id, event_type, recipient_type) DO NOTHING;

  RETURN QUERY
  UPDATE public.booking_notification_deliveries AS deliveries
  SET
    status = 'sending',
    claimed_at = now(),
    attempt_count = deliveries.attempt_count + 1,
    recipient_masked = p_recipient_masked,
    updated_at = now()
  WHERE deliveries.booking_request_id = p_booking_request_id
    AND deliveries.event_type = p_event_type
    AND deliveries.recipient_type = p_recipient_type
    AND deliveries.status <> 'sent'
    AND deliveries.status <> 'delivered'
    AND (
      deliveries.status IN ('pending', 'failed')
      OR (
        deliveries.status = 'sending'
        AND deliveries.claimed_at IS NOT NULL
        AND deliveries.claimed_at < now() - interval '10 minutes'
      )
    )
  RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_guest_notification_delivery(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_guest_notification_delivery(uuid, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.claim_guest_notification_delivery(uuid, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_guest_notification_delivery(uuid, text, text, text) TO service_role;
