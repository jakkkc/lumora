import Link from "next/link";
import { AnimatedMark } from "@/components/Logo";
import ListingCard from "@/components/ListingCard";
import { getRides, getStays } from "@/lib/data";
import { driverLabel, money, plural, sortImages } from "@/lib/format";

export const revalidate = 60;

export default async function Home() {
  const [stays, rides] = await Promise.all([getStays(), getRides()]);
  const featuredStays = (stays.some((s) => s.featured) ? stays.filter((s) => s.featured) : stays).slice(0, 3);
  const featuredRides = (rides.some((r) => r.featured) ? rides.filter((r) => r.featured) : rides).slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden bg-bg text-fg">
        {/* Wide screens: the big ring sits on the right */}
        <div
          className="glow pointer-events-none absolute -right-24 top-1/2 hidden h-[52rem] w-[52rem] -translate-y-1/2 rounded-full lg:block"
          aria-hidden="true"
        />
        <AnimatedMark className="pointer-events-none absolute -right-20 top-1/2 hidden h-[36rem] w-[36rem] -translate-y-1/2 text-accent lg:block xl:-right-10 xl:h-[44rem] xl:w-[44rem]" />

        <div className="relative mx-auto max-w-6xl px-5 py-14 text-center sm:px-8 sm:py-20 lg:py-40 lg:text-left">
          {/* Phones and tablets: the ring sits above the words so nothing overlaps */}
          <div className="relative mx-auto mb-10 grid h-52 w-52 place-items-center sm:h-60 sm:w-60 lg:hidden">
            <div className="glow absolute -inset-10 rounded-full" aria-hidden="true" />
            <AnimatedMark className="relative h-40 w-40 text-accent sm:h-48 sm:w-48" />
          </div>

          <h1 className="mx-auto max-w-xl text-4xl sm:text-6xl lg:mx-0">
            stays and rides on the kenyan coast
          </h1>
          <p className="mx-auto mt-6 max-w-md font-serif text-xl italic text-muted lg:mx-0">
            Beautiful apartments and well-kept cars, arranged by one team that
            answers you personally.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm tracking-widest lg:justify-start">
            <Link href="/stays" className="bg-accent px-7 py-3.5 text-on-accent transition-colors hover:opacity-90">
              Browse stays
            </Link>
            <Link href="/rides" className="border border-accent px-7 py-3.5 text-fg transition-colors hover:bg-accent/15">
              Browse rides
            </Link>
          </div>
        </div>
      </section>

      {featuredStays.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="home-stays">
          <div className="mb-10 flex items-end justify-between gap-6">
            <h2 id="home-stays" className="text-3xl sm:text-4xl">stays</h2>
            <Link href="/stays" className="nav-link text-sm tracking-widest">See all stays</Link>
          </div>
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {featuredStays.map((s) => (
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
        </section>
      )}

      {featuredRides.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-24" aria-labelledby="home-rides">
          <div className="mb-10 flex items-end justify-between gap-6">
            <h2 id="home-rides" className="text-3xl sm:text-4xl">rides</h2>
            <Link href="/rides" className="nav-link text-sm tracking-widest">See all rides</Link>
          </div>
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {featuredRides.map((r) => (
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
        </section>
      )}
    </>
  );
}
