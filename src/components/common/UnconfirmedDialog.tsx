"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { authService } from "@/features/auth";
import { useStore } from "@/lib/mock-server";

/** Shown when an unconfirmed member tries something that needs a confirmed email. */
export function UnconfirmedDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const email = useStore((s) => s.me.email);
  const [sent, setSent] = useState(false);
  return (
    <Dialog open={open} onClose={onClose} title="Confirm your email first">
      <p className="text-[15px] leading-relaxed text-ink-soft">
        Confirm your email to do this. We sent a link to{" "}
        <strong className="text-ink">{email}</strong>.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            authService.resendLink();
            setSent(true);
          }}
        >
          {sent ? "Link sent again" : "Resend link"}
        </Button>
        <Link
          href="/confirm-email"
          className="press inline-flex h-11 items-center rounded-full px-5 text-[15px] font-semibold text-accent hover:bg-raised"
        >
          I have the link
        </Link>
      </div>
    </Dialog>
  );
}
