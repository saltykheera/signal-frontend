"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { AuthFlow } from "@/components/auth/AuthFlow";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ConversationList } from "@/components/conversations/ConversationList";
import { NewChatScreen } from "@/components/conversations/NewChatScreen";
import { ComingSoon } from "@/components/feedback/ComingSoon";
import { NavigationRail } from "@/components/navigation/NavigationRail";
import { MessengerStoreProvider, useMessengerStore } from "@/components/providers/MessengerStoreProvider";
import type { ApiUser, AppTab, Theme } from "@/types/messenger";

export function SignalReplicaAppView({ initialTab = "chats" }: { initialTab?: AppTab }) {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("light");
  const [tab, setTab] = useState<AppTab>(initialTab);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);

  const store = useMessengerStore(useShallow((state) => ({
    booting: state.booting,
    authStep: state.authStep,
    authToken: state.authToken,
    authBusy: state.authBusy,
    authError: state.authError,
    currentUser: state.currentUser,
    conversations: state.conversations,
    contacts: state.contacts,
    selectedConversationId: state.selectedConversationId,
    messages: state.messages,
    loadingConversationId: state.loadingConversationId,
    typingByConversation: state.typingByConversation,
    toast: state.toast,
    initialize: state.initialize,
    setAuthStep: state.setAuthStep,
    requestOtp: state.requestOtp,
    verifyOtp: state.verifyOtp,
    finishProfile: state.finishProfile,
    selectConversation: state.selectConversation,
    findUsers: state.findUsers,
    startChat: state.startChat,
    createGroup: state.createGroup,
    sendText: state.sendText,
    sendAttachment: state.sendAttachment,
    deleteMessage: state.deleteMessage,
    toggleReaction: state.toggleReaction,
    sendTyping: state.sendTyping,
    loadConversations: state.loadConversations,
    showToast: state.showToast,
  })));
  const initialize = store.initialize;

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedTheme = localStorage.getItem("signal-theme") as Theme | null;
      setTheme(savedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
      void initialize();
    }, 0);
    return () => clearTimeout(timer);
  }, [initialize]);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  async function handleStartChat(user: ApiUser) {
    if (await store.startChat(user)) {
      setNewChatOpen(false);
      setMobileChatOpen(true);
    }
  }

  async function handleCreateGroup(name: string, members: number[]) {
    if (await store.createGroup(name, members)) {
      setNewChatOpen(false);
      setMobileChatOpen(true);
    }
  }

  if (store.booting) return <main className="app-loading"><span className="loading-spinner" /><strong>Opening Signal…</strong></main>;
  if (store.authStep !== "app" || !store.currentUser || !store.authToken) {
    return <><AuthFlow step={store.authStep} setStep={store.setAuthStep} onRequestOtp={store.requestOtp} onVerify={store.verifyOtp} onComplete={store.finishProfile} busy={store.authBusy} error={store.authError} />{store.toast && <div className="app-toast" role="status">{store.toast}</div>}</>;
  }

  const activeConversation = store.conversations.find((item) => item.id === store.selectedConversationId);
  return <main className={`app-shell ${mobileChatOpen ? "mobile-chat-open" : ""} ${railCollapsed ? "rail-collapsed" : ""} ${newChatOpen ? "new-chat-open" : ""}`}>
    <div className="app-body">
      <NavigationRail tab={tab} setTab={(nextTab) => { setTab(nextTab); setMobileChatOpen(false); }} openSettings={() => router.push("/settings")} onToggleRail={() => setRailCollapsed((collapsed) => !collapsed)} />
      {tab === "chats" ? <>
        {newChatOpen
          ? <NewChatScreen onClose={() => setNewChatOpen(false)} contacts={store.contacts} onFindUsers={store.findUsers} onStartChat={handleStartChat} onCreateGroup={handleCreateGroup} />
          : <ConversationList conversations={store.conversations} selected={store.selectedConversationId || ""} onToggleRail={() => setRailCollapsed((collapsed) => !collapsed)} onNewChat={() => setNewChatOpen(true)} onSelect={(id) => { store.selectConversation(id); setMobileChatOpen(true); }} />}
        {activeConversation
          ? <ChatPanel conversation={activeConversation} messages={store.messages[activeConversation.id] || []} currentUser={store.currentUser} contacts={store.contacts} token={store.authToken} loading={store.loadingConversationId === activeConversation.id} typingLabel={store.typingByConversation[activeConversation.id]} onBack={() => setMobileChatOpen(false)} onSendText={store.sendText} onSendAttachment={store.sendAttachment} onDeleteMessage={store.deleteMessage} onToggleReaction={store.toggleReaction} onTyping={store.sendTyping} onConversationChanged={store.loadConversations} onError={store.showToast} />
          : <section className="empty-chat"><span>💬</span><h2>Your Signal conversations</h2><p>Choose a chat or start a new private conversation.</p></section>}
      </> : <ComingSoon tab={tab} />}
    </div>
    {store.toast && <div className="app-toast" role="status">{store.toast}</div>}
  </main>;
}

export default function SignalReplicaApp(props: { initialTab?: AppTab }) {
  return <MessengerStoreProvider><SignalReplicaAppView {...props} /></MessengerStoreProvider>;
}
