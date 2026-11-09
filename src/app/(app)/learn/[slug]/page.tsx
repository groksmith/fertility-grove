"use client";

/* One reviewed article: reviewer and dates up front, the body in a reading
   column, sources and the medical disclaimer at the end, and the next steps
   (ask the Guide, related groups, save) beside it. */

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Bookmark, BadgeCheck, Sparkles } from "lucide-react";
import { GroupCover } from "@/components/art/Brand";
import { Button, EmptyState, LinkButton, Panel, toast } from "@/components/ui";
import { DISCLAIMER, articleBySlug, articleCover, sectionId } from "@/lib/data/articles";
import { act, useStore } from "@/lib/store";
import { hueInk } from "@/lib/hue";

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const a = articleBySlug(slug);
  const saved = useStore((s) => s.savedArticles.includes(slug));
  const helpful = useStore((s) => s.articleHelpful[slug]);
  const groups = useStore((s) => s.groups);
  const joined = useStore((s) => s.joined);

  if (!a) {
    return (
      <EmptyState art="lens" title="We couldn't find that article." body="It may have moved while it was being reviewed." action={<LinkButton href="/learn">Back to Learn</LinkButton>} />
    );
  }

  const related = a.relatedGroups.map((id) => groups.find((g) => g.id === id)).filter(Boolean);
  const ask = `/guide?q=${encodeURIComponent(`Tell me more about ${a.title.toLowerCase()}`)}`;

  return (
    <>
      <Link href="/learn" className="mb-3 -ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-[15px] font-semibold text-muted hover:text-ink">
        <ArrowLeft size={16} /> Learn
      </Link>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="min-w-0">
          <Panel className="overflow-hidden">
            <div className="flex items-end justify-between gap-4 px-6 pt-6 sm:px-10" style={{ background: `var(--${a.hue}-50)` }}>
              <div className="pb-6">
                <p className="text-[14px] font-semibold" style={{ color: hueInk(a.hue) }}>
                  {a.diagnosis === "Unexplained" ? "Unexplained infertility" : a.diagnosis} · {a.readMinutes} min read
                </p>
                <h1 className="serif mt-2 text-[36px] leading-[1.05] text-ink sm:text-[44px]">{a.title}</h1>
              </div>
              <span aria-hidden className="relative mb-6 hidden aspect-[16/9] w-[240px] shrink-0 overflow-hidden rounded-[14px] sm:block">
                <Image src={articleCover(a.slug)} alt="" fill sizes="240px" quality={90} priority className="object-cover" />
              </span>
            </div>
            <div className="px-6 py-8 sm:px-10">
              <p className="max-w-[62ch] text-[18px] leading-relaxed text-ink">{a.summary}</p>
              <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-ink-soft">
                <BadgeCheck size={16} className="text-blue-ink" aria-hidden />
                Reviewed by {a.reviewedBy}
              </p>
              <p className="mt-1 text-[14px] text-muted">
                Last reviewed {a.lastReviewed} · Next review due {a.nextReview}
              </p>

              <div className="mt-8 max-w-[66ch] space-y-8">
                {a.sections.map((sec) => (
                  <section key={sec.heading} id={sectionId(sec.heading)} className="scroll-mt-24">
                    <h2 className="text-[22px] font-semibold text-ink">{sec.heading}</h2>
                    {sec.heading.startsWith("Questions") ? (
                      <ul className="mt-3 space-y-2">
                        {sec.body.map((b) => (
                          <li key={b} className="flex gap-3 text-[16px] leading-relaxed text-ink">
                            <span aria-hidden className="mt-2.5 h-2 w-3 shrink-0 rounded-[0_100%_0_100%] bg-[var(--green-500)]" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      sec.body.map((b) => (
                        <p key={b} className="mt-3 text-[16px] leading-relaxed text-ink">
                          {b}
                        </p>
                      ))
                    )}
                  </section>
                ))}

                <section>
                  <h2 className="text-[18px] font-semibold text-ink">Sources</h2>
                  <ul className="mt-2 space-y-1.5">
                    {a.sources.map((src) => (
                      <li key={src.url}>
                        <a href={src.url} target="_blank" rel="noreferrer noopener" className="text-[15px] text-accent underline">
                          {src.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>

                <p className="rounded-[10px] bg-raised p-4 text-[14px] leading-relaxed text-ink-soft">{DISCLAIMER}</p>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[15px] font-semibold">Was this helpful?</span>
                  {helpful ? (
                    <span className="text-[14px] text-muted">Thanks for telling us.</span>
                  ) : (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => act.settings.rateArticle(slug, "yes")}>
                        Yes
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => act.settings.rateArticle(slug, "no")}>
                        Not really
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Panel>
        </article>

        <aside className="space-y-4" aria-label="Next steps">
          <Panel className="p-5">
            <h2 className="text-[16px] font-semibold">Still have a question?</h2>
            <p className="mt-1 text-[14px] leading-relaxed text-muted">The Grove Guide answers from this article and the rest of the reviewed library.</p>
            <LinkButton href={ask} className="mt-4">
              <Sparkles size={16} /> Ask the Grove Guide
            </LinkButton>
          </Panel>
          <Panel className="p-5">
            <Button
              variant={saved ? "quiet" : "secondary"}
              onClick={() => {
                act.settings.saveArticle(slug);
                toast(saved ? "Removed from saved" : "Saved for your next appointment");
              }}
              aria-pressed={saved}
            >
              <Bookmark size={16} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save article"}
            </Button>
            <p className="mt-2 text-[13px] text-muted">Saved articles are listed under Saved, and can be shared with your partner.</p>
          </Panel>
          {related.length > 0 && (
            <Panel className="p-5">
              <h2 className="text-[16px] font-semibold">Related groups</h2>
              <ul className="mt-3 space-y-3">
                {related.map((g) =>
                  g ? (
                    <li key={g.id} className="flex items-center gap-3">
                      <GroupCover group={g} size={40} />
                      <Link href={`/groups/${g.id}`} className="min-w-0 flex-1 truncate text-[14px] font-semibold hover:underline">
                        {g.name}
                      </Link>
                      {joined.includes(g.id) ? (
                        <span className="text-[13px] text-muted">Joined</span>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => { act.groups.toggleJoin(g.id); toast(`Joined ${g.name}`); }}>
                          Join
                        </Button>
                      )}
                    </li>
                  ) : null,
                )}
              </ul>
            </Panel>
          )}
        </aside>
      </div>
    </>
  );
}
