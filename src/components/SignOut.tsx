"use client";

/* Sign out, iOS style: a short confirmation first (PRD §4). The same dialog
   serves the app's account menu, the phone menu and the onboarding header.
   Unsaved changes ask first; confirming signs out this device only and opens
   the sign-in screen. */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestLeave } from "@/components/UnsavedGuard";
import { logout } from "@/lib/api";
import { Button, Dialog } from "./ui";

export function useSignOut() {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const ask = () => requestLeave(() => setConfirm(true));
  const ui = (
    <Dialog
      open={confirm}
      onClose={() => setConfirm(false)}
      title="Sign out of Fertility Grove?"
      description="You can sign back in any time with your email or Google."
    >
      <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
        <Button
          variant="danger"
          onClick={() => {
            setConfirm(false);
            logout();
            router.replace("/login");
          }}
        >
          Sign out
        </Button>
        <Button variant="ghost" onClick={() => setConfirm(false)}>
          Cancel
        </Button>
      </div>
    </Dialog>
  );
  return { ask, ui };
}
