import type { Metadata } from "next";
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import { signOut } from "../../actions";

export const metadata: Metadata = { title: "More" };

const links: { href: string; label: string; note: string; icon: IconName; newTab?: boolean }[] = [
  { href: "/admin/accounts", label: "Accounts", note: "Sales, payments and refunds by date", icon: "wallet" },
  { href: "/admin/notifications", label: "Notifications", note: "Alerts on this phone", icon: "bell" },
  { href: "/admin/locations", label: "Locations", note: "Places you serve and pickup point fees", icon: "pin" },
  { href: "/admin/policies", label: "Policies", note: "The terms guests see before they request", icon: "policy" },
  { href: "/", label: "View the website", note: "Opens the guest site in a new tab", icon: "home", newTab: true },
];

const card =
  "flex w-full items-center gap-4 border border-line p-4 text-left transition-colors hover:border-accent active:bg-accent/10";

export default function MorePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl">more</h1>
        <p className="mt-2 text-sm text-muted">Settings and shortcuts.</p>
      </div>

      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} target={l.newTab ? "_blank" : undefined} className={card}>
              <Icon name={l.icon} size={22} className="shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-base">{l.label}</span>
                <span className="block text-xs text-muted">{l.note}</span>
              </span>
              <Icon name="next" size={16} className="shrink-0 text-muted" />
            </Link>
          </li>
        ))}
        <li>
          <form action={signOut}>
            <button type="submit" className={card}>
              <Icon name="close" size={22} className="shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-base">Sign out</span>
                <span className="block text-xs text-muted">Leave the admin on this device</span>
              </span>
            </button>
          </form>
        </li>
      </ul>
    </div>
  );
}
