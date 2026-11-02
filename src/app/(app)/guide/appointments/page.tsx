"use client";

/* My appointment questions. The screen's question: am I ready for my next
   appointment? The form makes a list in one step (cost shown first); saved
   lists sit beside it, nearest appointment first. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarCheck, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Spot } from "@/components/art/Scenes";
import { Button, Counter, EmptyState, Field, Input, LinkButton, PageHeader, Panel, Select, Textarea, toast } from "@/components/ui";
import { APPOINTMENT_TYPES, CREDITS } from "@/lib/options";
import { act, sel, useStore } from "@/lib/store";

export default function AppointmentsPage() {
  const s = useStore();
  const router = useRouter();
  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [onMind, setOnMind] = useState("");
  const [error, setError] = useState<string>();
  const [outOfCredits, setOutOfCredits] = useState(false);
  const balance = sel.creditTotal(s);
  const lists = [...s.appointmentLists].sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));

  const next = lists.find((l) => l.date && l.date >= new Date().toISOString().slice(0, 10));
  const lede = next
    ? `${next.questions.length} questions ready for your ${next.type.toLowerCase()} on ${new Date(`${next.date}T12:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })}.`
    : "Tell the Guide what's coming up and get 8 to 12 questions to bring, grouped by topic.";

  return (
    <>
      <Link href="/guide" className="mb-3 -ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-[15px] font-semibold text-muted hover:text-ink">
        <ArrowLeft size={16} /> Grove Guide
      </Link>
      <PageHeader title="Appointment questions" lede={lede} art={<Spot kind="lantern" size={88} className="hidden sm:block" />} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel className="p-5 sm:p-7">
          <h2 className="text-[20px] font-semibold">Make a new list</h2>
          <form
            className="mt-5 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!type) {
                setError("Choose the appointment type.");
                return;
              }
              const r = act.guide.createList(type, date, onMind);
              if (!r.ok) {
                if (r.code === "credits") setOutOfCredits(true);
                else toast(r.error);
                return;
              }
              router.push(`/guide/appointments/${r.id}`);
            }}
          >
            <Field label="Appointment type" error={error}>
              <Select value={type} onChange={(e) => { setType(e.target.value); setError(undefined); }}>
                <option value="">Choose one</option>
                {APPOINTMENT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field label="Appointment date" optional hint="Shown on your saved list.">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="sm:max-w-60" />
            </Field>
            <Field label="What's on your mind" optional counter={<Counter value={onMind} max={1000} />}>
              <Textarea value={onMind} onChange={(e) => setOnMind(e.target.value)} max={1000} hardStop rows={4} placeholder="Anything you're worried about or want to understand" />
            </Field>
            {outOfCredits && (
              <div className="flex flex-wrap items-center gap-3 rounded-[14px] bg-yellow-tint px-4 py-3 text-[14px] text-[var(--yellow-700)]">
                <span className="flex-1"><strong className="font-semibold">You&apos;re out of credits.</strong> A list uses {CREDITS.appointmentListCost}.</span>
                <LinkButton href="/credits" size="sm">Buy credits</LinkButton>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit">
                <CalendarCheck size={16} /> Make my list
              </Button>
              <p className="tabular text-[14px] text-ink-soft">
                This list uses {CREDITS.appointmentListCost} credits. You have {balance} left.
              </p>
            </div>
            <p className="text-[13px] text-muted">AI, not a doctor. Questions never include a diagnosis or a dose.</p>
          </form>
        </Panel>

        <section aria-labelledby="saved-h">
          <h2 id="saved-h" className="mb-3 text-[16px] font-semibold">My appointment questions</h2>
          {lists.length ? (
            <Panel className="p-2">
              <ul>
                {lists.map((l) => (
                  <li key={l.id}>
                    <Link href={`/guide/appointments/${l.id}`} className="press flex items-center gap-3 rounded-[14px] p-3 hover:bg-raised">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-blue-tint text-blue-ink">
                        <CalendarCheck size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold">{l.type}</span>
                        <span className="tabular block text-[13px] text-muted">
                          {l.date ? new Date(`${l.date}T12:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "No date"} · {l.questions.length} questions
                          {s.family.items.some((i) => i.refId === l.id) && " · Shared with partner"}
                        </span>
                      </span>
                      <ChevronRight size={18} className="text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : (
            <EmptyState compact art="bookmark" title="No lists yet" body="Your saved question lists appear here, ready to copy or print before a visit." />
          )}
        </section>
      </div>
    </>
  );
}
