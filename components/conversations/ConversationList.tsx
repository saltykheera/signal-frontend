"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Conversation, ConversationId } from "@/types/messenger";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";

type ConversationListProps = {
  conversations: Conversation[];
  selected: ConversationId;
  onSelect: (id: ConversationId) => void;
  onToggleRail: () => void;
  onNewChat: () => void;
};

export function ConversationList({ conversations, selected, onSelect, onToggleRail, onNewChat }: ConversationListProps) {
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => conversations.filter((conversation) => `${conversation.name} ${conversation.preview}`.toLowerCase().includes(query.toLowerCase())), [conversations, query]);

  useEffect(() => {
    function focusSearch() { searchInputRef.current?.focus(); }
    window.addEventListener("signal:focus-conversation-search", focusSearch);
    return () => window.removeEventListener("signal:focus-conversation-search", focusSearch);
  }, []);

  return (
    <aside className="conversation-sidebar">
      <header className="sidebar-header"><div className="sidebar-title"><button className="icon-button sidebar-rail-toggle" onClick={onToggleRail} aria-label="Open navigation"><Icon name="menu" /></button><h1>Chats</h1></div><div><button className="icon-button" onClick={onNewChat} aria-label="New chat" title="New chat (⌘/Ctrl K)" aria-keyshortcuts="Meta+K Control+K"><Icon name="compose" /></button><button className="icon-button" aria-label="More chat options"><Icon name="more" /></button></div></header>
      <div className="search-zone"><label className="search-field"><Icon name="search" size={18} /><input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" aria-label="Search conversations" title="Search conversations (⌘/Ctrl F)" aria-keyshortcuts="Meta+F Control+F" />{query && <button onClick={() => setQuery("")} aria-label="Clear search">×</button>}</label><button className="icon-button" aria-label="Filter conversations"><Icon name="filter" /></button></div>
      <div className="conversation-list" role="listbox" aria-label="Conversations">
        {filtered.map((conversation) => <button key={conversation.id} className={`conversation-row ${selected === conversation.id ? "selected" : ""}`} onClick={() => onSelect(conversation.id)} role="option" aria-selected={selected === conversation.id}><Avatar conversation={conversation} /><span className="conversation-copy"><span className="conversation-top"><strong>{conversation.name}{conversation.muted && <span className="muted-mark">◌</span>}</strong><time>{conversation.time}</time></span><span className={`conversation-bottom ${conversation.unread ? "unread" : ""}`}><span>{conversation.preview}</span>{conversation.unread ? <b>{conversation.unread}</b> : conversation.id === "self" ? <Icon name="check" size={16} /> : null}</span></span></button>)}
        {!filtered.length && <div className="no-results"><Icon name="search" size={24} /><strong>No conversations found</strong><span>Try a different search.</span></div>}
      </div>
    </aside>
  );
}
