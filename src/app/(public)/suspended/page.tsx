"use client";

/* The only screen a suspended member can reach (PRD §19). */

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AuthFrame } from "@/components/common/AuthFrame";
import { FormField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Toaster, toast } from "@/components/ui/toast";
import { appealSchema } from "@/features/auth";
import { settingsService } from "@/features/settings";
import { useHydrated, useStore } from "@/lib/mock-server";

export default function SuspendedPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { suspension, dataExport, deletion } = useStore();
  // Checked on submit only; the message stays until the next submit, and focus stays put.
  const form = useForm({
    resolver: zodResolver(appealSchema),
    defaultValues: { appeal: "" },
    reValidateMode: "onSubmit",
    shouldFocusError: false,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (hydrated && !suspension) router.replace("/feed");
  }, [hydrated, suspension, router]);

  if (!hydrated || !suspension) return <div className="min-h-dvh bg-ground" />;

  return (
    <AuthFrame
      title="Your account is suspended"
      step={4}
      lede={
        <>
          Until <strong className="text-ink">{suspension.until}</strong>. You can still appeal,
          download your data or delete your account.
        </>
      }
    >
      <div className="rounded-[20px] border border-line bg-panel p-5">
        <p className="text-[14px] text-muted">Reason</p>
        <p className="mt-1 text-[16px] font-semibold text-ink">{suspension.reason}</p>
      </div>

      <section aria-labelledby="appeal-h" className="mt-8">
        <h2 id="appeal-h" className="text-[18px] font-semibold">
          Appeal
        </h2>
        {suspension.appealed ? (
          <p role="status" className="mt-2 text-[15px] leading-relaxed text-ink-soft">
            We have your appeal. A person on our team will review it, and we&apos;ll tell you the
            decision here and by email.
          </p>
        ) : (
          <form
            noValidate
            className="mt-3 space-y-4"
            onSubmit={form.handleSubmit(() => settingsService.appeal())}
          >
            <FormField
              form={form}
              name="appeal"
              label="Why this should be reviewed again"
              kind="textarea"
              counterMax={500}
              max={500}
              hardStop
              rows={4}
            />
            <p className="text-[13px] text-muted">One appeal per decision, within 14 days.</p>
            <Button type="submit">Send appeal</Button>
          </form>
        )}
      </section>

      <div className="mt-8 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={dataExport === "preparing"}
          onClick={() => {
            if (dataExport === "ready")
              toast("Your data file is ready. The link works for 7 days.");
            else {
              settingsService.requestExport();
              toast("Preparing your data. We'll email you when it's ready.");
            }
          }}
        >
          {dataExport === "preparing"
            ? "Preparing your data…"
            : dataExport === "ready"
              ? "Download my data"
              : "Download my data"}
        </Button>
        {deletion ? (
          <Button variant="secondary" onClick={() => settingsService.restoreAccount()}>
            Restore my account
          </Button>
        ) : (
          <Button variant="ghost" className="text-danger" onClick={() => setConfirmDelete(true)}>
            Delete my account
          </Button>
        )}
      </div>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete your account?"
        description="You'll have 14 days to change your mind by signing back in. After that your data is removed and your handle is retired."
      >
        <div className="flex gap-2">
          <Button
            variant="danger"
            onClick={() => {
              settingsService.deleteAccount(true);
              setConfirmDelete(false);
            }}
          >
            Delete my account
          </Button>
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
        </div>
      </Dialog>
      <Toaster />
    </AuthFrame>
  );
}
