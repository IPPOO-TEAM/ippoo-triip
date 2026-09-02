-- =============================================================================
-- IPPOO TRIIP -- Migration 002 : champs de profil étendus
-- Ajoute les champs collectés à l'inscription :
--   users : country, department, commune, quartier, referral_code_used
--   drivers : invitation_key
-- =============================================================================

-- ─── ippoo_triip_users ───────────────────────────────────────────────────────

ALTER TABLE ippoo_triip_users
  ADD COLUMN IF NOT EXISTS country            TEXT,
  ADD COLUMN IF NOT EXISTS department         TEXT,
  ADD COLUMN IF NOT EXISTS commune            TEXT,
  ADD COLUMN IF NOT EXISTS quartier           TEXT,
  ADD COLUMN IF NOT EXISTS referral_code_used TEXT,
  ADD COLUMN IF NOT EXISTS invitation_key     TEXT;

-- Index pour les parrainages (recherche de code existant)
CREATE INDEX IF NOT EXISTS idx_ippoo_triip_users_referral_code
  ON ippoo_triip_users (referral_code);

CREATE INDEX IF NOT EXISTS idx_ippoo_triip_users_referral_code_used
  ON ippoo_triip_users (referral_code_used);

-- Index pays (filtres admin)
CREATE INDEX IF NOT EXISTS idx_ippoo_triip_users_country
  ON ippoo_triip_users (country);

-- ─── ippoo_triip_drivers ─────────────────────────────────────────────────────

ALTER TABLE ippoo_triip_drivers
  ADD COLUMN IF NOT EXISTS invitation_key     TEXT,
  ADD COLUMN IF NOT EXISTS country            TEXT,
  ADD COLUMN IF NOT EXISTS department         TEXT,
  ADD COLUMN IF NOT EXISTS commune            TEXT,
  ADD COLUMN IF NOT EXISTS quartier           TEXT;

-- ─── RLS policies (si non déjà en place) ─────────────────────────────────────

-- Assure que les utilisateurs peuvent lire/mettre à jour leur propre profil
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ippoo_triip_users' AND policyname = 'users_self_update'
  ) THEN
    CREATE POLICY users_self_update ON ippoo_triip_users
      FOR UPDATE USING (auth.uid()::text = id)
      WITH CHECK (auth.uid()::text = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ippoo_triip_users' AND policyname = 'users_self_select'
  ) THEN
    CREATE POLICY users_self_select ON ippoo_triip_users
      FOR SELECT USING (auth.uid()::text = id);
  END IF;
END $$;

-- ─── Realtime (activer sur les nouvelles colonnes) ───────────────────────────
-- La publication Realtime est définie table par table ; cette ligne recrée la
-- publication si elle n'existe pas encore. Si elle existe déjà, le ALTER
-- TABLE ci-dessus suffit — Realtime suit automatiquement toutes les colonnes.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime FOR TABLE
      ippoo_triip_users,
      ippoo_triip_rides,
      ippoo_triip_notifications,
      ippoo_triip_wallets,
      ippoo_triip_transactions;
  END IF;
END $$;
