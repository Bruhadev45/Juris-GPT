/**
 * API client for JurisGPT backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ---- Interfaces ----

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

// ---- API Error class ----

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ---- Base fetch helper ----

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new ApiError(
      errorBody || `API error: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  return response.json();
}

// ---- Legal Data API Client (used by dashboard) ----

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return apiFetch<T>(endpoint, options);
  }

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
    return this.fetch<CompaniesActSection[]>(`/api/legal/companies-act${query ? `?${query}` : ""}`);
  }

  async getLegalDataStats(): Promise<LegalDataStats> {
    return this.fetch<LegalDataStats>("/api/legal/stats");
  }
}

export const apiClient = new ApiClient();

// ---- Companies API (used by agreements/new page) ----

export const companiesApi = {
  create: async (data: {
    name: string;
    description?: string;
    state: string;
    authorized_capital: number;
  }) => {
    return apiFetch<{ id: string; name: string; state: string }>("/api/companies", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  get: async (id: string) => {
    return apiFetch<{ id: string; name: string; state: string; authorized_capital: number }>(
      `/api/companies/${id}`
    );
  },
};

// ---- Matters API (used by agreements pages) ----

export const mattersApi = {
  create: async (data: {
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
  }) => {
    return apiFetch<{ id: string; status: string }>("/api/matters", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  get: async (id: string) => {
    return apiFetch<Record<string, unknown>>(`/api/matters/${id}`);
  },

  list: async () => {
    return apiFetch<Record<string, unknown>[]>("/api/matters");
  },
};

// ---- Documents API (used by agreement detail page) ----

export const documentsApi = {
  generate: async (matterId: string) => {
    return apiFetch<{ id: string; status: string }>(`/api/documents/generate/${matterId}`, {
      method: "POST",
    });
  },

  get: async (matterId: string) => {
    return apiFetch<Record<string, unknown>[]>(`/api/documents/${matterId}`);
  },

  download: async (documentId: string): Promise<Blob> => {
    const response = await fetch(`${API_URL}/api/documents/${documentId}/download`);
    if (!response.ok) {
      throw new ApiError("Failed to download document", response.status);
    }
    return response.blob();
  },
};

// ---- Admin API (used by admin reviews page) ----

export const adminApi = {
  getPendingReviews: async () => {
    return apiFetch<Record<string, unknown>[]>("/api/admin/reviews/pending");
  },

  approveReview: async (reviewId: string) => {
    return apiFetch<{ success: boolean }>(`/api/admin/reviews/${reviewId}/approve`, {
      method: "POST",
    });
  },

  requestChanges: async (reviewId: string, changes: string) => {
    return apiFetch<{ success: boolean }>(`/api/admin/reviews/${reviewId}/request-changes`, {
      method: "POST",
      body: JSON.stringify({ changes }),
    });
  },
};
