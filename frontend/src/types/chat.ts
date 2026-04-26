export interface Citation {
  title: string;
  content: string;
  doc_type: string;
  source: string;
  relevance: number;
  section?: string;
  act?: string;
  url?: string;
}

export type ConfidenceLevel = "high" | "medium" | "low" | "insufficient";

export interface LegacySource {
  title: string;
  content: string;
  doc_type: string;
  source: string;
  relevance: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isDocument?: boolean;
  documentType?: string;
  // New citation-grounded response fields
  citations?: Citation[];
  confidence?: ConfidenceLevel;
  limitations?: string;
  followUpQuestions?: string[];
  grounded?: boolean;
  // Data source provenance
  modelUsed?: string;
  // Legacy fields for backwards compatibility
  sources?: LegacySource[];
  suggestions?: string[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
}
