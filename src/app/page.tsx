import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";

export const metadata: Metadata = {
  title: "Fertility Grove: a private community for infertility, and partners",
  description:
    "A private, invite-only community for people going through infertility, and their partners. Matched groups, a clinician-reviewed library, mentors and the Grove Guide.",
};

export default function Page() {
  return <Landing />;
}
