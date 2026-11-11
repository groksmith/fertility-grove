"use client";

/* Sign in (PRD §4): Google or email. The email error never says which field
   was wrong; five misses in 15 minutes pause sign-in. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFrame, GoogleMark } from "@/components/AuthFrame";
import { Button, Field, Input, PasswordInput, Toggle } from "@/components/ui";
import { act } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keep, setKeep] = useState(false);
  const [error, setError] = useState<string>();

  return (
    <AuthFrame
      title="Welcome back"
      step={7}
      lede="Sign in to your grove."
      footer={
        <p>
          New here? <Link href="/signup" className="font-semibold text-accent underline">Create an account</Link>
        </p>
      }
    >
      <Button
        variant="secondary"
        className="w-full"
        onClick={() => {
          act.auth.signInWithGoogle(keep);
          router.push("/feed");
        }}
      >
        <GoogleMark /> Continue with Google
      </Button>
      <div className="my-6 flex items-center gap-3 text-[13px] text-muted" aria-hidden>
        <span className="h-px flex-1 bg-line-strong" /> or with email <span className="h-px flex-1 bg-line-strong" />
      </div>
      <form
        noValidate
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          const r = act.auth.signIn(email, password, keep);
          if (!r.ok) setError(r.error);
          else router.push("/feed");
        }}
      >
        {error && (
          <p role="alert" className="rounded-[14px] bg-danger-soft px-4 py-3 text-[14px] font-semibold text-danger">
            {error}
          </p>
        )}
        <Field label="Email">
          <Input type="email" autoComplete="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <PasswordInput autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Toggle checked={keep} onChange={setKeep} label="Keep me signed in" description="For 30 days on this device. Leave off on a shared computer." />
        <Button type="submit" className="w-full">
          Sign in
        </Button>
        <p className="text-center">
          <Link href="/forgot-password" className="text-[14px] font-semibold text-accent underline">
            Forgot your password?
          </Link>
        </p>
      </form>

    </AuthFrame>
  );
}
