"use client";

/* AI credits. The screen's question: how many Guide questions do I have left,
   and when do free ones come back? Balance first, then packs, then history. */

import { Spot } from "@/components/art/Scenes";
import { LinkButton, PageHeader, Panel } from "@/components/ui";
import { CREDITS } from "@/lib/options";
import { formatDate, nextRefill, usd } from "@/lib/rules/credits";
import { sel, useStore } from "@/lib/store";

export default function CreditsPage() {
  const s = useStore();
  const total = sel.creditTotal(s);
  const refill = formatDate(nextRefill(s.me.signupDay));
  const purchases = s.credits.purchases;

  return (
    <>
      <PageHeader
        title="AI credits"
        lede={`${sel.plural(total, "credit")} left. Free credits refill to ${CREDITS.freePerMonth} on ${refill}; purchased credits never expire.`}
        art={<Spot kind="lantern" size={88} className="hidden sm:block" />}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Panel className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-3 sm:p-7">
            <div>
              <p className="text-[14px] text-muted">Balance</p>
              <p className="tabular mt-1 text-[36px] leading-none font-semibold">{total}</p>
              <p className="mt-2 text-[13px] text-muted">
                {Math.floor(total / CREDITS.questionCost)} Guide questions, or {Math.floor(total / CREDITS.appointmentListCost)} appointment lists
              </p>
            </div>
            <div>
              <p className="text-[14px] text-muted">Free this month</p>
              <p className="tabular mt-1 text-[24px] font-semibold">
                {s.credits.free} <span className="text-[15px] font-normal text-muted">/ {CREDITS.freePerMonth}</span>
              </p>
              <p className="mt-2 text-[13px] text-muted">Used first · refills on {refill}</p>
            </div>
            <div>
              <p className="text-[14px] text-muted">Purchased</p>
              <p className="tabular mt-1 text-[24px] font-semibold">{s.credits.purchased}</p>
              <p className="mt-2 text-[13px] text-muted">Never expire</p>
            </div>
          </Panel>

          <section aria-labelledby="packs-h">
            <h2 id="packs-h" className="mb-3 text-[20px] font-semibold">Buy credits</h2>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {CREDITS.packs.map((p, i) => (
                <li key={p.id}>
                  <Panel className="flex h-full flex-col p-5">
                    <span className={`inline-flex h-7 w-fit items-center rounded-full px-3 text-[13px] font-semibold ${["bg-green-tint text-green-ink", "bg-blue-tint text-blue-ink", "bg-yellow-tint text-yellow-ink"][i]}`}>{p.name}</span>
                    <p className="tabular mt-4 text-[30px] leading-none font-semibold">{p.credits}</p>
                    <p className="text-[14px] text-muted">credits</p>
                    <p className="tabular mt-4 text-[18px] font-semibold">{usd(p.price)}</p>
                    <p className="text-[13px] text-muted">Includes sales tax · {usd(p.price / p.credits)} a credit</p>
                    <div className="mt-auto pt-5">
                      <LinkButton href={`/credits/checkout?pack=${p.id}`} variant={i === 1 ? "primary" : "secondary"} className="w-full">
                        Choose {p.name}
                      </LinkButton>
                    </div>
                  </Panel>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] text-muted">Packs are non-refundable. Sample prices: the final numbers are still being set.</p>
          </section>
        </div>

        <aside aria-labelledby="history-h">
          <h2 id="history-h" className="mb-3 text-[16px] font-semibold">Purchase history</h2>
          <Panel className="p-2">
            {purchases.length ? (
              <ul>
                {purchases.map((p) => {
                  const pack = CREDITS.packs.find((x) => x.id === p.packId);
                  return (
                    <li key={p.id} className="flex items-center gap-3 rounded-[14px] p-3">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold">{pack?.name} · {p.credits} credits</span>
                        <span className="block text-[13px] text-muted">{p.daysAgo === 0 ? "Today" : `${p.daysAgo} days ago`}</span>
                      </span>
                      <span className="text-right">
                        <span className="tabular block text-[15px] font-semibold">{usd(p.price)}</span>
                        <span className={`block text-[13px] font-semibold ${p.status === "paid" ? "text-green-ink" : "text-danger"}`}>{p.status === "paid" ? "Paid" : "Failed"}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="p-3 text-[14px] text-muted">No purchases yet. Your free credits are always used first.</p>
            )}
          </Panel>
        </aside>
      </div>
    </>
  );
}
