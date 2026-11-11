"use client";

/* Deletion is pending (PRD §4): 14 days to change your mind. */

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthFrame } from "@/components/AuthFrame";
import { Button } from "@/components/ui";
import { act, useHydrated, useStore } from "@/lib/store";

export default function RestorePage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const deletion = useStore((s) => s.deletion);

  useEffect(() => {
    if (hydrated && !deletion) router.replace("/login");
  }, [hydrated, deletion, router]);

  if (!hydrated || !deletion) return <div className="min-h-dvh bg-ground" />;

  return (
    <AuthFrame
      title="Your account will be deleted"
      step={1}
      lede={<>In <strong className="text-ink">{deletion.daysLeft} days</strong>. Until then your profile, posts and shared items are hidden, and nobody can message you.</>}
    >
      <p className="text-[15px] leading-relaxed text-ink-soft">
        {deletion.deletePosts
          ? "Your posts and comments will be removed too. Replies from others stay under “This post was deleted”."
          : "Your posts and comments will stay, shown as from “Deleted member”."}
      </p>
      <div className="mt-7 flex flex-wrap gap-2">
        <Button
          onClick={() => {
            act.settings.restoreAccount();
            router.push("/feed");
          }}
        >
          Restore my account
        </Button>
        <Button variant="ghost" onClick={() => router.push("/")}>
          Keep it scheduled
        </Button>
      </div>
    </AuthFrame>
  );
}
