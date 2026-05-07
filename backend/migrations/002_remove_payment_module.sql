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
