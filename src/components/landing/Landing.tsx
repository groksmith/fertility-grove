"use client";

/* The public landing page, in the voice of fertilitygrove.com: white ground,
   the orange logo, the brand's watercolour orange trees and the near-black
   pill. One motif runs it: the orange's circle masks every picture and marks
   every list, and the tree grows from Seed to Orange Tree down the page.
   Behind it, the cosy layer: a painted plaster wash under the hero, and
   orange branches and blossom hanging in at a few section edges. */

import Image from "next/image";
import Link from "next/link";
import { Menu as MenuIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LogoOrange, Logo } from "@/components/Logo";
import { Grove } from "./Grove";
import { Backdrop } from "@/components/art/Cozy";
import { Spot, type SpotKind } from "@/components/art/Scenes";
import { STAGE_SRC, TreeArt } from "@/components/art/Tree";
import { ARTICLES, articleCover } from "@/lib/data/articles";
import { hueInk } from "@/lib/hue";
import { GROUPS } from "@/lib/data/groups";
import { useStore } from "@/lib/store";
import { LEVELS } from "@/lib/rules/sunlight";

/* ------------------------------------------------------------- Motion */

/** Section parts rise into place once as they enter. Content is visible
 *  without script: the hidden starting state only applies after mount. */
function useReveal() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("reveal-ready");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.in = "";
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -12% 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);
}

/* -------------------------------------------------------------- Pieces */

function OrangeDot() {
  return <span aria-hidden className="mt-[0.45em] inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />;
}

function PillButton({ href, children, tone = "dark" }: { href: string; children: React.ReactNode; tone?: "dark" | "light" }) {
  return (
    <Link
      href={href}
      className={`press inline-flex h-12 items-center justify-center rounded-full px-7 text-[16px] font-semibold ${
        tone === "dark" ? "bg-accent text-white hover:bg-black" : "border border-line-strong bg-white text-ink hover:border-ink"
      }`}
    >
      {children}
    </Link>
  );
}

/* Each promise is its own symbol, painted in the grove's gouache with a
   sprig of leaf and blossom: a tag marked @, an eye struck through, a heart
   under padlock, an arrow down into an envelope. */
const PRIVACY: { text: string; art: string }[] = [
  { text: "You post under a handle, not your name", art: "/brand/cozy/q-handle.webp" },
  { text: "No ad trackers, ever", art: "/brand/cozy/q-trackers.webp" },
  { text: "Your health data is never sold", art: "/brand/cozy/q-sold.webp" },
  { text: "Download or delete everything, any time", art: "/brand/cozy/q-download.webp" },
];

/** The brand's growth film plays once, then rests on the tree in fruit. */
function GrowingTree({ ref, className = "" }: { ref: React.Ref<HTMLVideoElement>; className?: string }) {
  return (
    <video ref={ref} className={className} poster="/brand/tree-grow-poster.jpg" muted playsInline preload="auto" aria-hidden>
      {/* Cut from the site's original at full resolution: 1024² square pixels. */}
      <source src="/brand/tree-grow.webm" type="video/webm" />
      <source src="/brand/tree-grow.mp4" type="video/mp4" />
    </video>
  );
}

/** Both hero trees grow together: wait until every visible film can play,
 *  then start them on the same frame. */
function useGrowTogether() {
  const left = useRef<HTMLVideoElement>(null);
  const right = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const films = [left.current, right.current].filter((v): v is HTMLVideoElement => !!v && v.offsetParent !== null);
    const start = () => {
      if (!films.every((v) => v.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA)) return;
      films.forEach((v) => {
        v.currentTime = 0;
        void v.play().catch(() => {});
      });
    };
    films.forEach((v) => v.addEventListener("canplaythrough", start, { once: true }));
    start();
    return () => films.forEach((v) => v.removeEventListener("canplaythrough", start));
  }, []);
  return [left, right] as const;
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
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The section whose top has passed the bar is the one you're reading.
  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.id)).filter((x): x is HTMLElement => !!x);
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (seen.length) setActive(seen[0].target.id);
      },
      { rootMargin: "-80px 0px -55% 0px" },
    );
    els.forEach((x) => io.observe(x));
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
          <Link href="/" aria-label="Fertility Grove home" className="shrink-0 justify-self-start" onClick={() => setOpen(false)}>
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
              <Link href="/help" className="press inline-flex h-10 items-center rounded-full px-4 text-[15px] font-semibold text-ink-soft transition-colors duration-150 hover:text-ink">
                Help
              </Link>
            </li>
          </ul>
          <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:justify-self-end">
            {signedIn ? (
              <Link href="/home" className="press inline-flex h-10 items-center rounded-full bg-accent px-5 text-[15px] font-semibold text-white hover:bg-black">
                Your grove
              </Link>
            ) : (
              <>
                <Link href="/login" className="press inline-flex h-10 items-center rounded-full px-4 text-[15px] font-semibold text-ink hover:bg-ink/5">
                  Sign in
                </Link>
                <Link href="/signup" className="press hidden h-10 items-center rounded-full bg-accent px-5 text-[15px] font-semibold text-white hover:bg-black sm:inline-flex">
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
          <div id="site-menu" className="rise border-t border-line bg-white px-5 pt-3 pb-6 sm:px-8 lg:hidden">
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
                <Link href="/help" className="flex h-12 items-center text-[17px] font-semibold text-ink">
                  Help
                </Link>
              </li>
            </ul>
            {!signedIn && (
              <Link href="/signup" className="press mt-3 inline-flex h-12 w-full items-center justify-center rounded-full bg-accent text-[16px] font-semibold text-white">
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

function Hero() {
  const [leftTree, rightTree] = useGrowTogether();
  return (
    <header className="relative overflow-hidden bg-white">
      <div className="relative h-[var(--hero-h)]" style={{ "--hero-h": "clamp(700px, 100svh, 980px)" } as React.CSSProperties}>
        <Grove
          films={[
            <GrowingTree key="l" ref={leftTree} className="h-full w-full object-cover object-bottom" />,
            <GrowingTree key="r" ref={rightTree} className="h-full w-full object-cover object-bottom" />,
          ]}
        />
        <Backdrop kind="hero" />

        {/* The words sit in the sky, above the horizon, with the path leading up to them. */}
        <div className="absolute inset-x-0 top-20 bottom-[45%] z-10 flex items-center justify-center px-5 sm:px-8">
          <div className="text-center">
            <h1 className="serif mx-auto max-w-[24ch] text-[30px] leading-[1.04] tracking-[-0.01em] text-balance text-ink sm:text-[44px] xl:text-[clamp(44px,3.6vw,56px)]">
              The first purpose built platform for the fertility community.
            </h1>
            <p className="mx-auto mt-4 max-w-[46ch] text-[18px] leading-relaxed text-pretty text-ink-soft sm:text-[20px]">
              A private community for people going through infertility, and their partners.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <PillButton href="/signup">Create account</PillButton>
              <PillButton href="/login" tone="light">
                Sign in
              </PillButton>
            </div>
            <p className="mt-3 text-[14px] text-ink-soft">Invite-only during the beta. Ask a member for their invite link.</p>
          </div>
        </div>
      </div>

      <div className="bg-raised">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-5 py-12 sm:px-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12 lg:py-16">
          <h2 className="text-[20px] font-semibold text-ink">Private by default</h2>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-4 text-[16px] leading-snug text-ink sm:grid-cols-2 lg:grid-cols-4">
            {PRIVACY.map(({ text, art }) => (
              <li key={text} className="promise flex items-center gap-4">
                <span aria-hidden className="promise-art relative block h-20 w-20 shrink-0 lg:h-[104px] lg:w-[104px]">
                  <Image src={art} alt="" fill sizes="(min-width: 1024px) 104px, 80px" quality={90} className="object-contain" />
                </span>
                <span className="text-balance">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}

function Thumb({ src, alt, bg }: { src: string; alt: string; bg?: string }) {
  return (
    <span className="relative mx-[0.12em] inline-block h-[0.9em] w-[0.9em] overflow-hidden rounded-full align-[-0.1em]" style={bg ? { background: bg } : undefined}>
      <Image src={src} alt={alt} fill sizes="60px" className={bg ? "object-contain p-[8%]" : "object-cover"} />
    </span>
  );
}

function Statement() {
  return (
    <section aria-label="What you get" className="relative px-5 py-24 sm:px-8 lg:py-36">
      <Backdrop kind="statement" />
      <p data-reveal className="relative mx-auto max-w-[30ch] text-left text-[22px] leading-[1.25] font-semibold tracking-[-0.01em] text-ink sm:max-w-[38ch] sm:text-center sm:text-[28px] lg:max-w-[34ch] lg:text-[36px]">
        Tell us where you are once. Meet people on your <Thumb src="/brand/landing/stage-trying.webp" alt="A path through an orange grove" /> path, answers a clinician
        <Thumb src={articleCover("male-factor")} alt="A microscope from the library" /> reviewed, and someone who&apos;s been there
        <Thumb src="/brand/art/tree-orange.webp" alt="An orange tree in fruit" bg="var(--tint-green)" />.
      </p>
    </section>
  );
}

const SPECIMENS: { name: string; fact: string; art: SpotKind | "tree"; bg: string; wide?: boolean }[] = [
  { name: "Mentors who've been there", fact: "Experienced members mentor for free. No application, just time in the grove.", art: "shelter", bg: "var(--tint-purple)", wide: true },
  { name: "Matched groups", fact: "Join up to five groups chosen for your diagnosis and stage, each with the reason why.", art: "canopy", bg: "var(--tint-pink)" },
  { name: "The Grove Guide", fact: "Ask anything. It answers only from reviewed articles and shows its sources.", art: "lantern", bg: "var(--tint-blue)" },
  { name: "Success stories, kept apart", fact: "Hope when you want it. Pregnancy news stays in its own space.", art: "blossom", bg: "var(--tag-pink-bg)", wide: true },
  { name: "A family space", fact: "Share a question list or a note with your partner, only when you choose.", art: "roots", bg: "var(--tint-neutral)" },
  { name: "Your tree", fact: "Grow from Seed to Orange Tree each time someone finds you helpful.", art: "tree", bg: "var(--tint-green)" },
];

function Specimens() {
  return (
    <section id="groups" aria-labelledby="spec-h" className="scroll-mt-24 mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-5 pb-24 sm:px-8 lg:grid-cols-12 lg:pb-36">
      <div className="lg:col-span-3" data-reveal>
        <h2 id="spec-h" className="serif text-[44px] leading-[1] lg:text-[56px]">Six ways in</h2>
        <p className="mt-4 max-w-[30ch] text-[16px] leading-relaxed text-ink-soft">
          Groups, answers, mentors and your partner, so this isn&apos;t one more thing to juggle.
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-2.5 lg:col-span-9 lg:grid-cols-4" role="list">
        {SPECIMENS.map((s, i) => (
          <li key={s.name} data-reveal style={{ transitionDelay: `${i * 70}ms` }} className={s.wide ? "col-span-2" : ""}>
            <div className={`grid place-items-center overflow-hidden rounded-[20px] px-4 pt-6 ${s.wide ? "aspect-[8/5]" : "aspect-[4/5]"}`} style={{ background: s.bg }}>
              {s.art === "tree" ? <TreeArt level="Orange Tree" size={170} /> : <Spot kind={s.art} size={s.wide ? 260 : 170} />}
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
const STAGES = [
  { stage: "Trying to conceive", photo: "/brand/landing/stage-trying.webp", alt: "A sunlit path winding up through an orange grove", disc: "var(--tint-green)", groups: ["g-waiting", "g-unexplained", "g-work"], article: "unexplained-infertility" },
  { stage: "Waiting on tests", photo: "/brand/landing/stage-waiting.webp", alt: "A garden bench under an orange tree, beside a path to a closed gate", disc: "var(--tint-blue)", groups: ["g-waiting", "g-pcos", "g-mf"], article: "pcos" },
  { stage: "In treatment", photo: "/brand/landing/stage-treatment.webp", alt: "An orange branch in white blossom, a small green fruit just forming", disc: "var(--tag-pink-bg)", groups: ["g-ivf", "g-iui", "g-endo"], article: "endometriosis" },
  { stage: "Taking a break", photo: "/brand/landing/stage-break.webp", alt: "A hammock in dappled shade at the edge of a still lake", disc: "var(--tint-purple)", groups: ["g-break", "g-rpl", "g-unexplained"], article: "recurrent-pregnancy-loss" },
  { stage: "I'm a partner", photo: "/brand/landing/stage-partner.webp", alt: "Two chairs side by side facing a lake under an orange tree", disc: "var(--tint-pink)", groups: ["g-partners", "g-mf", "g-donor"], article: "male-factor" },
];

function WhereAreYou() {
  const [i, setI] = useState(0);
  const cur = STAGES[i];
  const groups = cur.groups.map((id) => GROUPS.find((g) => g.id === id)!);
  const article = ARTICLES.find((a) => a.slug === cur.article)!;
  return (
    <section aria-labelledby="where-h" className="bg-raised">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.7fr)] lg:gap-14 lg:py-28">
        <div className="order-2 lg:order-1">
          <h2 id="where-h" className="text-[28px] leading-[1.15] font-semibold text-ink lg:text-[36px]">Where are you right now?</h2>
          <div role="tablist" aria-label="Journey stage" aria-orientation="vertical" className="mt-4 flex flex-wrap gap-2 lg:flex-col lg:flex-nowrap lg:gap-1">
            {STAGES.map((s, k) => (
                <button
                  key={s.stage}
                  type="button"
                  role="tab"
                  aria-selected={k === i}
                  onClick={() => setI(k)}
                  onMouseEnter={() => setI(k)}
                  onFocus={() => setI(k)}
                  className={`press flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-left lg:w-full text-[18px] font-semibold transition-colors duration-200 lg:text-[22px] ${
                    k === i ? "bg-accent text-white" : "text-ink-soft hover:bg-white hover:text-ink"
                  }`}
                >
                  {s.stage}
                </button>
            ))}
          </div>
        </div>

        <div className="relative order-1 mx-auto aspect-square w-full max-w-[520px] lg:order-2">
          <div className="absolute inset-0 rounded-full transition-colors duration-300" style={{ background: cur.disc }} />
          {STAGES.map((s, k) => (
            <div
              key={s.stage}
              aria-hidden={k !== i}
              className={`absolute inset-[9%] overflow-hidden rounded-full transition-[opacity,transform] duration-500 ease-[var(--e-out)] ${k === i ? "opacity-100" : "scale-[1.04] opacity-0"}`}
            >
              {/* The chosen painting settles in from a slight zoom while the last one fades; each drifts slowly, like a view through a window. */}
              <Image src={s.photo} alt={s.alt} fill sizes="(min-width: 1024px) 40vw, 90vw" quality={90} className="drift object-cover" priority={k === 0} />
            </div>
          ))}
          <span className="absolute right-[4%] bottom-[6%]">
            <LogoOrange size={64} />
          </span>
        </div>

        <div aria-live="polite" className="order-3 rounded-[20px] bg-white p-6 text-[16px] leading-relaxed text-ink">
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
    <section id="learn" aria-labelledby="learn-h" className="scroll-mt-20 mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:py-36">
      <div className="flex items-baseline justify-between gap-4" data-reveal>
        <h2 id="learn-h" className="serif text-[44px] leading-[1] lg:text-[56px]">Clinician-reviewed library</h2>
        <span className="shrink-0 text-[16px] whitespace-nowrap text-muted">6 articles</span>
      </div>
      <p className="mt-3 max-w-[60ch] text-[16px] leading-relaxed text-ink-soft" data-reveal>
        One for each of six diagnoses, each reviewed by a clinician before it&apos;s published. Read the summaries now; the full articles open when you join.
      </p>
      <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {ARTICLES.map((a, i) => (
          <li key={a.slug} data-reveal style={{ transitionDelay: `${(i % 3) * 90}ms` }}>
            <span aria-hidden className="relative block aspect-[16/9] overflow-hidden rounded-[20px]">
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
            <p className="tabular mt-3 text-[14px] text-muted">{a.readMinutes} min read · Reviewed {a.lastReviewed}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Grow() {
  return (
    <section id="grow" aria-labelledby="grow-h" className="scroll-mt-20 bg-raised">
      <div className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:py-32">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12" data-reveal>
          <h2 id="grow-h" className="serif text-[44px] leading-[1] lg:col-span-4 lg:text-[56px]">Grow by helping</h2>
          <p className="max-w-[46ch] text-[16px] leading-relaxed text-ink-soft lg:col-span-5 lg:col-start-6">
            The grove rewards being useful, not being loud. Each time someone finds your reply helpful, your tree gets Sunlight. At Blossom Tree you can start mentoring others.
          </p>
        </div>
        <ol className="mt-12 grid grid-cols-5 items-start gap-2 sm:gap-6" aria-label="The five tree levels">
          {LEVELS.map((l, i) => (
            <li key={l.level} data-reveal style={{ transitionDelay: `${i * 90}ms` }} className="flex flex-col items-center text-center">
              <span className="relative block aspect-square w-full">
                <Image src={STAGE_SRC[l.level]} alt="" fill sizes="(min-width: 1024px) 260px, 20vw" className="object-contain object-bottom" />
              </span>
              <span className="mt-2 text-[13px] font-semibold text-ink sm:text-[16px]">{l.level}</span>
              <span className="tabular text-[13px] text-muted sm:text-[14px]">{l.at.toLocaleString()} Sunlight</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Partners() {
  return (
    <section id="partners" aria-labelledby="partners-h" className="scroll-mt-20 relative px-5 py-24 sm:px-8 lg:py-36">
      <Backdrop kind="partners" />
      <div className="relative mx-auto grid max-w-[1376px] grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-20">
        <div className="relative mx-auto aspect-square w-full max-w-[520px] overflow-hidden rounded-full" data-reveal>
          <Image src="/brand/landing/partners.webp" alt="Two young orange trees on a hill above a lake, their branches reaching toward each other" fill sizes="(min-width: 1024px) 40vw, 90vw" quality={90} className="drift object-cover" />
        </div>
        <div>
          <h2 id="partners-h" className="serif text-[44px] leading-[1] lg:text-[56px]" data-reveal>
            Room for partners too
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2" data-reveal>
            <div>
              <h3 className="text-[20px] font-semibold">Their own private account</h3>
              <p className="mt-2 text-[16px] leading-relaxed text-ink-soft">
                Partners join with your invite and get an account of their own, in a community where somebody finally asks about them.
              </p>
            </div>
            <div>
              <h3 className="text-[20px] font-semibold">A family space you both choose</h3>
              <p className="mt-2 text-[16px] leading-relaxed text-ink-soft">
                Share an appointment question list, a saved article or a family note. Nothing is shared until you share it.
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
        <p className="max-w-[28ch] text-[20px] leading-snug">Invite-only during the beta. Bring the link a member sent you, and we&apos;ll take it from there.</p>
        <span className="flex items-end gap-[3vw]">
          <span className="serif text-[30vw] leading-[0.72] tracking-[-0.03em] lg:text-[20vw]">Join</span>
          <svg aria-hidden viewBox="0 0 48 48" className="mb-[2vw] h-[9vw] w-[9vw] transition-transform duration-200 ease-[var(--e-out)] group-hover:translate-x-2 group-hover:-translate-y-2 lg:h-[6vw] lg:w-[6vw]">
            <path d="M12 36 L36 12 M16 12 H36 V32" stroke="currentColor" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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
              <li><Link href="#learn" className="hover:underline">Learn</Link></li>
              <li><Link href="#partners" className="hover:underline">Partners</Link></li>
              <li><Link href="/help" className="hover:underline">Help</Link></li>
            </ul>
          </nav>
          <nav aria-label="Legal" className="lg:col-span-3">
            <ul className="space-y-2 text-[16px]">
              <li><Link href="/terms" className="hover:underline">Terms</Link></li>
              <li><Link href="/privacy" className="hover:underline">Privacy Policy</Link></li>
              <li><Link href="/privacy#health-data" className="hover:underline">Consumer Health Data Privacy Policy</Link></li>
            </ul>
          </nav>
          <div className="lg:col-span-4">
            <p className="text-[16px] font-semibold">If you&apos;re struggling right now, call or text 988.</p>
            <p className="mt-1 text-[16px] leading-relaxed text-ink-soft">The Suicide & Crisis Lifeline is free, confidential and open all day and night. In an emergency, call 911.</p>
            <a href="tel:988" className="press mt-3 inline-flex h-11 items-center rounded-full bg-accent px-5 text-[16px] font-semibold text-white hover:bg-black">Call 988</a>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 pb-8 text-[14px] text-muted">
          <p className="max-w-[90ch]">
            Fertility Grove © 2026. US only. Botanical plate: <em>Citrus limonum</em> by Rungiah, text by Robert Wight (1851), public domain via Wikimedia Commons.
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
        <Join />
      </main>
      <Footer />
    </>
  );
}
