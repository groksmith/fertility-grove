"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Gift, Heart, MapPin, Share2 } from "lucide-react";
import {
  Avatar,
  Button,
  EmptyState,
  Field,
  Input,
  LinkButton,
  Logo,
  Modal,
  Progress,
  Textarea,
  useCopy,
} from "@/components/ui";
import { useStore } from "@/lib/store";

export default function PublicCampaignPage() {
  const params = useParams<{ slug: string }>();
  const { campaigns, myCampaign, donate, fulfillWishlistItem } = useStore();
  const [donateOpen, setDonateOpen] = useState(false);
  const [copied, copy] = useCopy();
  const [thanks, setThanks] = useState(false);

  const campaign =
    campaigns.find((c) => c.slug === params.slug) ??
    (myCampaign?.slug === params.slug ? myCampaign : undefined);

  if (!campaign) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-20">
        <EmptyState
          title="This campaign isn't available."
          body="The link may be wrong, or the campaign may have been closed."
          action={<LinkButton href="/fundraising">Browse campaigns</LinkButton>}
        />
      </div>
    );
  }

  const pct = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));

  return (
    <div className="min-h-screen bg-white">
      {/* Public header — no app chrome, this page is shareable */}
      <header className="border-b border-line">
        <div className="mx-auto flex h-[72px] max-w-[1120px] items-center px-6">
          <Link href="/fundraising" aria-label="Fertility Grove">
            <Logo />
          </Link>
          <Link
            href="/fundraising"
            className="ml-auto inline-flex items-center gap-1.5 text-[14px] text-muted"
          >
            <ArrowLeft size={15} /> Back to Fertility Grove
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-6 pb-24 pt-9">
        <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
          <div>
            <div
              className="relative h-[340px] overflow-hidden rounded-2xl"
              style={{ background: campaign.cover }}
            >
              <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3.5 py-2 text-[13px] font-medium text-white backdrop-blur">
                <MapPin size={14} /> {campaign.city}, {campaign.state}
              </span>
            </div>

            <h1 className="serif mt-7 text-[38px] leading-tight">{campaign.title}</h1>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={campaign.owner} size={38} />
              <p className="text-[14px]">
                Organized by{" "}
                <span className="font-semibold">{campaign.owner}</span>
                {campaign.beneficiaries.length > 1 && (
                  <span className="text-muted">
                    {" "}
                    · for {campaign.beneficiaries.join(" & ")}
                  </span>
                )}
              </p>
            </div>

            <div className="mt-8 whitespace-pre-line text-[15.5px] leading-[1.75]">
              {campaign.story}
            </div>

            {campaign.status === "Closed" && (
              <p className="mt-8 rounded-xl bg-surface px-5 py-4 text-[14px]">
                This campaign is closed and is no longer accepting donations. The
                page stays up so supporters can revisit it.
              </p>
            )}

            {campaign.wishlist.length > 0 && (
            <section className="mt-12">
              <h2 className="serif flex items-center gap-2 text-[24px]">
                <Gift size={19} /> Gift wishlist
              </h2>
              <ul className="mt-4 space-y-3">
                {campaign.wishlist.map((w) => (
                  <li
                    key={w.id}
                    className="flex flex-wrap items-center gap-4 rounded-xl border border-line px-5 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold">{w.title}</p>
                      <p className="text-[13.5px] text-muted">
                        Provider: {w.provider}
                      </p>
                    </div>
                    <p className="text-[13.5px] text-muted">
                      Wants: {w.wanted} &middot; Has: {w.fulfilled}
                    </p>
                    <Button
                      size="sm"
                      variant="quiet"
                      disabled={w.fulfilled >= w.wanted}
                      onClick={() => fulfillWishlistItem(campaign.slug, w.id)}
                    >
                      {w.fulfilled >= w.wanted ? "Fulfilled" : "I'll get this"}
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
            )}
          </div>

          {/* Donate rail */}
          <aside>
            <div className="sticky top-8 rounded-2xl border border-line p-6">
              <p className="text-[30px] font-bold text-blue-ink">
                ${campaign.raised.toLocaleString()}
              </p>
              <p className="mt-1 text-[14px] text-muted">
                raised of ${campaign.goal.toLocaleString()} goal &middot; {pct}%
              </p>
              <div className="mt-3">
                <Progress value={campaign.raised} max={campaign.goal} />
              </div>

              <Button
                variant="blue"
                className="mt-5 h-12 w-full !text-[15px]"
                disabled={campaign.status === "Closed"}
                onClick={() => setDonateOpen(true)}
              >
                <Heart size={17} /> Donate
              </Button>
              <Button
                variant="outline"
                className="mt-3 h-11 w-full"
                onClick={() =>
                  copy(`https://fertilitygrove.com/f/${campaign.slug}`)
                }
              >
                <Share2 size={16} /> {copied ? "Link copied" : "Share this campaign"}
              </Button>

              <p className="mt-5 text-[13px] text-muted">
                Ends {campaign.endsOn}
              </p>

              <h3 className="mt-7 text-[15px] font-semibold">
                {campaign.supporters.length} supporters
              </h3>
              <ul className="mt-3 space-y-4">
                {campaign.supporters.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <Avatar name={s.name === "Anonymous" ? "A N" : s.name} size={32} />
                    <div className="min-w-0">
                      <p className="text-[13.5px]">
                        <span className="font-semibold">{s.name}</span>{" "}
                        <span className="text-muted">· {s.when}</span>
                      </p>
                      <p className="text-[13.5px] font-semibold text-blue-ink">
                        ${s.amount.toLocaleString()}
                      </p>
                      {s.message && (
                        <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
                          &ldquo;{s.message}&rdquo;
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>

      <DonateModal
        open={donateOpen}
        onClose={() => setDonateOpen(false)}
        onDonate={(amount, name, message) => {
          donate(campaign.slug, amount, name, message);
          setDonateOpen(false);
          setThanks(true);
        }}
      />

      <Modal
        open={thanks}
        onClose={() => setThanks(false)}
        width={440}
        labelledBy="thanks-title"
      >
        <div className="text-center">
          <p className="text-[34px]">💚</p>
          <h3 id="thanks-title" className="serif mt-2 text-[26px]">
            Thank you.
          </h3>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
            Your donation has been added to {campaign.owner}&rsquo;s campaign.
          </p>
          <Button className="mt-6" onClick={() => setThanks(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function DonateModal({
  open,
  onClose,
  onDonate,
}: {
  open: boolean;
  onClose: () => void;
  onDonate: (amount: number, name: string, message?: string) => void;
}) {
  const [amount, setAmount] = useState(50);
  const [name, setName] = useState("");
  const [anon, setAnon] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <Modal open={open} onClose={onClose} width={480} labelledBy="donate-title">
      <h3 id="donate-title" className="serif text-[26px]">
        Support this campaign
      </h3>
      <p className="mt-1.5 text-[13.5px] text-muted">
        Prototype only — no payment is taken and no card details are collected.
      </p>

      <div className="mt-5 flex flex-wrap gap-2.5">
        {[25, 50, 100, 250].map((a) => (
          <button
            key={a}
            onClick={() => setAmount(a)}
            aria-pressed={amount === a}
            className="h-11 rounded-xl px-5 text-[15px] font-semibold transition"
            style={{
              background: amount === a ? "var(--fg-blue)" : "var(--surface)",
            }}
          >
            ${a}
          </button>
        ))}
        <div className="flex h-11 items-center rounded-xl border border-line-strong px-3">
          <span className="text-muted">$</span>
          <input
            value={amount}
            inputMode="numeric"
            onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, "")) || 0)}
            aria-label="Custom amount"
            className="w-20 bg-transparent px-1 text-[15px] focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <Field label="Your name">
          <Input
            value={anon ? "Anonymous" : name}
            disabled={anon}
            onChange={(e) => setName(e.target.value)}
            placeholder="How you'd like to appear"
          />
        </Field>
        <label className="flex items-center gap-2.5 text-[14px]">
          <input
            type="checkbox"
            checked={anon}
            onChange={(e) => setAnon(e.target.checked)}
            className="h-4 w-4 accent-[#529BD7]"
          />
          Give anonymously
        </label>
        <Field label="Leave a message (optional)">
          <Textarea
            rows={3}
            maxLength={500}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="blue"
          disabled={amount < 5}
          onClick={() =>
            onDonate(amount, anon ? "Anonymous" : name || "A friend", message || undefined)
          }
        >
          Give ${amount}
        </Button>
      </div>
    </Modal>
  );
}
