import type { Metadata } from "next";
import ListingCard from "@/components/ListingCard";
import { getStays } from "@/lib/data";
import { money, plural, sortImages } from "@/lib/format";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Stays",
  description: "Luxury apartments to rent in Mombasa and along the Kenyan coast.",
};

export default async function StaysPage() {
  const stays = await getStays();

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <h1 className="text-4xl sm:text-5xl">stays</h1>
      <p className="mt-4 max-w-lg font-serif text-xl italic text-muted">
        Apartments chosen for light, space and the sea, each looked after by our team.
      </p>

      {stays.length === 0 ? (
        <p className="mt-16 text-muted">No stays are published yet. Please check back soon.</p>
      ) : (
        <div className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {stays.map((s) => (
            <ListingCard
              key={s.id}
              href={`/stays/${s.slug}`}
              title={s.title}
              meta={`${s.area ? s.area + ", " : ""}${plural(s.bedrooms, "bedroom")}, sleeps ${s.max_guests}`}
              price={money(s.price_per_night, s.currency)}
              unit="per night"
              image={sortImages(s.listing_images)[0]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
