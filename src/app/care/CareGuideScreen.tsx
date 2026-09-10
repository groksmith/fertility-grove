"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  HeartHandshake,
  MapPin,
  MessageSquareText,
  Search,
  Users,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CareIcon } from "@/components/CareIcons";
import {
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Tag,
} from "@/components/ui";
import { PROVIDERS, PROVIDER_CATEGORIES } from "@/lib/data";
import { CARE_TABS } from "@/lib/nav";
import { useStore } from "@/lib/store";
import { DIAGNOSES, type Provider, type ProviderCategory } from "@/lib/types";

const DISTANCES = [5, 10, 20, 50, 100];

export function CareGuideScreen({
  initialCategory = "",
}: {
  initialCategory?: string;
}) {
  const { profile, savedVendors, toggleVendor, careNetwork, addToCareNetwork, recommendProvider } =
    useStore();
  /* Only a real category deep-links into results; anything else opens browse. */
  const seed = (PROVIDER_CATEGORIES as string[]).includes(initialCategory)
    ? (initialCategory as ProviderCategory)
    : "";

  const [searched, setSearched] = useState(!!seed);
  const [term, setTerm] = useState<string>(seed);
  const [zip, setZip] = useState(profile.zip);
  const [category, setCategory] = useState<ProviderCategory | "">(seed);
  const [distance, setDistance] = useState(20);
  const [diagnoses, setDiagnoses] = useState<string[]>([]);
  const [delivery, setDelivery] = useState<"" | "In-Person" | "Virtual" | "Both">("");
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);

  const HOME_ZIP = "94549";

  /* Prototype geocoding: distances in the data are relative to 94549, so a
     different zip shifts every provider by a stable amount instead of
     pretending the field does nothing. */
  const zipOffset = useMemo(() => {
    const a = Number(HOME_ZIP);
    const b = Number((zip || "").slice(0, 5));
    if (!b || Number.isNaN(b)) return 0;
    return Math.min(45, Math.round(Math.abs(a - b) / 40));
  }, [zip]);

  const results = useMemo(() => {
    return PROVIDERS.map((p) => ({ ...p, distance: p.distance + zipOffset })).filter((p) => {
      if (category && !p.categories.includes(category)) return false;
      if (p.distance > distance) return false;
      if (delivery && p.delivery !== delivery && p.delivery !== "Both") return false;
      if (diagnoses.length && !diagnoses.some((d) => p.diagnoses.includes(d)))
        return false;
      if (
        term &&
        !p.name.toLowerCase().includes(term.toLowerCase()) &&
        !p.categories.join(" ").toLowerCase().includes(term.toLowerCase())
      )
        return false;
      return true;
    }).sort((a, b) => a.distance - b.distance);
  }, [category, distance, delivery, diagnoses, term, zipOffset]);

  /* The next radius up from the current one, or null at the ceiling. */
  const nextDistance = DISTANCES.find((d) => d > distance) ?? null;

  function runSearch(cat?: ProviderCategory) {
    if (cat) {
      setCategory(cat);
      setTerm(cat);
    }
    setSearched(true);
  }

  return (
    <AppShell
      section="care"
      tabs={CARE_TABS}
      rail={
        <CareRail
          onRecommend={() => setRecommendOpen(true)}
          onQuiz={() => setQuizOpen(true)}
        />
      }
    >
      <h2 className="serif text-[27px] leading-tight">
        Find care that supports your fertility.
      </h2>
      <p className="mt-1.5 max-w-[840px] text-[14.5px] leading-relaxed">
        Browse therapies based on your unique needs. Discover what&rsquo;s helped
        others and connect with vetted providers near you.
      </p>

      {!searched ? (
        <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
          {PROVIDER_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => runSearch(c)}
              className="flex flex-col items-center gap-3 rounded-2xl bg-surface px-4 py-6 transition hover:bg-tint-green"
            >
              <CareIcon category={c} size={72} />
              <span className="text-[14px] font-medium">{c}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-6 flex gap-3 overflow-x-auto pb-2 thin-scroll">
          {[
            ...(category ? [category] : []),
            ...PROVIDER_CATEGORIES.filter((c) => c !== category),
          ].map((c) => (
            <button
              key={c}
              onClick={() => runSearch(c)}
              aria-pressed={category === c}
              className="flex w-[150px] shrink-0 flex-col items-center gap-2 rounded-2xl px-3 py-4 transition"
              style={{
                background: category === c ? "var(--tint-green)" : "var(--surface)",
                boxShadow: category === c ? "inset 0 0 0 2px #42C074" : undefined,
              }}
            >
              <CareIcon category={c} size={52} />
              <span className="text-[13.5px] font-medium">{c}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search bar */}
      <form
        className="mt-7 flex flex-wrap items-stretch gap-3 rounded-2xl border border-line-strong p-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          setSearched(true);
        }}
      >
        <div className="flex min-w-[220px] flex-1 flex-col justify-center px-3">
          <span className="text-[12px] text-muted">Search</span>
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Therapy, clinic, or specialist"
            aria-label="Search care"
            className="bg-transparent text-[15px] placeholder:text-muted-light focus:outline-none"
          />
        </div>
        <div className="flex w-[160px] flex-col justify-center rounded-lg border border-line px-3 py-1.5">
          <span className="text-[12px] text-muted">Zip Code</span>
          <input
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            aria-label="Zip code"
            className="bg-transparent text-[15px] focus:outline-none"
          />
        </div>
        <Button type="submit" variant="quiet" className="h-auto px-8">
          <Search size={16} /> Search
        </Button>
      </form>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-[13.5px] text-muted">Filters:</span>

        <FilterSelect
          label="Category"
          value={category}
          onChange={(v) => {
            setCategory(v as ProviderCategory);
            setTerm(v);
          }}
          options={PROVIDER_CATEGORIES}
        />
        <FilterSelect
          label="Distance"
          value={String(distance)}
          onChange={(v) => setDistance(Number(v) || 20)}
          options={DISTANCES.map(String)}
          format={(v) => `${v} mi`}
          alwaysActive
        />
        <FilterSelect
          label="Diagnoses Treated"
          value={diagnoses[0] ?? ""}
          onChange={(v) => setDiagnoses(v ? [v] : [])}
          options={[...DIAGNOSES]}
        />
        <FilterSelect
          label="Virtual/In-Person"
          value={delivery}
          onChange={(v) => setDelivery(v as "" | "In-Person" | "Virtual" | "Both")}
          options={["In-Person", "Virtual", "Both"]}
        />

        {(category || diagnoses.length || delivery) && (
          <button
            onClick={() => {
              setCategory("");
              setDiagnoses([]);
              setDelivery("");
              setTerm("");
            }}
            className="text-[13.5px] underline underline-offset-2 text-muted"
          >
            Clear all
          </button>
        )}
      </div>

      {searched && (
        <>
          <div className="mt-9 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <h3 className="serif min-w-0 flex-1 text-[22px] sm:text-[25px]">
              {category || term || "All care"} within {distance} miles of {zip}
            </h3>
            <span className="serif shrink-0 text-[17px] text-muted">
              {results.length} results
            </span>
          </div>

          {results.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title={`No ${category || term || "care"} providers within ${distance} miles of ${zip} yet.`}
                body="Every provider in our Care Guide has been recommended by at least 3 members — so newer areas fill in slowly."
                action={
                  <div className="flex flex-wrap justify-center gap-3">
                    {nextDistance !== null && (
                      <Button onClick={() => setDistance(nextDistance)}>
                        Widen to {nextDistance} miles
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setRecommendOpen(true)}>
                      Recommend a Provider
                    </Button>
                  </div>
                }
              />
            </div>
          ) : (
            <ul className="mt-6 space-y-8">
              {results.map((p) => (
                <ProviderCard
                  key={p.id}
                  provider={p}
                  saved={savedVendors.includes(p.id)}
                  inNetwork={careNetwork.some((c) => c.providerId === p.id)}
                  onSave={() => toggleVendor(p.id)}
                  onAddNetwork={() => addToCareNetwork(p.id, p.categories[0])}
                />
              ))}
            </ul>
          )}
        </>
      )}

      <RecommendModal
        open={recommendOpen}
        onClose={() => setRecommendOpen(false)}
        onSubmit={recommendProvider}
      />
      <QuizModal
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        onPick={(c) => runSearch(c)}
      />
    </AppShell>
  );
}

/* ----------------------------------------------------------- filter chip */

function FilterSelect({
  label,
  value,
  onChange,
  options,
  format,
  alwaysActive,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  format?: (v: string) => string;
  alwaysActive?: boolean;
}) {
  const active = alwaysActive || !!value;
  return (
    <label
      className="relative inline-flex items-center rounded-full transition"
      style={{
        background: active ? "var(--tint-green)" : "transparent",
        boxShadow: active ? "inset 0 0 0 1px #42C074" : undefined,
        color: active ? "#0A7A3B" : "var(--muted)",
      }}
    >
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="appearance-none bg-transparent py-1.5 pl-3.5 pr-8 text-[13.5px] font-medium focus:outline-none"
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {format ? format(o) : o}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3" />
    </label>
  );
}

/* ---------------------------------------------------------- provider card */

function ProviderCard({
  provider,
  saved,
  inNetwork,
  onSave,
  onAddNetwork,
}: {
  provider: Provider;
  saved: boolean;
  inNetwork: boolean;
  onSave: () => void;
  onAddNetwork: () => void;
}) {
  const [i, setI] = useState(0);
  const review = provider.reviews[i];

  return (
    <li className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row">
      <div
        className="grid h-[120px] w-[180px] shrink-0 place-items-center rounded-xl px-4 text-center"
        style={{ background: provider.logoBg, color: provider.logoInk }}
      >
        <span className="text-[15px] font-semibold leading-tight tracking-wide">
          {provider.name}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="flex flex-wrap gap-2">
            {provider.categories.map((c, idx) => (
              <Tag key={c} tone={idx === 0 ? "green" : "gray"} outlined={idx === 0}>
                {c}
              </Tag>
            ))}
          </div>
          <button
            onClick={onSave}
            aria-pressed={saved}
            aria-label={saved ? `Unsave ${provider.name}` : `Save ${provider.name}`}
            className="ml-auto transition"
            style={{ color: saved ? "var(--fg-green-dark)" : "var(--ink)" }}
          >
            <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>

        <h4 className="mt-2 text-[18px] font-bold">{provider.name}</h4>

        <ul className="mt-2 space-y-1 text-[13.5px] text-ink">
          <li className="flex items-center gap-1.5">
            <MapPin size={14} /> {provider.distance} mi &middot; {provider.city},{" "}
            {provider.state}
          </li>
          <li className="flex items-center gap-1.5">
            <Users size={14} /> {provider.usedBy} Fertility Grove members use this
            vendor
          </li>
          <li className="flex items-center gap-1.5">
            <MessageSquareText size={14} /> {provider.reviewCount} reviews
          </li>
        </ul>

        {review && (
          <div className="mt-4">
            <p className="text-[14px] font-semibold">{review.author}</p>
            <p className="mt-1 text-[14px] leading-relaxed">{review.body}</p>
            {provider.reviews.length > 1 && (
              <div className="mt-3 flex items-center justify-center gap-6">
                <button
                  onClick={() => setI((v) => (v - 1 + provider.reviews.length) % provider.reviews.length)}
                  aria-label="Previous review"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-[12.5px] text-muted">
                  {i + 1} / {provider.reviews.length}
                </span>
                <button
                  onClick={() => setI((v) => (v + 1) % provider.reviews.length)}
                  aria-label="Next review"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-4">
          <Button size="sm" variant={inNetwork ? "outline" : "quiet"} onClick={onAddNetwork}>
            <HeartHandshake size={15} />
            {inNetwork ? "In my care network" : "Add to My Care Network"}
          </Button>
        </div>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------- rail */

function CareRail({
  onRecommend,
  onQuiz,
}: {
  onRecommend: () => void;
  onQuiz: () => void;
}) {
  const { savedVendors, careNetwork } = useStore();
  const saved = PROVIDERS.filter((p) => savedVendors.includes(p.id));

  return (
    <div>
      <p className="text-[15px] font-semibold leading-snug">
        Have a favorite doctor, clinic, or specialist?
      </p>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
        Submit their name to help others find trusted care. Every provider in our
        Care Guide has been recommended by at least 3 of our members.
      </p>
      <Button
        variant="green"
        className="mt-4 h-12 w-full !text-[15px]"
        onClick={onRecommend}
      >
        Recommend a Provider
      </Button>

      <section className="mt-8">
        <h3 className="serif flex items-center gap-2 text-[20px]">
          <Bookmark size={17} /> My Saved Vendors
        </h3>
        <ul className="mt-3 space-y-3">
          {saved.map((p) => (
            <li key={p.id}>
              <p className="text-[14px]">{p.name}</p>
              <p className="text-[13px] text-muted">{p.categories[0]}</p>
            </li>
          ))}
        </ul>
        <Link
          href="/care/network"
          className="mt-3 inline-block text-[13.5px] font-semibold underline underline-offset-2"
        >
          See all
        </Link>
      </section>

      <section className="mt-8">
        <h3 className="serif flex items-center gap-2 text-[20px]">
          <CircleHelp size={17} /> Quick Tip
        </h3>
        <p className="mt-2 text-[13.5px] leading-relaxed">
          Not sure what therapies are right for you? Take a quick quiz to get
          personalized suggestions.
        </p>
        <Button variant="green" size="sm" className="mt-3" onClick={onQuiz}>
          Take Quiz
        </Button>
      </section>

      <section className="mt-8">
        <h3 className="serif flex items-center gap-2 text-[20px]">
          <HeartHandshake size={17} /> My Care Network
        </h3>
        <ul className="mt-3 space-y-3">
          {careNetwork.map((c) => {
            const p = PROVIDERS.find((x) => x.id === c.providerId);
            if (!p) return null;
            return (
              <li key={c.providerId} className="flex gap-2.5">
                <span className="mt-1 text-green">✳</span>
                <span>
                  <span className="block text-[13px] text-muted">{c.therapy}</span>
                  <span className="block text-[14px] font-semibold">{p.name}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------- modals */

function RecommendModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (p: { name: string; category: string; city: string; state: string }) => void;
}) {
  const [form, setForm] = useState({ name: "", category: "", city: "", state: "" });
  const [done, setDone] = useState(false);

  return (
    <Modal open={open} onClose={onClose} width={520} labelledBy="rec-title">
      {done ? (
        <div className="text-center">
          <h3 id="rec-title" className="serif text-[26px]">
            Thank you.
          </h3>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
            {form.name} now has 1 of the 3 member recommendations needed to be
            published in the Care Guide. We&rsquo;ll let you know when they go live.
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              setDone(false);
              setForm({ name: "", category: "", city: "", state: "" });
              onClose();
            }}
          >
            Done
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name || !form.category) return;
            onSubmit(form);
            setDone(true);
          }}
        >
          <h3 id="rec-title" className="serif text-[26px]">
            Recommend a Provider
          </h3>
          <p className="mt-1.5 text-[13.5px] text-muted">
            Providers appear in the Care Guide once three different members have
            recommended them.
          </p>
          <div className="mt-5 space-y-4">
            <Field label="Provider name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Category" required>
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Select…</option>
                {PROVIDER_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-[1fr_100px] gap-4">
              <Field label="City">
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </Field>
              <Field label="State">
                <Input
                  maxLength={2}
                  value={form.state}
                  onChange={(e) =>
                    setForm({ ...form, state: e.target.value.toUpperCase() })
                  }
                />
              </Field>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Submit recommendation</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

const QUIZ = [
  {
    q: "What feels hardest right now?",
    options: [
      { label: "The stress and the waiting", cats: ["Talk Therapy", "Reiki", "Massage Therapy"] },
      { label: "Understanding my options", cats: ["IVF", "IUI"] },
      { label: "Physical symptoms", cats: ["Acupuncture", "Nutrition", "Red Light Therapy"] },
    ],
  },
  {
    q: "How do you prefer to be supported?",
    options: [
      { label: "In person, hands-on", cats: ["Massage Therapy", "Acupuncture"] },
      { label: "Talking it through", cats: ["Talk Therapy", "Psychiatry"] },
      { label: "Practical and structured", cats: ["Nutrition", "Supplements", "Home Support"] },
    ],
  },
];

function QuizModal({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (c: ProviderCategory) => void;
}) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);

  const done = step >= QUIZ.length;
  const ranked = Array.from(new Set(picked)).slice(0, 4);

  return (
    <Modal open={open} onClose={onClose} width={520} labelledBy="quiz-title">
      <div className="flex items-start justify-between gap-4">
        <h3 id="quiz-title" className="serif text-[26px]">
          {done ? "Some places to start" : "Care quiz"}
        </h3>
        <button
          onClick={() => {
            setStep(0);
            setPicked([]);
            onClose();
          }}
          aria-label="Close the care quiz"
          className="mt-1 text-muted transition hover:text-ink"
        >
          <X size={20} />
        </button>
      </div>

      {!done ? (
        <>
          <p className="mt-4 text-[16px] font-medium">{QUIZ[step].q}</p>
          <ul className="mt-4 space-y-2.5">
            {QUIZ[step].options.map((o) => (
              <li key={o.label}>
                <button
                  onClick={() => {
                    setPicked((p) => [...p, ...o.cats]);
                    setStep((s) => s + 1);
                  }}
                  className="w-full rounded-xl border border-line px-4 py-3 text-left text-[14.5px] transition hover:bg-tint-green"
                >
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="mt-2 text-[13.5px] text-muted">
            Advisory only — this is not medical advice.
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {ranked.map((c) => (
              <li
                key={c}
                className="flex items-center gap-3 rounded-xl bg-tint-green px-4 py-3 text-[14px] font-medium"
              >
                <CareIcon category={c as ProviderCategory} size={30} />
                {c}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => {
                const first = ranked[0];
                setStep(0);
                setPicked([]);
                onClose();
                if (first) onPick(first as ProviderCategory);
              }}
            >
              Browse these
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
