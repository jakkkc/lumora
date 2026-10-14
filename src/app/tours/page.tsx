import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ResultsPage from "@/components/search/ResultsPage";
import { TOURS_READY } from "@/lib/config";
import type { RawParams } from "@/lib/search";

export const metadata: Metadata = {
  title: "Tours",
  description: "Tours and local guides on the Kenyan coast.",
};

export default function Page({ searchParams }: { searchParams: Promise<RawParams> }) {
  if (!TOURS_READY) notFound();
  return <ResultsPage type="tour" searchParams={searchParams} />;
}
