import Link from "next/link";
import { AnimatedWordmark } from "./Logo";
import InstallApp from "./InstallApp";
import { TOURS_READY } from "@/lib/config";
import { CREDIT_NAME, CREDIT_URL, PHONE_DISPLAY, PHONE_TEL, WHATSAPP_URL } from "@/lib/contact";

export default function Footer() {
  return (
    <footer className="bg-navy text-cream">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <AnimatedWordmark className="h-6 w-auto text-gold" />
          <p className="max-w-xs text-sm text-cream/70">
            Apartments and cars on the Kenyan coast, looked after by one team.
          </p>
          <InstallApp />
        </div>

        <nav aria-label="Footer" className="space-y-3 text-sm tracking-widest text-cream/80">
          <Link href="/stays" className="block hover:text-gold">Stays</Link>
          <Link href="/rides" className="block hover:text-gold">Rides</Link>
          {TOURS_READY && <Link href="/tours" className="block hover:text-gold">Tours</Link>}
        </nav>

        <div className="space-y-3 text-sm">
          <p className="tracking-widest text-cream/80">Talk to us</p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-cream hover:text-gold"
          >
            WhatsApp {PHONE_DISPLAY}
          </a>
          <a href={`tel:${PHONE_TEL}`} className="block text-cream hover:text-gold">
            Call {PHONE_DISPLAY}
          </a>
          <p className="text-xs text-cream/50">Bookings, questions and help, all on one number.</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-2 border-t border-cream/10 px-5 py-5 text-xs text-cream/50 sm:flex-row sm:px-8">
        <p>© {new Date().getFullYear()} Lumora</p>
        <p>
          Designed and built by{" "}
          <a
            href={CREDIT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cream/80 underline decoration-cream/30 underline-offset-4 hover:text-gold hover:decoration-gold"
          >
            {CREDIT_NAME}
          </a>
        </p>
      </div>
    </footer>
  );
}
