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
    return this.fetch<CompaniesActSection[]>(`/api/legal/companies-act${query ? `?${query}` : ""}`);
  }

  async getLegalDataStats(): Promise<LegalDataStats> {
    return this.fetch<LegalDataStats>("/api/legal/stats");
  }
}

export const apiClient = new ApiClient();
