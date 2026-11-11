"use client";

/* Settings, laid out like a settings app: a grouped list of sections on the
   left, each row naming the section and its current state, and the chosen
   section open on the right as its own page. On a phone the list comes first
   and a section opens on its own with a way back. The section lives in the
   URL hash, so /settings#privacy opens Privacy. The prototype's own tools sit
   apart at the bottom, labelled so nobody mistakes them for the product. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  Bell,
  ChevronRight,
  Compass,
  Download,
  FlaskConical,
  Lock,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trash2,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import {
  Avatar,
  Button,
  Checkbox,
  Choices,
  Dialog,
  Field,
  Input,
  LinkButton,
  Name,
  PageHeader,
  PasswordInput,
  Select,
  Toggle,
  toast,
} from "@/components/ui";
import { CREDITS, DIAGNOSES, JOURNEY_STAGES, PATHS, TREATMENTS } from "@/lib/options";
import { formatDate, nextRefill } from "@/lib/rules/credits";
import { MSG, checks } from "@/lib/rules/validation";
import { requestLeave, useUnsavedGuard } from "@/components/UnsavedGuard";
import { act, sel, useStore, type State } from "@/lib/store";
import type { MessagePolicy } from "@/lib/types";

/** One settings page: its title and what it's for, then its controls. */
function Section({ id, title, description, children }: { id: string; title: string; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="text-[24px] leading-tight font-semibold text-ink">{title}</h2>
      {description && <div className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-ink-soft">{description}</div>}
      <div className="mt-6 space-y-5 rounded-[20px] border border-line bg-panel p-5 sm:p-7">{children}</div>
    </section>
  );
}

function Account({ s }: { s: State }) {
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState<string>();
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwErr, setPwErr] = useState<Record<string, string>>({});
  const saveEmail = () => {
    const err = checks.email(email);
    setEmailErr(err);
    if (err) return false;
    toast(`We sent a confirmation link to ${email.trim().toLowerCase()}. Your email changes once you open it.`);
    setEmail("");
    return true;
  };
  const savePw = () => {
    const errs: Record<string, string> = {};
    if (!pw.current) errs.current = "Enter your current password.";
    const p = checks.password(pw.next);
    if (p) errs.next = p;
    if (pw.next !== pw.confirm) errs.confirm = MSG.passwordsDiffer;
    setPwErr(errs);
    if (Object.keys(errs).length) return false;
    setPw({ current: "", next: "", confirm: "" });
    toast("Password changed. You've been signed out on other devices.");
    return true;
  };
  const emailDirty = email.trim() !== "";
  const pwDirty = !!(pw.current || pw.next || pw.confirm);
  const guard = useUnsavedGuard({
    dirty: emailDirty || pwDirty,
    onSave: () => (emailDirty ? saveEmail() : true) && (pwDirty ? savePw() : true),
  });
  return (
    <Section id="account" title="Account" description="Your sign-in details. Changing your email or password signs you out everywhere else.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[14px] text-muted">Email</p>
          <p className="text-[15px] font-semibold">{s.me.email}</p>
        </div>
        <LinkButton href="/dashboard?edit=1" variant="secondary" size="sm">Edit profile</LinkButton>
      </div>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          saveEmail();
        }}
      >
        <Field label="New email" error={emailErr} className="min-w-0 flex-1 sm:max-w-md">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoCapitalize="none" autoComplete="email" />
        </Field>
        <Button type="submit" variant="secondary">Change email</Button>
      </form>
      <form
        className="space-y-4 border-t border-line pt-5"
        onSubmit={(e) => {
          e.preventDefault();
          savePw();
        }}
      >
        <Field label="Current password" error={pwErr.current} className="max-w-md">
          <PasswordInput value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" />
        </Field>
        <Field label="New password" error={pwErr.next} hint="8 to 64 characters." className="max-w-md">
          <PasswordInput value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" />
        </Field>
        <Field label="Confirm new password" error={pwErr.confirm} className="max-w-md">
          <PasswordInput value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" />
        </Field>
        <Button type="submit" variant="secondary">Change password</Button>
      </form>
      <div className="flex flex-wrap gap-2 border-t border-line pt-5">
        <Button variant="secondary" onClick={() => toast("Signed out of every other device")}>Sign out of all devices</Button>
        <Button variant="ghost" onClick={() => act.auth.signOut()}>Sign out</Button>
      </div>
      {guard.ui}
    </Section>
  );
}

function Privacy({ s }: { s: State }) {
  const me = s.me;
  const up = act.settings.update;
  return (
    <Section id="privacy" title="Privacy and messaging" description="Who can reach you, and what others see on your profile. Age, ZIP code and gender are never shown.">
      <Field label="Who can message me" hint="People you follow can always message you. Everyone else sends a message request.">
        <Select value={me.messagePolicy} onChange={(e) => act.settings.setMessagePolicy(e.target.value as MessagePolicy)} className="sm:max-w-72">
          <option value="anyone">Anyone</option>
          <option value="following">Members I follow</option>
          <option value="no-one">No one</option>
        </Select>
      </Field>
      <Toggle checked={me.suggestMe} onChange={(v) => up({ suggestMe: v })} label="Suggest me to members on my path" description="Turned off, you won't appear in People on your path or mentor matches." />
      <Toggle
        checked={me.shareJourney}
        onChange={(v) => up({ shareJourney: v })}
        disabled={!me.healthConsent}
        label="Show my diagnosis, stage and path on my profile"
        description={me.healthConsent ? "Off by default." : "Not shared: you withdrew health-data consent."}
      />
      <Toggle checked={me.showStories} onChange={(v) => up({ showStories: v })} label="Show success stories in my feed" description="Stories otherwise stay in their own space." />
      <Toggle checked={me.wantMentor} onChange={(v) => up({ wantMentor: v })} label="I'd like a mentor" description="Shows mentors matched to you under Mentors." />
      <Toggle
        checked={me.showPartner}
        onChange={(v) => up({ showPartner: v })}
        disabled={!s.partner.linked}
        label="Show my linked partner"
        description={s.partner.linked ? "A Partner badge shows only when you both turn this on." : "Available once you link with a partner."}
      />
    </Section>
  );
}

function Journey({ s }: { s: State }) {
  const me = s.me;
  const [stages, setStages] = useState<string[]>(me.stages);
  const [treat, setTreat] = useState<string[]>(me.treatments);
  const [dx, setDx] = useState<string[]>(me.diagnoses);
  const [paths, setPaths] = useState<string[]>(me.paths);
  const same = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
  const dirty =
    me.healthConsent && (!same(stages, me.stages) || !same(treat, me.treatments) || !same(dx, me.diagnoses) || !same(paths, me.paths));
  const save = () => {
    if (!stages.length) {
      toast(MSG.selectOne);
      return false;
    }
    act.settings.update({ stages, treatments: stages.includes("Pursuing treatment") ? treat : [], diagnoses: dx, paths });
    toast("Saved. Your matches will refresh.");
    return true;
  };
  const guard = useUnsavedGuard({ dirty, onSave: save });
  if (!me.healthConsent) {
    return (
      <Section id="journey" title="Your journey" description="Used to match you with people, groups and articles.">
        <p className="text-[15px]">
          <span className="font-semibold">Not shared.</span> <span className="text-ink-soft">You withdrew consent, so your stage, diagnosis and path were deleted.</span>
        </p>
        <Button variant="secondary" onClick={() => { act.settings.giveConsent(); toast("Thanks. You can add your journey again."); }}>
          Give consent again
        </Button>
      </Section>
    );
  }
  return (
    <Section id="journey" title="Your journey" description="Only you see these unless you choose to show them on your profile. Changing them refreshes your matches.">
      <Choices legend="Where are you in your journey?" options={JOURNEY_STAGES} value={stages} onChange={setStages} multi columns={2} />
      {stages.includes("Pursuing treatment") && <Choices legend="Which treatment" options={TREATMENTS} value={treat} onChange={setTreat} multi columns={3} />}
      <Choices legend="Diagnosis" options={DIAGNOSES} value={dx} onChange={setDx} multi columns={2} />
      <Choices legend="Path to parenthood" options={PATHS} value={paths} onChange={setPaths} multi columns={2} />
      <Button onClick={save}>Save journey</Button>
      {guard.ui}
    </Section>
  );
}

function Consent({ s }: { s: State }) {
  const [open, setOpen] = useState(false);
  return (
    <Section id="consent" title="Health-data consent" description="How Fertility Grove uses your health answers to match you with people, groups and information.">
      <p className="text-[15px]">
        Status: <span className={`font-semibold ${s.me.healthConsent ? "text-green-ink" : "text-ink"}`}>{s.me.healthConsent ? "Given" : "Withdrawn"}</span>
      </p>
      <p className="text-[14px] text-muted">
        Read the <Link href="/privacy" className="underline">Consumer Health Data Privacy Policy</Link>.
      </p>
      {s.me.healthConsent ? (
        <Button variant="secondary" onClick={() => setOpen(true)}>Withdraw consent</Button>
      ) : (
        <Button variant="secondary" onClick={() => act.settings.giveConsent()}>Give consent</Button>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title="Withdraw consent?" description="We'll delete your journey stage, treatment, next date, diagnosis and path. Your matches fall back to popular groups and starter articles, and the Grove Guide stops using your profile answers.">
        <div className="flex gap-2">
          <Button variant="danger" onClick={() => { act.settings.withdrawConsent(); setOpen(false); toast("Consent withdrawn and health answers deleted"); }}>Withdraw and delete</Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </Dialog>
    </Section>
  );
}

function Notifications({ s }: { s: State }) {
  const n = s.me.notify;
  const set = (patch: Partial<typeof n>) => act.settings.update({ notify: { ...n, ...patch } });
  return (
    <Section id="notifications" title="Notifications" description="In-app notifications always arrive. These control email. We will never send more than one activity email a day, around 8am.">
      <Toggle checked={n.comments} onChange={(v) => set({ comments: v })} label="Comments and replies on my posts" />
      <Toggle checked={n.messages} onChange={(v) => set({ messages: v })} label="New direct messages" />
      <Toggle checked={n.mentoring} onChange={(v) => set({ mentoring: v })} label="Mentoring updates" />
      <Toggle checked={n.partner} onChange={(v) => set({ partner: v })} label="Partner and family space updates" />
      <Toggle checked={n.includeFollows} onChange={(v) => set({ includeFollows: v })} label="Include follows, levels and matches in my daily update" />
      <Toggle checked={n.pauseAll} onChange={(v) => set({ pauseAll: v })} label="Pause all optional emails" description="Account and safety emails still arrive." />
    </Section>
  );
}

function Partner({ s }: { s: State }) {
  const p = s.partner;
  return (
    <Section id="partner" title="Partner" description="One partner at a time. Linking never shows either of you the other's handle or posts.">
      {p.linked ? (
        <p className="text-[15px]">You&apos;re linked with <strong>{p.firstName}</strong>.</p>
      ) : p.invite?.status === "pending" ? (
        <p className="text-[15px]">Invite pending for <strong>{p.invite.email}</strong>.</p>
      ) : (
        <p className="text-[15px] text-ink-soft">You haven&apos;t linked a partner.</p>
      )}
      <LinkButton href="/family" variant="secondary">{p.linked ? "Open family space" : "Invite or manage"}</LinkButton>
    </Section>
  );
}

function Mentoring({ s }: { s: State }) {
  const m = s.me.mentoring;
  return (
    <Section id="mentoring" title="Mentoring" description="Opens at Blossom Tree, or with a Founding mentor badge.">
      {m.on ? (
        <>
          <Toggle checked={m.paused} onChange={(v) => act.mentors.setPaused(v)} label="Pause new requests" />
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/mentors/setup" variant="secondary">Edit mentor profile</LinkButton>
            <Button variant="ghost" onClick={() => { act.mentors.turnOff(); toast("Mentoring turned off"); }}>Turn off mentoring</Button>
          </div>
        </>
      ) : (
        <LinkButton href="/mentors/setup" variant="secondary">Set up mentoring</LinkButton>
      )}
    </Section>
  );
}

function Credits({ s }: { s: State }) {
  return (
    <Section id="credits" title="AI credits" description="Free credits are used first and refill monthly. Purchased credits never expire.">
      <p className="tabular text-[15px]">
        <strong className="text-[22px]">{sel.creditTotal(s)}</strong> credits · {s.credits.free} free, {s.credits.purchased} purchased · refills on {formatDate(nextRefill(s.me.signupDay))}
      </p>
      <LinkButton href="/credits" variant="secondary">Balance and purchases</LinkButton>
    </Section>
  );
}

function Blocked({ s }: { s: State }) {
  return (
    <Section id="blocked" title="Blocked members" description="Blocked members can't message you, follow you, see your profile or your posts. They're never told.">
      {s.blocked.length === 0 ? (
        <p className="text-[15px] text-muted">You haven&apos;t blocked anyone.</p>
      ) : (
        <ul className="space-y-3">
          {s.blocked.map((id) => {
            const m = sel.person(s, id);
            if (!m) return null;
            return (
              <li key={id} className="flex items-center gap-3">
                <Avatar member={m} size={36} />
                <span className="min-w-0 flex-1"><Name member={m} link={false} badges={false} /></span>
                <Button size="sm" variant="secondary" onClick={() => act.social.unblock(id)}>Unblock</Button>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

function Data({ s }: { s: State }) {
  return (
    <Section id="data" title="Download my data" description="A JSON and HTML copy of everything you've shared. We email you when it's ready; the link works for 7 days after you sign in again.">
      {s.dataExport === "none" && <Button variant="secondary" onClick={() => act.settings.requestExport()}><Download size={16} /> Request my data</Button>}
      {s.dataExport === "preparing" && <p className="text-[15px]" aria-live="polite"><strong>Preparing your file.</strong> <span className="text-ink-soft">We&apos;ll email you when it&apos;s ready.</span></p>}
      {s.dataExport === "ready" && (
        <div aria-live="polite">
          <p className="text-[15px]"><strong>Your file is ready.</strong> <span className="text-ink-soft">Available for 7 days.</span></p>
          <Button className="mt-3" variant="secondary" onClick={() => toast("Prototype: the download would start here")}><Download size={16} /> Download</Button>
        </div>
      )}
    </Section>
  );
}

function DeleteAccount({ s }: { s: State }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [posts, setPosts] = useState(true);
  const [understand, setUnderstand] = useState(false);
  const purchased = s.credits.purchased;
  return (
    <Section id="delete" title="Delete my account" description="You have 14 days to change your mind. After that, your data is removed and your handle is retired.">
      <Button variant="danger" onClick={() => setOpen(true)}>Delete my account</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Delete your account?">
        <div className="space-y-4 text-[15px] leading-relaxed text-ink-soft">
          <p>Your profile, posts, comments and anything shared with your partner are hidden right away. Sign in within 14 days to restore everything. After 14 days it&apos;s removed for good.</p>
          {purchased > 0 && (
            <div className="rounded-[14px] bg-danger-soft p-4">
              <p className="font-semibold text-danger">You have {purchased} purchased credits. They will be lost.</p>
              <div className="mt-3"><Checkbox checked={understand} onChange={setUnderstand}>I understand</Checkbox></div>
            </div>
          )}
          <Checkbox checked={posts} onChange={setPosts}>
            Also delete my posts and comments
          </Checkbox>
          <p className="text-[13px] text-muted">{posts ? "Replies from others stay under “This post was deleted”." : "Your posts stay, shown as “Deleted member”."}</p>
        </div>
        <div className="mt-6 flex gap-2">
          <Button
            variant="danger"
            disabled={purchased > 0 && !understand}
            onClick={() => {
              act.settings.deleteAccount(posts);
              router.push("/restore");
            }}
          >
            Delete my account
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </Dialog>
    </Section>
  );
}

function PrototypeTools({ s }: { s: State }) {
  const router = useRouter();
  const waiting = s.mentorRequests.some((r) => r.menteeId === "me" && r.status === "waiting");
  const go = (kind: State["persona"]) => {
    act.demo.persona(kind);
    router.push(kind === "new" ? "/" : kind === "partner" ? "/partner-invite/annie" : "/feed");
  };
  return (
    <section id="prototype" aria-labelledby="prototype-h" className="rounded-[20px] bg-raised p-5 sm:p-7">
      <h2 id="prototype-h" className="text-[24px] leading-tight font-semibold text-ink">Prototype tools</h2>
      <p className="mt-1 max-w-[70ch] text-[14px] leading-relaxed text-ink-soft">
        Not part of the product. These simulate what a backend, email or another member would do, so every flow can be tried in this browser.
      </p>
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-2 rounded-[14px] bg-panel p-4">
          <p className="text-[14px] font-semibold">Start as</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => go("member")}>Annie, Tree level</Button>
            <Button size="sm" variant="secondary" onClick={() => go("mentor")}>Annie, Blossom Tree mentor</Button>
            <Button size="sm" variant="secondary" onClick={() => go("new")}>A new member</Button>
            <Button size="sm" variant="secondary" onClick={() => go("partner")}>An invited partner</Button>
          </div>
        </div>
        <div className="space-y-3 rounded-[14px] bg-panel p-4">
          <Toggle checked={s.me.status !== "unconfirmed"} onChange={(v) => act.demo.setConfirmed(v)} label="Email confirmed" />
          <Toggle checked={s.signupsPaused} onChange={(v) => act.demo.setPaused(v)} label="Sign-ups paused" />
          <Toggle checked={s.hasInvite} onChange={(v) => act.demo.setInvite(v)} label="Visitor has a beta invite" />
          <Toggle checked={s.linkExpired} onChange={(v) => act.demo.setLinkExpired(v)} label="Email links have expired" />
        </div>
        <div className="space-y-2 rounded-[14px] bg-panel p-4">
          <p className="text-[14px] font-semibold">Sunlight <span className="tabular font-normal text-muted">· {s.me.sunlight.toLocaleString()} now, {s.me.level}</span></p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => act.demo.addSunlight(50)}>Add 50</Button>
            <Button size="sm" variant="secondary" onClick={() => act.demo.addSunlight(500)}>Add 500</Button>
          </div>
        </div>
        <div className="space-y-2 rounded-[14px] bg-panel p-4">
          <p className="text-[14px] font-semibold">Other members</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" disabled={!waiting} onClick={() => act.demo.mentorReplies("accepted")}>Mentor accepts</Button>
            <Button size="sm" variant="secondary" disabled={!waiting} onClick={() => act.demo.mentorReplies("declined")}>Mentor declines</Button>
            <Button size="sm" variant="secondary" disabled={!waiting} onClick={() => act.demo.mentorReplies("expired")}>Request expires</Button>
            <Button size="sm" variant="secondary" disabled={s.partner.invite?.status !== "pending"} onClick={() => act.partner.demoAccept()}>Partner accepts invite</Button>
          </div>
          {!waiting && <p className="text-[13px] text-muted">Send a mentor request to try the mentor replies.</p>}
        </div>
        <div className="space-y-2 rounded-[14px] bg-panel p-4">
          <p className="text-[14px] font-semibold">Account states</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => { act.demo.suspend(); router.push("/suspended"); }}>Simulate a suspension</Button>
            <Button size="sm" variant="secondary" onClick={() => { act.demo.worstCase(); toast("Worst-case data loaded"); }}>Load worst-case data</Button>
            <Button size="sm" variant="danger" onClick={() => { act.demo.reset(); toast("Demo data reset"); router.push("/feed"); }}>Reset demo data</Button>
          </div>
        </div>
        <div className="rounded-[14px] bg-panel p-4 text-[14px] leading-relaxed">
          <p className="font-semibold">Sample values (still open in the PRD)</p>
          <ul className="tabular mt-1 text-ink-soft">
            <li>{CREDITS.freePerMonth} free credits a month · question {CREDITS.questionCost} · appointment list {CREDITS.appointmentListCost} · low warning at {CREDITS.lowWarning}</li>
            <li>Packs: {CREDITS.packs.map((p) => `${p.name} ${p.credits} for $${p.price}`).join(" · ")}</li>
            <li>Demo sign-in: annie.m@grove.test / sunlight-demo</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

type Item = { id: string; label: string; Icon: LucideIcon; status?: (s: State) => string; danger?: boolean };

/* The sections, grouped the way people look for them. */
const GROUPS: { heading: string; items: Item[] }[] = [
  {
    heading: "Account",
    items: [
      { id: "account", label: "Account", Icon: UserRound, status: (s) => s.me.email },
      { id: "journey", label: "Your journey", Icon: Compass, status: (s) => (!s.me.healthConsent ? "Not shared" : s.me.diagnoses.length ? s.me.diagnoses.slice(0, 2).join(", ") : "Not set") },
      { id: "notifications", label: "Notifications", Icon: Bell, status: (s) => (s.me.notify.pauseAll ? "Optional emails paused" : "One daily email at most") },
    ],
  },
  {
    heading: "Privacy and safety",
    items: [
      {
        id: "privacy",
        label: "Privacy and messaging",
        Icon: Lock,
        status: (s) => `Messages from ${s.me.messagePolicy === "anyone" ? "anyone" : s.me.messagePolicy === "following" ? "people you follow" : "no one"}`,
      },
      { id: "consent", label: "Health-data consent", Icon: ShieldCheck, status: (s) => (s.me.healthConsent ? "Given" : "Withdrawn") },
      { id: "blocked", label: "Blocked members", Icon: Ban, status: (s) => (s.blocked.length ? sel.plural(s.blocked.length, "member") : "No one") },
    ],
  },
  {
    heading: "People",
    items: [
      { id: "partner", label: "Partner", Icon: UsersRound, status: (s) => (s.partner.linked ? `Linked with ${s.partner.firstName}` : "Not linked") },
      { id: "mentoring", label: "Mentoring", Icon: Sprout, status: (s) => (s.me.mentoring.on ? (s.me.mentoring.paused ? "Paused" : "On") : "Off") },
    ],
  },
  {
    heading: "Membership",
    items: [
      { id: "credits", label: "AI credits", Icon: Sparkles, status: (s) => sel.plural(sel.creditTotal(s), "credit") },
      { id: "data", label: "Download my data", Icon: Download, status: () => "A copy of everything you've shared" },
      { id: "delete", label: "Delete my account", Icon: Trash2, danger: true },
    ],
  },
];
const ALL = GROUPS.flatMap((g) => g.items.map((i) => i.id)).concat("prototype");

/* The open section is the URL hash, so deep links and Back both work. */
const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const readHash = () => window.location.hash.slice(1);
function open(id: string) {
  history.pushState(null, "", id ? `#${id}` : window.location.pathname);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
  window.scrollTo({ top: 0 });
}

/* `fallback` marks the section desktop opens by default: highlighted there,
   but not on a phone, where nothing is open yet. */
function NavRow({ item, s, active, fallback }: { item: Item; s: State; active: boolean; fallback?: boolean }) {
  const { Icon } = item;
  const status = item.status?.(s);
  return (
    <li>
      <a
        href={`#${item.id}`}
        onClick={(e) => {
          e.preventDefault();
          if (!active) requestLeave(() => open(item.id));
        }}
        aria-current={active ? "page" : undefined}
        className={`press flex min-h-14 items-center gap-3 rounded-[14px] px-3 py-2.5 ${
          active ? "bg-white ring-1 ring-line-strong" : fallback ? "hover:bg-raised lg:bg-white lg:ring-1 lg:ring-line-strong" : "hover:bg-raised"
        }`}
      >
        <span
          aria-hidden
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${item.danger ? "bg-danger-soft text-danger" : active ? "bg-accent text-white" : fallback ? "bg-raised text-ink-soft lg:bg-accent lg:text-white" : "bg-raised text-ink-soft"}`}
        >
          <Icon size={18} strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-[15px] font-semibold ${item.danger ? "text-danger" : "text-ink"}`}>{item.label}</span>
          {status && <span className="block truncate text-[13px] text-muted">{status}</span>}
        </span>
        <ChevronRight size={18} aria-hidden className={`shrink-0 text-muted ${active ? "lg:text-ink" : ""}`} />
      </a>
    </li>
  );
}

export default function SettingsPage() {
  const s = useStore();
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  const current = ALL.includes(hash) ? hash : "";
  // Desktop always shows a section; a phone shows the list until you pick one.
  const shown = current || "account";
  const proto = { id: "prototype", label: "Prototype tools", Icon: FlaskConical, status: () => "Not part of the product" } satisfies Item;

  const page = (() => {
    switch (shown) {
      case "privacy": return <Privacy s={s} />;
      case "journey": return <Journey key={s.me.healthConsent ? "c" : "n"} s={s} />;
      case "consent": return <Consent s={s} />;
      case "notifications": return <Notifications s={s} />;
      case "partner": return <Partner s={s} />;
      case "mentoring": return <Mentoring s={s} />;
      case "credits": return <Credits s={s} />;
      case "blocked": return <Blocked s={s} />;
      case "data": return <Data s={s} />;
      case "delete": return <DeleteAccount s={s} />;
      case "prototype": return <PrototypeTools s={s} />;
      default: return <Account s={s} />;
    }
  })();

  return (
    <>
      <div className={current ? "sr-only lg:not-sr-only" : ""}>
        <PageHeader title="Settings" lede="Your account, privacy and the people you share with." />
      </div>
      <div className="lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-10">
        <nav aria-label="Settings sections" className={`lg:sticky lg:top-8 ${current ? "hidden lg:block" : ""}`}>
          {GROUPS.map((g) => (
            <div key={g.heading} className="mb-5">
              <h2 className="mb-1.5 px-3 text-[13px] font-semibold text-muted">{g.heading}</h2>
              <ul className="space-y-0.5">
                {g.items.map((i) => (
                  <NavRow key={i.id} item={i} s={s} active={current === i.id} fallback={!current && i.id === "account"} />
                ))}
              </ul>
            </div>
          ))}
          <ul className="mt-2 border-t border-line pt-3">
            <NavRow item={proto} s={s} active={current === "prototype"} />
          </ul>
        </nav>
        <div className={`min-w-0 ${current ? "" : "hidden lg:block"}`}>
          <a
            href="/settings"
            onClick={(e) => {
              e.preventDefault();
              requestLeave(() => open(""));
            }}
            className="mb-3 -ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-[15px] font-semibold text-muted hover:text-ink lg:hidden"
          >
            <ArrowLeft size={16} /> Settings
          </a>
          <div key={shown} className="rise">{page}</div>
        </div>
      </div>
    </>
  );
}
