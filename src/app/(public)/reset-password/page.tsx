"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AuthFrame } from "@/components/common/AuthFrame";
import { FormField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { authService, resetPasswordSchema } from "@/features/auth";
import { useStore } from "@/lib/mock-server";
import { MSG } from "@/lib/rules/validation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const expired = useStore((s) => s.linkExpired);
  // Checked on submit only; messages stay until the next submit, and focus stays put.
  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm: "" },
    reValidateMode: "onSubmit",
    shouldFocusError: false,
  });
  const [done, setDone] = useState(false);

  if (expired) {
    return (
      <AuthFrame title="This link has expired" step={2} lede={MSG.linkExpired}>
        <Link
          href="/forgot-password"
          className="press inline-flex h-11 items-center rounded-full bg-accent px-5 text-[15px] font-semibold text-white"
        >
          Request a new link
        </Link>
      </AuthFrame>
    );
  }

  if (done) {
    return (
      <AuthFrame
        title="Password changed"
        step={6}
        lede="You've been signed out everywhere else. Sign in with your new password."
      >
        <Button onClick={() => router.push("/login")}>Sign in</Button>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title="Choose a new password" step={2}>
      <form
        noValidate
        className="space-y-5"
        onSubmit={form.handleSubmit(({ password, confirm }) => {
          const r = authService.resetPassword(password, confirm);
          if (r.ok) setDone(true);
          else {
            for (const [name, message] of Object.entries(r.errs ?? {}))
              form.setError(name as "password" | "confirm", { message });
          }
        })}
      >
        <FormField
          form={form}
          name="password"
          label="New password"
          hint="8 to 64 characters."
          kind="password"
          autoComplete="new-password"
        />
        <FormField
          form={form}
          name="confirm"
          label="Confirm new password"
          kind="password"
          autoComplete="new-password"
        />
        <Button type="submit" className="w-full">
          Save new password
        </Button>
      </form>
    </AuthFrame>
  );
}
