import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
import RequestActions from "@/components/admin/RequestActions";
import StatusBadge from "@/components/admin/StatusBadge";
import PaymentsPanel from "@/components/admin/PaymentsPanel";
import { waNumber } from "@/lib/contact";
import { daysBetween, longDate, money } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Request" };

type Mode = "none" | "point" | "custom";
type Point = { name: string; kind: string } | null;

type Req = {
  id: string;
  reference: string;
  kind: "stay" | "ride" | "tour";
  starts_on: string;
  ends_on: string;
  guests: number;
  pickup_location: string | null;
  with_driver: boolean;
  drive_type: "self_drive" | "chauffeured" | null;
  full_name: string;
  email: string;
  phone: string;
  message: string | null;
  status: string;
  internal_notes: string | null;
  created_at: string;
  accepted_policies_at: string | null;
  final_total: number | null;
  pickup_mode: Mode;
  pickup_address: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  pickup_time: string | null;
  pickup_flight: string | null;
  pickup_fee: number | null;
  dropoff_mode: Mode;
  dropoff_address: string | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  dropoff_time: string | null;
  dropoff_flight: string | null;
  dropoff_fee: number | null;
  property: { title: string; slug: string; price_per_night: number; currency: string } | null;
  vehicle: {
    title: string;
    slug: string;
    price_per_day: number | null;
    chauffeur_price_per_day: number | null;
    driver_fee_per_day: number;
    currency: string;
  } | null;
  tour: { title: string; slug: string; price: number; price_basis: string; currency: string } | null;
  pickup_point: Point;
  dropoff_point: Point;
};

const KIND_ICON: Record<string, IconName> = { stay: "home", ride: "car", tour: "compass" };
const link = "underline decoration-line underline-offset-4 hover:decoration-accent";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function baseEstimate(r: Req): { amount: number; note: string; currency: string } | null {
  const span = daysBetween(r.starts_on, r.ends_on);
  if (r.kind === "stay" && r.property) {
    const n = Math.max(span, 1);
    return { amount: n * r.property.price_per_night, note: `${n} night${n === 1 ? "" : "s"}`, currency: r.property.currency };
  }
  if (r.kind === "ride" && r.vehicle) {
    const v = r.vehicle;
    const days = span + 1;
    const chauffeured = r.drive_type === "chauffeured" || (r.drive_type === null && r.with_driver);
    const rate = chauffeured
      ? (v.chauffeur_price_per_day ?? (v.price_per_day ?? 0) + v.driver_fee_per_day)
      : (v.price_per_day ?? 0);
    return {
      amount: days * rate,
      note: `${days} day${days === 1 ? "" : "s"}, ${chauffeured ? "chauffeured" : "self-drive"}`,
      currency: v.currency,
    };
  }
  if (r.kind === "tour" && r.tour) {
    const t = r.tour;
    if (t.price_basis === "per_person") {
      return { amount: r.guests * t.price, note: `${r.guests} ${r.guests === 1 ? "person" : "people"}`, currency: t.currency };
    }
    if (t.price_basis === "per_day") {
      const days = span + 1;
      return { amount: days * t.price, note: `${days} day${days === 1 ? "" : "s"}`, currency: t.currency };
    }
    return { amount: t.price, note: "per group", currency: t.currency };
  }
  return null;
}

function Transfer({
  title,
  mode,
  point,
  address,
  lat,
  lng,
  time,
  flight,
  fee,
  currency,
}: {
  title: string;
  mode: Mode;
  point: Point;
  address: string | null;
  lat: number | null;
  lng: number | null;
  time: string | null;
  flight: string | null;
  fee: number | null;
  currency: string;
}) {
  const hasPin = lat !== null && lng !== null;
  return (
    <section aria-label={title}>
      <h2 className="mb-3 text-xl">{title}</h2>
      {mode === "none" ? (
        <p className="text-sm text-muted">Not requested.</p>
      ) : (
        <>
          <dl className="divide-y divide-line border-y border-line text-sm">
            {mode === "point" && (
              <Row label={point?.kind === "sgr" ? "Train station" : "Meeting point"}>{point?.name ?? "Removed point"}</Row>
            )}
            {mode === "custom" && <Row label="Place">{address ?? "Map pin"}</Row>}
            {time && <Row label="Time">{time.slice(0, 5)}</Row>}
            {flight && <Row label={mode === "point" ? "Flight or train number" : "Details"}>{flight}</Row>}
            <Row label="Fee">{fee !== null ? money(fee, currency) : "Not set yet"}</Row>
          </dl>
          {mode === "custom" && hasPin && (
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <a
                className={`${link} inline-flex items-center gap-2`}
                href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="pin" size={15} /> Open in OpenStreetMap
              </a>
              <a
                className={`${link} inline-flex items-center gap-2`}
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="pin" size={15} /> Open in Google Maps
              </a>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default async function RequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("booking_requests")
    .select(
      "*, property:properties(title, slug, price_per_night, currency), vehicle:vehicles(title, slug, price_per_day, chauffeur_price_per_day, driver_fee_per_day, currency), tour:tours(title, slug, price, price_basis, currency), pickup_point:transfer_points!pickup_point_id(name, kind), dropoff_point:transfer_points!dropoff_point_id(name, kind)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const r = data as unknown as Req;

  const title = r.property?.title ?? r.vehicle?.title ?? r.tour?.title ?? "a removed listing";
  const currency = r.property?.currency ?? r.vehicle?.currency ?? r.tour?.currency ?? "KES";
  const isStay = r.kind === "stay";
  const isRide = r.kind === "ride";

  const base = baseEstimate(r);
  const fees = (r.pickup_fee ?? 0) + (r.dropoff_fee ?? 0);
  const estimate = base ? base.amount + fees : null;

  const wa = waNumber(r.phone);
  const first = r.full_name.split(" ")[0];
  const hello =
    `Hello ${first}, this is Lumora about your request ${r.reference} for ${title}.` +
    (r.final_total !== null ? ` The total for your booking is ${money(r.final_total, currency)}.` : "");

  const publicHref = r.property ? `/stays/${r.property.slug}` : r.vehicle ? `/rides/${r.vehicle.slug}` : null;
  const showTransfers = isStay || isRide || r.pickup_mode !== "none" || r.dropoff_mode !== "none";
  const pickupTitle = isRide ? "Car delivery" : "Pickup on arrival";
  const dropoffTitle = isRide ? "Car collection" : "Drop off on departure";

  const chauffeured = r.drive_type === "chauffeured" || (r.drive_type === null && r.with_driver);

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin/requests" className="nav-link text-sm tracking-widest">All requests</Link>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <h1 className="text-3xl tracking-widest">{r.reference}</h1>
          <StatusBadge status={r.status} />
        </div>
        <p className="mt-2 text-sm text-muted">
          Received{" "}
          {new Date(r.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_26rem]">
        <div className="space-y-10">
          <section aria-labelledby="guest">
            <h2 id="guest" className="mb-3 text-xl">guest</h2>
            <dl className="divide-y divide-line border-y border-line text-sm">
              <Row label="Name">{r.full_name}</Row>
              <Row label="Phone"><a className={link} href={`tel:+${wa}`}>{r.phone}</a></Row>
              <Row label="Email"><a className={link} href={`mailto:${r.email}`}>{r.email}</a></Row>
            </dl>
            <div className="mt-4 flex flex-wrap gap-3 text-sm tracking-widest">
              <a
                href={`https://wa.me/${wa}?text=${encodeURIComponent(hello)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-accent px-5 py-3 text-on-accent transition-opacity hover:opacity-90"
              >
                WhatsApp guest
              </a>
              <a href={`tel:+${wa}`} className="border border-accent px-5 py-3 transition-colors hover:bg-accent/15">Call</a>
              <a
                href={`mailto:${r.email}?subject=${encodeURIComponent(`Your Lumora request ${r.reference}`)}`}
                className="border border-line px-5 py-3 text-muted transition-colors hover:border-accent hover:text-fg"
              >
                Email
              </a>
            </div>
          </section>

          <section aria-labelledby="trip">
            <h2 id="trip" className="mb-3 inline-flex items-center gap-2 text-xl">
              <Icon name={KIND_ICON[r.kind]} size={20} />
              {isStay ? "stay" : isRide ? "ride" : "tour"}
            </h2>
            <dl className="divide-y divide-line border-y border-line text-sm">
              <Row label={isStay ? "Property" : isRide ? "Car" : "Tour"}>
                {publicHref ? (
                  <Link className={link} href={publicHref} target="_blank">{title}</Link>
                ) : (
                  title
                )}
              </Row>
              {r.kind === "tour" && r.starts_on === r.ends_on ? (
                <Row label="Date">{longDate(r.starts_on)}</Row>
              ) : (
                <>
                  <Row label={isStay ? "Check-in" : isRide ? "Pick-up" : "From"}>{longDate(r.starts_on)}</Row>
                  <Row label={isStay ? "Check-out" : isRide ? "Return" : "To"}>{longDate(r.ends_on)}</Row>
                </>
              )}
              <Row label={isStay ? "Guests" : isRide ? "Passengers" : "People"}>{r.guests}</Row>
              {isRide && <Row label="Drive type">{chauffeured ? "Chauffeured" : "Self-drive"}</Row>}
              {isRide && r.pickup_location && <Row label="Pick-up place">{r.pickup_location}</Row>}
              {base && <Row label="Estimate">{money(estimate ?? 0, base.currency)} ({base.note}{fees > 0 ? ", with transfer fees" : ""})</Row>}
              {r.final_total !== null && <Row label="Final price agreed">{money(r.final_total, currency)}</Row>}
              <Row label="Policies">
                {r.accepted_policies_at
                  ? `Accepted ${new Date(r.accepted_policies_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                  : "Not recorded"}
              </Row>
            </dl>
            <p className="mt-2 text-xs text-muted">
              The estimate uses the listed prices and any transfer fees saved below. Confirm the final price with the guest.
            </p>
          </section>

          {showTransfers && (
            <>
              <Transfer
                title={pickupTitle} mode={r.pickup_mode} point={r.pickup_point} address={r.pickup_address}
                lat={r.pickup_lat} lng={r.pickup_lng} time={r.pickup_time} flight={r.pickup_flight}
                fee={r.pickup_fee} currency={currency}
              />
              <Transfer
                title={dropoffTitle} mode={r.dropoff_mode} point={r.dropoff_point} address={r.dropoff_address}
                lat={r.dropoff_lat} lng={r.dropoff_lng} time={r.dropoff_time} flight={r.dropoff_flight}
                fee={r.dropoff_fee} currency={currency}
              />
            </>
          )}

          <PaymentsPanel requestId={r.id} />

          {r.message && (
            <section aria-labelledby="msg">
              <h2 id="msg" className="mb-3 text-xl">their message</h2>
              <p className="max-w-prose whitespace-pre-line border-l border-accent pl-4 font-serif text-lg">{r.message}</p>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="border border-line p-6">
            <h2 className="mb-4 text-xl">what next</h2>
            <RequestActions
              id={r.id}
              status={r.status}
              notes={r.internal_notes ?? ""}
              currency={currency}
              showPickupFee={r.pickup_mode !== "none"}
              showDropoffFee={r.dropoff_mode !== "none"}
              pickupLabel={pickupTitle}
              dropoffLabel={dropoffTitle}
              pickupFee={r.pickup_fee}
              dropoffFee={r.dropoff_fee}
              finalTotal={r.final_total}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
