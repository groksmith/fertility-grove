import type { Metadata } from "next";

/* Public post links are never indexed by search engines (PRD §10). */
export const metadata: Metadata = {
  title: "A post on Fertility Grove",
  robots: { index: false, follow: false },
};

export default function PublicPostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
