import { money, plural, sortImages } from "@/lib/format";
import type { StayItem, TourItem } from "@/lib/search";
import ResultShell from "./ResultShell";

export function StayRow({ s, nights, qs }: { s: StayItem; nights: number | null; qs: string }) {
  const tooShort = nights !== null && nights < s.min_nights;
  return (
    <ResultShell
      href={`/stays/${s.slug}${qs}`}
      image={sortImages(s.images)[0]}
      title={s.title}
      subtitle={[s.area, s.location?.name].filter(Boolean).join(", ")}
      meta={[plural(s.bedrooms, "bedroom"), plural(s.bathrooms, "bathroom"), `sleeps ${s.max_guests}`].join(" · ")}
      price={money(s.price, s.currency)}
      unit=" per night"
      note={
        nights !== null && !tooShort
          ? `${money(s.price * nights, s.currency)} for ${plural(nights, "night")}`
          : `${plural(s.min_nights, "night")} minimum`
      }
      warn={tooShort ? `Needs at least ${plural(s.min_nights, "night")}` : undefined}
    />
  );
}

const basisUnit = { per_person: " per person", per_group: " per group", per_day: " per day" } as const;

export function TourRow({ t, days, qs }: { t: TourItem; days: number | null; qs: string }) {
  const note =
    t.price_basis === "per_day" && days !== null
      ? `${money(t.price * days, t.currency)} for ${plural(days, "day")}`
      : `For ${t.min_people} to ${t.max_group} people`;
  return (
    <ResultShell
      href={`/tours/${t.slug}${qs}`}
      image={sortImages(t.images)[0]}
      title={t.title}
      subtitle={[t.location?.name, t.duration_text].filter(Boolean).join(", ")}
      meta={t.tour_type === "guide" ? "Guide hired by the day" : "Fixed tour"}
      price={money(t.price, t.currency)}
      unit={basisUnit[t.price_basis]}
      note={note}
    />
  );
}
