"use client";

import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import { submitBooking, type BookingState } from "@/app/actions/booking";
import ThemedSelect from "@/components/ThemedSelect";
import { addDays, diffDays, eachDay, niceDate, toRanges } from "@/lib/dates";
import { money, plural } from "@/lib/format";
import ContactFields from "./ContactFields";
import SuccessPanel from "./SuccessPanel";

type Props = {
  listingId: string;
  title: string;
  currency: string;
  tourType: "fixed" | "guide";
  price: number;
  basis: "per_person" | "per_group" | "per_day";
  minPeople: number;
  maxGroup: number;
  fullDays: string[];
  initialFrom: string;
  initialTo: string;
  hasPolicies: boolean;
};

const box =
  "w-full border border-line bg-transparent px-3 py-2.5 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none";
const lab = "mb-1.5 block text-xs tracking-widest text-muted";
const UNIT = { per_person: "per person", per_group: "per group", per_day: "per day" } as const;

export default function TourRequestForm(p: Props) {
  const [state, action, pending] = useActionState<BookingState, FormData>(submitBooking, { ok: false });
  const guide = p.tourType === "guide";
  const [today, setToday] = useState("");
  const [start, setStart] = useState(p.initialFrom);
  const [end, setEnd] = useState(p.initialTo);
  const [guests, setGuests] = useState(p.minPeople);

  useEffect(() => setToday(new Date().toLocaleDateString("en-CA")), []);
  const full = useMemo(() => new Set(p.fullDays), [p.fullDays]);
  const ranges = useMemo(() => toRanges(p.fullDays), [p.fullDays]);

  const lastDay = guide ? end : start;
  const days = start && lastDay ? diffDays(start, lastDay) + 1 : null;

  let problem = "";
  if (start && lastDay && days !== null) {
    if (days < 1) problem = "The end date cannot be before the start date.";
    else if (eachDay(start, addDays(lastDay, 1)).some((d) => full.has(d))) {
      problem = guide
        ? "Those dates are not available. Please choose different dates."
        : "That date is not available. Please choose a different date.";
    }
  }

  const base =
    days !== null && days >= 1
      ? p.basis === "per_person"
        ? guests * p.price
        : p.basis === "per_group"
          ? p.price
          : days * p.price
      : null;
  const total = base !== null && !problem ? base : null;

  const line =
    p.basis === "per_person"
      ? `${plural(guests, "person")} at ${money(p.price, p.currency)}`
      : p.basis === "per_group"
        ? "Price for your group"
        : `${plural(days ?? 1, "day")} at ${money(p.price, p.currency)}`;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  }

  if (state.ok && state.reference) {
    return (
      <SuccessPanel
        reference={state.reference}
        message={`It is for ${p.title}${start ? ` (${niceDate(start)}${guide && end ? ` to ${niceDate(end)}` : ""})` : ""}.`}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="border border-line p-6" aria-labelledby="request-title">
      <p id="request-title" className="text-2xl tracking-wide">{money(p.price, p.currency)}</p>
      <p className="text-sm text-muted">{UNIT[p.basis]}</p>

      <input type="hidden" name="kind" value="tour" />
      <input type="hidden" name="listing_id" value={p.listingId} />
      {!guide && <input type="hidden" name="ends_on" value={start} />}

      <div className={`mt-6 grid gap-3 ${guide ? "grid-cols-2" : "grid-cols-1"}`}>
        <div>
          <label htmlFor="starts_on" className={lab}>{guide ? "From" : "Date"}</label>
          <input
            id="starts_on" name="starts_on" type="date" required className={box}
            min={today || undefined} value={start}
            onChange={(e) => {
              setStart(e.target.value);
              if (end && e.target.value && end < e.target.value) setEnd("");
            }}
          />
        </div>
        {guide && (
          <div>
            <label htmlFor="ends_on" className={lab}>To</label>
            <input
              id="ends_on" name="ends_on" type="date" required className={box}
              min={start || today || undefined} value={end} onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        )}
      </div>

      {ranges.length > 0 && (
        <p className="mt-3 text-xs text-muted">
          Fully booked: {ranges.slice(0, 4).map((r) => `${niceDate(r.from)} to ${niceDate(r.to)}`).join(", ")}
          {ranges.length > 4 ? " and more" : ""}
        </p>
      )}

      {problem && (
        <p role="alert" className="mt-3 text-sm underline decoration-accent underline-offset-4">{problem}</p>
      )}

      <div className="mt-4">
        <label htmlFor="guests" className={lab}>{guide ? "Group size" : "People"}</label>
        <ThemedSelect
          id="guests" name="guests" className={box} defaultValue={String(p.minPeople)}
          onChange={(v) => setGuests(Number(v))}
          options={Array.from({ length: Math.max(p.maxGroup - p.minPeople + 1, 1) }, (_, i): [string, string] => [
            String(p.minPeople + i),
            String(p.minPeople + i),
          ])}
        />
      </div>

      <ContactFields
        pending={pending}
        error={state.error}
        label={guide ? "Request this guide" : "Request this tour"}
        disabled={!!problem}
        hasPolicies={p.hasPolicies}
      />

      {total !== null && base !== null && (
        <div className="mt-5 space-y-1 border-t border-line pt-4 text-sm">
          <p className="flex justify-between gap-4">
            <span className="text-muted">{line}</span>
            <span>{money(base, p.currency)}</span>
          </p>
          <p className="flex justify-between gap-4 pt-2 text-base">
            <span>Estimate</span>
            <span>{money(total, p.currency)}</span>
          </p>
          <p className="text-xs text-muted">The final price is confirmed by our team.</p>
        </div>
      )}
    </form>
  );
}
