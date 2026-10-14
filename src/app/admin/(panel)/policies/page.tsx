import type { Metadata } from "next";
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import PoliciesManager from "@/components/admin/PoliciesManager";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Policies" };

const TABS: { key: "stay" | "ride" | "tour"; label: string; icon: IconName }[] = [
  { key: "stay", label: "Stays", icon: "home" },
  { key: "ride", label: "Rides", icon: "car" },
  { key: "tour", label: "Tours", icon: "compass" },
];

export default async function PoliciesPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service: raw } = await searchParams;
  const service = raw === "ride" || raw === "tour" ? raw : "stay";

  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("policies")
    .select("*")
    .eq("service", service)
    .order("sort_order")
    .order("created_at");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl">policies</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          The terms guests see before they send a request. Each service has its own list. A policy with Shown to
          guests turned off stays hidden.
        </p>
      </div>

      <nav aria-label="Service" className="flex flex-wrap gap-x-8 gap-y-2 border-b border-line pb-3 text-sm">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/policies?service=${t.key}`}
            aria-current={t.key === service ? "page" : undefined}
            className={`nav-link inline-flex items-center gap-2 tracking-widest ${t.key === service ? "" : "text-muted"}`}
          >
            <Icon name={t.icon} size={16} />
            {t.label}
          </Link>
        ))}
      </nav>

      <PoliciesManager service={service} policies={data ?? []} />
    </div>
  );
}
