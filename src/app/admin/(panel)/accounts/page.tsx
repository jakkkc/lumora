import type { Metadata } from "next";
import Link from "next/link";
import DateFilter from "@/components/admin/DateFilter";
import { SalesList, TransactionsList } from "@/components/admin/AccountsLists";
import { money } from "@/lib/format";
import { loadAccounts, rangeLabel, rangeQuery, resolveRange, type Group } from "@/lib/accounts";

export const metadata: Metadata = { title: "Accounts" };

function Breakdown({ title, rows }: { title: string; rows: Group[] }) {
  const max = Math.max(...rows.map((r) => r.total), 1);
  return (
    <section aria-label={title}>
      <h2 className="mb-3 text-xl">{title}</h2>
      {rows.every((r) => r.count === 0) ? (
        <p className="text-sm text-muted">No sales in this period.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {rows.map((r) => (
            <li key={r.name} className="py-3 text-sm">
              <div className="flex justify-between gap-4">
                <span>
                  {r.name}
                  <span className="text-muted">, {r.count} {r.count === 1 ? "booking" : "bookings"}</span>
                </span>
                <span>{money(r.total, "KES")}</span>
              </div>
              <div className="mt-2 h-1 bg-line">
                <div className="h-1 bg-accent" style={{ width: `${(r.total / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string; view?: string }>;
}) {
  const sp = await searchParams;
  const range = resolveRange(sp);
  const view = sp.view === "transactions" ? "transactions" : "sales";
  const a = await loadAccounts(range);
  const base = rangeQuery(range);

  const cards = [
    { label: "Sales", value: a.salesTotal, note: `${a.sales.length} completed ${a.sales.length === 1 ? "booking" : "bookings"}` },
    { label: "Money received", value: a.received, note: `${a.receivedCount} ${a.receivedCount === 1 ? "payment" : "payments"}` },
    { label: "Refunds", value: a.refunded, note: "Given back to guests" },
    { label: "Net received", value: a.net, note: "Received minus refunds" },
  ];

  const tab = (on: boolean) =>
    `nav-link tracking-wider ${on ? "" : "text-muted"}`;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl">accounts</h1>
        <p className="mt-2 text-sm text-muted">{rangeLabel(range)}</p>
      </div>

      <DateFilter range={range} view={view} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="border border-line p-4 sm:p-6">
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-2 text-xl sm:text-2xl">{money(c.value, "KES")}</p>
            <p className="mt-1 text-xs text-muted">{c.note}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2 text-sm text-muted">
        <p>
          Still owed on confirmed and completed bookings, today: {money(a.outstandingTotal, "KES")} across{" "}
          {a.outstandingCount} {a.outstandingCount === 1 ? "booking" : "bookings"}.
        </p>
        {a.estimatedCount > 0 && (
          <p>
            {a.estimatedCount} of these {a.estimatedCount === 1 ? "sale uses" : "sales use"} the estimate because no
            final price was entered.
          </p>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <Breakdown title="by service" rows={a.byService} />
        <Breakdown title="by location" rows={a.byLocation} />
      </div>

      <section aria-label="Records" className="space-y-6">
        <nav aria-label="Records" className="flex gap-x-8 border-b border-line pb-3 text-sm">
          <Link href={`/admin/accounts?${base}&view=sales`} aria-current={view === "sales" ? "page" : undefined} className={tab(view === "sales")}>
            Sales ({a.sales.length})
          </Link>
          <Link href={`/admin/accounts?${base}&view=transactions`} aria-current={view === "transactions" ? "page" : undefined} className={tab(view === "transactions")}>
            Transactions ({a.txns.length})
          </Link>
        </nav>

        {view === "sales" ? (
          a.sales.length === 0 ? (
            <p className="text-sm text-muted">No bookings were completed in this period.</p>
          ) : (
            <SalesList sales={a.sales} />
          )
        ) : a.txns.length === 0 ? (
          <p className="text-sm text-muted">No payments or refunds were recorded in this period.</p>
        ) : (
          <TransactionsList txns={a.txns} />
        )}
      </section>
    </div>
  );
}
