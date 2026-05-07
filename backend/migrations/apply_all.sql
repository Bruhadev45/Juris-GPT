-- ════════════════════════════════════════════════════════════════
-- apply_all.sql
-- Idempotent — safe to paste into Supabase SQL editor and re-run.
-- Combines migrations 002 + 003: payment module removal, RLS coverage,
-- indexes, updated_at triggers.
-- 004 (users table) you already applied; not included here.
-- ════════════════════════════════════════════════════════════════

-- Migration 002: Remove payment module
-- Idempotent: safe to run multiple times. Drops the payments table, its
-- indexes, and the legal_matters status check that referenced 'payment_pending'.

-- 1. Drop the payments table (CASCADE drops dependent indexes / RLS policies).
DROP TABLE IF EXISTS public.payments CASCADE;

-- 2. Move any matters still parked at 'payment_pending' forward to 'ai_generating'
--    BEFORE we tighten the CHECK constraint. The old constraint allows
--    'payment_pending', so this UPDATE always succeeds. If the table is empty
--    (fresh install) it is a no-op.
UPDATE public.legal_matters
SET status = 'ai_generating', updated_at = NOW()
WHERE status = 'payment_pending';

-- 3. Drop the old auto-named CHECK constraint on legal_matters.status.
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.legal_matters'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%payment_pending%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.legal_matters DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

-- 4. Add the new CHECK constraint without 'payment_pending'. The IF NOT EXISTS
--    pattern is via a guard so re-running this migration is safe.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.legal_matters'::regclass
          AND conname = 'legal_matters_status_check'
    ) THEN
        ALTER TABLE public.legal_matters
            ADD CONSTRAINT legal_matters_status_check
            CHECK (status IN ('draft', 'ai_generating', 'lawyer_review', 'approved', 'rejected', 'completed'));
    END IF;
END $$;

-- ════════════════════════════════════════════════════════════════

-- Migration 003: Complete RLS coverage, add missing indexes, add updated_at triggers.
-- Idempotent: every CREATE uses IF NOT EXISTS or DO $$ ... EXISTS check.
-- Fixes findings from the database audit (2026-05-07).

-- =============================================================================
-- 1. updated_at trigger function + triggers on every table that has updated_at.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    t TEXT;
    trigger_name TEXT;
BEGIN
    FOR t IN
        SELECT unnest(ARRAY[
            'user_profiles',
            'companies',
            'legal_matters',
            'documents',
            'lawyer_reviews'
        ])
    LOOP
        trigger_name := 'trg_' || t || '_updated_at';
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger
            WHERE tgname = trigger_name AND NOT tgisinternal
        ) THEN
            EXECUTE format(
                'CREATE TRIGGER %I BEFORE UPDATE ON public.%I
                 FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
                trigger_name, t
            );
        END IF;
    END LOOP;
END $$;

-- =============================================================================
-- 2. Missing indexes (foreign keys without indexes; admin email lookup).
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_lawyer_reviews_lawyer_id
    ON public.lawyer_reviews(lawyer_id)
    WHERE lawyer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_legal_preferences_matter_id
    ON public.legal_preferences(matter_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email
    ON public.user_profiles(email);

-- =============================================================================
-- 3. Helper: re-create a policy idempotently.
--    DROP POLICY IF EXISTS + CREATE POLICY is the simplest correct pattern in pg.
-- =============================================================================

-- ----- user_profiles -----
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

-- ----- companies -----
DROP POLICY IF EXISTS "Users can view own companies" ON public.companies;
CREATE POLICY "Users can view own companies" ON public.companies
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own companies" ON public.companies;
CREATE POLICY "Users can create own companies" ON public.companies
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own companies" ON public.companies;
CREATE POLICY "Users can update own companies" ON public.companies
    FOR UPDATE USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own companies" ON public.companies;
CREATE POLICY "Users can delete own companies" ON public.companies
    FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- ----- founders (FULL CRUD via company.user_id chain) -----
DROP POLICY IF EXISTS "Users can view own founders" ON public.founders;
CREATE POLICY "Users can view own founders" ON public.founders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = founders.company_id
              AND companies.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can create own founders" ON public.founders;
CREATE POLICY "Users can create own founders" ON public.founders
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = founders.company_id
              AND companies.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update own founders" ON public.founders;
CREATE POLICY "Users can update own founders" ON public.founders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = founders.company_id
              AND companies.user_id = (SELECT auth.uid())
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = founders.company_id
              AND companies.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can delete own founders" ON public.founders;
CREATE POLICY "Users can delete own founders" ON public.founders
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = founders.company_id
              AND companies.user_id = (SELECT auth.uid())
        )
    );

-- ----- legal_matters (FULL CRUD via company.user_id chain) -----
DROP POLICY IF EXISTS "Users can view own matters" ON public.legal_matters;
CREATE POLICY "Users can view own matters" ON public.legal_matters
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = legal_matters.company_id
              AND companies.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can create own matters" ON public.legal_matters;
CREATE POLICY "Users can create own matters" ON public.legal_matters
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = legal_matters.company_id
              AND companies.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update own matters" ON public.legal_matters;
CREATE POLICY "Users can update own matters" ON public.legal_matters
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = legal_matters.company_id
              AND companies.user_id = (SELECT auth.uid())
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = legal_matters.company_id
              AND companies.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can delete own matters" ON public.legal_matters;
CREATE POLICY "Users can delete own matters" ON public.legal_matters
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = legal_matters.company_id
              AND companies.user_id = (SELECT auth.uid())
        )
    );

-- ----- documents (full CRUD via 2-hop chain) -----
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents" ON public.documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.legal_matters
            JOIN public.companies ON companies.id = legal_matters.company_id
            WHERE legal_matters.id = documents.matter_id
              AND companies.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can create own documents" ON public.documents;
CREATE POLICY "Users can create own documents" ON public.documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.legal_matters
            JOIN public.companies ON companies.id = legal_matters.company_id
            WHERE legal_matters.id = documents.matter_id
              AND companies.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
CREATE POLICY "Users can update own documents" ON public.documents
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.legal_matters
            JOIN public.companies ON companies.id = legal_matters.company_id
            WHERE legal_matters.id = documents.matter_id
              AND companies.user_id = (SELECT auth.uid())
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.legal_matters
            JOIN public.companies ON companies.id = legal_matters.company_id
            WHERE legal_matters.id = documents.matter_id
              AND companies.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
CREATE POLICY "Users can delete own documents" ON public.documents
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.legal_matters
            JOIN public.companies ON companies.id = legal_matters.company_id
            WHERE legal_matters.id = documents.matter_id
              AND companies.user_id = (SELECT auth.uid())
        )
    );

-- ----- legal_preferences (FULL CRUD via matter → company chain) -----
DROP POLICY IF EXISTS "Users can view own preferences" ON public.legal_preferences;
CREATE POLICY "Users can view own preferences" ON public.legal_preferences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.legal_matters
            JOIN public.companies ON companies.id = legal_matters.company_id
            WHERE legal_matters.id = legal_preferences.matter_id
              AND companies.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can create own preferences" ON public.legal_preferences;
CREATE POLICY "Users can create own preferences" ON public.legal_preferences
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.legal_matters
            JOIN public.companies ON companies.id = legal_matters.company_id
            WHERE legal_matters.id = legal_preferences.matter_id
              AND companies.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update own preferences" ON public.legal_preferences;
CREATE POLICY "Users can update own preferences" ON public.legal_preferences
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.legal_matters
            JOIN public.companies ON companies.id = legal_matters.company_id
            WHERE legal_matters.id = legal_preferences.matter_id
              AND companies.user_id = (SELECT auth.uid())
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.legal_matters
            JOIN public.companies ON companies.id = legal_matters.company_id
            WHERE legal_matters.id = legal_preferences.matter_id
              AND companies.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can delete own preferences" ON public.legal_preferences;
CREATE POLICY "Users can delete own preferences" ON public.legal_preferences
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.legal_matters
            JOIN public.companies ON companies.id = legal_matters.company_id
            WHERE legal_matters.id = legal_preferences.matter_id
              AND companies.user_id = (SELECT auth.uid())
        )
    );

-- ----- lawyer_reviews (admins only — preserved from migration 001 with perf fix) -----
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.lawyer_reviews;
CREATE POLICY "Admins can view all reviews" ON public.lawyer_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = (SELECT auth.uid())
              AND user_profiles.email LIKE '%@jurisgpt.com'
        )
    );

DROP POLICY IF EXISTS "Admins can update reviews" ON public.lawyer_reviews;
CREATE POLICY "Admins can update reviews" ON public.lawyer_reviews
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = (SELECT auth.uid())
              AND user_profiles.email LIKE '%@jurisgpt.com'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = (SELECT auth.uid())
              AND user_profiles.email LIKE '%@jurisgpt.com'
        )
    );

DROP POLICY IF EXISTS "Admins can insert reviews" ON public.lawyer_reviews;
CREATE POLICY "Admins can insert reviews" ON public.lawyer_reviews
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = (SELECT auth.uid())
              AND user_profiles.email LIKE '%@jurisgpt.com'
        )
    );

-- Users can also see lawyer reviews on their own matters.
DROP POLICY IF EXISTS "Users can view own matter reviews" ON public.lawyer_reviews;
CREATE POLICY "Users can view own matter reviews" ON public.lawyer_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.legal_matters
            JOIN public.companies ON companies.id = legal_matters.company_id
            WHERE legal_matters.id = lawyer_reviews.matter_id
              AND companies.user_id = (SELECT auth.uid())
        )
    );
