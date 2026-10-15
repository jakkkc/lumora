import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import Facts from "@/components/Facts";
import ItemList from "@/components/ItemList";
import PolicyList from "@/components/booking/PolicyList";
import StayRequestForm from "@/components/booking/StayRequestForm";
import { getFullDays, getPolicies, getStayDetail, getTransferPoints } from "@/lib/data";
import { plural, sortImages } from "@/lib/format";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const stay = await getStayDetail(slug);
  if (!stay) return { title: "Stay not found" };
  return { title: stay.title, description: stay.tagline ?? undefined };
}

export default async function StayPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const stay = await getStayDetail(slug);
  if (!stay) notFound();

  const [fullDays, points, policies] = await Promise.all([
    getFullDays("stay", stay.id, 1),
    stay.transfers_enabled ? getTransferPoints(stay.location_id) : Promise.resolve([]),
    getPolicies("stay"),
  ]);

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const from = sp.from && iso.test(sp.from) && sp.from >= today ? sp.from : "";
  const to = from && sp.to && iso.test(sp.to) && sp.to > from ? sp.to : "";

  const images = sortImages(stay.listing_images);
  const place = [stay.area, stay.location?.name].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-8 max-w-2xl">
        {place && <p className="text-sm tracking-widest text-muted">{place}</p>}
        <h1 className="mt-2 text-3xl sm:text-5xl">{stay.title}</h1>
        {stay.tagline && <p className="mt-4 font-serif text-xl italic text-muted">{stay.tagline}</p>}
      </header>

      <div className="grid gap-12 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-12">
          <Gallery images={images} title={stay.title} />

          {stay.description && (
            <section aria-labelledby="about">
              <h2 id="about" className="mb-4 text-xl">about this stay</h2>
              <p className="max-w-prose whitespace-pre-line font-serif text-lg leading-relaxed">{stay.description}</p>
            </section>
          )}

          {stay.amenities.length > 0 && (
            <section aria-labelledby="amenities">
              <h2 id="amenities" className="mb-4 text-xl">what is included</h2>
              <ItemList items={stay.amenities} />
            </section>
          )}

          {stay.house_rules && (
            <section aria-labelledby="rules">
              <h2 id="rules" className="mb-4 text-xl">house rules</h2>
              <p className="max-w-prose whitespace-pre-line text-sm text-muted">{stay.house_rules}</p>
            </section>
          )}

          <PolicyList policies={policies} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <StayRequestForm
            listingId={stay.id}
            title={stay.title}
            price={stay.price_per_night}
            currency={stay.currency}
            maxGuests={stay.max_guests}
            minNights={stay.min_nights}
            points={points
              .filter((x) => x.stay_fee !== null)
              .map((x) => ({ id: x.id, name: x.name, kind: x.kind, fee: x.stay_fee as number }))}
            fullDays={fullDays}
            initialFrom={from}
            initialTo={to}
            hasPolicies={policies.length > 0}
          />
          <Facts
            items={[
              ...(stay.location ? ([["Location", stay.location.name]] as [string, string][]) : []),
              ["Bedrooms", String(stay.bedrooms)],
              ["Bathrooms", String(stay.bathrooms)],
              ["Sleeps", plural(stay.max_guests, "guest")],
              ["Minimum stay", plural(stay.min_nights, "night")],
              ["Check-in", stay.check_in_time],
              ["Check-out", stay.check_out_time],
            ]}
          />
        </aside>
      </div>
    </div>
  );
}
