import type { Metadata } from "next";
import ListingEdit from "@/components/admin/ListingEdit";

export const metadata: Metadata = { title: "Edit" };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  return <ListingEdit kind="tour" id={id} created={!!created} />;
}
