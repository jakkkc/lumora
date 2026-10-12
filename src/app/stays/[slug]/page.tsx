import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import Facts from "@/components/Facts";
import ItemList from "@/components/ItemList";
import RequestForm from "@/components/RequestForm";
import { getBlocks, getStay } from "@/lib/data";
import { money, plural, sortImages } from "@/lib/format";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const stay = await getStay(slug);
  if (!stay) return { title: "Stay not found" };
  return { title: stay.title, description: stay.tagline ?? undefined };
}

export default async function StayPage({ params }: Props) {
  const { slug } = await params;
  const stay = await getStay(slug);
  if (!stay) notFound();

  const blocked = await getBlocks("stay", stay.id);
  const images = sortImages(stay.listing_images);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-8 max-w-2xl">
        {stay.area && <p className="text-sm tracking-widest text-muted">{stay.area}</p>}
        <h1 className="mt-2 text-3xl sm:text-5xl">{stay.title}</h1>
        {stay.tagline && <p className="mt-4 font-serif text-xl italic text-muted">{stay.tagline}</p>}
      </header>

      <div className="grid gap-12 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-12">
          <Gallery images={images} title={stay.title} />

          {stay.description && (
            <section aria-labelledby="about">
              <h2 id="about" className="mb-4 text-xl">about this stay</h2>
              <p className="max-w-prose whitespace-pre-line font-serif text-lg leading-relaxed">
                {stay.description}
              </p>
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
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <RequestForm
            kind="stay"
            listingId={stay.id}
            title={stay.title}
            price={stay.price_per_night}
            currency={stay.currency}
            maxGuests={stay.max_guests}
            minNights={stay.min_nights}
            cleaningFee={stay.cleaning_fee}
            blocked={blocked}
          />
          <Facts
            items={[
              ["Bedrooms", String(stay.bedrooms)],
              ["Bathrooms", String(stay.bathrooms)],
              ["Sleeps", plural(stay.max_guests, "guest")],
              ["Minimum stay", plural(stay.min_nights, "night")],
              ["Check-in", stay.check_in_time],
              ["Check-out", stay.check_out_time],
              ...(stay.cleaning_fee > 0
                ? ([["Cleaning fee", money(stay.cleaning_fee, stay.currency)]] as [string, string][])
                : []),
            ]}
          />
        </aside>
      </div>
    </div>
  );
}
