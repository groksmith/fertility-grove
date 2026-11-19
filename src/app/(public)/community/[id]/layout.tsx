import type { Metadata } from "next";
import { listedGroup } from "@/features/groups/server";

/* A public group page may be listed while the group is visible to guests
   (PRD v1.2 §10). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const group = listedGroup(id);
  if (group) {
    return {
      title: `${group.name} · Fertility Grove`,
      description: group.description,
      robots: { index: true, follow: true },
    };
  }
  return { title: "Fertility Grove", robots: { index: false, follow: false } };
}

export default function PublicGroupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
