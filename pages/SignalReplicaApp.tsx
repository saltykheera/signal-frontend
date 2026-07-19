"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthFlow } from "@/components/auth/AuthFlow";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ConversationList } from "@/components/conversations/ConversationList";
import { NewChatScreen } from "@/components/conversations/NewChatScreen";
import { ComingSoon } from "@/components/feedback/ComingSoon";
import { NavigationRail } from "@/components/navigation/NavigationRail";
import { ApiError, signalApi, TOKEN_KEY, WS_BASE } from "@/lib/api";
import type { ApiConversation, ApiMessage, ApiReaction, ApiUser, AppTab, AuthStep, Conversation, ConversationId, Message, Theme } from "@/types/messenger";

function initials(name: string) { return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "S"; }
function colorFor(id: number) { return ["#f8c9e7", "#c9d9ff", "#f7d59c", "#cef0e9", "#e2e3ff"][id % 5]; }
function formatTimestamp(value: string | null) {
  if (!value) return "";
  const date = new Date(value.endsWith("Z") || value.includes("+") ? value : `${value}Z`);
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(date)
    : new Intl.DateTimeFormat("en", { weekday: "short" }).format(date);
}
function mapConversation(item: ApiConversation): Conversation {
  const name = item.name || "Signal conversation";
  const lastSeen = item.last_seen ? `Last seen ${formatTimestamp(item.last_seen)}` : "Offline";
  return { id: String(item.id), name, initials: initials(name), preview: item.last_message || "Start a conversation", time: formatTimestamp(item.last_message_timestamp), color: colorFor(item.id), unread: item.unread_count || undefined, online: item.is_online, group: item.type === "group", subtitle: item.type === "group" ? `${item.member_count} members` : item.is_online ? "Online" : lastSeen, avatarUrl: item.avatar_url, peerUserId: item.peer_user_id, memberCount: item.member_count };
}
function mapMessage(item: ApiMessage, currentUserId: number): Message {
  return { id: item.id, body: item.content, outgoing: item.sender_id === currentUserId, time: formatTimestamp(item.created_at), status: item.status, reactions: item.reactions, messageType: item.message_type, attachment: item.attachments[0], senderName: item.sender_name };
}

export default function SignalReplicaApp({ initialTab = "chats" }: { initialTab?: AppTab }) {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>("phone");
  const [theme, setThemeState] = useState<Theme>("light");
  const [tab, setTab] = useState<AppTab>(initialTab);
  const [selected, setSelected] = useState<ConversationId | null>(null);
  const [messages, setMessages] = useState<Record<ConversationId, Message[]>>({});
  const [conversationItems, setConversationItems] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<ApiUser[]>([]);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authPhone, setAuthPhone] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [typingByConversation, setTypingByConversation] = useState<Record<string, string>>({});
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const selectedRef = useRef<ConversationId | null>(null);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const showError = useCallback((message: string) => setToast(message), []);
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("signal-profile");
    setAuthToken(null); setCurrentUser(null); setConversationItems([]); setMessages({}); setSelected(null); setStep("phone");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedTheme = localStorage.getItem("signal-theme") as Theme | null;
      setThemeState(savedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) { setBooting(false); return; }
      signalApi.me(token).then((user) => {
        setAuthToken(token); setCurrentUser(user); setStep("app");
        localStorage.setItem("signal-profile", JSON.stringify({ name: user.display_name, phone: user.phone || "", avatarUrl: user.avatar_url }));
      }).catch(() => logout()).finally(() => setBooting(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [logout]);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 4500); return () => clearTimeout(timer); }, [toast]);

  const reloadConversations = useCallback(async () => {
    if (!authToken) return;
    try {
      const rows = (await signalApi.conversations(authToken)).map(mapConversation);
      setConversationItems(rows);
      setSelected((current) => current && rows.some((row) => row.id === current) ? current : rows[0]?.id || null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) logout(); else showError(error instanceof Error ? error.message : "Conversations could not be loaded.");
    }
  }, [authToken, logout, showError]);

  const reloadContacts = useCallback(async () => {
    if (!authToken) return;
    try { setContacts(await signalApi.contacts(authToken)); }
    catch (error) { showError(error instanceof Error ? error.message : "Contacts could not be loaded."); }
  }, [authToken, showError]);

  useEffect(() => {
    if (step !== "app" || !authToken) return;
    const timer = setTimeout(() => { void Promise.all([reloadConversations(), reloadContacts()]); }, 0);
    return () => clearTimeout(timer);
  }, [step, authToken, reloadConversations, reloadContacts]);

  useEffect(() => {
    if (!selected || !authToken || !currentUser) return;
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) setMessagesLoading(true); });
    signalApi.messages(authToken, Number(selected)).then(async (rows) => {
      if (cancelled) return;
      setMessages((current) => ({ ...current, [selected]: rows.map((row) => mapMessage(row, currentUser.id)) }));
      const unread = rows.filter((row) => row.sender_id !== currentUser.id && !row.receipts.some((receipt) => receipt.user_id === currentUser.id && receipt.read_at));
      await Promise.allSettled(unread.map((row) => signalApi.markRead(authToken, row.id)));
      if (unread.length) await reloadConversations();
    }).catch((error) => showError(error instanceof Error ? error.message : "Messages could not be loaded.")).finally(() => !cancelled && setMessagesLoading(false));
    return () => { cancelled = true; };
  }, [selected, authToken, currentUser, reloadConversations, showError]);

  useEffect(() => {
    if (step !== "app" || !authToken || !currentUser) return;
    const realtimeToken = authToken;
    const realtimeUserId = currentUser.id;
    let stopped = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
    function connect() {
      const socket = new WebSocket(`${WS_BASE}/ws?token=${encodeURIComponent(realtimeToken)}`);
      socketRef.current = socket;
      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data) as Record<string, unknown>;
        if (payload.type === "message.created") {
          const apiMessage = payload.message as ApiMessage; const id = String(apiMessage.conversation_id);
          setMessages((current) => ({ ...current, [id]: [...(current[id] || []).filter((message) => message.id !== apiMessage.id), mapMessage(apiMessage, realtimeUserId)] }));
          if (selectedRef.current === id && apiMessage.sender_id !== realtimeUserId) void signalApi.markRead(realtimeToken, apiMessage.id);
          void reloadConversations();
        } else if (payload.type === "message.deleted") {
          const id = String(payload.conversation_id); const messageId = Number(payload.message_id);
          setMessages((current) => ({ ...current, [id]: (current[id] || []).filter((message) => message.id !== messageId) }));
          void reloadConversations();
        } else if (payload.type === "reaction.added") {
          const reaction = payload.reaction as ApiReaction;
          setMessages((current) => Object.fromEntries(Object.entries(current).map(([id, list]) => [id, list.map((message) => message.id === reaction.message_id ? { ...message, reactions: [...(message.reactions || []).filter((item) => item.id !== reaction.id), reaction] } : message)])));
        } else if (payload.type === "reaction.removed") {
          const messageId = Number(payload.message_id), userId = Number(payload.user_id), emoji = String(payload.emoji);
          setMessages((current) => Object.fromEntries(Object.entries(current).map(([id, list]) => [id, list.map((message) => message.id === messageId ? { ...message, reactions: (message.reactions || []).filter((item) => item.user_id !== userId || item.emoji !== emoji) } : message)])));
        } else if (payload.type === "receipt.read") {
          const receipt = payload.receipt as { message_id: number };
          setMessages((current) => Object.fromEntries(Object.entries(current).map(([id, list]) => [id, list.map((message) => message.id === receipt.message_id ? { ...message, status: "read" as const } : message)])));
        } else if (payload.type === "typing") {
          const id = String(payload.conversation_id); const label = payload.is_typing ? `${String(payload.display_name)} is typing…` : "";
          setTypingByConversation((current) => ({ ...current, [id]: label }));
          const existing = typingTimers.get(id); if (existing) clearTimeout(existing);
          typingTimers.set(id, setTimeout(() => setTypingByConversation((current) => ({ ...current, [id]: "" })), 1800));
        } else if (payload.type === "presence") {
          const userId = Number(payload.user_id), online = Boolean(payload.is_online);
          setConversationItems((current) => current.map((conversation) => conversation.peerUserId === userId ? { ...conversation, online, subtitle: online ? "Online" : "Last seen recently" } : conversation));
        }
      };
      socket.onclose = () => { if (!stopped) retryTimer = setTimeout(connect, 1500); };
    }
    connect();
    return () => { stopped = true; if (retryTimer) clearTimeout(retryTimer); typingTimers.forEach(clearTimeout); socketRef.current?.close(); socketRef.current = null; };
  }, [step, authToken, currentUser, reloadConversations]);

  async function requestOtp(phone: string) {
    setAuthBusy(true); setAuthError(null);
    try { const response = await signalApi.requestOtp(phone); setAuthPhone(phone); setStep("otp"); setToast(`Development verification code: ${response.otp}`); }
    catch (error) { setAuthError(error instanceof Error ? error.message : "Could not request a code."); }
    finally { setAuthBusy(false); }
  }
  async function verifyOtp(otp: string) {
    setAuthBusy(true); setAuthError(null);
    try {
      const result = await signalApi.verifyOtp(authPhone, otp);
      localStorage.setItem(TOKEN_KEY, result.access_token); setAuthToken(result.access_token); setCurrentUser(result.user);
      if (result.user.display_name === result.user.phone) setStep("profile");
      else { localStorage.setItem("signal-profile", JSON.stringify({ name: result.user.display_name, phone: result.user.phone || "", avatarUrl: result.user.avatar_url })); setStep("app"); }
    } catch (error) { setAuthError(error instanceof Error ? error.message : "Verification failed."); }
    finally { setAuthBusy(false); }
  }
  async function finishProfile(name: string, avatar: File | null) {
    if (!authToken) return;
    setAuthBusy(true); setAuthError(null);
    try {
      let user = await signalApi.updateProfile(authToken, { display_name: name });
      if (avatar) user = await signalApi.uploadAvatar(authToken, avatar);
      setCurrentUser(user); localStorage.setItem("signal-profile", JSON.stringify({ name: user.display_name, phone: user.phone || "", avatarUrl: user.avatar_url })); setStep("app");
    } catch (error) { setAuthError(error instanceof Error ? error.message : "Profile could not be saved."); }
    finally { setAuthBusy(false); }
  }

  async function startChat(user: ApiUser) {
    if (!authToken) return;
    try {
      try { await signalApi.addContact(authToken, user.id); } catch (error) { if (!(error instanceof ApiError) || error.status !== 409) throw error; }
      const result = await signalApi.createConversation(authToken, { type: "direct", member_ids: [user.id] });
      await Promise.all([reloadConversations(), reloadContacts()]); setSelected(String(result.conversation_id)); setNewChatOpen(false); setMobileChatOpen(true);
    } catch (error) { showError(error instanceof Error ? error.message : "Chat could not be started."); }
  }
  async function createGroup(groupName: string, members: number[]) {
    if (!authToken || !members.length) { showError("Choose at least one group member."); return; }
    try { const result = await signalApi.createConversation(authToken, { type: "group", name: groupName, member_ids: members }); await reloadConversations(); setSelected(String(result.conversation_id)); setNewChatOpen(false); setMobileChatOpen(true); }
    catch (error) { showError(error instanceof Error ? error.message : "Group could not be created."); }
  }
  async function findUsers(query: string) { if (!authToken) return []; return signalApi.searchUsers(authToken, query); }

  async function sendText(content: string) {
    if (!authToken || !currentUser || !selected) return;
    const tempId = -Date.now(); const optimistic: Message = { id: tempId, body: content, outgoing: true, time: "Now", status: "sending", reactions: [], messageType: "text", senderName: currentUser.display_name };
    setMessages((current) => ({ ...current, [selected]: [...(current[selected] || []), optimistic] }));
    try { const created = await signalApi.sendMessage(authToken, Number(selected), content); setMessages((current) => ({ ...current, [selected]: (current[selected] || []).map((message) => message.id === tempId ? mapMessage(created, currentUser.id) : message) })); await reloadConversations(); }
    catch (error) { setMessages((current) => ({ ...current, [selected]: (current[selected] || []).map((message) => message.id === tempId ? { ...message, status: "failed" } : message) })); throw error; }
  }
  async function sendAttachment(file: File) {
    if (!authToken || !currentUser || !selected) return;
    const messageType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";
    const created = await signalApi.sendMessage(authToken, Number(selected), "", messageType);
    setMessages((current) => ({ ...current, [selected]: [...(current[selected] || []), mapMessage(created, currentUser.id)] }));
    try { const attachment = await signalApi.uploadAttachment(authToken, created.id, file); setMessages((current) => ({ ...current, [selected]: (current[selected] || []).map((message) => message.id === created.id ? { ...message, attachment } : message) })); await reloadConversations(); }
    catch (error) { await signalApi.deleteMessage(authToken, created.id).catch(() => undefined); setMessages((current) => ({ ...current, [selected]: (current[selected] || []).filter((message) => message.id !== created.id) })); throw error; }
  }
  async function deleteMessage(messageId: number) { if (!authToken || !selected) return; await signalApi.deleteMessage(authToken, messageId); setMessages((current) => ({ ...current, [selected]: (current[selected] || []).filter((message) => message.id !== messageId) })); await reloadConversations(); }
  async function toggleReaction(messageId: number, emoji: string) {
    if (!authToken || !currentUser || !selected) return;
    const message = (messages[selected] || []).find((item) => item.id === messageId); const existing = message?.reactions?.find((reaction) => reaction.user_id === currentUser.id && reaction.emoji === emoji);
    if (existing) { await signalApi.removeReaction(authToken, messageId, emoji); setMessages((current) => ({ ...current, [selected]: (current[selected] || []).map((item) => item.id === messageId ? { ...item, reactions: (item.reactions || []).filter((reaction) => reaction.id !== existing.id) } : item) })); }
    else { const reaction = await signalApi.addReaction(authToken, messageId, emoji); setMessages((current) => ({ ...current, [selected]: (current[selected] || []).map((item) => item.id === messageId ? { ...item, reactions: [...(item.reactions || []), reaction] } : item) })); }
  }
  function sendTyping(isTyping: boolean) { if (selected && socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({ type: "typing", conversation_id: Number(selected), is_typing: isTyping })); }

  if (booting) return <main className="app-loading"><span className="loading-spinner" /><strong>Opening Signal…</strong></main>;
  if (step !== "app" || !currentUser || !authToken) return <><AuthFlow step={step} setStep={setStep} onRequestOtp={requestOtp} onVerify={verifyOtp} onComplete={finishProfile} busy={authBusy} error={authError} />{toast && <div className="app-toast" role="status">{toast}</div>}</>;
  const activeConversation = conversationItems.find((item) => item.id === selected);
  return <main className={`app-shell ${mobileChatOpen ? "mobile-chat-open" : ""} ${railCollapsed ? "rail-collapsed" : ""} ${newChatOpen ? "new-chat-open" : ""}`}><div className="app-body"><NavigationRail tab={tab} setTab={(nextTab) => { setTab(nextTab); setMobileChatOpen(false); }} openSettings={() => router.push("/settings")} onToggleRail={() => setRailCollapsed((collapsed) => !collapsed)} />{tab === "chats" ? <>{newChatOpen ? <NewChatScreen onClose={() => setNewChatOpen(false)} contacts={contacts} onFindUsers={findUsers} onStartChat={startChat} onCreateGroup={createGroup} /> : <ConversationList conversations={conversationItems} selected={selected || ""} onToggleRail={() => setRailCollapsed((collapsed) => !collapsed)} onNewChat={() => setNewChatOpen(true)} onSelect={(id) => { setSelected(id); setMobileChatOpen(true); }} />}{activeConversation ? <ChatPanel conversation={activeConversation} messages={messages[activeConversation.id] || []} currentUser={currentUser} contacts={contacts} token={authToken} loading={messagesLoading} typingLabel={typingByConversation[activeConversation.id]} onBack={() => setMobileChatOpen(false)} onSendText={sendText} onSendAttachment={sendAttachment} onDeleteMessage={deleteMessage} onToggleReaction={toggleReaction} onTyping={sendTyping} onConversationChanged={reloadConversations} onError={showError} /> : <section className="empty-chat"><span>💬</span><h2>Your Signal conversations</h2><p>Choose a chat or start a new private conversation.</p></section>}</> : <ComingSoon tab={tab} />}</div>{toast && <div className="app-toast" role="status">{toast}</div>}</main>;
}
