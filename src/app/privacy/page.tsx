import { ReadingFrame } from "@/components/AuthFrame";

export const metadata = { title: "Privacy · Fertility Grove" };

const PROMISES = [
  ["Handles by default", "You post under a handle unless you choose to show your first name and last initial."],
  ["No ad trackers", "There are no advertising pixels or trackers anywhere in Fertility Grove."],
  ["Health data is never sold", "Your answers about your health are used only to match you with people, groups and information."],
  ["Download or delete everything", "Settings has Download my data and Delete my account. Deletion is final after 14 days."],
];

export default function PrivacyPage() {
  return (
    <ReadingFrame title="Privacy" lede="Sample text for the prototype. The final Privacy Policy and Consumer Health Data Privacy Policy are written with counsel before launch.">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PROMISES.map(([h, p]) => (
          <li key={h} className="rounded-[20px] border border-line bg-panel p-5">
            <h2 className="text-[17px] font-semibold text-ink">{h}</h2>
            <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{p}</p>
          </li>
        ))}
      </ul>

      <section id="health-data" className="mt-12">
        <h2 className="text-[24px] font-semibold text-ink">Consumer Health Data Privacy Policy</h2>
        <div className="mt-4 max-w-[64ch] space-y-4 text-[16px] leading-relaxed text-ink-soft">
          <p>
            When you answer the onboarding questions about your journey stage, diagnosis and path to parenthood, we collect
            consumer health data. We ask for your separate, explicit consent before we use it.
          </p>
          <p>
            We use it only to match you with groups, people, mentors and articles, and, if you allow it, to tailor Grove Guide
            answers. We do not sell it, share it with advertisers or use it to train AI models.
          </p>
          <p>
            You can withdraw consent at any time in Settings. Withdrawing deletes those answers, and the parts of Fertility Grove
            that used them show “Not shared” instead.
          </p>
          <p>
            We follow US health-data law, including the FTC Health Breach Notification Rule and Washington&apos;s My Health My
            Data Act.
          </p>
        </div>
      </section>
    </ReadingFrame>
  );
}
