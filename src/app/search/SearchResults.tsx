"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { EmptyState, LinkButton, Tag } from "@/components/ui";
import { ARTICLES, PROVIDERS } from "@/lib/data";
import { useStore } from "@/lib/store";

export function SearchResults({ q: raw = "" }: { q?: string }) {
  const q = raw.trim();
  const { posts, groups } = useStore();
  const t = q.toLowerCase();

  const hits = useMemo(() => {
    if (!t) return { posts: [], groups: [], providers: [], articles: [] };
    return {
      posts: posts.filter(
        (p) =>
          p.title.toLowerCase().includes(t) || p.body.toLowerCase().includes(t),
      ),
      groups: groups.filter(
        (g) =>
          g.name.toLowerCase().includes(t) ||
          g.description.toLowerCase().includes(t),
      ),
      providers: PROVIDERS.filter(
        (p) =>
          p.name.toLowerCase().includes(t) ||
          p.categories.join(" ").toLowerCase().includes(t),
      ),
      articles: ARTICLES.filter(
        (a) =>
          a.title.toLowerCase().includes(t) ||
          a.summary.toLowerCase().includes(t),
      ),
    };
  }, [t, posts, groups]);

  const total =
    hits.posts.length +
    hits.groups.length +
    hits.providers.length +
    hits.articles.length;

  return (
    <AppShell section="dashboard" title="Search" wide>
      <h2 className="serif text-[30px]">
        {q ? <>Results for &ldquo;{q}&rdquo;</> : "Search Fertility Grove"}
      </h2>
      {q && (
        <p className="mt-1.5 text-[14px] text-muted">
          {total} {total === 1 ? "result" : "results"} across posts, groups, care,
          and Learn.
        </p>
      )}

      {!q ? (
        <div className="mt-8">
          <EmptyState
            title="Search across everything you can see."
            body="Posts and groups you have access to, published providers, and the Learn library."
          />
        </div>
      ) : total === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={`Nothing found for "${q}".`}
            body="Try a shorter or more common term — for example IVF, PCOS, acupuncture, or budgeting."
            action={<LinkButton href="/community">Back to the board</LinkButton>}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {hits.posts.length > 0 && (
            <Group title="Posts">
              {hits.posts.map((p) => (
                <li key={p.id}>
                  <Link
                    href="/community"
                    className="block rounded-xl border border-line px-5 py-4 transition hover:bg-surface"
                  >
                    <Tag tone="coral">{p.type}</Tag>
                    <p className="mt-2 text-[16px] font-bold">{p.title}</p>
                    <p className="mt-1 line-clamp-2 text-[13.5px] text-muted">
                      {p.body}
                    </p>
                  </Link>
                </li>
              ))}
            </Group>
          )}

          {hits.groups.length > 0 && (
            <Group title="Groups">
              {hits.groups.map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/community/groups/${g.id}`}
                    className="block rounded-xl border border-line px-5 py-4 transition hover:bg-surface"
                  >
                    <p className="text-[16px] font-bold">{g.name}</p>
                    <p className="mt-1 text-[13.5px] text-muted">{g.description}</p>
                  </Link>
                </li>
              ))}
            </Group>
          )}

          {hits.providers.length > 0 && (
            <Group title="Care providers">
              {hits.providers.map((p) => (
                <li key={p.id}>
                  <Link
                    href="/care"
                    className="block rounded-xl border border-line px-5 py-4 transition hover:bg-surface"
                  >
                    <Tag tone="green" outlined>
                      {p.categories[0]}
                    </Tag>
                    <p className="mt-2 text-[16px] font-bold">{p.name}</p>
                    <p className="mt-1 text-[13.5px] text-muted">
                      {p.city}, {p.state} · {p.distance} mi
                    </p>
                  </Link>
                </li>
              ))}
            </Group>
          )}

          {hits.articles.length > 0 && (
            <Group title="Learn">
              {hits.articles.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/learn/${a.slug}`}
                    className="block rounded-xl border border-line px-5 py-4 transition hover:bg-surface"
                  >
                    <Tag tone="yellow">{a.section}</Tag>
                    <p className="mt-2 text-[16px] font-bold">{a.title}</p>
                    <p className="mt-1 text-[13.5px] text-muted">{a.summary}</p>
                  </Link>
                </li>
              ))}
            </Group>
          )}
        </div>
      )}
    </AppShell>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-[15px] font-semibold text-muted">{title}</h3>
      <ul className="mt-3 grid gap-3 md:grid-cols-2">{children}</ul>
    </section>
  );
}
