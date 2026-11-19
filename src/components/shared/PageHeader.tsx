"use client";

export function PageHeader({
  title,
  lede,
  actions,
  art,
}: {
  title: string;
  lede?: React.ReactNode;
  actions?: React.ReactNode;
  art?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
      <div className="flex min-w-0 items-center gap-4">
        {art}
        <div className="min-w-0">
          <h1 className="serif text-[28px] leading-[1.1] text-ink lg:text-[32px]">{title}</h1>
          {lede && (
            <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-ink-soft">{lede}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
