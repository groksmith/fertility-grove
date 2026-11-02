"use client";

/* Help (PRD §4). Crisis resources first, short answers, then a way to reach
   the team. Members see it inside the app like any other page; signed out
   and during onboarding it stands alone as a reading page. */

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ReadingFrame } from "@/components/AuthFrame";
import { Button, CrisisCard, Field, Input, PageHeader, Panel, Textarea, Counter } from "@/components/ui";
import { useHydrated, useStore } from "@/lib/store";
import { checks } from "@/lib/rules/validation";

const FAQ = [
  {
    q: "How do I get an invite?",
    a: "Fertility Grove is invite-only during the beta. Any member can share their personal invite link from their profile, and some clinics share links with their patients. If you don't know a member, leave your email on the sign-up page and we'll write when sign-ups open.",
  },
  {
    q: "Do people see my real name?",
    a: "Not unless you choose to. You post under a handle by default. If you switch to your real name, others see your first name and last initial, like “Annie M.” Your age range, ZIP code and gender are never shown to anyone.",
  },
  {
    q: "Who can see my diagnosis and treatment?",
    a: "Only you, unless you turn on “Show my diagnosis, stage and path” in Settings. We use your answers to match you with groups and people, and we never sell health data or use ad trackers.",
  },
  {
    q: "Can my partner join?",
    a: "Yes. Invite them from your profile or the last onboarding screen. They get their own private account, and you can share appointment lists, notes and saved articles in your family space. Neither of you ever sees the other's posts or messages.",
  },
  {
    q: "What are Grove Guide credits?",
    a: "The Grove Guide answers questions from our clinician-reviewed library. Each answer uses credits. You get free credits every month on the day you signed up, and you can buy a pack if you run out. Crisis replies never cost anything.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Settings, then Delete my account. You have 14 days to change your mind by signing back in. After that your data is removed and your handle is retired. You can download all your data first.",
  },
];

const LEDE = "Short answers to the questions people ask most, and a way to reach a real person on our team.";

export default function HelpPage() {
  const hydrated = useHydrated();
  const member = useStore((s) => s.signedIn && s.step >= 9 && !s.suspension && !s.deletion);
  const myEmail = useStore((s) => s.me.email);
  // Wait for the saved session so a member never sees the signed-out frame flash.
  if (!hydrated) return <div className="min-h-dvh bg-ground" aria-busy="true" />;
  if (member) {
    return (
      <AppShell>
        <PageHeader title="Help" lede={LEDE} />
        <div className="max-w-[760px]">
          <HelpBody email={myEmail} />
        </div>
      </AppShell>
    );
  }
  return (
    <ReadingFrame title="Help" lede={LEDE}>
      <HelpBody />
    </ReadingFrame>
  );
}

/** Members' contact form starts with their own email filled in. */
function HelpBody({ email: known = "" }: { email?: string }) {
  const [email, setEmail] = useState(known);
  const [message, setMessage] = useState("");
  const [errs, setErrs] = useState<{ email?: string; message?: string }>({});
  const [sent, setSent] = useState(false);

  return (
    <>
      <CrisisCard intro="If you're thinking about ending your life or are in danger, please reach out now." />

      <section aria-labelledby="faq-h" className="mt-14">
        <h2 id="faq-h" className="text-[24px] font-semibold text-ink">Common questions</h2>
        <div className="mt-5 space-y-2">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-[20px] border border-line bg-panel px-5 py-4 open:pb-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-raised text-[18px] text-muted transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-[64ch] text-[15px] leading-relaxed text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="contact-h" className="mt-14">
        <h2 id="contact-h" className="text-[24px] font-semibold text-ink">Contact support</h2>
        <p className="mt-2 text-[15px] text-ink-soft">We reply within two working days. We don&apos;t monitor this inbox around the clock, so for anything urgent use the resources above.</p>
        <Panel className="mt-5 p-5 sm:p-7">
          {sent ? (
            <div role="status">
              <p className="text-[17px] font-semibold text-ink">Thanks, we have your message.</p>
              <p className="mt-1 text-[15px] text-ink-soft">We&apos;ll reply to {email} soon.</p>
              <Button className="mt-5" variant="secondary" onClick={() => { setSent(false); setMessage(""); }}>
                Send another message
              </Button>
            </div>
          ) : (
            <form
              noValidate
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                const next = {
                  email: checks.email(email),
                  message: message.trim() ? undefined : "Tell us how we can help.",
                };
                setErrs(next);
                if (!next.email && !next.message) setSent(true);
              }}
            >
              <Field label="Your email" error={errs.email}>
                <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => email && setErrs((x) => ({ ...x, email: checks.email(email) }))} />
              </Field>
              <Field label="How can we help?" error={errs.message} counter={<Counter value={message} max={2000} />}>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} max={2000} hardStop rows={5} />
              </Field>
              <Button type="submit">Send message</Button>
            </form>
          )}
        </Panel>
      </section>
    </>
  );
}
