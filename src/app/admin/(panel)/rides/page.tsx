import type { Metadata } from "next";
import ListingIndex from "@/components/admin/ListingIndex";

export const metadata: Metadata = { title: "Rides" };

export default function Page() {
  return <ListingIndex kind="ride" />;
}
