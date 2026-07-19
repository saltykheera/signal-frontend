import { createStore } from "zustand/vanilla";
import { ApiError, signalApi, TOKEN_KEY, WS_BASE } from "@/lib/api";
import type { ApiConversation, ApiMessage, ApiReaction, ApiUser, AuthStep, Conversation, ConversationId, Message } from "@/types/messenger";

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "S";
}

function colorFor(id: number) {
  return ["#f8c9e7", "#c9d9ff", "#f7d59c", "#cef0e9", "#e2e3ff"][id % 5];
}

function formatTimestamp(value: string | null) {
  if (!value) return "";
  const date = new Date(value.endsWith("Z") || value.includes("+") ? value : `${value}Z`);
  return date.toDateString() === new Date().toDateString()
    ? new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(date)
    : new Intl.DateTimeFormat("en", { weekday: "short" }).format(date);
}

function mapConversation(item: ApiConversation): Conversation {
  const name = item.name || "Signal conversation";
  const lastSeen = item.last_seen ? `Last seen ${formatTimestamp(item.last_seen)}` : "Offline";
  return {
    id: String(item.id), name, initials: initials(name),
    preview: item.last_message || "Start a conversation",
    time: formatTimestamp(item.last_message_timestamp), color: colorFor(item.id),
    unread: item.unread_count || undefined, online: item.is_online,
    group: item.type === "group",
    subtitle: item.type === "group" ? `${item.member_count} members` : item.is_online ? "Online" : lastSeen,
    avatarUrl: item.avatar_url, peerUserId: item.peer_user_id, memberCount: item.member_count,
  };
}

function mapMessage(item: ApiMessage, currentUserId: number): Message {
  return {
    id: item.id, body: item.content, outgoing: item.sender_id === currentUserId,
    time: formatTimestamp(item.created_at), status: item.status,
    reactions: item.reactions, messageType: item.message_type,
    attachment: item.attachments[0], senderName: item.sender_name,
  };
}

type MessengerState = {
  initialized: boolean;
  booting: boolean;
  authStep: AuthStep;
  authToken: string | null;
  authPhone: string;
  authBusy: boolean;
  authError: string | null;
  currentUser: ApiUser | null;
  conversations: Conversation[];
  contacts: ApiUser[];
  selectedConversationId: ConversationId | null;
  messages: Record<ConversationId, Message[]>;
  loadingConversationId: ConversationId | null;
  typingByConversation: Record<ConversationId, string>;
  toast: string | null;
  realtimeConnected: boolean;
};

type MessengerActions = {
  initialize: () => Promise<void>;
  shutdown: () => void;
  setAuthStep: (step: AuthStep) => void;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  finishProfile: (name: string, avatar: File | null) => Promise<void>;
  logout: () => void;
  showToast: (message: string) => void;
  loadConversations: () => Promise<void>;
  loadContacts: () => Promise<void>;
  selectConversation: (id: ConversationId) => void;
  loadMessages: (id: ConversationId) => Promise<void>;
  findUsers: (query: string) => Promise<ApiUser[]>;
  startChat: (user: ApiUser) => Promise<ConversationId | null>;
  createGroup: (name: string, members: number[]) => Promise<ConversationId | null>;
  sendText: (content: string) => Promise<void>;
  sendAttachment: (file: File) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
  toggleReaction: (messageId: number, emoji: string) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  connectRealtime: () => void;
};

export type MessengerStore = MessengerState & MessengerActions;
export type MessengerStoreApi = ReturnType<typeof createMessengerStore>;

const initialState: MessengerState = {
  initialized: false,
  booting: true,
  authStep: "phone",
  authToken: null,
  authPhone: "",
  authBusy: false,
  authError: null,
  currentUser: null,
  conversations: [],
  contacts: [],
  selectedConversationId: null,
  messages: {},
  loadingConversationId: null,
  typingByConversation: {},
  toast: null,
  realtimeConnected: false,
};

export function createMessengerStore() {
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let toastTimer: ReturnType<typeof setTimeout> | null = null;
  let realtimeStopped = false;
  const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

  const store = createStore<MessengerStore>()((set, get) => {
    function storeProfile(user: ApiUser) {
      localStorage.setItem("signal-profile", JSON.stringify({
        name: user.display_name, phone: user.phone || "", avatarUrl: user.avatar_url,
      }));
    }

    function report(error: unknown, fallback: string) {
      if (error instanceof ApiError && error.status === 401) {
        get().logout();
        return;
      }
      get().showToast(error instanceof Error ? error.message : fallback);
    }

    return {
      ...initialState,

      initialize: async () => {
        if (get().initialized) return;
        set({ initialized: true });
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) { set({ booting: false }); return; }
        try {
          const user = await signalApi.me(token);
          set({ authToken: token, currentUser: user, authStep: "app", booting: false });
          storeProfile(user);
          await Promise.all([get().loadConversations(), get().loadContacts()]);
          get().connectRealtime();
        } catch {
          get().logout();
          set({ booting: false });
        }
      },

      shutdown: () => {
        realtimeStopped = true;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (toastTimer) clearTimeout(toastTimer);
        typingTimers.forEach(clearTimeout);
        socket?.close();
        socket = null;
      },

      setAuthStep: (authStep) => set({ authStep, authError: null }),

      requestOtp: async (phone) => {
        set({ authBusy: true, authError: null });
        try {
          const response = await signalApi.requestOtp(phone);
          set({ authPhone: phone, authStep: "otp" });
          get().showToast(`Development verification code: ${response.otp}`);
        } catch (error) {
          set({ authError: error instanceof Error ? error.message : "Could not request a code." });
        } finally { set({ authBusy: false }); }
      },

      verifyOtp: async (otp) => {
        set({ authBusy: true, authError: null });
        try {
          const result = await signalApi.verifyOtp(get().authPhone, otp);
          localStorage.setItem(TOKEN_KEY, result.access_token);
          const needsProfile = result.user.display_name === result.user.phone;
          set({ authToken: result.access_token, currentUser: result.user, authStep: needsProfile ? "profile" : "app" });
          if (!needsProfile) {
            storeProfile(result.user);
            await Promise.all([get().loadConversations(), get().loadContacts()]);
            get().connectRealtime();
          }
        } catch (error) {
          set({ authError: error instanceof Error ? error.message : "Verification failed." });
        } finally { set({ authBusy: false }); }
      },

      finishProfile: async (name, avatar) => {
        const token = get().authToken;
        if (!token) return;
        set({ authBusy: true, authError: null });
        try {
          let user = await signalApi.updateProfile(token, { display_name: name });
          if (avatar) user = await signalApi.uploadAvatar(token, avatar);
          storeProfile(user);
          set({ currentUser: user, authStep: "app" });
          await Promise.all([get().loadConversations(), get().loadContacts()]);
          get().connectRealtime();
        } catch (error) {
          set({ authError: error instanceof Error ? error.message : "Profile could not be saved." });
        } finally { set({ authBusy: false }); }
      },

      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("signal-profile");
        realtimeStopped = true;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        socket?.close(); socket = null;
        set({ ...initialState, initialized: true, booting: false });
      },

      showToast: (message) => {
        if (toastTimer) clearTimeout(toastTimer);
        set({ toast: message });
        toastTimer = setTimeout(() => set({ toast: null }), 4500);
      },

      loadConversations: async () => {
        const token = get().authToken;
        if (!token) return;
        try {
          const conversations = (await signalApi.conversations(token)).map(mapConversation);
          const current = get().selectedConversationId;
          const selectedConversationId = current && conversations.some((item) => item.id === current)
            ? current : conversations[0]?.id || null;
          set({ conversations, selectedConversationId });
          if (selectedConversationId && !get().messages[selectedConversationId]) void get().loadMessages(selectedConversationId);
        } catch (error) { report(error, "Conversations could not be loaded."); }
      },

      loadContacts: async () => {
        const token = get().authToken;
        if (!token) return;
        try { set({ contacts: await signalApi.contacts(token) }); }
        catch (error) { report(error, "Contacts could not be loaded."); }
      },

      selectConversation: (id) => {
        set({ selectedConversationId: id });
        void get().loadMessages(id);
      },

      loadMessages: async (id) => {
        const { authToken: token, currentUser } = get();
        if (!token || !currentUser) return;
        set({ loadingConversationId: id });
        try {
          const rows = await signalApi.messages(token, Number(id));
          set((state) => ({ messages: { ...state.messages, [id]: rows.map((row) => mapMessage(row, currentUser.id)) } }));
          const unread = rows.filter((row) => row.sender_id !== currentUser.id && !row.receipts.some((receipt) => receipt.user_id === currentUser.id && receipt.read_at));
          await Promise.allSettled(unread.map((row) => signalApi.markRead(token, row.id)));
          if (unread.length) await get().loadConversations();
        } catch (error) { report(error, "Messages could not be loaded."); }
        finally { if (get().loadingConversationId === id) set({ loadingConversationId: null }); }
      },

      findUsers: async (query) => {
        const token = get().authToken;
        return token ? signalApi.searchUsers(token, query) : [];
      },

      startChat: async (user) => {
        const token = get().authToken;
        if (!token) return null;
        try {
          try { await signalApi.addContact(token, user.id); }
          catch (error) { if (!(error instanceof ApiError) || error.status !== 409) throw error; }
          const result = await signalApi.createConversation(token, { type: "direct", member_ids: [user.id] });
          await Promise.all([get().loadConversations(), get().loadContacts()]);
          const id = String(result.conversation_id);
          get().selectConversation(id);
          return id;
        } catch (error) { report(error, "Chat could not be started."); return null; }
      },

      createGroup: async (name, members) => {
        const token = get().authToken;
        if (!token || !members.length) { get().showToast("Choose at least one group member."); return null; }
        try {
          const result = await signalApi.createConversation(token, { type: "group", name, member_ids: members });
          await get().loadConversations();
          const id = String(result.conversation_id);
          get().selectConversation(id);
          return id;
        } catch (error) { report(error, "Group could not be created."); return null; }
      },

      sendText: async (content) => {
        const { authToken: token, currentUser, selectedConversationId: id } = get();
        if (!token || !currentUser || !id) return;
        const tempId = -Date.now();
        const optimistic: Message = { id: tempId, body: content, outgoing: true, time: "Now", status: "sending", reactions: [], messageType: "text", senderName: currentUser.display_name };
        set((state) => ({ messages: { ...state.messages, [id]: [...(state.messages[id] || []), optimistic] } }));
        try {
          const created = await signalApi.sendMessage(token, Number(id), content);
          set((state) => ({ messages: { ...state.messages, [id]: (state.messages[id] || []).map((message) => message.id === tempId ? mapMessage(created, currentUser.id) : message) } }));
          await get().loadConversations();
        } catch (error) {
          set((state) => ({ messages: { ...state.messages, [id]: (state.messages[id] || []).map((message) => message.id === tempId ? { ...message, status: "failed" } : message) } }));
          throw error;
        }
      },

      sendAttachment: async (file) => {
        const { authToken: token, currentUser, selectedConversationId: id } = get();
        if (!token || !currentUser || !id) return;
        const messageType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";
        const created = await signalApi.sendMessage(token, Number(id), "", messageType);
        set((state) => ({ messages: { ...state.messages, [id]: [...(state.messages[id] || []), mapMessage(created, currentUser.id)] } }));
        try {
          const attachment = await signalApi.uploadAttachment(token, created.id, file);
          set((state) => ({ messages: { ...state.messages, [id]: (state.messages[id] || []).map((message) => message.id === created.id ? { ...message, attachment } : message) } }));
          await get().loadConversations();
        } catch (error) {
          await signalApi.deleteMessage(token, created.id).catch(() => undefined);
          set((state) => ({ messages: { ...state.messages, [id]: (state.messages[id] || []).filter((message) => message.id !== created.id) } }));
          throw error;
        }
      },

      deleteMessage: async (messageId) => {
        const { authToken: token, selectedConversationId: id } = get();
        if (!token || !id) return;
        await signalApi.deleteMessage(token, messageId);
        set((state) => ({ messages: { ...state.messages, [id]: (state.messages[id] || []).filter((message) => message.id !== messageId) } }));
        await get().loadConversations();
      },

      toggleReaction: async (messageId, emoji) => {
        const { authToken: token, currentUser, selectedConversationId: id, messages } = get();
        if (!token || !currentUser || !id) return;
        const existing = messages[id]?.find((message) => message.id === messageId)?.reactions?.find((reaction) => reaction.user_id === currentUser.id && reaction.emoji === emoji);
        if (existing) {
          await signalApi.removeReaction(token, messageId, emoji);
          set((state) => ({ messages: { ...state.messages, [id]: (state.messages[id] || []).map((message) => message.id === messageId ? { ...message, reactions: (message.reactions || []).filter((reaction) => reaction.id !== existing.id) } : message) } }));
        } else {
          const reaction = await signalApi.addReaction(token, messageId, emoji);
          set((state) => ({ messages: { ...state.messages, [id]: (state.messages[id] || []).map((message) => message.id === messageId ? { ...message, reactions: [...(message.reactions || []), reaction] } : message) } }));
        }
      },

      sendTyping: (isTyping) => {
        const id = get().selectedConversationId;
        if (id && socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "typing", conversation_id: Number(id), is_typing: isTyping }));
      },

      connectRealtime: () => {
        const { authToken: token, currentUser } = get();
        if (!token || !currentUser || typeof WebSocket === "undefined") return;
        if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;
        realtimeStopped = false;
        socket = new WebSocket(`${WS_BASE}/ws?token=${encodeURIComponent(token)}`);
        socket.onopen = () => set({ realtimeConnected: true });
        socket.onmessage = (event) => {
          const payload = JSON.parse(event.data) as Record<string, unknown>;
          if (payload.type === "message.created") {
            const apiMessage = payload.message as ApiMessage;
            const id = String(apiMessage.conversation_id);
            set((state) => ({ messages: { ...state.messages, [id]: [...(state.messages[id] || []).filter((message) => message.id !== apiMessage.id), mapMessage(apiMessage, currentUser.id)] } }));
            if (get().selectedConversationId === id && apiMessage.sender_id !== currentUser.id) void signalApi.markRead(token, apiMessage.id);
            void get().loadConversations();
          } else if (payload.type === "message.deleted") {
            const id = String(payload.conversation_id), messageId = Number(payload.message_id);
            set((state) => ({ messages: { ...state.messages, [id]: (state.messages[id] || []).filter((message) => message.id !== messageId) } }));
            void get().loadConversations();
          } else if (payload.type === "reaction.added") {
            const reaction = payload.reaction as ApiReaction;
            set((state) => ({ messages: Object.fromEntries(Object.entries(state.messages).map(([id, list]) => [id, list.map((message) => message.id === reaction.message_id ? { ...message, reactions: [...(message.reactions || []).filter((item) => item.id !== reaction.id), reaction] } : message)])) }));
          } else if (payload.type === "reaction.removed") {
            const messageId = Number(payload.message_id), userId = Number(payload.user_id), emoji = String(payload.emoji);
            set((state) => ({ messages: Object.fromEntries(Object.entries(state.messages).map(([id, list]) => [id, list.map((message) => message.id === messageId ? { ...message, reactions: (message.reactions || []).filter((item) => item.user_id !== userId || item.emoji !== emoji) } : message)])) }));
          } else if (payload.type === "receipt.read") {
            const receipt = payload.receipt as { message_id: number };
            set((state) => ({ messages: Object.fromEntries(Object.entries(state.messages).map(([id, list]) => [id, list.map((message) => message.id === receipt.message_id ? { ...message, status: "read" as const } : message)])) }));
          } else if (payload.type === "typing") {
            const id = String(payload.conversation_id);
            const label = payload.is_typing ? `${String(payload.display_name)} is typing…` : "";
            set((state) => ({ typingByConversation: { ...state.typingByConversation, [id]: label } }));
            const currentTimer = typingTimers.get(id); if (currentTimer) clearTimeout(currentTimer);
            typingTimers.set(id, setTimeout(() => set((state) => ({ typingByConversation: { ...state.typingByConversation, [id]: "" } })), 1800));
          } else if (payload.type === "presence") {
            const userId = Number(payload.user_id), online = Boolean(payload.is_online);
            set((state) => ({ conversations: state.conversations.map((conversation) => conversation.peerUserId === userId ? { ...conversation, online, subtitle: online ? "Online" : "Last seen recently" } : conversation) }));
          }
        };
        socket.onclose = (event) => {
          set({ realtimeConnected: false }); socket = null;
          if (event.code === 4401) { get().logout(); return; }
          if (!realtimeStopped) reconnectTimer = setTimeout(() => get().connectRealtime(), 1500);
        };
      },
    };
  });

  return store;
}
