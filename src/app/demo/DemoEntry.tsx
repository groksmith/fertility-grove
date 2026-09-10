"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

/**
 * Prototype convenience entry point: signs a demo member in and drops straight
 * into the product. `/demo?next=/community` lands on a specific screen.
 */
export function DemoEntry({ next = "/dashboard" }: { next?: string }) {
  const router = useRouter();
  const { completeOnboarding } = useStore();

  useEffect(() => {
    completeOnboarding({});
    router.replace(next.startsWith("/") ? next : "/dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid min-h-screen place-items-center">
      <p className="serif text-[22px] text-muted">Opening Fertility Grove…</p>
    </div>
  );
}
