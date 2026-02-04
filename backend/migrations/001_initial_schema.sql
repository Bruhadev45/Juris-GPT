-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Supabase Auth handles auth.users, this is our profile)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies table
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    state TEXT NOT NULL, -- Indian state
    authorized_capital DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Founders table
CREATE TABLE public.founders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL, -- CEO, CTO, etc.
    equity_percentage DECIMAL(5, 2) NOT NULL CHECK (equity_percentage > 0 AND equity_percentage <= 100),
    vesting_months INTEGER NOT NULL DEFAULT 48,
    cliff_months INTEGER NOT NULL DEFAULT 12,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legal matters (agreement requests)
CREATE TABLE public.legal_matters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    matter_type TEXT NOT NULL DEFAULT 'founder_agreement',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'payment_pending', 'ai_generating', 'lawyer_review', 'approved', 'rejected', 'completed')),
    price DECIMAL(10, 2) NOT NULL DEFAULT 1999.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES public.legal_matters(id) ON DELETE CASCADE,
    content TEXT, -- Store generated content or reference
    version INTEGER NOT NULL DEFAULT 1,
    is_final BOOLEAN DEFAULT FALSE,
    storage_url TEXT, -- Supabase Storage URL
    file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES public.legal_matters(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lawyer reviews table
CREATE TABLE public.lawyer_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES public.legal_matters(id) ON DELETE CASCADE,
    lawyer_id UUID REFERENCES public.user_profiles(id), -- NULL means unassigned
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'changes_requested')),
    notes TEXT,
    changes_requested TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legal preferences (stored as JSONB for flexibility)
CREATE TABLE public.legal_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES public.legal_matters(id) ON DELETE CASCADE,
    non_compete BOOLEAN DEFAULT TRUE,
    non_compete_months INTEGER DEFAULT 12,
    dispute_resolution TEXT DEFAULT 'arbitration' CHECK (dispute_resolution IN ('arbitration', 'court', 'mediation')),
    governing_law TEXT DEFAULT 'india',
    additional_terms TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_companies_user_id ON public.companies(user_id);
CREATE INDEX idx_founders_company_id ON public.founders(company_id);
CREATE INDEX idx_legal_matters_company_id ON public.legal_matters(company_id);
CREATE INDEX idx_legal_matters_status ON public.legal_matters(status);
CREATE INDEX idx_documents_matter_id ON public.documents(matter_id);
CREATE INDEX idx_payments_matter_id ON public.payments(matter_id);
CREATE INDEX idx_payments_razorpay_order_id ON public.payments(razorpay_order_id);
CREATE INDEX idx_lawyer_reviews_matter_id ON public.lawyer_reviews(matter_id);
CREATE INDEX idx_lawyer_reviews_status ON public.lawyer_reviews(status);

-- Row Level Security (RLS) policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own companies" ON public.companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own companies" ON public.companies FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own matters" ON public.legal_matters FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.companies WHERE companies.id = legal_matters.company_id AND companies.user_id = auth.uid())
);

CREATE POLICY "Users can create own matters" ON public.legal_matters FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies WHERE companies.id = legal_matters.company_id AND companies.user_id = auth.uid())
);

CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.legal_matters 
        JOIN public.companies ON companies.id = legal_matters.company_id 
        WHERE legal_matters.id = documents.matter_id AND companies.user_id = auth.uid()
    )
);

CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.legal_matters 
        JOIN public.companies ON companies.id = legal_matters.company_id 
        WHERE legal_matters.id = payments.matter_id AND companies.user_id = auth.uid()
    )
);

-- Admin policies (for lawyer reviews)
CREATE POLICY "Admins can view all reviews" ON public.lawyer_reviews FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.email LIKE '%@jurisgpt.com')
);

CREATE POLICY "Admins can update reviews" ON public.lawyer_reviews FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.email LIKE '%@jurisgpt.com')
);
