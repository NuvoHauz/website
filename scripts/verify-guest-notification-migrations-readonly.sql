-- Read-only verification after guest-notification migrations.

-- 1. Migration history
SELECT version, name
FROM supabase_migrations.schema_migrations
WHERE version IN ('20260817200000', '20260817210000')
ORDER BY version;

-- 2. booking_notification_deliveries table + RLS
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'booking_notification_deliveries';

-- 3. Table privileges (anon/authenticated/service_role)
SELECT
  grantee,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'booking_notification_deliveries'
  AND grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY grantee
ORDER BY grantee;

-- 4. claim_guest_notification_delivery function metadata
SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS signature,
  CASE p.prosecdef WHEN true THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security_mode,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'claim_guest_notification_delivery';

-- 5. booking_requests.guest_locale column + check constraint
SELECT
  c.column_name,
  c.data_type,
  c.is_nullable,
  cc.check_clause
FROM information_schema.columns c
LEFT JOIN information_schema.constraint_column_usage ccu
  ON ccu.table_schema = c.table_schema
 AND ccu.table_name = c.table_name
 AND ccu.column_name = c.column_name
LEFT JOIN information_schema.check_constraints cc
  ON cc.constraint_name = ccu.constraint_name
WHERE c.table_schema = 'public'
  AND c.table_name = 'booking_requests'
  AND c.column_name = 'guest_locale';

-- 6. admin_update_booking_request metadata + one-hour hold in source
SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS signature,
  CASE p.prosecdef WHEN true THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security_mode,
  pg_get_functiondef(p.oid) LIKE '%interval ''1 hour''%' AS uses_one_hour_interval
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'admin_update_booking_request';

-- 7. Pricing settings unchanged (row count + active flag snapshot)
SELECT
  property_slug,
  currency,
  mon_tue_wed_rate_cents,
  thursday_rate_cents,
  fri_sat_rate_cents,
  sunday_rate_cents,
  cleaning_fee_cents,
  included_guest_count,
  extra_guest_fee_cents,
  maximum_guest_count,
  active
FROM public.property_pricing_settings
WHERE property_slug = 'riu-house';

-- 8. Core booking tables still present
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'booking_requests',
    'availability_blocks',
    'property_pricing_settings',
    'property_minimum_stay_rules',
    'booking_notification_deliveries'
  )
ORDER BY table_name;
