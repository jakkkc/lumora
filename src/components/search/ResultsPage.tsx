import { Suspense } from "react";
import Link from "next/link";
import { TOURS_READY } from "@/lib/config";
import { WHATSAPP_URL } from "@/lib/contact";
import { getLocations } from "@/lib/data";
import { runSearch, tripLength, type Item, type RawParams, type SearchType } from "@/lib/search";
import RideRow from "./RideRow";
import { StayRow, TourRow } from "./ResultRows";
import SearchBox from "./SearchBox";
import SearchFilters from "./SearchFilters";

const WORD: Record<SearchType, string> = { stay: "stays", ride: "rides", tour: "tours" };
const NOUN: Record<SearchType, [string, string]> = { stay: ["stay", "stays"], ride: ["car", "cars"], tour: ["tour", "tours"] };

const short = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default async function ResultsPage({
  type,
  searchParams,
}: {
  type: SearchType;
  searchParams: Promise<RawParams>;
}) {
  const raw = await searchParams;
  const [locations, { q, result }] = await Promise.all([getLocations(), runSearch(type, raw)]);

  const locName = locations.find((l) => l.slug === q.location)?.name ?? "";
  const length = tripLength(type, q);
  const qs = q.hasDates ? `?from=${q.from}&to=${q.to}` : "";
  const [one, many] = NOUN[type];
  const count = result.items.length;
  const currency = "KES";

  const sections: { name: string; items: Item[] }[] = q.location
    ? [{ name: locName, items: result.items }]
    : [
        ...locations
          .map((l) => ({ name: l.name, items: result.items.filter((i) => i.location?.slug === l.slug) }))
          .filter((g) => g.items.length > 0),
        ...(() => {
          const known = new Set(locations.map((l) => l.slug));
          const rest = result.items.filter((i) => !i.location || !known.has(i.location.slug));
          return rest.length ? [{ name: "Other", items: rest }] : [];
        })(),
      ];

  function row(item: Item) {
    if (item.kind === "stay") return <StayRow key={item.id} s={item} nights={length} qs={qs} />;
    if (item.kind === "ride") return <RideRow key={item.id} r={item} days={length} from={q.from} to={q.to} />;
    return <TourRow key={item.id} t={item} days={length} qs={qs} />;
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <h1 className="text-4xl sm:text-5xl">{WORD[type]}{locName ? ` in ${locName.toLowerCase()}` : ""}</h1>

      <div className="mt-8">
        <SearchBox
          compact
          locations={locations}
          toursReady={TOURS_READY}
          initial={{ type, location: q.location, from: q.from, to: q.hasDates ? q.to : "" }}
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[17rem_1fr]">
        <Suspense fallback={null}>
          <SearchFilters
            type={type}
            categories={result.categories}
            priceMin={result.priceMin}
            priceMax={result.priceMax}
            currency={currency}
          />
        </Suspense>

        <div>
          <p className="text-sm text-muted" aria-live="polite">
            {count} {count === 1 ? one : many} {q.hasDates ? "available" : "found"}
            {locName ? ` in ${locName}` : ""}
            {q.hasDates ? ` from ${short(q.from)} to ${short(q.to)}` : ""}
          </p>
          {!q.hasDates && (
            <p className="mt-1 text-xs text-muted">Add your dates above to see only what is free.</p>
          )}

          {count === 0 ? (
            <div className="mt-8 space-y-4 border border-line p-6">
              <p className="font-serif text-xl italic">
                {q.hasDates ? "Nothing is free for those dates." : "Nothing matches these filters."}
              </p>
              <p className="text-sm text-muted">
                Try different dates, another location, or clear the filters. You can also message us and we will
                help you find something.
              </p>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block border border-accent px-5 py-2.5 text-sm tracking-widest transition-colors hover:bg-accent/15"
              >
                Message us on WhatsApp
              </a>
              <p>
                <Link href={`/${WORD[type]}`} className="text-sm underline decoration-line underline-offset-4 hover:decoration-accent">
                  Start a new search
                </Link>
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-12">
              {sections.map((g) => (
                <section key={g.name || "all"} aria-label={g.name || undefined} className="space-y-6">
                  {!q.location && <h2 className="text-2xl">{g.name.toLowerCase()}</h2>}
                  {g.items.map(row)}
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
