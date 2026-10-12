import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RequestActions from "@/components/admin/RequestActions";
import StatusBadge from "@/components/admin/StatusBadge";
import { whatsappLink, waNumber } from "@/lib/contact";
import { daysBetween, longDate, money } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Request" };

type Req = {
  id: string;
  reference: string;
  kind: "stay" | "ride";
  starts_on: string;
  ends_on: string;
  guests: number;
  pickup_location: string | null;
  with_driver: boolean;
  full_name: string;
  email: string;
  phone: string;
  message: string | null;
  status: string;
  internal_notes: string | null;
  created_at: string;
  property: { title: string; slug: string; price_per_night: number; cleaning_fee: number; currency: string } | null;
  vehicle: { title: string; slug: string; price_per_day: number; driver_fee_per_day: number; currency: string } | null;
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

export default async function RequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("booking_requests")
    .select(
      "*, property:properties(title, slug, price_per_night, cleaning_fee, currency), vehicle:vehicles(title, slug, price_per_day, driver_fee_per_day, currency)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const r = data as unknown as Req;

  const title = r.property?.title ?? r.vehicle?.title ?? "a removed listing";
  const isStay = r.kind === "stay";
  const span = daysBetween(r.starts_on, r.ends_on);

  let estimate: string | null = null;
  if (isStay && r.property) {
    const total = span * r.property.price_per_night + r.property.cleaning_fee;
    estimate = `${money(total, r.property.currency)} (${span} night${span === 1 ? "" : "s"}${r.property.cleaning_fee ? ", with cleaning fee" : ""})`;
  } else if (!isStay && r.vehicle) {
    const days = span + 1;
    const total = days * r.vehicle.price_per_day + (r.with_driver ? days * r.vehicle.driver_fee_per_day : 0);
    estimate = `${money(total, r.vehicle.currency)} (${days} day${days === 1 ? "" : "s"}${r.with_driver ? ", with driver" : ""})`;
  }

  const wa = waNumber(r.phone);
  const hello = `Hello ${r.full_name.split(" ")[0]}, this is Lumora about your request ${r.reference} for ${title}.`;
  const publicHref = r.property
    ? `/stays/${r.property.slug}`
    : r.vehicle
      ? `/rides/${r.vehicle.slug}`
      : null;

  const link = "underline decoration-line underline-offset-4 hover:decoration-accent";

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
              <Row label="Phone">
                <a className={link} href={`tel:+${wa}`}>{r.phone}</a>
              </Row>
              <Row label="Email">
                <a className={link} href={`mailto:${r.email}`}>{r.email}</a>
              </Row>
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
              <a href={`tel:+${wa}`} className="border border-accent px-5 py-3 transition-colors hover:bg-accent/15">
                Call
              </a>
              <a
                href={`mailto:${r.email}?subject=${encodeURIComponent(`Your Lumora request ${r.reference}`)}`}
                className="border border-line px-5 py-3 text-muted transition-colors hover:border-accent hover:text-fg"
              >
                Email
              </a>
            </div>
          </section>

          <section aria-labelledby="trip">
            <h2 id="trip" className="mb-3 text-xl">{isStay ? "stay" : "ride"}</h2>
            <dl className="divide-y divide-line border-y border-line text-sm">
              <Row label={isStay ? "Property" : "Car"}>
                {publicHref ? (
                  <Link className={link} href={publicHref} target="_blank">{title}</Link>
                ) : (
                  title
                )}
              </Row>
              <Row label={isStay ? "Check-in" : "Pick-up"}>{longDate(r.starts_on)}</Row>
              <Row label={isStay ? "Check-out" : "Return"}>{longDate(r.ends_on)}</Row>
              <Row label={isStay ? "Guests" : "Passengers"}>{r.guests}</Row>
              {!isStay && <Row label="Driver">{r.with_driver ? "Yes" : "No, self-drive"}</Row>}
              {!isStay && r.pickup_location && <Row label="Pick-up place">{r.pickup_location}</Row>}
              {estimate && <Row label="Estimate">{estimate}</Row>}
            </dl>
            <p className="mt-2 text-xs text-muted">
              The estimate uses the listed prices. Confirm the final price with the guest.
            </p>
          </section>

          {r.message && (
            <section aria-labelledby="msg">
              <h2 id="msg" className="mb-3 text-xl">their message</h2>
              <p className="max-w-prose whitespace-pre-line border-l border-accent pl-4 font-serif text-lg">
                {r.message}
              </p>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="border border-line p-6">
            <h2 className="mb-4 text-xl">what next</h2>
            <RequestActions id={r.id} status={r.status} notes={r.internal_notes ?? ""} />
          </div>
        </aside>
      </div>
    </div>
  );
}
