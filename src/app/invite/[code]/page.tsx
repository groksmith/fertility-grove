"use client";

/* A beta invite link, /invite/{code}. The code is the member's fixed invite
   code (PRD §10), never their handle, so it keeps working after a handle
   change and never credits whoever takes an old handle. Opening it unlocks
   sign-up on this device. */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AuthFrame } from "@/components/AuthFrame";
import { Button } from "@/components/ui";
import { inviteOwner } from "@/lib/api";
import { act, sel, useStore } from "@/lib/store";

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  // TODO(api): the backend resolves the code to the member who sent it.
  const owner = inviteOwner(useStore(), decodeURIComponent(code ?? ""));
  const from = owner ? sel.displayName(owner) : code && code !== "beta" ? "A member" : "The Fertility Grove team";
  return (
    <AuthFrame
      title="You're invited"
      step={5}
      lede={`${from} invited you to the Fertility Grove beta: a private community for people going through infertility, and their partners.`}
      footer={
        <p>
          Already a member? <Link href="/login" className="font-semibold text-accent underline">Sign in</Link>
        </p>
      }
    >
      <ul className="space-y-2 text-[15px] leading-relaxed text-ink-soft">
        <li>You post under a handle unless you choose otherwise.</li>
        <li>Your health answers are never sold, and there are no ad trackers.</li>
        <li>You can download or delete everything at any time.</li>
      </ul>
      <Button
        className="mt-7"
        onClick={() => {
          act.auth.arriveWithInvite("beta");
          router.push("/signup");
        }}
      >
        Accept and create account
      </Button>
    </AuthFrame>
  );
}
