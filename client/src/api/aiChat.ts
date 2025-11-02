import axiosInstance from "./axiosInstance";

export type ChatMessageRole = "user" | "assistant";

export interface ChatMessagePayload {
  role: ChatMessageRole;
  content: string;
  timestamp?: string;
}

export interface ChatContextPayload {
  orders?: Array<Record<string, unknown>>;
  recentSearches?: string[];
  recentClicks?: Array<Record<string, unknown>>;
  cart?: {
    items?: Array<Record<string, unknown>>;
    total?: number | string;
  };
  featuredProducts?: Array<Record<string, unknown>>;
}

export interface ChatRequestPayload {
  messages: ChatMessagePayload[];
  context?: ChatContextPayload;
  customer?: {
    name?: string;
    email?: string;
  };
  generationConfig?: Record<string, unknown>;
  sessionId?: string | null;
}

export interface ChatResponsePayload {
  reply: string;
  metadata?: {
    citations?: Array<{ title: string; uri: string }>;
    finishReason?: string;
    fallback?: boolean;
    html?: string;
    recommendations?: ChatRecommendation[];
  };
  session?: ChatSessionSummary | null;
}

export interface ChatRecommendation {
  id?: string;
  name: string;
  price?: number;
  tags?: string[];
  url?: string | null;
  priceLabel?: string;
  details?: string;
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  messageCount?: number;
  lastMessagePreview?: string | null;
}

export interface ChatSessionDetail extends ChatSessionSummary {
  messages: Array<{
    id: string;
    role: ChatMessageRole;
    content: string;
    timestamp?: string;
  }>;
}

export async function sendChatMessage(
  payload: ChatRequestPayload
): Promise<ChatResponsePayload> {
  const response = await axiosInstance.post("/ai/chat", payload);
  return response.data as ChatResponsePayload;
}

export async function fetchChatHistory(limit = 15): Promise<{
  sessions: ChatSessionSummary[];
}> {
  const response = await axiosInstance.get("/ai/history", {
    params: { limit },
  });
  return response.data as { sessions: ChatSessionSummary[] };
}

export async function fetchChatSession(sessionId: string): Promise<{
  session: ChatSessionDetail;
}> {
  const response = await axiosInstance.get(`/ai/history/${sessionId}`);
  return response.data as { session: ChatSessionDetail };
}
