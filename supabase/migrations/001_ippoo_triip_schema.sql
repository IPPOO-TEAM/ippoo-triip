-- =============================================================================
-- IPPOO TRIIP -- Schema complet
-- Appliquer dans : Supabase Dashboard > SQL Editor
-- https://supabase.com/dashboard/project/kirnmvptguicplaqiimi/sql
-- =============================================================================

-- =========================================================================
-- TYPES ENUMERES
-- =========================================================================

DO $$ BEGIN
  CREATE TYPE ippoo_triip_user_role AS ENUM ('client', 'driver', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ippoo_triip_kyc_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ippoo_triip_vehicle_type AS ENUM ('moto', 'tricycle', 'car', 'van', 'truck');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ippoo_triip_service_type AS ENUM (
    'taxi_moto', 'delivery', 'heavy_transport',
    'group_order', 'carpool', 'air_freight'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ippoo_triip_ride_status AS ENUM (
    'requested', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ippoo_triip_payment_method AS ENUM (
    'mtn_momo', 'moov_money', 'celtiis_cash', 'card', 'cash', 'wallet'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ippoo_triip_tx_type AS ENUM (
    'topup', 'ride_payment', 'withdrawal', 'refund', 'referral_bonus', 'promo_credit'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ippoo_triip_tx_status AS ENUM (
    'pending', 'processing', 'success', 'failed', 'reversed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ippoo_triip_notif_type AS ENUM ('ride', 'payment', 'promo', 'system', 'sos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ippoo_triip_referral_status AS ENUM ('pending', 'registered', 'rewarded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ippoo_triip_go_status AS ENUM (
    'open', 'locked', 'in_delivery', 'delivered', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ippoo_triip_af_status AS ENUM (
    'quoted', 'booked', 'in_transit', 'customs', 'delivered'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ippoo_triip_pay_status AS ENUM ('pending', 'success', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================================
-- TABLES
-- =========================================================================

-- Utilisateurs
CREATE TABLE IF NOT EXISTS ippoo_triip_users (
  id              TEXT PRIMARY KEY,
  role            ippoo_triip_user_role     NOT NULL DEFAULT 'client',
  full_name       TEXT                NOT NULL,
  phone           TEXT                UNIQUE NOT NULL,
  email           TEXT                UNIQUE,
  avatar_url      TEXT,
  city            TEXT                DEFAULT 'Cotonou',
  language        TEXT                DEFAULT 'fr',
  kyc_status      ippoo_triip_kyc_status    DEFAULT 'pending',
  kyc_verified_at TIMESTAMPTZ,
  referral_code   TEXT,
  created_at      TIMESTAMPTZ         DEFAULT NOW(),
  updated_at      TIMESTAMPTZ         DEFAULT NOW()
);

-- Chauffeurs (profil etendu)
CREATE TABLE IF NOT EXISTS ippoo_triip_drivers (
  id                    TEXT PRIMARY KEY REFERENCES ippoo_triip_users(id) ON DELETE CASCADE,
  vehicle_type          ippoo_triip_vehicle_type NOT NULL,
  vehicle_plate         TEXT               NOT NULL,
  license_number        TEXT,
  rating                DECIMAL(3,2)       DEFAULT 5.0 CHECK (rating BETWEEN 0 AND 5),
  total_rides           INTEGER            DEFAULT 0,
  is_online             BOOLEAN            DEFAULT FALSE,
  current_lat           DECIMAL(9,6),
  current_lng           DECIMAL(9,6),
  current_location_label TEXT,
  updated_at            TIMESTAMPTZ        DEFAULT NOW()
);

-- Wallets
CREATE TABLE IF NOT EXISTS ippoo_triip_wallets (
  user_id     TEXT PRIMARY KEY REFERENCES ippoo_triip_users(id) ON DELETE CASCADE,
  balance_xof INTEGER         DEFAULT 0 CHECK (balance_xof >= 0),
  pending_xof INTEGER         DEFAULT 0,
  currency    TEXT            DEFAULT 'XOF',
  updated_at  TIMESTAMPTZ     DEFAULT NOW()
);

-- Courses
CREATE TABLE IF NOT EXISTS ippoo_triip_rides (
  id                TEXT                 PRIMARY KEY,
  client_id         TEXT                 NOT NULL REFERENCES ippoo_triip_users(id),
  driver_id         TEXT                 REFERENCES ippoo_triip_drivers(id),
  service_type      ippoo_triip_service_type   NOT NULL,
  status            ippoo_triip_ride_status    NOT NULL DEFAULT 'requested',
  origin_lat        DECIMAL(9,6),
  origin_lng        DECIMAL(9,6),
  origin_label      TEXT,
  destination_lat   DECIMAL(9,6),
  destination_lng   DECIMAL(9,6),
  destination_label TEXT,
  price_xof         INTEGER              NOT NULL CHECK (price_xof > 0),
  distance_km       DECIMAL(6,2),
  duration_min      INTEGER,
  scheduled_at      TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ          DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);

-- Evenements de course (timeline)
CREATE TABLE IF NOT EXISTS ippoo_triip_ride_events (
  id           TEXT              PRIMARY KEY,
  ride_id      TEXT              NOT NULL REFERENCES ippoo_triip_rides(id) ON DELETE CASCADE,
  status       ippoo_triip_ride_status NOT NULL,
  label        TEXT              NOT NULL,
  location_lat DECIMAL(9,6),
  location_lng DECIMAL(9,6),
  created_at   TIMESTAMPTZ       DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS ippoo_triip_transactions (
  id          TEXT              PRIMARY KEY,
  user_id     TEXT              NOT NULL REFERENCES ippoo_triip_users(id),
  type        ippoo_triip_tx_type     NOT NULL,
  method      ippoo_triip_payment_method NOT NULL,
  amount_xof  INTEGER           NOT NULL CHECK (amount_xof > 0),
  status      ippoo_triip_tx_status   NOT NULL DEFAULT 'pending',
  reference   TEXT,
  ride_id     TEXT              REFERENCES ippoo_triip_rides(id),
  description TEXT,
  created_at  TIMESTAMPTZ       DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS ippoo_triip_notifications (
  id         TEXT              PRIMARY KEY,
  user_id    TEXT              NOT NULL REFERENCES ippoo_triip_users(id) ON DELETE CASCADE,
  type       ippoo_triip_notif_type  NOT NULL DEFAULT 'system',
  title      TEXT              NOT NULL,
  body       TEXT              NOT NULL,
  read       BOOLEAN           DEFAULT FALSE,
  metadata   JSONB,
  created_at TIMESTAMPTZ       DEFAULT NOW()
);

-- Parrainages
CREATE TABLE IF NOT EXISTS ippoo_triip_referrals (
  id             TEXT                  PRIMARY KEY,
  referrer_id    TEXT                  NOT NULL REFERENCES ippoo_triip_users(id),
  code           TEXT                  NOT NULL,
  invitee_phone  TEXT,
  invitee_name   TEXT,
  status         ippoo_triip_referral_status DEFAULT 'pending',
  reward_xof     INTEGER               DEFAULT 1000,
  created_at     TIMESTAMPTZ           DEFAULT NOW()
);

-- Commandes groupees
CREATE TABLE IF NOT EXISTS ippoo_triip_group_orders (
  id               TEXT            PRIMARY KEY,
  host_id          TEXT            NOT NULL REFERENCES ippoo_triip_users(id),
  title            TEXT            NOT NULL,
  vendor           TEXT            NOT NULL,
  status           ippoo_triip_go_status DEFAULT 'open',
  delivery_fee_xof INTEGER         DEFAULT 1000,
  total_xof        INTEGER         DEFAULT 0,
  deadline         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ     DEFAULT NOW()
);

-- Participants commandes groupees
CREATE TABLE IF NOT EXISTS ippoo_triip_group_order_participants (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  group_order_id  TEXT NOT NULL REFERENCES ippoo_triip_group_orders(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES ippoo_triip_users(id),
  name            TEXT        DEFAULT '',
  items           INTEGER     DEFAULT 1,
  amount_xof      INTEGER     DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_order_id, user_id)
);

-- Covoiturage
CREATE TABLE IF NOT EXISTS ippoo_triip_carpool_trips (
  id                  TEXT        PRIMARY KEY,
  driver_id           TEXT        NOT NULL,
  driver_name         TEXT        NOT NULL,
  origin_lat          DECIMAL(9,6),
  origin_lng          DECIMAL(9,6),
  origin_label        TEXT,
  destination_lat     DECIMAL(9,6),
  destination_lng     DECIMAL(9,6),
  destination_label   TEXT,
  depart_at           TIMESTAMPTZ NOT NULL,
  seats_total         INTEGER     DEFAULT 4,
  seats_left          INTEGER     DEFAULT 4,
  price_per_seat_xof  INTEGER,
  vehicle             TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Fret aerien
CREATE TABLE IF NOT EXISTS ippoo_triip_air_freight (
  id             TEXT            PRIMARY KEY,
  client_id      TEXT            NOT NULL REFERENCES ippoo_triip_users(id),
  from_airport   TEXT            NOT NULL,
  to_airport     TEXT            NOT NULL,
  weight_kg      DECIMAL(8,2)    NOT NULL CHECK (weight_kg > 0),
  category       TEXT            DEFAULT 'parcel',
  price_xof      INTEGER         NOT NULL,
  status         ippoo_triip_af_status DEFAULT 'booked',
  tracking_code  TEXT            UNIQUE,
  created_at     TIMESTAMPTZ     DEFAULT NOW()
);

-- Configuration plateforme
CREATE TABLE IF NOT EXISTS ippoo_triip_platform_config (
  key        TEXT PRIMARY KEY,
  value      JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications push (broadcast admin)
CREATE TABLE IF NOT EXISTS ippoo_triip_push_notifications (
  id         TEXT        PRIMARY KEY,
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  target     TEXT        DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OTPs (ephemere, nettoyage automatique)
CREATE TABLE IF NOT EXISTS ippoo_triip_otps (
  phone      TEXT        PRIMARY KEY,
  code       TEXT        NOT NULL,
  attempts   INTEGER     DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting
CREATE TABLE IF NOT EXISTS ippoo_triip_rate_limits (
  key      TEXT        PRIMARY KEY,
  count    INTEGER     DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL
);

-- Refresh tokens (revocation)
CREATE TABLE IF NOT EXISTS ippoo_triip_refresh_tokens (
  jti        TEXT        PRIMARY KEY,
  user_id    TEXT        NOT NULL REFERENCES ippoo_triip_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paiements Mobile Money (suivi)
CREATE TABLE IF NOT EXISTS ippoo_triip_payments (
  id         TEXT             PRIMARY KEY,
  user_id    TEXT             NOT NULL REFERENCES ippoo_triip_users(id),
  ride_id    TEXT             REFERENCES ippoo_triip_rides(id),
  amount_xof INTEGER          NOT NULL,
  method     TEXT             NOT NULL,
  status     ippoo_triip_pay_status DEFAULT 'pending',
  attempts   INTEGER          DEFAULT 0,
  expires_at TIMESTAMPTZ      NOT NULL,
  created_at TIMESTAMPTZ      DEFAULT NOW()
);

-- Abonnements
CREATE TABLE IF NOT EXISTS ippoo_triip_subscriptions (
  user_id    TEXT PRIMARY KEY REFERENCES ippoo_triip_users(id) ON DELETE CASCADE,
  plan       TEXT        DEFAULT 'free',
  status     TEXT        DEFAULT 'active',
  features   JSONB       DEFAULT '[]',
  started_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- INDEX
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_rides_client_id    ON ippoo_triip_rides(client_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id    ON ippoo_triip_rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status       ON ippoo_triip_rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_created_at   ON ippoo_triip_rides(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ride_events_ride   ON ippoo_triip_ride_events(ride_id);
CREATE INDEX IF NOT EXISTS idx_txns_user_id       ON ippoo_triip_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_txns_created_at    ON ippoo_triip_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifs_user_id     ON ippoo_triip_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifs_unread      ON ippoo_triip_notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifs_created_at  ON ippoo_triip_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refs_referrer      ON ippoo_triip_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_carpool_depart     ON ippoo_triip_carpool_trips(depart_at);
CREATE INDEX IF NOT EXISTS idx_af_client          ON ippoo_triip_air_freight(client_id);
CREATE INDEX IF NOT EXISTS idx_af_tracking        ON ippoo_triip_air_freight(tracking_code);
CREATE INDEX IF NOT EXISTS idx_rt_user_id         ON ippoo_triip_refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_rt_expires         ON ippoo_triip_refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_otps_expires       ON ippoo_triip_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_push_created       ON ippoo_triip_push_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drivers_online     ON ippoo_triip_drivers(is_online) WHERE is_online = TRUE;

-- =========================================================================
-- TRIGGERS -- updated_at automatique
-- =========================================================================

CREATE OR REPLACE FUNCTION ippoo_triip_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at   ON ippoo_triip_users;
DROP TRIGGER IF EXISTS trg_drivers_updated_at ON ippoo_triip_drivers;
DROP TRIGGER IF EXISTS trg_wallets_updated_at ON ippoo_triip_wallets;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON ippoo_triip_users
  FOR EACH ROW EXECUTE FUNCTION ippoo_triip_set_updated_at();

CREATE TRIGGER trg_drivers_updated_at
  BEFORE UPDATE ON ippoo_triip_drivers
  FOR EACH ROW EXECUTE FUNCTION ippoo_triip_set_updated_at();

CREATE TRIGGER trg_wallets_updated_at
  BEFORE UPDATE ON ippoo_triip_wallets
  FOR EACH ROW EXECUTE FUNCTION ippoo_triip_set_updated_at();

-- =========================================================================
-- NETTOYAGE AUTOMATIQUE (OTPs & refresh tokens expires)
-- =========================================================================

CREATE OR REPLACE FUNCTION ippoo_triip_cleanup_expired() RETURNS void LANGUAGE sql AS $$
  DELETE FROM ippoo_triip_otps WHERE expires_at < NOW();
  DELETE FROM ippoo_triip_refresh_tokens WHERE expires_at < NOW();
  DELETE FROM ippoo_triip_rate_limits WHERE reset_at < NOW();
$$;

-- =========================================================================
-- FONCTIONS HELPER pour RLS
-- =========================================================================

-- Extrait l'user ID depuis le JWT (claim "sub")
CREATE OR REPLACE FUNCTION ippoo_triip_uid() RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT NULLIF(
    COALESCE(
      auth.uid()::text,
      current_setting('request.jwt.claims', true)::jsonb->>'sub'
    ), ''
  )
$$;

-- Extrait le role IPPOO depuis le JWT (claim "ippoo_triip_role")
CREATE OR REPLACE FUNCTION ippoo_triip_role() RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'ippoo_triip_role', '')
$$;

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE ippoo_triip_users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ippoo_triip_drivers                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ippoo_triip_wallets                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ippoo_triip_rides                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ippoo_triip_ride_events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ippoo_triip_transactions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ippoo_triip_notifications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ippoo_triip_referrals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE ippoo_triip_group_orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ippoo_triip_group_order_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ippoo_triip_carpool_trips           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ippoo_triip_air_freight             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ippoo_triip_platform_config         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ippoo_triip_push_notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ippoo_triip_subscriptions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ippoo_triip_otps                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ippoo_triip_rate_limits             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ippoo_triip_refresh_tokens          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ippoo_triip_payments                ENABLE ROW LEVEL SECURITY;

-- ---- ippoo_triip_users ----
DROP POLICY IF EXISTS "users_own"       ON ippoo_triip_users;
DROP POLICY IF EXISTS "users_service"   ON ippoo_triip_users;
CREATE POLICY "users_own"     ON ippoo_triip_users FOR SELECT TO authenticated
  USING (id = ippoo_triip_uid());
CREATE POLICY "users_service" ON ippoo_triip_users FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---- ippoo_triip_drivers (lecture publique pour la recherche) ----
DROP POLICY IF EXISTS "drivers_read"    ON ippoo_triip_drivers;
DROP POLICY IF EXISTS "drivers_service" ON ippoo_triip_drivers;
CREATE POLICY "drivers_read"    ON ippoo_triip_drivers FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "drivers_service" ON ippoo_triip_drivers FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---- ippoo_triip_wallets ----
DROP POLICY IF EXISTS "wallets_own"     ON ippoo_triip_wallets;
DROP POLICY IF EXISTS "wallets_service" ON ippoo_triip_wallets;
CREATE POLICY "wallets_own"     ON ippoo_triip_wallets FOR SELECT TO authenticated
  USING (user_id = ippoo_triip_uid());
CREATE POLICY "wallets_service" ON ippoo_triip_wallets FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---- ippoo_triip_rides ----
DROP POLICY IF EXISTS "rides_participant" ON ippoo_triip_rides;
DROP POLICY IF EXISTS "rides_service"     ON ippoo_triip_rides;
CREATE POLICY "rides_participant" ON ippoo_triip_rides FOR SELECT TO authenticated
  USING (client_id = ippoo_triip_uid() OR driver_id = ippoo_triip_uid());
CREATE POLICY "rides_service"     ON ippoo_triip_rides FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---- ippoo_triip_ride_events ----
DROP POLICY IF EXISTS "ride_events_via_ride" ON ippoo_triip_ride_events;
DROP POLICY IF EXISTS "ride_events_service"  ON ippoo_triip_ride_events;
CREATE POLICY "ride_events_via_ride" ON ippoo_triip_ride_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ippoo_triip_rides r WHERE r.id = ride_id
    AND (r.client_id = ippoo_triip_uid() OR r.driver_id = ippoo_triip_uid())
  ));
CREATE POLICY "ride_events_service" ON ippoo_triip_ride_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---- ippoo_triip_transactions ----
DROP POLICY IF EXISTS "txns_own"     ON ippoo_triip_transactions;
DROP POLICY IF EXISTS "txns_service" ON ippoo_triip_transactions;
CREATE POLICY "txns_own"     ON ippoo_triip_transactions FOR SELECT TO authenticated
  USING (user_id = ippoo_triip_uid());
CREATE POLICY "txns_service" ON ippoo_triip_transactions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---- ippoo_triip_notifications ----
DROP POLICY IF EXISTS "notifs_own"     ON ippoo_triip_notifications;
DROP POLICY IF EXISTS "notifs_service" ON ippoo_triip_notifications;
CREATE POLICY "notifs_own"     ON ippoo_triip_notifications FOR SELECT TO authenticated
  USING (user_id = ippoo_triip_uid());
CREATE POLICY "notifs_service" ON ippoo_triip_notifications FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---- ippoo_triip_referrals ----
DROP POLICY IF EXISTS "refs_own"     ON ippoo_triip_referrals;
DROP POLICY IF EXISTS "refs_service" ON ippoo_triip_referrals;
CREATE POLICY "refs_own"     ON ippoo_triip_referrals FOR SELECT TO authenticated
  USING (referrer_id = ippoo_triip_uid());
CREATE POLICY "refs_service" ON ippoo_triip_referrals FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---- ippoo_triip_group_orders (marketplace : visible a tous les utilisateurs) ----
DROP POLICY IF EXISTS "go_read"    ON ippoo_triip_group_orders;
DROP POLICY IF EXISTS "go_service" ON ippoo_triip_group_orders;
CREATE POLICY "go_read"    ON ippoo_triip_group_orders FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "go_service" ON ippoo_triip_group_orders FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---- ippoo_triip_group_order_participants ----
DROP POLICY IF EXISTS "gop_own"     ON ippoo_triip_group_order_participants;
DROP POLICY IF EXISTS "gop_service" ON ippoo_triip_group_order_participants;
CREATE POLICY "gop_own"     ON ippoo_triip_group_order_participants FOR SELECT TO authenticated
  USING (user_id = ippoo_triip_uid());
CREATE POLICY "gop_service" ON ippoo_triip_group_order_participants FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---- ippoo_triip_carpool_trips (public) ----
DROP POLICY IF EXISTS "carpool_read"    ON ippoo_triip_carpool_trips;
DROP POLICY IF EXISTS "carpool_service" ON ippoo_triip_carpool_trips;
CREATE POLICY "carpool_read"    ON ippoo_triip_carpool_trips FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "carpool_service" ON ippoo_triip_carpool_trips FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---- ippoo_triip_air_freight ----
DROP POLICY IF EXISTS "af_own"     ON ippoo_triip_air_freight;
DROP POLICY IF EXISTS "af_service" ON ippoo_triip_air_freight;
CREATE POLICY "af_own"     ON ippoo_triip_air_freight FOR SELECT TO authenticated
  USING (client_id = ippoo_triip_uid());
CREATE POLICY "af_service" ON ippoo_triip_air_freight FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---- ippoo_triip_platform_config (lecture publique) ----
DROP POLICY IF EXISTS "config_read"    ON ippoo_triip_platform_config;
DROP POLICY IF EXISTS "config_service" ON ippoo_triip_platform_config;
CREATE POLICY "config_read"    ON ippoo_triip_platform_config FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "config_service" ON ippoo_triip_platform_config FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---- ippoo_triip_push_notifications (lecture pour les abonnes) ----
DROP POLICY IF EXISTS "push_read"    ON ippoo_triip_push_notifications;
DROP POLICY IF EXISTS "push_service" ON ippoo_triip_push_notifications;
CREATE POLICY "push_read"    ON ippoo_triip_push_notifications FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "push_service" ON ippoo_triip_push_notifications FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---- ippoo_triip_subscriptions ----
DROP POLICY IF EXISTS "subs_own"     ON ippoo_triip_subscriptions;
DROP POLICY IF EXISTS "subs_service" ON ippoo_triip_subscriptions;
CREATE POLICY "subs_own"     ON ippoo_triip_subscriptions FOR SELECT TO authenticated
  USING (user_id = ippoo_triip_uid());
CREATE POLICY "subs_service" ON ippoo_triip_subscriptions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Tables sensibles : service_role uniquement
DROP POLICY IF EXISTS "otps_svc"         ON ippoo_triip_otps;
DROP POLICY IF EXISTS "rate_svc"         ON ippoo_triip_rate_limits;
DROP POLICY IF EXISTS "rt_svc"           ON ippoo_triip_refresh_tokens;
DROP POLICY IF EXISTS "pay_svc"          ON ippoo_triip_payments;
CREATE POLICY "otps_svc"     ON ippoo_triip_otps             FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "rate_svc"     ON ippoo_triip_rate_limits       FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "rt_svc"       ON ippoo_triip_refresh_tokens    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "pay_svc"      ON ippoo_triip_payments          FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =========================================================================
-- PUBLICATION REALTIME
-- Active le streaming en temps reel sur les tables critiques
-- =========================================================================

DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE
  ippoo_triip_rides,
  ippoo_triip_ride_events,
  ippoo_triip_notifications,
  ippoo_triip_wallets,
  ippoo_triip_push_notifications,
  ippoo_triip_drivers;

-- Tokens FCM (push web/mobile par appareil)
CREATE TABLE IF NOT EXISTS ippoo_triip_fcm_tokens (
  id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id    TEXT        NOT NULL REFERENCES ippoo_triip_users(id) ON DELETE CASCADE,
  token      TEXT        NOT NULL UNIQUE,
  platform   TEXT        DEFAULT 'web',
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON ippoo_triip_fcm_tokens(user_id);

ALTER TABLE ippoo_triip_fcm_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fcm_own"     ON ippoo_triip_fcm_tokens;
DROP POLICY IF EXISTS "fcm_service" ON ippoo_triip_fcm_tokens;
CREATE POLICY "fcm_own"     ON ippoo_triip_fcm_tokens FOR SELECT TO authenticated
  USING (user_id = ippoo_triip_uid());
CREATE POLICY "fcm_service" ON ippoo_triip_fcm_tokens FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_fcm_updated_at ON ippoo_triip_fcm_tokens;
CREATE TRIGGER trg_fcm_updated_at
  BEFORE UPDATE ON ippoo_triip_fcm_tokens
  FOR EACH ROW EXECUTE FUNCTION ippoo_triip_set_updated_at();

-- =========================================================================
-- Aucune donnee de seed -- application vierge
-- =========================================================================
