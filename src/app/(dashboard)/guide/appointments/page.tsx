"use client";

/* My appointment questions. The screen's question: am I ready for my next
   appointment? The form makes a list in one step (cost shown first); saved
   lists sit beside it, nearest appointment first. */

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CalendarCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Spot } from "@/components/art/Scenes";
import { EmptyState, FormField, PageHeader } from "@/components/shared";
import { Button, LinkButton } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { toast } from "@/components/ui/toast";
import { APPOINTMENT_TYPES, CREDITS } from "@/config/options";
import { creditTotal } from "@/features/credits";
import { appointmentListSchema, guideService } from "@/features/guide";
import { useStore } from "@/lib/mock-server";

export default function AppointmentsPage() {
  const s = useStore();
  const router = useRouter();
  // The type error shows on submit and clears as soon as the type changes; focus stays put.
  const form = useForm({
    resolver: zodResolver(appointmentListSchema),
    defaultValues: { type: "", date: "", onMind: "" },
    reValidateMode: "onSubmit",
    shouldFocusError: false,
  });
  const [outOfCredits, setOutOfCredits] = useState(false);
  const balance = creditTotal(s);
  const lists = [...s.appointmentLists].sort((a, b) =>
    (a.date ?? "9999").localeCompare(b.date ?? "9999"),
  );

  const next = lists.find((l) => l.date && l.date >= new Date().toISOString().slice(0, 10));
  const lede = next
    ? `${next.questions.length} questions ready for your ${next.type.toLowerCase()} on ${new Date(`${next.date}T12:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })}.`
    : "Tell the Guide what's coming up and get 8 to 12 questions to bring, grouped by topic.";

  return (
    <>
      <Link
        href="/guide"
        className="mb-3 -ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-[15px] font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft size={16} /> Grove Guide
      </Link>
      <PageHeader
        title="Appointment questions"
        lede={lede}
        art={<Spot kind="lantern" size={88} className="hidden sm:block" />}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel className="p-5 sm:p-7">
          <h2 className="text-[20px] font-semibold">Make a new list</h2>
          <form
            className="mt-5 space-y-5"
            onSubmit={form.handleSubmit(({ type, date, onMind }) => {
              const r = guideService.createList(type, date, onMind);
              if (!r.ok) {
                if (r.code === "credits") setOutOfCredits(true);
                else toast(r.error);
                return;
              }
              router.push(`/guide/appointments/${r.id}`);
            })}
          >
            <FormField
              form={form}
              name="type"
              label="Appointment type"
              kind="select"
              options={[
                { value: "", label: "Choose one" },
                ...APPOINTMENT_TYPES.map((t) => ({ value: t, label: t })),
              ]}
              onValueChange={() => form.clearErrors("type")}
            />
            <Controller
              control={form.control}
              name="date"
              render={({ field }) => (
                <Field label="Appointment date" optional hint="Shown on your saved list.">
                  <Input
                    type="date"
                    ref={field.ref}
                    name={field.name}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    className="sm:max-w-60"
                  />
                </Field>
              )}
            />
            <FormField
              form={form}
              name="onMind"
              label="What's on your mind"
              optional
              counterMax={1000}
              kind="textarea"
              max={1000}
              hardStop
              rows={4}
              placeholder="Anything you're worried about or want to understand"
            />
            {outOfCredits && (
              <div className="flex flex-wrap items-center gap-3 rounded-[14px] bg-yellow-tint px-4 py-3 text-[14px] text-[var(--yellow-700)]">
                <span className="flex-1">
                  <strong className="font-semibold">You&apos;re out of credits.</strong> A list uses{" "}
                  {CREDITS.appointmentListCost}.
                </span>
                <LinkButton href="/credits" size="sm">
                  Buy credits
                </LinkButton>
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
            <p className="text-[13px] text-muted">
              AI, not a doctor. Questions never include a diagnosis or a dose.
            </p>
          </form>
        </Panel>

        <section aria-labelledby="saved-h">
          <h2 id="saved-h" className="mb-3 text-[16px] font-semibold">
            My appointment questions
          </h2>
          {lists.length ? (
            <Panel className="p-2">
              <ul>
                {lists.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/guide/appointments/${l.id}`}
                      className="press flex items-center gap-3 rounded-[14px] p-3 hover:bg-raised"
                    >
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-blue-tint text-blue-ink">
                        <CalendarCheck size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold">{l.type}</span>
                        <span className="tabular block text-[13px] text-muted">
                          {l.date
                            ? new Date(`${l.date}T12:00`).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                              })
                            : "No date"}{" "}
                          · {l.questions.length} questions
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
            <EmptyState
              compact
              art="bookmark"
              title="No lists yet"
              body="Your saved question lists appear here, ready to copy or print before a visit."
            />
          )}
        </section>
      </div>
    </>
  );
}
