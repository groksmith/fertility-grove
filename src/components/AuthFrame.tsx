"use client";

/* The calm frame for sign-up, sign-in and account screens: the form on the
   page ground, the grove drawn beside it on desktop and as a short band on a
   phone. */

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Backdrop } from "@/components/art/Cozy";
import { OnboardingScene } from "@/components/art/Scenes";

export function AuthFrame({
  title,
  lede,
  children,
  step = 8,
  footer,
}: {
  title: string;
  lede?: React.ReactNode;
  children: React.ReactNode;
  step?: number;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-ground lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="flex min-h-dvh flex-col px-4 pt-[max(20px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))] sm:px-8 lg:px-16">
        <header className="flex h-14 items-center justify-between">
          <Link href="/" aria-label="Fertility Grove home" className="text-ink">
            <Logo height={40} priority />
          </Link>
          <Link href="/help" className="text-[14px] font-semibold text-ink-soft hover:text-ink">
            Help
          </Link>
        </header>
        <div className="mx-auto -mx-4 mt-2 h-36 overflow-hidden sm:-mx-8 lg:hidden" aria-hidden>
          <OnboardingScene step={step} className="h-full w-full" />
        </div>
        <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-8 lg:py-12">
          <h1 className="serif text-[36px] leading-[1.05] text-ink sm:text-[44px]">{title}</h1>
          {lede && <div className="mt-3 text-[16px] leading-relaxed text-ink-soft">{lede}</div>}
          <div className="mt-7">{children}</div>
        </main>
        {footer && <footer className="mx-auto w-full max-w-[440px] text-[14px] text-muted">{footer}</footer>}
      </div>
      <aside className="sticky top-0 hidden h-dvh p-4 lg:block" aria-hidden>
        <div className="relative h-full overflow-hidden rounded-[20px]">
          <Backdrop kind="auth" wash />
          <OnboardingScene step={step} className="h-full w-full" />
        </div>
      </aside>
    </div>
  );
}

/** Google's "G", for the Continue with Google buttons on sign-up and sign-in. */
export function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
      <path fill="#FBBC05" d="M10.6 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.8l-8 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}

/** A plain reading page for help, terms and privacy. */
export function ReadingFrame({ title, lede, children }: { title: string; lede?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-ground">
      <header className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-4 pt-[env(safe-area-inset-top)] sm:px-8">
        <Link href="/" aria-label="Fertility Grove home" className="text-ink">
          <Logo height={40} priority />
        </Link>
        <nav className="flex gap-5 text-[14px] font-semibold text-ink-soft">
          <Link href="/help" className="hover:text-ink">Help</Link>
          <Link href="/login" className="hover:text-ink">Sign in</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-[760px] px-4 pt-8 pb-20 sm:px-8 sm:pt-14">
        <h1 className="serif text-[40px] leading-[1.05] text-ink sm:text-[56px]">{title}</h1>
        {lede && <p className="mt-3 max-w-[60ch] text-[17px] leading-relaxed text-ink-soft">{lede}</p>}
        <div className="mt-10">{children}</div>
      </main>
    </div>
  );
}
