"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { Progress } from "./ui";
import type { Campaign } from "@/lib/types";

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <li className="group">
      <Link href={`/fundraising/${campaign.slug}`} className="block">
        <div
          className="relative h-[190px] overflow-hidden rounded-2xl transition group-hover:brightness-95"
          style={{ background: campaign.cover }}
        >
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[12.5px] font-medium text-white backdrop-blur">
            <MapPin size={13} /> {campaign.city}, {campaign.state}
          </span>
        </div>
        <h3 className="mt-3.5 text-[16.5px] font-bold leading-snug">
          {campaign.title}
        </h3>
      </Link>
      <div className="mt-3">
        <Progress value={campaign.raised} max={campaign.goal} />
        <p className="mt-2 text-[14.5px] font-bold text-blue-ink">
          ${campaign.raised.toLocaleString()} raised
          <span className="ml-1.5 font-medium text-muted">
            of ${campaign.goal.toLocaleString()}
          </span>
        </p>
      </div>
    </li>
  );
}
