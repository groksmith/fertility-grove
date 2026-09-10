"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Heart,
  ListFilter,
  Plus,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { Button, EmptyState, Tag } from "@/components/ui";
import { COMMUNITY_GUIDELINES } from "@/lib/data";
import { COMMUNITY_TABS } from "@/lib/nav";
import { useStore } from "@/lib/store";
import { POST_TYPES, type PostType } from "@/lib/types";

export default function CommunityBoardPage() {
  const { posts, groups } = useStore();
  const [sort, setSort] = useState<"Newest" | "Most liked" | "Most commented">(
    "Newest",
  );
  const [typeFilter, setTypeFilter] = useState<PostType | "All">("All");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const visible = useMemo(() => {
    let list = [...posts];
    if (typeFilter !== "All") list = list.filter((p) => p.type === typeFilter);
    if (sort === "Most liked") list.sort((a, b) => b.likes - a.likes);
    if (sort === "Most commented")
      list.sort((a, b) => b.comments.length - a.comments.length);
    return list;
  }, [posts, sort, typeFilter]);

  const popular = useMemo(
    () => [...posts].sort((a, b) => b.likes - a.likes).slice(0, 4),
    [posts],
  );

  const suggested = groups.filter((g) => !g.joined).slice(0, 3);

  return (
    <AppShell
      section="community"
      tabs={COMMUNITY_TABS}
      rail={<Rail popular={popular} suggested={suggested} />}
    >
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="serif text-[30px]">Community board</h2>

        <Link
          href="/community/new"
          className="order-last flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-green-dark text-[14.5px] font-semibold text-white transition hover:brightness-110 sm:order-none sm:ml-auto sm:w-auto sm:px-4 xl:hidden"
        >
          <Plus size={17} /> Create post
        </Link>

        <div className="flex items-center gap-5 sm:ml-auto xl:ml-auto">
          <div className="relative">
            <button
              onClick={() => {
                setSortOpen((v) => !v);
                setFilterOpen(false);
              }}
              aria-expanded={sortOpen}
              className="flex items-center gap-2 text-[14.5px]"
            >
              <SlidersHorizontal size={17} /> Sort
              <ChevronDown size={14} />
            </button>
            {sortOpen && (
              <ul className="pop-in absolute right-0 top-8 z-10 w-48 rounded-xl border border-line bg-white py-1 shadow-lg">
                {(["Newest", "Most liked", "Most commented"] as const).map((s) => (
                  <li key={s}>
                    <button
                      onClick={() => {
                        setSort(s);
                        setSortOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-[13.5px] hover:bg-surface ${
                        sort === s ? "font-semibold" : ""
                      }`}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setFilterOpen((v) => !v);
                setSortOpen(false);
              }}
              aria-expanded={filterOpen}
              className="flex items-center gap-2 text-[14.5px]"
            >
              <ListFilter size={17} /> Filter
              <ChevronDown size={14} />
            </button>
            {filterOpen && (
              <ul className="pop-in absolute right-0 top-8 z-10 w-56 rounded-xl border border-line bg-white py-1 shadow-lg">
                {(["All", ...POST_TYPES] as const).map((t) => (
                  <li key={t}>
                    <button
                      onClick={() => {
                        setTypeFilter(t as PostType | "All");
                        setFilterOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-[13.5px] hover:bg-surface ${
                        typeFilter === t ? "font-semibold" : ""
                      }`}
                    >
                      {t}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {typeFilter !== "All" && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-[13.5px] text-muted">Filters:</span>
          <button onClick={() => setTypeFilter("All")}>
            <Tag tone="coral">{typeFilter} ✕</Tag>
          </button>
        </div>
      )}

      <div className="mt-6 space-y-7">
        {visible.length === 0 ? (
          <EmptyState
            title="Nothing here yet."
            body="No posts match this filter. Try another post type, or start the conversation yourself."
            action={
              <Button variant="coral" onClick={() => setTypeFilter("All")}>
                Clear filter
              </Button>
            }
          />
        ) : (
          visible.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </div>
    </AppShell>
  );
}

function Rail({
  popular,
  suggested,
}: {
  popular: ReturnType<typeof useStore>["posts"];
  suggested: ReturnType<typeof useStore>["groups"];
}) {
  const [guidelinesOpen, setGuidelinesOpen] = useState(true);
  return (
    <div>
      <Link
        href="/community/new"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-green-dark text-[15px] font-semibold text-white transition hover:brightness-110"
      >
        <Plus size={18} /> Create post
      </Link>

      <section className="mt-8">
        <h3 className="serif flex items-center gap-2 text-[20px]">
          <Users size={17} /> Popular posts this week
        </h3>
        <ul className="mt-4 space-y-5">
          {popular.map((p) => (
            <li key={p.id}>
              <p className="text-[12.5px] text-muted">from {p.community} community</p>
              <p className="serif mt-0.5 text-[19px] leading-tight">{p.title}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted">
                <Heart size={13} /> {p.likes} likes
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-9">
        <h3 className="serif flex items-center gap-2 text-[20px]">
          <Users size={17} /> Suggested groups for you
        </h3>
        <ul className="mt-3 space-y-2.5">
          {suggested.map((g) => (
            <li key={g.id}>
              <Link
                href={`/community/groups/${g.id}`}
                className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-[14px] transition hover:bg-surface"
              >
                {g.name}
                <ChevronRight size={16} className="text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-9">
        <button
          onClick={() => setGuidelinesOpen((v) => !v)}
          aria-expanded={guidelinesOpen}
          className="serif flex w-full items-center gap-2 text-[20px]"
        >
          <ListFilter size={17} /> Community Guidelines
          <ChevronDown
            size={16}
            className={`ml-auto transition ${guidelinesOpen ? "rotate-180" : ""}`}
          />
        </button>
        {guidelinesOpen && (
          <ul className="mt-3 space-y-3.5">
            {COMMUNITY_GUIDELINES.map((g) => (
              <li key={g.title}>
                <p className="text-[13.5px] font-semibold">{g.title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
                  {g.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
