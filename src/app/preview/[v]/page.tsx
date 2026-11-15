import { Landing } from "@/components/common/landing/Landing";
import {
  type GouacheVersion,
  LandingGouache,
} from "@/components/common/landing/gouache/LandingGouache";
import { LandingRiviera } from "@/components/common/landing/gouache/LandingRiviera";
import { VersionSwitch } from "@/components/common/landing/gouache/VersionSwitch";
import { notFound } from "next/navigation";

/* /preview/original is the live landing exactly as it is on /. /preview/a, b
   and c are the gouache versions; d is the Riviera styling on a new layout. */
const VERSIONS = ["original", "a", "b", "c", "d"] as const;

export function generateStaticParams() {
  return VERSIONS.map((v) => ({ v }));
}

export default async function PreviewPage({ params }: { params: Promise<{ v: string }> }) {
  const { v } = await params;
  if (!(VERSIONS as readonly string[]).includes(v)) notFound();
  return (
    <>
      {v === "original" ? (
        <Landing />
      ) : v === "d" ? (
        <LandingRiviera />
      ) : (
        <LandingGouache v={v as GouacheVersion} />
      )}
      <VersionSwitch current={v} />
    </>
  );
}
