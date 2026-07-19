import type {
  ApiConversation,
  ApiConversationDetail,
  ApiMessage,
  ApiReaction,
  ApiUser,
} from "@/types/messenger";

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
export const WS_BASE = (process.env.NEXT_PUBLIC_WS_URL || API_BASE.replace(/^http/, "ws")).replace(/\/$/, "");
export const TOKEN_KEY = "signal-access-token";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function detailMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((item) => item && typeof item === "object" && "msg" in item ? String(item.msg) : String(item)).join(" ");
    }
  }
  return fallback;
}

export async function apiRequest<T>(path: string, token?: string | null, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "Unable to reach the Signal backend. Check that it is running on port 8000.");
  }
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null) as unknown;
  if (!response.ok) throw new ApiError(response.status, detailMessage(payload, `Request failed (${response.status}).`));
  return payload as T;
}

export const signalApi = {
  requestOtp: (phone: string) => apiRequest<{ message: string; otp: string }>("/auth/register", null, {
    method: "POST", body: JSON.stringify({ phone }),
  }),
  verifyOtp: (phone: string, otp: string) => apiRequest<{ user: ApiUser; access_token: string; token_type: string }>("/auth/verify", null, {
    method: "POST", body: JSON.stringify({ phone, otp }),
  }),
  me: (token: string) => apiRequest<ApiUser>("/auth/me", token),
  updateProfile: (token: string, input: { display_name?: string; username?: string }) => apiRequest<ApiUser>("/users/me", token, {
    method: "PATCH", body: JSON.stringify(input),
  }),
  uploadAvatar: (token: string, file: File) => {
    const data = new FormData();
    data.append("file", file);
    return apiRequest<ApiUser>("/users/me/avatar", token, { method: "POST", body: data });
  },
  conversations: (token: string) => apiRequest<ApiConversation[]>("/conversations", token),
  conversation: (token: string, id: number) => apiRequest<ApiConversationDetail>(`/conversations/${id}`, token),
  createConversation: (token: string, input: { type: "direct" | "group"; name?: string; member_ids: number[] }) => apiRequest<{ conversation_id: number }>("/conversations", token, {
    method: "POST", body: JSON.stringify(input),
  }),
  renameGroup: (token: string, id: number, name: string) => apiRequest<ApiConversationDetail>(`/conversations/${id}`, token, {
    method: "PATCH", body: JSON.stringify({ name }),
  }),
  addGroupMember: (token: string, id: number, userId: number) => apiRequest<ApiConversationDetail>(`/conversations/${id}/members`, token, {
    method: "POST", body: JSON.stringify({ user_id: userId }),
  }),
  removeGroupMember: (token: string, id: number, userId: number) => apiRequest<void>(`/conversations/${id}/members/${userId}`, token, { method: "DELETE" }),
  deleteGroup: (token: string, id: number) => apiRequest<void>(`/conversations/${id}`, token, { method: "DELETE" }),
  contacts: (token: string) => apiRequest<ApiUser[]>("/contacts", token),
  addContact: (token: string, userId: number) => apiRequest<ApiUser>("/contacts", token, {
    method: "POST", body: JSON.stringify({ contactUserId: userId }),
  }),
  searchUsers: (token: string, query: string) => apiRequest<ApiUser[]>(`/users/search?q=${encodeURIComponent(query)}`, token),
  messages: (token: string, conversationId: number) => apiRequest<ApiMessage[]>(`/conversations/${conversationId}/messages`, token),
  sendMessage: (token: string, conversationId: number, content: string, messageType: "text" | "image" | "file" | "video" = "text", replyToMessageId?: number) => apiRequest<ApiMessage>(`/conversations/${conversationId}/messages`, token, {
    method: "POST", body: JSON.stringify({ content, message_type: messageType, reply_to_message_id: replyToMessageId }),
  }),
  uploadAttachment: (token: string, messageId: number, file: File) => {
    const data = new FormData();
    data.append("file", file);
    return apiRequest<ApiMessage["attachments"][number]>(`/messages/${messageId}/attachments`, token, { method: "POST", body: data });
  },
  markRead: (token: string, messageId: number) => apiRequest<{ message_id: number; user_id: number; read_at: string }>(`/messages/${messageId}/read`, token, { method: "POST" }),
  deleteMessage: (token: string, messageId: number) => apiRequest<void>(`/messages/${messageId}`, token, { method: "DELETE" }),
  addReaction: (token: string, messageId: number, emoji: string) => apiRequest<ApiReaction>(`/messages/${messageId}/reactions`, token, {
    method: "POST", body: JSON.stringify({ emoji }),
  }),
  removeReaction: (token: string, messageId: number, emoji: string) => apiRequest<void>(`/messages/${messageId}/reactions`, token, {
    method: "DELETE", body: JSON.stringify({ emoji }),
  }),
};
