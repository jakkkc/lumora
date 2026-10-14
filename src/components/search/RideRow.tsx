"use client";

import { useState } from "react";
import { money, plural, sortImages } from "@/lib/format";
import type { RideItem } from "@/lib/search";
import ResultShell from "./ResultShell";

type Drive = "self" | "chauffeur";

export default function RideRow({ r, days, from, to }: { r: RideItem; days: number | null; from: string; to: string }) {
  const both = r.self_price !== null && r.chauffeur_price !== null;
  const [drive, setDrive] = useState<Drive>(r.self_price !== null ? "self" : "chauffeur");

  const rate = (drive === "self" ? r.self_price : r.chauffeur_price) ?? 0;
  const tooShort = days !== null && days < r.min_days;

  const params = new URLSearchParams();
  if (from && to) {
    params.set("from", from);
    params.set("to", to);
  }
  params.set("drive", drive === "self" ? "self_drive" : "chauffeured");

  const name = [r.make, r.model].filter(Boolean).join(" ");
  const subtitle = name
    ? `${name}${r.or_similar ? " or similar" : ""}, ${plural(r.seats, "seat")}`
    : `${plural(r.seats, "seat")}${r.or_similar ? ", or similar" : ""}`;

  const seg = (active: boolean) =>
    `px-4 py-2 text-sm transition-colors ${active ? "bg-accent text-on-accent" : "text-muted hover:text-fg"}`;

  return (
    <ResultShell
      href={`/rides/${r.slug}?${params.toString()}`}
      image={sortImages(r.images)[0]}
      title={r.title}
      subtitle={subtitle}
      controls={
        both ? (
          <div role="group" aria-label="Drive type" className="inline-flex border border-line">
            <button type="button" aria-pressed={drive === "self"} onClick={() => setDrive("self")} className={seg(drive === "self")}>
              Self-drive
            </button>
            <button type="button" aria-pressed={drive === "chauffeur"} onClick={() => setDrive("chauffeur")} className={seg(drive === "chauffeur")}>
              Chauffeured
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted">{r.self_price !== null ? "Self-drive" : "Chauffeured only"}</p>
        )
      }
      price={money(rate, r.currency)}
      unit=" per day"
      note={
        days !== null && !tooShort
          ? `${money(rate * days, r.currency)} for ${plural(days, "day")}`
          : `${plural(r.min_days, "day")} minimum`
      }
      warn={tooShort ? `Needs at least ${plural(r.min_days, "day")}` : undefined}
    />
  );
}
