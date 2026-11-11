import type { Metadata } from "next";
import { GROUPS } from "@/lib/data/groups";
import { groupOpenToGuests } from "@/lib/rules/guests";

/* A public group page may be listed while the group is visible to guests
   (PRD v1.2 §10). TODO(api): ask the public group endpoint. */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const group = GROUPS.find((g) => g.id === id);
  if (group && groupOpenToGuests(group)) {
    return { title: `${group.name} · Fertility Grove`, description: group.description, robots: { index: true, follow: true } };
  }
  return { title: "Fertility Grove", robots: { index: false, follow: false } };
}

export default function PublicGroupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
