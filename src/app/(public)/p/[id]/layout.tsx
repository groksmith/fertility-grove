import type { Metadata } from "next";
import { listedPostTitle } from "@/features/posts/server";

/* Search engines (PRD v1.2 §10): a post shown to visitors may be listed; a
   post shared by link only, or one that isn't available, may not. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const title = listedPostTitle(id);
  if (title) {
    return { title: `${title} · Fertility Grove`, robots: { index: true, follow: true } };
  }
  return { title: "A post on Fertility Grove", robots: { index: false, follow: false } };
}

export default function PublicPostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
