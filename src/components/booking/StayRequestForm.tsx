"use client";

import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import { submitBooking, type BookingState } from "@/app/actions/booking";
import ThemedSelect from "@/components/ThemedSelect";
import { diffDays, eachDay, niceDate, toRanges } from "@/lib/dates";
import { money, plural } from "@/lib/format";
import ContactFields from "./ContactFields";
import SuccessPanel from "./SuccessPanel";
import TransferBlock, { type TransferPoint, type TransferValue } from "./TransferBlock";

type Props = {
  listingId: string;
  title: string;
  price: number;
  currency: string;
  maxGuests: number;
  minNights: number;
  points: TransferPoint[];
  fullDays: string[];
  initialFrom: string;
  initialTo: string;
  hasPolicies: boolean;
};

const box =
  "w-full border border-line bg-transparent px-3 py-2.5 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none";
const lab = "mb-1.5 block text-xs tracking-widest text-muted";

export default function StayRequestForm(p: Props) {
  const [state, action, pending] = useActionState<BookingState, FormData>(submitBooking, { ok: false });
  const [today, setToday] = useState("");
  const [start, setStart] = useState(p.initialFrom);
  const [end, setEnd] = useState(p.initialTo);
  const first = p.points[0]?.id ?? "";
  const [pickup, setPickup] = useState<TransferValue>({ on: false, pointId: first, time: "", flight: "" });
  const [dropoff, setDropoff] = useState<TransferValue>({ on: false, pointId: first, time: "", flight: "" });

  useEffect(() => setToday(new Date().toLocaleDateString("en-CA")), []);
  const full = useMemo(() => new Set(p.fullDays), [p.fullDays]);
  const ranges = useMemo(() => toRanges(p.fullDays).slice(0, 4), [p.fullDays]);

  const nights = start && end ? diffDays(start, end) : null;
  let problem = "";
  if (start && end && nights !== null) {
    if (nights < 1) problem = "The check-out date must be after check-in.";
    else if (nights < p.minNights) problem = `This stay needs at least ${plural(p.minNights, "night")}.`;
    else if (eachDay(start, end).some((d) => full.has(d))) problem = "Those dates are not available. Please choose different dates.";
  }

  const feeOf = (v: TransferValue) => (v.on ? (p.points.find((x) => x.id === v.pointId)?.fee ?? 0) : 0);
  const pickupFee = feeOf(pickup);
  const dropoffFee = feeOf(dropoff);
  const stayTotal = nights !== null && nights >= 1 ? nights * p.price : null;
  const total = stayTotal !== null && !problem ? stayTotal + pickupFee + dropoffFee : null;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  }

  if (state.ok && state.reference) {
    return (
      <SuccessPanel
        reference={state.reference}
        message={`It is for ${p.title}${start && end ? ` (${niceDate(start)} to ${niceDate(end)})` : ""}.`}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="border border-line p-6" aria-labelledby="request-title">
      <p id="request-title" className="text-2xl tracking-wide">{money(p.price, p.currency)}</p>
      <p className="text-sm text-muted">per night</p>

      <input type="hidden" name="kind" value="stay" />
      <input type="hidden" name="listing_id" value={p.listingId} />

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="starts_on" className={lab}>Check-in</label>
          <input
            id="starts_on" name="starts_on" type="date" required className={box}
            min={today || undefined} value={start}
            onChange={(e) => {
              setStart(e.target.value);
              if (end && e.target.value && end <= e.target.value) setEnd("");
            }}
          />
        </div>
        <div>
          <label htmlFor="ends_on" className={lab}>Check-out</label>
          <input
            id="ends_on" name="ends_on" type="date" required className={box}
            min={start ? new Date(Date.parse(start + "T00:00:00Z") + 86400000).toISOString().slice(0, 10) : today || undefined}
            value={end} onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>

      {ranges.length > 0 && (
        <p className="mt-3 text-xs text-muted">
          Not available: {ranges.map((r) => `${niceDate(r.from)} to ${niceDate(r.to)}`).join(", ")}
          {p.fullDays.length > 0 && toRanges(p.fullDays).length > 4 ? " and more" : ""}
        </p>
      )}

      {problem && (
        <p role="alert" className="mt-3 text-sm underline decoration-accent underline-offset-4">{problem}</p>
      )}

      <div className="mt-4">
        <label htmlFor="guests" className={lab}>Guests</label>
        <ThemedSelect
          id="guests" name="guests" className={box} defaultValue="1"
          options={Array.from({ length: p.maxGuests }, (_, i): [string, string] => [String(i + 1), String(i + 1)])}
        />
      </div>

      {p.points.length > 0 && (
        <div className="mt-5 space-y-4">
          <p className="text-xs tracking-widest text-muted">AIRPORT AND SGR TRANSFERS</p>
          <TransferBlock
            name="pickup" title="Pickup on arrival" timeLabel="Arrival time"
            points={p.points} value={pickup} onChange={setPickup} currency={p.currency}
          />
          <TransferBlock
            name="dropoff" title="Drop off on departure" timeLabel="Departure time"
            points={p.points} value={dropoff} onChange={setDropoff} currency={p.currency}
          />
        </div>
      )}

      <ContactFields
        pending={pending}
        error={state.error}
        label="Request this stay"
        disabled={!!problem}
        hasPolicies={p.hasPolicies}
      />

      {total !== null && stayTotal !== null && nights !== null && (
        <div className="mt-5 space-y-1 border-t border-line pt-4 text-sm">
          <p className="flex justify-between gap-4">
            <span className="text-muted">{plural(nights, "night")} at {money(p.price, p.currency)}</span>
            <span>{money(stayTotal, p.currency)}</span>
          </p>
          {pickupFee > 0 && (
            <p className="flex justify-between gap-4">
              <span className="text-muted">Pickup on arrival</span>
              <span>{money(pickupFee, p.currency)}</span>
            </p>
          )}
          {dropoffFee > 0 && (
            <p className="flex justify-between gap-4">
              <span className="text-muted">Drop off on departure</span>
              <span>{money(dropoffFee, p.currency)}</span>
            </p>
          )}
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
