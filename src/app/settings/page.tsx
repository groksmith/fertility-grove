"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button, Field, Modal, Select } from "@/components/ui";
import { COMMUNITIES } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function SettingsPage() {
  const router = useRouter();
  const { profile, updateProfile, signOut, reset } = useStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <AppShell section="settings" title="Settings">
      <h2 className="serif text-[30px]">Settings</h2>

      <section className="mt-8 max-w-[620px]">
        <h3 className="text-[16px] font-bold">Identity</h3>
        <div className="mt-4 space-y-4">
          <Field
            label="How your name appears"
            hint="Applies everywhere: board, groups, messages, campaigns and reviews."
          >
            <Select
              value={profile.anonymous ? "Handle" : "Real name"}
              onChange={(e) =>
                updateProfile({ anonymous: e.target.value === "Handle" })
              }
            >
              <option>Real name</option>
              <option>Handle</option>
            </Select>
          </Field>

          <Field
            label="Community"
            hint="Changing this re-scopes your default board."
          >
            <Select
              value={profile.community}
              onChange={(e) => updateProfile({ community: e.target.value })}
            >
              {COMMUNITIES.map((c) => (
                <option key={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      <section className="mt-10 max-w-[620px]">
        <h3 className="text-[16px] font-bold">Notifications</h3>
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
          {(
            [
              ["comments", "Comments and replies on my posts"],
              ["messages", "New direct messages"],
              ["donations", "Donations to my support campaign"],
              ["digest", "Daily email digest"],
            ] as const
          ).map(([key, label]) => (
            <li key={key} className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[14.5px]">{label}</span>
              <button
                role="switch"
                aria-checked={profile.notifications[key]}
                aria-label={label}
                onClick={() =>
                  updateProfile({
                    notifications: {
                      ...profile.notifications,
                      [key]: !profile.notifications[key],
                    },
                  })
                }
                className="relative h-6 w-11 rounded-full transition"
                style={{
                  background: profile.notifications[key] ? "#42C074" : "#D6D6D6",
                }}
              >
                <span
                  className="absolute top-0.5 block h-5 w-5 rounded-full bg-white transition-all"
                  style={{ left: profile.notifications[key] ? 22 : 2 }}
                />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 max-w-[620px]">
        <h3 className="text-[16px] font-bold">Prototype controls</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
          This is a front-end prototype. Everything you change is stored in your
          browser only — no server, no account, no payments.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => {
              reset();
              router.push("/signup");
            }}
          >
            <RotateCcw size={15} /> Reset demo data
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              signOut();
              router.push("/signup");
            }}
          >
            <LogOut size={15} /> Sign out
          </Button>
        </div>
      </section>

      <section className="mt-10 max-w-[620px]">
        <h3 className="text-[16px] font-bold text-[#B23A2E]">Danger zone</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
          Deleting your account anonymizes your posts to &ldquo;[deleted
          member]&rdquo;, and hard-deletes private messages, records, and campaign
          drafts. Live campaigns must be closed first.
        </p>
        <Button
          variant="outline"
          className="mt-4 !border-[#E5B4AE] !text-[#B23A2E]"
          onClick={() => setConfirmDelete(true)}
        >
          Delete my account
        </Button>
      </section>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        width={440}
        labelledBy="delete-title"
      >
        <h3 id="delete-title" className="serif text-[24px]">
          Delete this account?
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          In the real product this cannot be undone. In the prototype it just
          resets the demo.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
            Keep my account
          </Button>
          <Button
            className="!bg-[#B23A2E] !text-white"
            onClick={() => {
              reset();
              router.push("/signup");
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
