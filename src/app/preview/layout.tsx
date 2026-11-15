import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import "@/components/common/landing/gouache/gouache.css";

/* Landing previews for client review (Nov 2026 gouache brief). Not indexed.
   The brand faces only: the root layout's Instrument Serif is re-declared
   here with its italic too, for the accent line. */
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Landing preview · Fertility Grove",
  robots: { index: false, follow: false },
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <div className={instrument.variable}>{children}</div>;
}
