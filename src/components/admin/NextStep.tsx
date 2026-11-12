"use client";

import { useActionState } from "react";
import { updateRequest, type ActionState } from "@/app/admin/(panel)/requests/actions";
import StatusBadge from "./StatusBadge";

type Option = { value: string; label: string; note: string; sure?: string };

const HINT: Record<string, string> = {
  new: "Nobody has replied yet.",
  contacted: "You have been in touch. Waiting to hear from the guest.",
  confirmed: "Booked. The dates are blocked on the website.",
  completed: "Finished. This counts as a sale.",
  declined: "You said no. The dates stay free.",
  cancelled: "Cancelled after confirming. The dates are free again.",
};

const confirmIt: Option = {
  value: "confirmed",
  label: "Confirm booking",
  note: "Blocks these dates on the website.",
};
const replied: Option = {
  value: "contacted",
  label: "I have replied",
  note: "Just a note for you. Nothing changes for the guest.",
};
const decline: Option = {
  value: "declined",
  label: "Decline",
  note: "The dates stay free. The guest is not told automatically.",
  sure: "Decline this request?",
};
const reopen: Option = { value: "new", label: "Reopen", note: "Puts it back to New." };

const PLAN: Record<string, { main?: Option; others: Option[] }> = {
  new: { main: confirmIt, others: [replied, decline] },
  contacted: { main: confirmIt, others: [decline] },
  confirmed: {
    main: { value: "completed", label: "Mark as completed", note: "Use this once it is finished. It counts as a sale." },
    others: [
      {
        value: "cancelled",
        label: "Cancel booking",
        note: "Frees the dates on the website.",
        sure: "Cancel this booking and free its dates?",
      },
    ],
  },
  completed: { others: [reopen] },
  declined: { others: [reopen] },
  cancelled: { others: [reopen] },
};

const primary =
  "w-full bg-accent px-5 py-3 text-sm tracking-widest text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50";
const secondary =
  "w-full border border-accent px-5 py-3 text-sm tracking-widest transition-colors hover:bg-accent/15 disabled:opacity-50";

export default function NextStep({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateRequest, {});
  const plan = PLAN[status] ?? { others: [] };
  const options = [plan.main, ...plan.others].filter((o): o is Option => !!o);

  return (
    <section aria-label="What next" className="border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <StatusBadge status={status} />
        <p className="text-sm text-muted">{HINT[status]}</p>
      </div>

      <form action={action} className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <input type="hidden" name="id" value={id} />
        {options.map((o, i) => (
          <div key={o.value} className="flex flex-col gap-2">
            <button
              name="status"
              value={o.value}
              disabled={pending}
              onClick={(e) => {
                if (o.sure && !confirm(o.sure)) e.preventDefault();
              }}
              className={plan.main && i === 0 ? primary : secondary}
            >
              {o.label}
            </button>
            <p className="text-xs text-muted">{o.note}</p>
          </div>
        ))}
      </form>

      {state.error && (
        <p role="alert" className="mt-4 text-sm underline decoration-accent underline-offset-4">
          {state.error}
        </p>
      )}
      {state.ok && state.message && (
        <p role="status" className="mt-4 text-sm text-muted">
          {state.message}
        </p>
      )}
    </section>
  );
}
