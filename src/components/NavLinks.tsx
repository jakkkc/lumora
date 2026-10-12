"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/stays", label: "Stays" },
  { href: "/rides", label: "Rides" },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex items-center gap-6 text-sm tracking-widest sm:gap-9">
      {links.map((l) => {
        const active = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link key={l.href} href={l.href} className="nav-link" aria-current={active ? "page" : undefined}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
