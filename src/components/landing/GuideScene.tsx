"use client";

/* The Grove Guide's picture, close up: a lantern hanging from a low orange
   branch, lighting the path that winds away below it. The card's blue is the
   sky between them. The scene is one painting filling the card; the lantern, its
   beam and the pool of light on the path are layers over it, swinging together
   from the knot on the branch (origin 45% 28.5% of the scene). The light comes
   on as the card arrives (.guide-light), and loops run only while the card is
   on screen. */

import Image from "next/image";
import { useAmbient } from "@/components/art/Cozy";

export function GuideScene({ delay = 0 }: { delay?: number }) {
  const ref = useAmbient<HTMLSpanElement>();
  const light = { transitionDelay: `${delay + 320}ms` };
  return (
    <span ref={ref} className="absolute inset-0 block">
      <Image src="/brand/landing/way-guide-closeup.webp" alt="" fill sizes="(min-width: 1024px) 300px, 50vw" quality={90} className="object-cover" />

      <span className="guide-swing ambient absolute inset-0 block origin-[45%_28.5%]">
        {/* The beam, then the pool it makes on the path. */}
        <span
          className="guide-light absolute inset-0 block"
          style={{
            ...light,
            clipPath: "polygon(38% 60%, 52% 60%, 76% 80%, 22% 80%)",
            background: "linear-gradient(180deg, transparent 59%, rgb(255 222 150 / 0.6) 61%, rgb(255 196 110 / 0) 80%)",
          }}
        />
        <span
          className="guide-light absolute block rounded-[50%] mix-blend-screen"
          style={{ ...light, left: "22%", top: "68%", width: "54%", height: "16%", background: "radial-gradient(closest-side, rgb(255 222 150 / 0.7), rgb(255 196 110 / 0.28) 55%, transparent)" }}
        />

        <span className="absolute block -translate-x-1/2" style={{ left: "45%", top: "28.2%", height: "33%", aspectRatio: "220 / 553" }}>
          <Image src="/brand/landing/way-guide-lantern.webp" alt="" fill unoptimized className="object-contain" />
        </span>
        <span className="guide-light absolute inset-0 block" style={light}>
          <span className="glow ambient" style={{ left: "45%", top: "51%", width: "50%", aspectRatio: "1" }} />
        </span>
      </span>
    </span>
  );
}
