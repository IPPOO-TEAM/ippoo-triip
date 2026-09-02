-- =========================================================================
-- 003 — PUBLICATION REALTIME (idempotent) + REPLICA IDENTITY
--
-- But : garantir que TOUTES les tables écoutées par le frontend
-- (hooks/use-realtime.ts) sont bien diffusées par Postgres en temps réel,
-- quelle que soit la migration déjà appliquée.
--
-- Contexte : la migration 002 ne (re)crée la publication QUE si elle
-- n'existe pas — elle n'AJOUTE donc pas les tables manquantes quand la
-- publication existe déjà. Ce script ajoute chaque table de façon sûre
-- (ignore l'erreur "déjà membre") et pose REPLICA IDENTITY FULL pour que
-- les événements UPDATE/DELETE transportent l'enregistrement complet et que
-- les filtres postgres_changes fonctionnent.
--
-- ▶ À exécuter dans Supabase → SQL Editor (ou via `supabase db push`).
--   Sans danger à ré-exécuter plusieurs fois.
--
-- NB : le chemin FIABLE cross-device reste le BROADCAST (canal
--   "ippoo_triip:global" / "user:{id}") émis par l'edge function via l'API
--   REST Realtime — il ne dépend NI de cette publication NI de la RLS.
--   Ce script n'active que le bonus "postgres_changes".
-- =========================================================================

-- 1) S'assurer que la publication existe.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- 2) Ajouter chaque table à la publication (idempotent).
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'ippoo_triip_rides',
    'ippoo_triip_ride_events',
    'ippoo_triip_notifications',
    'ippoo_triip_wallets',
    'ippoo_triip_push_notifications',
    'ippoo_triip_drivers',
    'ippoo_triip_transactions'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- La table doit exister
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = t) THEN
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      EXCEPTION
        WHEN duplicate_object THEN NULL;  -- déjà membre : OK
      END;
      -- Enregistrement complet dans les événements Realtime
      EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    END IF;
  END LOOP;
END $$;

-- 3) Vérification : lister les tables réellement publiées.
--    (Résultat attendu : les 7 tables ci-dessus.)
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
