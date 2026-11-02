import { GroupCover } from "@/components/art/Brand";
import { AppIcon, Logo, LogoOrange } from "@/components/Logo";
import { OnboardingScene, Spot, type SpotKind } from "@/components/art/Scenes";
import { TreeArt, TreeGlyph } from "@/components/art/Tree";
import { GROUPS } from "@/lib/data/groups";
import type { TreeLevel } from "@/lib/types";

export const metadata = { title: "Illustration sheet · Fertility Grove", robots: { index: false } };

const LEVELS: TreeLevel[] = ["Seed", "Bush", "Tree", "Blossom Tree", "Orange Tree"];
const SPOTS: SpotKind[] = ["canopy", "plate", "lantern", "birds", "blossom", "shelter", "roots", "seeds", "sun", "sprout", "seedlings", "lens", "bud", "bookmark", "envelope"];

/** Internal reference sheet for the illustration system. */
export default function ArtSheet() {
  return (
    <main className="mx-auto max-w-[1200px] px-6 py-12">
      <h1 className="serif text-[44px]">Illustration sheet</h1>
      <div className="mt-6 flex items-center gap-6">
        <Logo height={56} />
        <LogoOrange size={40} />
        <AppIcon size={48} />
      </div>
      <h2 className="mt-12 text-[20px] font-semibold">Tree levels</h2>
      <div className="mt-4 flex flex-wrap items-end gap-6">
        {LEVELS.map((l) => (
          <figure key={l} className="rounded-[20px] border border-line bg-panel p-4 text-center">
            <TreeArt level={l} size={180} />
            <figcaption className="mt-2 flex items-center justify-center gap-1.5 text-[14px]">
              <TreeGlyph level={l} /> {l}
            </figcaption>
          </figure>
        ))}
      </div>
      <h2 className="mt-12 text-[20px] font-semibold">Onboarding scene, steps 1 to 8</h2>
      <div className="mt-4 grid grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
          <OnboardingScene key={s} step={s} className="w-full rounded-[20px]" />
        ))}
      </div>
      <h2 className="mt-12 text-[20px] font-semibold">Spots</h2>
      <div className="mt-4 grid grid-cols-5 gap-4">
        {SPOTS.map((k) => (
          <figure key={k} className="rounded-[20px] border border-line bg-panel p-3 text-center">
            <Spot kind={k} size={180} />
            <figcaption className="text-[13px] text-muted">{k}</figcaption>
          </figure>
        ))}
      </div>
      <h2 className="mt-12 text-[20px] font-semibold">Group covers</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {GROUPS.map((g) => (
          <GroupCover key={g.id} group={g} size={72} />
        ))}
      </div>
    </main>
  );
}
