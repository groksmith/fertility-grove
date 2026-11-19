"use client";

import { MessageCircleHeart, Phone } from "lucide-react";
import { CRISIS } from "@/config/options";

/** Crisis resources: 988 as buttons and as plain text (PRD §19). */
export function CrisisCard({ intro, tone = "card" }: { intro?: string; tone?: "card" | "inline" }) {
  return (
    <div
      role="note"
      className={`rounded-[20px] ${tone === "card" ? "bg-accent p-5 text-white" : "border border-line bg-raised p-4 text-ink"}`}
    >
      <p className="text-[16px] font-semibold leading-snug">
        {intro ?? "You're not alone. Help is available right now."}
      </p>
      <p
        className={`mt-1 text-[14px] leading-relaxed ${tone === "card" ? "text-white/85" : "text-ink-soft"}`}
      >
        {CRISIS.line}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={CRISIS.call}
          className={`press inline-flex h-11 items-center gap-2 rounded-full px-5 text-[15px] font-semibold ${tone === "card" ? "bg-white text-ink" : "bg-accent text-white"}`}
        >
          <Phone size={16} /> Call 988
        </a>
        <a
          href={CRISIS.text}
          className={`press inline-flex h-11 items-center gap-2 rounded-full px-5 text-[15px] font-semibold ${tone === "card" ? "bg-white/15 text-white" : "bg-white text-ink"}`}
        >
          <MessageCircleHeart size={16} /> Text 988
        </a>
        <a
          href={CRISIS.chat}
          target="_blank"
          rel="noreferrer noopener"
          className={`press inline-flex h-11 items-center rounded-full px-5 text-[15px] font-semibold ${tone === "card" ? "bg-white/15 text-white" : "bg-white text-ink"}`}
        >
          Chat online
        </a>
      </div>
      <p className={`mt-3 text-[13px] ${tone === "card" ? "text-white/80" : "text-muted"}`}>
        Phone and text: 988. In an emergency, call 911.
      </p>
    </div>
  );
}
