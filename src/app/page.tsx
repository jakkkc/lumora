import Link from "next/link";
import { AnimatedMark } from "@/components/Logo";

export default function Home() {
  return (
    <section className="relative overflow-hidden bg-bg text-fg">
      <div className="glow pointer-events-none absolute -right-40 top-1/2 h-[46rem] w-[46rem] -translate-y-1/2 rounded-full sm:-right-24 sm:h-[60rem] sm:w-[60rem]" aria-hidden="true" />
      <AnimatedMark className="pointer-events-none absolute -right-24 top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 text-accent sm:-right-10 sm:h-[44rem] sm:w-[44rem]" />
      <div className="relative mx-auto max-w-6xl px-5 py-28 sm:px-8 sm:py-40">
        <h1 className="max-w-xl text-4xl sm:text-6xl">
          stays and rides on the kenyan coast
        </h1>
        <p className="mt-6 max-w-md font-serif text-xl italic text-muted">
          Beautiful apartments and well-kept cars, arranged by one team that
          answers you personally.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 text-sm tracking-widest">
          <Link href="/stays" className="bg-accent px-7 py-3.5 text-on-accent transition-colors hover:opacity-90">
            Browse stays
          </Link>
          <Link href="/rides" className="border border-accent px-7 py-3.5 text-fg transition-colors hover:bg-accent/15">
            Browse rides
          </Link>
        </div>
      </div>
    </section>
  );
}
