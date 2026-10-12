"use client";

import { useActionState } from "react";
import { updateRequest, type ActionState } from "@/app/admin/(panel)/requests/actions";

type Props = { id: string; status: string; notes: string };

const primary =
  "bg-accent px-5 py-3 text-sm tracking-widest text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50";
const secondary =
  "border border-accent px-5 py-3 text-sm tracking-widest transition-colors hover:bg-accent/15 disabled:opacity-50";
const quiet =
  "border border-line px-5 py-3 text-sm tracking-widest text-muted transition-colors hover:border-accent hover:text-fg disabled:opacity-50";

export default function RequestActions({ id, status, notes }: Props) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateRequest, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={id} />

      <div>
        <label htmlFor="notes" className="mb-1.5 block text-xs tracking-widest text-muted">
          Private notes (guests never see these)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={notes}
          maxLength={4000}
          className="w-full border border-line bg-transparent px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
          placeholder="Price agreed, payment received, arrival time..."
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
          Save notes only
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
