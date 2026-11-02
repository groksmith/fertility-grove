"use client";

/* Grove Guide. The screen's question: what can I ask, and what will it cost?
   The balance and refill date sit under the title; past chats on the left,
   the conversation on the right, the question box always in reach. */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, CalendarCheck, Plus, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { GroupCover } from "@/components/art/Brand";
import { Spot } from "@/components/art/Scenes";
import { Button, Counter, CrisisCard, Dialog, Field, LinkButton, PageHeader, Panel, Textarea, Toggle, toast } from "@/components/ui";
import { useResult } from "@/components/Safety";
import { GUIDE_STARTERS } from "@/lib/data/social";
import { CREDITS } from "@/lib/options";
import { formatDate, nextRefill } from "@/lib/rules/credits";
import { act, sel, useStore } from "@/lib/store";
import type { GuideTurn } from "@/lib/types";

const AI_LABEL = "AI, not a doctor. Check with your doctor before acting on this.";

function Turn({ chatId, turn, balance }: { chatId: string; turn: GuideTurn; balance: number }) {
  const groups = useStore((s) => s.groups);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <li className="rise space-y-3">
      <div className="ml-auto w-fit max-w-[85%] rounded-[20px] rounded-br-[5px] bg-accent px-4 py-3 text-[15px] leading-relaxed text-white">{turn.question}</div>
      <div className="max-w-[92%] rounded-[20px] rounded-bl-[5px] bg-blue-tint px-5 py-4">
        {turn.kind === "crisis" ? (
          <div className="space-y-3">
            {turn.answer.map((p) => (
              <p key={p} className="text-[15px] leading-relaxed text-ink">{p}</p>
            ))}
            <CrisisCard />
            <p className="text-[13px] text-blue-ink">No credits used. This chat stays private.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2.5">
              {turn.answer.map((p) => (
                <p key={p} className="text-[15px] leading-relaxed text-ink">{p}</p>
              ))}
            </div>
            {turn.citations.length > 0 && (
              <div className="mt-4">
                <p className="text-[13px] font-semibold text-blue-ink">From the reviewed library</p>
                <ul className="mt-1.5 flex flex-wrap gap-2">
                  {turn.citations.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/learn/${c.slug}`} className="press inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[14px] font-semibold text-ink">
                        <BookOpen size={15} /> {c.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {turn.groups.length > 0 && (
              <div className="mt-4">
                <p className="text-[13px] font-semibold text-blue-ink">People talking about this</p>
                <ul className="mt-1.5 flex flex-wrap gap-2">
                  {turn.groups.slice(0, 2).map((id) => {
                    const g = groups.find((x) => x.id === id);
                    return g ? (
                      <li key={id}>
                        <Link href={`/groups/${id}`} className="press inline-flex h-9 items-center gap-2 rounded-full bg-white pr-3.5 pl-1 text-[14px] font-semibold text-ink">
                          <GroupCover group={g} size={28} className="rounded-full" /> {g.name}
                        </Link>
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            )}
            <p className="mt-4 text-[13px] font-semibold text-blue-ink">{AI_LABEL}</p>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-1 text-[13px] text-muted">
        {turn.kind !== "crisis" && (
          <span className="tabular">
            {turn.cost} credit used · {balance} left
          </span>
        )}
        <span className="flex-1" />
        {turn.rating ? (
          <span>{turn.rating === "helpful" ? "You found this helpful" : "Thanks, that helps us improve"}</span>
        ) : (
          <>
            <button type="button" onClick={() => act.guide.rate(chatId, turn.id, "helpful")} className="press inline-flex h-8 items-center gap-1.5 rounded-full bg-raised px-3 font-semibold text-ink-soft hover:text-ink">
              <ThumbsUp size={14} /> Helpful
            </button>
            <button type="button" onClick={() => setReasonOpen(true)} className="press inline-flex h-8 items-center gap-1.5 rounded-full bg-raised px-3 font-semibold text-ink-soft hover:text-ink">
              <ThumbsDown size={14} /> Not helpful
            </button>
          </>
        )}
      </div>
      <Dialog open={reasonOpen} onClose={() => setReasonOpen(false)} title="What was missing?">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            act.guide.rate(chatId, turn.id, "not-helpful", reason.trim() || undefined);
            setReasonOpen(false);
          }}
          className="space-y-4"
        >
          <Field label="Tell us why" optional>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} max={300} hardStop data-autofocus />
          </Field>
          <Button type="submit">Send</Button>
        </form>
      </Dialog>
    </li>
  );
}

function GuideScreen() {
  const s = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const [chatId, setChatId] = useState<string | null>(s.guideChats.find((c) => c.turns.length)?.id ?? null);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [outOfCredits, setOutOfCredits] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const { ui } = useResult();
  const end = useRef<HTMLDivElement>(null);

  const balance = sel.creditTotal(s);
  const refill = formatDate(nextRefill(s.me.signupDay));
  const chat = s.guideChats.find((c) => c.id === chatId);
  const chats = s.guideChats.filter((c) => c.turns.length);
  const consent = s.me.healthConsent;
  const starterKey = consent ? s.me.diagnoses.find((d) => GUIDE_STARTERS[d]) : undefined;
  const starters = GUIDE_STARTERS[starterKey ?? "default"];

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [chat?.turns.length]);

  const ask = (text: string) => {
    const r = act.guide.ask(chatId, text);
    if (!r.ok) {
      if (r.code === "credits") setOutOfCredits(true);
      else toast(r.error);
      return;
    }
    setOutOfCredits(false);
    setChatId(r.id ?? null);
    setQ("");
    if (params.get("q")) router.replace("/guide");
  };

  return (
    <>
      <PageHeader
        title="Grove Guide"
        lede={
          <>
            <span className="tabular font-semibold text-ink">{sel.plural(balance, "credit")}</span> left · free credits refill on {refill}. Answers come only from the clinician-reviewed library.
          </>
        }
        art={<Spot kind="lantern" size={88} className="hidden sm:block" />}
        actions={
          <>
            <LinkButton href="/guide/appointments" variant="secondary">
              <CalendarCheck size={16} /> Appointment questions
            </LinkButton>
            <LinkButton href="/credits" variant="ghost">
              Buy credits
            </LinkButton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside aria-label="Your chats" className="order-2 lg:order-1">
          <Panel className="p-3">
            <Button variant="quiet" className="w-full" onClick={() => setChatId(null)}>
              <Plus size={16} /> New chat
            </Button>
            {chats.length ? (
              <ul className="mt-2 space-y-0.5">
                {chats.map((c) => (
                  <li key={c.id} className="group flex items-center">
                    <button
                      type="button"
                      onClick={() => setChatId(c.id)}
                      aria-current={c.id === chatId ? "true" : undefined}
                      className={`press min-w-0 flex-1 truncate rounded-[10px] px-3 py-2.5 text-left text-[14px] ${c.id === chatId ? "bg-raised font-semibold text-ink ring-1 ring-line" : "text-ink-soft hover:bg-raised"}`}
                    >
                      {c.title}
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete chat ${c.title}`}
                      onClick={() => {
                        act.guide.deleteChat(c.id);
                        if (c.id === chatId) setChatId(null);
                        toast("Chat deleted");
                      }}
                      className="press grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-raised hover:text-danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-2 pt-3 pb-1 text-[13px] text-muted">Your chats stay private. Nobody else, including your partner, sees them.</p>
            )}
            {chats.length > 0 && (
              <button type="button" onClick={() => setConfirmAll(true)} className="mt-2 w-full rounded-[10px] px-3 py-2 text-left text-[13px] font-semibold text-muted hover:text-danger">
                Delete all chats
              </button>
            )}
          </Panel>
        </aside>

        <Panel className="order-1 flex min-h-[560px] flex-col lg:order-2">
          <div className="flex-1 p-5 sm:p-7">
            {chat && chat.turns.length ? (
              <ul className="space-y-8" aria-live="polite">
                {chat.turns.map((t) => (
                  <Turn key={t.id} chatId={chat.id} turn={t} balance={balance} />
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <Spot kind="lantern" size={180} />
                <h2 className="mt-3 text-[20px] font-semibold">Ask about your diagnosis, a treatment step or your next appointment</h2>
                <p className="mt-1 text-[14px] text-muted">{starterKey ? `Suggested for ${starterKey.toLowerCase().replace("pcos", "PCOS")}` : "A few places to start"}</p>
                <ul className="mt-5 flex w-full max-w-xl flex-col gap-2">
                  {starters.map((st) => (
                    <li key={st}>
                      <button type="button" onClick={() => setQ(st)} className="press w-full rounded-[14px] bg-blue-tint px-4 py-3.5 text-left text-[15px] font-semibold text-blue-ink hover:brightness-[0.97]">
                        {st}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div ref={end} />
          </div>

          <form
            className="rounded-b-[20px] bg-raised p-4 sm:p-5"
            onSubmit={(e) => {
              e.preventDefault();
              ask(q);
            }}
          >
            {outOfCredits && (
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[14px] bg-yellow-tint px-4 py-3 text-[14px] text-[var(--yellow-700)]">
                <span className="flex-1">
                  <strong className="font-semibold">You&apos;re out of credits.</strong> Free credits refill on {refill}.
                </span>
                <LinkButton href="/credits" size="sm">
                  Buy credits
                </LinkButton>
              </div>
            )}
            <Field label="Your question" counter={<Counter value={q} max={1000} />}>
              <Textarea
                value={q}
                onChange={(e) => setQ(e.target.value)}
                max={1000}
                hardStop
                rows={3}
                placeholder="e.g. What should I ask about an endometrioma?"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask(q);
                }}
              />
            </Field>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="tabular flex-1 text-[14px] text-ink-soft">
                This question uses {CREDITS.questionCost} credit. You have {balance} left.
              </p>
              <Button type="submit" disabled={!q.trim()}>
                Ask
              </Button>
            </div>
            <div className="mt-4 border-t border-line pt-4">
              <Toggle
                checked={s.useProfileAnswers && consent}
                onChange={(v) => act.guide.setUseProfile(v)}
                disabled={!consent}
                label="Use my profile answers"
                description={consent ? "The Guide tailors answers to your diagnosis and stage." : "Off because you withdrew health-data consent in Settings."}
              />
            </div>
            <p className="mt-4 text-[13px] text-muted">The Grove Guide shares reviewed information, not medical advice.</p>
          </form>
        </Panel>
      </div>

      <Dialog open={confirmAll} onClose={() => setConfirmAll(false)} title="Delete all chats?" description="Every Grove Guide chat will be removed. This can't be undone.">
        <div className="flex gap-2">
          <Button
            variant="danger"
            onClick={() => {
              act.guide.deleteAll();
              setChatId(null);
              setConfirmAll(false);
              toast("All chats deleted");
            }}
          >
            Delete all
          </Button>
          <Button variant="ghost" onClick={() => setConfirmAll(false)}>
            Cancel
          </Button>
        </div>
      </Dialog>
      {ui}
    </>
  );
}

export default function GuidePage() {
  return (
    <Suspense>
      <GuideScreen />
    </Suspense>
  );
}
