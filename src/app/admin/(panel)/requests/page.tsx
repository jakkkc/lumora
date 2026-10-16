import type { Metadata } from "next";
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import RequestList, { type RequestRow } from "@/components/admin/RequestList";
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
  const rows = (data ?? []) as unknown as RequestRow[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl">requests</h1>
        <p className="mt-2 text-sm text-muted">Everything guests have sent, newest first.</p>
      </div>

      <div className="space-y-3">
        <nav aria-label="Filter by service" className="-mx-5 flex gap-x-6 overflow-x-auto whitespace-nowrap px-5 text-sm sm:mx-0 sm:flex-wrap sm:px-0">
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
        <nav aria-label="Filter by status" className="-mx-5 flex gap-x-6 overflow-x-auto whitespace-nowrap border-b border-line px-5 pb-3 text-sm sm:mx-0 sm:flex-wrap sm:px-0">
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
        <RequestList rows={rows} />
      )}
    </div>
  );
}
