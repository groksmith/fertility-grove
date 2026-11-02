"use client";

/* Report flow (PRD §19) and the hook that turns an action's Result into the
   right response: the confirm-email dialog, a toast, or crisis resources. */

import { useCallback, useState } from "react";
import { act, type Result } from "@/lib/store";
import { REPORT_REASONS } from "@/lib/options";
import type { ReportReason } from "@/lib/types";
import { Button, Choices, CrisisCard, Dialog, Field, Textarea, Toggle, UnconfirmedDialog, toast } from "./ui";

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
  const [reason, setReason] = useState<ReportReason[]>([]);
  const [details, setDetails] = useState("");
  const [block, setBlock] = useState(false);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<string>();

  const close = () => {
    onClose();
    setReason([]);
    setDetails("");
    setBlock(false);
    setError(undefined);
    setDone(undefined);
  };

  return (
    <Dialog open={open} onClose={close} title={done ? "Thank you" : `Report this ${what}`}>
      {done ? (
        <div>
          <p className="text-[15px] leading-relaxed text-ink-soft">{done}</p>
          {reason[0] === "Self-harm or crisis concern" && <div className="mt-4"><CrisisCard tone="inline" intro="If someone is in danger right now:" /></div>}
          <Button className="mt-5" onClick={close} data-autofocus>
            Done
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const r = act.social.report(target, reason[0] ?? "", details, block ? authorId : undefined);
            if (!r.ok) setError(r.error);
            else setDone(r.note);
          }}
          className="space-y-5"
        >
          <p className="text-[14px] text-muted">Reports are anonymous. The person won&apos;t know it was you.</p>
          <Choices legend="What's wrong?" options={REPORT_REASONS} value={reason} onChange={setReason} columns={1} />
          <Field
            label="Details"
            optional={reason[0] !== "Other"}
            error={error === "Tell us a little about what's wrong." ? error : undefined}
            counter={<span className="tabular text-[13px] text-muted">{details.length} / 500</span>}
          >
            <Textarea value={details} onChange={(e) => setDetails(e.target.value)} max={500} hardStop rows={3} />
          </Field>
          {authorId && <Toggle checked={block} onChange={setBlock} label="Also block this member" description="They won't be able to message you, follow you or see your posts." />}
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
      <Dialog open={!!crisis} onClose={() => setCrisis(null)} title={crisis === "high" ? "We're here with you" : "You're not alone"}>
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
