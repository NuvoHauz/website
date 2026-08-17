-- Read-only audit of migrations 20260809190000 through 20260810231000
-- Safe: SELECT-only against catalog views. No DDL/DML.

WITH expected AS (
  SELECT *
  FROM (VALUES
    -- 20260809190000_add_booking_notification_fields
    ('20260809190000', 'column', 'booking_requests.notification_status', 'text NOT NULL'),
    ('20260809190000', 'column', 'booking_requests.notification_sent_at', 'timestamptz NULL'),
    ('20260809190000', 'column', 'booking_requests.notification_claimed_at', 'timestamptz NULL'),
    ('20260809190000', 'column', 'booking_requests.notification_attempts', 'smallint NOT NULL'),
    ('20260809190000', 'column', 'booking_requests.notification_last_error_code', 'text NULL'),
    ('20260809190000', 'column', 'booking_requests.notification_provider_id', 'text NULL'),
    ('20260809190000', 'constraint', 'booking_requests_notification_status_check', 'pending,sending,sent,failed'),
    ('20260809190000', 'constraint', 'booking_requests_notification_attempts_check', 'notification_attempts >= 0'),
    ('20260809190000', 'index', 'booking_requests.idempotency_key unique', 'unique single-column'),
    ('20260809190000', 'function', 'claim_booking_notification(uuid)', 'SETOF booking_requests SECURITY INVOKER'),
    ('20260809190000', 'grant', 'claim_booking_notification(uuid) EXECUTE service_role', 'true'),
    ('20260809190000', 'grant', 'claim_booking_notification(uuid) no PUBLIC/anon/authenticated', 'true'),

    -- 20260809201100_grant_booking_notification_claim
    ('20260809201100', 'function_absent', 'claim_booking_notification(text)', 'must not exist'),
    ('20260809201100', 'grant', 'booking_requests UPDATE service_role', 'true'),

    -- 20260810170000_add_owner_reservation_dashboard
    ('20260810170000', 'extension', 'btree_gist', 'installed'),
    ('20260810170000', 'column', 'booking_requests.hold_expires_at', 'timestamptz NULL'),
    ('20260810170000', 'column', 'booking_requests.reviewed_at', 'timestamptz NULL'),
    ('20260810170000', 'column', 'booking_requests.reviewed_by', 'text NULL'),
    ('20260810170000', 'column', 'availability_blocks.booking_request_id', 'uuid NULL FK booking_requests'),
    ('20260810170000', 'column', 'availability_blocks.block_expires_at', 'timestamptz NULL'),
    ('20260810170000', 'column', 'availability_blocks.created_by', 'text NULL'),
    ('20260810170000', 'index', 'availability_blocks_one_active_per_request_idx', 'partial unique'),
    ('20260810170000', 'constraint', 'availability_blocks_no_active_overlap', 'EXCLUDE gist active overlap'),
    ('20260810170000', 'function', 'expire_owner_holds()', 'integer SECURITY INVOKER'),
    ('20260810170000', 'function', 'admin_update_booking_request(uuid,text,text)', 'SETOF booking_requests SECURITY INVOKER'),
    ('20260810170000', 'function', 'admin_create_manual_block(text,date,date,text,text,text)', 'SETOF availability_blocks SECURITY INVOKER'),
    ('20260810170000', 'function', 'admin_deactivate_manual_block(uuid,text)', 'SETOF availability_blocks SECURITY INVOKER'),
    ('20260810170000', 'grant', 'expire_owner_holds() EXECUTE service_role only', 'true'),
    ('20260810170000', 'grant', 'admin_update_booking_request EXECUTE service_role only', 'true'),
    ('20260810170000', 'grant', 'admin_create_manual_block EXECUTE service_role only', 'true'),
    ('20260810170000', 'grant', 'admin_deactivate_manual_block EXECUTE service_role only', 'true'),

    -- 20260810204500_grant_owner_dashboard_service_role
    ('20260810204500', 'grant', 'booking_requests SELECT service_role', 'true'),
    ('20260810204500', 'grant', 'booking_requests UPDATE service_role', 'true'),
    ('20260810204500', 'grant', 'availability_blocks SELECT service_role', 'true'),
    ('20260810204500', 'grant', 'availability_blocks INSERT service_role', 'true'),
    ('20260810204500', 'grant', 'availability_blocks UPDATE service_role', 'true'),

    -- 20260810213000_extend_availability_block_types
    ('20260810213000', 'constraint', 'availability_valid_block_type', 'owner_stay,maintenance,other,approval_hold,confirmed_reservation'),

    -- 20260810221000_extend_booking_request_statuses
    ('20260810221000', 'constraint', 'booking_valid_status', 'submitted,pending,under_review,approved,approved_hold,confirmed,declined,rejected,cancelled,expired'),

    -- 20260810231000_extend_availability_block_statuses
    ('20260810231000', 'constraint', 'availability_valid_status', 'active,inactive')
  ) AS t(migration_id, check_type, check_name, expected_value)
),
column_checks AS (
  SELECT
    e.migration_id,
    e.check_type,
    e.check_name,
    e.expected_value,
    CASE
      WHEN c.column_name IS NULL THEN 'MISSING'
      ELSE c.data_type ||
        CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE ' NULL' END
    END AS actual_value,
    CASE
      WHEN c.column_name IS NULL THEN 'FAIL'
      WHEN e.check_name = 'booking_requests.notification_status' AND c.data_type = 'text' AND c.is_nullable = 'NO' THEN 'PASS'
      WHEN e.check_name = 'booking_requests.notification_attempts' AND c.data_type = 'smallint' AND c.is_nullable = 'NO' THEN 'PASS'
      WHEN e.check_name LIKE '%timestamptz NULL' AND c.data_type = 'timestamp with time zone' AND c.is_nullable = 'YES' THEN 'PASS'
      WHEN e.check_name LIKE '%text NULL' AND c.data_type = 'text' AND c.is_nullable = 'YES' THEN 'PASS'
      WHEN e.check_name = 'availability_blocks.booking_request_id' AND c.data_type = 'uuid' AND c.is_nullable = 'YES' THEN 'PASS'
      ELSE 'PARTIAL'
    END AS status
  FROM expected e
  LEFT JOIN information_schema.columns c
    ON e.check_type = 'column'
   AND c.table_schema = 'public'
   AND c.table_name = split_part(e.check_name, '.', 1)
   AND c.column_name = split_part(e.check_name, '.', 2)
  WHERE e.check_type = 'column'
),
fk_booking_request AS (
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN pg_class frel ON frel.oid = con.confrelid
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'availability_blocks'
      AND frel.relname = 'booking_requests'
      AND con.contype = 'f'
      AND con.conkey = ARRAY[
        (SELECT attnum FROM pg_attribute
         WHERE attrelid = rel.oid AND attname = 'booking_request_id' AND NOT attisdropped)
      ]
  ) AS has_fk
),
constraint_checks AS (
  SELECT
    e.migration_id,
    e.check_type,
    e.check_name,
    e.expected_value,
    COALESCE(pg_get_constraintdef(con.oid), 'MISSING') AS actual_value,
    CASE
      WHEN con.oid IS NULL THEN 'FAIL'
      WHEN e.check_name = 'booking_requests_notification_status_check'
        AND pg_get_constraintdef(con.oid) LIKE '%notification_status%'
        AND pg_get_constraintdef(con.oid) LIKE '%pending%'
        AND pg_get_constraintdef(con.oid) LIKE '%sending%'
        AND pg_get_constraintdef(con.oid) LIKE '%sent%'
        AND pg_get_constraintdef(con.oid) LIKE '%failed%' THEN 'PASS'
      WHEN e.check_name = 'booking_requests_notification_attempts_check'
        AND pg_get_constraintdef(con.oid) LIKE '%notification_attempts >= 0%' THEN 'PASS'
      WHEN e.check_name = 'availability_blocks_no_active_overlap'
        AND pg_get_constraintdef(con.oid) ILIKE '%EXCLUDE%'
        AND pg_get_constraintdef(con.oid) ILIKE '%gist%' THEN 'PASS'
      WHEN e.check_name = 'availability_valid_block_type'
        AND pg_get_constraintdef(con.oid) LIKE '%owner_stay%'
        AND pg_get_constraintdef(con.oid) LIKE '%approval_hold%'
        AND pg_get_constraintdef(con.oid) LIKE '%confirmed_reservation%' THEN 'PASS'
      WHEN e.check_name = 'booking_valid_status'
        AND pg_get_constraintdef(con.oid) LIKE '%approved_hold%'
        AND pg_get_constraintdef(con.oid) LIKE '%expired%' THEN 'PASS'
      WHEN e.check_name = 'availability_valid_status'
        AND pg_get_constraintdef(con.oid) LIKE '%active%'
        AND pg_get_constraintdef(con.oid) LIKE '%inactive%' THEN 'PASS'
      ELSE 'PARTIAL'
    END AS status
  FROM expected e
  LEFT JOIN pg_constraint con
    ON con.conname = e.check_name
  LEFT JOIN pg_class rel ON rel.oid = con.conrelid
  LEFT JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    AND nsp.nspname = 'public'
  WHERE e.check_type = 'constraint'
),
index_checks AS (
  SELECT
    e.migration_id,
    e.check_type,
    e.check_name,
    e.expected_value,
    CASE
      WHEN e.check_name = 'booking_requests.idempotency_key unique' THEN
        CASE WHEN EXISTS (
          SELECT 1
          FROM pg_index i
          JOIN pg_class t ON t.oid = i.indrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = i.indkey[0]
          WHERE n.nspname = 'public'
            AND t.relname = 'booking_requests'
            AND i.indisunique
            AND a.attname = 'idempotency_key'
            AND i.indnkeyatts = 1
        ) THEN 'unique index present' ELSE 'MISSING' END
      WHEN e.check_name = 'availability_blocks_one_active_per_request_idx' THEN
        COALESCE((
          SELECT indexname FROM pg_indexes
          WHERE schemaname = 'public'
            AND tablename = 'availability_blocks'
            AND indexname = 'availability_blocks_one_active_per_request_idx'
          LIMIT 1
        ), 'MISSING')
      ELSE 'unknown'
    END AS actual_value,
    CASE
      WHEN e.check_name = 'booking_requests.idempotency_key unique' AND EXISTS (
        SELECT 1
        FROM pg_index i
        JOIN pg_class t ON t.oid = i.indrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = i.indkey[0]
        WHERE n.nspname = 'public'
          AND t.relname = 'booking_requests'
          AND i.indisunique
          AND a.attname = 'idempotency_key'
          AND i.indnkeyatts = 1
      ) THEN 'PASS'
      WHEN e.check_name = 'availability_blocks_one_active_per_request_idx' AND EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'availability_blocks'
          AND indexname = 'availability_blocks_one_active_per_request_idx'
      ) THEN 'PASS'
      WHEN e.check_name = 'booking_requests.idempotency_key unique' THEN 'FAIL'
      WHEN e.check_name = 'availability_blocks_one_active_per_request_idx' THEN 'FAIL'
      ELSE 'PARTIAL'
    END AS status
  FROM expected e
  WHERE e.check_type = 'index'
),
extension_checks AS (
  SELECT
    e.migration_id,
    e.check_type,
    e.check_name,
    e.expected_value,
    CASE WHEN ext.extname IS NOT NULL THEN ext.extname ELSE 'MISSING' END AS actual_value,
    CASE WHEN ext.extname = 'btree_gist' THEN 'PASS' ELSE 'FAIL' END AS status
  FROM expected e
  LEFT JOIN pg_extension ext ON ext.extname = e.check_name
  WHERE e.check_type = 'extension'
),
function_meta AS (
  SELECT
    p.oid,
    n.nspname,
    p.proname,
    pg_get_function_identity_arguments(p.oid) AS args,
    pg_get_function_result(p.oid) AS result,
    CASE p.prosecdef WHEN true THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security,
    p.provolatile
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
),
function_checks AS (
  SELECT
    e.migration_id,
    e.check_type,
    e.check_name,
    e.expected_value,
    COALESCE(fm.proname || '(' || fm.args || ') -> ' || fm.result || ' ' || fm.security, 'MISSING') AS actual_value,
    CASE
      WHEN fm.oid IS NULL THEN 'FAIL'
      WHEN e.check_name = 'claim_booking_notification(uuid)'
        AND fm.proname = 'claim_booking_notification'
        AND fm.args = 'p_idempotency_key uuid'
        AND fm.result LIKE '%booking_requests%'
        AND fm.security = 'SECURITY INVOKER' THEN 'PASS'
      WHEN e.check_name = 'expire_owner_holds()'
        AND fm.proname = 'expire_owner_holds'
        AND fm.args = ''
        AND fm.result = 'integer'
        AND fm.security = 'SECURITY INVOKER' THEN 'PASS'
      WHEN e.check_name = 'admin_update_booking_request(uuid,text,text)'
        AND fm.proname = 'admin_update_booking_request'
        AND fm.security = 'SECURITY INVOKER' THEN 'PASS'
      WHEN e.check_name = 'admin_create_manual_block(text,date,date,text,text,text)'
        AND fm.proname = 'admin_create_manual_block'
        AND fm.security = 'SECURITY INVOKER' THEN 'PASS'
      WHEN e.check_name = 'admin_deactivate_manual_block(uuid,text)'
        AND fm.proname = 'admin_deactivate_manual_block'
        AND fm.security = 'SECURITY INVOKER' THEN 'PASS'
      ELSE 'PARTIAL'
    END AS status
  FROM expected e
  LEFT JOIN function_meta fm
    ON e.check_type = 'function'
   AND (
     (e.check_name = 'claim_booking_notification(uuid)' AND fm.proname = 'claim_booking_notification' AND fm.args = 'p_idempotency_key uuid')
     OR (e.check_name = 'expire_owner_holds()' AND fm.proname = 'expire_owner_holds' AND fm.args = '')
     OR (e.check_name = 'admin_update_booking_request(uuid,text,text)' AND fm.proname = 'admin_update_booking_request')
     OR (e.check_name = 'admin_create_manual_block(text,date,date,text,text,text)' AND fm.proname = 'admin_create_manual_block')
     OR (e.check_name = 'admin_deactivate_manual_block(uuid,text)' AND fm.proname = 'admin_deactivate_manual_block')
   )
  WHERE e.check_type = 'function'
),
function_absent_checks AS (
  SELECT
    e.migration_id,
    e.check_type,
    e.check_name,
    e.expected_value,
    COALESCE(fm.proname || '(' || fm.args || ')', 'absent') AS actual_value,
    CASE
      WHEN fm.oid IS NULL THEN 'PASS'
      ELSE 'FAIL'
    END AS status
  FROM expected e
  LEFT JOIN function_meta fm
    ON e.check_type = 'function_absent'
   AND fm.proname = 'claim_booking_notification'
   AND fm.args = 'p_idempotency_key text'
  WHERE e.check_type = 'function_absent'
),
grant_checks AS (
  SELECT
    e.migration_id,
    e.check_type,
    e.check_name,
    e.expected_value,
    CASE
      WHEN e.check_name = 'claim_booking_notification(uuid) EXECUTE service_role' THEN
        CASE WHEN has_function_privilege('service_role', 'public.claim_booking_notification(uuid)', 'EXECUTE') THEN 'service_role EXECUTE=true' ELSE 'service_role EXECUTE=false' END
      WHEN e.check_name = 'claim_booking_notification(uuid) no PUBLIC/anon/authenticated' THEN
        'public=' || has_function_privilege('public', 'public.claim_booking_notification(uuid)', 'EXECUTE')::text ||
        ', anon=' || has_function_privilege('anon', 'public.claim_booking_notification(uuid)', 'EXECUTE')::text ||
        ', authenticated=' || has_function_privilege('authenticated', 'public.claim_booking_notification(uuid)', 'EXECUTE')::text
      WHEN e.check_name = 'booking_requests UPDATE service_role' THEN
        'UPDATE=' || has_table_privilege('service_role', 'public.booking_requests', 'UPDATE')::text
      WHEN e.check_name = 'booking_requests SELECT service_role' THEN
        'SELECT=' || has_table_privilege('service_role', 'public.booking_requests', 'SELECT')::text
      WHEN e.check_name = 'availability_blocks SELECT service_role' THEN
        'SELECT=' || has_table_privilege('service_role', 'public.availability_blocks', 'SELECT')::text
      WHEN e.check_name = 'availability_blocks INSERT service_role' THEN
        'INSERT=' || has_table_privilege('service_role', 'public.availability_blocks', 'INSERT')::text
      WHEN e.check_name = 'availability_blocks UPDATE service_role' THEN
        'UPDATE=' || has_table_privilege('service_role', 'public.availability_blocks', 'UPDATE')::text
      WHEN e.check_name LIKE '%EXECUTE service_role only' THEN
        CASE
          WHEN e.check_name LIKE 'expire_owner_holds%' THEN
            'service_role=' || has_function_privilege('service_role', 'public.expire_owner_holds()', 'EXECUTE')::text
          WHEN e.check_name LIKE 'admin_update_booking_request%' THEN
            'service_role=' || has_function_privilege('service_role', 'public.admin_update_booking_request(uuid, text, text)', 'EXECUTE')::text
          WHEN e.check_name LIKE 'admin_create_manual_block%' THEN
            'service_role=' || has_function_privilege('service_role', 'public.admin_create_manual_block(text, date, date, text, text, text)', 'EXECUTE')::text
          WHEN e.check_name LIKE 'admin_deactivate_manual_block%' THEN
            'service_role=' || has_function_privilege('service_role', 'public.admin_deactivate_manual_block(uuid, text)', 'EXECUTE')::text
        END
      ELSE 'unknown'
    END AS actual_value,
    CASE
      WHEN e.check_name = 'claim_booking_notification(uuid) EXECUTE service_role'
        AND has_function_privilege('service_role', 'public.claim_booking_notification(uuid)', 'EXECUTE') THEN 'PASS'
      WHEN e.check_name = 'claim_booking_notification(uuid) no PUBLIC/anon/authenticated'
        AND NOT has_function_privilege('public', 'public.claim_booking_notification(uuid)', 'EXECUTE')
        AND NOT has_function_privilege('anon', 'public.claim_booking_notification(uuid)', 'EXECUTE')
        AND NOT has_function_privilege('authenticated', 'public.claim_booking_notification(uuid)', 'EXECUTE') THEN 'PASS'
      WHEN e.check_name = 'booking_requests UPDATE service_role'
        AND has_table_privilege('service_role', 'public.booking_requests', 'UPDATE') THEN 'PASS'
      WHEN e.check_name = 'booking_requests SELECT service_role'
        AND has_table_privilege('service_role', 'public.booking_requests', 'SELECT') THEN 'PASS'
      WHEN e.check_name = 'availability_blocks SELECT service_role'
        AND has_table_privilege('service_role', 'public.availability_blocks', 'SELECT') THEN 'PASS'
      WHEN e.check_name = 'availability_blocks INSERT service_role'
        AND has_table_privilege('service_role', 'public.availability_blocks', 'INSERT') THEN 'PASS'
      WHEN e.check_name = 'availability_blocks UPDATE service_role'
        AND has_table_privilege('service_role', 'public.availability_blocks', 'UPDATE') THEN 'PASS'
      WHEN e.check_name = 'expire_owner_holds() EXECUTE service_role only'
        AND has_function_privilege('service_role', 'public.expire_owner_holds()', 'EXECUTE') THEN 'PASS'
      WHEN e.check_name = 'admin_update_booking_request EXECUTE service_role only'
        AND has_function_privilege('service_role', 'public.admin_update_booking_request(uuid, text, text)', 'EXECUTE') THEN 'PASS'
      WHEN e.check_name = 'admin_create_manual_block EXECUTE service_role only'
        AND has_function_privilege('service_role', 'public.admin_create_manual_block(text, date, date, text, text, text)', 'EXECUTE') THEN 'PASS'
      WHEN e.check_name = 'admin_deactivate_manual_block EXECUTE service_role only'
        AND has_function_privilege('service_role', 'public.admin_deactivate_manual_block(uuid, text)', 'EXECUTE') THEN 'PASS'
      ELSE 'FAIL'
    END AS status
  FROM expected e
  WHERE e.check_type = 'grant'
),
fk_check_row AS (
  SELECT
    '20260810170000'::text AS migration_id,
    'column'::text AS check_type,
    'availability_blocks.booking_request_id FK'::text AS check_name,
    'uuid NULL FK booking_requests'::text AS expected_value,
    CASE WHEN (SELECT has_fk FROM fk_booking_request) THEN 'FK present' ELSE 'MISSING' END AS actual_value,
    CASE WHEN (SELECT has_fk FROM fk_booking_request) THEN 'PASS' ELSE 'FAIL' END AS status
),
all_checks AS (
  SELECT * FROM column_checks
  UNION ALL SELECT * FROM constraint_checks
  UNION ALL SELECT * FROM index_checks
  UNION ALL SELECT * FROM extension_checks
  UNION ALL SELECT * FROM function_checks
  UNION ALL SELECT * FROM function_absent_checks
  UNION ALL SELECT * FROM grant_checks
  UNION ALL SELECT * FROM fk_check_row
)
SELECT
  migration_id,
  check_type,
  check_name,
  expected_value,
  actual_value,
  status
FROM all_checks
ORDER BY migration_id, check_type, check_name;
