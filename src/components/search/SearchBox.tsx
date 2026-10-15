"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
import ThemedSelect from "@/components/ThemedSelect";

type Type = "stay" | "ride" | "tour";
type Loc = { slug: string; name: string };

type Props = {
  locations: Loc[];
  toursReady: boolean;
  initial: { type: Type; location: string; from: string; to: string };
  compact?: boolean;
  /** "choose": the tabs pick a service before searching (home page).
      "navigate": the tabs are links, so the box always matches the page (results pages). */
  mode?: "choose" | "navigate";
};

const SEGMENT: Record<Type, string> = { stay: "stays", ride: "rides", tour: "tours" };
const TABS: { key: Type; label: string; icon: IconName }[] = [
  { key: "stay", label: "Stays", icon: "home" },
  { key: "ride", label: "Rides", icon: "car" },
  { key: "tour", label: "Tours", icon: "compass" },
];
const LABELS: Record<Type, [string, string]> = {
  stay: ["Check-in", "Check-out"],
  ride: ["Pick-up", "Return"],
  tour: ["From", "To (optional)"],
};

const box = "w-full border border-line bg-bg px-3 py-3 text-sm text-fg focus:border-accent focus:outline-none";
const lab = "mb-1.5 block text-xs tracking-widest text-muted";

function addDay(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function SearchBox({ locations, toursReady, initial, compact = false, mode = "choose" }: Props) {
  const uid = useId();
  const router = useRouter();
  const [chosen, setChosen] = useState<Type>(initial.type);
  const [location, setLocation] = useState(initial.location);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [error, setError] = useState("");
  const [today, setToday] = useState("");

  useEffect(() => setToday(new Date().toLocaleDateString("en-CA")), []);

  // On results pages the box always follows the page, so it can never disagree with it.
  const type: Type = mode === "navigate" ? initial.type : chosen;
  const tabs = TABS.filter((t) => t.key !== "tour" || toursReady);
  const [startLabel, endLabel] = LABELS[type];
  const toMin = from ? (type === "stay" ? addDay(from, 1) : from) : today;

  function hrefFor(t: Type) {
    const p = new URLSearchParams();
    if (location) p.set("location", location);
    if (from) {
      p.set("from", from);
      const keepTo = to && (t === "stay" ? to > from : to >= from);
      if (keepTo) p.set("to", to);
    }
    const q = p.toString();
    return `/${SEGMENT[t]}${q ? `?${q}` : ""}`;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (to && !from) return setError("Please choose a start date too.");
    if (from && !to && type !== "tour") return setError(`Please choose your ${endLabel.toLowerCase()} date too.`);
    if (from && to && (type === "stay" ? to <= from : to < from)) {
      return setError(type === "stay" ? "Check-out must be after check-in." : "The end date cannot be before the start date.");
    }
    router.push(hrefFor(type));
  }

  const tabClass = (active: boolean) =>
    `-mb-px inline-flex items-center gap-2 border-b pb-3 text-sm tracking-widest transition-colors ${
      active ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"
    }`;

  return (
    <form
      onSubmit={submit}
      aria-label="Search"
      className={compact ? "border border-line p-4 sm:p-5" : "border border-line bg-bg p-4 sm:p-5"}
    >
      {mode === "navigate" ? (
        <nav aria-label="What are you looking for" className="mb-5 flex flex-wrap gap-x-7 gap-y-2 border-b border-line">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={hrefFor(t.key)}
              aria-current={type === t.key ? "page" : undefined}
              className={tabClass(type === t.key)}
            >
              <Icon name={t.icon} size={17} />
              {t.label}
            </Link>
          ))}
        </nav>
      ) : (
        <div role="tablist" aria-label="What are you looking for" className="mb-5 flex flex-wrap gap-x-7 gap-y-2 border-b border-line">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={type === t.key}
              onClick={() => setChosen(t.key)}
              className={tabClass(type === t.key)}
            >
              <Icon name={t.icon} size={17} />
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_auto] lg:items-end">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor={`${uid}-loc`} className={lab}>Location</label>
          <ThemedSelect
            id={`${uid}-loc`}
            name="location"
            defaultValue={location}
            onChange={setLocation}
            className={box}
            options={[["", "All locations"], ...locations.map((l): [string, string] => [l.slug, l.name])]}
          />
        </div>
        <div>
          <label htmlFor={`${uid}-from`} className={lab}>{startLabel}</label>
          <input
            id={`${uid}-from`} type="date" className={box} min={today || undefined} value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              if (to && e.target.value && (type === "stay" ? to <= e.target.value : to < e.target.value)) setTo("");
            }}
          />
        </div>
        <div>
          <label htmlFor={`${uid}-to`} className={lab}>{endLabel}</label>
          <input id={`${uid}-to`} type="date" className={box} min={toMin || undefined} value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 bg-accent px-7 py-3 text-sm tracking-widest text-on-accent transition-opacity hover:opacity-90 sm:col-span-2 lg:col-span-1"
        >
          <Icon name="search" size={16} />
          Search
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm underline decoration-accent underline-offset-4">{error}</p>
      )}
    </form>
  );
}
