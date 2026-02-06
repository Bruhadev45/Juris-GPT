/**
 * API client for JurisGPT backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface LawSection {
  section: number;
  title: string;
  description: string;
}

export interface CaseSummary {
  case_name: string;
  citation: string;
  court: string;
  principle: string;
  summary: string;
  relevance: string;
}

export interface CompaniesActSection {
  act: string;
  section: string;
  title: string;
  content: string;
}

export interface LegalDataStats {
  laws: Record<string, number>;
  cases: number;
  companies_act_sections: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Legal Data APIs
  async getLawSections(
    lawName: string,
    options?: { section?: number; limit?: number; offset?: number }
  ): Promise<LawSection[]> {
    const params = new URLSearchParams();
    if (options?.section) params.append("section", options.section.toString());
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());

    const query = params.toString();
    return this.fetch<LawSection[]>(`/api/legal/laws/${lawName}${query ? `?${query}` : ""}`);
  }

  async listAvailableLaws(): Promise<string[]> {
    return this.fetch<string[]>("/api/legal/laws");
  }

  async getCaseSummaries(options?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<CaseSummary[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());
    if (options?.search) params.append("search", options.search);

    const query = params.toString();
    return this.fetch<CaseSummary[]>(`/api/legal/cases${query ? `?${query}` : ""}`);
  }

  async getCompaniesActSections(options?: {
    section?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<CompaniesActSection[]> {
    const params = new URLSearchParams();
    if (options?.section) params.append("section", options.section);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());
    if (options?.search) params.append("search", options.search);

    const query = params.toString();
    const response = await this.fetch<{ data: CompaniesActSection[]; total: number }>(`/api/legal/companies-act${query ? `?${query}` : ""}`);
    return response.data;
  }

  async getLegalDataStats(): Promise<LegalDataStats> {
    return this.fetch<LegalDataStats>("/api/legal/stats");
  }
}

export const apiClient = new ApiClient();

// Chat API
export interface ChatMessageResponse {
  success: boolean;
  message: string;
  sources: Array<{
    title: string;
    content: string;
    doc_type: string;
    source: string;
    relevance: string;
  }>;
  suggestions: string[];
  error?: string;
}

export interface ChatSuggestionCategory {
  category: string;
  questions: string[];
}

export const chatApi = {
  async sendMessage(message: string, context?: Record<string, unknown>): Promise<ChatMessageResponse> {
    const response = await fetch(`${API_URL}/api/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, context }),
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async getSuggestions(): Promise<{ suggestions: ChatSuggestionCategory[] }> {
    const response = await fetch(`${API_URL}/api/chat/suggestions`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
};

// Companies API
export const companiesApi = {
  async create(data: {
    name: string;
    description?: string;
    state: string;
    authorized_capital: number;
  }) {
    const response = await fetch(`${API_URL}/api/companies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async get(companyId: string) {
    const response = await fetch(`${API_URL}/api/companies/${companyId}`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
};

// Matters API
export const mattersApi = {
  async create(data: {
    matter_data: { company_id: string };
    founders: Array<{
      name: string;
      email: string;
      role: string;
      equity_percentage: number;
      vesting_months: number;
      cliff_months: number;
    }>;
    preferences: {
      non_compete: boolean;
      non_compete_months: number;
      dispute_resolution: string;
      governing_law: string;
      additional_terms?: string;
    };
  }) {
    const response = await fetch(`${API_URL}/api/matters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async get(matterId: string) {
    const response = await fetch(`${API_URL}/api/matters/${matterId}`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async getStatus(matterId: string) {
    const response = await fetch(`${API_URL}/api/matters/${matterId}/status`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
};

// Documents API (fixes pre-existing import errors)
export const documentsApi = {
  async generate(matterId: string) {
    const response = await fetch(`${API_URL}/api/documents/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matter_id: matterId }),
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async get(documentId: string) {
    const response = await fetch(`${API_URL}/api/documents/${documentId}`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async download(documentId: string) {
    const response = await fetch(
      `${API_URL}/api/documents/${documentId}/download`
    );
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.blob();
  },
};

// Compliance API
export interface ComplianceDeadline {
  id: string;
  title: string;
  category: string;
  description: string;
  due_date: string;
  days_remaining: number;
  status: "pending" | "upcoming" | "overdue";
  urgency: "low" | "medium" | "high" | "critical";
  recurring: string;
  penalty?: string;
}

export const complianceApi = {
  async getDeadlines(options?: {
    category?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ComplianceDeadline[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.category) params.append("category", options.category);
    if (options?.status) params.append("status", options.status);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());
    const query = params.toString();
    const response = await fetch(
      `${API_URL}/api/compliance/deadlines${query ? `?${query}` : ""}`
    );
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async getUpcoming(
    days: number = 30
  ): Promise<{ data: ComplianceDeadline[]; total: number }> {
    const response = await fetch(
      `${API_URL}/api/compliance/upcoming?days=${days}`
    );
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async getCategories(): Promise<{
    categories: { name: string; count: number }[];
  }> {
    const response = await fetch(`${API_URL}/api/compliance/categories`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
};

// Templates API
export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  estimated_time: string;
  price: number;
  field_count: number;
}

export interface TemplateDetail extends Template {
  fields: {
    name: string;
    label: string;
    type: string;
    required: boolean;
    default?: unknown;
    options?: string[];
    placeholder?: string;
  }[];
}

export const templatesApi = {
  async list(): Promise<{ templates: Template[] }> {
    const response = await fetch(`${API_URL}/api/templates`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async get(templateId: string): Promise<TemplateDetail> {
    const response = await fetch(`${API_URL}/api/templates/${templateId}`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async generate(templateId: string, data: Record<string, unknown>) {
    const response = await fetch(
      `${API_URL}/api/templates/${templateId}/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
};

// Reviews API
export interface DocumentReview {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  status: "pending" | "analyzing" | "completed" | "failed";
  analysis?: {
    overall_risk_score: number;
    summary: string;
    clauses: { name: string; status: string; risk: string }[];
    risks: { title: string; severity: string; description: string }[];
    suggestions: string[];
  };
  created_at: string;
}

export const reviewsApi = {
  async upload(file: File): Promise<{ success: boolean; review: DocumentReview }> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_URL}/api/reviews/upload`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async list(): Promise<{ data: DocumentReview[]; total: number }> {
    const response = await fetch(`${API_URL}/api/reviews`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async get(reviewId: string): Promise<DocumentReview> {
    const response = await fetch(`${API_URL}/api/reviews/${reviewId}`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async analyze(
    reviewId: string
  ): Promise<{ success: boolean; review: DocumentReview }> {
    const response = await fetch(`${API_URL}/api/reviews/${reviewId}/analyze`, {
      method: "POST",
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
};

// Settings API
export const settingsApi = {
  async get() {
    const response = await fetch(`${API_URL}/api/settings`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async updateProfile(data: Record<string, unknown>) {
    const response = await fetch(`${API_URL}/api/settings/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async updateNotifications(data: Record<string, unknown>) {
    const response = await fetch(`${API_URL}/api/settings/notifications`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async updateAppearance(data: Record<string, unknown>) {
    const response = await fetch(`${API_URL}/api/settings/appearance`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
};

// Support API
export const supportApi = {
  async createTicket(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    category?: string;
  }) {
    const response = await fetch(`${API_URL}/api/support/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async listTickets() {
    const response = await fetch(`${API_URL}/api/support/tickets`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
};

// Team API
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  joined_at: string;
}

export const teamApi = {
  async list(): Promise<{ data: TeamMember[]; total: number }> {
    const response = await fetch(`${API_URL}/api/team`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async add(data: Partial<TeamMember>) {
    const response = await fetch(`${API_URL}/api/team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async update(memberId: string, data: Partial<TeamMember>) {
    const response = await fetch(`${API_URL}/api/team/${memberId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async remove(memberId: string) {
    const response = await fetch(`${API_URL}/api/team/${memberId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
};

// Integrations API
export const integrationsApi = {
  async getStatus() {
    const response = await fetch(`${API_URL}/api/integrations`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
};

// Admin API
export const adminApi = {
  async getPendingReviews() {
    const response = await fetch(`${API_URL}/api/admin/reviews/pending`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async approveReview(reviewId: string) {
    const response = await fetch(`${API_URL}/api/admin/reviews/${reviewId}/approve`, {
      method: "POST",
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },

  async requestChanges(reviewId: string, changes: string) {
    const response = await fetch(`${API_URL}/api/admin/reviews/${reviewId}/request-changes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changes }),
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
};

// Vault API
export const vaultApi = {
  async list(options?: { category?: string; tag?: string }): Promise<{ data: any[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.category) params.append("category", options.category);
    if (options?.tag) params.append("tag", options.tag);
    const query = params.toString();
    const response = await fetch(`${API_URL}/api/vault${query ? `?${query}` : ""}`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
  async upload(formData: FormData) {
    const response = await fetch(`${API_URL}/api/vault/upload`, { method: "POST", body: formData });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
  async delete(id: string) {
    const response = await fetch(`${API_URL}/api/vault/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
  async getCategories() {
    const response = await fetch(`${API_URL}/api/vault/categories`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
};

// Analyzer API
export const analyzerApi = {
  async upload(formData: FormData) {
    const response = await fetch(`${API_URL}/api/analyzer/upload`, { method: "POST", body: formData });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
  async analyze(id: string) {
    const response = await fetch(`${API_URL}/api/analyzer/${id}/analyze`, { method: "POST" });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
  async get(id: string) {
    const response = await fetch(`${API_URL}/api/analyzer/${id}`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
};

// RTI API
export const rtiApi = {
  async getDepartments() {
    const response = await fetch(`${API_URL}/api/rti/departments`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
  async generate(data: { department: string; subject: string; information_requested: string; purpose?: string; applicant_name: string; applicant_address: string; applicant_phone?: string; applicant_email?: string }) {
    const response = await fetch(`${API_URL}/api/rti/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
  async list() {
    const response = await fetch(`${API_URL}/api/rti/applications`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
};

// News API
export const newsApi = {
  async list(options?: { category?: string; limit?: number; offset?: number }) {
    const params = new URLSearchParams();
    if (options?.category) params.append("category", options.category);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());
    const query = params.toString();
    const response = await fetch(`${API_URL}/api/news${query ? `?${query}` : ""}`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
  async getCategories() {
    const response = await fetch(`${API_URL}/api/news/categories`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  },
};
