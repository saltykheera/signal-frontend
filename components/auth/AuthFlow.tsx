"use client";

import { useState } from "react";
import type { AuthStep } from "@/types/messenger";
import { PhoneLoginPage } from "@/components/auth/PhoneLoginPage";
import { ProfileSetupPage } from "@/components/auth/ProfileSetupPage";
import { VerificationPage } from "@/components/auth/VerificationPage";

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

  async function requestOtp(phoneNumber: string) {
    setPhone(phoneNumber);
    await onRequestOtp(phoneNumber);
  }

  if (step === "profile") return <ProfileSetupPage onBack={() => setStep("otp")} onComplete={onComplete} busy={busy} error={error} />;
  if (step === "otp") return <VerificationPage phone={phone} onBack={() => setStep("phone")} onVerify={onVerify} busy={busy} error={error} />;
  return <PhoneLoginPage initialPhone={phone} onContinue={requestOtp} busy={busy} error={error} />;
}
