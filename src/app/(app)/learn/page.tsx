"use client";

/* Learn home. The screen's question: what should I read for where I am?
   Recommended articles lead (matched on the member's diagnosis), then the six
   diagnoses, topics, and search across the library. Every article wears its
   own painted cover: an open book with its topic beside it. */

import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Spot } from "@/components/art/Scenes";
import { EmptyState, PageHeader, Panel } from "@/components/ui";
import { ARTICLES, articleCover } from "@/lib/data/articles";
import { useStore } from "@/lib/store";
import type { Article } from "@/lib/types";

function ArticleTile({ a, why }: { a: Article; why?: string }) {
  return (
    <Link href={`/learn/${a.slug}`} className="press group flex w-full flex-col overflow-hidden rounded-[20px] border border-line bg-panel hover:border-line-strong">
      <span className="relative block aspect-[16/9] overflow-hidden" aria-hidden>
        <Image
          src={articleCover(a.slug)}
          alt=""
          fill
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          quality={90}
          className="object-cover transition-transform duration-300 ease-[var(--e-out)] group-hover:scale-[1.03]"
        />
      </span>
      <span className="flex flex-1 flex-col p-5">
        {why && <span className="text-[13px] font-semibold text-green-ink">{why}</span>}
        <span className={`${why ? "mt-1" : ""} text-[17px] leading-snug font-semibold text-ink group-hover:underline`}>{a.title}</span>
        <span className="mt-1.5 line-clamp-3 text-[14px] leading-relaxed text-ink-soft">{a.summary}</span>
        <span className="mt-auto pt-4 text-[13px] text-muted">
          {a.readMinutes} min read · Reviewed {a.lastReviewed}
        </span>
      </span>
    </Link>
  );
}

export default function LearnPage() {
  const me = useStore((s) => s.me);
  const saved = useStore((s) => s.savedArticles);
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState<string | null>(null);

  const recommended = useMemo(() => {
    if (!me.healthConsent) return [];
    return ARTICLES.filter(
      (a) => a.diagnoses.some((d) => me.diagnoses.includes(d)) || a.stages.some((st) => me.stages.includes(st)),
    )
      .sort((a, b) => Number(b.diagnoses.some((d) => me.diagnoses.includes(d))) - Number(a.diagnoses.some((d) => me.diagnoses.includes(d))))
      .slice(0, 3);
  }, [me]);

  const whyFor = (a: Article) => {
    const dx = a.diagnoses.find((d) => me.diagnoses.includes(d));
    const st = a.stages.find((x) => me.stages.includes(x));
    const term = dx ?? st ?? a.diagnosis;
    return `Matched on ${/^[A-Z]{2,}/.test(term) ? term : term.toLowerCase()}`;
  };

  const topics = useMemo(() => Array.from(new Set(ARTICLES.flatMap((a) => a.topics))).sort(), []);

  const query = q.trim().toLowerCase();
  const results = query
    ? ARTICLES.filter((a) =>
        [a.title, a.summary, ...a.sections.flatMap((s) => [s.heading, ...s.body])].join(" ").toLowerCase().includes(query),
      )
    : topic
      ? ARTICLES.filter((a) => a.topics.includes(topic))
      : null;

  const finding = recommended.length
    ? `${recommended.length} reviewed ${recommended.length === 1 ? "article matches" : "articles match"} your journey. ${saved.length} saved for your next appointment.`
    : "Six clinician-reviewed overviews, one for each diagnosis.";

  return (
    <>
      <PageHeader title="Learn" lede={finding} art={<Spot kind="plate" size={88} className="hidden sm:block" />} />

      <form role="search" onSubmit={(e) => e.preventDefault()} className="mb-8">
        <label className="search-field flex h-12 items-center gap-3 rounded-full border border-line-strong bg-panel px-5 text-muted focus-within:ring-2 focus-within:ring-accent">
          <Search size={18} aria-hidden />
          <span className="sr-only">Search the library</span>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setTopic(null);
            }}
            placeholder="Search the library, e.g. AMH or excision"
            enterKeyHint="search"
            className="w-full bg-transparent text-[15px] text-ink placeholder:text-muted focus:outline-none"
          />
        </label>
      </form>

      {results ? (
        <section aria-labelledby="results-h">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="results-h" className="text-[20px] font-semibold">
              {query ? `Results for “${q.trim()}”` : `Topic: ${topic}`}
            </h2>
            <button type="button" className="text-[14px] font-semibold text-accent" onClick={() => { setQ(""); setTopic(null); }}>
              Clear
            </button>
          </div>
          {results.length ? (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((a) => (
                <li key={a.slug} className="flex">
                  <ArticleTile a={a} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState art="lens" title="No articles match that yet." body="Try different words, or ask in a group." />
          )}
        </section>
      ) : (
        <div className="space-y-10">
          {recommended.length > 0 && (
            <section aria-labelledby="rec-h">
              <h2 id="rec-h" className="mb-4 text-[20px] font-semibold">Recommended for you</h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recommended.map((a) => (
                  <li key={a.slug} className="flex">
                    <ArticleTile a={a} why={whyFor(a)} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="dx-h">
            <h2 id="dx-h" className="mb-4 text-[20px] font-semibold">Browse by diagnosis</h2>
            <Panel className="p-2">
              <ul className="grid grid-cols-1 sm:grid-cols-2">
                {ARTICLES.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/learn/${a.slug}`} className="press flex items-center gap-4 rounded-[14px] p-3 hover:bg-raised">
                      <span aria-hidden className="relative h-12 w-16 shrink-0 overflow-hidden rounded-[10px] ring-1 ring-line ring-inset">
                        <Image src={articleCover(a.slug)} alt="" fill sizes="128px" quality={90} className="object-cover" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold text-ink">{a.diagnosis === "Unexplained" ? "Unexplained infertility" : a.diagnosis}</span>
                        <span className="block truncate text-[13px] text-muted">{a.title} · {a.readMinutes} min</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          </section>

          <section aria-labelledby="topic-h">
            <h2 id="topic-h" className="mb-4 text-[20px] font-semibold">Browse by topic</h2>
            <div className="flex flex-wrap gap-2">
              {topics.map((t) => (
                <button key={t} type="button" onClick={() => setTopic(t)} className="press h-10 rounded-full border border-line-strong bg-panel px-4 text-[14px] font-semibold text-ink-soft hover:text-ink">
                  {t}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
