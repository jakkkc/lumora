import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import Facts from "@/components/Facts";
import ItemList from "@/components/ItemList";
import RequestForm from "@/components/RequestForm";
import { getBlocks, getRide } from "@/lib/data";
import { driverLabel, money, sortImages } from "@/lib/format";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ride = await getRide(slug);
  if (!ride) return { title: "Ride not found" };
  return { title: ride.title, description: ride.tagline ?? undefined };
}

export default async function RidePage({ params }: Props) {
  const { slug } = await params;
  const ride = await getRide(slug);
  if (!ride) notFound();

  const blocked = await getBlocks("ride", ride.id);
  const images = sortImages(ride.listing_images);
  const facts: [string, string][] = [
    ["Seats", String(ride.seats)],
    ["Gearbox", ride.transmission === "automatic" ? "Automatic" : "Manual"],
  ];
  if (ride.fuel) facts.push(["Fuel", ride.fuel]);
  if (ride.year) facts.push(["Year", String(ride.year)]);
  if (ride.category) facts.push(["Type", ride.category]);
  facts.push(["Driver", driverLabel[ride.driver_option]]);
  if (ride.driver_option !== "self_drive" && ride.driver_fee_per_day > 0) {
    facts.push(["Driver fee", `${money(ride.driver_fee_per_day, ride.currency)} per day`]);
  }
  if (ride.deposit > 0) facts.push(["Deposit", money(ride.deposit, ride.currency)]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-8 max-w-2xl">
        {ride.category && <p className="text-sm tracking-widest text-muted">{ride.category}</p>}
        <h1 className="mt-2 text-3xl sm:text-5xl">{ride.title}</h1>
        {ride.tagline && <p className="mt-4 font-serif text-xl italic text-muted">{ride.tagline}</p>}
      </header>

      <div className="grid gap-12 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-12">
          <Gallery images={images} title={ride.title} />

          {ride.description && (
            <section aria-labelledby="about">
              <h2 id="about" className="mb-4 text-xl">about this car</h2>
              <p className="max-w-prose whitespace-pre-line font-serif text-lg leading-relaxed">
                {ride.description}
              </p>
            </section>
          )}

          {ride.features.length > 0 && (
            <section aria-labelledby="features">
              <h2 id="features" className="mb-4 text-xl">features</h2>
              <ItemList items={ride.features} />
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <RequestForm
            kind="ride"
            listingId={ride.id}
            title={ride.title}
            price={ride.price_per_day}
            currency={ride.currency}
            maxGuests={ride.seats}
            driverOption={ride.driver_option}
            driverFee={ride.driver_fee_per_day}
            blocked={blocked}
          />
          <Facts items={facts} />
        </aside>
      </div>
    </div>
  );
}
