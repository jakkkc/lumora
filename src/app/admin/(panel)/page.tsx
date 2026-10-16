import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import RequestList, { type RequestRow } from "@/components/admin/RequestList";
import { supabaseServer } from "@/lib/supabase/server";

export default async function Dashboard() {
  const supabase = await supabaseServer();

  const count = async (table: string, col?: string, val?: string) => {
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (col && val) q = q.eq(col, val);
    const { count: n } = await q;
    return n ?? 0;
  };

  const [newReq, allReq, staysPub, staysDraft, ridesPub, ridesDraft, toursPub, toursDraft, latest] = await Promise.all([
    count("booking_requests", "status", "new"),
    count("booking_requests"),
    count("properties", "status", "published"),
    count("properties", "status", "draft"),
    count("vehicles", "status", "published"),
    count("vehicles", "status", "draft"),
    count("tours", "status", "published"),
    count("tours", "status", "draft"),
    supabase
      .from("booking_requests")
      .select(
        "id, reference, kind, starts_on, ends_on, full_name, status, created_at, drive_type, property:properties(title), vehicle:vehicles(title), tour:tours(title)"
      )
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const rows = (latest.data ?? []) as unknown as RequestRow[];

  const cards: { label: string; value: number; note: string; icon: IconName; href: string }[] = [
    { label: "New requests", value: newReq, note: `${allReq} in total`, icon: "inbox", href: "/admin/requests?status=new" },
    { label: "Stays", value: staysPub, note: `${staysDraft} in draft`, icon: "home", href: "/admin/stays" },
    { label: "Rides", value: ridesPub, note: `${ridesDraft} in draft`, icon: "car", href: "/admin/rides" },
    { label: "Tours", value: toursPub, note: `${toursDraft} in draft`, icon: "compass", href: "/admin/tours" },
  ];

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl">dashboard</h1>
        <p className="mt-2 text-sm text-muted">What needs your attention today.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="block border border-line p-4 transition-colors hover:border-accent sm:p-6">
            <p className="flex items-center gap-2 text-sm text-muted">
              <Icon name={c.icon} size={16} />
              {c.label}
            </p>
            <p className="mt-2 text-3xl sm:text-4xl">{c.value}</p>
            <p className="mt-1 text-xs text-muted">{c.note}</p>
          </Link>
        ))}
      </div>

      <section aria-labelledby="latest">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="latest" className="text-xl">latest requests</h2>
          <Link href="/admin/requests" className="nav-link text-xs tracking-widest">See all</Link>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-muted">No requests yet. They appear here as soon as a guest sends one.</p>
        ) : (
          <RequestList rows={rows} showReceived={false} />
        )}
      </section>
    </div>
  );
}
