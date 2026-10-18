import Link from "next/link";
import { PRESETS, type Range } from "@/lib/accounts";

const box = "border border-line bg-transparent px-3 py-2.5 text-sm focus:border-accent focus:outline-none";
const lab = "mb-1.5 block text-xs tracking-widest text-muted";

export default function DateFilter({ range, view }: { range: Range; view: string }) {
  return (
    <div className="space-y-5">
      <nav
        aria-label="Date range"
        className="-mx-5 flex gap-x-6 overflow-x-auto whitespace-nowrap px-5 text-sm sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {PRESETS.map((p) => (
          <Link
            key={p.key}
            href={`/admin/accounts?range=${p.key}&view=${view}`}
            aria-current={range.preset === p.key ? "page" : undefined}
            className={`nav-link tracking-wider ${range.preset === p.key ? "" : "text-muted"}`}
          >
            {p.label}
          </Link>
        ))}
      </nav>

      <form action="/admin/accounts" method="get" className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="view" value={view} />
        <div>
          <label htmlFor="from" className={lab}>From</label>
          <input id="from" name="from" type="date" required defaultValue={range.from} className={box} />
        </div>
        <div>
          <label htmlFor="to" className={lab}>To</label>
          <input id="to" name="to" type="date" required defaultValue={range.to} className={box} />
        </div>
        <button className="border border-accent px-5 py-2.5 text-sm tracking-widest transition-colors hover:bg-accent/15">
          Show
        </button>
      </form>
    </div>
  );
}
