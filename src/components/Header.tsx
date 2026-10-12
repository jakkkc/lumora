import Link from "next/link";
import { AnimatedWordmark } from "./Logo";
import NavLinks from "./NavLinks";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 text-fg backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link href="/" aria-label="Lumora home">
          <AnimatedWordmark className="h-6 w-auto text-logo sm:h-7" />
        </Link>
        <div className="flex items-center gap-5 sm:gap-8">
          <NavLinks />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
