"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Sparkles, Stethoscope } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState, LinkButton, Tag } from "@/components/ui";
import { ARTICLES } from "@/lib/data";

export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const article = ARTICLES.find((a) => a.slug === params.slug);

  if (!article) {
    return (
      <AppShell section="learn">
        <EmptyState
          title="We couldn't find that article."
          body="It may have been renamed while under clinical review."
          action={<LinkButton href="/learn">Back to Infertility 101</LinkButton>}
        />
      </AppShell>
    );
  }

  const related = ARTICLES.filter((a) => article.related.includes(a.slug));

  return (
    <AppShell
      section="learn"
      rail={
        <div>
          <div className="rounded-2xl bg-tint-yellow p-5">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold">
              <Stethoscope size={16} /> Clinically reviewed
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed">
              {article.reviewedBy}
              <br />
              <span className="text-muted">
                Last reviewed {article.reviewedOn}
              </span>
            </p>
          </div>

          {article.careCategory && (
            <div className="mt-6">
              <h3 className="serif flex items-center gap-2 text-[20px]">
                <Sparkles size={17} /> Find care
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
                Members near you have recommended {article.careCategory} providers.
              </p>
              <LinkButton href="/care" variant="green" size="sm" className="mt-3">
                Browse {article.careCategory}
              </LinkButton>
            </div>
          )}

          {related.length > 0 && (
            <div className="mt-8">
              <h3 className="serif text-[20px]">Related reading</h3>
              <ul className="mt-3 space-y-2.5">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/learn/${r.slug}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-line px-4 py-3 text-[13.5px] transition hover:bg-surface"
                    >
                      {r.title}
                      <ChevronRight size={15} className="shrink-0 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      }
    >
      <Link href="/learn" className="inline-flex items-center gap-1.5 text-[14px]">
        <ChevronLeft size={17} /> back to Infertility 101
      </Link>

      <div className="mt-5">
        <Tag tone="yellow">{article.section}</Tag>
      </div>

      <h1 className="serif mt-3 text-[40px] leading-[1.12]">{article.title}</h1>
      <p className="mt-3 max-w-[680px] text-[16px] leading-relaxed text-muted">
        {article.summary}
      </p>

      <div className="mt-8 max-w-[680px] space-y-5 text-[16px] leading-[1.8]">
        {article.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <p className="mt-10 max-w-[680px] rounded-xl bg-surface px-5 py-4 text-[13px] leading-relaxed text-muted">
        <strong className="text-ink">Medical disclaimer.</strong> Fertility Grove is
        not a medical provider. This article is general information reviewed by a
        clinician — it is not medical advice, and it is not a substitute for a
        conversation with your own doctor.
      </p>
    </AppShell>
  );
}
