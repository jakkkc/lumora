import type { Metadata } from "next";
import ResultsPage from "@/components/search/ResultsPage";
import type { RawParams } from "@/lib/search";

export const metadata: Metadata = {
  title: "Stays",
  description: "Luxury apartments to rent in Mombasa and along the Kenyan coast.",
};

export default function Page({ searchParams }: { searchParams: Promise<RawParams> }) {
  return <ResultsPage type="stay" searchParams={searchParams} />;
}
