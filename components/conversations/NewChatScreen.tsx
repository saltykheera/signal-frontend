"use client";

import { useEffect, useMemo, useState } from "react";
import type { ApiUser } from "@/types/messenger";
import { Icon } from "@/components/ui/Icon";
import { GroupCreationFlow } from "@/components/conversations/GroupCreationFlow";
import { UsernameLookupScreen } from "@/components/conversations/UsernameLookupScreen";
import { PhoneNumberLookupScreen } from "@/components/conversations/PhoneNumberLookupScreen";

type NewChatScreenProps = {
  onClose: () => void;
  contacts: ApiUser[];
  contactsLoading: boolean;
  onRefreshContacts: () => Promise<void>;
  onFindUsers: (query: string) => Promise<ApiUser[]>;
  onStartChat: (user: ApiUser) => Promise<void>;
  onCreateGroup: (name: string, members: number[]) => Promise<void>;
};

const actions = [
  { label: "New group", icon: "group" as const },
  { label: "Find by username", icon: "at" as const },
  { label: "Find by phone number", icon: "number" as const },
];

export function NewChatScreen({ onClose, contacts: availableContacts, contactsLoading, onRefreshContacts, onFindUsers, onStartChat, onCreateGroup }: NewChatScreenProps) {
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [findingByUsername, setFindingByUsername] = useState(false);
  const [findingByPhone, setFindingByPhone] = useState(false);
  const [query, setQuery] = useState("");
  const contacts = useMemo(() => availableContacts.filter((contact) => `${contact.display_name} ${contact.username || ""} ${contact.phone || ""}`.toLowerCase().includes(query.trim().toLowerCase())), [availableContacts, query]);

  useEffect(() => { void onRefreshContacts(); }, [onRefreshContacts]);

  if (creatingGroup) return <GroupCreationFlow onClose={() => setCreatingGroup(false)} contacts={availableContacts} loading={contactsLoading} onCreate={onCreateGroup} />;
  if (findingByUsername) return <UsernameLookupScreen onClose={() => setFindingByUsername(false)} onFind={onFindUsers} onSelect={onStartChat} />;
  if (findingByPhone) return <PhoneNumberLookupScreen onClose={() => setFindingByPhone(false)} onFind={onFindUsers} onSelect={onStartChat} />;

  return (
    <aside className="conversation-sidebar new-chat-sidebar">
      <header className="new-chat-header">
        <button className="icon-button new-chat-back" onClick={onClose} aria-label="Back to chats"><Icon name="back" size={22} /></button>
        <h1>New chat</h1>
      </header>

      <div className="new-chat-content">
        <label className="new-chat-search">
          <Icon name="search" size={20} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, username, or number" aria-label="Search for a contact" autoFocus />
        </label>

        {!query && <div className="new-chat-actions" aria-label="New chat options">
          {actions.map((action) => <button type="button" className="new-chat-action" key={action.label} onClick={action.label === "New group" ? () => setCreatingGroup(true) : action.label === "Find by username" ? () => setFindingByUsername(true) : action.label === "Find by phone number" ? () => setFindingByPhone(true) : undefined}><span className="new-chat-action-icon"><Icon name={action.icon} size={22} /></span><span>{action.label}</span></button>)}
        </div>}

        <section className="new-chat-contacts" aria-labelledby="contacts-heading">
          <h2 id="contacts-heading">Contacts</h2>
          <div>
            {contacts.map((contact) => <button type="button" className="new-chat-contact" key={contact.id} onClick={() => onStartChat(contact)}>
              <span className="new-chat-avatar">
                {contact.display_name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
              </span>
              <span className="new-chat-contact-name">{contact.display_name}</span>
              <Icon name="person" size={16} className="new-chat-contact-mark" />
            </button>)}
          </div>
          {contactsLoading && <p className="new-chat-empty">Loading contacts…</p>}
          {!contactsLoading && !contacts.length && <p className="new-chat-empty">{query ? "No contacts found" : "No contacts available yet"}</p>}
        </section>
      </div>
    </aside>
  );
}
