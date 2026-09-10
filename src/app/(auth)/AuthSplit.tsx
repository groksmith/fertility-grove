"use client";

import { LogoMark } from "@/components/ui";

export function AuthSplit({
  headline,
  children,
}: {
  headline: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[42.7%_57.3%]">
      <div className="relative flex flex-col bg-[#F5F5F5] px-10 py-8 lg:px-16 lg:py-12">
        <span className="inline-flex items-center gap-3">
          <LogoMark size={52} />
          <span className="serif text-[19px] leading-none">fertilitygrove</span>
        </span>
        <h1
          className="serif mt-16 max-w-[620px] text-[52px] leading-[1.08] tracking-[-0.01em] lg:mt-24 lg:text-[72px]"
          style={{ color: "#031E0F" }}
        >
          {headline}
        </h1>
      </div>
      <div className="flex flex-col px-8 py-10 lg:px-14 lg:py-16">{children}</div>
    </div>
  );
}
