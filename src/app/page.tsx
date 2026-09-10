"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useHydrated, useStore } from "@/lib/store";

export default function Home() {
  const { signedIn, onboarded } = useStore();
  const hydrated = useHydrated();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (signedIn && onboarded) router.replace("/dashboard");
    else if (signedIn) router.replace("/onboarding");
    else router.replace("/signup");
  }, [hydrated, signedIn, onboarded, router]);

  return (
    <div className="grid min-h-screen place-items-center">
      <p className="serif text-[22px] text-muted">Fertility Grove</p>
    </div>
  );
}
