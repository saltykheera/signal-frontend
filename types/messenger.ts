export type Theme = "light" | "dark";
export type AuthStep = "phone" | "otp" | "profile" | "app";
export type AppTab = "chats" | "calls" | "stories";
export type SettingsPage = "general" | "appearance" | "profile";
export type ConversationId = string;

export type Message = {
  id: number;
  body: string;
  outgoing: boolean;
  time: string;
  status?: "sending" | "sent" | "delivered" | "read" | "failed";
  reactions?: ApiReaction[];
  messageType?: "text" | "image" | "file" | "video";
  attachment?: ApiAttachment;
  senderName?: string | null;
};

export type Conversation = {
  id: ConversationId;
  name: string;
  initials: string;
  preview: string;
  time: string;
  color: string;
  unread?: number;
  online?: boolean;
  muted?: boolean;
  group?: boolean;
  subtitle?: string;
  avatarUrl?: string | null;
  peerUserId?: number | null;
  memberCount?: number;
};

export type ApiUser = {
  id: number;
  username: string | null;
  phone: string | null;
  display_name: string;
  avatar_url: string | null;
  is_online: boolean;
  last_seen: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiConversation = {
  id: number;
  type: "direct" | "group";
  name: string | null;
  avatar_url: string | null;
  last_message: string | null;
  last_message_timestamp: string | null;
  unread_count: number;
  peer_user_id: number | null;
  is_online: boolean;
  last_seen: string | null;
  member_count: number;
};

export type ApiConversationMember = ApiUser & { role: "member" | "admin"; joined_at: string };
export type ApiConversationDetail = {
  id: number;
  type: "direct" | "group";
  name: string | null;
  avatar_url: string | null;
  created_by: number | null;
  created_at: string;
  members: ApiConversationMember[];
};

export type ApiReaction = { id: number; message_id: number; user_id: number; emoji: string; created_at: string };
export type ApiAttachment = {
  id: number;
  message_id: number;
  file_name: string | null;
  file_url: string;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  created_at: string;
};
export type ApiMessage = {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  message_type: "text" | "image" | "file" | "video";
  reply_to_message_id: number | null;
  created_at: string;
  updated_at: string;
  sender_name: string | null;
  sender_avatar_url: string | null;
  attachments: ApiAttachment[];
  reactions: ApiReaction[];
  receipts: Array<{ user_id: number; delivered_at: string | null; read_at: string | null }>;
  status: "sent" | "delivered" | "read";
};
