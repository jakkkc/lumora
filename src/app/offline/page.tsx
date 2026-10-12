import type { Metadata } from "next";
import { AnimatedMark } from "@/components/Logo";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function Offline() {
  return (
    <section className="relative overflow-hidden px-5 py-28 sm:px-8 sm:py-40">
      <AnimatedMark className="pointer-events-none absolute -right-24 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 text-accent opacity-60" />
      <div className="relative mx-auto max-w-6xl">
        <h1 className="max-w-md text-4xl sm:text-5xl">you are offline</h1>
        <p className="mt-6 max-w-md font-serif text-xl italic text-muted">
          Lumora cannot reach the internet right now. Pages you have already visited will still open. Check your
          connection and try again.
        </p>
        <p className="mt-8 text-sm text-muted">
          Need us now? Call{" "}
          <a href={`tel:${PHONE_TEL}`} className="underline decoration-line underline-offset-4 hover:decoration-accent">
            {PHONE_DISPLAY}
          </a>
          .
        </p>
      </div>
    </section>
  );
}
