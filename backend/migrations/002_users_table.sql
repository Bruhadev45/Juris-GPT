-- ============================================================
-- Juris-GPT User Management Schema
-- Migration 002: Users table for authentication
-- ============================================================

-- Users table for authentication
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'lawyer')),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.users IS 'User accounts for Juris-GPT authentication and authorization';
COMMENT ON COLUMN public.users.id IS 'Unique user identifier (UUID)';
COMMENT ON COLUMN public.users.email IS 'User email address (unique, used for login)';
COMMENT ON COLUMN public.users.password_hash IS 'bcrypt hashed password (12 rounds)';
COMMENT ON COLUMN public.users.role IS 'User role: user (default), admin, or lawyer';
COMMENT ON COLUMN public.users.is_verified IS 'Email verification status';
COMMENT ON COLUMN public.users.created_at IS 'Account creation timestamp';
COMMENT ON COLUMN public.users.updated_at IS 'Last profile update timestamp (auto-updated by trigger)';
