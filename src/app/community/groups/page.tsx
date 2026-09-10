"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button, EmptyState } from "@/components/ui";
import { COMMUNITY_TABS } from "@/lib/nav";
import { useStore } from "@/lib/store";

export default function GroupsPage() {
  const { groups, toggleGroup } = useStore();
  const [q, setQ] = useState("");

  const filtered = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(q.toLowerCase()) ||
      g.description.toLowerCase().includes(q.toLowerCase()),
  );

  const mine = filtered.filter((g) => g.joined);
  const rest = filtered.filter((g) => !g.joined);

  return (
    <AppShell section="community" tabs={COMMUNITY_TABS} wide>
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="serif text-[30px]">Groups</h2>
        <div className="ml-auto flex w-full max-w-sm items-center gap-2.5 rounded-xl border border-line-strong px-4 py-2.5">
          <Search size={17} className="text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search groups..."
            aria-label="Search groups"
            className="w-full bg-transparent text-[14px] placeholder:text-muted focus:outline-none"
          />
        </div>
      </div>

      {mine.length > 0 && (
        <>
          <h3 className="mt-8 text-[15px] font-semibold text-muted">
            Groups you&rsquo;re in
          </h3>
          <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {mine.map((g) => (
              <GroupCard key={g.id} group={g} onToggle={() => toggleGroup(g.id)} />
            ))}
          </div>
        </>
      )}

      <h3 className="mt-10 text-[15px] font-semibold text-muted">
        Discover more groups
      </h3>
      {rest.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title={`No groups match "${q}".`}
            body="Try a different word, or browse everything by clearing your search."
            action={<Button onClick={() => setQ("")}>Clear search</Button>}
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rest.map((g) => (
            <GroupCard key={g.id} group={g} onToggle={() => toggleGroup(g.id)} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function GroupCard({
  group,
  onToggle,
}: {
  group: ReturnType<typeof useStore>["groups"][number];
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-line p-5 transition hover:shadow-[0_10px_30px_-16px_rgba(0,0,0,0.25)]">
      <div
        className="mb-4 h-16 w-16 rounded-xl"
        style={{ background: group.color }}
      />
      <Link href={`/community/groups/${group.id}`} className="text-[17px] font-bold">
        {group.name}
      </Link>
      <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-muted">
        {group.description}
      </p>
      <p className="mt-4 flex items-center gap-1.5 text-[13px] text-muted">
        <Users size={14} /> {group.members.toLocaleString()} members
      </p>
      <div className="mt-4">
        <Button
          variant={group.joined ? "outline" : "greenDark"}
          size="sm"
          onClick={onToggle}
        >
          {group.joined ? "Leave group" : "Join group"}
        </Button>
      </div>
    </div>
  );
}
