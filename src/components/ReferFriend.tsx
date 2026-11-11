"use client";

/* Refer a friend, as sending them seeds. An open envelope waits with a small
   handful of seeds in its mouth. Copying the link plays the whole gesture once:
   the seeds are pushed down into the envelope, the lowest first, the flap folds
   shut, a wax seal presses on, and the envelope lifts away, then a fresh one
   settles in for the next friend.

   The envelope is one painting cut into layers (public/brand/refer/, prompts in
   scripts/art/prompts-refer/): the open flap folds down to edge-on, and the
   closed flap, a separate layer above the pocket, carries on from there, so
   the seeds really go behind the paper. Timings live with the env-* keyframes
   in globals.css. Copying while it plays still copies, without restarting it.
   Under reduced motion it jumps between those states. */

import Image from "next/image";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useAmbient } from "@/components/art/Cozy";
import { Button, useCopy } from "@/components/ui";
import { inviteLink, myInvite } from "@/lib/api";
import { POINTS } from "@/lib/rules/sunlight";
import { useHydrated, useStore } from "@/lib/store";

const DIR = "/brand/refer";

/* The handful, lowest first (the order they go in): centre and tilt in cqw of
   the envelope, how big, and when each is pushed in. The gaps are uneven, like
   fingers working, and every seed funnels toward the middle of the pocket. */
const SEEDS = [
  { x: 50, y: 66, r: 6, size: 1, push: 40, idle: 0 },
  { x: 41, y: 62, r: -22, size: 0.94, push: 130, idle: -1.1 },
  { x: 60, y: 61, r: 20, size: 1.04, push: 190, idle: -2.3 },
  { x: 45.5, y: 53.5, r: -8, size: 1.02, push: 300, idle: -0.6 },
  { x: 55.5, y: 52, r: 14, size: 0.92, push: 380, idle: -1.7 },
];

function Layer({ name, className }: { name: string; className: string }) {
  return <Image src={`${DIR}/${name}.webp`} alt="" fill unoptimized priority className={`object-contain ${className}`} />;
}

/** Used on the last onboarding step and on the Dashboard. The link carries the
    member's fixed invite code, never the handle (PRD §10): a handle can change
    and, 14 days later, belong to someone else. */
export function ReferFriend() {
  const hydrated = useHydrated();
  const origin = hydrated ? window.location.origin : "https://fertilitygrove.com";
  const invite = myInvite(useStore(), origin);
  const link = invite ? inviteLink(invite, origin) : "";
  const [copied, copy] = useCopy();
  const [phase, setPhase] = useState<"rest" | "send" | "back">("rest");
  const [round, setRound] = useState(0);
  const stage = useAmbient<HTMLDivElement>();

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div ref={stage} aria-hidden className="env-stage relative aspect-[720/799] w-[136px] shrink-0">
        <div
          key={round}
          className="env absolute inset-0"
          data-phase={phase}
          onAnimationEnd={(e) => {
            if (e.animationName !== "env-fly") return;
            setRound((r) => r + 1);
            setPhase("back");
          }}
        >
          <div className="env-inner absolute inset-0">
            <Layer name="flap-open" className="env-flap-open" />
            <Layer name="back" className="" />
            {SEEDS.map((seed) => (
              <span
                key={seed.x}
                className={`env-seed ${phase === "send" ? "" : "ambient"}`}
                style={
                  {
                    left: `${seed.x}cqw`,
                    top: `${seed.y}cqw`,
                    "--dx": `${(50 - seed.x) * 0.6}cqw`,
                    "--dy": `${86 - seed.y}cqw`,
                    "--d": `${seed.push}ms`,
                    "--b": `${seed.idle}s`,
                  } as React.CSSProperties
                }
              >
                <Image
                  src="/brand/planting/seed.webp"
                  alt=""
                  width={320}
                  height={530}
                  unoptimized
                  priority
                  className="block h-auto w-full"
                  style={{ transform: `rotate(${seed.r}deg) scale(${seed.size})` }}
                />
              </span>
            ))}
            <Layer name="pocket" className="" />
            <Layer name="flap-closed" className="env-flap-closed" />
            <span className="env-seal">
              <Image src={`${DIR}/seal.webp`} alt="" width={260} height={264} unoptimized priority className="block h-auto w-full" />
            </span>
          </div>
        </div>
      </div>

      <div className="w-full min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-ink">Refer a friend to start growing your tree</p>
        <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">
          Know someone going through this too? Send them some seeds. When they join with your link, your tree gets {POINTS.referral} Sunlight.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate rounded-[10px] bg-raised px-3.5 py-2.5 text-[14px] text-ink-soft" title={link || undefined}>
            {link ? link.replace(/^https?:\/\//, "") : "Getting your link…"}
          </p>
          <Button
            size="sm"
            variant="secondary"
            disabled={!link}
            onClick={() => {
              copy(link);
              setPhase("send");
            }}
          >
            {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
        <p aria-live="polite" className="mt-2 text-[13px] text-muted">
          {phase === "rest" ? "Copy the link, then paste it to a friend." : "Copied. Paste it to a friend to send your seeds."}
        </p>
      </div>
    </div>
  );
}
