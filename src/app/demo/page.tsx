"use client";

/* Prototype entry: pick who you want to be. Each persona resets the demo data
   to a starting point for one story in the PRD. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { TreeArt } from "@/components/art/Tree";
import { Spot } from "@/components/art/Scenes";
import { act } from "@/lib/store";

const PERSONAS = [
  {
    kind: "new" as const,
    title: "A new member",
    body: "Start from the beginning: create an account, confirm your email and walk through all eight onboarding screens.",
    href: "/signup",
    art: <Spot kind="seeds" size={132} />,
  },
  {
    kind: "member" as const,
    title: "Annie, six weeks in",
    body: "Stage III endometriosis, starting IVF. A Tree with 271 Sunlight, three groups, a mentor and an unread message request.",
    href: "/home",
    art: <TreeArt level="Tree" size={110} />,
  },
  {
    kind: "partner" as const,
    title: "An invited partner",
    body: "Open Annie's partner invite, sign up with your own private account and see the partner presets in onboarding.",
    href: "/partner-invite/demo",
    art: <Spot kind="roots" size={132} />,
  },
  {
    kind: "mentor" as const,
    title: "Annie as a mentor",
    body: "At Blossom Tree with mentoring on and a request waiting for a reply from a newly diagnosed member.",
    href: "/mentors",
    art: <TreeArt level="Blossom Tree" size={110} />,
  },
];

export default function DemoPage() {
  const router = useRouter();
  return (
    <div className="min-h-dvh bg-ground">
      <header className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-4 pt-[env(safe-area-inset-top)] sm:px-8">
        <Link href="/" aria-label="Fertility Grove home" className="text-ink">
          <Logo height={40} priority />
        </Link>
        <Link href="/login" className="text-[14px] font-semibold text-ink-soft hover:text-ink">Sign in</Link>
      </header>
      <main className="mx-auto max-w-[1100px] px-4 pt-8 pb-20 sm:px-8 sm:pt-14">
        <h1 className="serif text-[40px] leading-[1.05] sm:text-[56px]">Explore the prototype</h1>
        <p className="mt-3 max-w-[60ch] text-[17px] leading-relaxed text-ink-soft">
          Choose a starting point. Everything is sample data kept in this browser. Settings has Prototype tools for the rest:
          confirming email, pausing sign-ups, adding Sunlight and more.
        </p>
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PERSONAS.map((p) => (
            <li key={p.kind}>
              <button
                type="button"
                onClick={() => {
                  act.demo.persona(p.kind);
                  router.push(p.href);
                }}
                className="press group flex h-full w-full items-center gap-5 rounded-[20px] border border-line bg-panel p-5 text-left hover:bg-white sm:p-6"
              >
                <span className="grid h-[132px] w-[132px] shrink-0 place-items-center rounded-[14px] bg-raised">{p.art}</span>
                <span className="min-w-0">
                  <span className="block text-[20px] font-semibold text-ink group-hover:underline">{p.title}</span>
                  <span className="mt-1.5 block text-[15px] leading-relaxed text-ink-soft">{p.body}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
