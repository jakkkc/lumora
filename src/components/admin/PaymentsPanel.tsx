import { longDate, money } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";
import { DeletePayment, PaymentForm } from "./PaymentTools";

const METHOD: Record<string, string> = {
  mpesa: "M-Pesa",
  cash: "Cash",
  bank: "Bank transfer",
  card: "Card",
  other: "Other",
};

type RawEntry = {
  id: string;
  kind: "payment" | "refund";
  amount: number | string;
  method: string;
  reference: string | null;
  paid_on: string;
  note: string | null;
};

type Entry = Omit<RawEntry, "amount"> & { amount: number };

export default async function PaymentsPanel({ requestId }: { requestId: string }) {
  const sb = await supabaseServer();
  const [{ data: req }, { data: rows }] = await Promise.all([
    sb.from("booking_requests").select("final_total, estimate_total").eq("id", requestId).maybeSingle(),
    sb
      .from("payments")
      .select("id, kind, amount, method, reference, paid_on, note")
      .eq("request_id", requestId)
      .order("paid_on")
      .order("created_at"),
  ]);

  const entries: Entry[] = ((rows ?? []) as RawEntry[]).map((e) => ({ ...e, amount: Number(e.amount) }));
  const agreed = req?.final_total != null;
  const total = Number(req?.final_total ?? req?.estimate_total ?? 0);
  const received = entries.filter((e) => e.kind === "payment").reduce((n, e) => n + e.amount, 0);
  const refunded = entries.filter((e) => e.kind === "refund").reduce((n, e) => n + e.amount, 0);
  const net = received - refunded;
  const balance = Math.round((total - net) * 100) / 100;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });

  return (
    <section aria-labelledby="payments">
      <h2 id="payments" className="mb-3 text-xl">payments</h2>

      <dl className="divide-y divide-line border-y border-line text-sm">
        <div className="flex justify-between gap-6 py-3">
          <dt className="text-muted">{agreed ? "Price agreed" : "Estimate, no final price yet"}</dt>
          <dd>{money(total, "KES")}</dd>
        </div>
        <div className="flex justify-between gap-6 py-3">
          <dt className="text-muted">Paid so far</dt>
          <dd>{money(net, "KES")}</dd>
        </div>
        <div className="flex justify-between gap-6 py-3">
          <dt className="text-muted">{balance < 0 ? "Overpaid by" : "Balance"}</dt>
          <dd className="text-base">{money(Math.abs(balance), "KES")}</dd>
        </div>
      </dl>
      {!agreed && (
        <p className="mt-2 text-xs text-muted">Enter the final price in &quot;what next&quot; so the balance is exact.</p>
      )}

      {entries.length > 0 && (
        <ul className="mt-5 divide-y divide-line border-y border-line">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div className="min-w-0">
                <p>
                  {e.kind === "refund" ? "Refund" : "Payment"}, {METHOD[e.method] ?? e.method}
                  {e.reference ? `, ${e.reference}` : ""}
                </p>
                <p className="text-xs text-muted">
                  {longDate(e.paid_on)}
                  {e.note ? `, ${e.note}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span>{e.kind === "refund" ? `-${money(e.amount, "KES")}` : money(e.amount, "KES")}</span>
                <DeletePayment id={e.id} requestId={requestId} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <PaymentForm requestId={requestId} today={today} balance={balance > 0 ? balance : 0} />
      </div>
    </section>
  );
}
