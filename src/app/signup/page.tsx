"use client";

/* Create account (PRD §4): beta invite gate, the paused state, then Google or
   email. Email sign-ups land on "Check your email" and onboard straight away;
   a duplicate email sees exactly the same screen. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFrame, GoogleMark } from "@/components/AuthFrame";
import { Button, Checkbox, Field, Input, PasswordInput, Toggle } from "@/components/ui";
import { act, useHydrated, useStore } from "@/lib/store";
import { MSG, checks } from "@/lib/rules/validation";

type SignUpResult = { ok: boolean; error?: string; errs?: Record<string, string>; duplicate?: boolean };

export default function SignupPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { hasInvite, signupsPaused, invitedBy } = useStore();
  const [mode, setMode] = useState<"choose" | "google">("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [check, setCheck] = useState<{ email: string; duplicate: boolean } | null>(null);
  const [waitEmail, setWaitEmail] = useState("");
  const [waitErr, setWaitErr] = useState<string>();
  const [waitDone, setWaitDone] = useState(false);

  const submit = (google: boolean) => {
    const r = act.auth.signUp({ email, password, adult, terms, google }) as SignUpResult;
    if (!r.ok) {
      setErrs(r.errs ?? {});
      return;
    }
    if (google) {
      router.push("/onboarding/1");
      return;
    }
    setCheck({ email: email.trim(), duplicate: !!r.duplicate });
  };

  if (!hydrated) return <div className="min-h-dvh bg-ground" />;

  if (check) {
    return (
      <AuthFrame title="Check your email" step={3} lede={<>We sent a confirmation link to <strong className="text-ink">{check.email}</strong>. It works once and expires in 60 minutes.</>}>
        <p className="text-[15px] leading-relaxed text-ink-soft">
          You can start setting up now, and post, comment and message once you open the link.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => router.push(check.duplicate ? "/login" : "/onboarding/1")}>Continue</Button>
          <Button variant="ghost" onClick={() => act.auth.resendLink()}>
            Resend link
          </Button>
        </div>
      </AuthFrame>
    );
  }

  if (!hasInvite) {
    return (
      <AuthFrame title="Invite-only for now" step={5} lede={MSG.inviteOnly}>
        <p className="text-[15px] leading-relaxed text-ink-soft">
          Every member has a personal invite link on their profile. If a clinic gave you a card or a link, open it on this device.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/login" className="press inline-flex h-11 items-center rounded-full bg-accent px-5 text-[15px] font-semibold text-white">
            I already have an account
          </Link>
          <Link href="/help" className="press inline-flex h-11 items-center rounded-full px-5 text-[15px] font-semibold text-ink hover:bg-raised">
            How invites work
          </Link>
        </div>
      </AuthFrame>
    );
  }

  if (signupsPaused) {
    return (
      <AuthFrame title="Sign-ups are paused" step={4} lede={MSG.paused}>
        {waitDone ? (
          <p role="status" className="rounded-[20px] border border-line bg-panel p-5 text-[15px] leading-relaxed text-ink">
            Thank you. We&apos;ll email {waitEmail} as soon as sign-ups reopen.
          </p>
        ) : (
          <form
            noValidate
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const err = waitEmail ? checks.email(waitEmail) : undefined;
              setWaitErr(err);
              if (!err && waitEmail) setWaitDone(true);
            }}
          >
            <Field label="Your email" optional error={waitErr}>
              <Input type="email" autoComplete="email" value={waitEmail} onChange={(e) => setWaitEmail(e.target.value)} />
            </Field>
            <Button type="submit">Let me know</Button>
          </form>
        )}
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title="Create your account"
      step={8}
      lede={invitedBy ? `${invitedBy} invited you to Fertility Grove. Your account is your own: ${invitedBy} won't see your posts or messages.` : "A private community for people going through infertility, and their partners."}
      footer={
        <p>
          Already a member? <Link href="/login" className="font-semibold text-accent underline">Sign in</Link>
        </p>
      }
    >
      {mode === "google" ? (
        <form
          noValidate
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            submit(true);
          }}
        >
          <p className="rounded-[14px] bg-panel px-4 py-3 text-[15px] text-ink-soft">
            Signing up with Google. Your email is confirmed automatically.
          </p>
          <Toggle checked={adult} onChange={setAdult} label="I am 18 or older" description="Fertility Grove is for adults only." error={errs.adult} />
          <Toggle
            checked={terms}
            onChange={setTerms}
            label="I agree to the Terms and Privacy Policy"
            description={
              <>
                Read the <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
              </>
            }
            error={errs.terms}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Continue</Button>
            <Button variant="ghost" onClick={() => { setMode("choose"); setErrs({}); }}>
              Use email instead
            </Button>
          </div>
        </form>
      ) : (
        <>
          <Button variant="secondary" className="w-full" onClick={() => { setMode("google"); setErrs({}); }}>
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
              submit(false);
            }}
          >
            <Field label="Email" error={errs.email}>
              <Input
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => email && setErrs((x) => ({ ...x, email: checks.email(email) ?? "" }))}
              />
            </Field>
            <Field label="Password" hint="8 to 64 characters. Avoid one you've used elsewhere." error={errs.password}>
              <PasswordInput autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <Checkbox checked={adult} onChange={setAdult} error={errs.adult}>
              I am 18 or older
            </Checkbox>
            <Checkbox checked={terms} onChange={setTerms} error={errs.terms}>
              I agree to the <Link href="/terms" className="font-semibold underline">Terms</Link> and{" "}
              <Link href="/privacy" className="font-semibold underline">Privacy Policy</Link>
            </Checkbox>
            <Button type="submit" className="w-full">
              Create account
            </Button>
          </form>
        </>
      )}
    </AuthFrame>
  );
}
