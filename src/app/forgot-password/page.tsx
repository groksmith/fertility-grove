"use client";

/* The same message shows whether or not an account exists (PRD §4). */

import Link from "next/link";
import { useState } from "react";
import { AuthFrame } from "@/components/AuthFrame";
import { Button, Field, Input } from "@/components/ui";
import { MSG, checks } from "@/lib/rules/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  return (
    <AuthFrame title="Reset your password" step={2} lede="Enter the email you signed up with and we'll send you a link.">
      {sent ? (
        <div role="status">
          <p className="rounded-[20px] border border-line bg-panel p-5 text-[15px] leading-relaxed text-ink">{MSG.resetSent}</p>
          <p className="mt-5 text-[14px] text-muted">
            The link works once and expires in 60 minutes.{" "}
            <Link href="/reset-password" className="font-semibold text-accent underline">Open the link (prototype)</Link>
          </p>
        </div>
      ) : (
        <form
          noValidate
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            const err = checks.email(email);
            setError(err);
            if (!err) setSent(true);
          }}
        >
          <Field label="Email" error={error}>
            <Input type="email" autoComplete="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full">Send reset link</Button>
          <p className="text-center">
            <Link href="/login" className="text-[14px] font-semibold text-accent underline">Back to sign in</Link>
          </p>
        </form>
      )}
    </AuthFrame>
  );
}
