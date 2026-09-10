"use client";

import { useState } from "react";
import { Gift, Pencil, Settings } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  Avatar,
  Button,
  Field,
  Input,
  LinkButton,
  Modal,
  Select,
  Tag,
  Textarea,
} from "@/components/ui";
import { useStore } from "@/lib/store";
import { GENDER_IDENTITIES, PRONOUNS } from "@/lib/types";

export default function ProfilePage() {
  const { profile, updateProfile, myCampaign } = useStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(profile);

  const age = new Date().getFullYear() - profile.birthYear;

  return (
    <AppShell section="dashboard" title="My Dashboard" wide>
      <div className="flex flex-wrap items-start gap-4">
        <h2 className="serif text-[30px]">My Profile</h2>
        <div className="ml-auto flex gap-3">
          <Button
            variant="greenDark"
            onClick={() => {
              setForm(profile);
              setEditing(true);
            }}
          >
            <Pencil size={15} /> Edit profile
          </Button>
          <LinkButton href="/settings" variant="outline">
            <Settings size={15} /> Settings
          </LinkButton>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="flex gap-6">
          <Avatar
            name={`${profile.firstName} ${profile.lastName}`}
            size={86}
            status={profile.status}
            preset={profile.avatarPreset}
          />
          <div>
            <p className="text-[13.5px] text-muted">Name</p>
            <p className="mt-1 text-[16px] font-bold">
              {profile.firstName} {profile.lastName}
            </p>
            <p className="mt-5 text-[13.5px] text-muted">Username</p>
            <p className="mt-1 text-[15px]">@{profile.handle}</p>
            {profile.anonymous && (
              <Tag tone="purple" className="mt-3">
                Posting anonymously
              </Tag>
            )}
          </div>
        </div>

        <div>
          <p className="text-[13.5px] text-muted">About me</p>
          <p className="mt-2 max-w-[620px] text-[15px] leading-relaxed">
            {profile.aboutMe}
          </p>
        </div>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-3">
        <section>
          <h3 className="text-[16px] font-bold">Account Info</h3>
          <dl className="mt-5 space-y-5">
            <Row label="Email" value={profile.email} />
            <Row label="Password" value="••••••••••••" />
            <Row label="Community" value={profile.community} />
          </dl>
        </section>

        <section>
          <h3 className="text-[16px] font-bold">Basic Info</h3>
          <dl className="mt-5 space-y-5">
            <Row label="Gender" value={profile.genderIdentity} />
            <Row label="Pronouns" value={profile.pronouns} />
            <Row label="Year of birth" value={String(profile.birthYear)} />
            <Row label="Age" value={String(age)} />
            <Row label="Zipcode" value={profile.zip} />
          </dl>
        </section>

        <section>
          <h3 className="text-[16px] font-bold">My Support Campaign</h3>
          <div className="mt-5">
            {myCampaign ? (
              <LinkButton href="/fundraising/mine" variant="quiet">
                View my campaign
              </LinkButton>
            ) : (
              <LinkButton href="/fundraising/new" variant="quiet">
                Create a campaign
              </LinkButton>
            )}
          </div>

          <h4 className="mt-9 flex items-center gap-2 text-[16px] font-bold text-muted">
            <Gift size={16} /> My Gift Wishlist
          </h4>
          {!myCampaign?.wishlist.length && (
            <p className="mt-3 text-[13.5px] text-muted">
              Your wishlist appears here once you add items to a campaign.
            </p>
          )}
          <ul className="mt-4 space-y-4">
            {(myCampaign?.wishlist ?? []).map((w) => (
              <li key={w.id}>
                <p className="text-[15.5px] font-bold">{w.title}</p>
                <p className="text-[14px]">Provider: {w.provider}</p>
                <p className="text-[13.5px] text-muted">
                  Wants: {w.wanted}
                  <br />
                  Has: {w.fulfilled}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {profile.stages.length > 0 && (
        <section className="mt-12">
          <h3 className="text-[16px] font-bold">My journey</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.stages.map((s) => (
              <Tag key={s} tone="green">
                {s}
              </Tag>
            ))}
            {profile.diagnoses.map((d) => (
              <Tag key={d} tone="coral">
                {d}
              </Tag>
            ))}
          </div>
        </section>
      )}

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        width={620}
        labelledBy="edit-profile"
      >
        <h3 id="edit-profile" className="serif text-[26px]">
          Edit profile
        </h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <Input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </Field>
          <Field label="Last name">
            <Input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </Field>
          <Field label="Handle">
            <Input
              value={form.handle}
              onChange={(e) =>
                setForm({ ...form, handle: e.target.value.toLowerCase() })
              }
            />
          </Field>
          <Field label="Zip code">
            <Input
              value={form.zip}
              onChange={(e) => setForm({ ...form, zip: e.target.value })}
            />
          </Field>
          <Field label="Gender identity">
            <Select
              value={form.genderIdentity}
              onChange={(e) =>
                setForm({ ...form, genderIdentity: e.target.value })
              }
            >
              {GENDER_IDENTITIES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </Select>
          </Field>
          <Field label="Pronouns">
            <Select
              value={form.pronouns}
              onChange={(e) => setForm({ ...form, pronouns: e.target.value })}
            >
              {PRONOUNS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </Field>
          <Field label="Year of birth">
            <Input
              value={form.birthYear}
              onChange={(e) =>
                setForm({ ...form, birthYear: Number(e.target.value) || form.birthYear })
              }
            />
          </Field>
          <Field label="Display identity">
            <Select
              value={form.anonymous ? "Handle" : "Real name"}
              onChange={(e) =>
                setForm({ ...form, anonymous: e.target.value === "Handle" })
              }
            >
              <option>Real name</option>
              <option>Handle</option>
            </Select>
          </Field>
        </div>
        <div className="mt-4">
          <Field label="About me">
            <Textarea
              rows={5}
              maxLength={1000}
              value={form.aboutMe}
              onChange={(e) => setForm({ ...form, aboutMe: e.target.value })}
            />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              updateProfile(form);
              setEditing(false);
            }}
          >
            Save changes
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13.5px] text-muted">{label}</dt>
      <dd className="mt-1 text-[15px]">{value}</dd>
    </div>
  );
}
