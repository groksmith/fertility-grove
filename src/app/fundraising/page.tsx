"use client";

import { useMemo, useState } from "react";
import { ListFilter, Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CampaignCard } from "@/components/CampaignCard";
import { EmptyState, LinkButton, Select } from "@/components/ui";
import { FUNDRAISING_TABS } from "@/lib/nav";
import { useStore } from "@/lib/store";

const STEPS = [
  {
    n: 1,
    text: 'Click "Create Support Campaign" to get started.',
    bold: true,
  },
  { n: 2, text: "Explain why you're fundraising and upload photos to make it personal." },
  { n: 3, text: "Choose how much you'd like to raise and by when." },
  {
    n: 4,
    text: "Share your campaign with friends, family, and your community — then receive support and messages along the way.",
  },
];

export default function FundraisingPage() {
  const { campaigns } = useStore();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"Newest" | "Most raised" | "Closest to goal">(
    "Newest",
  );

  const list = useMemo(() => {
    let c = campaigns.filter(
      (x) =>
        !q ||
        x.title.toLowerCase().includes(q.toLowerCase()) ||
        x.owner.toLowerCase().includes(q.toLowerCase()),
    );
    if (sort === "Most raised") c = [...c].sort((a, b) => b.raised - a.raised);
    if (sort === "Closest to goal")
      c = [...c].sort((a, b) => b.raised / b.goal - a.raised / a.goal);
    return c;
  }, [campaigns, q, sort]);

  return (
    <AppShell section="fundraising" tabs={FUNDRAISING_TABS} wide>
      {/* How it works — frame 15 draws this on the page, not in a card, with
          alternating curved arrows between the four numbered steps. */}
      <section className="pt-2">
        <h2 className="text-center text-[19px] font-bold">How It Works</h2>

        <div className="relative mt-8">
          <svg
            aria-hidden
            viewBox="0 0 1000 90"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-0 top-0 hidden h-[90px] w-full md:block"
          >
            <defs>
              <marker
                id="fg-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M0 0 L10 5 L0 10 z" fill="var(--fg-blue-dark)" />
              </marker>
            </defs>
            <path
              d="M150 34 C 220 6, 300 6, 350 30"
              fill="none"
              stroke="var(--fg-blue-dark)"
              strokeWidth="2"
              markerEnd="url(#fg-arrow)"
            />
            <path
              d="M400 36 C 460 74, 560 74, 605 40"
              fill="none"
              stroke="var(--fg-blue-dark)"
              strokeWidth="2"
              markerEnd="url(#fg-arrow)"
            />
            <path
              d="M650 34 C 720 6, 800 6, 850 30"
              fill="none"
              stroke="var(--fg-blue-dark)"
              strokeWidth="2"
              markerEnd="url(#fg-arrow)"
            />
          </svg>

          <ol className="relative grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.n} className="text-center">
                <span
                  className="mx-auto grid h-9 w-9 place-items-center rounded-full text-[14px] font-semibold"
                  style={{ background: "var(--fg-blue-dark)", color: "#fff" }}
                >
                  {s.n}
                </span>
                <p
                  className={`mt-16 text-[14px] leading-relaxed md:mt-14 ${
                    s.bold ? "font-semibold" : ""
                  }`}
                >
                  {s.text}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8 flex justify-center">
          <LinkButton href="/fundraising/new" variant="blue" size="lg">
            Create Support Campaign
          </LinkButton>
        </div>
      </section>

      {/* Browse */}
      <div className="mt-11 flex flex-wrap items-center gap-4">
        <h2 className="serif text-[30px]">Browse Campaigns</h2>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-line-strong px-3.5 py-2">
            <Search size={16} className="text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search campaigns"
              aria-label="Search campaigns"
              className="w-44 bg-transparent text-[14px] placeholder:text-muted focus:outline-none"
            />
          </div>
          <span className="flex items-center gap-1.5 text-[14px] text-muted">
            <ListFilter size={16} /> Filter
          </span>
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal size={16} className="text-muted" />
            <Select
              aria-label="Sort campaigns"
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="!w-auto !border-0 !py-1 !text-[14px]"
            >
              <option>Newest</option>
              <option>Most raised</option>
              <option>Closest to goal</option>
            </Select>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="mt-7">
          <EmptyState
            title={`No campaigns match "${q}".`}
            body="Try another name, or start your own campaign."
            action={
              <LinkButton href="/fundraising/new" variant="blue">
                Create Support Campaign
              </LinkButton>
            }
          />
        </div>
      ) : (
        <ul className="mt-7 grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </ul>
      )}
    </AppShell>
  );
}
