"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FigmaArt } from "@/components/Illustrations";
import { EmptyState, Tag } from "@/components/ui";
import { ARTICLES } from "@/lib/data";
import { useStore } from "@/lib/store";

import { ARTICLE_SECTIONS } from "@/lib/types";

/* Figma frame 19 lays out six sections, each with its own illustration. */
const SECTION_ART: Record<string, string> = {
  "Diagnoses & Conditions": "learn-diagnoses",
  "Treatments & Medical Procedures": "learn-treatments",
  "Lifestyle and Holistic Approaches": "learn-lifestyle",
  "Emotional and Mental Wellbeing": "learn-emotional",
  "Frequently Asked Questions (FAQs)": "learn-faq",
  "Glossary & Resources": "learn-glossary",
};

export default function LearnPage() {
  const { profile } = useStore();
  const [q, setQ] = useState("");

  const matches = useMemo(() => {
    if (!q.trim()) return null;
    const t = q.toLowerCase();
    return ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(t) ||
        a.summary.toLowerCase().includes(t) ||
        a.body.join(" ").toLowerCase().includes(t),
    );
  }, [q]);

  /** Articles matching the member's diagnoses float to the top of a section. */
  function order(list: typeof ARTICLES) {
    return [...list].sort((a, b) => {
      const score = (x: (typeof ARTICLES)[number]) =>
        profile.diagnoses.some((d) =>
          x.title.toLowerCase().includes(d.toLowerCase().split(" ")[0]),
        )
          ? -1
          : 0;
      return score(a) - score(b);
    });
  }

  return (
    <AppShell section="learn" wide>
      <div className="flex flex-wrap items-start gap-6">
        <div className="min-w-[320px] flex-1">
          <h2 className="serif text-[30px]">Infertility 101</h2>
          <p className="mt-2 max-w-[780px] text-[14.5px] leading-relaxed">
            Here, you&rsquo;ll find clear, compassionate explanations of diagnoses,
            treatments, lifestyle approaches, and holistic options to support your
            fertility journey. This space is designed to help you feel informed and
            empowered.
          </p>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-line-strong px-4 py-2.5">
          <Search size={17} className="text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search fertility topics…"
            aria-label="Search fertility topics"
            className="w-56 bg-transparent text-[14px] placeholder:text-muted focus:outline-none"
          />
        </div>
      </div>

      {matches ? (
        <div className="mt-8">
          <p className="text-[14px] text-muted">
            {matches.length} {matches.length === 1 ? "result" : "results"} for
            &ldquo;{q}&rdquo;
          </p>
          {matches.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title={`Nothing on "${q}" yet.`}
                body="Our library is reviewed by clinicians, so it grows carefully. Try a broader term like PCOS, IVF, or medication."
              />
            </div>
          ) : (
            <ul className="mt-5 space-y-4">
              {matches.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/learn/${a.slug}`}
                    className="block rounded-xl border border-line px-5 py-4 transition hover:bg-surface"
                  >
                    <Tag tone="yellow">{a.section}</Tag>
                    <p className="mt-2 text-[16.5px] font-bold">{a.title}</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-muted">
                      {a.summary}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {ARTICLE_SECTIONS.map((section) => {
            const list = order(ARTICLES.filter((a) => a.section === section));
            if (!list.length) return null;
            return (
              <section key={section} className="rounded-2xl bg-surface p-8">
                <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
                  <div>
                    <h3 className="serif text-[24px] leading-tight">{section}</h3>
                    <FigmaArt
                      name={SECTION_ART[section]}
                      className="mt-5 w-full max-w-[200px]"
                    />
                  </div>
                  <ul className="grid auto-rows-min gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {list.map((a) => (
                      <li key={a.id}>
                        <Link
                          href={`/learn/${a.slug}`}
                          className="flex h-full items-center gap-3 rounded-lg bg-white py-4 pl-5 pr-4 transition hover:shadow-[0_8px_24px_-14px_rgba(0,0,0,0.3)]"
                          style={{ borderLeft: "10px solid var(--tint-yellow)" }}
                        >
                          <span className="flex-1 text-[15px] font-medium leading-snug">
                            {a.title}
                          </span>
                          <ChevronRight size={18} className="shrink-0" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
