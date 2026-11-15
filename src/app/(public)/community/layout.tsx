import type { Metadata } from "next";

/* The public feed and public group pages may be listed by search engines
   (PRD v1.2 §10). Guest pages load no ad or tracking pixels (§21). */
export const metadata: Metadata = {
  title: "From the community · Fertility Grove",
  description: "Posts members of Fertility Grove chose to share with everyone.",
  robots: { index: true, follow: true },
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
