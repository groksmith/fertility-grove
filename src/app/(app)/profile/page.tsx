"use client";

/* Your profile. The question: how is my tree growing, and what do others see?
   The tree leads; Sunlight history explains every point; "How others see me"
   shows exactly the public view; edit mode follows PRD §6's field rules. */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Eye, PenLine, X } from "lucide-react";
import { Spot } from "@/components/art/Scenes";
import { TreeArt } from "@/components/art/Tree";
import {
  Avatar,
  AvatarPicker,
  BadgeChip,
  Button,
  Choices,
  Counter,
  Field,
  HueSwatches,
  Input,
  LinkButton,
  Name,
  Panel,
  Select,
  Tabs,
  Textarea,
  toast,
} from "@/components/ui";
import { ReferFriend } from "@/components/ReferFriend";
import { requestLeave, useUnsavedGuard } from "@/components/UnsavedGuard";
import { act, sel, useStore } from "@/lib/store";
import { PRONOUNS } from "@/lib/options";
import { MSG, checks } from "@/lib/rules/validation";
import { LEVELS, levelIndex, nextLevel, progress } from "@/lib/rules/sunlight";
import type { Hue } from "@/lib/types";


function TreeHero() {
  const me = useStore((s) => s.me);
  const next = nextLevel(me.level);
  const pct = Math.round(progress(me.level, me.sunlight) * 100);
  return (
    <Panel className="overflow-hidden">
      <div className="grid grid-cols-1 items-end gap-0 border-b border-line bg-white sm:grid-cols-[auto_1fr]">
        <div className="flex justify-center px-6 pt-6 [&_svg]:h-auto [&_svg]:w-[150px] sm:[&_svg]:w-[220px]">
          <TreeArt level={me.level} size={220} title={`${me.level} tree`} />
        </div>
        <div className="px-6 pt-2 pb-6 sm:pt-6">
          <p className="serif text-[44px] leading-none text-ink">{me.level}</p>
          <p className="mt-1 text-[14px] text-green-ink">Your tree level</p>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="tabular text-[30px] font-semibold text-ink">{me.sunlight.toLocaleString()}</span>
            <span className="text-[15px] text-ink-soft">Sunlight</span>
          </p>
          {next ? (
            <>
              <div className="mt-3 h-2.5 max-w-sm overflow-hidden rounded-full bg-white" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress to ${next.level}`}>
                <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-[14px] text-ink-soft">
                <span className="tabular">{(next.at - me.sunlight).toLocaleString()}</span> more Sunlight to {next.level}
                {next.level === "Blossom Tree" && ", when mentoring opens"}
              </p>
            </>
          ) : (
            <p className="mt-2 text-[14px] text-ink-soft">You&apos;ve reached the top of the grove.</p>
          )}
        </div>
      </div>
      <ol className="grid grid-cols-5 gap-1 px-4 py-4 sm:px-6" aria-label="Tree levels">
        {LEVELS.map((l) => {
          const reached = levelIndex(me.level) >= levelIndex(l.level);
          return (
            <li key={l.level} className={`flex flex-col items-center text-center ${reached ? "" : "[&_img]:opacity-35 [&_img]:grayscale"}`} aria-current={l.level === me.level ? "step" : undefined}>
              <TreeArt level={l.level} size={52} />
              <span className={`mt-1 text-[12.5px] leading-tight ${l.level === me.level ? "font-semibold text-ink" : "text-muted"}`}>{l.level}</span>
              <span className="tabular text-[12px] text-muted">{l.at.toLocaleString()}</span>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

function SunlightHistory() {
  const history = useStore((s) => s.me.history);
  return (
    <Panel className="p-5 sm:p-6" id="sunlight" aria-labelledby="sun-h">
      <h2 id="sun-h" className="text-[18px] font-semibold">Sunlight history</h2>
      <p className="mt-0.5 text-[14px] text-muted">Only you can see this. You earn Sunlight when other members find you helpful.</p>
      {history.length === 0 ? (
        <p className="mt-4 text-[15px] text-muted">Nothing yet. Your first upvote or follower starts it.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {history.map((h) => (
            <li key={h.id} className="flex items-center gap-4 py-3 text-[14px]">
              <span className="min-w-0 flex-1 leading-snug">{h.label}</span>
              <span className="shrink-0 text-muted">{h.daysAgo === 0 ? "Today" : `${h.daysAgo}d ago`}</span>
              <span className={`tabular w-14 shrink-0 text-right font-semibold ${h.amount < 0 ? "text-coral-ink" : "text-green-ink"}`}>
                {h.amount > 0 ? "+" : "−"}
                {Math.abs(h.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <details className="mt-4 text-[14px] text-ink-soft">
        <summary className="cursor-pointer font-semibold text-ink">How Sunlight works</summary>
        <ul className="mt-2 space-y-1">
          <li>+1 for each upvote you receive, up to 100 a day.</li>
          <li>−1 for each downvote, never on Support needed or Just venting posts.</li>
          <li>+2 for each new follower, up to 20 a day.</li>
          <li>+10 when a friend you invited finishes onboarding.</li>
          <li>Your level never drops, even if Sunlight does.</li>
        </ul>
      </details>
    </Panel>
  );
}

function PublicPreview() {
  const s = useStore();
  const me = sel.meAsMember(s);
  return (
    <Panel className="p-5 ring-1 ring-line-strong sm:p-7">
      <p className="mb-4 rounded-[10px] bg-raised px-3 py-2 text-[13px] font-semibold text-ink">This is how other members see your profile.</p>
      <div className="flex items-start gap-4">
        <Avatar member={me} size={64} />
        <div>
          <p className="serif text-[30px] leading-tight">{sel.displayName(me)}</p>
          <p className="text-[14px] text-muted">
            {me.pronouns && <>{me.pronouns} · </>}
            {me.level} · <span className="tabular">{me.sunlight.toLocaleString()}</span> Sunlight · <span className="tabular">{me.followers}</span> followers
          </p>
          {me.badges.length > 0 && (
            <div className="mt-2 flex gap-1.5">
              {me.badges.map((b) => (
                <BadgeChip key={b} badge={b} />
              ))}
            </div>
          )}
        </div>
      </div>
      {me.aboutMe && <p className="mt-4 text-[15px] leading-relaxed">{me.aboutMe}</p>}
      {me.myStory && <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{me.myStory}</p>}
      {me.shareJourney && me.diagnoses.length > 0 ? (
        <p className="mt-3 text-[14px]">
          <span className="text-muted">Journey:</span> {[...me.diagnoses, ...me.stages].join(", ")}
        </p>
      ) : (
        <p className="mt-3 text-[13px] text-muted">Your diagnosis, stage and path are hidden. Age range, ZIP and gender are never shown.</p>
      )}
    </Panel>
  );
}

function EditProfile({ onDone }: { onDone: () => void }) {
  const me = useStore((s) => s.me);
  const [first, setFirst] = useState(me.firstName);
  const [last, setLast] = useState(me.lastName);
  const [handle, setHandle] = useState(me.handle);
  const [showReal, setShowReal] = useState(me.showRealName);
  const [hue, setHue] = useState<Hue>(me.avatarHue);
  const [avatar, setAvatar] = useState(me.avatarPreset);
  const state = useStore();
  const meMember = sel.meAsMember(state);
  const [pronouns, setPronouns] = useState(me.pronouns);
  const [pronounsSelf, setPronounsSelf] = useState(me.pronounsSelf);
  const [about, setAbout] = useState(me.aboutMe);
  const [story, setStory] = useState(me.myStory);
  const [errs, setErrs] = useState<Record<string, string | undefined>>({});

  const dirty =
    first !== me.firstName ||
    last !== me.lastName ||
    handle !== me.handle ||
    showReal !== me.showRealName ||
    hue !== me.avatarHue ||
    avatar !== me.avatarPreset ||
    pronouns !== me.pronouns ||
    pronounsSelf !== me.pronounsSelf ||
    about !== me.aboutMe ||
    story !== me.myStory;

  /** Validates and saves; false (with errors shown) if it can't yet. */
  const commit = () => {
    const v: Record<string, string | undefined> = {};
    if (!first.trim() || !last.trim()) v.names = MSG.names;
    if (about.length > 1000) v.about = "About me can be up to 1,000 characters.";
    if (pronouns === "Prefer to self-describe" && !pronounsSelf.trim()) v.pronouns = MSG.pronounsSelf;
    if (handle !== me.handle) {
      const r = act.settings.changeHandle(handle.trim());
      if (!r.ok) v.handle = r.error;
    }
    setErrs(v);
    if (Object.values(v).some(Boolean)) return false;
    act.settings.update({
      firstName: first.trim(),
      lastName: last.trim(),
      showRealName: showReal,
      avatarHue: hue,
      avatarPreset: avatar,
      pronouns,
      pronounsSelf: pronouns === "Prefer to self-describe" ? pronounsSelf.trim() : "",
      aboutMe: about.trim(),
      myStory: story.trim(),
    });
    toast("Profile saved");
    return true;
  };
  const guard = useUnsavedGuard({ dirty, onSave: commit });
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (commit()) onDone();
  };
  // Closing the editor with edits asks first, like leaving the page.
  const cancel = () => (dirty ? requestLeave(onDone) : onDone());

  return (
    <Panel className="p-5 sm:p-7">
      <form onSubmit={save} noValidate className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold">Edit profile</h2>
          <button type="button" onClick={cancel} aria-label="Close editing" className="press grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-raised">
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name" error={errs.names}>
            <Input value={first} onChange={(e) => setFirst(e.target.value)} maxLength={50} autoComplete="given-name" />
          </Field>
          <Field label="Last name" hint="Only your last initial is ever shown.">
            <Input value={last} onChange={(e) => setLast(e.target.value)} maxLength={50} autoComplete="family-name" />
          </Field>
        </div>
        <Field
          label="Handle"
          error={errs.handle ?? (handle !== me.handle ? checks.handle(handle) : undefined)}
          hint={
            me.previousHandle
              ? `You can switch back to @${me.previousHandle} within 14 days of changing it.`
              : "You can change your handle once every 30 days."
          }
        >
          <div className="flex items-center rounded-[10px]">
            <span className="mr-2 text-[16px] text-muted">@</span>
            <Input value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase())} autoCapitalize="none" autoCorrect="off" />
          </div>
        </Field>
        <Choices
          legend="Show to other members"
          options={["Show my handle instead", "Show my real name"] as const}
          value={[showReal ? "Show my real name" : "Show my handle instead"]}
          onChange={(v) => setShowReal(v[0] === "Show my real name")}
          hint={`Real name shows as ${first || "First"} ${(last || "L").charAt(0)}.`}
        />
        <fieldset>
          <legend className="mb-2 text-[14px] font-semibold">Your grove avatar</legend>
          <AvatarPicker
            member={{ ...meMember, firstName: first, handle, showRealName: showReal, avatarHue: hue }}
            value={avatar}
            onChange={setAvatar}
            name="profile-avatar"
          />
          <HueSwatches value={hue} onChange={setHue} />
          <p className="mt-2 text-[13px] text-muted">Photo uploads aren&apos;t wired up in this prototype.</p>
        </fieldset>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Pronouns" optional error={errs.pronouns}>
            <Select value={pronouns} onChange={(e) => setPronouns(e.target.value)}>
              <option value="">Not set</option>
              {PRONOUNS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </Field>
          {pronouns === "Prefer to self-describe" && (
            <Field label="Your pronouns">
              <Input value={pronounsSelf} onChange={(e) => setPronounsSelf(e.target.value)} maxLength={30} />
            </Field>
          )}
        </div>
        <Field label="About me" optional error={errs.about} counter={<Counter value={about} max={1000} />}>
          <Textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={4} placeholder="What brought you here, where you are, what you're hoping to find" />
        </Field>
        <Field label="My story" optional counter={<Counter value={story} max={2000} />} hint="The longer version, if you'd like to share it.">
          <Textarea value={story} onChange={(e) => setStory(e.target.value)} rows={6} max={2000} hardStop />
        </Field>
        <div className="flex gap-2">
          <Button type="submit">Save profile</Button>
          <Button variant="ghost" onClick={cancel}>
            Cancel
          </Button>
        </div>
      </form>
      {guard.ui}
    </Panel>
  );
}

function PartnerCard() {
  const s = useStore();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const p = s.partner;
  const inv = p.invite;

  return (
    <Panel className="p-5" aria-labelledby="partner-h">
      <Spot kind="seeds" size={120} />
      <h2 id="partner-h" className="mt-1 text-[16px] font-semibold">Your partner</h2>
      {p.linked ? (
        <>
          <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
            You&apos;re linked with {p.firstName}. You share a family space; your posts and handles stay private from each other.
          </p>
          <LinkButton href="/family" variant="secondary" size="sm" className="mt-3">
            Open family space
          </LinkButton>
        </>
      ) : inv && inv.status === "pending" ? (
        <>
          <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
            Invite sent to <strong className="text-ink">{inv.email}</strong>. It expires in 14 days.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => { const r = act.partner.resend(); toast(r.ok ? "Invite sent again" : r.error); }}>
              Resend
            </Button>
            <Button size="sm" variant="ghost" onClick={() => act.partner.cancel()}>
              Cancel invite
            </Button>
          </div>
          <button type="button" onClick={() => act.partner.demoAccept()} className="mt-3 text-[13px] font-semibold text-accent underline">
            Demo: your partner accepts
          </button>
        </>
      ) : (
        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const r = act.partner.invite(email, note);
            if (!r.ok) setError(r.error);
            else {
              setError(undefined);
              toast("Invite sent");
            }
          }}
        >
          <p className="text-[14px] leading-relaxed text-ink-soft">Invite your partner to their own private account and a family space you share.</p>
          <Field label="Partner's email" error={error}>
            <Input type="email" inputMode="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Personal note" optional counter={<Counter value={note} max={300} />} hint="Shown on the invite page only, never in the email.">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} max={300} hardStop className="min-h-16" />
          </Field>
          <Button type="submit" size="sm">
            Send invite
          </Button>
        </form>
      )}
    </Panel>
  );
}

function Connections() {
  const s = useStore();
  const [tab, setTab] = useState<"followers" | "following">("followers");
  const ids = tab === "followers" ? s.followers : s.following;
  const people = ids.map((id) => s.members.find((m) => m.id === id)).filter(Boolean);
  return (
    <Panel className="p-5" aria-labelledby="conn-h">
      <h2 id="conn-h" className="sr-only">
        Followers and following
      </h2>
      <Tabs
        label="Connections"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "followers", label: `Followers ${s.followers.length}` },
          { id: "following", label: `Following ${s.following.length}` },
        ]}
      />
      <p className="mt-3 text-[13px] text-muted">Only you can see these lists. Others see the counts.</p>
      {people.length === 0 ? (
        <p className="mt-3 text-[14px] text-muted">{tab === "followers" ? "No followers yet." : "You're not following anyone yet."}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {people.map((m) =>
            m ? (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <Avatar member={m} size={32} />
                <div className="min-w-0 flex-1 text-[14px]">
                  <Name member={m} badges={false} pronouns={false} />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => (tab === "followers" ? act.social.removeFollower(m.id) : act.social.toggleFollow(m.id))}
                >
                  {tab === "followers" ? "Remove" : "Unfollow"}
                </Button>
              </li>
            ) : null,
          )}
        </ul>
      )}
    </Panel>
  );
}

function Profile() {
  const params = useSearchParams();
  const router = useRouter();
  const s = useStore();
  const me = sel.meAsMember(s);
  const editing = params.get("edit") === "1";
  const [preview, setPreview] = useState(false);
  const consent = s.me.healthConsent;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        <header className="flex flex-wrap items-center gap-4">
          <Avatar member={me} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="serif text-[28px] leading-tight [overflow-wrap:anywhere] lg:text-[32px]">{sel.displayName(me)}</h1>
            <p className="text-[14px] text-muted">
              {s.me.showRealName ? `@${s.me.handle}` : `${s.me.firstName} ${s.me.lastName.charAt(0)}. (only you see your name)`}
              {me.pronouns && <> · {me.pronouns}</>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" aria-pressed={preview} onClick={() => setPreview((v) => !v)}>
              <Eye size={16} /> {preview ? "Back to my view" : "How others see me"}
            </Button>
            {!editing && (
              <Button onClick={() => router.push("/profile?edit=1")}>
                <PenLine size={16} /> Edit
              </Button>
            )}
          </div>
        </header>

        {editing ? <EditProfile onDone={() => router.push("/profile")} /> : preview ? <PublicPreview /> : null}
        <TreeHero />

        {!editing && !preview && (
          <Panel className="p-5 sm:p-6">
            <ReferFriend handle={s.me.handle} />
          </Panel>
        )}

        {!editing && !preview && (
          <Panel className="space-y-5 p-5 sm:p-7">
            <section>
              <h2 className="text-[16px] font-semibold">About me</h2>
              <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-line text-ink">
                {s.me.aboutMe || <span className="text-muted">Nothing yet. A line about you helps people on your path find you.</span>}
              </p>
            </section>
            <section>
              <h2 className="text-[16px] font-semibold">My story</h2>
              <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-line text-ink">
                {s.me.myStory || <span className="text-muted">Share the longer version whenever you&apos;re ready.</span>}
              </p>
            </section>
            <section>
              <h2 className="text-[16px] font-semibold">Your journey</h2>
              {consent ? (
                <dl className="mt-2 grid grid-cols-1 gap-3 text-[14px] sm:grid-cols-3">
                  {[
                    ["Diagnosis", s.me.diagnoses],
                    ["Stage", s.me.stages],
                    ["Path", s.me.paths],
                  ].map(([k, v]) => (
                    <div key={k as string}>
                      <dt className="text-muted">{k}</dt>
                      <dd className="font-semibold">{(v as string[]).join(", ") || "—"}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-1.5 text-[14px] text-muted">
                  Not shared.{" "}
                  <Link href="/settings#privacy" className="font-semibold text-accent underline">
                    Give consent again
                  </Link>{" "}
                  to use your health answers for matching.
                </p>
              )}
              <p className="mt-2 text-[13px] text-muted">
                {s.me.shareJourney ? "Shown on your profile." : "Only you can see this."}{" "}
                <Link href="/settings#privacy" className="underline">
                  Change
                </Link>
              </p>
            </section>
          </Panel>
        )}
        <SunlightHistory />
      </div>
      <aside className="space-y-4">
        <Connections />
        <PartnerCard />
        <Panel className="flex items-center justify-between gap-3 p-5">
          <div>
            <h2 className="text-[16px] font-semibold">Saved</h2>
            <p className="text-[14px] text-muted">Posts and articles for your next appointment.</p>
          </div>
          <LinkButton href="/saved" variant="secondary" size="sm">
            Open
          </LinkButton>
        </Panel>
      </aside>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <Profile />
    </Suspense>
  );
}
