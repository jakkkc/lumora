import type { Metadata } from "next";
import ListingCard from "@/components/ListingCard";
import { getRides } from "@/lib/data";
import { driverLabel, money, sortImages } from "@/lib/format";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Rides",
  description: "Well-kept cars for hire in Mombasa and along the Kenyan coast, with or without a driver.",
};

export default async function RidesPage() {
  const rides = await getRides();

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <h1 className="text-4xl sm:text-5xl">rides</h1>
      <p className="mt-4 max-w-lg font-serif text-xl italic text-muted">
        Clean, comfortable cars for the coast road, with a driver or on your own.
      </p>

      {rides.length === 0 ? (
        <p className="mt-16 text-muted">No rides are published yet. Please check back soon.</p>
      ) : (
        <div className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {rides.map((r) => (
            <ListingCard
              key={r.id}
              href={`/rides/${r.slug}`}
              title={r.title}
              meta={`${r.seats} seats, ${driverLabel[r.driver_option].toLowerCase()}`}
              price={money(r.price_per_day, r.currency)}
              unit="per day"
              image={sortImages(r.listing_images)[0]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
