"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { ApiUser } from "@/types/messenger";

type GroupCreationFlowProps = {
  onClose: () => void;
  contacts: ApiUser[];
  loading?: boolean;
  onCreate: (name: string, members: number[]) => Promise<void>;
};

export function GroupCreationFlow({ onClose, contacts: availableContacts, loading = false, onCreate }: GroupCreationFlowProps) {
  const [step, setStep] = useState<"members" | "name">("members");
  const [query, setQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [groupName, setGroupName] = useState("");
  const contacts = useMemo(() => availableContacts.filter((contact) => contact.display_name.toLowerCase().includes(query.trim().toLowerCase())), [availableContacts, query]);

  if (step === "name") {
    return <aside className="conversation-sidebar group-flow-sidebar">
      <header className="new-chat-header">
        <button className="icon-button new-chat-back" onClick={() => setStep("members")} aria-label="Back to member selection"><Icon name="back" size={22} /></button>
        <h1>Name this group</h1>
      </header>
      <div className="group-name-content">
        <span className="group-name-avatar"><Icon name="group" size={38} /></span>
        <label className="group-name-field"><input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Group name (required)" aria-label="Group name" autoFocus /></label>
      </div>
      <footer className="group-flow-footer"><button type="button" className="primary-button" disabled={!groupName.trim()} onClick={() => onCreate(groupName.trim(), selectedMembers)}>Create</button></footer>
    </aside>;
  }

  return <aside className="conversation-sidebar group-flow-sidebar">
    <header className="new-chat-header">
      <button className="icon-button new-chat-back" onClick={onClose} aria-label="Back to new chat"><Icon name="back" size={22} /></button>
      <h1>Choose members</h1>
    </header>
    <div className="group-members-content">
      <label className="new-chat-search">
        <Icon name="search" size={20} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, username, or number" aria-label="Search contacts" autoFocus />
      </label>
      <section className="new-chat-contacts group-members" aria-labelledby="group-contacts-heading">
        <h2 id="group-contacts-heading">Contacts</h2>
        {contacts.map((contact) => {
          const selected = selectedMembers.includes(contact.id);
          const initials = contact.display_name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
          return <button type="button" className="new-chat-contact group-member-row" key={contact.id} onClick={() => setSelectedMembers((current) => selected ? current.filter((id) => id !== contact.id) : [...current, contact.id])} aria-pressed={selected}>
            <span className="new-chat-avatar">{initials}</span>
            <span className="new-chat-contact-name">{contact.display_name}</span>
            <span className={`group-member-select ${selected ? "selected" : ""}`} aria-hidden="true">{selected && "✓"}</span>
          </button>;
        })}
        {loading && <p className="new-chat-empty">Loading contacts…</p>}
        {!loading && !contacts.length && <p className="new-chat-empty">{query ? "No contacts found" : "No contacts available yet"}</p>}
      </section>
    </div>
    <footer className="group-flow-footer"><button type="button" className="primary-button" disabled={!selectedMembers.length} onClick={() => setStep("name")}>Next</button></footer>
  </aside>;
}
