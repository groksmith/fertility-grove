import Link from "next/link";
import { ReadingFrame } from "@/components/AuthFrame";

export const metadata = { title: "Terms · Fertility Grove" };

const SECTIONS = [
  ["Who can join", "Fertility Grove is for adults 18 and older in the United States. During the beta you need an invite link."],
  ["What Fertility Grove is not", "We are not a medical provider, a clinic directory or a crisis service. Nothing here, including the Grove Guide, is medical advice. Talk to your own doctor about your care."],
  ["How we treat each other", "Be kind. Share your experience as your experience. No selling, no harassment, and no pregnancy news outside Success stories. Our community guidelines say more."],
  ["Your content", "You own what you post. You give us permission to show it to the members you chose to share it with, and you can delete it at any time."],
  ["Credits", "Grove Guide credit packs are non-refundable. Free credits refill monthly and don't carry over; purchased credits never expire."],
  ["Ending your account", "You can delete your account at any time from Settings. You have 14 days to restore it by signing back in."],
];

export default function TermsPage() {
  return (
    <ReadingFrame title="Terms" lede="Sample text for the prototype. The final Terms are written with counsel before launch.">
      <div className="space-y-8">
        {SECTIONS.map(([h, p]) => (
          <section key={h}>
            <h2 className="text-[20px] font-semibold text-ink">{h}</h2>
            <p className="mt-2 max-w-[64ch] text-[16px] leading-relaxed text-ink-soft">{p}</p>
          </section>
        ))}
        <p className="text-[15px] text-muted">
          Questions? <Link href="/help" className="font-semibold text-accent underline">Contact support</Link>.
        </p>
      </div>
    </ReadingFrame>
  );
}
