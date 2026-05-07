-- Migration 004: Create public.users table for custom JWT auth.
--
-- Context: migration 001 created public.user_profiles assuming Supabase Auth
-- would own credentials, but the application code in
-- backend/app/repositories/user_repository.py implements custom JWT auth
-- and queries `public.users` directly with bcrypt-hashed passwords.
-- This migration adds the table the repository expects.
--
-- Idempotent: every CREATE / ALTER uses IF (NOT) EXISTS guards.
--
-- NOTE: This does not migrate user_profiles into users — they coexist for now.
-- A follow-up migration should reconcile companies.user_id, RLS chains, and
-- decide which is the canonical user table.

CREATE TABLE IF NOT EXISTS public.users (
    -- The application generates IDs via secrets.token_hex(16) → 32-char hex.
    -- TEXT (not UUID) to keep the existing application code working.
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    company_name TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'lawyer', 'admin')),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- updated_at trigger (reuses the function from migration 003)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_users_updated_at' AND NOT tgisinternal
    ) THEN
        -- The function may not exist yet if migrations are applied out of
        -- order; create a local copy as a fallback.
        IF NOT EXISTS (
            SELECT 1 FROM pg_proc
            WHERE proname = 'set_updated_at'
              AND pronamespace = 'public'::regnamespace
        ) THEN
            CREATE OR REPLACE FUNCTION public.set_updated_at()
            RETURNS TRIGGER LANGUAGE plpgsql AS $func$
            BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
            $func$;
        END IF;

        CREATE TRIGGER trg_users_updated_at
            BEFORE UPDATE ON public.users
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;

-- RLS: lock the table down. The application uses the SERVICE_ROLE key for
-- auth flows (register / login / me / change password) so it bypasses RLS;
-- ordinary anon / authenticated keys must not read the password_hash.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages users" ON public.users;
-- No policy means RLS denies everything for non-service-role connections,
-- which is what we want for the password_hash column. The auth API runs
-- with the service role key so it can read/write freely.
