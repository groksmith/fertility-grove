"use client";

/* Checkout stand-in. The real product hands off to Stripe-hosted checkout and
   never sees card details; the prototype shows that hand-off honestly, with
   no card fields, and lets the tester choose the outcome. */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { Suspense, useState } from "react";
import { useResult } from "@/components/Safety";
import { Button, Choices, Field, Input, LinkButton, PageHeader, Panel } from "@/components/ui";
import { CREDITS } from "@/lib/options";
import { usd } from "@/lib/rules/credits";
import { checks } from "@/lib/rules/validation";
import { act, sel, useStore } from "@/lib/store";

function Checkout() {
  const params = useSearchParams();
  const s = useStore();
  const [packName, setPackName] = useState<string[]>([
    CREDITS.packs.find((p) => p.id === params.get("pack"))?.name ?? CREDITS.packs[1].name,
  ]);
  const [email, setEmail] = useState(s.me.email);
  const [emailErr, setEmailErr] = useState<string>();
  const [result, setResult] = useState<"paid" | "failed" | null>(null);
  const [error, setError] = useState<string>();
  const { handle, ui } = useResult();
  const pack = CREDITS.packs.find((p) => p.name === packName[0])!;

  const pay = (outcome: "paid" | "failed") => {
    const e = checks.email(email);
    setEmailErr(e);
    if (e) return;
    const r = act.credits.buy(pack.id, outcome);
    if (!r.ok && r.code === "unconfirmed") {
      handle(r);
      return;
    }
    if (!r.ok && outcome === "paid") {
      setError(r.error);
      return;
    }
    setError(undefined);
    setResult(outcome);
  };

  if (result === "paid") {
    return (
      <Panel className="mx-auto flex max-w-xl flex-col items-center p-8 text-center">
        <CheckCircle2 size={48} className="text-accent" />
        <h1 className="serif mt-4 text-[36px] leading-tight">{pack.credits} credits added</h1>
        <p className="tabular mt-2 text-[15px] text-ink-soft">
          You now have {sel.plural(sel.creditTotal(s), "credit")}. A receipt for {usd(pack.price)} (tax included) is on its way to {email}.
        </p>
        <div className="mt-6 flex gap-2">
          <LinkButton href="/guide">Ask the Guide</LinkButton>
          <LinkButton href="/credits" variant="ghost">Back to credits</LinkButton>
        </div>
      </Panel>
    );
  }

  return (
    <>
      <Link href="/credits" className="mb-3 -ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-[15px] font-semibold text-muted hover:text-ink">
        <ArrowLeft size={16} /> AI credits
      </Link>
      <PageHeader title="Buy credits" lede="Pick a pack. Payment happens on a secure page run by our payment provider." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel className="space-y-6 p-6 sm:p-7">
          <Choices legend="Credit pack" options={CREDITS.packs.map((p) => p.name)} value={packName} onChange={setPackName} columns={3} />
          <Field label="Email for receipt" error={emailErr}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoCapitalize="none" />
          </Field>
          <div className="rounded-[14px] bg-yellow-tint p-4 text-[14px] leading-relaxed text-[var(--yellow-700)]">
            <strong className="font-semibold">Demo checkout. No card is charged.</strong> In the real product this step opens Stripe&apos;s secure page; Fertility Grove never sees card details.
          </div>
          {result === "failed" && (
            <p role="alert" className="rounded-[14px] bg-danger-soft p-4 text-[14px] font-semibold text-danger">
              Your payment didn&apos;t go through, and no credits were added. Please try again.
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-[14px] bg-danger-soft p-4 text-[14px] font-semibold text-danger">
              {error}
            </p>
          )}
        </Panel>

        <aside>
          <Panel className="p-6">
            <h2 className="text-[16px] font-semibold">Summary</h2>
            <dl className="mt-4 space-y-2 text-[15px]">
              <div className="flex justify-between"><dt className="text-muted">{pack.name} pack</dt><dd className="tabular">{pack.credits} credits</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Price, tax included</dt><dd className="tabular font-semibold">{usd(pack.price)}</dd></div>
            </dl>
            <p className="mt-4 text-[14px] font-semibold text-ink">Packs are non-refundable.</p>
            <p className="mt-1 text-[13px] text-muted">Purchased credits never expire. Free credits are used first.</p>
            <Button className="mt-5 w-full" onClick={() => pay("paid")}>
              <Lock size={16} /> Pay {usd(pack.price)}
            </Button>
            <Button variant="ghost" className="mt-2 w-full" onClick={() => pay("failed")}>
              Simulate a failed payment
            </Button>
          </Panel>
        </aside>
      </div>
      {ui}
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <Checkout />
    </Suspense>
  );
}
