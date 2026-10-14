import type { Metadata } from "next";
import ListingIndex from "@/components/admin/ListingIndex";

export const metadata: Metadata = { title: "Tours" };

export default function Page() {
  return <ListingIndex kind="tour" />;
}
