import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import ListingForm from "./ListingForm";

type Kind = "stay" | "ride" | "tour";

const TEXT: Record<Kind, { back: string; href: string; heading: string }> = {
  stay: { back: "All stays", href: "/admin/stays", heading: "add a stay" },
  ride: { back: "All rides", href: "/admin/rides", heading: "add a car" },
  tour: { back: "All tours", href: "/admin/tours", heading: "add a tour" },
};

export default async function ListingNew({ kind }: { kind: Kind }) {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("locations").select("id, name").order("sort_order").order("name");
  const t = TEXT[kind];

  return (
    <div className="space-y-8">
      <div>
        <Link href={t.href} className="nav-link text-sm tracking-widest">{t.back}</Link>
        <h1 className="mt-5 text-3xl">{t.heading}</h1>
        <p className="mt-2 text-sm text-muted">Fill in the details, save, then add photos on the next screen.</p>
      </div>
      <ListingForm kind={kind} locations={data ?? []} />
    </div>
  );
}
