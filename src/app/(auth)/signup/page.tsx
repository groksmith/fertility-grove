"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthSplit } from "../AuthSplit";
import { Button, Field, Input } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function SignUpPage() {
  const router = useRouter();
  const { signIn } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      next.email = "Enter a valid email address.";
    if (password.length < 12)
      next.password = "Use at least 12 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;
    signIn(email);
    router.push("/onboarding");
  }

  return (
    <AuthSplit headline="Welcome to Fertility Grove!">
      <h2 className="serif text-[34px] leading-tight">Create a free account.</h2>

      <form className="mt-9 flex flex-1 flex-col" onSubmit={submit} noValidate>
        <div className="space-y-5">
          <Field label="Email" error={errors.email}>
            <Input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 !max-w-[498px]"
            />
          </Field>
          <Field label="Password" error={errors.password}>
            <Input
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 !max-w-[498px]"
            />
          </Field>
        </div>

        <div className="my-8 flex items-center gap-4">
          <span className="h-px flex-1 bg-line-strong" />
          <span className="text-[13px] text-muted">OR</span>
          <span className="h-px flex-1 bg-line-strong" />
        </div>

        <button
          type="button"
          onClick={() => {
            signIn("annie.williamson@gmail.com");
            router.push("/onboarding");
          }}
          className="mx-auto flex h-12 items-center gap-3 rounded-[10px] border border-line-strong px-7 text-[15px] font-medium transition hover:bg-surface"
        >
          <GoogleMark />
          Sign up with Google
        </button>

        <div className="mt-auto pt-12 text-[14px] text-ink">
          <p>
            Already have an account?{" "}
            <Link href="/login" className="font-medium underline underline-offset-2">
              Log In
            </Link>
          </p>
          <p className="mt-3 text-[13.5px] text-muted">
            Just looking around?{" "}
            <Link
              href="/demo"
              className="font-medium text-ink underline underline-offset-2"
            >
              Explore the prototype
            </Link>
          </p>
          <p className="mt-4 leading-relaxed">
            By signing up, I am agreeing to Fertility Grove&rsquo;s{" "}
            <Link href="/help" className="font-medium underline underline-offset-2">
              Terms and Conditions
            </Link>{" "}
            and{" "}
            <Link href="/help" className="font-medium underline underline-offset-2">
              Privacy Policy.
            </Link>
          </p>
          <div className="mt-8 flex justify-end">
            <Button
              type="submit"
              size="lg"
              className="!rounded-[10px] !bg-[#3D3D3D] !text-white"
            >
              Create Account
            </Button>
          </div>
        </div>
      </form>
    </AuthSplit>
  );
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#4285F4"
        d="M45 24c0-1.6-.1-2.7-.4-4H24v7.5h12c-.2 2-1.5 5-4.4 7l6.7 5.2C42.2 36 45 30.6 45 24Z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.4c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8 40.9 15.4 46 24 46Z"
      />
      <path
        fill="#FBBC05"
        d="M11.5 28.4A13.3 13.3 0 0 1 10.8 24c0-1.5.3-3 .7-4.4l-7.1-5.5A22 22 0 0 0 2 24c0 3.5.8 6.9 2.4 9.9l7.1-5.5Z"
      />
      <path
        fill="#EA4335"
        d="M24 10.5c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 4.3 29.9 2 24 2 15.4 2 8 7.1 4.4 14.1l7.1 5.5C13.3 14.3 18.2 10.5 24 10.5Z"
      />
    </svg>
  );
}
