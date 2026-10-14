import type { Metadata } from "next";
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import StatusBadge from "@/components/admin/StatusBadge";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Requests" };

const STATUS_TABS = ["all", "new", "contacted", "confirmed", "declined", "cancelled", "completed"];
const KIND_TABS: [string, string][] = [
  ["all", "All services"],
  ["stay", "Stays"],
  ["ride", "Rides"],
  ["tour", "Tours"],
];
const KIND_ICON: Record<string, IconName> = { stay: "home", ride: "car", tour: "compass" };
const KIND_NAME: Record<string, string> = { stay: "Stay", ride: "Ride", tour: "Tour" };

type Row = {
  id: string;
  reference: string;
  kind: "stay" | "ride" | "tour";
  starts_on: string;
  ends_on: string;
  full_name: string;
  status: string;
  created_at: string;
  drive_type: "self_drive" | "chauffeured" | null;
  property: { title: string } | null;
  vehicle: { title: string } | null;
  tour: { title: string } | null;
};

const short = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function href(status: string, kind: string) {
  const p = new URLSearchParams();
  if (status !== "all") p.set("status", status);
  if (kind !== "all") p.set("kind", kind);
  const q = p.toString();
  return q ? `/admin/requests?${q}` : "/admin/requests";
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kind?: string }>;
}) {
  const { status: rawStatus, kind: rawKind } = await searchParams;
  const status = STATUS_TABS.includes(rawStatus ?? "") ? (rawStatus as string) : "all";
  const kind = KIND_TABS.some(([k]) => k === rawKind) ? (rawKind as string) : "all";

  const supabase = await supabaseServer();
  let q = supabase
    .from("booking_requests")
    .select(
      "id, reference, kind, starts_on, ends_on, full_name, status, created_at, drive_type, property:properties(title), vehicle:vehicles(title), tour:tours(title)"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (status !== "all") q = q.eq("status", status);
  if (kind !== "all") q = q.eq("kind", kind);
  const { data } = await q;
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl">requests</h1>
        <p className="mt-2 text-sm text-muted">Everything guests have sent, newest first.</p>
      </div>

      <div className="space-y-3">
        <nav aria-label="Filter by service" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {KIND_TABS.map(([k, label]) => (
            <Link
              key={k}
              href={href(status, k)}
              aria-current={k === kind ? "page" : undefined}
              className={`nav-link inline-flex items-center gap-2 tracking-wider ${k === kind ? "" : "text-muted"}`}
            >
              {k !== "all" && <Icon name={KIND_ICON[k]} size={15} />}
              {label}
            </Link>
          ))}
        </nav>
        <nav aria-label="Filter by status" className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line pb-3 text-sm">
          {STATUS_TABS.map((t) => (
            <Link
              key={t}
              href={href(t, kind)}
              aria-current={t === status ? "page" : undefined}
              className={`nav-link capitalize tracking-wider ${t === status ? "" : "text-muted"}`}
            >
              {t}
            </Link>
          ))}
        </nav>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">No requests match these filters.</p>
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
                    {r.property?.title ?? r.vehicle?.title ?? r.tour?.title ?? "Removed listing"}
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                      <Icon name={KIND_ICON[r.kind]} size={13} />
                      {KIND_NAME[r.kind]}
                      {r.drive_type === "chauffeured" ? ", chauffeured" : ""}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-3 pr-4">
                    {r.starts_on === r.ends_on ? short(r.starts_on) : `${short(r.starts_on)} to ${short(r.ends_on)}`}
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
