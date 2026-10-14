import type { Metadata } from "next";
import ResultsPage from "@/components/search/ResultsPage";
import type { RawParams } from "@/lib/search";

export const metadata: Metadata = {
  title: "Rides",
  description: "Well-kept cars for hire in Mombasa and along the Kenyan coast, self-drive or with a chauffeur.",
};

export default function Page({ searchParams }: { searchParams: Promise<RawParams> }) {
  return <ResultsPage type="ride" searchParams={searchParams} />;
}
