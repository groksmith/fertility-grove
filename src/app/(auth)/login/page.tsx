"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthSplit } from "../AuthSplit";
import { Button, Field, Input } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, completeOnboarding } = useStore();
  const [email, setEmail] = useState("anniewilliamson@gmail.com");
  const [password, setPassword] = useState("••••••••••••");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("That email and password don't match an account.");
      return;
    }
    signIn();
    completeOnboarding({});
    router.push("/dashboard");
  }

  return (
    <AuthSplit headline="Welcome back.">
      <h2 className="serif text-[34px] leading-tight">Log in.</h2>

      <form className="mt-9 flex flex-1 flex-col" onSubmit={submit} noValidate>
        <div className="space-y-5">
          <Field label="Email">
            <Input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 !max-w-[498px]"
            />
          </Field>
          <Field label="Password" error={error}>
            <Input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 !max-w-[498px]"
            />
          </Field>
        </div>

        <p className="mt-3 text-[13.5px]">
          <Link
            href="/help"
            className="text-muted underline underline-offset-2 hover:text-ink"
          >
            Forgot your password?
          </Link>
        </p>

        <div className="mt-auto pt-12">
          <p className="text-[14px]">
            New here?{" "}
            <Link href="/signup" className="font-medium underline underline-offset-2">
              Create a free account
            </Link>
          </p>
          <div className="mt-8 flex justify-end">
            <Button
              type="submit"
              size="lg"
              className="!rounded-[10px] !bg-[#3D3D3D] !text-white"
            >
              Log In
            </Button>
          </div>
        </div>
      </form>
    </AuthSplit>
  );
}
