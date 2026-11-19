"use client";

/* Sign in (PRD §4): Google or email. The email error never says which field
   was wrong; five misses in 15 minutes pause sign-in. */

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { AuthFrame, GoogleMark } from "@/components/common/AuthFrame";
import { FormField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/switch";
import { authService, signInSchema } from "@/features/auth";

export default function LoginPage() {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", keep: false },
  });
  const error = form.formState.errors.root?.message;

  return (
    <AuthFrame
      title="Welcome back"
      step={7}
      lede="Sign in to your grove."
      footer={
        <p>
          New here?{" "}
          <Link href="/signup" className="font-semibold text-accent underline">
            Create an account
          </Link>
        </p>
      }
    >
      <Button
        variant="secondary"
        className="w-full"
        onClick={() => {
          authService.signInWithGoogle(form.getValues("keep"));
          router.push("/feed");
        }}
      >
        <GoogleMark /> Continue with Google
      </Button>
      <div className="my-6 flex items-center gap-3 text-[13px] text-muted" aria-hidden>
        <span className="h-px flex-1 bg-line-strong" /> or with email{" "}
        <span className="h-px flex-1 bg-line-strong" />
      </div>
      <form
        noValidate
        className="space-y-5"
        onSubmit={form.handleSubmit(({ email, password, keep }) => {
          const r = authService.signIn(email, password, keep);
          if (!r.ok) form.setError("root", { message: r.error });
          else router.push("/feed");
        })}
      >
        {error && (
          <p
            role="alert"
            className="rounded-[14px] bg-danger-soft px-4 py-3 text-[14px] font-semibold text-danger"
          >
            {error}
          </p>
        )}
        <FormField
          form={form}
          name="email"
          label="Email"
          kind="email"
          autoComplete="email"
          autoCapitalize="none"
        />
        <FormField
          form={form}
          name="password"
          label="Password"
          kind="password"
          autoComplete="current-password"
        />
        <Controller
          control={form.control}
          name="keep"
          render={({ field }) => (
            <Toggle
              checked={field.value}
              onChange={field.onChange}
              label="Keep me signed in"
              description="For 30 days on this device. Leave off on a shared computer."
            />
          )}
        />
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
