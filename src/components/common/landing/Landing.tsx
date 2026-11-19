"use client";

/* The public landing page, in the voice of fertilitygrove.com: white ground,
   the orange logo, the brand's watercolour orange trees and the near-black
   pill. One motif runs it: the orange's circle masks every picture and marks
   every list, and the tree grows from Seed to Orange Tree down the page.
   The hero is one painted Riviera grove (a travel poster); the bands below
   are flat tints with straight edges (sky, sage, blush) or the plain grey,
   and orange branches and blossom hang in at a few section edges. */

import {
  AtSign,
  Download,
  EyeOff,
  type Lock,
  Menu as MenuIcon,
  ShieldCheck,
  Sprout,
  UsersRound,
  X,
} from "lucide-react";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Backdrop } from "@/components/art/Cozy";
import { STAGE_SRC, TreeArt } from "@/components/art/Tree";
import { Logo, LogoOrange } from "@/components/icons/Logo";
import { GROUPS } from "@/features/groups";
import { ARTICLES, articleCover } from "@/features/learn";
import { hueInk } from "@/lib/hue";
import { useStore } from "@/lib/mock-server";
import { LEVELS } from "@/lib/rules/sunlight";
import { GuideScene } from "./GuideScene";

/* ------------------------------------------------------------- Motion */

/** Section parts rise into place once as they enter. Content is visible
 *  without script: the hidden starting state only applies after mount. */
function useReveal() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("reveal-ready");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.in = "";
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    for (const el of document.querySelectorAll("[data-reveal]")) io.observe(el);
    return () => {
      io.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);
}

/* -------------------------------------------------------------- Pieces */

function OrangeDot() {
  return (
    <span
      aria-hidden
      className="mt-[0.45em] inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-brand"
    />
  );
}

function PillButton({
  href,
  children,
  tone = "dark",
}: {
  href: string;
  children: React.ReactNode;
  tone?: "dark" | "light";
}) {
  return (
    <Link
      href={href}
      className={`press inline-flex h-12 items-center justify-center rounded-full px-7 text-[16px] font-semibold ${
        tone === "dark"
          ? "bg-accent text-white hover:bg-black"
          : "border border-line-strong bg-white text-ink hover:border-ink"
      }`}
    >
      {children}
    </Link>
  );
}

/** Leaving the hero is walking down the path: as you scroll, the painting moves
 *  slower than the page and eases further forward inside its frame, and the
 *  words rise and fade a little faster, so the text clears first. One scroll
 *  listener, one frame at a time, transform and opacity only; off under
 *  reduced motion. */
function useLeaveHero() {
  const hero = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const h = hero.current?.offsetHeight || 1;
      const p = Math.min(1, Math.max(0, window.scrollY / h));
      if (scene.current)
        scene.current.style.transform = `translate3d(0, ${(p * h * 0.32).toFixed(1)}px, 0) scale(${(1 + p * 0.07).toFixed(4)})`;
      if (copy.current) {
        copy.current.style.transform = `translate3d(0, ${(-p * 90).toFixed(1)}px, 0)`;
        copy.current.style.opacity = String(Math.max(0, 1 - p * 2.2));
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return [hero, scene, copy] as const;
}

/* ------------------------------------------------------------- Navbar */

const NAV = [
  { id: "groups", label: "How it works" },
  { id: "learn", label: "Library" },
  { id: "grow", label: "Your tree" },
  { id: "partners", label: "Partners" },
];

/** Glide to a section (instantly under reduced motion) and keep the URL. */
function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
}

/** The site bar. It sits clear on the hero's painted wash, then once you
    scroll it pins as soft white with a hairline, marking the section you're
    in. Phones get a menu panel. */
function SiteNav() {
  const signedIn = useStore((s) => s.signedIn && s.step >= 9);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>();
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e?.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The section whose top has passed the bar is the one you're reading.
  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.id)).filter((x): x is HTMLElement => !!x);
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (seen[0]) setActive(seen[0].target.id);
      },
      { rootMargin: "-80px 0px -55% 0px" },
    );
    for (const x of els) io.observe(x);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open]);

  const solid = scrolled || open;
  return (
    <>
      <div ref={sentinel} aria-hidden className="absolute top-0 h-px w-px" />
      <nav
        aria-label="Site"
        className={`site-nav sticky top-0 z-50 -mb-20 ${solid ? "bg-white/90 shadow-[0_1px_0_var(--line)] backdrop-blur-md" : "bg-transparent"}`}
      >
        <div className="mx-auto flex h-20 max-w-[1440px] items-center gap-6 px-5 sm:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <Link
            href="/"
            aria-label="Fertility Grove home"
            className="shrink-0 justify-self-start"
            onClick={() => setOpen(false)}
          >
            <Logo height={42} priority />
          </Link>
          <ul className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  aria-current={active === n.id ? "location" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(n.id);
                  }}
                  className={`press inline-flex h-10 items-center rounded-full px-4 text-[15px] font-semibold transition-colors duration-150 ${
                    active === n.id ? "bg-ink/5 text-ink" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {n.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href="/community"
                className="press inline-flex h-10 items-center rounded-full px-4 text-[15px] font-semibold text-ink-soft transition-colors duration-150 hover:text-ink"
              >
                Read posts
              </Link>
            </li>
            <li>
              <Link
                href="/help"
                className="press inline-flex h-10 items-center rounded-full px-4 text-[15px] font-semibold text-ink-soft transition-colors duration-150 hover:text-ink"
              >
                Help
              </Link>
            </li>
          </ul>
          <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:justify-self-end">
            {signedIn ? (
              <Link
                href="/feed"
                className="press inline-flex h-10 items-center rounded-full bg-accent px-5 text-[15px] font-semibold text-white hover:bg-black"
              >
                Your grove
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="press inline-flex h-10 items-center rounded-full px-4 text-[15px] font-semibold text-ink hover:bg-ink/5"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="press hidden h-10 items-center rounded-full bg-accent px-5 text-[15px] font-semibold text-white hover:bg-black sm:inline-flex"
                >
                  Create account
                </Link>
              </>
            )}
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((o) => !o)}
              className="press grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-ink/5 lg:hidden"
            >
              {open ? <X size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>
        {open && (
          <div
            id="site-menu"
            className="rise border-t border-line bg-white px-5 pt-3 pb-6 sm:px-8 lg:hidden"
          >
            <ul className="flex flex-col">
              {NAV.map((n) => (
                <li key={n.id}>
                  <a
                    href={`#${n.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(false);
                      goTo(n.id);
                    }}
                    className="flex h-12 items-center text-[17px] font-semibold text-ink"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  href="/community"
                  className="flex h-12 items-center text-[17px] font-semibold text-ink"
                >
                  Read posts
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="flex h-12 items-center text-[17px] font-semibold text-ink"
                >
                  Help
                </Link>
              </li>
            </ul>
            {!signedIn && (
              <Link
                href="/signup"
                className="press mt-3 inline-flex h-12 w-full items-center justify-center rounded-full bg-accent text-[16px] font-semibold text-white"
              >
                Create account
              </Link>
            )}
          </div>
        )}
      </nav>
    </>
  );
}

/* ------------------------------------------------------------- Hero */

/* The hero art. Pick one entry for HERO; the others stay for comparison.
   `immersive` stands you on the path deep inside a dense grove, canopies
   meeting overhead and fruit close enough to touch, the rows opening onto a
   pale morning haze where the words sit (prompt in
   scripts/art/prompts-gouache/hero-immersive-path.txt). Phones get a portrait
   painting of the same scene. `poster` is the earlier wide Riviera view
   (hero-poster-brand.txt), kept so it can come back by changing one word. */
const HERO_ART = {
  immersive: {
    wide: { src: "/assets/brand/gouache/grove-immersive-v2.webp", width: 2752, height: 1536 },
    tall: { src: "/assets/brand/gouache/grove-immersive-tall-v2.webp", width: 1536, height: 2752 },
    position: { wide: "50% 40%", tall: "50% 65%" },
    glow: true,
  },
  immersiveAlt: {
    wide: { src: "/assets/brand/gouache/grove-immersive-alt.webp", width: 2752, height: 1536 },
    tall: { src: "/assets/brand/gouache/grove-immersive-tall-v2.webp", width: 1536, height: 2752 },
    position: { wide: "50% 40%", tall: "50% 65%" },
    glow: true,
  },
  poster: {
    wide: { src: "/assets/brand/gouache/grove-poster.webp", width: 3168, height: 1344 },
    tall: { src: "/assets/brand/gouache/grove-poster.webp", width: 3168, height: 1344 },
    position: { wide: "50% 88%", tall: "50% 88%" },
    glow: false,
  },
} as const;
const HERO = HERO_ART.immersive;

/** The painting, art-directed by the screen's shape: the wide view on
    landscape screens, the portrait view on portrait ones (phones, tablets
    held upright), so the haze where the words sit is always in view. */
function HeroPicture() {
  const common = { alt: "", sizes: "100vw", quality: 90, priority: true } as const;
  const {
    props: { srcSet: wide },
  } = getImageProps({ ...common, ...HERO.wide });
  const {
    props: { srcSet: _tall, ...img },
  } = getImageProps({ ...common, ...HERO.tall });
  return (
    <picture>
      <source media="(min-aspect-ratio: 1/1)" srcSet={wide} />
      {/* biome-ignore lint/a11y/useAltText: alt="" comes from getImageProps; the painting is decorative */}
      <img
        {...img}
        className="hero-art breathe absolute inset-0 h-full w-full object-cover"
        style={
          {
            "--pos-wide": HERO.position.wide,
            "--pos-tall": HERO.position.tall,
          } as React.CSSProperties
        }
      />
    </picture>
  );
}

/** The hero: you stand inside the grove, the words in the light where the rows
    open. A soft morning haze along the top keeps the site bar and logo on a
    light ground, and a sunlit glow behind the words keeps them readable over
    the leaves at every width; both belong to the painting, not the UI. Privacy
    has its own section further down, before Join. */
function Hero() {
  const [heroBox, scene, copy] = useLeaveHero();
  return (
    <header className="relative overflow-hidden bg-white">
      <div
        ref={heroBox}
        className="relative h-[var(--hero-h)]"
        style={{ "--hero-h": "max(700px, 100svh)" } as React.CSSProperties}
      >
        {/* The frame stays put and clips; only the painting inside it eases down
            as you scroll, so it never slides over the band below. */}
        <div aria-hidden className="absolute inset-0 overflow-hidden">
          <div ref={scene} className="absolute inset-0">
            <HeroPicture />
          </div>
          {HERO.glow && <div className="hero-haze absolute inset-x-0 top-0 h-40" />}
        </div>

        <div
          ref={copy}
          className={`absolute inset-x-0 z-10 flex items-center justify-center px-5 sm:px-8 ${HERO.glow ? "hero-copy" : "top-20 bottom-[46%]"}`}
        >
          <div className="relative text-center">
            {/* The sunlit glow travels with the words, so they keep their light
                ground while they rise and fade on scroll. */}
            {HERO.glow && (
              <div
                aria-hidden
                className="hero-glow pointer-events-none absolute top-[56%] left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2"
              />
            )}
            <p className="serif hero-kicker text-[30px] leading-none text-ink-soft italic sm:text-[36px]">
              Welcome to the grove
            </p>
            <h1 className="serif hero-h1 mx-auto mt-3 max-w-[24ch] text-[36px] leading-[1.05] tracking-[-0.01em] text-balance text-ink sm:text-[48px] sm:leading-[1.04] lg:max-w-[28ch] xl:text-[60px] xl:leading-[1.02]">
              The first purpose built platform for the fertility community.
            </h1>
            <p className="mx-auto mt-5 max-w-[46ch] text-[18px] md:portrait:max-w-[38ch] leading-relaxed text-pretty text-ink-soft sm:text-[20px]">
              A private community for people going through infertility, and their partners.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <PillButton href="/signup">Create account</PillButton>
              <PillButton href="/login" tone="light">
                Sign in
              </PillButton>
            </div>
            <p className="mt-4 text-[14px] text-ink">
              Invite-only during the beta.
              <br />
              Ask a member for their invite link, or{" "}
              <Link
                href="/community"
                className="font-semibold text-ink underline underline-offset-2"
              >
                read posts members shared
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

/* The privacy section: the promises in full, each a pill with a
   small outline icon, beside one round painting of a padlocked garden gate
   (public/assets/brand/gouache/privacy-gate-round.webp, prompt in
   scripts/art/prompts-gouache/privacy-lock-round-brand.txt). Every promise is
   one the product already makes (PRODUCT.md, the privacy page). */
const PROMISES: { text: string; Icon: typeof Lock }[] = [
  { text: "You post under a handle", Icon: AtSign },
  { text: "No ad trackers, ever", Icon: EyeOff },
  { text: "Health data never sold", Icon: ShieldCheck },
  { text: "Success stories kept apart", Icon: Sprout },
  { text: "Partners see only what you share", Icon: UsersRound },
  { text: "Download or delete everything", Icon: Download },
];

function PrivacySection() {
  return (
    <section id="privacy" aria-labelledby="privacy-h" className="scroll-mt-20 bg-raised">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:py-32">
        <div className="lg:col-span-6">
          <h2
            id="privacy-h"
            className="serif text-[44px] leading-[1] text-balance lg:text-[56px]"
            data-reveal
          >
            Your story stays yours
          </h2>
          <p
            className="mt-6 max-w-[54ch] text-[18px] leading-relaxed text-pretty text-ink-soft"
            data-reveal
          >
            Fertility Grove is private by default, and you decide what anyone else sees. You post
            under a handle unless you choose to show your first name and last initial, and your
            health data is never sold.
          </p>
          <ul className="mt-8 flex flex-wrap gap-2.5" aria-label="Our privacy promises">
            {PROMISES.map(({ text, Icon }, i) => (
              <li
                key={text}
                data-reveal
                style={{ transitionDelay: `${i * 60}ms` }}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-[14px] font-semibold text-ink"
              >
                <Icon aria-hidden size={16} strokeWidth={1.75} className="shrink-0 text-ink-soft" />
                {text}
              </li>
            ))}
          </ul>
          <p
            className="mt-8 max-w-[54ch] text-[16px] leading-relaxed text-pretty text-ink-soft"
            data-reveal
          >
            Partners join with an account of their own, and nothing passes between you until you
            share it. You can download or delete everything at any time.
          </p>
          <p className="mt-6 text-[16px] text-ink-soft" data-reveal>
            Questions about privacy? Read the{" "}
            <Link href="/privacy" className="font-semibold text-ink underline underline-offset-2">
              Privacy Policy
            </Link>{" "}
            and the{" "}
            <Link
              href="/privacy#health-data"
              className="font-semibold text-ink underline underline-offset-2 sm:whitespace-nowrap"
            >
              Consumer Health Data Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div
          className="relative mx-auto aspect-square w-full max-w-[360px] lg:col-span-5 lg:col-start-8 lg:max-w-[480px]"
          data-reveal
        >
          <div className="absolute inset-0 rounded-full bg-[var(--tint-yellow)]" />
          <div className="absolute inset-[9%] overflow-hidden rounded-full">
            <Image
              src="/assets/brand/gouache/privacy-gate-round.webp"
              alt="A brass padlock closed on a garden gate, under a branch of ripe oranges and blossom"
              fill
              sizes="(min-width: 1024px) 400px, 300px"
              quality={90}
              className="drift object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* The promise in three lines of type. From tablet up the type scales with
   the window so each stays one line; on a phone each wraps. The lines rise in
   turn, the gaps tightening a little so they read as one breath. */
function Statement() {
  const line = "block md:whitespace-nowrap";
  return (
    <section aria-label="What you get" className="relative px-5 py-32 sm:px-8 lg:py-56">
      <Backdrop kind="statement" />
      <p className="serif relative text-center text-[clamp(30px,8.4vw,44px)] leading-[1.15] text-balance text-ink md:text-[4vw] min-[100rem]:text-[60px]">
        <span data-reveal className={line}>
          Tell us where you are once.
        </span>
        <span data-reveal className={`${line} mt-4 lg:mt-7`} style={{ transitionDelay: "130ms" }}>
          Meet people on your path, answers a clinician reviewed,
        </span>
        <span data-reveal className={`${line} mt-4 lg:mt-7`} style={{ transitionDelay: "230ms" }}>
          and someone who&apos;s been there.
        </span>
      </p>
    </section>
  );
}

/* Each way in has its own painted subject (public/assets/brand/landing/way-*.webp,
   prompts in scripts/art/prompts-ways/): a bench under an orange tree, two
   mugs and an open notebook left on it (mentors: someone sits with you and
   talks it through), saplings gathered close (groups), a lantern hung from
   a branch, lighting a winding path (the Guide, showing you the way), a ripe orange under
   a glass cloche (success stories, kept in their own space), two trees
   entwined in one pot (family), and the brand's own tree (your tree). */
const SPECIMENS: {
  name: string;
  fact: string;
  art: string;
  bg: string;
  wide?: boolean;
  bleed?: boolean;
}[] = [
  {
    name: "Mentors who've been there",
    fact: "Experienced members mentor for free. No application, just time in the grove.",
    art: "/assets/brand/landing/way-mentors-bench.webp",
    bg: "var(--tint-purple)",
    wide: true,
    bleed: true,
  },
  {
    name: "Matched groups",
    fact: "Join up to five groups chosen for your diagnosis and stage, each with the reason why.",
    art: "/assets/brand/landing/way-groups.webp",
    bg: "var(--tint-pink)",
  },
  {
    name: "The Grove Guide",
    fact: "Ask anything. It answers only from reviewed articles and shows its sources.",
    art: "guide",
    bg: "var(--tint-blue)",
  },
  {
    name: "Success stories, kept apart",
    fact: "Hope when you want it. Pregnancy news stays in its own space.",
    art: "/assets/brand/landing/way-stories.webp",
    bg: "var(--tag-pink-bg)",
    wide: true,
  },
  {
    name: "A family space",
    fact: "Share a question list or a note with your partner, only when you choose.",
    art: "/assets/brand/landing/way-family.webp",
    bg: "var(--tint-neutral)",
  },
  {
    name: "Your tree",
    fact: "Grow from Seed to Orange Tree each time someone finds you helpful.",
    art: "tree",
    bg: "var(--tint-green)",
  },
];

function Specimens() {
  return (
    <section
      id="groups"
      aria-labelledby="spec-h"
      className="scroll-mt-24 mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-5 pb-24 sm:px-8 lg:grid-cols-12 lg:pb-36"
    >
      <div className="lg:col-span-3" data-reveal>
        <h2 id="spec-h" className="serif text-[44px] leading-[1] lg:text-[56px]">
          Six ways in
        </h2>
        <p className="mt-4 max-w-[30ch] text-[16px] leading-relaxed text-ink-soft">
          Groups, answers, mentors and your partner, so this isn&apos;t one more thing to juggle.
        </p>
      </div>
      {/* biome-ignore lint/a11y/noRedundantRoles: role="list" restores list semantics that Safari/VoiceOver drop under list-style: none; do not remove */}
      <ul className="grid grid-cols-2 gap-2.5 lg:col-span-9 lg:grid-cols-4" role="list">
        {SPECIMENS.map((s, i) => (
          <li
            key={s.name}
            data-reveal
            style={{ transitionDelay: `${i * 70}ms` }}
            className={s.wide ? "col-span-2" : ""}
          >
            <div
              className={`relative grid place-items-center overflow-hidden rounded-[20px] px-4 pt-6 ${s.wide ? "aspect-[8/5]" : "aspect-[4/5]"}`}
              style={{ background: s.bg }}
            >
              {s.art === "tree" ? (
                <TreeArt level="Orange Tree" size={170} />
              ) : s.art === "guide" ? (
                <GuideScene delay={i * 70} />
              ) : s.bleed ? (
                // A close-up: the canopy runs off the card's top and sides.
                <span className="absolute inset-x-0 bottom-[5%] block aspect-[1400/906]">
                  <Image
                    src={s.art}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 520px, 100vw"
                    quality={90}
                    className="object-contain"
                  />
                </span>
              ) : (
                <span
                  className={`relative block ${s.wide ? "h-[74%] w-[60%]" : "h-[66%] w-[84%]"}`}
                >
                  <Image
                    src={s.art}
                    alt=""
                    fill
                    sizes={
                      s.wide ? "(min-width: 1024px) 320px, 60vw" : "(min-width: 1024px) 200px, 40vw"
                    }
                    quality={90}
                    className="object-contain"
                  />
                </span>
              )}
            </div>
            <h3 className="mt-3 text-[20px] font-semibold">{s.name}</h3>
            <p className="mt-1 text-[16px] leading-relaxed text-ink-soft">{s.fact}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* The live thing: pick where you are, see where you'd land. */
type Stage = {
  stage: string;
  line: string;
  photo: string;
  alt: string;
  groups: string[];
  article: string;
};

// A non-empty tuple, so STAGES[0] is always a Stage.
const STAGES: [Stage, ...Stage[]] = [
  {
    stage: "Trying to conceive",
    line: "Months of trying, and wondering what's next.",
    photo: "/assets/brand/landing/stage-trying.webp",
    alt: "A sunlit path winding up through an orange grove",
    groups: ["g-waiting", "g-unexplained", "g-work"],
    article: "unexplained-infertility",
  },
  {
    stage: "Waiting on tests",
    line: "Appointments booked, answers not back yet.",
    photo: "/assets/brand/landing/stage-waiting.webp",
    alt: "A garden bench under an orange tree, beside a path to a closed gate",
    groups: ["g-waiting", "g-pcos", "g-mf"],
    article: "pcos",
  },
  {
    stage: "In treatment",
    line: "IUI, IVF or surgery, and everything in between.",
    photo: "/assets/brand/landing/stage-treatment.webp",
    alt: "An orange branch in white blossom, a small green fruit just forming",
    groups: ["g-ivf", "g-iui", "g-endo"],
    article: "endometriosis",
  },
  {
    stage: "Taking a break",
    line: "Stepping back for a while, without stepping away.",
    photo: "/assets/brand/landing/stage-break.webp",
    alt: "A hammock in dappled shade at the edge of a still lake",
    groups: ["g-break", "g-rpl", "g-unexplained"],
    article: "recurrent-pregnancy-loss",
  },
  {
    stage: "I'm a partner",
    line: "Supporting someone you love, and needing support too.",
    photo: "/assets/brand/landing/stage-partner.webp",
    alt: "Two chairs side by side facing a lake under an orange tree",
    groups: ["g-partners", "g-mf", "g-donor"],
    article: "male-factor",
  },
];

/** On the flat sky band, each stage's painting sits on a white disc. */
function WhereAreYou() {
  const [i, setI] = useState(0);
  const cur = STAGES[i] ?? STAGES[0];
  const groups = cur.groups.map((id) => GROUPS.find((g) => g.id === id)!);
  const article = ARTICLES.find((a) => a.slug === cur.article)!;
  return (
    <section aria-labelledby="where-h" className="bg-[var(--tint-blue)]">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.7fr)] lg:gap-14 lg:py-28">
        <div className="order-2 lg:order-1">
          <h2
            id="where-h"
            className="text-[28px] leading-[1.15] font-semibold text-ink lg:text-[36px]"
          >
            Where are you right now?
          </h2>
          <div
            role="tablist"
            aria-label="Journey stage"
            aria-orientation="vertical"
            className="mt-4 flex flex-wrap gap-2 lg:flex-col lg:flex-nowrap lg:gap-1"
          >
            {STAGES.map((s, k) => (
              <button
                key={s.stage}
                type="button"
                role="tab"
                aria-selected={k === i}
                onClick={() => setI(k)}
                onMouseEnter={() => setI(k)}
                onFocus={() => setI(k)}
                className={`press flex shrink-0 flex-col items-start rounded-[18px] px-4 py-2.5 text-left lg:w-full transition-colors duration-200 ${
                  k === i ? "bg-accent text-white" : "text-ink-soft hover:bg-white hover:text-ink"
                }`}
              >
                <span className="text-[18px] font-semibold lg:text-[22px]">{s.stage}</span>
                {/* Phones show the line only on the chosen stage, so the chips stay small. */}
                <span
                  className={`mt-0.5 text-[14px] leading-snug lg:text-[15px] ${k === i ? "text-white/80" : "hidden text-muted lg:block"}`}
                >
                  {s.line}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative order-1 mx-auto aspect-square w-full max-w-[520px] lg:order-2">
          <div
            className="absolute inset-0 rounded-full transition-colors duration-300"
            style={{ background: "var(--white)" }}
          />
          {STAGES.map((s, k) => (
            <div
              key={s.stage}
              aria-hidden={k !== i}
              className={`absolute inset-[9%] overflow-hidden rounded-full transition-[opacity,transform] duration-500 ease-[var(--e-out)] ${k === i ? "opacity-100" : "scale-[1.04] opacity-0"}`}
            >
              {/* The chosen painting settles in from a slight zoom while the last one fades; each drifts slowly, like a view through a window. */}
              <Image
                src={s.photo}
                alt={s.alt}
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                quality={90}
                className="drift object-cover"
                priority={k === 0}
              />
            </div>
          ))}
          <span className="absolute right-[4%] bottom-[6%]">
            <LogoOrange size={64} />
          </span>
        </div>

        <div
          aria-live="polite"
          className="order-3 rounded-[20px] bg-white p-6 text-[16px] leading-relaxed text-ink"
        >
          <p className="font-semibold">You&apos;d start in</p>
          <ul className="mt-2 space-y-1.5">
            {groups.map((g) => (
              <li key={g.id} className="flex gap-2.5">
                <OrangeDot />
                {g.name}
              </li>
            ))}
          </ul>
          <p className="mt-5 font-semibold">First read</p>
          <p className="text-ink-soft">{article.title}</p>
        </div>
      </div>
    </section>
  );
}

/* The library as a shelf: each article's painted cover (its topic as one
   painted subject) on its diagnosis's tint. Covers settle into place as
   the section enters. */
function LearnList() {
  return (
    <section
      id="learn"
      aria-labelledby="learn-h"
      className="scroll-mt-20 mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:py-36"
    >
      <div className="flex items-baseline justify-between gap-4" data-reveal>
        <h2 id="learn-h" className="serif text-[44px] leading-[1] lg:text-[56px]">
          Clinician-reviewed library
        </h2>
        <span className="shrink-0 text-[16px] whitespace-nowrap text-muted">6 articles</span>
      </div>
      <p className="mt-3 max-w-[60ch] text-[16px] leading-relaxed text-ink-soft" data-reveal>
        One for each of six diagnoses, each reviewed by a clinician before it&apos;s published. Read
        the summaries now; the full articles open when you join.
      </p>
      <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {ARTICLES.map((a, i) => (
          <li key={a.slug} data-reveal style={{ transitionDelay: `${(i % 3) * 90}ms` }}>
            <span
              aria-hidden
              className="relative block aspect-[16/9] overflow-hidden rounded-[20px]"
            >
              <Image
                src={articleCover(a.slug)}
                alt=""
                fill
                sizes="(min-width: 1024px) 440px, (min-width: 640px) 50vw, 100vw"
                quality={90}
                className="cover-settle object-cover"
                style={{ transitionDelay: `${(i % 3) * 90 + 120}ms` }}
              />
            </span>
            <p className="mt-5 text-[14px] font-semibold" style={{ color: hueInk(a.hue) }}>
              {a.diagnosis === "Unexplained" ? "Unexplained infertility" : a.diagnosis}
            </p>
            <h3 className="mt-1 text-[20px] leading-snug font-semibold text-ink">{a.title}</h3>
            <p className="mt-2 text-[16px] leading-relaxed text-ink-soft">{a.summary}</p>
            <p className="tabular mt-3 text-[14px] text-muted">
              {a.readMinutes} min read · Reviewed {a.lastReviewed}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Grow() {
  return (
    <section id="grow" aria-labelledby="grow-h" className="scroll-mt-20 bg-[var(--tint-green)]">
      <div className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:py-32">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12" data-reveal>
          <h2 id="grow-h" className="serif text-[44px] leading-[1] lg:col-span-4 lg:text-[56px]">
            Grow by helping
          </h2>
          <p className="max-w-[46ch] text-[16px] leading-relaxed text-ink-soft lg:col-span-5 lg:col-start-6">
            The grove rewards being useful, not being loud. Each time someone finds your reply
            helpful, your tree gets Sunlight. At Blossom Tree you can start mentoring others.
          </p>
        </div>
        <ol
          className="mt-12 grid grid-cols-5 items-start gap-2 sm:gap-6"
          aria-label="The five tree levels"
        >
          {LEVELS.map((l, i) => (
            <li
              key={l.level}
              data-reveal
              style={{ transitionDelay: `${i * 90}ms` }}
              className="flex flex-col items-center text-center"
            >
              <span className="relative block aspect-square w-full">
                <Image
                  src={STAGE_SRC[l.level]}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 260px, 20vw"
                  className="object-contain object-bottom"
                />
              </span>
              <span className="mt-2 text-[13px] font-semibold text-ink sm:text-[16px]">
                {l.level}
              </span>
              <span className="tabular text-[13px] text-muted sm:text-[14px]">
                {l.at.toLocaleString()} Sunlight
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Partners() {
  return (
    <section
      id="partners"
      aria-labelledby="partners-h"
      className="scroll-mt-20 relative px-5 py-24 sm:px-8 lg:py-36"
    >
      <Backdrop kind="partners" />
      <div className="relative mx-auto grid max-w-[1376px] grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-20">
        <div
          className="relative mx-auto aspect-square w-full max-w-[520px] overflow-hidden rounded-full"
          data-reveal
        >
          <Image
            src="/assets/brand/landing/partners.webp"
            alt="Two young orange trees on a hill above a lake, their branches reaching toward each other"
            fill
            sizes="(min-width: 1024px) 40vw, 90vw"
            quality={90}
            className="drift object-cover"
          />
        </div>
        <div>
          <h2 id="partners-h" className="serif text-[44px] leading-[1] lg:text-[56px]" data-reveal>
            Room for partners too
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2" data-reveal>
            <div>
              <h3 className="text-[20px] font-semibold">Their own private account</h3>
              <p className="mt-2 text-[16px] leading-relaxed text-ink-soft">
                Partners join with your invite and get an account of their own, in a community where
                somebody finally asks about them.
              </p>
            </div>
            <div>
              <h3 className="text-[20px] font-semibold">A family space you both choose</h3>
              <p className="mt-2 text-[16px] leading-relaxed text-ink-soft">
                Share an appointment question list, a saved article or a family note. Nothing is
                shared until you share it.
              </p>
            </div>
          </div>
          <div className="mt-9" data-reveal>
            <PillButton href="/signup">Create account</PillButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function Join() {
  return (
    <Link
      href="/signup"
      className="group relative block overflow-hidden bg-[var(--tint-pink)] text-ink transition-colors duration-200 hover:bg-accent hover:text-white focus-visible:bg-accent focus-visible:text-white"
    >
      <Backdrop kind="join" />
      <div className="relative mx-auto flex max-w-[1440px] flex-col justify-between gap-10 px-5 py-10 sm:px-8 lg:min-h-[52svh] lg:flex-row lg:items-end">
        <p className="max-w-[28ch] text-[20px] leading-snug">
          Invite-only during the beta. Bring the link a member sent you, and we&apos;ll take it from
          there.
        </p>
        <span className="flex items-end gap-[3vw]">
          <span className="serif text-[30vw] leading-[0.72] tracking-[-0.03em] lg:text-[20vw]">
            Join
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 48 48"
            className="mb-[2vw] h-[9vw] w-[9vw] transition-transform duration-200 ease-[var(--e-out)] group-hover:translate-x-2 group-hover:-translate-y-2 lg:h-[6vw] lg:w-[6vw]"
          >
            <path
              d="M12 36 L36 12 M16 12 H36 V32"
              stroke="currentColor"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </Link>
  );
}

function Footer() {
  return (
    <footer className="bg-raised text-ink">
      <div className="mx-auto max-w-[1440px] px-5 pt-14 sm:px-8">
        <div className="grid grid-cols-1 gap-10 pb-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Logo height={44} />
          </div>
          <nav aria-label="Product" className="lg:col-span-2">
            <ul className="space-y-2 text-[16px]">
              <li>
                <Link href="#learn" className="hover:underline">
                  Learn
                </Link>
              </li>
              <li>
                <Link href="#partners" className="hover:underline">
                  Partners
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:underline">
                  Help
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="Legal" className="lg:col-span-3">
            <ul className="space-y-2 text-[16px]">
              <li>
                <Link href="/terms" className="hover:underline">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy#health-data" className="hover:underline">
                  Consumer Health Data Privacy Policy
                </Link>
              </li>
            </ul>
          </nav>
          <div className="lg:col-span-4">
            <p className="text-[16px] font-semibold">
              If you&apos;re struggling right now, call or text 988.
            </p>
            <p className="mt-1 text-[16px] leading-relaxed text-ink-soft">
              The Suicide & Crisis Lifeline is free, confidential and open all day and night. In an
              emergency, call 911.
            </p>
            <a
              href="tel:988"
              className="press mt-3 inline-flex h-11 items-center rounded-full bg-accent px-5 text-[16px] font-semibold text-white hover:bg-black"
            >
              Call 988
            </a>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 pb-8 text-[14px] text-muted">
          <p className="max-w-[90ch]">
            Fertility Grove © 2026. US only. Botanical plate: <em>Citrus limonum</em> by Rungiah,
            text by Robert Wight (1851), public domain via Wikimedia Commons.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function Landing() {
  useReveal();
  return (
    <>
      <SiteNav />
      <Hero />
      <main className="bg-white">
        <Statement />
        <Specimens />
        <WhereAreYou />
        <LearnList />
        <Grow />
        <Partners />
        <PrivacySection />
        <Join />
      </main>
      <Footer />
    </>
  );
}
