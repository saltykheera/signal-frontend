"use client";

import { type FormEvent, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { ApiUser } from "@/types/messenger";

type PhoneNumberLookupScreenProps = {
  onClose: () => void;
  onFind: (query: string) => Promise<ApiUser[]>;
  onSelect: (user: ApiUser) => Promise<void>;
};

export function PhoneNumberLookupScreen({ onClose, onFind, onSelect }: PhoneNumberLookupScreenProps) {
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const digits = phoneNumber.replace(/\D/g, "");
    if (!digits) return;
    setBusy(true); setError("");
    try {
      const phone = `${countryCode}${digits}`;
      const users = await onFind(phone);
      const user = users.find((candidate) => candidate.phone === phone) || users[0];
      if (!user) setError("That phone number is not registered on Signal.");
      else await onSelect(user);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Search failed."); }
    finally { setBusy(false); }
  }

  return <aside className="conversation-sidebar phone-lookup-sidebar">
    <header className="new-chat-header">
      <button className="icon-button new-chat-back" onClick={onClose} aria-label="Back to new chat"><Icon name="back" size={22} /></button>
      <h1>Find by phone number</h1>
    </header>
    <form id="phone-lookup" className="phone-lookup-content" onSubmit={submit}>
      <label className="phone-country-field"><span>Country code</span><select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} aria-label="Country code"><option value="+91">+91</option><option value="+1">+1</option><option value="+44">+44</option></select><Icon name="chevronDown" size={16} className="phone-country-chevron" /></label>
      <label className="phone-number-field"><input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="Phone number" inputMode="tel" aria-label="Phone number" autoFocus /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
    <footer className="group-flow-footer"><button type="submit" form="phone-lookup" className="primary-button" disabled={!phoneNumber.replace(/\D/g, "") || busy}>{busy ? "Finding…" : "Next"}</button></footer>
  </aside>;
}
