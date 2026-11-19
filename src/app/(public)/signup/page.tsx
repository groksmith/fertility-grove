"use client";

/* Create account (PRD §4): beta invite gate, the paused state, then Google or
   email. Email sign-ups land on "Check your email" and onboard straight away;
   a duplicate email sees exactly the same screen. */

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { AuthFrame, GoogleMark } from "@/components/common/AuthFrame";
import { FormField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/switch";
import { authService, type SignUpInput, signUpSchema, signUpWaitlistSchema } from "@/features/auth";
import { useHydrated, useStore } from "@/lib/mock-server";
import { MSG } from "@/lib/rules/validation";

type SignUpResult = {
  ok: boolean;
  error?: string;
  errs?: Partial<Record<keyof SignUpInput, string>>;
  duplicate?: boolean;
};

export default function SignupPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { hasInvite, signupsPaused, invitedBy } = useStore();
  const [mode, setMode] = useState<"choose" | "google">("choose");
  /* One form behind both sign-up modes, so the answers carry over when switching; `google` says
     which mode is submitting. Checked on submit only: messages stay until the next submit (or a
     mode switch clears them), and focus stays put. Leaving a filled email re-checks just it. */
  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", adult: false, terms: false, google: false },
    reValidateMode: "onSubmit",
    shouldFocusError: false,
  });
  const [check, setCheck] = useState<{ email: string; duplicate: boolean } | null>(null);
  // The paused-state waitlist: an optional email, checked on submit when given.
  const waitForm = useForm({
    resolver: zodResolver(signUpWaitlistSchema),
    defaultValues: { email: "" },
    reValidateMode: "onSubmit",
    shouldFocusError: false,
  });
  const [waitDone, setWaitDone] = useState(false);

  const switchMode = (next: "choose" | "google") => {
    setMode(next);
    form.setValue("google", next === "google");
    form.clearErrors();
  };

  const submit = form.handleSubmit((values) => {
    const r = authService.signUp(values) as SignUpResult;
    if (!r.ok) {
      for (const [name, message] of Object.entries(r.errs ?? {}))
        form.setError(name as keyof SignUpInput, { message });
      return;
    }
    if (values.google) {
      router.push("/onboarding/1");
      return;
    }
    setCheck({ email: values.email.trim(), duplicate: !!r.duplicate });
  });

  if (!hydrated) return <div className="min-h-dvh bg-ground" />;

  if (check) {
    return (
      <AuthFrame
        title="Check your email"
        step={3}
        lede={
          <>
            We sent a confirmation link to <strong className="text-ink">{check.email}</strong>. It
            works once and expires in 60 minutes.
          </>
        }
      >
        <p className="text-[15px] leading-relaxed text-ink-soft">
          You can start setting up now, and post, comment and message once you open the link.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => router.push(check.duplicate ? "/login" : "/onboarding/1")}>
            Continue
          </Button>
          <Button variant="ghost" onClick={() => authService.resendLink()}>
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
          Every member has a personal invite link on their profile. If a clinic gave you a card or a
          link, open it on this device.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/login"
            className="press inline-flex h-11 items-center rounded-full bg-accent px-5 text-[15px] font-semibold text-white"
          >
            I already have an account
          </Link>
          <Link
            href="/help"
            className="press inline-flex h-11 items-center rounded-full px-5 text-[15px] font-semibold text-ink hover:bg-raised"
          >
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
          <p
            role="status"
            className="rounded-[20px] border border-line bg-panel p-5 text-[15px] leading-relaxed text-ink"
          >
            Thank you. We&apos;ll email {waitForm.getValues("email")} as soon as sign-ups reopen.
          </p>
        ) : (
          <form
            noValidate
            className="space-y-4"
            onSubmit={waitForm.handleSubmit(({ email }) => {
              if (email) setWaitDone(true);
            })}
          >
            <FormField
              form={waitForm}
              name="email"
              label="Your email"
              optional
              kind="email"
              autoComplete="email"
            />
            <Button type="submit">Let me know</Button>
          </form>
        )}
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title="Create your account"
      lede={
        invitedBy
          ? `${invitedBy} invited you to Fertility Grove. Your account is your own: ${invitedBy} won't see your posts or messages.`
          : "A private community for people going through infertility, and their partners."
      }
      footer={
        <p>
          Already a member?{" "}
          <Link href="/login" className="font-semibold text-accent underline">
            Sign in
          </Link>
        </p>
      }
    >
      {mode === "google" ? (
        <form noValidate className="space-y-5" onSubmit={submit}>
          <p className="rounded-[14px] bg-panel px-4 py-3 text-[15px] text-ink-soft">
            Signing up with Google. Your email is confirmed automatically.
          </p>
          <Controller
            control={form.control}
            name="adult"
            render={({ field, fieldState }) => (
              <Toggle
                checked={field.value}
                onChange={field.onChange}
                label="I am 18 or older"
                description="Fertility Grove is for adults only."
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="terms"
            render={({ field, fieldState }) => (
              <Toggle
                checked={field.value}
                onChange={field.onChange}
                label="I agree to the Terms and Privacy Policy"
                description={
                  <>
                    Read the{" "}
                    <Link href="/terms" className="underline">
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="underline">
                      Privacy Policy
                    </Link>
                    .
                  </>
                }
                error={fieldState.error?.message}
              />
            )}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Continue</Button>
            <Button variant="ghost" onClick={() => switchMode("choose")}>
              Use email instead
            </Button>
          </div>
        </form>
      ) : (
        <>
          <Button variant="secondary" className="w-full" onClick={() => switchMode("google")}>
            <GoogleMark /> Continue with Google
          </Button>
          <div className="my-6 flex items-center gap-3 text-[13px] text-muted" aria-hidden>
            <span className="h-px flex-1 bg-line-strong" /> or with email{" "}
            <span className="h-px flex-1 bg-line-strong" />
          </div>
          <form noValidate className="space-y-5" onSubmit={submit}>
            {/* Controller, not FormField: leaving a filled email re-checks it on the spot. */}
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field label="Email" error={fieldState.error?.message}>
                  <Input
                    ref={field.ref}
                    name={field.name}
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={() => {
                      field.onBlur();
                      if (field.value) void form.trigger("email");
                    }}
                  />
                </Field>
              )}
            />
            <FormField
              form={form}
              name="password"
              label="Password"
              hint="8 to 64 characters. Avoid one you've used elsewhere."
              kind="password"
              autoComplete="new-password"
            />
            <Controller
              control={form.control}
              name="adult"
              render={({ field, fieldState }) => (
                <Checkbox
                  checked={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                >
                  I am 18 or older
                </Checkbox>
              )}
            />
            <Controller
              control={form.control}
              name="terms"
              render={({ field, fieldState }) => (
                <Checkbox
                  checked={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                >
                  I agree to the{" "}
                  <Link href="/terms" className="font-semibold underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-semibold underline">
                    Privacy Policy
                  </Link>
                </Checkbox>
              )}
            />
            <Button type="submit" className="w-full">
              Create account
            </Button>
          </form>
        </>
      )}
    </AuthFrame>
  );
}
