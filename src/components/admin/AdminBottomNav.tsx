"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";

const items: { href: string; label: string; icon: IconName; exact?: boolean; also?: string[] }[] = [
  { href: "/admin", label: "Home", icon: "dashboard", exact: true },
  { href: "/admin/requests", label: "Requests", icon: "inbox" },
  { href: "/admin/stays", label: "Stays", icon: "home" },
  { href: "/admin/rides", label: "Rides", icon: "car" },
  { href: "/admin/tours", label: "Tours", icon: "compass" },
  { href: "/admin/more", label: "More", icon: "menu", also: ["/admin/accounts", "/admin/locations", "/admin/policies"] },
];

export default function AdminBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Admin"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="grid grid-cols-6">
        {items.map((it) => {
          const active = it.exact
            ? pathname === it.href
            : pathname.startsWith(it.href) || (it.also ?? []).some((p) => pathname.startsWith(p));
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`-mt-px flex flex-col items-center gap-1 border-t-2 pb-2 pt-2.5 text-[11px] tracking-wide transition-colors ${
                  active ? "border-accent text-fg" : "border-transparent text-muted"
                }`}
              >
                <Icon name={it.icon} size={20} />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
