import type { Metadata } from "next";
import ListingIndex from "@/components/admin/ListingIndex";

export const metadata: Metadata = { title: "Stays" };

export default function Page() {
  return <ListingIndex kind="stay" />;
}
