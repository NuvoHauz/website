-- Phase 1: Riu House nightly pricing, minimum-stay rules, holidays, and overrides.
-- Forward-only. Safe to apply after prior Riu House migrations.
-- Does not alter existing booking or availability row data.

CREATE TABLE IF NOT EXISTS public.property_pricing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_slug text NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  mon_tue_wed_rate_cents integer NULL,
  thursday_rate_cents integer NULL,
  fri_sat_rate_cents integer NULL,
  sunday_rate_cents integer NULL,
  cleaning_fee_cents integer NOT NULL DEFAULT 8000,
  included_guest_count integer NOT NULL DEFAULT 6,
  extra_guest_fee_cents integer NOT NULL DEFAULT 2500,
  maximum_guest_count integer NOT NULL DEFAULT 8,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT property_pricing_settings_property_slug_key UNIQUE (property_slug),
  CONSTRAINT property_pricing_settings_currency_check
    CHECK (currency IN ('USD')),
  CONSTRAINT property_pricing_settings_cleaning_fee_nonnegative_check
    CHECK (cleaning_fee_cents >= 0),
  CONSTRAINT property_pricing_settings_included_guest_count_check
    CHECK (included_guest_count >= 1),
  CONSTRAINT property_pricing_settings_extra_guest_fee_nonnegative_check
    CHECK (extra_guest_fee_cents >= 0),
  CONSTRAINT property_pricing_settings_maximum_guest_count_check
    CHECK (maximum_guest_count >= 1 AND maximum_guest_count <= 8),
  CONSTRAINT property_pricing_settings_guest_count_range_check
    CHECK (maximum_guest_count >= included_guest_count),
  CONSTRAINT property_pricing_settings_mon_tue_wed_rate_nonnegative_check
    CHECK (mon_tue_wed_rate_cents IS NULL OR mon_tue_wed_rate_cents >= 0),
  CONSTRAINT property_pricing_settings_thursday_rate_nonnegative_check
    CHECK (thursday_rate_cents IS NULL OR thursday_rate_cents >= 0),
  CONSTRAINT property_pricing_settings_fri_sat_rate_nonnegative_check
    CHECK (fri_sat_rate_cents IS NULL OR fri_sat_rate_cents >= 0),
  CONSTRAINT property_pricing_settings_sunday_rate_nonnegative_check
    CHECK (sunday_rate_cents IS NULL OR sunday_rate_cents >= 0),
  CONSTRAINT property_pricing_settings_publish_requires_complete_rates_check
    CHECK (
      NOT active
      OR (
        mon_tue_wed_rate_cents > 0
        AND thursday_rate_cents > 0
        AND fri_sat_rate_cents > 0
        AND sunday_rate_cents > 0
        AND cleaning_fee_cents >= 0
        AND included_guest_count >= 1
        AND extra_guest_fee_cents >= 0
        AND maximum_guest_count >= included_guest_count
        AND maximum_guest_count <= 8
      )
    )
);

CREATE TABLE IF NOT EXISTS public.property_minimum_stay_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_slug text NOT NULL,
  check_in_day_of_week smallint NOT NULL CHECK (check_in_day_of_week BETWEEN 0 AND 6),
  minimum_nights integer NOT NULL CHECK (minimum_nights >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT property_minimum_stay_rules_property_day_key
    UNIQUE (property_slug, check_in_day_of_week)
);

CREATE TABLE IF NOT EXISTS public.property_holiday_pricing_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_slug text NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  adjustment_type text NOT NULL CHECK (adjustment_type IN ('fixed_rate', 'percentage')),
  adjustment_value integer NOT NULL,
  minimum_nights integer NOT NULL DEFAULT 1 CHECK (minimum_nights >= 1),
  priority integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date),
  CONSTRAINT property_holiday_pricing_periods_fixed_rate_positive_check
    CHECK (adjustment_type <> 'fixed_rate' OR adjustment_value > 0),
  CONSTRAINT property_holiday_pricing_periods_percentage_range_check
    CHECK (
      adjustment_type <> 'percentage'
      OR (adjustment_value >= 0 AND adjustment_value <= 500)
    )
);

COMMENT ON COLUMN public.property_holiday_pricing_periods.adjustment_value IS
  'For fixed_rate: nightly rate in cents. For percentage: whole-number percent increase (20 = +20%).';

CREATE TABLE IF NOT EXISTS public.property_nightly_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_slug text NOT NULL,
  override_date date NOT NULL,
  nightly_rate_cents integer NOT NULL CHECK (nightly_rate_cents >= 0),
  minimum_nights integer NULL CHECK (minimum_nights IS NULL OR minimum_nights >= 1),
  internal_reason text NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT property_nightly_overrides_property_date_key
    UNIQUE (property_slug, override_date)
);

ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS pricing_currency text NULL,
  ADD COLUMN IF NOT EXISTS pricing_nights_count integer NULL,
  ADD COLUMN IF NOT EXISTS pricing_nightly_subtotal_cents integer NULL,
  ADD COLUMN IF NOT EXISTS pricing_cleaning_fee_cents integer NULL,
  ADD COLUMN IF NOT EXISTS pricing_estimated_total_cents integer NULL,
  ADD COLUMN IF NOT EXISTS pricing_nightly_breakdown jsonb NULL,
  ADD COLUMN IF NOT EXISTS pricing_calculated_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS pricing_included_guest_count integer NULL,
  ADD COLUMN IF NOT EXISTS pricing_extra_guest_count integer NULL,
  ADD COLUMN IF NOT EXISTS pricing_extra_guest_fee_cents integer NULL,
  ADD COLUMN IF NOT EXISTS pricing_extra_guest_total_cents integer NULL,
  ADD COLUMN IF NOT EXISTS pricing_maximum_guest_count integer NULL,
  ADD COLUMN IF NOT EXISTS pricing_total_chargeable_guests integer NULL;

INSERT INTO public.property_pricing_settings (
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
)
VALUES (
  'riu-house',
  'USD',
  25000,
  25000,
  27000,
  25000,
  8000,
  6,
  2500,
  8,
  false
)
ON CONFLICT (property_slug) DO NOTHING;

INSERT INTO public.property_minimum_stay_rules (property_slug, check_in_day_of_week, minimum_nights)
VALUES
  ('riu-house', 1, 1),
  ('riu-house', 2, 1),
  ('riu-house', 3, 1),
  ('riu-house', 4, 2),
  ('riu-house', 5, 2),
  ('riu-house', 6, 2),
  ('riu-house', 0, 1)
ON CONFLICT (property_slug, check_in_day_of_week) DO NOTHING;

ALTER TABLE public.property_pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_minimum_stay_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_holiday_pricing_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_nightly_overrides ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.property_pricing_settings FROM anon, authenticated;
REVOKE ALL ON TABLE public.property_minimum_stay_rules FROM anon, authenticated;
REVOKE ALL ON TABLE public.property_holiday_pricing_periods FROM anon, authenticated;
REVOKE ALL ON TABLE public.property_nightly_overrides FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.property_pricing_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.property_minimum_stay_rules TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.property_holiday_pricing_periods TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.property_nightly_overrides TO service_role;

NOTIFY pgrst, 'reload schema';
