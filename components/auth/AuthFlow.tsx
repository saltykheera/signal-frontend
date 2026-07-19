"use client";
/* eslint-disable @next/next/no-img-element -- previews use local blob URLs */

import { type ClipboardEvent, type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import type { AuthStep } from "@/types/messenger";
import { Icon } from "@/components/ui/Icon";
import { SignalMark } from "@/components/ui/SignalMark";

type AuthFlowProps = {
  step: AuthStep;
  setStep: (step: AuthStep) => void;
  onRequestOtp: (phone: string) => Promise<void>;
  onVerify: (otp: string) => Promise<void>;
  onComplete: (name: string, avatar: File | null) => Promise<void>;
  busy?: boolean;
  error?: string | null;
};

export function AuthFlow({ step, setStep, onRequestOtp, onVerify, onComplete, busy = false, error }: AuthFlowProps) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const avatarPreview = useMemo(() => avatar ? URL.createObjectURL(avatar) : null, [avatar]);
  useEffect(() => () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); }, [avatarPreview]);
  const normalizedPhone = phone.replace(/\D/g, "");
  const displayPhone = `+91 ${normalizedPhone || "••••• •••••"}`;

  async function submitPhone(event: FormEvent) {
    event.preventDefault();
    if (normalizedPhone.length >= 8) await onRequestOtp(`+91${normalizedPhone}`);
  }

  function updateOtp(index: number, value: string) {
    const nextDigit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = nextDigit;
    setOtp(next);
    if (nextDigit && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function otpKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  }

  function pasteOtp(event: ClipboardEvent<HTMLDivElement>) {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (!digits.length) return;
    event.preventDefault();
    setOtp(Array.from({ length: 6 }, (_, index) => digits[index] || ""));
    otpRefs.current[Math.min(digits.length, 6) - 1]?.focus();
  }

  if (step === "profile") {
    const initials = `${firstName[0] || "S"}${lastName[0] || ""}`.toUpperCase();
    return (
      <main className="onboarding-shell">
        <div className="onboarding-card profile-card">
          <button className="icon-button back-auth" onClick={() => setStep("otp")} aria-label="Back to verification"><Icon name="back" /></button>
          <SignalMark />
          <h1>Create your profile</h1>
          <p>This is how you’ll appear to your Signal contacts.</p>
          <div className="profile-avatar" aria-label="Profile initials">{avatarPreview ? <img src={avatarPreview} alt="Profile preview" /> : initials}</div>
          <input ref={avatarInputRef} className="attachment-file-input" type="file" accept="image/*" onChange={(event) => setAvatar(event.target.files?.[0] || null)} />
          <button className="secondary-pill" type="button" onClick={() => avatarInputRef.current?.click()}>{avatar ? "Change photo" : "Add photo"}</button>
          <form className="profile-form" onSubmit={async (event) => { event.preventDefault(); if (firstName.trim()) await onComplete(`${firstName.trim()} ${lastName.trim()}`.trim(), avatar); }}>
            <label className="field-label" htmlFor="first-name">First name</label>
            <input id="first-name" className="text-field" value={firstName} onChange={(event) => setFirstName(event.target.value)} autoFocus maxLength={28} />
            <label className="field-label" htmlFor="last-name">Last name <span>optional</span></label>
            <input id="last-name" className="text-field" value={lastName} onChange={(event) => setLastName(event.target.value)} maxLength={28} />
            <div className="discover-card"><span className="discover-icon"><Icon name="person" /></span><span><strong>Who can find you by number</strong><small>Everyone can see that you use Signal.</small></span><button type="button" className="mini-pill">Change</button></div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="auth-actions"><button className="primary-button" disabled={!firstName.trim() || busy}>{busy ? "Saving…" : "Continue"}</button></div>
          </form>
        </div>
      </main>
    );
  }

  if (step === "otp") {
    const complete = otp.every(Boolean);
    return (
      <main className="onboarding-shell">
        <div className="onboarding-card otp-card">
          <button className="icon-button back-auth" onClick={() => setStep("phone")} aria-label="Back to phone number"><Icon name="back" /></button>
          <SignalMark />
          <h1>Enter the code</h1>
          <p>We sent a 6-digit verification code to <strong>{displayPhone}</strong>.</p>
          <div className="otp-row" onPaste={pasteOtp}>{otp.map((digit, index) => <input key={index} ref={(node) => { otpRefs.current[index] = node; }} value={digit} onChange={(event) => updateOtp(index, event.target.value)} onKeyDown={(event) => otpKeyDown(index, event)} inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} maxLength={1} aria-label={`Digit ${index + 1}`} autoFocus={index === 0} />)}</div>
          <button className="text-button" type="button" onClick={() => setOtp(["", "", "", "", "", ""])}>Didn’t get a code? Resend</button>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="auth-actions"><button className="primary-button" disabled={!complete || busy} onClick={() => complete && onVerify(otp.join(""))}>{busy ? "Verifying…" : "Verify"}</button></div>
        </div>
      </main>
    );
  }

  return (
    <main className="onboarding-shell">
      <form className="onboarding-card phone-card" onSubmit={submitPhone}>
        <SignalMark />
        <h1>Enter your phone number</h1>
        <p>Signal will send an SMS to verify your phone number. Carrier fees may apply.</p>
        <div className="phone-field"><button type="button" className="country-code" aria-label="Country code, India">🇮🇳 <span>+91</span><span className="down-caret">⌄</span></button><span className="field-divider" /><input aria-label="Phone number" placeholder="Phone number" value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^\d\s-]/g, ""))} inputMode="tel" autoFocus /></div>
        <small className="privacy-note">Your phone number is kept private from people who don’t already have it.</small>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="auth-actions"><button className="primary-button" disabled={normalizedPhone.length < 8 || busy}>{busy ? "Sending…" : "Continue"}</button></div>
      </form>
    </main>
  );
}
