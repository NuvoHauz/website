-- Owner dashboard: booking review fields, block linkage, overlap protection, and admin RPCs.
-- Safe to apply after prior Riu House migrations.
-- Aborts if overlapping active blocks already exist.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS hold_expires_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS reviewed_by text NULL;

ALTER TABLE public.availability_blocks
  ADD COLUMN IF NOT EXISTS booking_request_id uuid NULL
    REFERENCES public.booking_requests(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS block_expires_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS created_by text NULL;

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.availability_blocks AS a
    INNER JOIN public.availability_blocks AS b
      ON a.id <> b.id
      AND a.property_slug = b.property_slug
      AND a.status = 'active'
      AND b.status = 'active'
      AND daterange(a.start_date, a.end_date, '[)')
          && daterange(b.start_date, b.end_date, '[)')
  ) THEN
    RAISE EXCEPTION
      'Migration aborted: overlapping active availability_blocks exist for the same property';
  END IF;
END
$migration$;

CREATE UNIQUE INDEX IF NOT EXISTS availability_blocks_one_active_per_request_idx
  ON public.availability_blocks (booking_request_id)
  WHERE status = 'active' AND booking_request_id IS NOT NULL;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conname = 'availability_blocks_no_active_overlap'
      AND conrelid = 'public.availability_blocks'::regclass
  ) THEN
    ALTER TABLE public.availability_blocks
      ADD CONSTRAINT availability_blocks_no_active_overlap
      EXCLUDE USING gist (
        property_slug WITH =,
        daterange(start_date, end_date, '[)') WITH &&
      )
      WHERE (status = 'active');
  END IF;
END
$migration$;

CREATE OR REPLACE FUNCTION public.expire_owner_holds()
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_expired_count integer := 0;
BEGIN
  WITH expired_requests AS (
    UPDATE public.booking_requests
    SET
      status = 'expired',
      hold_expires_at = NULL,
      updated_at = now()
    WHERE status = 'approved_hold'
      AND hold_expires_at IS NOT NULL
      AND hold_expires_at <= now()
    RETURNING id
  )
  UPDATE public.availability_blocks AS blocks
  SET
    status = 'inactive',
    block_expires_at = NULL,
    updated_at = now()
  FROM expired_requests
  WHERE blocks.booking_request_id = expired_requests.id
    AND blocks.status = 'active';

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  RETURN v_expired_count;
END;
$$;

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
  v_hold_until timestamptz := now() + interval '48 hours';
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
      '48-hour approval hold',
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

CREATE OR REPLACE FUNCTION public.admin_create_manual_block(
  p_property_slug text,
  p_start_date date,
  p_end_date date,
  p_block_type text,
  p_internal_note text,
  p_owner text
)
RETURNS SETOF public.availability_blocks
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_end_date <= p_start_date THEN
    RAISE EXCEPTION 'invalid_date_range'
      USING ERRCODE = 'P0001';
  END IF;

  IF p_block_type NOT IN ('owner_stay', 'maintenance', 'other') THEN
    RAISE EXCEPTION 'invalid_block_type'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  INSERT INTO public.availability_blocks (
    property_slug,
    start_date,
    end_date,
    block_type,
    status,
    internal_note,
    created_by
  ) VALUES (
    p_property_slug,
    p_start_date,
    p_end_date,
    p_block_type,
    'active',
    NULLIF(trim(p_internal_note), ''),
    p_owner
  )
  RETURNING *;
EXCEPTION
  WHEN exclusion_violation THEN
    RAISE EXCEPTION 'dates_unavailable'
      USING ERRCODE = '23505';
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_deactivate_manual_block(
  p_block_id uuid,
  p_owner text
)
RETURNS SETOF public.availability_blocks
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_row public.availability_blocks%ROWTYPE;
BEGIN
  SELECT *
  INTO v_row
  FROM public.availability_blocks
  WHERE id = p_block_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'block_not_found'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_row.booking_request_id IS NOT NULL THEN
    RAISE EXCEPTION 'block_linked_to_request'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_row.status <> 'active' THEN
    RAISE EXCEPTION 'block_not_active'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  UPDATE public.availability_blocks
  SET
    status = 'inactive',
    updated_at = now()
  WHERE id = p_block_id
  RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_owner_holds() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.expire_owner_holds() FROM anon;
REVOKE ALL ON FUNCTION public.expire_owner_holds() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.expire_owner_holds() TO service_role;

REVOKE ALL ON FUNCTION public.admin_update_booking_request(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_booking_request(uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.admin_update_booking_request(uuid, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_booking_request(uuid, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.admin_create_manual_block(text, date, date, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_create_manual_block(text, date, date, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.admin_create_manual_block(text, date, date, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_manual_block(text, date, date, text, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.admin_deactivate_manual_block(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_deactivate_manual_block(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.admin_deactivate_manual_block(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_deactivate_manual_block(uuid, text) TO service_role;

NOTIFY pgrst, 'reload schema';
