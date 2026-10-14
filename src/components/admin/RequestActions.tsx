"use client";

import { useActionState } from "react";
import { updateRequest, type ActionState } from "@/app/admin/(panel)/requests/actions";

type Props = {
  id: string;
  status: string;
  notes: string;
  currency: string;
  showPickupFee: boolean;
  showDropoffFee: boolean;
  pickupLabel: string;
  dropoffLabel: string;
  pickupFee: number | null;
  dropoffFee: number | null;
  finalTotal: number | null;
};

const box = "w-full border border-line bg-transparent px-3 py-2.5 text-sm focus:border-accent focus:outline-none";
const lab = "mb-1.5 block text-xs tracking-widest text-muted";
const primary =
  "bg-accent px-5 py-3 text-sm tracking-widest text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50";
const secondary =
  "border border-accent px-5 py-3 text-sm tracking-widest transition-colors hover:bg-accent/15 disabled:opacity-50";
const quiet =
  "border border-line px-5 py-3 text-sm tracking-widest text-muted transition-colors hover:border-accent hover:text-fg disabled:opacity-50";

export default function RequestActions(p: Props) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateRequest, {});
  const { status } = p;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={p.id} />

      {(p.showPickupFee || p.showDropoffFee) && (
        <div className="space-y-4">
          {p.showPickupFee && (
            <div>
              <label htmlFor="pickup_fee" className={lab}>{p.pickupLabel} fee ({p.currency})</label>
              <input id="pickup_fee" name="pickup_fee" type="number" min={0} step="1" defaultValue={p.pickupFee ?? ""} className={box} placeholder="Not set yet" />
            </div>
          )}
          {p.showDropoffFee && (
            <div>
              <label htmlFor="dropoff_fee" className={lab}>{p.dropoffLabel} fee ({p.currency})</label>
              <input id="dropoff_fee" name="dropoff_fee" type="number" min={0} step="1" defaultValue={p.dropoffFee ?? ""} className={box} placeholder="Not set yet" />
            </div>
          )}
          <p className="text-xs text-muted">For a map pin, enter the price you quoted the guest on WhatsApp.</p>
        </div>
      )}

      <div>
        <label htmlFor="final_total" className={lab}>Final price agreed ({p.currency})</label>
        <input id="final_total" name="final_total" type="number" min={0} step="1" defaultValue={p.finalTotal ?? ""} className={box} placeholder="Not set yet" />
      </div>

      <div>
        <label htmlFor="notes" className={lab}>Private notes (guests never see these)</label>
        <textarea
          id="notes" name="notes" rows={4} defaultValue={p.notes} maxLength={4000} className={box}
          placeholder="Payment received, arrival time, driver assigned..."
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {status !== "confirmed" && (
          <button name="status" value="confirmed" disabled={pending} className={primary}>
            Confirm and block dates
          </button>
        )}
        {status === "new" && (
          <button name="status" value="contacted" disabled={pending} className={secondary}>
            Mark contacted
          </button>
        )}
        {(status === "new" || status === "contacted") && (
          <button name="status" value="declined" disabled={pending} className={quiet}>
            Decline
          </button>
        )}
        {status === "confirmed" && (
          <>
            <button name="status" value="completed" disabled={pending} className={secondary}>
              Mark completed
            </button>
            <button name="status" value="cancelled" disabled={pending} className={quiet}>
              Cancel and free dates
            </button>
          </>
        )}
        {(status === "declined" || status === "cancelled" || status === "completed") && (
          <button name="status" value="new" disabled={pending} className={quiet}>
            Reopen as new
          </button>
        )}
        <button name="status" value={status} disabled={pending} className={quiet}>
          Save prices and notes only
        </button>
      </div>

      {state.error && (
        <p role="alert" className="text-sm underline decoration-accent underline-offset-4">
          {state.error}
        </p>
      )}
      {state.ok && state.message && <p role="status" className="text-sm text-muted">{state.message}</p>}
    </form>
  );
}
