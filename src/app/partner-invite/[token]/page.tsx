"use client";

/* The partner invite page (PRD §7): the member's first name, their note, and
   Accept invite. The note shows only here, never in the email. */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Spot } from "@/components/art/Scenes";
import { AuthFrame } from "@/components/AuthFrame";
import { Button } from "@/components/ui";
import { act } from "@/lib/store";
import { MSG } from "@/lib/rules/validation";

export default function PartnerInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  if (token === "expired") {
    return (
      <AuthFrame title="This invite has expired" step={5} lede={MSG.inviteExpired}>
        <Link href="/help" className="press inline-flex h-11 items-center rounded-full px-5 text-[15px] font-semibold text-ink hover:bg-raised">
          How partner invites work
        </Link>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title="Annie invited you"
      step={8}
      lede="Annie would like you to join Fertility Grove as their partner. You'll have your own private account and a community for partners."
      footer={
        <p>
          Already have an account? <Link href="/login" className="font-semibold text-accent underline">Sign in to accept</Link>
        </p>
      }
    >
      <figure className="rounded-[20px] border border-line bg-panel p-5">
        <Spot kind="seeds" size={120} />
        <blockquote className="mt-3 text-[16px] leading-relaxed text-ink">
          “I&apos;ve found people here who get it. I&apos;d love for you to have that too, and for us to keep our appointment questions in one place.”
        </blockquote>
        <figcaption className="mt-2 text-[14px] text-muted">A note from Annie</figcaption>
      </figure>
      <ul className="mt-6 space-y-2 text-[15px] leading-relaxed text-ink-soft">
        <li>Annie never sees your posts, messages or handle.</li>
        <li>You choose what to share in your family space, item by item.</li>
      </ul>
      <Button
        className="mt-7"
        onClick={() => {
          act.auth.arriveWithInvite("partner");
          router.push("/signup");
        }}
      >
        Accept invite
      </Button>
    </AuthFrame>
  );
}
