"use client";

/* Family space (PRD §7, §7a). The screen's question: what have we shared, and
   what changed? Before linking it explains and invites; once linked it shows
   shared items, family notes and the activity list. Every item is private
   until its owner shares it, and only the owner changes or stops sharing. */

import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, CalendarCheck, FileText, Route, StickyNote } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Spot } from "@/components/art/Scenes";
import { EmptyState, FormField, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Choices } from "@/components/ui/choices";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { meAsMember } from "@/features/auth";
import {
  type FamilyShareInput,
  familyInviteSchema,
  familyNoteSchema,
  familyService,
  familyShareSchema,
} from "@/features/family";
import { ARTICLES } from "@/features/learn";
import { partnerService } from "@/features/partner";
import { timeAgo } from "@/lib/format";
import { type State, useStore } from "@/lib/mock-server";
import type { FamilyItem, FamilyItemKind } from "@/types/domain";

const KIND: Record<FamilyItemKind, { label: string; icon: React.ElementType; cls: string }> = {
  "appointment-list": {
    label: "Appointment questions",
    icon: CalendarCheck,
    cls: "bg-blue-tint text-blue-ink",
  },
  "journey-summary": { label: "Journey summary", icon: Route, cls: "bg-green-tint text-green-ink" },
  article: { label: "Saved article", icon: BookOpen, cls: "bg-yellow-tint text-yellow-ink" },
  "guide-answer": {
    label: "Grove Guide answer",
    icon: FileText,
    cls: "bg-blue-tint text-blue-ink",
  },
  note: {
    label: "Family note",
    icon: StickyNote,
    cls: "bg-pink-tint text-ink-soft ring-1 ring-inset ring-pink",
  },
};

function itemHref(i: FamilyItem) {
  if (i.kind === "note") return `/family/notes/${i.refId}`;
  if (i.kind === "article") return `/learn/${i.refId}`;
  if (i.kind === "appointment-list") return `/guide/appointments/${i.refId}`;
  return null;
}

function Invite({ s }: { s: State }) {
  const inv = s.partner.invite;
  // The service's message shows under the email on submit and stays until the next submit.
  const form = useForm({
    resolver: zodResolver(familyInviteSchema),
    defaultValues: { email: "", note: "" },
    reValidateMode: "onSubmit",
  });
  const pending = inv?.status === "pending";
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Panel className="p-6 sm:p-8">
        <Spot kind="seeds" size={160} className="-mt-6 -ml-4" />
        <h2 className="mt-0 text-[22px] font-semibold">Bring your partner in</h2>
        <p className="mt-2 max-w-[56ch] text-[15px] leading-relaxed text-ink-soft">
          Your partner gets their own private account and their own community. Once you link, you
          get a family space for two: share appointment questions, your journey summary, saved
          articles and Guide answers, and keep family notes together. Nothing is shared until you
          choose to share it, and your messages and Guide chats always stay yours.
        </p>
        {pending ? (
          <div className="mt-6 rounded-[14px] bg-raised p-4">
            <p className="text-[15px]">
              Invite sent to <strong>{inv.email}</strong>. It expires in {14 - inv.daysAgo} days.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const r = partnerService.resend();
                  toast(r.ok ? "Invite sent again" : r.error);
                }}
              >
                Resend
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  partnerService.cancel();
                  toast("Invite cancelled");
                }}
              >
                Cancel invite
              </Button>
            </div>
            <p className="mt-2 text-[13px] text-muted">You can resend once a day, up to 3 times.</p>
          </div>
        ) : (
          <form
            className="mt-6 space-y-5"
            onSubmit={form.handleSubmit(({ email, note }) => {
              const r = partnerService.invite(email, note);
              if (!r.ok) form.setError("email", { message: r.error });
              else toast("Invite sent");
            })}
          >
            <FormField
              form={form}
              name="email"
              label="Partner's email"
              kind="email"
              autoComplete="off"
              autoCapitalize="none"
              controlClassName="sm:max-w-sm"
            />
            <FormField
              form={form}
              name="note"
              label="Personal note"
              optional
              hint="Shown only on the invite page, never in the email."
              counterMax={300}
              kind="textarea"
              max={300}
              hardStop
              rows={3}
            />
            <Button type="submit">Send invite</Button>
          </form>
        )}
      </Panel>
      <aside className="space-y-4">
        <Panel className="p-5">
          <h2 className="text-[16px] font-semibold">What your partner sees</h2>
          <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-ink-soft">
            <li>Your first name, never your handle.</li>
            <li>Only items you share, with View or Edit access.</li>
            <li>Never your posts, messages, mentoring or Guide history.</li>
          </ul>
        </Panel>
        {pending && (
          <Panel className="bg-yellow-tint p-5">
            <h2 className="text-[16px] font-semibold text-[var(--yellow-700)]">Prototype</h2>
            <p className="mt-1 text-[14px] text-[var(--yellow-700)]">
              There&apos;s no second account here. Simulate your partner accepting to see the family
              space.
            </p>
            <Button size="sm" className="mt-3" onClick={() => partnerService.demoAccept()}>
              Simulate acceptance
            </Button>
          </Panel>
        )}
        {s.family.notes.some((n) => n.past) && <PastNotes s={s} />}
      </aside>
    </div>
  );
}

function PastNotes({ s }: { s: State }) {
  const past = s.family.notes.filter((n) => n.past);
  return (
    <Panel className="p-5">
      <h2 className="text-[16px] font-semibold">Past family notes</h2>
      <p className="mt-1 text-[13px] text-muted">Read-only copies from before you unlinked.</p>
      <ul className="mt-3 space-y-1">
        {past.map((n) => (
          <li key={n.id}>
            <Link
              href={`/family/notes/${n.id}`}
              className="press block rounded-[10px] px-3 py-2 text-[14px] font-semibold hover:bg-raised"
            >
              {n.title}
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function ShareDialog({ open, onClose, s }: { open: boolean; onClose: () => void; s: State }) {
  const options = [
    ...(s.me.healthConsent
      ? [
          {
            id: "journey",
            label: "My journey summary",
            kind: "journey-summary" as const,
            title: "Journey summary",
            edit: false,
          },
        ]
      : []),
    ...s.appointmentLists.map((l) => ({
      id: l.id,
      label: `${l.type} questions`,
      kind: "appointment-list" as const,
      title: `${l.type} questions`,
      edit: true,
    })),
    ...s.savedArticles.map((slug) => {
      const a = ARTICLES.find((x) => x.slug === slug);
      return {
        id: slug,
        label: a?.title ?? slug,
        kind: "article" as const,
        title: a?.title ?? slug,
        edit: false,
      };
    }),
  ];
  const form = useForm({
    resolver: zodResolver(familyShareSchema),
    defaultValues: { item: "", access: ["View"] as FamilyShareInput["access"], note: "" },
  });
  const pick = useWatch({ control: form.control, name: "item" });
  const chosen = options.find((o) => o.id === pick);
  return (
    <Dialog open={open} onClose={onClose} title={`Share with ${s.partner.firstName}`}>
      {options.length === 0 ? (
        <p className="text-[15px] text-ink-soft">
          Save an article or make an appointment question list first. You can share those here.
        </p>
      ) : (
        <form
          className="space-y-5"
          onSubmit={form.handleSubmit(({ access, note }) => {
            if (!chosen) return;
            familyService.share({
              kind: chosen.kind,
              refId: chosen.id,
              title: chosen.title,
              access: chosen.edit && access[0] === "Edit" ? "edit" : "view",
              note: note.trim() || undefined,
            });
            toast(`Shared with ${s.partner.firstName}`);
            onClose();
          })}
        >
          <FormField
            form={form}
            name="item"
            label="What to share"
            kind="select"
            options={[
              { value: "", label: "Choose something" },
              ...options.map((o) => ({ value: o.id, label: o.label })),
            ]}
            data-autofocus
          />
          <Field label="Share with">
            <Input value="My partner" readOnly />
          </Field>
          {chosen?.edit ? (
            <Controller
              control={form.control}
              name="access"
              render={({ field }) => (
                <Choices
                  legend="Access"
                  options={["View", "Edit"] as const}
                  value={field.value}
                  onChange={field.onChange}
                  columns={2}
                />
              )}
            />
          ) : (
            chosen && <p className="text-[14px] text-muted">This can be shared as View only.</p>
          )}
          <FormField
            form={form}
            name="note"
            label="Note"
            optional
            counterMax={200}
            maxLength={200}
          />
          <Button type="submit" disabled={!chosen}>
            Share
          </Button>
        </form>
      )}
    </Dialog>
  );
}

function NoteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  // Errors show on submit, stay until the next submit, and never move focus.
  const form = useForm({
    resolver: zodResolver(familyNoteSchema),
    defaultValues: { title: "", body: "" },
    reValidateMode: "onSubmit",
    shouldFocusError: false,
  });
  return (
    <Dialog open={open} onClose={onClose} title="New family note" width={620}>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(({ title, body }) => {
          const r = familyService.createNote(title, body);
          if (r.ok) {
            onClose();
            router.push(`/family/notes/${r.id}`);
          }
        })}
      >
        <FormField
          form={form}
          name="title"
          label="Title"
          counterMax={120}
          maxLength={120}
          data-autofocus
        />
        <FormField
          form={form}
          name="body"
          label="Note"
          counterMax={5000}
          hint="You can both edit family notes."
          kind="textarea"
          max={5000}
          hardStop
          rows={6}
        />
        <Button type="submit">Save note</Button>
      </form>
    </Dialog>
  );
}

export default function FamilyPage() {
  const s = useStore();
  const [share, setShare] = useState(false);
  const [newNote, setNewNote] = useState(false);
  const [unlink, setUnlink] = useState(false);
  const p = s.partner;

  if (!p.linked) {
    return (
      <>
        <PageHeader
          title="Family space"
          lede="A private space for you and your partner, once you link your accounts."
          art={<Spot kind="roots" size={88} className="hidden sm:block" />}
        />
        {s.partner.notice && (
          <p className="mb-4 rounded-[14px] bg-raised p-4 text-[14px]">{s.partner.notice}</p>
        )}
        <Invite s={s} />
      </>
    );
  }

  const items = s.family.items;
  const latest = s.family.activity[0];
  const me = meAsMember(s);

  return (
    <>
      <PageHeader
        title="Family space"
        lede={
          latest
            ? `${latest.text}, ${timeAgo(latest.minutesAgo)} ago.`.replace(
                "just now ago",
                "just now",
              )
            : `You and ${p.firstName} share ${items.length} items.`
        }
        art={<Spot kind="roots" size={88} className="hidden sm:block" />}
        actions={
          <>
            <Button onClick={() => setShare(true)}>Share something</Button>
            <Button variant="secondary" onClick={() => setNewNote(true)}>
              New family note
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="shared-h" className="min-w-0">
          <h2 id="shared-h" className="mb-3 text-[18px] font-semibold">
            Shared between you
          </h2>
          {items.length === 0 ? (
            <EmptyState
              art="roots"
              title="Nothing shared yet."
              body="Share an appointment question list or start a family note."
            />
          ) : (
            <Panel className="p-2">
              <ul>
                {items.map((i) => {
                  const k = KIND[i.kind];
                  const Icon = k.icon;
                  const href = itemHref(i);
                  const mine = i.owner === "me";
                  return (
                    <li key={i.id} className="flex flex-wrap items-center gap-3 rounded-[14px] p-3">
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-[10px] ${k.cls}`}
                      >
                        <Icon size={19} />
                      </span>
                      <span className="min-w-0 flex-1">
                        {href ? (
                          <Link
                            href={href}
                            className="block truncate text-[15px] font-semibold hover:underline"
                          >
                            {i.title}
                          </Link>
                        ) : (
                          <span className="block truncate text-[15px] font-semibold">
                            {i.title}
                          </span>
                        )}
                        <span className="block text-[13px] text-muted">
                          {k.label} · shared by {mine ? "you" : p.firstName} ·{" "}
                          {i.access === "edit" ? "Can edit" : "View only"}
                          {i.note && ` · “${i.note}”`}
                        </span>
                      </span>
                      {mine && i.kind !== "note" ? (
                        <span className="flex items-center gap-2">
                          {i.kind === "appointment-list" && (
                            <Select
                              aria-label="Access"
                              value={i.access}
                              onChange={(e) =>
                                familyService.setAccess(i.id, e.target.value as "view" | "edit")
                              }
                              className="!h-9 w-32 text-[14px]"
                            >
                              <option value="view">View only</option>
                              <option value="edit">Can edit</option>
                            </Select>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              familyService.stopSharing(i.id);
                              toast("Stopped sharing");
                            }}
                          >
                            Stop sharing
                          </Button>
                        </span>
                      ) : (
                        !mine && (
                          <span className="text-[13px] text-muted">
                            Only {p.firstName} can change this
                          </span>
                        )
                      )}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
        </section>

        <aside className="space-y-4">
          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <Spot kind="seeds" size={72} />
              <div>
                <p className="text-[15px] font-semibold">
                  {me.firstName} and {p.firstName}
                </p>
                <p className="text-[13px] text-muted">Linked partners</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => setUnlink(true)}>
              Unlink
            </Button>
          </Panel>
          <Panel className="p-5">
            <h2 className="text-[16px] font-semibold">Activity</h2>
            <ol className="mt-3 space-y-3">
              {s.family.activity.slice(0, 12).map((a) => (
                <li key={a.id} className="flex gap-3 text-[14px] leading-snug">
                  <span
                    aria-hidden
                    className="mt-1.5 h-2 w-3 shrink-0 rounded-[0_100%_0_100%] bg-[var(--green-300)]"
                  />
                  <span className="flex-1 text-ink-soft">{a.text}</span>
                  <span className="tabular shrink-0 text-[12.5px] text-muted">
                    {timeAgo(a.minutesAgo)}
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
          {s.family.notes.some((n) => n.past) && <PastNotes s={s} />}
        </aside>
      </div>

      <ShareDialog open={share} onClose={() => setShare(false)} s={s} />
      <NoteDialog open={newNote} onClose={() => setNewNote(false)} />
      <Dialog
        open={unlink}
        onClose={() => setUnlink(false)}
        title={`Unlink from ${p.firstName}?`}
        description={`Sharing ends at once. You each keep your own items, and family notes are copied into a read-only Past family notes area. ${p.firstName} will be told.`}
      >
        <div className="flex gap-2">
          <Button
            variant="danger"
            onClick={() => {
              partnerService.unlink();
              setUnlink(false);
              toast("Unlinked");
            }}
          >
            Unlink
          </Button>
          <Button variant="ghost" onClick={() => setUnlink(false)}>
            Cancel
          </Button>
        </div>
      </Dialog>
    </>
  );
}
