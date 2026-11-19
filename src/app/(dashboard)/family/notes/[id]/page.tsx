"use client";

/* A family note: edited by both partners, every save kept as a version that
   shows who changed it and when, and any version can be restored. Notes from
   before an unlink are read-only. */

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, History } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { EmptyState, FormField, useUnsavedGuard } from "@/components/shared";
import { Button, LinkButton } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { toast } from "@/components/ui/toast";
import { type FamilyNoteInput, familyNoteSchema, familyService } from "@/features/family";
import { timeAgo } from "@/lib/format";
import { useStore } from "@/lib/mock-server";

export default function FamilyNotePage() {
  const { id } = useParams<{ id: string }>();
  const note = useStore((s) => s.family.notes.find((n) => n.id === id));
  const partner = useStore((s) => s.partner.firstName || "Your partner");
  const [editing, setEditing] = useState(false);
  // Errors show on save, stay until the next save (even across Cancel and Edit), and never
  // move focus.
  const form = useForm({
    resolver: zodResolver(familyNoteSchema),
    defaultValues: { title: note?.title ?? "", body: note?.body ?? "" },
    reValidateMode: "onSubmit",
    shouldFocusError: false,
  });
  const [title, body] = useWatch({ control: form.control, name: ["title", "body"] });
  const save = (values: FamilyNoteInput) => {
    if (!note) return false;
    familyService.editNote(note.id, values.title.trim(), values.body.trim());
    setEditing(false);
    toast("Note saved");
    return true;
  };
  /** The guard's Save: the same rules, checked synchronously. */
  const commit = () => {
    if (!note) return false;
    const r = familyNoteSchema.safeParse(form.getValues());
    form.clearErrors();
    if (!r.success) {
      for (const issue of r.error.issues) {
        const field = issue.path[0] as keyof FamilyNoteInput;
        if (!form.getFieldState(field).error) form.setError(field, { message: issue.message });
      }
      return false;
    }
    return save(r.data);
  };
  const guard = useUnsavedGuard({
    dirty: !!note && editing && (title !== note.title || body !== note.body),
    onSave: commit,
  });

  if (!note) {
    return (
      <EmptyState
        art="roots"
        title="This note isn't available."
        action={<LinkButton href="/family">Family space</LinkButton>}
      />
    );
  }
  const readOnly = !!note.past;
  const last = note.versions[0];

  return (
    <>
      <Link
        href="/family"
        className="mb-3 -ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-[15px] font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft size={16} /> Family space
      </Link>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="p-6 sm:p-8">
          {editing ? (
            <form className="space-y-5" onSubmit={form.handleSubmit(save)}>
              <FormField form={form} name="title" label="Title" counterMax={120} maxLength={120} />
              <FormField
                form={form}
                name="body"
                label="Note"
                counterMax={5000}
                kind="textarea"
                max={5000}
                hardStop
                rows={10}
              />
              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    form.reset({ title: note.title, body: note.body }, { keepErrors: true });
                  }}
                >
                  Cancel
                </Button>
              </div>
              {guard.ui}
            </form>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h1 className="serif text-[28px] leading-[1.1] lg:text-[32px]">{note.title}</h1>
                {!readOnly && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      form.reset({ title: note.title, body: note.body }, { keepErrors: true });
                      setEditing(true);
                    }}
                  >
                    Edit
                  </Button>
                )}
              </div>
              <p className="mt-2 text-[14px] text-muted">
                {readOnly
                  ? "Read-only copy from before you unlinked."
                  : last
                    ? `Last edited by ${last.by === "me" ? "you" : partner}, ${timeAgo(last.minutesAgo)} ago`.replace(
                        "just now ago",
                        "just now",
                      )
                    : "You can both edit this note."}
              </p>
              <div className="mt-6 max-w-[66ch] space-y-3 text-[16px] leading-relaxed whitespace-pre-wrap text-ink">
                {note.body}
              </div>
            </>
          )}
        </Panel>
        <aside>
          <Panel className="p-5">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold">
              <History size={17} /> Versions
            </h2>
            {note.versions.length ? (
              <ol className="mt-3 space-y-3">
                {note.versions.map((v) => (
                  <li key={v.id} className="rounded-[14px] bg-raised p-3">
                    <p className="text-[13px] text-muted">
                      {v.by === "me" ? "You" : partner} · {timeAgo(v.minutesAgo)}
                    </p>
                    <p className="mt-1 line-clamp-3 text-[14px] leading-snug text-ink-soft">
                      {v.body}
                    </p>
                    {!readOnly && (
                      <button
                        type="button"
                        className="mt-2 text-[13px] font-semibold text-accent hover:underline"
                        onClick={() => {
                          familyService.restore(note.id, v.id);
                          toast("Earlier version restored");
                        }}
                      >
                        Restore this version
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-[14px] text-muted">
                Earlier versions appear here after each edit.
              </p>
            )}
          </Panel>
        </aside>
      </div>
    </>
  );
}
