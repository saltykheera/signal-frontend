"use client";

import { type ClipboardEvent, type KeyboardEvent, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { SignalMark } from "@/components/ui/SignalMark";

type VerificationPageProps = {
  phone: string;
  onBack: () => void;
  onVerify: (otp: string) => Promise<void>;
  busy?: boolean;
  error?: string | null;
};

export function VerificationPage({ phone, onBack, onVerify, busy = false, error }: VerificationPageProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const complete = otp.every(Boolean);
  const displayPhone = phone ? `+91 ${phone.replace(/^\+91/, "")}` : "+91 ••••• •••••";

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

  return <main className="onboarding-shell">
    <div className="onboarding-card otp-card">
      <button className="icon-button back-auth" onClick={onBack} aria-label="Back to phone number"><Icon name="back" /></button>
      <SignalMark />
      <h1>Enter the code</h1>
      <p>We sent a 6-digit verification code to <strong>{displayPhone}</strong>.</p>
      <div className="otp-row" onPaste={pasteOtp}>{otp.map((digit, index) => <input key={index} ref={(node) => { otpRefs.current[index] = node; }} value={digit} onChange={(event) => updateOtp(index, event.target.value)} onKeyDown={(event) => otpKeyDown(index, event)} inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} maxLength={1} aria-label={`Digit ${index + 1}`} autoFocus={index === 0} />)}</div>
      <button className="text-button" type="button" onClick={() => setOtp(["", "", "", "", "", ""])}>Didn’t get a code? Resend</button>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="auth-actions"><button className="primary-button" disabled={!complete || busy} onClick={() => complete && void onVerify(otp.join(""))}>{busy ? "Verifying…" : "Verify"}</button></div>
    </div>
  </main>;
}
