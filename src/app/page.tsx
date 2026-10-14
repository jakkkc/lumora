import Link from "next/link";
import type { CSSProperties } from "react";
import { AnimatedMark } from "@/components/Logo";
import ListingCard from "@/components/ListingCard";
import SearchBox from "@/components/search/SearchBox";
import { TOURS_READY } from "@/lib/config";
import { getLocations, getRides, getStays } from "@/lib/data";
import { driverLabel, money, plural, sortImages } from "@/lib/format";

export const revalidate = 60;

/*
  Where the ring's left edge sits. One rule for every screen width:
  - 1280px and wider: exactly the original design
  - tablets and small laptops: kept clear of the text (never left of 616px)
  - phones: a slice of the ring shows, pushed further right as the screen gets smaller
*/
const RING_LEFT =
  "min(max(616px, calc(100% - 664px)), calc(100% - clamp(87px, calc(25% - 3px), 107px)))";

export default async function Home() {
  const [stays, rides, locations] = await Promise.all([getStays(), getRides(), getLocations()]);
  const featuredStays = (stays.some((s) => s.featured) ? stays.filter((s) => s.featured) : stays).slice(0, 3);
  const featuredRides = (rides.some((r) => r.featured) ? rides.filter((r) => r.featured) : rides).slice(0, 3);

  return (
    <>
      <section
        className="relative overflow-hidden bg-bg text-fg"
        style={{ "--ring-left": RING_LEFT } as CSSProperties}
      >
        <div
          className="glow pointer-events-none absolute top-1/2 -ml-24 h-[46rem] w-[46rem] -translate-y-1/2 rounded-full sm:-ml-[200px] sm:h-[60rem] sm:w-[60rem]"
          style={{ left: "var(--ring-left)" }}
          aria-hidden="true"
        />
        <AnimatedMark
          className="pointer-events-none absolute top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 text-accent [--mk-sw:34] sm:h-[44rem] sm:w-[44rem] sm:[--mk-sw:74]"
          style={{ left: "var(--ring-left)" }}
        />

        <div className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-36">
          <h1 className="max-w-xl text-4xl sm:text-6xl">
            stays and rides on the kenyan coast
          </h1>
          <p className="mt-6 max-w-md font-serif text-xl italic text-muted">
            Beautiful apartments and well-kept cars, arranged by one team that
            answers you personally.
          </p>
          <div className="mt-10 max-w-3xl">
            <SearchBox
              locations={locations}
              toursReady={TOURS_READY}
              initial={{ type: "stay", location: locations[0]?.slug ?? "", from: "", to: "" }}
            />
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
