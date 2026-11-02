"use client";

/* People search (PRD §10): handles only, by prefix, from 3 characters. Never
   real names, diagnosis, stage or location. */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Search } from "lucide-react";
import { Avatar, EmptyState, Name, PageHeader, Panel } from "@/components/ui";
import { useStore } from "@/lib/store";

function Results() {
  const params = useSearchParams();
  const router = useRouter();
  const s = useStore();
  const [q, setQ] = useState(params.get("q") ?? "");
  const term = q.trim().replace(/^@/, "").toLowerCase();
  const results =
    term.length >= 3
      ? s.members.filter(
          (m) =>
            m.handle.startsWith(term) &&
            !m.unavailable &&
            !s.blocked.includes(m.id) &&
            !m.badges.includes("team"),
        )
      : [];

  return (
    <>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          router.replace(`/people?q=${encodeURIComponent(q.trim())}`);
        }}
        className="mb-6 max-w-lg"
      >
        <label className="search-field flex h-12 items-center gap-2 rounded-full border border-line-strong bg-panel px-4 text-muted focus-within:ring-2 focus-within:ring-accent">
          <Search size={18} aria-hidden />
          <span className="sr-only">Search by handle</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="@handle"
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            enterKeyHint="search"
            className="w-full bg-transparent text-[16px] text-ink placeholder:text-muted focus:outline-none"
          />
        </label>
        <p className="mt-2 px-4 text-[13px] text-muted">Type at least 3 letters of a handle. We never search real names, diagnoses or locations.</p>
      </form>

      {term.length < 3 ? null : results.length === 0 ? (
        <EmptyState art="lens" title="No members match that handle." compact />
      ) : (
        <Panel className="max-w-2xl px-5 py-1">
          <p className="pt-4 text-[14px] text-muted">
            <span className="tabular">{results.length}</span> {results.length === 1 ? "member" : "members"}
          </p>
          <ul className="divide-y divide-line">
            {results.map((m) => (
              <li key={m.id}>
                <Link href={`/u/${m.handle}`} className="flex items-center gap-3 py-4 hover:opacity-80">
                  <Avatar member={m} size={44} />
                  <div className="min-w-0">
                    <Name member={m} link={false} />
                    <p className="text-[13px] text-muted">
                      @{m.handle} · {m.level} · <span className="tabular">{m.sunlight.toLocaleString()}</span> Sunlight
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}

export default function PeoplePage() {
  return (
    <>
      <PageHeader title="Find people" lede="Search the grove by handle." />
      <Suspense>
        <Results />
      </Suspense>
    </>
  );
}
