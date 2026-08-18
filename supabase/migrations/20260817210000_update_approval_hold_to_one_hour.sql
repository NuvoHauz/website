-- Forward fix: approval payment holds expire after 1 hour (not 48 hours).
-- Safe to apply after owner dashboard migration. Does not alter existing row data.
-- Preserves function signature, security settings, grants, and transition logic.

CREATE OR REPLACE FUNCTION public.admin_update_booking_request(
  p_booking_request_id uuid,
  p_action text,
  p_owner text
)
RETURNS SETOF public.booking_requests
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_row public.booking_requests%ROWTYPE;
  v_now timestamptz := now();
  v_hold_until timestamptz := now() + interval '1 hour';
BEGIN
  SELECT *
  INTO v_row
  FROM public.booking_requests
  WHERE id = p_booking_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking_request_not_found'
      USING ERRCODE = 'P0002';
  END IF;

  IF p_action = 'approve_hold' THEN
    IF v_row.status NOT IN ('submitted', 'pending', 'under_review', 'approved') THEN
      RAISE EXCEPTION 'invalid_status_transition'
        USING ERRCODE = 'P0001';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.availability_blocks AS blocks
      WHERE blocks.property_slug = v_row.property_slug
        AND blocks.status = 'active'
        AND (blocks.block_expires_at IS NULL OR blocks.block_expires_at > v_now)
        AND daterange(blocks.start_date, blocks.end_date, '[)')
            && daterange(v_row.check_in, v_row.check_out, '[)')
        AND (blocks.booking_request_id IS NULL OR blocks.booking_request_id <> v_row.id)
    ) THEN
      RAISE EXCEPTION 'dates_unavailable'
        USING ERRCODE = '23505';
    END IF;

    UPDATE public.availability_blocks
    SET status = 'inactive', updated_at = v_now
    WHERE booking_request_id = v_row.id
      AND status = 'active';

    INSERT INTO public.availability_blocks (
      property_slug,
      start_date,
      end_date,
      block_type,
      status,
      internal_note,
      booking_request_id,
      block_expires_at,
      created_by
    ) VALUES (
      v_row.property_slug,
      v_row.check_in,
      v_row.check_out,
      'approval_hold',
      'active',
      '1-hour approval hold',
      v_row.id,
      v_hold_until,
      p_owner
    );

    RETURN QUERY
    UPDATE public.booking_requests
    SET
      status = 'approved_hold',
      hold_expires_at = v_hold_until,
      reviewed_at = v_now,
      reviewed_by = p_owner,
      updated_at = v_now
    WHERE id = v_row.id
    RETURNING *;

  ELSIF p_action = 'confirm' THEN
    IF v_row.status <> 'approved_hold' THEN
      RAISE EXCEPTION 'invalid_status_transition'
        USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.availability_blocks
    SET
      block_type = 'confirmed_reservation',
      block_expires_at = NULL,
      updated_at = v_now
    WHERE booking_request_id = v_row.id
      AND status = 'active';

    RETURN QUERY
    UPDATE public.booking_requests
    SET
      status = 'confirmed',
      hold_expires_at = NULL,
      reviewed_at = v_now,
      reviewed_by = p_owner,
      updated_at = v_now
    WHERE id = v_row.id
    RETURNING *;

  ELSIF p_action = 'decline' THEN
    IF v_row.status NOT IN (
      'submitted', 'pending', 'under_review', 'approved', 'approved_hold'
    ) THEN
      RAISE EXCEPTION 'invalid_status_transition'
        USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.availability_blocks
    SET status = 'inactive', block_expires_at = NULL, updated_at = v_now
    WHERE booking_request_id = v_row.id
      AND status = 'active';

    RETURN QUERY
    UPDATE public.booking_requests
    SET
      status = 'declined',
      hold_expires_at = NULL,
      reviewed_at = v_now,
      reviewed_by = p_owner,
      updated_at = v_now
    WHERE id = v_row.id
    RETURNING *;

  ELSIF p_action = 'cancel' THEN
    IF v_row.status NOT IN ('confirmed', 'approved_hold') THEN
      RAISE EXCEPTION 'invalid_status_transition'
        USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.availability_blocks
    SET status = 'inactive', block_expires_at = NULL, updated_at = v_now
    WHERE booking_request_id = v_row.id
      AND status = 'active';

    RETURN QUERY
    UPDATE public.booking_requests
    SET
      status = 'cancelled',
      hold_expires_at = NULL,
      reviewed_at = v_now,
      reviewed_by = p_owner,
      updated_at = v_now
    WHERE id = v_row.id
    RETURNING *;

  ELSE
    RAISE EXCEPTION 'unsupported_action'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
