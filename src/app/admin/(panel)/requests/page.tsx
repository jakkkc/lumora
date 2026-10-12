import type { Metadata } from "next";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Requests" };

const TABS = ["all", "new", "contacted", "confirmed", "declined", "cancelled", "completed"];

type Row = {
  id: string;
  reference: string;
  kind: "stay" | "ride";
  starts_on: string;
  ends_on: string;
  guests: number;
  full_name: string;
  status: string;
  created_at: string;
  property: { title: string } | null;
  vehicle: { title: string } | null;
};

const short = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: raw } = await searchParams;
  const status = TABS.includes(raw ?? "") ? (raw as string) : "all";

  const supabase = await supabaseServer();
  let q = supabase
    .from("booking_requests")
    .select(
      "id, reference, kind, starts_on, ends_on, guests, full_name, status, created_at, property:properties(title), vehicle:vehicles(title)"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (status !== "all") q = q.eq("status", status);
  const { data } = await q;
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl">requests</h1>
        <p className="mt-2 text-sm text-muted">Everything guests have sent, newest first.</p>
      </div>

      <nav aria-label="Filter by status" className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line pb-3 text-sm">
        {TABS.map((t) => (
          <Link
            key={t}
            href={t === "all" ? "/admin/requests" : `/admin/requests?status=${t}`}
            aria-current={t === status ? "page" : undefined}
            className={`nav-link capitalize tracking-wider ${t === status ? "" : "text-muted"}`}
          >
            {t}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">
          {status === "all" ? "No requests yet." : `No ${status} requests.`}
        </p>
      ) : (
        <div className="overflow-x-auto border-y border-line">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-3 pr-4 font-normal">Reference</th>
                <th className="py-3 pr-4 font-normal">Guest</th>
                <th className="py-3 pr-4 font-normal">For</th>
                <th className="py-3 pr-4 font-normal">Dates</th>
                <th className="py-3 pr-4 font-normal">Received</th>
                <th className="py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 pr-4 tracking-wider">
                    <Link
                      href={`/admin/requests/${r.id}`}
                      className="underline decoration-line underline-offset-4 hover:decoration-accent"
                    >
                      {r.reference}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">{r.full_name}</td>
                  <td className="py-3 pr-4">
                    {r.property?.title ?? r.vehicle?.title ?? "Removed listing"}
                    <span className="block text-xs text-muted">{r.kind === "stay" ? "Stay" : "Ride"}</span>
                  </td>
                  <td className="whitespace-nowrap py-3 pr-4">
                    {short(r.starts_on)} to {short(r.ends_on)}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-4 text-muted">
                    {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </td>
                  <td className="py-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
