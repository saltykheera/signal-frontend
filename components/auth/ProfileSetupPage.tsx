"use client";
/* eslint-disable @next/next/no-img-element -- previews use local blob URLs */

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { SignalMark } from "@/components/ui/SignalMark";

type ProfileSetupPageProps = {
  onBack: () => void;
  onComplete: (name: string, avatar: File | null) => Promise<void>;
  busy?: boolean;
  error?: string | null;
};

export function ProfileSetupPage({ onBack, onComplete, busy = false, error }: ProfileSetupPageProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const avatarPreview = useMemo(() => avatar ? URL.createObjectURL(avatar) : null, [avatar]);
  const initials = `${firstName[0] || "S"}${lastName[0] || ""}`.toUpperCase();

  useEffect(() => () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); }, [avatarPreview]);

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (firstName.trim()) await onComplete(`${firstName.trim()} ${lastName.trim()}`.trim(), avatar);
  }

  return <main className="onboarding-shell">
    <div className="onboarding-card profile-card">
      <button className="icon-button back-auth" onClick={onBack} aria-label="Back to verification"><Icon name="back" /></button>
      <SignalMark />
      <h1>Create your profile</h1>
      <p>This is how you’ll appear to your Signal contacts.</p>
      <div className="profile-avatar" aria-label="Profile initials">{avatarPreview ? <img src={avatarPreview} alt="Profile preview" /> : initials}</div>
      <input ref={avatarInputRef} className="attachment-file-input" type="file" accept="image/*" onChange={(event) => setAvatar(event.target.files?.[0] || null)} />
      <button className="secondary-pill" type="button" onClick={() => avatarInputRef.current?.click()}>{avatar ? "Change photo" : "Add photo"}</button>
      <form className="profile-form" onSubmit={submitProfile}>
        <label className="field-label" htmlFor="first-name">First name</label>
        <input id="first-name" className="text-field" value={firstName} onChange={(event) => setFirstName(event.target.value)} autoFocus maxLength={28} />
        <label className="field-label" htmlFor="last-name">Last name <span>optional</span></label>
        <input id="last-name" className="text-field" value={lastName} onChange={(event) => setLastName(event.target.value)} maxLength={28} />
        <div className="discover-card"><span className="discover-icon"><Icon name="person" /></span><span><strong>Who can find you by number</strong><small>Everyone can see that you use Signal.</small></span><button type="button" className="mini-pill">Change</button></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="auth-actions"><button className="primary-button" disabled={!firstName.trim() || busy}>{busy ? "Saving…" : "Continue"}</button></div>
      </form>
    </div>
  </main>;
}
