"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import { money } from "@/lib/format";

type Type = "stay" | "ride" | "tour";
type Props = { type: Type; categories: string[]; priceMin: number; priceMax: number; currency: string };

const SEATS: [string, string][] = [["", "Any"], ["2", "2+"], ["5", "5+"], ["7", "7+"]];
const BEDS: [string, string][] = [["", "Any"], ["1", "1+"], ["2", "2+"], ["3", "3+"]];
const GUESTS: [string, string][] = [["", "Any"], ["2", "2+"], ["4", "4+"], ["6", "6+"]];
const TOUR_TYPES: [string, string][] = [["", "Any"], ["fixed", "Fixed tour"], ["guide", "Guide by the day"]];

function Seg({
  label, options, value, onPick,
}: { label: string; options: [string, string][]; value: string; onPick: (v: string) => void }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 text-xs tracking-widest text-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, l]) => (
          <button
            key={v || "any"} type="button" aria-pressed={value === v} onClick={() => onPick(v)}
            className={`border px-3 py-2 text-xs transition-colors ${
              value === v ? "border-accent bg-accent/15 text-fg" : "border-line text-muted hover:border-accent hover:text-fg"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function SearchFilters({ type, categories, priceMin, priceMax, currency }: Props) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const fromUrl = Number(sp.get("max")) || priceMax;
  const [price, setPrice] = useState(fromUrl);
  useEffect(() => setPrice(Number(sp.get("max")) || priceMax), [sp, priceMax]);

  const cats = (sp.get("cat") ?? "").split(",").filter(Boolean);

  function update(changes: Record<string, string | null>) {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") p.delete(k);
      else p.set(k, v);
    }
    const q = p.toString();
    router.replace(q ? `${path}?${q}` : path, { scroll: false });
  }

  const commitPrice = () => update({ max: price >= priceMax ? null : String(price) });
  const toggleCat = (c: string) => {
    const next = cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c];
    update({ cat: next.length ? next.join(",") : null });
  };

  return (
    <aside aria-label="Filters" className="lg:sticky lg:top-24 lg:self-start">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 border border-line px-5 py-3 text-sm tracking-widest lg:hidden"
      >
        <Icon name={open ? "close" : "filter"} size={16} />
        {open ? "Hide filters" : "Filters"}
      </button>

      <div className={`${open ? "mt-4 block" : "hidden"} space-y-8 border border-line p-5 lg:mt-0 lg:block`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg">filters</h2>
          <button
            type="button"
            onClick={() => update({ max: null, cat: null, seats: null, beds: null, guests: null, ttype: null })}
            className="text-xs tracking-widest text-muted underline decoration-line underline-offset-4 hover:decoration-accent"
          >
            Clear
          </button>
        </div>

        {priceMax > priceMin && (
          <div>
            <label htmlFor="max-price" className="mb-3 block text-xs tracking-widest text-muted">
              {type === "stay" ? "MAX PRICE PER NIGHT" : type === "ride" ? "MAX PRICE PER DAY" : "MAX PRICE"}
            </label>
            <input
              id="max-price" type="range" min={priceMin} max={priceMax} step={100} value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              onPointerUp={commitPrice} onKeyUp={commitPrice} onBlur={commitPrice}
              className="w-full accent-[var(--accent)]"
            />
            <p className="mt-2 flex justify-between text-xs text-muted">
              <span>{money(priceMin, currency)}</span>
              <span className="text-fg">Up to {money(price, currency)}</span>
            </p>
          </div>
        )}

        {type === "ride" && categories.length > 0 && (
          <fieldset>
            <legend className="mb-3 text-xs tracking-widest text-muted">VEHICLE TYPE</legend>
            <div className="space-y-2.5">
              {categories.map((c) => (
                <label key={c} className="flex items-center gap-3 text-sm">
                  <input type="checkbox" checked={cats.includes(c)} onChange={() => toggleCat(c)} className="h-4 w-4 accent-[var(--accent)]" />
                  {c}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {type === "ride" && <Seg label="SEATS" options={SEATS} value={sp.get("seats") ?? ""} onPick={(v) => update({ seats: v })} />}
        {type === "stay" && <Seg label="BEDROOMS" options={BEDS} value={sp.get("beds") ?? ""} onPick={(v) => update({ beds: v })} />}
        {type === "stay" && <Seg label="GUESTS" options={GUESTS} value={sp.get("guests") ?? ""} onPick={(v) => update({ guests: v })} />}
        {type === "tour" && <Seg label="TOUR TYPE" options={TOUR_TYPES} value={sp.get("ttype") ?? ""} onPick={(v) => update({ ttype: v })} />}
      </div>
    </aside>
  );
}
