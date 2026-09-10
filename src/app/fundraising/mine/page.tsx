"use client";

import Link from "next/link";
import { Copy, ExternalLink, Gift, Heart, Share2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  Avatar,
  Button,
  EmptyState,
  LinkButton,
  Progress,
  Tag,
  useCopy,
} from "@/components/ui";
import { FUNDRAISING_TABS } from "@/lib/nav";
import { useStore } from "@/lib/store";

export default function MyCampaignPage() {
  const { myCampaign } = useStore();
  const [copied, copy] = useCopy();

  if (!myCampaign) {
    return (
      <AppShell section="fundraising" tabs={FUNDRAISING_TABS}>
        <EmptyState
          title="You don't have a campaign yet."
          body="Give your loved ones a way to support your fertility journey financially. It takes one sitting."
          action={
            <LinkButton href="/fundraising/new" variant="blue">
              Create Support Campaign
            </LinkButton>
          }
        />
      </AppShell>
    );
  }

  const pct = Math.round((myCampaign.raised / myCampaign.goal) * 100);
  const shareUrl = `https://fertilitygrove.com/f/${myCampaign.slug}`;

  return (
    <AppShell section="fundraising" tabs={FUNDRAISING_TABS} wide>
      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          <div
            className="h-[240px] rounded-2xl"
            style={{ background: myCampaign.cover }}
          />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <h2 className="serif text-[32px] leading-tight">{myCampaign.title}</h2>
            <Tag tone={myCampaign.status === "Live" ? "green" : "gray"}>
              {myCampaign.status}
            </Tag>
          </div>
          <p className="mt-2 text-[13.5px] text-muted">
            fertilitygrove.com/f/{myCampaign.slug} &middot; ends {myCampaign.endsOn}
          </p>

          <p className="mt-6 whitespace-pre-line text-[15px] leading-relaxed">
            {myCampaign.story}
          </p>

          <section className="mt-10">
            <h3 className="serif flex items-center gap-2 text-[23px]">
              <Gift size={18} /> My gift wishlist
            </h3>
            {myCampaign.wishlist.length === 0 && (
              <p className="mt-3 text-[14px] text-muted">
                You didn&rsquo;t add any wishlist items to this campaign.
              </p>
            )}
            <ul className="mt-4 space-y-3">
              {myCampaign.wishlist.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center gap-4 rounded-xl border border-line px-5 py-4"
                >
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold">{w.title}</p>
                    <p className="text-[13.5px] text-muted">
                      Provider: {w.provider}
                    </p>
                  </div>
                  <p className="text-[13.5px] text-muted">
                    Wants: {w.wanted} &middot; Has: {w.fulfilled}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside>
          <div className="rounded-2xl border border-line p-6">
            <p className="text-[30px] font-bold text-blue-ink">
              ${myCampaign.raised.toLocaleString()}
            </p>
            <p className="mt-1 text-[14px] text-muted">
              of ${myCampaign.goal.toLocaleString()} &middot; {pct}%
            </p>
            <div className="mt-3">
              <Progress value={myCampaign.raised} max={myCampaign.goal} />
            </div>

            <Link
              href={`/fundraising/${myCampaign.slug}`}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-blue text-[14.5px] font-medium transition hover:brightness-95"
            >
              <ExternalLink size={16} /> View public page
            </Link>
            <Button
              variant="outline"
              className="mt-3 h-11 w-full"
              onClick={() => copy(shareUrl)}
            >
              <Share2 size={16} /> Share
            </Button>
            <Button
              variant="ghost"
              className="mt-1 h-11 w-full"
              onClick={() => copy(shareUrl)}
            >
              <Copy size={16} /> {copied ? "Link copied" : "Copy link"}
            </Button>

            <h4 className="mt-7 flex items-center gap-2 text-[15px] font-semibold">
              <Heart size={15} /> Supporters
            </h4>
            {myCampaign.supporters.length === 0 ? (
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
                No donations yet. Sharing the link with five people is usually what
                gets the first one.
              </p>
            ) : (
              <ul className="mt-3 space-y-4">
                {myCampaign.supporters.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <Avatar name={s.name === "Anonymous" ? "A N" : s.name} size={30} />
                    <div>
                      <p className="text-[13.5px] font-semibold">{s.name}</p>
                      <p className="text-[13.5px] text-blue-ink">
                        ${s.amount.toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
