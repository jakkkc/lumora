"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";

const links: { href: string; label: string; icon: IconName; exact?: boolean }[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/admin/requests", label: "Requests", icon: "inbox" },
  { href: "/admin/stays", label: "Stays", icon: "home" },
  { href: "/admin/rides", label: "Rides", icon: "car" },
  { href: "/admin/tours", label: "Tours", icon: "compass" },
  { href: "/admin/locations", label: "Locations", icon: "pin" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="mx-auto flex max-w-6xl gap-7 overflow-x-auto px-5 pb-3 text-sm tracking-widest sm:px-8">
      {links.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className="nav-link inline-flex items-center gap-2 whitespace-nowrap"
            aria-current={active ? "page" : undefined}
          >
            <Icon name={l.icon} size={16} />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
