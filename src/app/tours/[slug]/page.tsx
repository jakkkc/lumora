import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import Facts from "@/components/Facts";
import ItemList from "@/components/ItemList";
import PolicyList from "@/components/booking/PolicyList";
import TourRequestForm from "@/components/booking/TourRequestForm";
import { getFullDays, getPolicies, getTourDetail } from "@/lib/data";
import { plural, sortImages } from "@/lib/format";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTourDetail(slug);
  if (!tour) return { title: "Tour not found" };
  return { title: tour.title, description: tour.tagline ?? undefined };
}

export default async function TourPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const tour = await getTourDetail(slug);
  if (!tour) notFound();

  const [fullDays, policies] = await Promise.all([
    getFullDays("tour", tour.id, tour.capacity_per_day),
    getPolicies("tour"),
  ]);

  const guide = tour.tour_type === "guide";
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const from = sp.from && iso.test(sp.from) && sp.from >= today ? sp.from : "";
  const to = guide && from && sp.to && iso.test(sp.to) && sp.to >= from ? sp.to : "";

  const images = sortImages(tour.listing_images);
  const sub = [tour.location?.name, tour.duration_text].filter(Boolean).join(", ");

  const facts: [string, string][] = [];
  if (tour.location) facts.push(["Location", tour.location.name]);
  facts.push(["Type", guide ? "Guide hired by the day" : "Fixed tour"]);
  if (tour.duration_text) facts.push(["Duration", tour.duration_text]);
  if (tour.meeting_point) facts.push(["Meeting point", tour.meeting_point]);
  facts.push([
    "Group size",
    tour.min_people === tour.max_group ? plural(tour.max_group, "person") : `${tour.min_people} to ${tour.max_group} people`,
  ]);
  if (tour.languages.length > 0) facts.push(["Languages", tour.languages.join(", ")]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-8 max-w-2xl">
        {sub && <p className="text-sm tracking-widest text-muted">{sub}</p>}
        <h1 className="mt-2 text-3xl sm:text-5xl">{tour.title}</h1>
        {tour.tagline && <p className="mt-4 font-serif text-xl italic text-muted">{tour.tagline}</p>}
      </header>

      <div className="grid gap-12 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-12">
          <Gallery images={images} title={tour.title} />

          {tour.description && (
            <section aria-labelledby="about">
              <h2 id="about" className="mb-4 text-xl">about this tour</h2>
              <p className="max-w-prose whitespace-pre-line font-serif text-lg leading-relaxed">{tour.description}</p>
            </section>
          )}

          {tour.includes.length > 0 && (
            <section aria-labelledby="included">
              <h2 id="included" className="mb-4 text-xl">what is included</h2>
              <ItemList items={tour.includes} />
            </section>
          )}

          {tour.excludes.length > 0 && (
            <section aria-labelledby="excluded">
              <h2 id="excluded" className="mb-4 text-xl">what is not included</h2>
              <ItemList items={tour.excludes} />
            </section>
          )}

          <PolicyList policies={policies} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <TourRequestForm
            listingId={tour.id}
            title={tour.title}
            currency={tour.currency}
            tourType={tour.tour_type}
            price={tour.price}
            basis={tour.price_basis}
            minPeople={tour.min_people}
            maxGroup={tour.max_group}
            fullDays={fullDays}
            initialFrom={from}
            initialTo={to}
            hasPolicies={policies.length > 0}
          />
          <Facts items={facts} />
        </aside>
      </div>
    </div>
  );
}
