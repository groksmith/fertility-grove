"use client";

/* Every signed-in screen. The gate sends people where their account state
   says they belong: suspended → /suspended, deleting → /restore, signed out →
   /login (or a group's or post's public page, when guests may read it), and
   anyone mid-onboarding back to the next unfinished screen. */

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { LevelUp } from "@/components/LevelUp";
import { publicGroup, publicPost } from "@/lib/api";
import { useHydrated, useStore, type State } from "@/lib/store";

/** Signed out on a group or post that guests may read: show its public page
    instead of asking them to sign in (PRD v1.2 §10). */
function guestPage(s: State, path: string) {
  const [, kind, id] = path.split("/");
  if (kind === "groups" && id && publicGroup(s, id)) return `/community/${id}`;
  if (kind === "posts" && id && id !== "new" && publicPost(s, id)) return `/p/${id}`;
  return "/login";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const path = usePathname();
  const s = useStore();
  // Signing out here always opens sign-in; only arriving signed out finds a public page.
  const [wasSignedIn, setWasSignedIn] = useState(false);
  if (hydrated && s.signedIn && !wasSignedIn) setWasSignedIn(true);

  const target = s.suspension
    ? "/suspended"
    : s.deletion
      ? "/restore"
      : !s.signedIn
        ? wasSignedIn
          ? "/login"
          : guestPage(s, path)
        : s.step < 9
          ? `/onboarding/${s.step}`
          : null;

  useEffect(() => {
    if (hydrated && target) router.replace(target);
  }, [hydrated, target, router]);

  if (!hydrated || target) {
    return <div className="min-h-dvh bg-ground" aria-busy="true" />;
  }

  return (
    <AppShell>
      {children}
      <LevelUp />
    </AppShell>
  );
}
