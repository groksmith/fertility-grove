"use client";

import { AppShell } from "@/components/AppShell";
import { LinkButton } from "@/components/ui";
import { COMMUNITY_GUIDELINES } from "@/lib/data";

const FAQ = [
  {
    q: "Is Fertility Grove a medical provider?",
    a: "No. Nothing here is medical advice. Learn articles are written or reviewed by clinicians, but they are general information — your own doctor knows your case.",
  },
  {
    q: "Can I use the platform without my real name?",
    a: "Yes. Pick a handle during onboarding, or switch at any time in Settings. Your display identity is applied consistently everywhere — board, groups, messages, campaigns, and reviews.",
  },
  {
    q: "How do providers get into the Care Guide?",
    a: "Members recommend them. A provider becomes searchable once three different members have recommended them — nobody can pay to be listed.",
  },
  {
    q: "Who sees my records?",
    a: "Only you. Documents you upload are private and never surface in community or search.",
  },
  {
    q: "What happens to my support campaign when it ends?",
    a: "It stops accepting donations at the end date and the page stays viewable. You can also close it early, or extend it while it is live.",
  },
];

export default function HelpPage() {
  return (
    <AppShell section="settings" title="Help">
      <h2 className="serif text-[30px]">Help &amp; guidelines</h2>

      <section className="mt-8 max-w-[720px]">
        <h3 className="text-[16px] font-bold">Community guidelines</h3>
        <ul className="mt-4 space-y-4">
          {COMMUNITY_GUIDELINES.map((g) => (
            <li key={g.title} className="rounded-xl bg-surface px-5 py-4">
              <p className="text-[15px] font-semibold">{g.title}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-muted">{g.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 max-w-[720px]">
        <h3 className="text-[16px] font-bold">Common questions</h3>
        <dl className="mt-4 divide-y divide-line rounded-xl border border-line">
          {FAQ.map((f) => (
            <div key={f.q} className="px-5 py-4">
              <dt className="text-[15px] font-semibold">{f.q}</dt>
              <dd className="mt-1.5 text-[14px] leading-relaxed text-muted">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10 max-w-[720px] rounded-2xl bg-tint-green p-7">
        <h3 className="serif text-[22px]">Still stuck?</h3>
        <p className="mt-2 text-[14.5px] leading-relaxed">
          Reach a real person on the team. We answer within one business day.
        </p>
        <LinkButton href="/messages" variant="green" className="mt-4">
          Contact support
        </LinkButton>
      </section>
    </AppShell>
  );
}
