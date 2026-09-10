"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  CircleHelp,
  HandHeart,
  LayoutGrid,
  Menu,
  MessageCircle,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Avatar, Logo } from "./ui";
import { useHydrated, useStore } from "@/lib/store";
import { ONLINE_NOW } from "@/lib/data";

export type SectionKey =
  | "dashboard"
  | "community"
  | "care"
  | "fundraising"
  | "learn"
  | "messages"
  | "settings";

export const SECTIONS: Record<
  SectionKey,
  { label: string; href: string; tint: string; accent: string; icon: React.ElementType }
> = {
  dashboard: {
    label: "My Dashboard",
    href: "/dashboard",
    tint: "#FFFFFF",
    accent: "var(--ink)",
    icon: LayoutGrid,
  },
  community: {
    label: "Community",
    href: "/community",
    tint: "var(--nav)",
    accent: "var(--fg-coral)",
    icon: Users,
  },
  care: {
    label: "Care Guide",
    href: "/care",
    tint: "var(--nav)",
    accent: "var(--fg-green-dark)",
    icon: Sparkles,
  },
  fundraising: {
    label: "Fundraising",
    href: "/fundraising",
    tint: "var(--nav)",
    accent: "var(--fg-blue-ink)",
    icon: HandHeart,
  },
  learn: {
    label: "Learn",
    href: "/learn",
    tint: "var(--nav)",
    accent: "var(--fg-yellow-ink)",
    icon: BookOpen,
  },
  messages: {
    label: "Messages",
    href: "/messages",
    tint: "var(--tint-yellow)",
    accent: "var(--fg-purple)",
    icon: MessageCircle,
  },
  settings: {
    label: "Settings",
    href: "/settings",
    tint: "var(--nav)",
    accent: "var(--ink)",
    icon: Settings,
  },
};

const NAV_ORDER: SectionKey[] = [
  "dashboard",
  "community",
  "care",
  "fundraising",
  "learn",
  "messages",
];

/* --------------------------------------------------------------- Left nav */

function LeftNav({ active }: { active: SectionKey }) {
  const [q, setQ] = useState("");
  const router = useRouter();
  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line lg:flex"
      style={{ background: SECTIONS[active].tint }}
    >
      <div className="px-6 pt-6">
        <Link href="/dashboard" aria-label="Fertility Grove home">
          <Logo />
        </Link>
      </div>

      <form
        className="mt-6 px-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        }}
      >
        <div className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
          <Search size={18} className="text-ink" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search..."
            aria-label="Search Fertility Grove"
            className="w-full bg-transparent text-[14px] text-ink placeholder:text-muted-light focus:outline-none"
          />
        </div>
      </form>

      <nav className="mt-6 flex-1" aria-label="Main">
        <ul>
          {NAV_ORDER.map((key) => {
            const s = SECTIONS[key];
            const Icon = s.icon;
            const isActive = key === active;
            return (
              <li key={key}>
                <Link
                  href={s.href}
                  aria-current={isActive ? "page" : undefined}
                  className="flex h-14 items-center gap-3 px-6 text-[14.5px] transition"
                  style={{
                    background: isActive ? "#FFFFFF" : "transparent",
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{s.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <ul className="pb-6">
        <li>
          <Link
            href="/settings"
            className="flex h-12 items-center gap-3 px-6 text-[14.5px] font-medium transition hover:bg-white/50"
          >
            <Settings size={20} strokeWidth={1.8} />
            Settings
          </Link>
        </li>
        <li>
          <Link
            href="/help"
            className="flex h-12 items-center gap-3 px-6 text-[14.5px] font-medium transition hover:bg-white/50"
          >
            <CircleHelp size={20} strokeWidth={1.8} />
            Help
          </Link>
        </li>
      </ul>
    </aside>
  );
}

/* ---------------------------------------------------------------- Top bar */

function TopBar({
  active,
  title,
  tabs,
}: {
  active: SectionKey;
  title?: string;
  tabs?: { label: string; href: string }[];
}) {
  const { profile } = useStore();
  const pathname = usePathname();
  const s = SECTIONS[active];
  const Icon = s.icon;

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur">
      <div className="flex h-[72px] items-center gap-3 px-8">
        <Icon size={22} strokeWidth={2} />
        <h1 className="text-[21px] font-bold tracking-[-0.01em]">
          {title ?? s.label}
        </h1>

        <div className="ml-auto flex items-center gap-5">
          <span className="hidden items-center gap-1.5 text-[13.5px] text-ink md:flex">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--fg-green-bright)" }}
            />
            {ONLINE_NOW} online now
          </span>

          <div className="relative hidden sm:block" key={pathname}>
            <StatusMenu />
          </div>

          <Link href="/profile" aria-label="My profile" className="hidden sm:block">
            <Avatar
              name={`${profile.firstName} ${profile.lastName}`}
              size={44}
              status={profile.status}
              preset={profile.avatarPreset}
            />
          </Link>

          <MobileMenu active={active} />
        </div>
      </div>

      {tabs && (
        <nav className="flex gap-8 px-8" aria-label="Section">
          {tabs.map((t) => {
            const isActive =
              pathname === t.href ||
              (t.href !== SECTIONS[active].href && pathname.startsWith(t.href));
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={isActive ? "page" : undefined}
                className={`pb-3 text-[14.5px] transition ${
                  isActive
                    ? "font-bold text-ink"
                    : "font-medium text-muted hover:text-ink"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}

function StatusMenu() {
  const { profile, updateProfile } = useStore();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 text-[13.5px] font-medium text-green-dark"
      >
        My status: {profile.status}
        <ChevronDown size={16} />
      </button>
      {open && (
        <ul
          role="menu"
          className="pop-in absolute right-0 top-9 w-44 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.2)]"
        >
          {(["online", "away", "busy", "invisible"] as const).map((st) => (
            <li key={st}>
              <button
                role="menuitem"
                onClick={() => {
                  updateProfile({ status: st });
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13.5px] capitalize hover:bg-surface"
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{
                    background:
                      st === "online"
                        ? "var(--fg-green-bright)"
                        : st === "away"
                          ? "var(--fg-yellow)"
                          : st === "busy"
                            ? "#E0574F"
                            : "#C7C7C7",
                  }}
                />
                {st}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ------------------------------------------------------------ Mobile menu */

function MobileMenu({ active }: { active: SectionKey }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const { profile } = useStore();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="grid h-10 w-10 place-items-center rounded-lg transition hover:bg-black/[0.04] lg:hidden"
      >
        <Menu size={22} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/25 lg:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="pop-in ml-auto flex h-full w-[86vw] max-w-[340px] flex-col bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <Logo />
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={22} />
              </button>
            </div>

            <form
              className="mt-6 flex items-center gap-2.5 rounded-xl border border-line-strong px-3.5 py-2.5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!q.trim()) return;
                setOpen(false);
                router.push(`/search?q=${encodeURIComponent(q.trim())}`);
              }}
            >
              <Search size={17} className="text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search..."
                aria-label="Search Fertility Grove"
                className="w-full bg-transparent text-[14.5px] placeholder:text-muted-light focus:outline-none"
              />
            </form>

            <nav className="mt-4 flex-1 overflow-y-auto" aria-label="All sections">
              <ul>
                {NAV_ORDER.map((key) => {
                  const sec = SECTIONS[key];
                  const Icon = sec.icon;
                  return (
                    <li key={key}>
                      <Link
                        href={sec.href}
                        onClick={() => setOpen(false)}
                        aria-current={key === active ? "page" : undefined}
                        className="flex h-12 items-center gap-3 rounded-lg px-3 text-[15px]"
                        style={{
                          fontWeight: key === active ? 700 : 500,
                          background: key === active ? "var(--nav)" : undefined,
                        }}
                      >
                        <Icon size={20} />
                        {sec.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <ul className="mt-4 border-t border-line pt-4">
                <li>
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex h-12 items-center gap-3 rounded-lg px-3 text-[15px] font-medium"
                  >
                    <Avatar
                      name={`${profile.firstName} ${profile.lastName}`}
                      size={22}
                    />
                    My profile
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings"
                    onClick={() => setOpen(false)}
                    className="flex h-12 items-center gap-3 rounded-lg px-3 text-[15px] font-medium"
                  >
                    <Settings size={20} /> Settings
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help"
                    onClick={() => setOpen(false)}
                    className="flex h-12 items-center gap-3 rounded-lg px-3 text-[15px] font-medium"
                  >
                    <CircleHelp size={20} /> Help
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------- Mobile nav */

function MobileNav({ active }: { active: SectionKey }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-white lg:hidden"
      aria-label="Main"
    >
      {NAV_ORDER.map((key) => {
        const s = SECTIONS[key];
        const Icon = s.icon;
        const isActive = key === active;
        return (
          <Link
            key={key}
            href={s.href}
            aria-current={isActive ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px]"
            style={{
              color: isActive ? s.accent : "var(--muted)",
              fontWeight: isActive ? 700 : 500,
              background: isActive ? s.tint : undefined,
            }}
          >
            <Icon size={19} />
            {s.label.replace("My ", "")}
          </Link>
        );
      })}
    </nav>
  );
}

/* --------------------------------------------------------------- AppShell */

export function AppShell({
  section,
  title,
  tabs,
  rail,
  children,
  wide,
}: {
  section: SectionKey;
  title?: string;
  tabs?: { label: string; href: string }[];
  rail?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const { signedIn } = useStore();
  const hydrated = useHydrated();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !signedIn) router.replace("/signup");
  }, [hydrated, signedIn, router]);

  /* The rail is rendered once and simply reflows below the content column
     under xl, so the page never carries two copies of the same controls. */
  const headerHeight = tabs ? 112 : 72;

  return (
    <div className="min-h-full lg:pl-60">
      <LeftNav active={section} />
      <TopBar active={section} title={title} tabs={tabs} />
      <div
        className={`flex flex-col xl:flex-row ${
          rail ? "" : "xl:justify-center"
        }`}
      >
        <main
          className={`min-w-0 flex-1 px-6 pb-10 pt-6 lg:px-8 xl:pb-28 ${
            wide ? "" : "max-w-[1100px]"
          }`}
        >
          {children}
        </main>
        {rail && (
          <aside
            className={`thin-scroll w-full border-t border-line px-6 pb-28 pt-6 xl:sticky xl:w-[304px] xl:shrink-0 xl:self-start xl:overflow-y-auto xl:border-l xl:border-t-0 xl:pb-6 ${
              tabs
                ? "xl:max-h-[calc(100vh-112px)]"
                : "xl:max-h-[calc(100vh-72px)]"
            }`}
            style={{ top: headerHeight }}
          >
            {rail}
          </aside>
        )}
      </div>
      <MobileNav active={section} />
    </div>
  );
}
