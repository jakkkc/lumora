import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import { Mark } from "@/components/Logo";
import RequestList, { type RequestRow } from "@/components/admin/RequestList";
import { todayNairobi } from "@/lib/accounts";
import { addDays } from "@/lib/dates";
import { money } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";

type Pay = { kind: "payment" | "refund"; amount: number | string };
type Open = { final_total: number | string | null; estimate_total: number | string | null; payments: Pay[] | null };

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function Item({
  href,
  icon,
  title,
  note,
  strong,
}: {
  href: string;
  icon: IconName;
  title: string;
  note: string;
  strong?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 border p-4 transition-colors hover:border-accent active:bg-accent/10 ${
        strong ? "border-accent bg-accent/10" : "border-line"
      }`}
    >
      <Icon name={icon} size={22} className="shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-base">{title}</span>
        <span className="block text-xs text-muted">{note}</span>
      </span>
      <Icon name="next" size={16} className="shrink-0 text-muted" />
    </Link>
  );
}

export default async function Dashboard() {
  const supabase = await supabaseServer();
  const today = todayNairobi();
  const tomorrow = addDays(today, 1);
  const waitingBefore = new Date(Date.now() - 3 * 3600 * 1000).toISOString();

  const head = (table: string) => supabase.from(table).select("*", { count: "exact", head: true });

  const [
    nNew,
    nWaiting,
    nStartToday,
    nEndToday,
    nTomorrow,
    nFinished,
    openRes,
    staysPub,
    staysDraft,
    ridesPub,
    ridesDraft,
    toursPub,
    toursDraft,
    latest,
  ] = await Promise.all([
    head("booking_requests").eq("status", "new"),
    head("booking_requests").eq("status", "new").lte("created_at", waitingBefore),
    head("booking_requests").eq("status", "confirmed").eq("starts_on", today),
    head("booking_requests").eq("status", "confirmed").eq("ends_on", today),
    head("booking_requests").eq("status", "confirmed").eq("starts_on", tomorrow),
    head("booking_requests").eq("status", "confirmed").lt("ends_on", today),
    supabase
      .from("booking_requests")
      .select("final_total, estimate_total, payments(kind, amount)")
      .in("status", ["confirmed", "completed"])
      .limit(2000),
    head("properties").eq("status", "published"),
    head("properties").eq("status", "draft"),
    head("vehicles").eq("status", "published"),
    head("vehicles").eq("status", "draft"),
    head("tours").eq("status", "published"),
    head("tours").eq("status", "draft"),
    supabase
      .from("booking_requests")
      .select(
        "id, reference, kind, starts_on, ends_on, full_name, status, created_at, drive_type, property:properties(title), vehicle:vehicles(title), tour:tours(title)"
      )
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const n = (r: { count: number | null }) => r.count ?? 0;
  const newCount = n(nNew);
  const waiting = n(nWaiting);
  const startToday = n(nStartToday);
  const endToday = n(nEndToday);
  const tomorrowCount = n(nTomorrow);
  const finished = n(nFinished);

  let owedTotal = 0;
  let owedCount = 0;
  for (const o of (openRes.data ?? []) as unknown as Open[]) {
    const paid = (o.payments ?? []).reduce(
      (sum, p) => sum + (p.kind === "refund" ? -Number(p.amount) : Number(p.amount)),
      0
    );
    const due = Number(o.final_total ?? o.estimate_total ?? 0) - paid;
    if (due > 0.5) {
      owedTotal += due;
      owedCount += 1;
    }
  }

  const todayParts = [
    startToday > 0 ? `${startToday} starting` : "",
    endToday > 0 ? `${endToday} ending` : "",
  ].filter(Boolean);

  const rows = (latest.data ?? []) as unknown as RequestRow[];
  const needs =
    newCount > 0 || todayParts.length > 0 || tomorrowCount > 0 || finished > 0 || owedCount > 0;

  const stats: { label: string; value: number; note: string; icon: IconName; href: string }[] = [
    { label: "Stays", value: n(staysPub), note: `${n(staysDraft)} in draft`, icon: "home", href: "/admin/stays" },
    { label: "Rides", value: n(ridesPub), note: `${n(ridesDraft)} in draft`, icon: "car", href: "/admin/rides" },
    { label: "Tours", value: n(toursPub), note: `${n(toursDraft)} in draft`, icon: "compass", href: "/admin/tours" },
  ];

  const dateLine = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Africa/Nairobi",
  });

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl">dashboard</h1>
        <p className="mt-2 text-sm text-muted">{dateLine}</p>
      </div>

      <section aria-labelledby="needs" className="space-y-3">
        <h2 id="needs" className="text-xl">needs you</h2>
        {needs ? (
          <div className="space-y-3">
            {newCount > 0 && (
              <Item
                strong
                href="/admin/requests?status=new"
                icon="inbox"
                title={`${plural(newCount, "new request", "new requests")}`}
                note={waiting > 0 ? `${waiting} waiting over 3 hours` : "Nobody has replied yet."}
              />
            )}
            {todayParts.length > 0 && (
              <Item
                href="/admin/requests?status=confirmed"
                icon="dashboard"
                title={`${todayParts.join(", ")} today`}
                note="Your confirmed bookings."
              />
            )}
            {tomorrowCount > 0 && (
              <Item
                href="/admin/requests?status=confirmed"
                icon="compass"
                title={`${tomorrowCount} starting tomorrow`}
                note="Good time to message the guests."
              />
            )}
            {finished > 0 && (
              <Item
                href="/admin/requests?status=confirmed"
                icon="check"
                title={`${plural(finished, "booking", "bookings")} finished, not marked completed`}
                note="Mark them completed so they count as sales."
              />
            )}
            {owedCount > 0 && (
              <Item
                href="/admin/accounts"
                icon="wallet"
                title={`${plural(owedCount, "balance", "balances")} still owed`}
                note={`${money(Math.round(owedTotal), "KES")} in total.`}
              />
            )}
          </div>
        ) : (
          <div className="border border-line p-8 text-center">
            <Mark className="mx-auto h-12 w-12 text-accent opacity-60" title="" />
            <p className="mt-4 font-serif text-xl italic">All caught up.</p>
            <p className="mt-1 text-sm text-muted">Nothing needs you right now.</p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map((c) => (
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
