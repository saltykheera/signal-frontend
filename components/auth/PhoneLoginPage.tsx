"use client";

import { type FormEvent, useState } from "react";
import { z } from "zod";
import { SignalMark } from "@/components/ui/SignalMark";

const indianPhoneSchema = z.string()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => /^[6-9]\d{9}$/.test(value), "Enter a valid 10-digit Indian mobile number.");

type PhoneLoginPageProps = {
  initialPhone: string;
  onContinue: (phone: string) => Promise<void>;
  busy?: boolean;
  error?: string | null;
};

export function PhoneLoginPage({ initialPhone, onContinue, busy = false, error }: PhoneLoginPageProps) {
  const [phone, setPhone] = useState(() => initialPhone.replace(/^\+91/, ""));
  const [validationError, setValidationError] = useState<string | null>(null);
  const validation = indianPhoneSchema.safeParse(phone);

  async function submitPhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validation.success) {
      setValidationError(validation.error.issues[0]?.message || "Enter a valid phone number.");
      return;
    }
    setValidationError(null);
    await onContinue(`+91${validation.data}`);
  }

  return <main className="onboarding-shell">
    <form className="onboarding-card phone-card" onSubmit={submitPhone} noValidate>
      <SignalMark />
      <h1>Enter your phone number</h1>
      <p>Signal will send an SMS to verify your phone number. Carrier fees may apply.</p>
      <div className="phone-field"><button type="button" className="country-code" aria-label="Country code, India">🇮🇳 <span>+91</span><span className="down-caret">⌄</span></button><span className="field-divider" /><input aria-label="Phone number" placeholder="Phone number" value={phone} onChange={(event) => { setPhone(event.target.value.replace(/[^\d\s-]/g, "")); setValidationError(null); }} inputMode="tel" autoComplete="tel-national" autoFocus /></div>
      <small className="privacy-note">Your phone number is kept private from people who don’t already have it.</small>
      {(validationError || error) && <p className="form-error" role="alert">{validationError || error}</p>}
      <div className="auth-actions"><button className="primary-button" disabled={!validation.success || busy}>{busy ? "Sending…" : "Continue"}</button></div>
    </form>
  </main>;
}
