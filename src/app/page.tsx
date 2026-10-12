import Link from "next/link";
import { Mark } from "@/components/Logo";

export default function Home() {
  return (
    <section className="relative overflow-hidden bg-navy text-cream">
      <Mark className="pointer-events-none absolute -right-24 top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 text-gold/90 sm:-right-10 sm:h-[44rem] sm:w-[44rem]" title="" />
      <div className="relative mx-auto max-w-6xl px-5 py-28 sm:px-8 sm:py-40">
        <h1 className="max-w-xl text-4xl sm:text-6xl">
          stays and rides on the kenyan coast
        </h1>
        <p className="mt-6 max-w-md font-serif text-xl italic text-cream/80">
          Beautiful apartments and well-kept cars, arranged by one team that
          answers you personally.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 text-sm tracking-widest">
          <Link
            href="/stays"
            className="bg-gold px-7 py-3.5 text-navy-deep transition-colors hover:bg-gold-soft"
          >
            Browse stays
          </Link>
          <Link
            href="/rides"
            className="border border-gold/60 px-7 py-3.5 text-gold transition-colors hover:bg-gold/10"
          >
            Browse rides
          </Link>
        </div>
      </div>
    </section>
  );
}
