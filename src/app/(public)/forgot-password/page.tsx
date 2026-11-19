"use client";

/* The same message shows whether or not an account exists (PRD §4). */

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AuthFrame } from "@/components/common/AuthFrame";
import { FormField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { forgotPasswordSchema } from "@/features/auth";
import { MSG } from "@/lib/rules/validation";

export default function ForgotPasswordPage() {
  // Checked on submit only; the message stays until the next submit, and focus stays put.
  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    reValidateMode: "onSubmit",
    shouldFocusError: false,
  });
  const [sent, setSent] = useState(false);
  return (
    <AuthFrame
      title="Reset your password"
      step={2}
      lede="Enter the email you signed up with and we'll send you a link."
    >
      {sent ? (
        <div role="status">
          <p className="rounded-[20px] border border-line bg-panel p-5 text-[15px] leading-relaxed text-ink">
            {MSG.resetSent}
          </p>
          <p className="mt-5 text-[14px] text-muted">
            The link works once and expires in 60 minutes.{" "}
            <Link href="/reset-password" className="font-semibold text-accent underline">
              Open the link (prototype)
            </Link>
          </p>
        </div>
      ) : (
        <form noValidate className="space-y-5" onSubmit={form.handleSubmit(() => setSent(true))}>
          <FormField
            form={form}
            name="email"
            label="Email"
            kind="email"
            autoComplete="email"
            autoCapitalize="none"
          />
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
          <p className="text-center">
            <Link href="/login" className="text-[14px] font-semibold text-accent underline">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthFrame>
  );
}
