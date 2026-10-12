"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { submitRequest, type RequestState } from "@/app/actions/request";
import { money, plural } from "@/lib/format";
import { whatsappLink } from "@/lib/contact";

type Block = { starts_on: string; ends_on: string };

type Props = {
  kind: "stay" | "ride";
  listingId: string;
  title: string;
  price: number;
  currency: string;
  maxGuests: number;
  minNights?: number;
  cleaningFee?: number;
  driverOption?: "self_drive" | "with_driver" | "both";
  driverFee?: number;
  blocked: Block[];
};

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (iso: string) => new Date(iso + "T00:00:00");
const addDays = (iso: string, n: number) => {
  const d = parse(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
const diffDays = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000);
const nice = (iso: string) => parse(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const field =
  "w-full border border-line bg-transparent px-3 py-2.5 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none";
const label = "mb-1.5 block text-xs tracking-widest text-muted";

export default function RequestForm(p: Props) {
  const [state, action, pending] = useActionState<RequestState, FormData>(submitRequest, { ok: false });
  const [today, setToday] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [driver, setDriver] = useState(p.driverOption === "with_driver");

  useEffect(() => setToday(toISO(new Date())), []);

  const isStay = p.kind === "stay";
  const minNights = p.minNights ?? 1;
  const unit = isStay ? "per night" : "per day";
  const span = start && end ? diffDays(start, end) : null;

  let problem = "";
  if (start && end && span !== null) {
    if (end < start) problem = "The end date must be after the start date.";
    else if (isStay && span < minNights) problem = `This stay needs at least ${plural(minNights, "night")}.`;
    else {
      const endExclusive = isStay ? end : addDays(end, 1);
      if (p.blocked.some((b) => start < b.ends_on && endExclusive > b.starts_on)) {
        problem = "Those dates are not available. Please choose different dates.";
      }
    }
  }

  let estimate: number | null = null;
  let estimateNote = "";
  if (start && end && span !== null && !problem) {
    if (isStay) {
      estimate = span * p.price + (p.cleaningFee ?? 0);
      estimateNote = `${plural(span, "night")}${p.cleaningFee ? ", including the cleaning fee" : ""}`;
    } else {
      const days = span + 1;
      estimate = days * p.price + (driver ? days * (p.driverFee ?? 0) : 0);
      estimateNote = `${plural(days, "day")}${driver && p.driverFee ? ", with a driver" : ""}`;
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  }

  if (state.ok && state.reference) {
    const msg = `Hello Lumora, I just sent request ${state.reference} for ${p.title}${
      start && end ? ` (${nice(start)} to ${nice(end)})` : ""
    }.`;
    return (
      <div className="border border-line p-6" role="status">
        <p className="text-sm text-muted">Request sent</p>
        <p className="mt-1 text-3xl tracking-widest">{state.reference}</p>
        <p className="mt-4 text-sm text-muted">
          Thank you. Our team will contact you shortly to confirm availability and the final price. Keep this
          reference handy.
        </p>
        <a
          href={whatsappLink(msg)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 block bg-accent px-6 py-3.5 text-center text-sm tracking-widest text-on-accent transition-opacity hover:opacity-90"
        >
          Message us on WhatsApp
        </a>
      </div>
    );
  }

  const blockedList = p.blocked.slice(0, 4);

  return (
    <form onSubmit={onSubmit} className="border border-line p-6" aria-labelledby="request-title">
      <p id="request-title" className="text-2xl tracking-wide">
        {money(p.price, p.currency)}
      </p>
      <p className="text-sm text-muted">{unit}</p>

      <input type="hidden" name="kind" value={p.kind} />
      <input type="hidden" name="listing_id" value={p.listingId} />
      <input type="hidden" name="with_driver" value={driver ? "1" : "0"} />
      {/* spam trap: real people never see or fill this */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="starts_on" className={label}>{isStay ? "Check-in" : "Pick-up"}</label>
          <input
            id="starts_on" name="starts_on" type="date" required className={field}
            min={today || undefined} value={start}
            onChange={(e) => {
              setStart(e.target.value);
              if (end && e.target.value && end < e.target.value) setEnd("");
            }}
          />
        </div>
        <div>
          <label htmlFor="ends_on" className={label}>{isStay ? "Check-out" : "Return"}</label>
          <input
            id="ends_on" name="ends_on" type="date" required className={field}
            min={start ? (isStay ? addDays(start, 1) : start) : today || undefined}
            value={end} onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>

      {blockedList.length > 0 && (
        <p className="mt-3 text-xs text-muted">
          Not available:{" "}
          {blockedList.map((b) => `${nice(b.starts_on)} to ${nice(b.ends_on)}`).join(", ")}
          {p.blocked.length > 4 ? " and more" : ""}
        </p>
      )}

      {problem && (
        <p role="alert" className="mt-3 text-sm text-fg underline decoration-accent underline-offset-4">
          {problem}
        </p>
      )}

      <div className="mt-4">
        <label htmlFor="guests" className={label}>{isStay ? "Guests" : "Passengers"}</label>
        <select id="guests" name="guests" className={field} defaultValue="1">
          {Array.from({ length: p.maxGuests }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {!isStay && (
        <>
          <div className="mt-4">
            <label htmlFor="pickup" className={label}>Pick-up place</label>
            <input id="pickup" name="pickup" type="text" maxLength={200} className={field}
              placeholder="Airport, hotel or address" />
          </div>
          {p.driverOption === "both" && (
            <label className="mt-4 flex items-center gap-3 text-sm">
              <input type="checkbox" checked={driver} onChange={(e) => setDriver(e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]" />
              Add a driver{p.driverFee ? ` (${money(p.driverFee, p.currency)} per day)` : ""}
            </label>
          )}
          {p.driverOption === "with_driver" && (
            <p className="mt-4 text-sm text-muted">A driver is included with this car.</p>
          )}
        </>
      )}

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="full_name" className={label}>Full name</label>
          <input id="full_name" name="full_name" type="text" required minLength={2} maxLength={100}
            autoComplete="name" className={field} />
        </div>
        <div>
          <label htmlFor="email" className={label}>Email</label>
          <input id="email" name="email" type="email" required maxLength={200}
            autoComplete="email" className={field} />
        </div>
        <div>
          <label htmlFor="phone" className={label}>Phone or WhatsApp</label>
          <input id="phone" name="phone" type="tel" required maxLength={30}
            autoComplete="tel" className={field} placeholder="+254 ..." />
        </div>
        <div>
          <label htmlFor="message" className={label}>Message (optional)</label>
          <textarea id="message" name="message" rows={3} maxLength={2000} className={field}
            placeholder="Arrival time, special requests, questions" />
        </div>
      </div>

      {estimate !== null && (
        <div className="mt-5 border-t border-line pt-4 text-sm">
          <p className="flex justify-between gap-4">
            <span className="text-muted">Estimate, {estimateNote}</span>
            <span>{money(estimate, p.currency)}</span>
          </p>
          <p className="mt-1 text-xs text-muted">The final price is confirmed by our team.</p>
        </div>
      )}

      {state.error && (
        <p role="alert" className="mt-4 text-sm text-fg underline decoration-accent underline-offset-4">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !!problem}
        className="mt-6 w-full bg-accent px-6 py-3.5 text-sm tracking-widest text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Sending..." : isStay ? "Request this stay" : "Request this car"}
      </button>
      <p className="mt-3 text-xs text-muted">
        This is a request, not a booking. Nothing is charged until our team confirms it with you.
      </p>
    </form>
  );
}
