"use client";

/* The cosy layer: background atmosphere painted in gouache for Fertility
   Grove. A soft plaster-and-sky wash sits behind a page's header and fades
   into white; one or two painted elements (a hanging orange branch,
   the café awning's lights, a lantern, shutters, rooftops) hang in from the
   edge. The brand's own pictures stay in front; this is only the backdrop.

   Motion is quiet and never touches content. A hanging element is three
   nested layers on co-prime periods so it never visibly repeats: it sways
   from where it's tied (7.3s), its tips flex (4.9s) and it bobs (6.1s).
   Loose leaves and petals drift down now and then. Loops run only while
   on screen and hold still under reduced motion. */

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

const DIR = "/brand/cozy";

type ElementKey = "awning" | "basket" | "birdhouse" | "birds" | "branch" | "branchSide" | "lantern" | "rooftops" | "swing" | "wateringCan";
type Glow = { x: number; y: number; r: number; d?: number };

/* Pixel sizes of the cut-outs, and lights as % of each picture. */
const ELEMENTS: Record<ElementKey, { src: string; w: number; h: number; glows?: Glow[]; drip?: { x: number; y: number } }> = {
  awning: {
    src: `${DIR}/e-awning.webp`,
    w: 1600,
    h: 1079,
    glows: [
      { x: 12.4, y: 67.9, r: 3.2 },
      { x: 21.8, y: 76.7, r: 3.2, d: 0.7 },
      { x: 32.9, y: 82, r: 3.2, d: 1.6 },
      { x: 44.3, y: 82.5, r: 3.2, d: 0.3 },
      { x: 54.8, y: 79.5, r: 3.2, d: 2.1 },
      { x: 64.3, y: 72.8, r: 3.2, d: 1.1 },
      { x: 74.2, y: 81.4, r: 3.2, d: 2.6 },
      { x: 84.5, y: 90.2, r: 3.2, d: 0.9 },
      { x: 96.3, y: 95, r: 3.2, d: 1.9 },
    ],
  },
  basket: { src: `${DIR}/e-basket.webp`, w: 1400, h: 1769 },
  birdhouse: { src: `${DIR}/e-birdhouse.webp`, w: 1400, h: 1594 },
  birds: { src: `${DIR}/e-birds.webp`, w: 1560, h: 1049 },
  branch: { src: `${DIR}/e-branch-hang.webp`, w: 1600, h: 2005 },
  branchSide: { src: `${DIR}/e-branch-side.webp`, w: 1600, h: 885 },
  lantern: { src: `${DIR}/e-lantern.webp`, w: 1600, h: 1855, glows: [{ x: 48.2, y: 82.7, r: 16 }] },
  rooftops: { src: `${DIR}/e-rooftops.webp`, w: 1600, h: 947 },
  swing: { src: `${DIR}/e-swing.webp`, w: 1400, h: 1651 },
  wateringCan: { src: `${DIR}/e-wateringcan.webp`, w: 1400, h: 1711, drip: { x: 10.5, y: 92 } },
};

/** Marks a subtree's ambient loops as running only while it is on screen. */
export function useAmbient<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.setAttribute("data-ambient", e.isIntersecting ? "on" : "off"));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/** One painted element. Position and width come from className; it keeps its
    own proportions. `hang` makes it sway from its top edge (or its right edge
    for a branch reaching in sideways). */
function Element({
  el,
  className,
  hang,
  phase = 0,
  sizes,
}: {
  el: ElementKey;
  className: string;
  hang?: "top" | "right";
  phase?: number;
  sizes: string;
}) {
  const e = ELEMENTS[el];
  const d = { animationDelay: `${-phase}s` };
  return (
    <div className={`absolute ${className}`} style={{ aspectRatio: `${e.w} / ${e.h}` }}>
      <div className={`absolute inset-0 ${hang ? `ambient sway sway-${hang}` : ""}`} style={d}>
        <div className={`absolute inset-0 ${hang ? `ambient bend bend-${hang}` : ""}`} style={d}>
          <div className={`absolute inset-0 ${hang ? "ambient bob" : ""}`} style={d}>
            <Image src={e.src} alt="" fill sizes={sizes} quality={90} className="object-contain" />
            {e.drip &&
              [0, 1.7].map((d) => (
                <span key={d} className="drip ambient" style={{ left: `${e.drip!.x}%`, top: `${e.drip!.y}%`, animationDelay: `${d}s` }} />
              ))}
            {e.glows?.map((g, i) => (
              <span key={i} className="glow ambient" style={{ left: `${g.x}%`, top: `${g.y}%`, width: `${g.r * 2}%`, aspectRatio: "1", animationDelay: `${g.d ?? 0}s` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* The Learn window, in layers: each shutter (box as % of the window) hangs
   behind the frame on its own hinge, and lamplight glows in the glass. */
const SHUTTERS = {
  l: { src: `${DIR}/e-shutter-l.webp`, x: 0.58, y: 6.53, w: 29.41, h: 73.44 },
  r: { src: `${DIR}/e-shutter-r.webp`, x: 69.93, y: 2.09, w: 29.56, h: 77.88 },
};

/** A window someone's home behind: a breeze nudges the shutters on their
    hinges, each on its own beat, and the lamp inside glows and dims. */
function LivelyWindow({ className, sizes }: { className: string; sizes: string }) {
  return (
    <div className={`window-stage absolute ${className}`} style={{ aspectRatio: "1377 / 2007" }}>
      {(["l", "r"] as const).map((k) => {
        const sh = SHUTTERS[k];
        return (
          <span key={k} className={`ambient shutter shutter-${k} absolute`} style={{ left: `${sh.x}%`, top: `${sh.y}%`, width: `${sh.w}%`, height: `${sh.h}%` }}>
            <Image src={sh.src} alt="" fill sizes={sizes} quality={90} className="object-fill" />
          </span>
        );
      })}
      <Image src={`${DIR}/e-window.webp`} alt="" fill sizes={sizes} quality={90} className="object-contain" />
      <Image src={`${DIR}/e-window-glow.webp`} alt="" fill sizes={sizes} quality={90} className="ambient lamp object-contain" />
    </div>
  );
}

/** Notifications' bell on an orange branch. The branch sways like the others;
    the bell hangs from its bow on its own pivot and rings once, a few small
    damped swings, when you arrive with something unread. */
function BellBranch({ className, sizes }: { className: string; sizes: string }) {
  const unread = useStore((s) => s.notifications.some((n) => !n.read));
  const d = { animationDelay: "-1.2s" };
  return (
    <div className={`absolute ${className}`} style={{ aspectRatio: "1400 / 1540" }}>
      <div className="ambient sway sway-top absolute inset-0" style={d}>
        <div className="ambient bend bend-top absolute inset-0" style={d}>
          <Image src={`${DIR}/e-bell-branch.webp`} alt="" fill sizes={sizes} quality={90} className="object-contain" />
          <span className={`bell-ring absolute ${unread ? "is-ringing" : ""}`} style={{ left: "52.64%", top: "63.96%", width: "23.93%", height: "35.52%" }}>
            <Image src={`${DIR}/e-bell-bell.webp`} alt="" fill sizes={sizes} quality={90} className="object-contain" />
          </span>
        </div>
      </div>
    </div>
  );
}

/* Fixed paths so server and client render the same thing. x is % across the
   drift area; kind 0 is a petal, 1 to 6 a loose leaf. */
const DRIFT = [
  { x: 8, kind: 1, s: 22, t: 15, d: 0, dx: 60, spin: 220 },
  { x: 30, kind: 0, s: 9, t: 12, d: 2.4, dx: -40, spin: -260 },
  { x: 52, kind: 3, s: 18, t: 17, d: 6.2, dx: 50, spin: 180 },
  { x: 70, kind: 0, s: 8, t: 13, d: 4.1, dx: 34, spin: 300 },
  { x: 86, kind: 5, s: 20, t: 16, d: 9.5, dx: -56, spin: -200 },
  { x: 44, kind: 0, s: 7, t: 14, d: 11.3, dx: -28, spin: 240 },
];

/** Petals and loose leaves letting go and drifting down, each fluttering
    side to side as it falls. */
function Drift({ leaves = true, petals = true, className = "" }: { leaves?: boolean; petals?: boolean; className?: string }) {
  const items = DRIFT.filter((p) => (p.kind ? leaves : petals));
  return (
    <div aria-hidden className={`pointer-events-none absolute ${className}`}>
      {items.map((p, i) => (
        <span key={i} className="drift-fall ambient" style={{ left: `${p.x}%`, "--t": `${p.t}s`, "--d": `${p.d}s`, "--dx": `${p.dx}px` } as React.CSSProperties}>
          <span className="drift-flutter ambient" style={{ "--spin": `${p.spin}deg`, animationDelay: `${-p.d}s` } as React.CSSProperties}>
            {p.kind ? (
              <Image src={`${DIR}/leaf-${p.kind}.webp`} alt="" width={p.s} height={p.s} className="block object-contain" />
            ) : (
              <span className="petal" style={{ "--s": `${p.s}px` } as React.CSSProperties} />
            )}
          </span>
        </span>
      ))}
    </div>
  );
}

/** The plaster-and-sky wash, fading into white at the bottom. */
function Wash({ priority }: { priority?: boolean }) {
  return <Image src={`${DIR}/wash.webp`} alt="" fill sizes="100vw" quality={90} priority={priority} className="wash-fade object-cover object-top" />;
}

export type SceneKey =
  | "home"
  | "groups"
  | "stories"
  | "learn"
  | "messages"
  | "family"
  | "mentors"
  | "guide"
  | "saved"
  | "notifications"
  | "settings"
  | "help"
  | "profile";

/** Which header backdrop a route opens onto, if any. Index pages, and a single
    group, which stays under the groups list's awning. */
export function sceneFor(path: string): SceneKey | null {
  if (/^\/groups\/[^/]+$/.test(path)) return "groups";
  const map: Record<string, SceneKey> = {
    "/home": "home",
    "/groups": "groups",
    "/stories": "stories",
    "/learn": "learn",
    "/messages": "messages",
    "/family": "family",
    "/mentors": "mentors",
    "/guide": "guide",
    "/saved": "saved",
    "/notifications": "notifications",
    "/settings": "settings",
    "/help": "help",
    "/profile": "profile",
  };
  return map[path] ?? null;
}

/* Three compositions per section. Phones: small, top right. Mid desktop
   (1024 to 1759px), where content fills the width: each element is lifted
   so its best part (the flowering tips, the lit scallops, the lantern) hangs
   into the strip above the title, clear of buttons and cards. Wide screens
   (1760px and up): larger, in the empty margin beside the content. */
const HS = "(min-width: 1760px) 340px, (min-width: 1024px) 240px, 160px";
const WS = "(min-width: 1760px) 560px, (min-width: 1024px) 420px, 260px";

const HEADER: Record<SceneKey, React.ReactNode> = {
  home: (
    <>
      <Element
        el="branch"
        hang="top"
        sizes={HS}
        className="-top-10 -right-6 w-[150px] lg:-top-[112px] lg:right-4 lg:w-[190px] min-[110rem]:-top-16 min-[110rem]:right-2 min-[110rem]:w-[300px]"
      />
      <Drift petals={false} className="inset-y-0 right-0 w-[40%]" />
    </>
  ),
  groups: (
    <Element
      el="awning"
      sizes={WS}
      className="-top-6 -right-10 w-[250px] lg:-top-[84px] lg:-right-10 lg:w-[360px] min-[110rem]:-top-12 min-[110rem]:-right-14 min-[110rem]:w-[460px]"
    />
  ),
  stories: <Drift leaves={false} className="inset-y-0 right-0 w-[45%]" />,
  learn: (
    <>
      <LivelyWindow
        sizes="(min-width: 1760px) 210px, (min-width: 1024px) 170px, 100px"
        className="top-2 right-7 w-[88px] lg:-top-2 lg:right-16 lg:w-[160px] min-[110rem]:top-4 min-[110rem]:right-12 min-[110rem]:w-[200px]"
      />
      <Element
        el="branch"
        hang="top"
        phase={2}
        sizes="(min-width: 1760px) 170px, (min-width: 1024px) 150px, 80px"
        className="-top-8 right-[104px] w-[64px] lg:-top-16 lg:right-[236px] lg:w-[132px] min-[110rem]:-top-16 min-[110rem]:right-[268px] min-[110rem]:w-[156px]"
      />
      <Drift leaves={false} className="top-[30%] right-[5%] bottom-0 w-[12%]" />
    </>
  ),
  messages: (
    <Element
      el="birds"
      hang="top"
      sizes={HS}
      className="top-1 -right-4 w-[150px] lg:-top-5 lg:right-6 lg:w-[210px] min-[110rem]:top-4 min-[110rem]:right-6 min-[110rem]:w-[320px]"
    />
  ),
  family: (
    <>
      <Element
        el="rooftops"
        sizes={WS}
        className="fade-down top-6 -right-6 w-[240px] lg:top-0 lg:-right-4 lg:w-[250px] min-[110rem]:top-0 min-[110rem]:-right-8 min-[110rem]:w-[420px]"
      />
      <Element
        el="branchSide"
        hang="right"
        phase={3.5}
        sizes={HS}
        className="-top-6 -right-8 w-[150px] lg:-top-12 lg:-right-8 lg:w-[220px] min-[110rem]:-top-10 min-[110rem]:-right-10 min-[110rem]:w-[320px]"
      />
    </>
  ),
  mentors: (
    <>
      <Element
        el="branchSide"
        hang="right"
        sizes={WS}
        className="-top-6 -right-12 w-[280px] lg:-top-[96px] lg:-right-12 lg:w-[400px] min-[110rem]:-top-24 min-[110rem]:-right-16 min-[110rem]:w-[520px]"
      />
      <Drift petals={false} className="inset-y-0 right-0 w-[50%]" />
    </>
  ),
  saved: (
    <>
      <Element
        el="basket"
        hang="top"
        phase={1.8}
        sizes={HS}
        className="-top-10 -right-4 w-[130px] lg:-top-[112px] lg:right-6 lg:w-[190px] min-[110rem]:-top-36 min-[110rem]:right-6 min-[110rem]:w-[300px]"
      />
      <Drift petals={false} className="inset-y-0 right-0 w-[40%]" />
    </>
  ),
  notifications: (
    <BellBranch
      sizes={HS}
      className="-top-8 -right-4 w-[130px] lg:-top-[96px] lg:right-6 lg:w-[190px] min-[110rem]:-top-16 min-[110rem]:right-8 min-[110rem]:w-[330px]"
    />
  ),
  settings: (
    <Element
      el="wateringCan"
      hang="top"
      phase={2.6}
      sizes={HS}
      className="-top-10 -right-4 w-[130px] lg:-top-[108px] lg:right-6 lg:w-[190px] min-[110rem]:-top-20 min-[110rem]:right-6 min-[110rem]:w-[330px]"
    />
  ),
  profile: (
    <>
      <Element
        el="swing"
        hang="top"
        phase={3.1}
        sizes={HS}
        className="-top-8 -right-4 w-[130px] lg:-top-[84px] lg:right-6 lg:w-[160px] min-[110rem]:top-0 min-[110rem]:right-10 min-[110rem]:w-[300px]"
      />
      <Drift petals={false} className="inset-y-0 right-0 w-[35%]" />
    </>
  ),
  help: (
    <>
      <Element
        el="birdhouse"
        hang="top"
        phase={0.9}
        sizes={HS}
        className="-top-8 -right-4 w-[130px] lg:-top-[100px] lg:right-6 lg:w-[190px] min-[110rem]:-top-16 min-[110rem]:right-6 min-[110rem]:w-[330px]"
      />
      <Drift leaves={false} className="inset-y-0 right-0 w-[35%]" />
    </>
  ),
  guide: (
    <Element
      el="lantern"
      hang="top"
      sizes={HS}
      className="-top-12 right-0 w-[130px] lg:-top-[92px] lg:right-8 lg:w-[180px] min-[110rem]:-top-20 min-[110rem]:right-10 min-[110rem]:w-[280px]"
    />
  ),
};

/** The painted backdrop behind an app page's header. */
export function HeaderBackdrop({ scene }: { scene: SceneKey }) {
  const ref = useAmbient<HTMLDivElement>();
  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[200px] overflow-hidden lg:h-[400px]">
      <Wash priority />
      {HEADER[scene]}
    </div>
  );
}

/** A backdrop for a landing section or the auth panel: the wash (optional),
    an element and some drift. Fills its positioned parent. */
export function Backdrop({ kind, wash }: { kind: "hero" | "statement" | "partners" | "join" | "auth"; wash?: boolean }) {
  const ref = useAmbient<HTMLDivElement>();
  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {wash && <Wash priority={kind === "hero" || kind === "auth"} />}
      {kind === "hero" && <Drift className="inset-0" />}
      {kind === "statement" && (
        <Element el="branchSide" hang="right" sizes="(min-width: 1024px) 560px, 260px" className="-top-4 -right-12 w-[180px] lg:-top-8 lg:-right-36 lg:w-[420px]" />
      )}
      {kind === "partners" && <Drift leaves={false} className="inset-y-0 right-0 w-[40%]" />}
      {kind === "join" && (
        <>
          <Element el="branch" hang="top" phase={2.5} sizes={HS} className="-top-[72px] right-3 w-[90px] lg:right-auto lg:-top-20 lg:left-10 lg:w-[280px]" />
          <Drift petals={false} className="inset-y-0 right-0 w-[40%] lg:right-auto lg:left-0" />
        </>
      )}
      {kind === "auth" && <Drift className="inset-0" />}
    </div>
  );
}
