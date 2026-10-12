import Link from "next/link";
import { AnimatedWordmark } from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-navy text-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-14 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div className="space-y-4">
          <AnimatedWordmark className="h-6 w-auto text-gold" />
          <p className="max-w-xs text-sm text-cream/70">
            Apartments and cars on the Kenyan coast, looked after by one team.
          </p>
        </div>
        <nav aria-label="Footer" className="flex gap-8 text-sm tracking-widest text-cream/80">
          <Link href="/stays" className="hover:text-gold">Stays</Link>
          <Link href="/rides" className="hover:text-gold">Rides</Link>
        </nav>
      </div>
      <div className="border-t border-cream/10 px-5 py-5 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} Lumora
      </div>
    </footer>
  );
}
