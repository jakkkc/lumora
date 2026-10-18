import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import { money } from "@/lib/format";
import { dmy, type Kind, type Sale, type Txn } from "@/lib/accounts";

const KIND_ICON: Record<Kind, IconName> = { stay: "home", ride: "car", tour: "compass" };
const METHOD: Record<string, string> = {
  mpesa: "M-Pesa",
  cash: "Cash",
  bank: "Bank transfer",
  card: "Card",
  other: "Other",
};

const cardClass =
  "block border border-line p-4 transition-colors hover:border-accent active:bg-accent/10";

export function SalesList({ sales }: { sales: Sale[] }) {
  return (
    <>
      <ul className="space-y-3 md:hidden">
        {sales.map((s) => (
          <li key={s.id}>
            <Link href={`/admin/requests/${s.id}`} className={cardClass}>
              <div className="flex items-start justify-between gap-3">
                <p className="tracking-widest">{s.reference}</p>
                <p className="text-base">{money(s.total, "KES")}</p>
              </div>
              <p className="mt-2 text-base">{s.guest}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                <Icon name={KIND_ICON[s.kind]} size={15} />
                <span className="min-w-0 truncate">{s.title}</span>
              </p>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 text-xs text-muted">
                <span>
                  Completed {dmy(s.completedOn)}, paid {money(s.paid, "KES")}
                  {s.balance > 0.5 ? `, owes ${money(s.balance, "KES")}` : ""}
                </span>
                <Icon name="next" size={16} />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto border-y border-line md:block">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-3 pr-4 font-normal">Completed</th>
              <th className="py-3 pr-4 font-normal">Request</th>
              <th className="py-3 pr-4 font-normal">For</th>
              <th className="py-3 pr-4 text-right font-normal">Price</th>
              <th className="py-3 pr-4 text-right font-normal">Paid</th>
              <th className="py-3 text-right font-normal">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sales.map((s) => (
              <tr key={s.id}>
                <td className="whitespace-nowrap py-3 pr-4 text-muted">{dmy(s.completedOn)}</td>
                <td className="py-3 pr-4">
                  <Link href={`/admin/requests/${s.id}`} className="tracking-wider underline decoration-line underline-offset-4 hover:decoration-accent">
                    {s.reference}
                  </Link>
                  <span className="block text-xs text-muted">{s.guest}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center gap-2">
                    <Icon name={KIND_ICON[s.kind]} size={15} />
                    {s.title}
                  </span>
                  <span className="block text-xs text-muted">{s.location}</span>
                </td>
                <td className="whitespace-nowrap py-3 pr-4 text-right">
                  {money(s.total, "KES")}
                  {s.estimated && <span className="block text-xs text-muted">estimate</span>}
                </td>
                <td className="whitespace-nowrap py-3 pr-4 text-right">{money(s.paid, "KES")}</td>
                <td className="whitespace-nowrap py-3 text-right">{s.balance > 0.5 ? money(s.balance, "KES") : "Settled"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function TransactionsList({ txns }: { txns: Txn[] }) {
  const amount = (t: Txn) => (t.kind === "refund" ? `-${money(t.amount, "KES")}` : money(t.amount, "KES"));
  const href = (t: Txn) => (t.requestId ? `/admin/requests/${t.requestId}` : "/admin/requests");

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {txns.map((t) => (
          <li key={t.id}>
            <Link href={href(t)} className={cardClass}>
              <div className="flex items-start justify-between gap-3">
                <p>
                  {t.kind === "refund" ? "Refund" : "Payment"}
                  <span className="text-muted">, {METHOD[t.method] ?? t.method}</span>
                </p>
                <p className="text-base">{amount(t)}</p>
              </div>
              <p className="mt-2 text-sm">
                <span className="tracking-widest">{t.requestRef}</span>
                {t.guest ? <span className="text-muted">, {t.guest}</span> : null}
              </p>
              {t.title && (
                <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                  {t.reqKind && <Icon name={KIND_ICON[t.reqKind]} size={15} />}
                  <span className="min-w-0 truncate">{t.title}</span>
                </p>
              )}
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 text-xs text-muted">
                <span>
                  {dmy(t.paidOn)}
                  {t.reference ? `, ${t.reference}` : ""}
                </span>
                <Icon name="next" size={16} />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto border-y border-line md:block">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-3 pr-4 font-normal">Date</th>
              <th className="py-3 pr-4 font-normal">Request</th>
              <th className="py-3 pr-4 font-normal">Type</th>
              <th className="py-3 pr-4 font-normal">How</th>
              <th className="py-3 pr-4 font-normal">Reference</th>
              <th className="py-3 text-right font-normal">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {txns.map((t) => (
              <tr key={t.id}>
                <td className="whitespace-nowrap py-3 pr-4 text-muted">{dmy(t.paidOn)}</td>
                <td className="py-3 pr-4">
                  <Link href={href(t)} className="tracking-wider underline decoration-line underline-offset-4 hover:decoration-accent">
                    {t.requestRef}
                  </Link>
                  <span className="block text-xs text-muted">{t.guest}</span>
                </td>
                <td className="py-3 pr-4">{t.kind === "refund" ? "Refund" : "Payment"}</td>
                <td className="py-3 pr-4">{METHOD[t.method] ?? t.method}</td>
                <td className="py-3 pr-4 text-muted">{t.reference ?? ""}</td>
                <td className="whitespace-nowrap py-3 text-right">{amount(t)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
