"use client";

import { useActionState, useId, useState } from "react";
import { updateRequest, type ActionState } from "@/app/admin/(panel)/requests/actions";
import { money } from "@/lib/format";

type Props = {
  id: string;
  status: string;
  currency: string;
  showPickupFee: boolean;
  showDropoffFee: boolean;
  pickupLabel: string;
  dropoffLabel: string;
  pickupFee: number | null;
  dropoffFee: number | null;
  finalTotal: number | null;
  suggested: number | null;
  notes: string;
};

const box = "w-full border border-line bg-transparent px-3 py-2.5 text-sm focus:border-accent focus:outline-none";
const lab = "mb-1.5 block text-xs tracking-widest text-muted";

export default function PriceAndNotes(p: Props) {
  const uid = useId();
  const [state, action, pending] = useActionState<ActionState, FormData>(updateRequest, {});
  const [final, setFinal] = useState(p.finalTotal === null ? "" : String(p.finalTotal));

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={p.id} />
      <input type="hidden" name="status" value={p.status} />

      {p.showPickupFee && (
        <div>
          <label htmlFor={`${uid}-pf`} className={lab}>{p.pickupLabel} fee ({p.currency})</label>
          <input id={`${uid}-pf`} name="pickup_fee" type="number" min={0} step="1" defaultValue={p.pickupFee ?? ""} className={box} placeholder="Not set yet" />
        </div>
      )}
      {p.showDropoffFee && (
        <div>
          <label htmlFor={`${uid}-df`} className={lab}>{p.dropoffLabel} fee ({p.currency})</label>
          <input id={`${uid}-df`} name="dropoff_fee" type="number" min={0} step="1" defaultValue={p.dropoffFee ?? ""} className={box} placeholder="Not set yet" />
          <p className="mt-1 text-xs text-muted">For a map pin, enter the price you quoted the guest on WhatsApp.</p>
        </div>
      )}

      <div>
        <label htmlFor={`${uid}-ft`} className={lab}>Final price agreed ({p.currency})</label>
        <input
          id={`${uid}-ft`}
          name="final_total"
          type="number"
          min={0}
          step="1"
          value={final}
          onChange={(e) => setFinal(e.target.value)}
          className={box}
          placeholder="Not set yet"
        />
        {p.suggested !== null && String(p.suggested) !== final && (
          <button
            type="button"
            onClick={() => setFinal(String(p.suggested))}
            className="mt-2 text-xs text-muted underline decoration-line underline-offset-4 hover:decoration-accent"
          >
            Use {money(p.suggested, p.currency)} (from the listed prices and fees)
          </button>
        )}
      </div>

      <div>
        <label htmlFor={`${uid}-nt`} className={lab}>Private notes (guests never see these)</label>
        <textarea
          id={`${uid}-nt`}
          name="notes"
          rows={4}
          defaultValue={p.notes}
          maxLength={4000}
          className={box}
          placeholder="Arrival time, driver assigned, anything to remember..."
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          disabled={pending}
          className="bg-accent px-6 py-3 text-sm tracking-widest text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
        {state.error && (
          <p role="alert" className="text-sm underline decoration-accent underline-offset-4">{state.error}</p>
        )}
        {state.ok && <p role="status" className="text-sm text-muted">Saved</p>}
      </div>
    </form>
  );
}
