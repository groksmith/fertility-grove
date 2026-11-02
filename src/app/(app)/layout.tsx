"use client";

/* Every signed-in screen. The gate sends people where their account state
   says they belong: suspended → /suspended, deleting → /restore, signed out →
   /login, and anyone mid-onboarding back to the next unfinished screen. */

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { LevelUp } from "@/components/LevelUp";
import { useHydrated, useStore } from "@/lib/store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const s = useStore();

  const target = s.suspension
    ? "/suspended"
    : s.deletion
      ? "/restore"
      : !s.signedIn
        ? "/login"
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
