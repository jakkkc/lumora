import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import DeleteListing from "./DeleteListing";
import ListingForm from "./ListingForm";
import PhotoManager from "./PhotoManager";

type Kind = "stay" | "ride" | "tour";

const CFG: Record<Kind, { table: string; col: string; back: string; href: string; publicBase: string | null }> = {
  stay: { table: "properties", col: "property_id", back: "All stays", href: "/admin/stays", publicBase: "/stays/" },
  ride: { table: "vehicles", col: "vehicle_id", back: "All rides", href: "/admin/rides", publicBase: "/rides/" },
  tour: { table: "tours", col: "tour_id", back: "All tours", href: "/admin/tours", publicBase: null },
};

export default async function ListingEdit({
  kind,
  id,
  created,
}: {
  kind: Kind;
  id: string;
  created?: boolean;
}) {
  const supabase = await supabaseServer();
  const c = CFG[kind];

  const { data: row } = await supabase.from(c.table).select("*").eq("id", id).maybeSingle();
  if (!row) notFound();

  const [{ data: images }, { data: locations }] = await Promise.all([
    supabase.from("listing_images").select("id, path, alt, sort_order, is_cover").eq(c.col, id).order("sort_order"),
    supabase.from("locations").select("id, name").order("sort_order").order("name"),
  ]);

  return (
    <div className="space-y-12">
      <div>
        <Link href={c.href} className="nav-link text-sm tracking-widest">{c.back}</Link>
        <h1 className="mt-5 text-3xl">{row.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {row.status === "published" ? (
            c.publicBase ? (
              <>
                Live on the website.{" "}
                <Link href={`${c.publicBase}${row.slug}`} target="_blank" className="underline decoration-line underline-offset-4 hover:decoration-accent">
                  View it
                </Link>
              </>
            ) : (
              "Published. Tour pages on the website are added in a later step."
            )
          ) : row.status === "draft" ? (
            "Draft: guests cannot see this yet. Set the status to Published when it is ready."
          ) : (
            "Archived: hidden from guests."
          )}
        </p>
        {created && (
          <p role="status" className="mt-4 border-l border-accent pl-4 text-sm">
            Created. Now add photos below, then set the status to Published when you are ready.
          </p>
        )}
      </div>

      <PhotoManager kind={kind} listingId={id} initial={images ?? []} />
      <ListingForm kind={kind} initial={row} locations={locations ?? []} />

      <section className="border-t border-line pt-8">
        <DeleteListing kind={kind} id={id} title={row.title} />
      </section>
    </div>
  );
}
