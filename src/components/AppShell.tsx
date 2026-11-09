"use client";

/* The member app's frame. Desktop (1280px and up): an open-plane labelled
   sidebar on the page ground (mark and community at the top, nav, utilities
   and your row at the bottom), no top bar. iPad landscape (1024 to 1279px):
   the same sidebar as a slim icon rail, so content keeps its width. Phone: a 48px top bar, a four-item bottom nav and a
   full-screen menu sheet for everything else. Grove Guide is not a nav item:
   it floats bottom right on every screen except its own and a conversation. */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  Bookmark,
  ChevronsUpDown,
  CircleHelp,
  Flower2,
  Home,
  LogOut,
  Menu as MenuIcon,
  MessageCircle,
  Search,
  Settings,
  Sprout,
  UserRound,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Logo, LogoOrange } from "@/components/Logo";
import { HeaderBackdrop, sceneFor } from "@/components/art/Cozy";
import { TreeGlyph } from "@/components/art/Tree";
import { requestLeave } from "@/components/UnsavedGuard";
import { act, sel, useStore, type State } from "@/lib/store";
import { COMMUNITIES } from "@/lib/options";
import { Avatar, Button, Dialog, Menu, Toaster } from "./ui";

type NavItem = { href: string; label: string; icon: React.ElementType; count?: (s: State) => number };

const PRIMARY: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/stories", label: "Success stories", icon: Flower2 },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/mentors", label: "Mentors", icon: Sprout },
  { href: "/messages", label: "Messages", icon: MessageCircle, count: (s) => sel.unreadMessages(s) },
  { href: "/notifications", label: "Notifications", icon: Bell, count: (s) => sel.unreadNotifications(s) },
];

const SECONDARY: NavItem[] = [
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/family", label: "Family space", icon: UsersRound },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help", label: "Help", icon: CircleHelp },
];

const PHONE: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageCircle, count: (s) => sel.unreadMessages(s) },
  { href: "/profile", label: "Me", icon: Sprout },
];

const isActive = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

function NavRow({ item, path, onNavigate, rail }: { item: NavItem; path: string; onNavigate?: () => void; rail?: boolean }) {
  const s = useStore();
  const Icon = item.icon;
  const on = isActive(path, item.href) || (item.href === "/groups" && path.startsWith("/posts"));
  const n = item.count?.(s) ?? 0;
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={on ? "page" : undefined}
        title={rail ? item.label : undefined}
        className={`nav-row press relative flex items-center gap-2.5 rounded-[10px] px-2.5 text-[14px] ${
          rail ? "h-11 justify-center xl:h-9 xl:justify-start" : "h-12 text-[16px]"
        } ${on ? "bg-white font-semibold text-ink ring-1 ring-line" : "text-ink-soft hover:bg-line hover:text-ink"}`}
      >
        <Icon size={19} strokeWidth={1.7} aria-hidden className={rail ? "xl:h-[17px] xl:w-[17px]" : ""} />
        <span className={rail ? "sr-only xl:not-sr-only xl:flex-1" : "flex-1"}>{item.label}</span>
        {n > 0 && (
          <span
            className={`tabular grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[12px] font-bold text-ink ${
              rail ? "absolute top-0.5 right-0.5 h-4 min-w-4 px-1 text-[10px] xl:static xl:h-5 xl:min-w-5 xl:px-1.5 xl:text-[12px]" : ""
            }`}
          >
            {n}
            <span className="sr-only"> unread</span>
          </span>
        )}
      </Link>
    </li>
  );
}

function SearchBox({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/people?q=${encodeURIComponent(q.trim())}`);
        onDone?.();
      }}
    >
      <label className="search-field flex h-10 items-center gap-2 rounded-full bg-raised px-3.5 text-muted focus-within:bg-white focus-within:ring-2 focus-within:ring-accent">
        <Search size={16} aria-hidden />
        <span className="sr-only">Find people by handle</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find people by @handle"
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
          className="w-full bg-transparent text-[14px] text-ink placeholder:text-muted focus:outline-none"
        />
      </label>
    </form>
  );
}

function Scope() {
  const community = useStore((s) => s.me.community);
  return (
    <p className="mt-2 text-[13px] text-muted">{community ? COMMUNITIES[community].name : "Fertility Grove"}</p>
  );
}

/** Sign out, iOS style: a short confirmation first. Signing out lands on
    the sign-in screen (the app's gate does the redirect). */
function useSignOut() {
  const [confirm, setConfirm] = useState(false);
  const ask = () => requestLeave(() => setConfirm(true));
  const ui = (
    <Dialog
      open={confirm}
      onClose={() => setConfirm(false)}
      title="Sign out of Fertility Grove?"
      description="You can sign back in any time with your email or Google."
    >
      <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
        <Button
          variant="danger"
          onClick={() => {
            setConfirm(false);
            act.auth.signOut();
          }}
        >
          Sign out
        </Button>
        <Button variant="ghost" onClick={() => setConfirm(false)}>
          Cancel
        </Button>
      </div>
    </Dialog>
  );
  return { ask, ui };
}

/** Your row at the foot of the sidebar opens your account menu. */
function AccountMenu() {
  const s = useStore();
  const router = useRouter();
  const me = sel.meAsMember(s);
  const signOut = useSignOut();
  return (
    <>
      <Menu
        label="Your account"
        side="top"
        align="start"
        trigger={(p) => (
          <button
            {...p}
            type="button"
            title={sel.displayName(me)}
            aria-label={`Your account, ${sel.displayName(me)}`}
            className="nav-row press flex w-full items-center justify-center gap-3 rounded-[14px] p-2 text-left hover:bg-line xl:justify-start"
          >
            <Avatar member={me} size={36} />
            <span className="sr-only xl:not-sr-only xl:min-w-0 xl:flex-1">
              <span className="block truncate text-[14px] font-semibold text-ink">{sel.displayName(me)}</span>
              <span className="flex items-center gap-1 text-[12.5px] text-muted">
                <TreeGlyph level={me.level} size={14} />
                {me.level} · <span className="tabular">{me.sunlight.toLocaleString()}</span> Sunlight
              </span>
            </span>
            <ChevronsUpDown size={16} className="hidden shrink-0 text-muted xl:block" aria-hidden />
          </button>
        )}
        items={[
          { label: "View profile", icon: <UserRound size={16} />, onSelect: () => router.push("/profile") },
          { label: "Settings", icon: <Settings size={16} />, onSelect: () => router.push("/settings") },
          { label: "Help", icon: <CircleHelp size={16} />, onSelect: () => router.push("/help") },
          "divider",
          { label: "Sign out", icon: <LogOut size={16} />, danger: true, onSelect: signOut.ask },
        ]}
      />
      {signOut.ui}
    </>
  );
}

function MeRow({ onNavigate }: { onNavigate?: () => void }) {
  const s = useStore();
  const me = sel.meAsMember(s);
  return (
    <Link href="/profile" onClick={onNavigate} className="nav-row press flex items-center gap-3 rounded-[14px] p-2 hover:bg-line">
      <Avatar member={me} size={36} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold text-ink">{sel.displayName(me)}</span>
        <span className="flex items-center gap-1 text-[12.5px] text-muted">
          <TreeGlyph level={me.level} size={14} />
          {me.level} · <span className="tabular">{me.sunlight.toLocaleString()}</span> Sunlight
        </span>
      </span>
    </Link>
  );
}

function Sidebar() {
  const path = usePathname();
  return (
    <aside aria-label="Sidebar" className="fixed inset-y-0 left-0 z-30 hidden w-[76px] flex-col border-r border-line bg-chrome px-2 pt-5 pb-4 lg:flex xl:w-[248px] xl:px-3">
      <div className="flex justify-center xl:block xl:px-2">
        <Link href="/home" className="flex items-center gap-2" aria-label="Fertility Grove home">
          <span className="xl:hidden">
            <LogoOrange size={36} />
          </span>
          <span className="hidden xl:block">
            <Logo height={46} priority />
          </span>
        </Link>
        <div className="hidden xl:block">
          <Scope />
        </div>
      </div>
      <div className="mt-5 xl:px-1">
        <Link href="/people" title="Find people" aria-label="Find people" className="nav-row press mx-auto grid h-11 w-11 place-items-center rounded-full bg-raised text-muted hover:bg-line hover:text-ink xl:hidden">
          <Search size={19} aria-hidden />
        </Link>
        <div className="hidden xl:block">
          <SearchBox />
        </div>
      </div>
      <nav aria-label="Main" className="thin-scroll mt-4 flex-1 overflow-y-auto">
        <ul className="space-y-0.5">
          {PRIMARY.map((i) => (
            <NavRow key={i.href} item={i} path={path} rail />
          ))}
        </ul>
        <p className="mt-7 mb-1.5 hidden px-2.5 text-[12.5px] text-muted xl:block">Yours</p>
        <hr className="mx-3 my-4 border-line xl:hidden" />
        <ul className="space-y-0.5">
          {SECONDARY.map((i) => (
            <NavRow key={i.href} item={i} path={path} rail />
          ))}
        </ul>
      </nav>
      <AccountMenu />
    </aside>
  );
}

function PhoneChrome() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const s = useStore();
  const unread = sel.unreadNotifications(s);
  const signOut = useSignOut();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", k);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", k);
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-[calc(52px+env(safe-area-inset-top))] items-end bg-ground/80 px-2 pt-[env(safe-area-inset-top)] pb-1 shadow-[0_1px_0_var(--line)] backdrop-blur-xl backdrop-saturate-150 lg:hidden">
        <div className="flex h-12 w-full items-center gap-1">
          <Link href="/home" className="flex items-center gap-2 px-2" aria-label="Fertility Grove home">
            <Logo height={34} />
          </Link>
          <span className="flex-1" />
          <Link href="/notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="press relative grid h-11 w-11 place-items-center rounded-full text-ink">
            <Bell size={21} strokeWidth={1.8} />
            {unread > 0 && <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-white" />}
          </Link>
          <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="press grid h-11 w-11 place-items-center rounded-full text-ink">
            <MenuIcon size={22} strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 bg-panel/80 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_var(--line)] backdrop-blur-xl backdrop-saturate-150 lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg">
          {PHONE.map((i) => {
            const Icon = i.icon;
            const on = isActive(path, i.href);
            const n = i.count?.(s) ?? 0;
            return (
              <li key={i.href} className="flex-1">
                <Link
                  href={i.href}
                  aria-current={on ? "page" : undefined}
                  className={`press relative flex h-[60px] flex-col items-center justify-center gap-0.5 text-[12px] ${on ? "font-bold text-ink" : "font-medium text-muted"}`}
                >
                  <span className={`grid h-8 w-14 place-items-center rounded-full ${on ? "bg-raised" : ""}`}>
                    <Icon size={21} strokeWidth={on ? 2.2 : 1.7} />
                  </span>
                  {i.label}
                  {n > 0 && (
                    <span className="tabular absolute top-1.5 left-[calc(50%+8px)] grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[12px] font-bold text-ink">
                      {n}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {signOut.ui}
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="scrim absolute inset-0 bg-[rgba(3,30,15,0.32)]" onClick={() => setOpen(false)} />
          <div className="sheet-up absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-[20px] bg-ground px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))]" style={{ overscrollBehavior: "contain" }}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" aria-hidden />
            <div className="mb-4 flex items-center justify-between">
              <span className="serif text-[26px]">Menu</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="press grid h-11 w-11 place-items-center rounded-full hover:bg-raised">
                <X size={22} />
              </button>
            </div>
            <SearchBox onDone={() => setOpen(false)} />
            <ul className="mt-4 space-y-0.5 rounded-[20px] border border-line bg-panel p-2">
              {PRIMARY.map((i) => (
                <NavRow key={i.href} item={i} path={path} onNavigate={() => setOpen(false)} />
              ))}
            </ul>
            <ul className="mt-3 space-y-0.5 rounded-[20px] border border-line bg-panel p-2">
              {SECONDARY.map((i) => (
                <NavRow key={i.href} item={i} path={path} onNavigate={() => setOpen(false)} />
              ))}
            </ul>
            <div className="mt-3 rounded-[20px] border border-line bg-panel p-2">
              <MeRow onNavigate={() => setOpen(false)} />
            </div>
            <button
              type="button"
              onClick={signOut.ask}
              className="press mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[20px] border border-line bg-panel text-[16px] font-semibold text-danger hover:bg-raised"
            >
              <LogOut size={18} aria-hidden /> Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Folds the Guide's label away while you scroll down to read, and brings
    it back as soon as you scroll up. */
function useFoldOnScroll() {
  const [folded, setFolded] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (Math.abs(y - last) < 8) return;
        setFolded(y > 160 && y > last);
        last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return folded;
}

/** The Guide's mark: the brand's orange, its shine a sparkle, so it says both Fertility Grove and AI. */
function GuideMark() {
  return (
    <span className="relative block h-10 w-10">
      <LogoOrange size={31} className="guide-fruit absolute top-[3px] left-[5px]" />
      <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <g className="spark-turn">
          <path className="spark spark-1" fill="#fff" d="M9 7c.8 4.6 2.2 6 7 7-4.8 1-6.2 2.4-7 7-.8-4.6-2.2-6-7-7 4.8-1 6.2-2.4 7-7Z" />
        </g>
        <path className="spark spark-2" fill="#f89414" d="M35 30c.4 2.1.9 2.6 3 3-2.1.4-2.6.9-3 3-.4-2.1-.9-2.6-3-3 2.1-.4 2.6-.9 3-3Z" />
      </svg>
    </span>
  );
}

/* Grove Guide, the AI assistant, floats bottom right: the brand's orange with
   a sparkle for its shine, and an AI tag on the label. The two stars twinkle
   slowly in turn; point at it and the fruit tips on its stem as the big star
   turns. The label folds away while you read. */
function GuideButton() {
  const path = usePathname();
  const folded = useFoldOnScroll();
  if (isActive(path, "/guide") || /^\/messages\/./.test(path)) return null;
  return (
    <aside aria-label="Grove Guide">
      <Link
        href="/guide"
        aria-label="Ask Grove Guide, the AI assistant"
        data-folded={folded || undefined}
        className="guide-fab rise press fixed right-4 bottom-[calc(76px+env(safe-area-inset-bottom))] z-50 flex h-14 items-center rounded-full bg-accent p-2 text-[15px] font-semibold text-white shadow-[0_12px_28px_-10px_rgba(3,30,15,0.5)] hover:bg-black lg:right-8 lg:bottom-8"
      >
        <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center">
          <GuideMark />
        </span>
        <span className="guide-label hidden sm:grid">
          <span className="min-w-0 overflow-hidden">
            <span className="flex items-center gap-2 pr-3 pl-1 whitespace-nowrap">
              Grove Guide
              <span aria-hidden className="rounded-full bg-white/10 px-1.5 py-px text-[12px] font-bold tracking-wide text-brand">AI</span>
            </span>
          </span>
        </span>
      </Link>
    </aside>
  );
}

function UnconfirmedBanner() {
  const me = useStore((s) => s.me);
  const [sent, setSent] = useState(false);
  if (me.status !== "unconfirmed") return null;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[20px] border border-[var(--fg-yellow)] bg-yellow-tint px-5 py-3.5 text-[14px] text-ink">
      <span className="flex-1">
        <strong className="font-semibold">Confirm your email</strong> to post, comment, vote and message. We sent a link to {me.email}.
      </span>
      <span className="flex gap-3 font-semibold">
        <button
          type="button"
          className="underline underline-offset-2"
          onClick={() => {
            act.auth.resendLink();
            setSent(true);
          }}
        >
          {sent ? "Sent again" : "Resend link"}
        </button>
        <Link href="/confirm-email" className="underline underline-offset-2">
          Open link
        </Link>
      </span>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const scene = sceneFor(path);
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only z-[100] rounded-full bg-accent px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <Sidebar />
      <PhoneChrome />
      <main
        id="main"
        tabIndex={-1}
        className={`relative px-4 pb-[calc(148px+env(safe-area-inset-bottom))] sm:px-6 lg:ml-[76px] lg:px-10 lg:pb-28 xl:ml-[248px] ${
          scene ? "pt-[104px] lg:pt-[132px]" : "pt-4 lg:pt-9"
        }`}
      >
        {scene && <HeaderBackdrop scene={scene} />}
        <div className="relative mx-auto max-w-[1160px]">
          <UnconfirmedBanner />
          {children}
        </div>
      </main>
      <GuideButton />
      <Toaster />
    </div>
  );
}
