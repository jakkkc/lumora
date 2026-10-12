"use client";

import { useActionState } from "react";
import { saveListing, type SaveState } from "@/app/admin/(panel)/listing-actions";

const box =
  "w-full border border-line bg-transparent px-3 py-2.5 text-sm focus:border-accent focus:outline-none";
const lab = "mb-1.5 block text-xs tracking-widest text-muted";

type FieldProps = { name: string; label: string; hint?: string; wide?: boolean; defaultValue?: string };

function Text(
  p: FieldProps & { type?: string; required?: boolean; min?: number; max?: number; step?: string; placeholder?: string }
) {
  return (
    <div className={p.wide ? "sm:col-span-2" : ""}>
      <label htmlFor={p.name} className={lab}>{p.label}</label>
      <input
        id={p.name} name={p.name} type={p.type ?? "text"} required={p.required}
        defaultValue={p.defaultValue} min={p.min} max={p.max} step={p.step}
        placeholder={p.placeholder} className={box}
      />
      {p.hint && <p className="mt-1 text-xs text-muted">{p.hint}</p>}
    </div>
  );
}

function Area(p: FieldProps & { rows?: number; placeholder?: string }) {
  return (
    <div className={p.wide ? "sm:col-span-2" : ""}>
      <label htmlFor={p.name} className={lab}>{p.label}</label>
      <textarea
        id={p.name} name={p.name} rows={p.rows ?? 4} defaultValue={p.defaultValue}
        placeholder={p.placeholder} className={box}
      />
      {p.hint && <p className="mt-1 text-xs text-muted">{p.hint}</p>}
    </div>
  );
}

function Pick(p: FieldProps & { options: [string, string][] }) {
  return (
    <div className={p.wide ? "sm:col-span-2" : ""}>
      <label htmlFor={p.name} className={lab}>{p.label}</label>
      <select id={p.name} name={p.name} defaultValue={p.defaultValue} className={box}>
        {p.options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      {p.hint && <p className="mt-1 text-xs text-muted">{p.hint}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <h2 className="border-b border-line pb-2 text-xl">{title}</h2>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export default function ListingForm({
  kind,
  initial,
}: {
  kind: "stay" | "ride";
  initial?: Record<string, unknown>;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveListing, {});
  const isStay = kind === "stay";
  const editing = !!initial?.id;
  const val = (k: string, def = "") => (initial && k in initial ? String(initial[k] ?? "") : def);
  const list = (k: string) => (Array.isArray(initial?.[k]) ? (initial![k] as string[]).join("\n") : "");

  return (
    <form action={action} className="space-y-12">
      <input type="hidden" name="kind" value={kind} />
      {editing && <input type="hidden" name="id" value={String(initial!.id)} />}
      <input type="hidden" name="currency" value={val("currency", "KES")} />

      <Section title="the basics">
        <Text name="title" label={isStay ? "Name of the apartment" : "Name of the car"} required wide defaultValue={val("title")} />
        <Text name="tagline" label="One-line tagline" wide defaultValue={val("tagline")} placeholder="A short, inviting line shown under the name" />
        {isStay ? (
          <Text name="area" label="Area" wide defaultValue={val("area")} placeholder="Nyali, Mombasa" />
        ) : (
          <>
            <Text name="category" label="Type" defaultValue={val("category")} placeholder="SUV, saloon, van" />
            <Text name="year" label="Year" type="number" min={1990} max={2100} defaultValue={val("year")} />
            <Text name="make" label="Make" defaultValue={val("make")} placeholder="Toyota" />
            <Text name="model" label="Model" defaultValue={val("model")} placeholder="Land Cruiser Prado" />
          </>
        )}
        <Area name="description" label="Description" rows={7} wide defaultValue={val("description")} hint="Blank lines make new paragraphs." />
      </Section>

      {isStay ? (
        <>
          <Section title="space and rules">
            <Text name="bedrooms" label="Bedrooms" type="number" min={0} defaultValue={val("bedrooms", "1")} />
            <Text name="bathrooms" label="Bathrooms" type="number" min={0} step="0.5" defaultValue={val("bathrooms", "1")} />
            <Text name="max_guests" label="Sleeps (guests)" type="number" min={1} defaultValue={val("max_guests", "2")} />
            <Text name="min_nights" label="Minimum nights" type="number" min={1} defaultValue={val("min_nights", "1")} />
            <Text name="check_in_time" label="Check-in time" defaultValue={val("check_in_time", "14:00")} />
            <Text name="check_out_time" label="Check-out time" defaultValue={val("check_out_time", "10:00")} />
            <Area name="amenities" label="What is included" rows={7} wide defaultValue={list("amenities")} hint="One item per line, for example: Sea-view balcony" />
            <Area name="house_rules" label="House rules" rows={4} wide defaultValue={val("house_rules")} />
          </Section>
          <Section title="price (KES)">
            <Text name="price_per_night" label="Price per night" type="number" min={0} required defaultValue={val("price_per_night")} />
            <Text name="cleaning_fee" label="Cleaning fee (once per stay)" type="number" min={0} defaultValue={val("cleaning_fee", "0")} />
          </Section>
        </>
      ) : (
        <>
          <Section title="the car">
            <Text name="seats" label="Seats" type="number" min={1} defaultValue={val("seats", "4")} />
            <Pick name="transmission" label="Gearbox" defaultValue={val("transmission", "automatic")} options={[["automatic", "Automatic"], ["manual", "Manual"]]} />
            <Text name="fuel" label="Fuel" defaultValue={val("fuel")} placeholder="Petrol, diesel, hybrid" />
            <Area name="features" label="Features" rows={6} wide defaultValue={list("features")} hint="One item per line, for example: Air conditioning" />
          </Section>
          <Section title="price and driver (KES)">
            <Text name="price_per_day" label="Price per day" type="number" min={0} required defaultValue={val("price_per_day")} />
            <Text name="deposit" label="Deposit" type="number" min={0} defaultValue={val("deposit", "0")} />
            <Pick name="driver_option" label="Driver" defaultValue={val("driver_option", "both")} options={[["both", "Self-drive or with a driver"], ["self_drive", "Self-drive only"], ["with_driver", "Driver always included"]]} />
            <Text name="driver_fee_per_day" label="Driver fee per day" type="number" min={0} defaultValue={val("driver_fee_per_day", "0")} />
          </Section>
        </>
      )}

      <Section title="publishing">
        <Pick
          name="status" label="Status" defaultValue={val("status", "draft")}
          options={[["draft", "Draft (hidden from guests)"], ["published", "Published (visible on the website)"], ["archived", "Archived (hidden, kept for records)"]]}
        />
        <Text name="sort_order" label="Display order" type="number" defaultValue={val("sort_order", "0")} hint="Lower numbers show first." />
        <Text
          name="slug" label="Web address" wide defaultValue={val("slug")} placeholder="nyali-sea-view"
          hint={editing ? "Changing this breaks links people may have saved." : "Leave blank to create it from the name."}
        />
        <label className="flex items-center gap-3 text-sm sm:col-span-2">
          <input type="checkbox" name="featured" defaultChecked={initial?.featured === true} className="h-4 w-4 accent-[var(--accent)]" />
          Show on the home page
        </label>
      </Section>

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="submit" disabled={pending}
          className="bg-accent px-8 py-3.5 text-sm tracking-widest text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving..." : editing ? "Save changes" : isStay ? "Create stay" : "Create car"}
        </button>
        {state.error && <p role="alert" className="text-sm underline decoration-accent underline-offset-4">{state.error}</p>}
        {state.saved && <p role="status" className="text-sm text-muted">Saved. The website is updated.</p>}
      </div>
    </form>
  );
}
