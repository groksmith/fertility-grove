"use client";

/* Opening the confirmation link (PRD §4). It works once, within 60 minutes. */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthFrame } from "@/components/AuthFrame";
import { Button } from "@/components/ui";
import { act, useHydrated, useStore } from "@/lib/store";
import { MSG } from "@/lib/rules/validation";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { me, step, signedIn } = useStore();
  const [state, setState] = useState<"working" | "done" | "expired">("working");
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    const r = act.auth.confirmEmail();
    // The link's outcome is decided once, on arrival.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(r.ok ? "done" : "expired");
  }, [hydrated]);

  const next = !signedIn ? "/login" : step < 9 ? `/onboarding/${step}` : "/feed";

  if (state === "expired") {
    return (
      <AuthFrame title="This link has expired" step={3} lede={MSG.linkExpired}>
        {resent ? (
          <p role="status" className="rounded-[20px] border border-line bg-panel p-5 text-[15px] text-ink">
            We sent a new link to {me.email || "your email"}. It works once and expires in 60 minutes.
          </p>
        ) : (
          <Button
            onClick={() => {
              act.auth.resendLink();
              setResent(true);
            }}
          >
            Send a new link
          </Button>
        )}
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title={state === "done" ? "Your email is confirmed" : "Confirming…"}
      step={8}
      lede={state === "done" ? "Posting, commenting, voting and messaging are now open to you." : undefined}
    >
      {state === "done" && <Button onClick={() => router.push(next)}>Continue</Button>}
    </AuthFrame>
  );
}
