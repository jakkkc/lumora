import Link from "next/link";
import { Wordmark } from "./Logo";

const links = [
  { href: "/stays", label: "Stays" },
  { href: "/rides", label: "Rides" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-navy text-gold">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" aria-label="Lumora home">
          <Wordmark className="h-6 w-auto sm:h-7" />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-6 text-sm tracking-widest text-cream sm:gap-9">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-gold">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
