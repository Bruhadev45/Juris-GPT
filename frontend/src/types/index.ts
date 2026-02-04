// Shared types for frontend
export type MatterStatus =
  | "draft"
  | "payment_pending"
  | "ai_generating"
  | "lawyer_review"
  | "approved"
  | "rejected"
  | "completed";

export interface Company {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  state: string;
  authorized_capital: number;
  created_at: string;
  updated_at: string;
}

export interface Founder {
  id: string;
  company_id: string;
  name: string;
  email: string;
  role: string;
  equity_percentage: number;
  vesting_months: number;
  cliff_months: number;
  created_at: string;
}

export interface LegalMatter {
  id: string;
  company_id: string;
  matter_type: string;
  status: MatterStatus;
  price: number;
  created_at: string;
  updated_at: string;
  company?: Company;
  founders?: Founder[];
  preferences?: {
    non_compete: boolean;
    non_compete_months: number;
    dispute_resolution: string;
    governing_law: string;
    additional_terms?: string | null;
  };
}

export interface Document {
  id: string;
  matter_id: string;
  content: string | null;
  version: number;
  is_final: boolean;
  storage_url: string | null;
  file_name: string | null;
  created_at: string;
  updated_at: string;
}
