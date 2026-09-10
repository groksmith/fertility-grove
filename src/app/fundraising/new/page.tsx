"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  ImageUp,
  Plus,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  Button,
  Confetti,
  Field,
  fieldWidth,
  Input,
  notWired,
  Progress,
  Textarea,
  useCopy,
} from "@/components/ui";
import { MY_CAMPAIGN_TEMPLATE, PHOTO_LIBRARY } from "@/lib/data";
import { FUNDRAISING_TABS } from "@/lib/nav";
import { useStore } from "@/lib/store";

const TOTAL = 8;

export default function CreateCampaignPage() {
  const router = useRouter();
  const { profile, publishCampaign } = useStore();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [copied, copy] = useCopy();
  const [sent, setSent] = useState<{ text: boolean; email: boolean }>({
    text: false,
    email: false,
  });

  const [form, setForm] = useState({
    story: "",
    title: "",
    goal: "",
    beneficiaries: [`${profile.firstName} ${profile.lastName}`],
    beneficiaryDraft: "",
    cover: PHOTO_LIBRARY[1].css,
    endsOn: "",
    wishlist: [] as { title: string; provider: string; wanted: number }[],
    wishDraft: { title: "", provider: "", wanted: 1 },
    shareText: "",
    shareEmail: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const slug =
    form.title
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || MY_CAMPAIGN_TEMPLATE.slug;

  function validate() {
    if (step === 1 && form.story.trim().length < 50)
      return "Tell your story in at least 50 characters — this is what people read first.";
    if (step === 2 && form.title.trim().length < 3)
      return "Give your campaign a title.";
    if (step === 3) {
      const g = Number(form.goal);
      if (!g || g < 100 || g > 100000)
        return "Enter a goal between $100 and $100,000.";
    }
    if (step === 5) {
      if (!form.endsOn) return "Choose an end date.";
      const days = Math.round(
        (new Date(form.endsOn).getTime() - Date.now()) / 86_400_000,
      );
      if (days < 7) return "Campaigns need to run for at least 7 days.";
      if (days > 180) return "Campaigns can run for at most 180 days.";
    }
    return "";
  }

  function next() {
    const err = validate();
    setError(err);
    if (err) return;
    if (step === 7) {
      publishCampaign({
        ...MY_CAMPAIGN_TEMPLATE,
        id: `mine-${Date.now()}`,
        slug,
        title: form.title,
        owner: `${profile.firstName} ${profile.lastName}`,
        ownerHandle: `@${profile.handle}`,
        goal: Number(form.goal),
        raised: 0,
        cover: form.cover,
        story: form.story,
        endsOn: new Date(form.endsOn).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        city: profile.zip === "94549" ? "Lafayette" : MY_CAMPAIGN_TEMPLATE.city,
        beneficiaries: form.beneficiaries,
        status: "Live",
        supporters: [],
        wishlist: form.wishlist.map((w, i) => ({
          id: `w-${Date.now()}-${i}`,
          title: w.title,
          provider: w.provider,
          wanted: w.wanted,
          fulfilled: 0,
        })),
      });
    }
    setStep((s) => Math.min(TOTAL, s + 1));
  }

  return (
    <AppShell section="fundraising" tabs={FUNDRAISING_TABS} wide>
      <div className="flex items-start gap-4">
        <div
          className="flex flex-1 flex-wrap gap-2"
          role="group"
          aria-label={`Step ${step} of ${TOTAL}`}
        >
          {Array.from({ length: TOTAL }, (_, i) => (
            <span
              key={i}
              className="h-2 w-10 rounded-full transition-colors sm:w-16"
              style={{ background: i < step ? "#3D3D3D" : "#DCDCDC" }}
            />
          ))}
        </div>
        <Link
          href="/fundraising"
          aria-label="Exit campaign builder"
          className="ml-auto text-ink"
        >
          <X size={22} />
        </Link>
      </div>

      <div className="relative mt-10 min-h-[520px]">
        {step === 8 && <Confetti />}

        {step === 1 && (
          <Section
            title="Why are you fundraising?"
            sub="Say it in your own words. People give to a person, not a number."
          >
            <Textarea
              rows={10}
              maxLength={10000}
              value={form.story}
              onChange={(e) => set("story", e.target.value)}
              placeholder="Where you are, what you're raising for, and what support would mean…"
              className="max-w-[760px] !text-[15px] !leading-relaxed"
            />
            <p className="mt-1.5 max-w-[760px] text-right text-[12.5px] text-muted-light">
              {form.story.length}/10,000
            </p>
          </Section>
        )}

        {step === 2 && (
          <Section
            title="Give your campaign a title."
            sub="Short and human. This is the headline people see when you share the link."
          >
            <div className="max-w-[620px]">
              <Input
                value={form.title}
                maxLength={120}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Annie's IVF Journey"
                className="h-14 !text-[18px]"
              />
              <p className="mt-2 text-[13px] text-muted">
                Your link will be{" "}
                <span className="font-medium text-ink">
                  fertilitygrove.com/f/{slug}
                </span>
              </p>
            </div>
          </Section>
        )}

        {step === 3 && (
          <>
            <Section
              title="How much would you like to raise?"
              sub="(You can always edit this later.)"
            >
              <div className={`flex ${fieldWidth} items-center gap-3 rounded-xl border border-line-strong px-4`}>
                <span className="text-[18px] text-muted">$</span>
                <input
                  value={form.goal}
                  inputMode="numeric"
                  onChange={(e) =>
                    set("goal", e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="Enter amount"
                  aria-label="Goal amount"
                  className="w-full bg-transparent py-4 text-[18px] placeholder:text-muted-light focus:outline-none"
                />
              </div>
            </Section>

            <Section
              title="Who will receive the funds raised?"
              sub="This should be yourself and anyone else who is part of your fertility journey (a spouse, significant other, etc)."
              className="mt-12"
            >
              <div className="flex max-w-[820px] flex-wrap gap-2">
                {form.beneficiaries.map((b, i) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-2 rounded-full bg-tint-blue px-4 py-2 text-[14px]"
                  >
                    {b}
                    {i > 0 && (
                      <button
                        onClick={() =>
                          set(
                            "beneficiaries",
                            form.beneficiaries.filter((x) => x !== b),
                          )
                        }
                        aria-label={`Remove ${b}`}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {form.beneficiaries.length < 5 && (
                <form
                  className="mt-3 flex max-w-[520px] gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!form.beneficiaryDraft.trim()) return;
                    set("beneficiaries", [
                      ...form.beneficiaries,
                      form.beneficiaryDraft.trim(),
                    ]);
                    set("beneficiaryDraft", "");
                  }}
                >
                  <Input
                    value={form.beneficiaryDraft}
                    onChange={(e) => set("beneficiaryDraft", e.target.value)}
                    placeholder="Start typing..."
                    aria-label="Add a beneficiary"
                  />
                  <Button type="submit" variant="quiet">
                    <Plus size={15} /> Add
                  </Button>
                </form>
              )}
            </Section>
          </>
        )}

        {step === 4 && (
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="serif text-[30px]">Add a cover photo.</h2>
              <p className="mt-2 max-w-[520px] text-[14.5px] leading-relaxed">
                Add a personal touch to your fund. Choose a photo that represents
                your story. Ex: a photo of you, you and your partner, a pet, or a
                place you love.
              </p>
              <div
                className="mt-6 h-[210px] max-w-[520px] rounded-xl"
                style={{ background: form.cover }}
              />
              <button
                className="mt-4 inline-flex items-center gap-2 text-[14px] font-medium underline underline-offset-2 disabled:no-underline disabled:opacity-40"
                {...notWired}
              >
                <ImageUp size={17} /> Upload your own
              </button>

              <h3 className="serif mt-9 text-[24px]">
                Tips for choosing a cover photo:
              </h3>
              <div className="mt-4 space-y-4 text-[14px] leading-relaxed">
                <div className="flex gap-3">
                  <ThumbsUp size={20} className="mt-0.5 shrink-0" />
                  <p>
                    <span className="font-semibold">Do…</span>
                    <br />
                    Choose a clear, high-quality image.
                    <br />
                    Make sure everyone in the photo is okay with being featured.
                  </p>
                </div>
                <div className="flex gap-3">
                  <ThumbsDown size={20} className="mt-0.5 shrink-0" />
                  <p>
                    <span className="font-semibold">Please Avoid…</span>
                    <br />
                    Blurry images.
                    <br />
                    Sensitive medical imagery.
                    <br />
                    Inappropriate or offensive content.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="serif text-[30px]">
                Or, choose from our photo library:
              </h2>
              <div className="mt-6 grid grid-cols-2 gap-5">
                {PHOTO_LIBRARY.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => set("cover", p.css)}
                    aria-label={p.label}
                    aria-pressed={form.cover === p.css}
                    className="relative h-[124px] rounded-xl transition"
                    style={{
                      background: p.css,
                      boxShadow:
                        form.cover === p.css ? "0 0 0 3px #529BD7" : undefined,
                    }}
                  >
                    {form.cover === p.css && (
                      <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white">
                        <Check size={14} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <Section
            title="When should your campaign end?"
            sub="Campaigns run between 7 and 180 days. You can extend it later while it's live."
          >
            <div className="max-w-[360px]">
              <Field label="End date" required>
                <Input
                  type="date"
                  value={form.endsOn}
                  onChange={(e) => set("endsOn", e.target.value)}
                />
              </Field>
              <div className="mt-4 flex gap-2">
                {[30, 60, 90].map((d) => (
                  <Button
                    key={d}
                    size="sm"
                    variant="quiet"
                    onClick={() => {
                      const dt = new Date();
                      dt.setDate(dt.getDate() + d);
                      set("endsOn", dt.toISOString().slice(0, 10));
                    }}
                  >
                    {d} days
                  </Button>
                ))}
              </div>
            </div>
          </Section>
        )}

        {step === 6 && (
          <Section
            title="Add a gift wishlist?"
            sub="Optional. Some supporters would rather give a specific thing than a number — a massage, a nurse visit, a session."
          >
            <ul className="max-w-[620px] space-y-2.5">
              {form.wishlist.map((w) => (
                <li
                  key={w.title}
                  className="flex items-center gap-3 rounded-xl border border-line px-4 py-3"
                >
                  <span className="flex-1 text-[14.5px]">
                    <span className="font-semibold">{w.title}</span>{" "}
                    <span className="text-muted">· {w.provider}</span>
                  </span>
                  <span className="text-[13px] text-muted">wants {w.wanted}</span>
                  <button
                    onClick={() =>
                      set(
                        "wishlist",
                        form.wishlist.filter((x) => x.title !== w.title),
                      )
                    }
                    aria-label={`Remove ${w.title}`}
                  >
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ul>

            <form
              className="mt-4 grid max-w-[620px] gap-3 sm:grid-cols-[1fr_1fr_90px_auto]"
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.wishDraft.title.trim()) return;
                set("wishlist", [...form.wishlist, form.wishDraft]);
                set("wishDraft", { title: "", provider: "", wanted: 1 });
              }}
            >
              <Input
                value={form.wishDraft.title}
                onChange={(e) =>
                  set("wishDraft", { ...form.wishDraft, title: e.target.value })
                }
                placeholder="Item"
                aria-label="Wishlist item"
              />
              <Input
                value={form.wishDraft.provider}
                onChange={(e) =>
                  set("wishDraft", { ...form.wishDraft, provider: e.target.value })
                }
                placeholder="Provider"
                aria-label="Provider"
              />
              <Input
                type="number"
                min={1}
                max={50}
                value={form.wishDraft.wanted}
                onChange={(e) =>
                  set("wishDraft", {
                    ...form.wishDraft,
                    wanted: Number(e.target.value),
                  })
                }
                aria-label="How many"
              />
              <Button type="submit" variant="quiet">
                Add
              </Button>
            </form>
          </Section>
        )}

        {step === 7 && (
          <Section title="Ready to go live?" sub="Here's what supporters will see.">
            <div className="max-w-[620px] overflow-hidden rounded-2xl border border-line">
              <div className="h-[190px]" style={{ background: form.cover }} />
              <div className="p-6">
                <h3 className="text-[20px] font-bold">{form.title}</h3>
                <p className="mt-1 text-[13.5px] text-muted">
                  {profile.firstName} {profile.lastName} &middot;{" "}
                  {form.beneficiaries.join(", ")}
                </p>
                <div className="mt-4">
                  <Progress value={0} max={Number(form.goal) || 1} />
                  <p className="mt-2 text-[14px] font-bold text-blue-ink">
                    $0 raised
                    <span className="ml-1.5 font-medium text-muted">
                      of ${Number(form.goal).toLocaleString()}
                    </span>
                  </p>
                </div>
                <p className="mt-4 line-clamp-4 whitespace-pre-line text-[14px] leading-relaxed">
                  {form.story}
                </p>
                <p className="mt-4 text-[13px] text-muted">
                  Ends {form.endsOn || "—"}
                </p>
              </div>
            </div>
          </Section>
        )}

        {step === 8 && (
          <div className="relative pt-24">
            <div className="flex flex-wrap items-start gap-10">
              <div className="min-w-[320px] flex-1">
                <h2 className="serif text-[30px] leading-tight">
                  Great work {profile.firstName}! Your Support Campaign is now live.
                </h2>
                <p className="mt-2 text-[14.5px]">
                  Let&rsquo;s share it with some of your loved ones and kick start
                  those donations.
                </p>

                <div className="mt-8 max-w-[460px] space-y-6">
                  <div>
                    <p className="text-[14.5px] font-semibold">Share via text</p>
                    <div className={`mt-2 flex ${fieldWidth} items-center rounded-xl border border-line-strong pr-2`}>
                      <input
                        value={form.shareText}
                        onChange={(e) => set("shareText", e.target.value)}
                        placeholder="415-528-8216"
                        aria-label="Phone number"
                        className="w-full bg-transparent px-4 py-3 text-[14.5px] placeholder:text-muted focus:outline-none"
                      />
                      <Button
                        variant="quiet"
                        size="sm"
                        disabled={!form.shareText.trim() || sent.text}
                        onClick={() => setSent((v) => ({ ...v, text: true }))}
                      >
                        {sent.text ? "Sent" : "Send"}
                      </Button>
                    </div>
                    {sent.text && (
                      <p className="mt-1.5 text-[12.5px] text-green-dark">
                        Text sent (simulated in this prototype).
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-[14.5px] font-semibold">Share via email</p>
                    <div className={`mt-2 flex ${fieldWidth} items-center rounded-xl border border-line-strong pr-2`}>
                      <input
                        value={form.shareEmail}
                        onChange={(e) => set("shareEmail", e.target.value)}
                        placeholder="anniesfriend99@gmail.com"
                        aria-label="Email address"
                        className="w-full bg-transparent px-4 py-3 text-[14.5px] placeholder:text-muted focus:outline-none"
                      />
                      <Button
                        variant="quiet"
                        size="sm"
                        disabled={!form.shareEmail.trim() || sent.email}
                        onClick={() => setSent((v) => ({ ...v, email: true }))}
                      >
                        {sent.email ? "Sent" : "Send"}
                      </Button>
                    </div>
                    {sent.email && (
                      <p className="mt-1.5 text-[12.5px] text-green-dark">
                        Email sent (simulated in this prototype).
                      </p>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <Button
                      variant="green"
                      onClick={() =>
                        copy(`https://fertilitygrove.com/f/${slug}`)
                      }
                    >
                      <Copy size={15} /> {copied ? "Link copied" : "Copy link"}
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                variant="blue"
                size="lg"
                onClick={() => router.push(`/fundraising/${slug}`)}
              >
                View in browser
              </Button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 max-w-[620px] rounded-lg bg-[#FDECEA] px-4 py-3 text-[13.5px] font-medium text-[#B23A2E]"
        >
          {error}
        </p>
      )}

      <div className="mt-10 flex items-center justify-between">
        {step > 1 && step < 8 ? (
          <button
            onClick={() => {
              setError("");
              setStep((s) => s - 1);
            }}
            className="inline-flex items-center gap-2 text-[15px]"
          >
            <ArrowLeft size={17} /> back
          </button>
        ) : (
          <span />
        )}
        {step < 8 ? (
          <Button variant="blue" size="lg" onClick={next}>
            {step === 7 ? "Publish campaign" : step === 1 ? "Start" : "Next"}
          </Button>
        ) : (
          <Button
            variant="blue"
            size="lg"
            onClick={() => router.push("/fundraising/mine")}
          >
            Finish
          </Button>
        )}
      </div>
    </AppShell>
  );
}

function Section({
  title,
  sub,
  children,
  className = "",
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`fade-up ${className}`}>
      <h2 className="serif text-[30px] leading-tight">{title}</h2>
      {sub && (
        <p className="mt-2 max-w-[820px] text-[14.5px] leading-relaxed">{sub}</p>
      )}
      <div className="mt-6">{children}</div>
    </section>
  );
}
