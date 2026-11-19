"use client";

/* Report flow (PRD §19) and the hook that turns an action's Result into the
   right response: the confirm-email dialog, a toast, or crisis resources. */

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { UnconfirmedDialog } from "@/components/common/UnconfirmedDialog";
import { CrisisCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Choices } from "@/components/ui/choices";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Toggle } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { REPORT_REASONS } from "@/config/options";
import { reportSchema, socialService } from "@/features/social";
import type { Result } from "@/lib/mock-server";

export function ReportDialog({
  open,
  onClose,
  target,
  what,
  authorId,
}: {
  open: boolean;
  onClose: () => void;
  target: string;
  what: string;
  authorId?: string;
}) {
  // The service checks the report and returns one message at a time; the dialog keeps it until
  // the next submit replaces it or the dialog closes. The details message sits on its field, the
  // rest under the form. Focus stays put.
  const form = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: { reason: [], details: "", block: false },
    shouldFocusError: false,
  });
  const reason = useWatch({ control: form.control, name: "reason" });
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<string>();

  const close = () => {
    onClose();
    form.reset();
    setError(undefined);
    setDone(undefined);
  };

  return (
    <Dialog open={open} onClose={close} title={done ? "Thank you" : `Report this ${what}`}>
      {done ? (
        <div>
          <p className="text-[15px] leading-relaxed text-ink-soft">{done}</p>
          {reason[0] === "Self-harm or crisis concern" && (
            <div className="mt-4">
              <CrisisCard tone="inline" intro="If someone is in danger right now:" />
            </div>
          )}
          <Button className="mt-5" onClick={close} data-autofocus>
            Done
          </Button>
        </div>
      ) : (
        <form
          onSubmit={form.handleSubmit((v) => {
            const r = socialService.report(
              target,
              v.reason[0] ?? "",
              v.details,
              v.block ? authorId : undefined,
            );
            if (!r.ok) setError(r.error);
            else setDone(r.note);
          })}
          className="space-y-5"
        >
          <p className="text-[14px] text-muted">
            Reports are anonymous. The person won&apos;t know it was you.
          </p>
          <Controller
            control={form.control}
            name="reason"
            render={({ field }) => (
              <Choices
                legend="What's wrong?"
                options={REPORT_REASONS}
                value={field.value}
                onChange={field.onChange}
                columns={1}
              />
            )}
          />
          {/* Controller, not FormField: this counter is plain text, not the shared Counter. */}
          <Controller
            control={form.control}
            name="details"
            render={({ field }) => (
              <Field
                label="Details"
                optional={reason[0] !== "Other"}
                error={error === "Tell us a little about what's wrong." ? error : undefined}
                counter={
                  <span className="tabular text-[13px] text-muted">{field.value.length} / 500</span>
                }
              >
                <Textarea
                  ref={field.ref}
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  max={500}
                  hardStop
                  rows={3}
                />
              </Field>
            )}
          />
          {authorId && (
            <Controller
              control={form.control}
              name="block"
              render={({ field }) => (
                <Toggle
                  checked={field.value}
                  onChange={field.onChange}
                  label="Also block this member"
                  description="They won't be able to message you, follow you or see your posts."
                />
              )}
            />
          )}
          {error && error !== "Tell us a little about what's wrong." && (
            <p role="alert" className="text-[13px] font-semibold text-danger">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit">Send report</Button>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

/** Handles an action's Result: confirm-email gate, errors as toasts, and the
 *  crisis card when the text tripped crisis detection. */
export function useResult() {
  const [gate, setGate] = useState(false);
  const [crisis, setCrisis] = useState<"signal" | "high" | null>(null);
  const handle = useCallback((r: Result, success?: string) => {
    if (!r.ok) {
      if (r.code === "unconfirmed") setGate(true);
      else toast(r.error);
      return false;
    }
    if (r.crisis && r.crisis !== "none") setCrisis(r.crisis);
    else if (success) toast(success);
    return true;
  }, []);
  const ui = (
    <>
      <UnconfirmedDialog open={gate} onClose={() => setGate(false)} />
      <Dialog
        open={!!crisis}
        onClose={() => setCrisis(null)}
        title={crisis === "high" ? "We're here with you" : "You're not alone"}
      >
        <p className="mb-4 text-[15px] leading-relaxed text-ink-soft">
          {crisis === "high"
            ? "We've held your post for a moment so our team can check in. You're not alone. If you're in danger now, call or text 988."
            : "It sounds like things are really hard right now. Your words were shared as usual, and our team will see them. If you need to talk to someone now:"}
        </p>
        <CrisisCard />
      </Dialog>
    </>
  );
  return { handle, ui };
}
