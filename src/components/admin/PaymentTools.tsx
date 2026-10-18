"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import Icon from "@/components/Icon";
import ThemedSelect from "@/components/ThemedSelect";
import { addPayment, deletePayment, type PayState } from "@/app/admin/(panel)/requests/payment-actions";

const box = "w-full border border-line bg-transparent px-3 py-2.5 text-sm focus:border-accent focus:outline-none";
const lab = "mb-1.5 block text-xs tracking-widest text-muted";

const METHODS: [string, string][] = [
  ["mpesa", "M-Pesa"],
  ["cash", "Cash"],
  ["bank", "Bank transfer"],
  ["card", "Card"],
  ["other", "Other"],
];

export function PaymentForm({ requestId, today, balance }: { requestId: string; today: string; balance: number }) {
  const uid = useId();
  const [state, action, pending] = useActionState<PayState, FormData>(addPayment, {});
  const [kind, setKind] = useState<"payment" | "refund">("payment");
  const [amount, setAmount] = useState("");
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      setAmount("");
      setKind("payment");
    }
  }, [state]);

  const seg = (on: boolean) =>
    `px-4 py-2 text-sm transition-colors ${on ? "bg-accent text-on-accent" : "text-muted hover:text-fg"}`;

  return (
    <form ref={ref} action={action} className="space-y-4">
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="kind" value={kind} />

      <div role="group" aria-label="Type" className="inline-flex border border-line">
        <button type="button" aria-pressed={kind === "payment"} onClick={() => setKind("payment")} className={seg(kind === "payment")}>
          Payment received
        </button>
        <button type="button" aria-pressed={kind === "refund"} onClick={() => setKind("refund")} className={seg(kind === "refund")}>
          Refund given
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-a`} className={lab}>Amount (KES)</label>
          <input
            id={`${uid}-a`} name="amount" type="number" min={1} step="1" required inputMode="decimal"
            value={amount} onChange={(e) => setAmount(e.target.value)} className={box}
          />
          {kind === "payment" && balance > 0 && (
            <button
              type="button"
              onClick={() => setAmount(String(balance))}
              className="mt-1.5 text-xs text-muted underline decoration-line underline-offset-4 hover:decoration-accent"
            >
              Use the balance
            </button>
          )}
        </div>
        <div>
          <label htmlFor={`${uid}-d`} className={lab}>Date</label>
          <input id={`${uid}-d`} name="paid_on" type="date" required defaultValue={today} className={box} />
        </div>
        <div>
          <label htmlFor={`${uid}-m`} className={lab}>How</label>
          <ThemedSelect id={`${uid}-m`} name="method" defaultValue="mpesa" options={METHODS} className={box} />
        </div>
        <div>
          <label htmlFor={`${uid}-r`} className={lab}>Reference (M-Pesa code)</label>
          <input id={`${uid}-r`} name="reference" type="text" maxLength={80} className={box} placeholder="QJK1234ABC" />
        </div>
      </div>

      <div>
        <label htmlFor={`${uid}-n`} className={lab}>Note (optional)</label>
        <input id={`${uid}-n`} name="note" type="text" maxLength={300} className={box} placeholder="Deposit, balance, damage refund..." />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          disabled={pending}
          className="bg-accent px-6 py-3 text-sm tracking-widest text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving..." : kind === "refund" ? "Record refund" : "Record payment"}
        </button>
        {state.error && (
          <p role="alert" className="text-sm underline decoration-accent underline-offset-4">{state.error}</p>
        )}
        {state.ok && (
          <p role="status" className="inline-flex items-center gap-1.5 text-sm text-muted">
            <Icon name="check" size={14} /> Saved
          </p>
        )}
      </div>
    </form>
  );
}

export function DeletePayment({ id, requestId }: { id: string; requestId: string }) {
  const [state, run, pending] = useActionState<PayState, FormData>(deletePayment, {});
  return (
    <form
      action={run}
      onSubmit={(e) => {
        if (!confirm("Remove this entry? This cannot be undone.")) e.preventDefault();
      }}
      className="flex items-center gap-3"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="request_id" value={requestId} />
      <button
        disabled={pending}
        aria-label="Remove this entry"
        className="grid h-9 w-9 place-items-center border border-line text-muted transition-colors hover:border-accent hover:text-fg disabled:opacity-50"
      >
        <Icon name="trash" size={15} />
      </button>
      {state.error && <p role="alert" className="text-xs underline decoration-accent underline-offset-4">{state.error}</p>}
    </form>
  );
}
