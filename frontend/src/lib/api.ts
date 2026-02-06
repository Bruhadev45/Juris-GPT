/**
 * API client for NyayaSetu backend
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
