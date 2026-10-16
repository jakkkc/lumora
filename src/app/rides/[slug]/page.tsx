import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import Facts from "@/components/Facts";
import ItemList from "@/components/ItemList";
import PolicyList from "@/components/booking/PolicyList";
import RideRequestForm from "@/components/booking/RideRequestForm";
import { getFullDays, getPolicies, getRideDetail, getTransferPoints } from "@/lib/data";
import { money, plural, sortImages } from "@/lib/format";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string; to?: string; drive?: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const ride = await getRideDetail(slug);
  if (!ride) return { title: "Ride not found" };
  return { title: ride.title, description: ride.tagline ?? undefined };
}

export default async function RidePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const ride = await getRideDetail(slug);
  if (!ride) notFound();

  const [fullDays, points, allPolicies] = await Promise.all([
    getFullDays("ride", ride.id, ride.units),
    ride.delivery_enabled ? getTransferPoints(ride.location_id) : Promise.resolve([]),
    getPolicies("ride"),
  ]);
  const policies = allPolicies.filter((x) => !x.only_for_similar || ride.or_similar);

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const from = sp.from && iso.test(sp.from) && sp.from >= today ? sp.from : "";
  const to = from && sp.to && iso.test(sp.to) && sp.to >= from ? sp.to : "";

  const images = sortImages(ride.listing_images);
  const both = ride.price_per_day !== null && ride.chauffeur_price_per_day !== null;
  const name = [ride.make, ride.model].filter(Boolean).join(" ");

  const facts: [string, string][] = [];
  if (ride.location) facts.push(["Location", ride.location.name]);
  facts.push(["Seats", String(ride.seats)]);
  facts.push(["Gearbox", ride.transmission === "automatic" ? "Automatic" : "Manual"]);
  if (ride.fuel) facts.push(["Fuel", ride.fuel]);
  if (ride.year) facts.push(["Year", String(ride.year)]);
  if (ride.category) facts.push(["Type", ride.category]);
  facts.push(["Minimum rental", plural(ride.min_days, "day")]);
  facts.push(["Drive", both ? "Self-drive or chauffeured" : ride.price_per_day !== null ? "Self-drive" : "Chauffeured"]);
  if (ride.deposit > 0) facts.push(["Deposit", money(ride.deposit, ride.currency)]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-8 max-w-2xl">
        {ride.category && <p className="text-sm tracking-widest text-muted">{ride.category}</p>}
        <h1 className="mt-2 text-3xl sm:text-5xl">{ride.title}</h1>
        {name && (
          <p className="mt-3 text-sm text-muted">
            {name}
            {ride.or_similar ? " or similar" : ""}
          </p>
        )}
        {ride.tagline && <p className="mt-4 font-serif text-xl italic text-muted">{ride.tagline}</p>}
      </header>

      <div className="grid gap-12 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-12">
          <Gallery images={images} title={ride.title} />

          {ride.description && (
            <section aria-labelledby="about">
              <h2 id="about" className="mb-4 text-xl">about this car</h2>
              <p className="max-w-prose whitespace-pre-line font-serif text-lg leading-relaxed">{ride.description}</p>
            </section>
          )}

          {ride.features.length > 0 && (
            <section aria-labelledby="features">
              <h2 id="features" className="mb-4 text-xl">features</h2>
              <ItemList items={ride.features} />
            </section>
          )}

          <PolicyList policies={policies} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <RideRequestForm
            listingId={ride.id}
            title={ride.title}
            currency={ride.currency}
            seats={ride.seats}
            minDays={ride.min_days}
            selfPrice={ride.price_per_day}
            chauffeurPrice={ride.chauffeur_price_per_day}
            points={points
              .filter((x) => x.ride_fee !== null)
              .map((x) => ({ id: x.id, name: x.name, kind: x.kind, fee: x.ride_fee as number }))}
            deliveryEnabled={ride.delivery_enabled}
            fullDays={fullDays}
            initialFrom={from}
            initialTo={to}
            initialDrive={sp.drive ?? ""}
            hasPolicies={policies.length > 0}
          />
          <Facts items={facts} />
        </aside>
      </div>
    </div>
  );
}
