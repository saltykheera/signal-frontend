"use client";

import { type ChangeEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";
import type { ApiConversationDetail, ApiUser, Conversation, Message } from "@/types/messenger";
import { signalApi } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { AttachmentMenu } from "@/components/chat/AttachmentMenu";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { DeleteMessageDialog } from "@/components/chat/DeleteMessageDialog";

type ChatPanelProps = {
  conversation: Conversation;
  messages: Message[];
  currentUser: ApiUser;
  contacts: ApiUser[];
  token: string;
  loading?: boolean;
  typingLabel?: string;
  onBack: () => void;
  onSendText: (content: string) => Promise<void>;
  onSendAttachment: (file: File) => Promise<void>;
  onDeleteMessage: (messageId: number) => Promise<void>;
  onToggleReaction: (messageId: number, emoji: string) => Promise<void>;
  onTyping: (typing: boolean) => void;
  onConversationChanged: () => Promise<void>;
  onError: (message: string) => void;
};

export function ChatPanel({ conversation, messages, currentUser, contacts, token, loading, typingLabel, onBack, onSendText, onSendAttachment, onDeleteMessage, onToggleReaction, onTyping, onConversationChanged, onError }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState<Message | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentControlRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);
  useEffect(() => {
    const timer = setTimeout(() => { setDraft(""); setDetailsOpen(false); }, 0);
    return () => clearTimeout(timer);
  }, [conversation.id]);
  useEffect(() => () => { if (typingTimer.current) clearTimeout(typingTimer.current); }, []);

  useEffect(() => {
    if (!attachmentOpen) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !attachmentControlRef.current?.contains(event.target)) setAttachmentOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [attachmentOpen]);

  async function sendMessage() {
    const body = draft.trim();
    if (body.length < 2 || sending) return;
    setDraft(""); setSending(true); onTyping(false);
    try { await onSendText(body); }
    catch (error) { setDraft(body); onError(error instanceof Error ? error.message : "Message could not be sent."); }
    finally { setSending(false); }
  }

  function composerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); }
  }

  function updateDraft(value: string) {
    setDraft(value);
    onTyping(Boolean(value.trim()));
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => onTyping(false), 1200);
  }

  async function selectAttachment(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setAttachmentOpen(false);
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { onError("Attachments must be 10 MB or smaller."); return; }
    setSending(true);
    try { await onSendAttachment(file); }
    catch (error) { onError(error instanceof Error ? error.message : "Attachment could not be sent."); }
    finally { setSending(false); }
  }

  return (
    <section className="chat-panel">
      <header className="chat-header"><button className="icon-button mobile-back" onClick={onBack} aria-label="Back to conversations"><Icon name="back" /></button><Avatar conversation={conversation} size={40} /><button className="chat-identity" onClick={() => setDetailsOpen(true)} aria-label={`Open ${conversation.name} details`}><strong>{conversation.name}</strong><span>{typingLabel || conversation.subtitle}</span></button><div className="chat-actions"><button className="icon-button" aria-label="Search in conversation"><Icon name="search" /></button><button className="icon-button" onClick={() => setDetailsOpen(true)} aria-label="Conversation options"><Icon name="more" /></button></div></header>
      <div className="message-timeline">
        <div className="conversation-intro"><Avatar conversation={conversation} size={88} showOnline={false} /><h2>{conversation.name}</h2><span>{conversation.group ? `${conversation.memberCount || 0} members` : "Signal contact"}</span><p>{conversation.group ? "Messages are shared with every group member." : "Your messages and calls are end-to-end encrypted (simulated for this demo)."}</p></div>
        <div className="date-separator"><span>Today</span></div>
        {loading ? <div className="chat-loading">Loading messages…</div> : <div className="message-stack">{messages.map((message, index) => {
          const previous = messages[index - 1];
          const next = messages[index + 1];
          const first = !previous || previous.outgoing !== message.outgoing;
          const last = !next || next.outgoing !== message.outgoing;
          return <div key={message.id} className={`message-row ${message.outgoing ? "outgoing" : "incoming"} ${first ? "cluster-first" : ""} ${last ? "cluster-last" : ""}`}><MessageBubble message={message} showSender={Boolean(conversation.group)} onDelete={() => setPendingDeleteId(message.id)} onInfo={() => setInfoMessage(message)} onToggleReaction={(emoji) => onToggleReaction(message.id, emoji)} /></div>;
        })}<div ref={bottomRef} /></div>}
      </div>
      {infoMessage && <div className="message-info-backdrop" role="presentation"><section className="message-info-dialog" role="dialog" aria-modal="true" aria-labelledby="message-info-title"><h2 id="message-info-title">Message info</h2><p>{infoMessage.outgoing ? "Sent" : "Received"} at {infoMessage.time}</p><p>Status: {infoMessage.status || "sent"}</p><button type="button" onClick={() => setInfoMessage(null)}>Done</button></section></div>}
      {pendingDeleteId !== null && <DeleteMessageDialog onCancel={() => setPendingDeleteId(null)} onConfirm={() => { void onDeleteMessage(pendingDeleteId); setPendingDeleteId(null); }} />}
      {detailsOpen && <ConversationDetails conversation={conversation} token={token} currentUser={currentUser} contacts={contacts} onClose={() => setDetailsOpen(false)} onChanged={onConversationChanged} onError={onError} />}
      <footer className="composer-bar"><input ref={photoInputRef} className="attachment-file-input" type="file" accept="image/*,video/*" onChange={selectAttachment} /><input ref={fileInputRef} className="attachment-file-input" type="file" onChange={selectAttachment} /><button className="icon-button composer-external" aria-label="Emoji picker"><Icon name="emoji" size={22} /></button><div className="composer-field"><textarea value={draft} onChange={(event) => updateDraft(event.target.value)} onKeyDown={composerKeyDown} placeholder="Message" rows={1} aria-label="Message" disabled={sending} /></div><div ref={attachmentControlRef} className="attachment-control">{attachmentOpen && <AttachmentMenu onPhotos={() => photoInputRef.current?.click()} onFile={() => fileInputRef.current?.click()} />}<button className="icon-button composer-external" onClick={() => setAttachmentOpen((open) => !open)} aria-label="Add attachment" aria-expanded={attachmentOpen} disabled={sending}><Icon name="plus" size={22} /></button></div></footer>
    </section>
  );
}

function ConversationDetails({ conversation, token, currentUser, contacts, onClose, onChanged, onError }: { conversation: Conversation; token: string; currentUser: ApiUser; contacts: ApiUser[]; onClose: () => void; onChanged: () => Promise<void>; onError: (message: string) => void }) {
  const [detail, setDetail] = useState<ApiConversationDetail | null>(null);
  const [adding, setAdding] = useState(false);
  useEffect(() => { signalApi.conversation(token, Number(conversation.id)).then(setDetail).catch((error) => onError(error instanceof Error ? error.message : "Could not load conversation details.")); }, [conversation.id, token, onError]);
  const me = detail?.members.find((member) => member.id === currentUser.id);
  const candidates = contacts.filter((contact) => !detail?.members.some((member) => member.id === contact.id));

  async function remove(userId: number) {
    try { await signalApi.removeGroupMember(token, Number(conversation.id), userId); setDetail(await signalApi.conversation(token, Number(conversation.id))); await onChanged(); }
    catch (error) { onError(error instanceof Error ? error.message : "Member could not be removed."); }
  }

  return <aside className="conversation-details" aria-label="Conversation details"><header><button className="icon-button" onClick={onClose} aria-label="Close details"><Icon name="back" /></button><h2>Conversation info</h2></header><div className="conversation-details-body"><Avatar conversation={conversation} size={76} /><h3>{conversation.name}</h3>{detail?.type === "group" && <><div className="details-section-title"><span>{detail.members.length} members</span>{me?.role === "admin" && candidates.length > 0 && <button type="button" onClick={() => setAdding((value) => !value)}>Add member</button>}</div>{adding && <div className="member-candidates">{candidates.map((candidate) => <button key={candidate.id} onClick={async () => { try { setDetail(await signalApi.addGroupMember(token, detail.id, candidate.id)); setAdding(false); await onChanged(); } catch (error) { onError(error instanceof Error ? error.message : "Member could not be added."); } }}>{candidate.display_name}</button>)}</div>}<div className="member-list">{detail.members.map((member) => <div key={member.id}><span className="member-avatar">{member.display_name.slice(0, 2).toUpperCase()}</span><span><strong>{member.display_name}{member.id === currentUser.id ? " (You)" : ""}</strong><small>{member.role}</small></span>{me?.role === "admin" && member.id !== currentUser.id && <button onClick={() => void remove(member.id)}>Remove</button>}</div>)}</div></>}</div></aside>;
}
