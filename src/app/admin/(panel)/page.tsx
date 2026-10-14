import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import { supabaseServer } from "@/lib/supabase/server";

type Row = {
  id: string;
  reference: string;
  kind: "stay" | "ride" | "tour";
  starts_on: string;
  ends_on: string;
  full_name: string;
  status: string;
  created_at: string;
  property: { title: string } | null;
  vehicle: { title: string } | null;
  tour: { title: string } | null;
};

const KIND_ICON: Record<string, IconName> = { stay: "home", ride: "car", tour: "compass" };

const when = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

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
        "id, reference, kind, starts_on, ends_on, full_name, status, created_at, property:properties(title), vehicle:vehicles(title), tour:tours(title)"
      )
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const rows = (latest.data ?? []) as unknown as Row[];

  const cards: { label: string; value: number; note: string; icon: IconName; href: string }[] = [
    { label: "New requests", value: newReq, note: `${allReq} in total`, icon: "inbox", href: "/admin/requests?status=new" },
    { label: "Published stays", value: staysPub, note: `${staysDraft} in draft`, icon: "home", href: "/admin/stays" },
    { label: "Published rides", value: ridesPub, note: `${ridesDraft} in draft`, icon: "car", href: "/admin/rides" },
    { label: "Published tours", value: toursPub, note: `${toursDraft} in draft`, icon: "compass", href: "/admin/tours" },
  ];

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl">dashboard</h1>
        <p className="mt-2 text-sm text-muted">What needs your attention today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="block border border-line p-6 transition-colors hover:border-accent">
            <p className="flex items-center gap-2 text-sm text-muted">
              <Icon name={c.icon} size={16} />
              {c.label}
            </p>
            <p className="mt-2 text-4xl">{c.value}</p>
            <p className="mt-1 text-xs text-muted">{c.note}</p>
          </Link>
        ))}
      </div>

      <section aria-labelledby="latest">
        <h2 id="latest" className="mb-4 text-xl">latest requests</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-muted">No requests yet. They appear here as soon as a guest sends one.</p>
        ) : (
          <div className="overflow-x-auto border-y border-line">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-3 pr-4 font-normal">Reference</th>
                  <th className="py-3 pr-4 font-normal">Guest</th>
                  <th className="py-3 pr-4 font-normal">For</th>
                  <th className="py-3 pr-4 font-normal">Dates</th>
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
                      <span className="inline-flex items-center gap-2">
                        <Icon name={KIND_ICON[r.kind]} size={15} />
                        {r.property?.title ?? r.vehicle?.title ?? r.tour?.title ?? "Removed listing"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4">
                      {r.starts_on === r.ends_on ? when(r.starts_on) : `${when(r.starts_on)} to ${when(r.ends_on)}`}
                    </td>
                    <td className="py-3 capitalize">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
