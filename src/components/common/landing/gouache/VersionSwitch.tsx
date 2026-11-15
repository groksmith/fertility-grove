import Link from "next/link";

/* A small floating switcher for reviewing the landing versions side by side. Preview only. */
const ITEMS = [
  { v: "original", label: "Original" },
  { v: "a", label: "A · Riviera" },
  { v: "b", label: "B · Travel poster" },
  { v: "c", label: "C · Storybook" },
  { v: "d", label: "D · Riviera, new layout" },
];

export function VersionSwitch({ current }: { current: string }) {
  return (
    <nav
      aria-label="Landing versions"
      className="fixed bottom-4 left-1/2 z-[60] flex max-w-[calc(100vw-32px)] -translate-x-1/2 gap-1 overflow-x-auto rounded-full bg-[var(--site-ink)]/90 p-1 text-[13px] font-semibold text-white shadow-[0_10px_30px_-10px_rgb(0_0_0/0.5)] backdrop-blur-md"
    >
      {ITEMS.map((i) => (
        <Link
          key={i.v}
          href={`/preview/${i.v}`}
          aria-current={current === i.v ? "page" : undefined}
          className={`shrink-0 rounded-full px-3.5 py-2 whitespace-nowrap transition-colors duration-300 ${current === i.v ? "bg-white text-[var(--site-ink)]" : "hover:bg-white/10"}`}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
