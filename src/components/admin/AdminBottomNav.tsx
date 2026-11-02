"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icon, { type IconName } from "@/components/Icon";
import { newRequestCount } from "@/app/admin/(panel)/badge-actions";

const items: { href: string; label: string; icon: IconName; exact?: boolean; also?: string[] }[] = [
  { href: "/admin", label: "Home", icon: "dashboard", exact: true },
  { href: "/admin/requests", label: "Requests", icon: "inbox" },
  { href: "/admin/stays", label: "Stays", icon: "home" },
  { href: "/admin/rides", label: "Rides", icon: "car" },
  { href: "/admin/tours", label: "Tours", icon: "compass" },
  {
    href: "/admin/more",
    label: "More",
    icon: "menu",
    also: ["/admin/accounts", "/admin/notifications", "/admin/locations", "/admin/policies"],
  },
];

type Badgeable = Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };

export default function AdminBottomNav() {
  const pathname = usePathname();
  const [waiting, setWaiting] = useState(0);

  // Keep the number on the Requests tab and on the app icon up to date as you move around.
  useEffect(() => {
    let alive = true;
    newRequestCount()
      .then((n) => {
        if (!alive) return;
        setWaiting(n);
        const nav = navigator as Badgeable;
        if (n > 0) nav.setAppBadge?.(n).catch(() => {});
        else nav.clearAppBadge?.().catch(() => {});
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [pathname]);

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
          const showCount = it.href === "/admin/requests" && waiting > 0;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                aria-label={showCount ? `${it.label}, ${waiting} new` : undefined}
                className={`-mt-px flex flex-col items-center gap-1 border-t-2 pb-2 pt-2.5 text-[11px] tracking-wide transition-colors ${
                  active ? "border-accent text-fg" : "border-transparent text-muted"
                }`}
              >
                <span className="relative">
                  <Icon name={it.icon} size={20} />
                  {showCount && (
                    <span className="absolute -right-3 -top-2 grid min-w-4 place-items-center bg-accent px-1 text-[10px] leading-4 text-on-accent">
                      {waiting > 99 ? "99+" : waiting}
                    </span>
                  )}
                </span>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
