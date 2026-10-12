import type { Metadata } from "next";
import ListingNew from "@/components/admin/ListingNew";

export const metadata: Metadata = { title: "Add" };

export default function Page() {
  return <ListingNew kind="stay" />;
}
