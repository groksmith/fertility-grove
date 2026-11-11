"use client";

/* Mentors. The screen's question: who has been through this and can help me
   now? Matched mentors first; my requests and connections next; and, for
   members who mentor, the requests waiting on them. */

import Link from "next/link";
import { useState } from "react";
import { Spot } from "@/components/art/Scenes";
import { useResult } from "@/components/Safety";
import {
  Avatar,
  BadgeChip,
  Button,
  ChipSelect,
  Choices,
  Counter,
  Dialog,
  EmptyState,
  Field,
  LinkButton,
  Name,
  PageHeader,
  Panel,
  Textarea,
  Toggle,
  toast,
} from "@/components/ui";
import { MSG } from "@/lib/rules/validation";
import { canMentor } from "@/lib/rules/sunlight";
import { act, sel, useStore } from "@/lib/store";
import type { Member, MentorRequest } from "@/lib/types";

const STATUS: Record<MentorRequest["status"], { label: string; cls: string }> = {
  waiting: { label: "Waiting for a reply", cls: "bg-yellow-tint text-yellow-ink" },
  accepted: { label: "Mentoring", cls: "bg-green-tint text-green-ink" },
  declined: { label: "Declined", cls: "bg-raised text-ink-soft" },
  expired: { label: "Expired", cls: "bg-raised text-ink-soft" },
  ended: { label: "Ended", cls: "bg-raised text-ink-soft" },
};

function RequestDialog({ mentor, open, onClose }: { mentor: Member; open: boolean; onClose: () => void }) {
  const [msg, setMsg] = useState("");
  const [help, setHelp] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const { handle, ui } = useResult();
  const name = sel.displayName(mentor);
  return (
    <Dialog open={open} onClose={onClose} title={`Ask ${name} to mentor you`}>
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          const r = act.mentors.request(mentor.id, msg, help);
          if (!r.ok) {
            if (r.code === "unconfirmed") handle(r);
            else setError(r.error);
            return;
          }
          handle(r, `Request sent to ${name}`);
          onClose();
        }}
      >
        <Field label="Message to the mentor" error={error === MSG.mentorMessage ? error : undefined} counter={<Counter value={msg} max={500} />}>
          <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} max={500} hardStop rows={4} placeholder="Where you are, and what you'd like help with" data-autofocus />
        </Field>
        {mentor.mentor && (
          <div>
            <p className="mb-2 text-[14px] font-semibold">I&apos;d like help with <span className="font-normal text-muted">(optional)</span></p>
            <ChipSelect label="I'd like help with" options={mentor.mentor.helpsWith} value={help} onChange={setHelp} />
          </div>
        )}
        {error && error !== MSG.mentorMessage && (
          <p role="alert" className="rounded-[10px] bg-danger-soft p-3 text-[14px] font-semibold text-danger">{error}</p>
        )}
        <p className="text-[13px] text-muted">Mentors share experience, not medical advice. Mentoring is free.</p>
        <Button type="submit">Send request</Button>
      </form>
      {ui}
    </Dialog>
  );
}

function MentorCard({ mentor, why }: { mentor: Member; why: string }) {
  const [open, setOpen] = useState(false);
  const existing = useStore((s) => s.mentorRequests.find((r) => r.mentorId === mentor.id && r.menteeId === "me" && (r.status === "accepted" || r.status === "waiting")));
  const m = mentor.mentor!;
  const room = m.capacity - m.activeMentees - m.waiting;
  return (
    <Panel as="article" className="flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        <Avatar member={mentor} size={48} />
        <div className="min-w-0 flex-1">
          <Name member={mentor} />
          <p className="mt-0.5 text-[13px] font-semibold text-green-ink">{why}</p>
        </div>
      </div>
      <p className="mt-4 text-[15px] leading-relaxed text-ink">{m.bio}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {m.helpsWith.map((h) => (
          <span key={h} className="inline-flex h-7 items-center rounded-full bg-raised px-3 text-[13px] font-semibold text-ink-soft">{h}</span>
        ))}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
        {existing ? (
          <span className={`inline-flex h-7 items-center rounded-full px-3 text-[13px] font-semibold ${STATUS[existing.status].cls}`}>
            {existing.status === "accepted" ? "Your mentor" : "Request sent"}
          </span>
        ) : room > 0 ? (
          <>
            <Button onClick={() => setOpen(true)}>Request mentoring</Button>
            <span className="tabular text-[13px] text-muted">Room for {room} more</span>
          </>
        ) : (
          <span className="text-[14px] text-muted">Not taking requests right now</span>
        )}
        <LinkButton href={`/u/${mentor.handle}`} variant="ghost" size="sm" className="ml-auto">
          View profile
        </LinkButton>
      </div>
      <RequestDialog mentor={mentor} open={open} onClose={() => setOpen(false)} />
    </Panel>
  );
}

function Connection({ r }: { r: MentorRequest }) {
  const s = useStore();
  const mentor = sel.person(s, r.mentorId);
  const [feedback, setFeedback] = useState(false);
  const [helpful, setHelpful] = useState<string[]>([]);
  const [thanks, setThanks] = useState("");
  const [confirmEnd, setConfirmEnd] = useState(false);
  if (!mentor) return null;
  const st = STATUS[r.status];
  const conv = s.conversations.find((c) => c.memberId === r.mentorId && c.kind === "mentoring");
  const name = sel.displayName(mentor);
  return (
    <li className="rounded-[14px] p-3">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar member={mentor} size={40} />
        <div className="min-w-0 flex-1">
          <Name member={mentor} badges={false} />
          <p className="text-[13px] text-muted">{r.daysAgo === 0 ? "Sent today" : `Sent ${r.daysAgo} days ago`}</p>
        </div>
        <span className={`inline-flex h-7 items-center rounded-full px-3 text-[13px] font-semibold ${st.cls}`}>{st.label}</span>
      </div>
      <div className="mt-2 pl-[52px] text-[14px] leading-relaxed text-ink-soft">
        {r.status === "waiting" && <p>Mentors usually reply within 7 days. If they can&apos;t, you can ask someone else.</p>}
        {r.status === "declined" && <p>{r.note}</p>}
        {r.status === "expired" && <p>Your request to {name} expired without a reply. This usually means they&apos;re busy. You can ask another mentor.</p>}
        {r.status === "accepted" && (
          <div className="flex flex-wrap gap-2">
            {conv && <LinkButton href={`/messages/${conv.id}`} size="sm">Open conversation</LinkButton>}
            <Button size="sm" variant="ghost" onClick={() => setConfirmEnd(true)}>End connection</Button>
          </div>
        )}
        {r.status === "ended" && !r.feedbackGiven && (
          <Button size="sm" variant="secondary" onClick={() => setFeedback(true)}>Tell us how it went</Button>
        )}
        {r.status === "ended" && r.feedbackGiven && <p>Thanks for your feedback.</p>}
      </div>
      <Dialog open={confirmEnd} onClose={() => setConfirmEnd(false)} title={`End mentoring with ${name}?`} description={`${name} will be told kindly. Your conversation stays in Messages.`}>
        <div className="flex gap-2">
          <Button onClick={() => { act.mentors.end(r.id); setConfirmEnd(false); setFeedback(true); }}>End connection</Button>
          <Button variant="ghost" onClick={() => setConfirmEnd(false)}>Cancel</Button>
        </div>
      </Dialog>
      <Dialog open={feedback} onClose={() => setFeedback(false)} title="How was mentoring?">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            act.mentors.feedback(r.id);
            setFeedback(false);
            toast("Thank you. Your note was sent.");
          }}
        >
          <Choices legend="Was this mentoring helpful?" hint="Only the Fertility Grove team sees this." options={["Yes", "Somewhat", "No"] as const} value={helpful as ("Yes" | "Somewhat" | "No")[]} onChange={(v) => setHelpful(v)} columns={3} />
          <Field label={`Thank-you note to ${name}`} optional counter={<Counter value={thanks} max={300} />}>
            <Textarea value={thanks} onChange={(e) => setThanks(e.target.value)} max={300} hardStop rows={3} />
          </Field>
          <Button type="submit">Send</Button>
        </form>
      </Dialog>
    </li>
  );
}

function Incoming({ r }: { r: MentorRequest }) {
  const s = useStore();
  const mentee = sel.person(s, r.menteeId);
  const [note, setNote] = useState("");
  if (!mentee) return null;
  return (
    <li className="rounded-[14px] bg-raised p-4">
      <div className="flex items-center gap-3">
        <Avatar member={mentee} size={40} />
        <div className="min-w-0 flex-1">
          <Name member={mentee} />
          <p className="text-[13px] text-muted">{r.daysAgo === 0 ? "Today" : `${r.daysAgo} day${r.daysAgo === 1 ? "" : "s"} ago`} · replies within 7 days keep requests open</p>
        </div>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-ink">{r.message}</p>
      {r.helpWith.length > 0 && <p className="mt-2 text-[13px] text-muted">Help with: {r.helpWith.join(", ")}</p>}
      <Field label="Note to the member" optional className="mt-4" counter={<Counter value={note} max={300} />}>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} max={300} hardStop rows={2} />
      </Field>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => { act.mentors.respond(r.id, true, note); toast("Accepted. A Mentoring conversation is open in Messages."); }}>Accept</Button>
        <Button variant="secondary" onClick={() => { act.mentors.respond(r.id, false, note); toast("Declined with a kind note"); }}>Decline</Button>
      </div>
    </li>
  );
}

export default function MentorsPage() {
  const s = useStore();
  const me = s.me;
  const matches = sel.mentorMatches(s, 3);
  const mine = s.mentorRequests.filter((r) => r.menteeId === "me");
  const incoming = s.mentorRequests.filter((r) => r.mentorId === "me" && r.status === "waiting");
  const mentoring = s.mentorRequests.filter((r) => r.mentorId === "me" && r.status === "accepted").length;
  const eligible = canMentor(me.level, me.founding);
  const active = mine.filter((r) => r.status === "accepted").length;

  const lede = incoming.length
    ? `${incoming.length} ${incoming.length === 1 ? "member is" : "members are"} waiting for your reply.`
    : active
      ? `You have ${active} active ${active === 1 ? "mentor" : "mentors"}. You can have up to 2.`
      : "Members who have been through it, matched to your path. Mentoring is free.";

  return (
    <>
      <PageHeader title="Mentors" lede={lede} art={<Spot kind="shelter" size={88} className="hidden sm:block" />} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          {me.mentoring.on && (
            <section aria-labelledby="incoming-h">
              <Panel className="p-5 sm:p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 id="incoming-h" className="text-[18px] font-semibold">Requests to you</h2>
                  <span className="tabular text-[13px] text-muted">{mentoring} of {me.mentoring.capacity} places in use</span>
                </div>
                {incoming.length ? (
                  <ul className="mt-4 space-y-3">{incoming.map((r) => <Incoming key={r.id} r={r} />)}</ul>
                ) : (
                  <p className="mt-2 text-[14px] text-muted">No requests waiting.</p>
                )}
              </Panel>
            </section>
          )}

          <section aria-labelledby="find-h">
            <h2 id="find-h" className="mb-3 text-[20px] font-semibold">Find a mentor</h2>
            {!me.wantMentor ? (
              <Panel className="p-6">
                <Toggle checked={false} onChange={(v) => act.settings.update({ wantMentor: v })} label="I'd like a mentor" description="Turn this on to see mentors matched to your path." />
              </Panel>
            ) : matches.length ? (
              <ul className={`grid gap-4 ${matches.length > 1 ? "md:grid-cols-2" : ""}`}>
                {matches.map(({ member, why }) => (
                  <li key={member.id}>
                    <MentorCard mentor={member} why={why} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState art="shelter" title="No mentors on your path are free right now." body="Check back soon, or ask in a group." action={<LinkButton href="/groups" variant="secondary">Your groups</LinkButton>} />
            )}
          </section>

          <section aria-labelledby="how-h">
            <Panel className="grid grid-cols-1 items-center gap-6 p-5 sm:grid-cols-[auto_1fr] sm:p-6">
              <Spot kind="shelter" size={200} className="mx-auto" />
              <div>
                <h2 id="how-h" className="text-[18px] font-semibold">How mentoring works</h2>
                <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-ink-soft">
                  <li>Mentors are members who have been through it. Mentoring is free, and there&apos;s no application.</li>
                  <li>You can have one open request and two mentors at a time. A mentor replies within 7 days, or the request expires kindly.</li>
                  <li>Once they accept, a Mentoring conversation opens in Messages. Either of you can end it at any time.</li>
                  <li>Mentors share experience, not medical advice. Your own doctor knows your case best.</li>
                </ul>
              </div>
            </Panel>
          </section>
        </div>

        <aside className="space-y-4">
          <Panel className="p-5">
            <h2 className="text-[16px] font-semibold">My requests and connections</h2>
            {mine.length ? (
              <ul className="mt-2 -mx-3">{mine.map((r) => <Connection key={r.id} r={r} />)}</ul>
            ) : (
              <p className="mt-2 text-[14px] text-muted">You haven&apos;t asked anyone yet. You can have 1 open request and 2 mentors at a time.</p>
            )}
          </Panel>

          <Panel className="p-5">
            <h2 className="text-[16px] font-semibold">Mentoring others</h2>
            {me.mentoring.on ? (
              <div className="mt-3 space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  <BadgeChip badge={me.founding ? "founding-mentor" : "mentor"} />
                </div>
                <Toggle checked={me.mentoring.paused} onChange={(v) => act.mentors.setPaused(v)} label="Pause new requests" description="Current conversations carry on." />
                <div className="flex flex-wrap gap-2">
                  <LinkButton href="/mentors/setup" variant="secondary" size="sm">Edit mentor profile</LinkButton>
                  <Button variant="ghost" size="sm" onClick={() => { act.mentors.turnOff(); toast("Mentoring turned off. Waiting requests were declined kindly."); }}>
                    Turn off mentoring
                  </Button>
                </div>
              </div>
            ) : eligible ? (
              <div className="mt-2">
                <p className="text-[14px] text-muted">You&apos;ve grown into a {me.level}. Share what you&apos;ve learned with someone newer.</p>
                <LinkButton href="/mentors/setup" className="mt-3" size="sm">Set up mentoring</LinkButton>
              </div>
            ) : (
              <p className="mt-2 text-[14px] text-muted">
                Mentoring opens at Blossom Tree, 750 Sunlight. You have <span className="tabular">{me.sunlight.toLocaleString()}</span>.{" "}
                <Link href="/dashboard#sunlight" className="font-semibold text-accent">How Sunlight works</Link>
              </p>
            )}
          </Panel>
        </aside>
      </div>
    </>
  );
}
