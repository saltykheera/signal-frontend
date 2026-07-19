"use client";

import { type FormEvent, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { ApiUser } from "@/types/messenger";

type UsernameLookupScreenProps = {
  onClose: () => void;
  onFind: (query: string) => Promise<ApiUser[]>;
  onSelect: (user: ApiUser) => Promise<void>;
};

export function UsernameLookupScreen({ onClose, onFind, onSelect }: UsernameLookupScreenProps) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim()) return;
    setBusy(true); setError("");
    try {
      const users = await onFind(username.trim());
      const exact = users.find((user) => user.username?.toLowerCase() === username.trim().toLowerCase()) || users[0];
      if (!exact) setError("No Signal user was found with that username.");
      else await onSelect(exact);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Search failed."); }
    finally { setBusy(false); }
  }

  return <aside className="conversation-sidebar username-lookup-sidebar">
    <header className="new-chat-header">
      <button className="icon-button new-chat-back" onClick={onClose} aria-label="Back to new chat"><Icon name="back" size={22} /></button>
      <h1>Find by username</h1>
    </header>
    <form id="username-lookup" className="username-lookup-content" onSubmit={submit}>
      <label className="username-lookup-field"><input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" aria-label="Username" autoFocus /></label>
      <p>Enter a username followed by a dot and its set of numbers.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
    <footer className="group-flow-footer"><button type="submit" form="username-lookup" className="primary-button" disabled={!username.trim() || busy}>{busy ? "Finding…" : "Next"}</button></footer>
  </aside>;
}
