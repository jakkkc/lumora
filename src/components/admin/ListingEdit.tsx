import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import DeleteListing from "./DeleteListing";
import ListingForm from "./ListingForm";
import PhotoManager from "./PhotoManager";

export default async function ListingEdit({
  kind,
  id,
  created,
}: {
  kind: "stay" | "ride";
  id: string;
  created?: boolean;
}) {
  const supabase = await supabaseServer();
  const isStay = kind === "stay";
  const { data: row } = await supabase
    .from(isStay ? "properties" : "vehicles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!row) notFound();

  const { data: images } = await supabase
    .from("listing_images")
    .select("id, path, alt, sort_order, is_cover")
    .eq(isStay ? "property_id" : "vehicle_id", id)
    .order("sort_order");

  const publicHref = `${isStay ? "/stays/" : "/rides/"}${row.slug}`;

  return (
    <div className="space-y-12">
      <div>
        <Link href={isStay ? "/admin/stays" : "/admin/rides"} className="nav-link text-sm tracking-widest">
          {isStay ? "All stays" : "All rides"}
        </Link>
        <h1 className="mt-5 text-3xl">{row.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {row.status === "published" ? (
            <>
              Live on the website.{" "}
              <Link href={publicHref} target="_blank" className="underline decoration-line underline-offset-4 hover:decoration-accent">
                View it
              </Link>
            </>
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
      <ListingForm kind={kind} initial={row} />

      <section className="border-t border-line pt-8">
        <DeleteListing kind={kind} id={id} title={row.title} />
      </section>
    </div>
  );
}
