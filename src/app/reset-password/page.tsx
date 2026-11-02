"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFrame } from "@/components/AuthFrame";
import { Button, Field, PasswordInput } from "@/components/ui";
import { act, useStore } from "@/lib/store";
import { MSG } from "@/lib/rules/validation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const expired = useStore((s) => s.linkExpired);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  if (expired) {
    return (
      <AuthFrame title="This link has expired" step={2} lede={MSG.linkExpired}>
        <Link href="/forgot-password" className="press inline-flex h-11 items-center rounded-full bg-accent px-5 text-[15px] font-semibold text-white">
          Request a new link
        </Link>
      </AuthFrame>
    );
  }

  if (done) {
    return (
      <AuthFrame title="Password changed" step={6} lede="You've been signed out everywhere else. Sign in with your new password.">
        <Button onClick={() => router.push("/login")}>Sign in</Button>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title="Choose a new password" step={2}>
      <form
        noValidate
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          const r = act.auth.resetPassword(pw, confirm);
          if (r.ok) setDone(true);
          else setErrs(r.errs ?? {});
        }}
      >
        <Field label="New password" hint="8 to 64 characters." error={errs.password}>
          <PasswordInput autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <Field label="Confirm new password" error={errs.confirm}>
          <PasswordInput autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <Button type="submit" className="w-full">Save new password</Button>
      </form>
    </AuthFrame>
  );
}
