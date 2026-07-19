"use client";
/* eslint-disable @next/next/no-img-element -- backend avatar URLs are dynamic */

import { useEffect, useMemo, useRef, useState } from "react";
import type { Message } from "@/types/messenger";
import { API_BASE } from "@/lib/api";
import { Icon } from "@/components/ui/Icon";
import { MessageAttachment } from "@/components/chat/MessageAttachment";
import { Bubble, BubbleContent, BubbleReactions } from "@/components/ui/bubble";

type MessageBubbleProps = {
  message: Message;
  showSender?: boolean;
  isDirectConversation: boolean;
  onDelete: () => void;
  onInfo: () => void;
  onToggleReaction: (emoji: string) => void;
};

const reactionChoices = ["👍", "❤️", "😂", "😮"];

export function MessageBubble({ message, showSender, isDirectConversation, onDelete, onInfo, onToggleReaction }: MessageBubbleProps) {
  const [panel, setPanel] = useState<"reactions" | "menu" | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const groupedReactions = useMemo(() => Object.entries((message.reactions || []).reduce<Record<string, number>>((counts, reaction) => ({ ...counts, [reaction.emoji]: (counts[reaction.emoji] || 0) + 1 }), {})), [message.reactions]);
  const messageStatus = message.status || "sent";
  const receiptCount = isDirectConversation && messageStatus === "read" ? 2 : 1;
  const showGroupAvatar = Boolean(showSender && !message.outgoing);
  const senderInitials = (message.senderName || "?").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!panel) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !actionsRef.current?.contains(event.target)) setPanel(null);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [panel]);

  return <div ref={actionsRef} className={`message-bubble-wrap ${showGroupAvatar ? "group-incoming-bubble" : ""}`}>
    <div className="message-hover-actions" aria-label="Message actions">
      <button type="button" onClick={() => setPanel(panel === "reactions" ? null : "reactions")} aria-label="React to message" aria-expanded={panel === "reactions"}><Icon name="emoji" size={16} /></button>
      <button type="button" onClick={() => setPanel(panel === "menu" ? null : "menu")} aria-label="More message options" aria-expanded={panel === "menu"}><Icon name="more" size={17} /></button>
      {panel === "reactions" && <div className="message-reaction-picker" role="menu" aria-label="Choose a reaction">{reactionChoices.map((emoji) => <button type="button" role="menuitem" key={emoji} onClick={() => { onToggleReaction(emoji); setPanel(null); }}>{emoji}</button>)}</div>}
      {panel === "menu" && <div className="message-action-menu" role="menu" aria-label="Message options"><button type="button" role="menuitem" onClick={() => { onInfo(); setPanel(null); }}><Icon name="info" size={15} /><span>Info</span></button>{message.outgoing && <button type="button" role="menuitem" className="message-delete-action" onClick={() => { onDelete(); setPanel(null); }}><Icon name="trash" size={15} /><span>Delete</span></button>}</div>}
    </div>
    {showGroupAvatar && <span className="group-message-avatar" aria-label={`${message.senderName || "Group member"} avatar`}>{message.senderAvatarUrl ? <img src={`${API_BASE}${message.senderAvatarUrl}`} alt="" /> : senderInitials}</span>}
    <Bubble className={`signal-message-bubble ${groupedReactions.length ? "has-reactions" : ""}`} variant={message.outgoing ? "default" : "secondary"} align={message.outgoing ? "end" : "start"}>
      <BubbleContent className={`message-bubble ${message.attachment ? `has-attachment attachment-${message.messageType || "file"}` : ""}`}>
        {showSender && !message.outgoing && message.senderName && <strong className="message-sender">{message.senderName}</strong>}
        {message.attachment && <MessageAttachment attachment={message.attachment} messageType={message.messageType} />}
        {message.body && <span className="message-body">{message.body}</span>}
        {!message.attachment && <span className="message-meta"><time>{message.time}</time>{message.outgoing && <span className={`message-status ${messageStatus}`} title={messageStatus}>{messageStatus === "sending" ? "○" : messageStatus === "failed" ? "!" : <span className="message-receipt-icons">{Array.from({ length: receiptCount }, (_, index) => <Icon key={index} name="checkCircleFill" size={12} className="message-receipt-icon" />)}</span>}</span>}</span>}
      </BubbleContent>
      {groupedReactions.length > 0 && <BubbleReactions className="signal-bubble-reactions" align={message.outgoing ? "start" : "end"} aria-label="Message reactions">{groupedReactions.map(([emoji, count]) => <button type="button" key={emoji} onClick={() => onToggleReaction(emoji)}>{emoji}{count > 1 ? ` ${count}` : ""}</button>)}</BubbleReactions>}
    </Bubble>
  </div>;
}
