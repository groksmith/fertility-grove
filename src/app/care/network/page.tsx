"use client";

import { Bookmark, HeartHandshake, MapPin, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CareIcon } from "@/components/CareIcons";
import { EmptyState, LinkButton, Tag } from "@/components/ui";
import { PROVIDERS } from "@/lib/data";
import { CARE_TABS } from "@/lib/nav";
import { useStore } from "@/lib/store";
import type { ProviderCategory } from "@/lib/types";

export default function CareNetworkPage() {
  const { careNetwork, savedVendors, toggleVendor } = useStore();

  const network = careNetwork
    .map((c) => ({ ...c, provider: PROVIDERS.find((p) => p.id === c.providerId) }))
    .filter((c) => c.provider);

  const saved = PROVIDERS.filter((p) => savedVendors.includes(p.id));

  return (
    <AppShell section="care" tabs={CARE_TABS} wide>
      <h2 className="serif text-[27px]">My care network</h2>
      <p className="mt-1.5 max-w-[720px] text-[14.5px] leading-relaxed text-muted">
        Who actually treats you — kept separate from the vendors you&rsquo;ve only
        bookmarked.
      </p>

      {network.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Your care network is empty."
            body="Add the providers who are part of your actual care so you can find them fast."
            action={<LinkButton href="/care">Browse the Care Guide</LinkButton>}
          />
        </div>
      ) : (
        <ul className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {network.map(({ provider, therapy }) => (
            <li
              key={provider!.id}
              className="rounded-2xl border border-line p-5 transition hover:shadow-[0_10px_30px_-16px_rgba(0,0,0,0.2)]"
            >
              <div className="flex items-start gap-4">
                <CareIcon category={therapy as ProviderCategory} size={44} />
                <div className="min-w-0">
                  <Tag tone="green" outlined>
                    {therapy}
                  </Tag>
                  <p className="mt-2 text-[16.5px] font-bold">{provider!.name}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
                    <MapPin size={13} /> {provider!.city}, {provider!.state} &middot;{" "}
                    {provider!.distance} mi
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3 className="serif mt-12 flex items-center gap-2 text-[24px]">
        <Bookmark size={19} /> My saved vendors
      </h3>
      {saved.length === 0 ? (
        <p className="mt-3 text-[14px] text-muted">
          Nothing bookmarked yet. Tap the bookmark on any provider to keep it here.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line rounded-2xl border border-line">
          {saved.map((p) => (
            <li key={p.id} className="flex items-center gap-4 px-5 py-4">
              <HeartHandshake size={18} className="text-muted" />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold">{p.name}</p>
                <p className="text-[13px] text-muted">
                  {p.categories.join(" · ")} &middot; {p.city}, {p.state}
                </p>
              </div>
              <button
                onClick={() => toggleVendor(p.id)}
                aria-label={`Remove ${p.name} from saved`}
                className="text-muted-light transition hover:text-ink"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
