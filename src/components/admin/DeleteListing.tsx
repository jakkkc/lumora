"use client";

import { deleteListing } from "@/app/admin/(panel)/listing-actions";

export default function DeleteListing({ kind, id, title }: { kind: "stay" | "ride" | "tour"; id: string; title: string }) {
  return (
    <form
      action={deleteListing}
      onSubmit={(e) => {
        if (!confirm(`Delete "${title}" and all its photos? This cannot be undone. Booking requests are kept.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <button className="border border-line px-5 py-3 text-sm tracking-widest text-muted transition-colors hover:border-accent hover:text-fg">
        Delete this listing
      </button>
    </form>
  );
}
