"use client";

import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import { submitBooking, type BookingState } from "@/app/actions/booking";
import ThemedSelect from "@/components/ThemedSelect";
import { addDays, diffDays, eachDay, niceDate, toRanges } from "@/lib/dates";
import { money, plural } from "@/lib/format";
import ContactFields from "./ContactFields";
import DeliveryBlock, { type DeliveryPoint, type DeliveryValue } from "./DeliveryBlock";
import SuccessPanel from "./SuccessPanel";

type Drive = "self" | "chauffeur";

type Props = {
  listingId: string;
  title: string;
  currency: string;
  seats: number;
  minDays: number;
  selfPrice: number | null;
  chauffeurPrice: number | null;
  points: DeliveryPoint[];
  deliveryEnabled: boolean;
  fullDays: string[];
  initialFrom: string;
  initialTo: string;
  initialDrive: string;
  hasPolicies: boolean;
};

const box =
  "w-full border border-line bg-transparent px-3 py-2.5 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none";
const lab = "mb-1.5 block text-xs tracking-widest text-muted";
const seg = (on: boolean) =>
  `px-4 py-2 text-sm transition-colors ${on ? "bg-accent text-on-accent" : "text-muted hover:text-fg"}`;

const EMPTY: DeliveryValue = { mode: "none", pointId: "", time: "", details: "", pin: null };

export default function RideRequestForm(p: Props) {
  const [state, action, pending] = useActionState<BookingState, FormData>(submitBooking, { ok: false });
  const both = p.selfPrice !== null && p.chauffeurPrice !== null;
  const [drive, setDrive] = useState<Drive>(
    p.initialDrive === "chauffeured" && p.chauffeurPrice !== null ? "chauffeur" : p.selfPrice !== null ? "self" : "chauffeur"
  );
  const [today, setToday] = useState("");
  const [start, setStart] = useState(p.initialFrom);
  const [end, setEnd] = useState(p.initialTo);
  const first = p.points[0]?.id ?? "";
  const [pickup, setPickup] = useState<DeliveryValue>({ ...EMPTY, pointId: first });
  const [dropoff, setDropoff] = useState<DeliveryValue>({ ...EMPTY, pointId: first });

  useEffect(() => setToday(new Date().toLocaleDateString("en-CA")), []);
  const full = useMemo(() => new Set(p.fullDays), [p.fullDays]);
  const ranges = useMemo(() => toRanges(p.fullDays), [p.fullDays]);

  const rate = (drive === "self" ? p.selfPrice : p.chauffeurPrice) ?? 0;
  const days = start && end ? diffDays(start, end) + 1 : null;

  let problem = "";
  if (start && end && days !== null) {
    if (days < 1) problem = "The return date cannot be before the pick-up date.";
    else if (days < p.minDays) problem = `This car needs at least ${plural(p.minDays, "day")}.`;
    else if (eachDay(start, addDays(end, 1)).some((d) => full.has(d))) {
      problem = "Those dates are not available. Please choose different dates.";
    }
  }

  const needsPin = (pickup.mode === "custom" && !pickup.pin) || (dropoff.mode === "custom" && !dropoff.pin);
  const feeOf = (v: DeliveryValue) =>
    v.mode === "point" ? (p.points.find((x) => x.id === v.pointId)?.fee ?? 0) : 0;
  const quoted = pickup.mode === "custom" || dropoff.mode === "custom";
  const pickupFee = feeOf(pickup);
  const dropoffFee = feeOf(dropoff);
  const base = days !== null && days >= 1 ? days * rate : null;
  const total = base !== null && !problem ? base + pickupFee + dropoffFee : null;

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
      <p id="request-title" className="text-2xl tracking-wide">{money(rate, p.currency)}</p>
      <p className="text-sm text-muted">per day{drive === "chauffeur" ? ", with a chauffeur" : ""}</p>

      <input type="hidden" name="kind" value="ride" />
      <input type="hidden" name="listing_id" value={p.listingId} />
      <input type="hidden" name="drive_type" value={drive === "self" ? "self_drive" : "chauffeured"} />

      {both ? (
        <div role="group" aria-label="Drive type" className="mt-5 inline-flex border border-line">
          <button type="button" aria-pressed={drive === "self"} onClick={() => setDrive("self")} className={seg(drive === "self")}>
            Self-drive
          </button>
          <button type="button" aria-pressed={drive === "chauffeur"} onClick={() => setDrive("chauffeur")} className={seg(drive === "chauffeur")}>
            Chauffeured
          </button>
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted">{p.selfPrice !== null ? "Self-drive" : "Chauffeured only"}</p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="starts_on" className={lab}>Pick-up</label>
          <input
            id="starts_on" name="starts_on" type="date" required className={box}
            min={today || undefined} value={start}
            onChange={(e) => {
              setStart(e.target.value);
              if (end && e.target.value && end < e.target.value) setEnd("");
            }}
          />
        </div>
        <div>
          <label htmlFor="ends_on" className={lab}>Return</label>
          <input
            id="ends_on" name="ends_on" type="date" required className={box}
            min={start || today || undefined} value={end} onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>

      <p className="mt-2 text-xs text-muted">Minimum {plural(p.minDays, "day")}</p>

      {ranges.length > 0 && (
        <p className="mt-2 text-xs text-muted">
          Fully booked: {ranges.slice(0, 4).map((r) => `${niceDate(r.from)} to ${niceDate(r.to)}`).join(", ")}
          {ranges.length > 4 ? " and more" : ""}
        </p>
      )}

      {problem && (
        <p role="alert" className="mt-3 text-sm underline decoration-accent underline-offset-4">{problem}</p>
      )}

      <div className="mt-4">
        <label htmlFor="guests" className={lab}>Passengers</label>
        <ThemedSelect
          id="guests" name="guests" className={box} defaultValue="1"
          options={Array.from({ length: p.seats }, (_, i): [string, string] => [String(i + 1), String(i + 1)])}
        />
      </div>

      {p.deliveryEnabled && (
        <div className="mt-5 space-y-4">
          <DeliveryBlock
            name="pickup" title="GETTING THE CAR" timeLabel="Delivery time"
            labels={{ none: "Collect the car from us", point: "Deliver to the airport or SGR", custom: "Deliver to a place I choose" }}
            points={p.points} value={pickup} onChange={setPickup} currency={p.currency}
          />
          <DeliveryBlock
            name="dropoff" title="RETURNING THE CAR" timeLabel="Collection time"
            labels={{ none: "Return the car to us", point: "Collect from the airport or SGR", custom: "Collect from a place I choose" }}
            points={p.points} value={dropoff} onChange={setDropoff} currency={p.currency}
          />
          {needsPin && (
            <p className="text-xs text-muted">Please drop a pin on the map for the place you chose.</p>
          )}
        </div>
      )}

      <ContactFields
        pending={pending}
        error={state.error}
        label="Request this car"
        disabled={!!problem || needsPin}
        hasPolicies={p.hasPolicies}
      />

      {total !== null && base !== null && days !== null && (
        <div className="mt-5 space-y-1 border-t border-line pt-4 text-sm">
          <p className="flex justify-between gap-4">
            <span className="text-muted">{plural(days, "day")} at {money(rate, p.currency)}</span>
            <span>{money(base, p.currency)}</span>
          </p>
          {pickupFee > 0 && (
            <p className="flex justify-between gap-4">
              <span className="text-muted">Delivery</span>
              <span>{money(pickupFee, p.currency)}</span>
            </p>
          )}
          {dropoffFee > 0 && (
            <p className="flex justify-between gap-4">
              <span className="text-muted">Collection</span>
              <span>{money(dropoffFee, p.currency)}</span>
            </p>
          )}
          <p className="flex justify-between gap-4 pt-2 text-base">
            <span>Estimate</span>
            <span>{money(total, p.currency)}</span>
          </p>
          {quoted && (
            <p className="text-xs text-muted">
              Delivery or collection at a place you chose is quoted by our team and is not included.
            </p>
          )}
          <p className="text-xs text-muted">The final price is confirmed by our team.</p>
        </div>
      )}
    </form>
  );
}
