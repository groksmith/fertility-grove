"use client";

/* The short level-up celebration (PRD §13): the new tree grows in, and the
   copy says what the level unlocks. Reaching Blossom Tree opens mentoring. */

import { useRouter } from "next/navigation";
import { TreeArt } from "@/components/art/Tree";
import { act, useStore } from "@/lib/store";
import { LEVELS, nextLevel } from "@/lib/rules/sunlight";
import { Button, Dialog } from "./ui";

export function LevelUp() {
  const level = useStore((s) => s.pendingLevelUp);
  const sunlight = useStore((s) => s.me.sunlight);
  const router = useRouter();
  if (!level) return null;
  const info = LEVELS.find((l) => l.level === level)!;
  const next = nextLevel(level);
  const close = () => act.settings.acknowledgeLevelUp();
  return (
    <Dialog open onClose={close} title={level === "Seed" ? "You planted your Seed" : `You grew into a ${level}`} width={460}>
      <div className="-mt-2 flex flex-col items-center text-center">
        <div className="grid place-items-center rounded-[20px] bg-white p-2">
          <TreeArt level={level} size={200} animate title={level} />
        </div>
        <p className="mt-4 text-[16px] leading-relaxed text-ink">{info.unlocks}</p>
        <p className="mt-1 text-[14px] text-muted">
          {level === "Seed"
            ? "Your tree grows with Sunlight: each time another member finds you helpful."
            : next
              ? `${(next.at - sunlight).toLocaleString()} more Sunlight to ${next.level}.`
              : "You've reached the top of the grove."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {level === "Blossom Tree" ? (
            <>
              <Button
                data-autofocus
                onClick={() => {
                  close();
                  router.push("/mentors/setup");
                }}
              >
                Set up mentoring
              </Button>
              <Button variant="ghost" onClick={close}>
                Later
              </Button>
            </>
          ) : (
            <Button data-autofocus onClick={close}>
              Keep growing
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
