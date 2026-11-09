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
import { AnimatedMark } from "@/components/Logo";

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
          mode="navigate"
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
            <p className="mt-3 flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-sm">
              <span className="h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden="true" />
              Add your dates above to see only what is free.
            </p>
          )}

          {count === 0 ? (
            <div className="soft-card mt-8 p-8 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface">
                <AnimatedMark className="h-9 w-9 text-accent opacity-70" />
              </div>
              <p className="mt-5 font-serif text-xl italic">
                {q.hasDates ? "Nothing is free for those dates." : "Nothing matches those filters."}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                {q.hasDates
                  ? "Try other dates, or look without dates and decide later."
                  : "Try clearing the filters, or look somewhere else."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm tracking-widest">
                {q.hasDates && (
                  <Link
                    href={"/" + WORD[type] + (q.location ? "?location=" + q.location : "")}
                    className="border border-accent px-5 py-2.5 transition-colors hover:bg-accent/15"
                  >
                    Look without dates
                  </Link>
                )}
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-accent px-5 py-2.5 text-on-accent transition-opacity hover:opacity-90"
                >
                  Ask us on WhatsApp
                </a>
              </div>
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
