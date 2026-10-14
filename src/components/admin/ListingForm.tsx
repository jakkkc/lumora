"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveListing, type SaveState } from "@/app/admin/(panel)/listing-actions";
import ThemedSelect from "@/components/ThemedSelect";

type Kind = "stay" | "ride" | "tour";

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
      <ThemedSelect id={p.name} name={p.name} defaultValue={p.defaultValue} options={p.options} className={box} />
      {p.hint && <p className="mt-1 text-xs text-muted">{p.hint}</p>}
    </div>
  );
}

function Check({ name, label, hint, checked }: { name: string; label: string; hint?: string; checked: boolean }) {
  return (
    <div className="sm:col-span-2">
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name={name} defaultChecked={checked} className="h-4 w-4 accent-[var(--accent)]" />
        {label}
      </label>
      {hint && <p className="mt-1 pl-7 text-xs text-muted">{hint}</p>}
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
  locations,
}: {
  kind: Kind;
  initial?: Record<string, unknown>;
  locations: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveListing, {});
  const editing = !!initial?.id;
  const val = (k: string, def = "") => (initial && k in initial ? String(initial[k] ?? "") : def);
  const list = (k: string) => (Array.isArray(initial?.[k]) ? (initial![k] as string[]).join("\n") : "");
  const flag = (k: string, def: boolean) => (initial ? initial[k] === true : def);
  const noun = kind === "stay" ? "stay" : kind === "ride" ? "car" : "tour";

  return (
    <form action={action} className="space-y-12">
      <input type="hidden" name="kind" value={kind} />
      {editing && <input type="hidden" name="id" value={String(initial!.id)} />}
      <input type="hidden" name="currency" value={val("currency", "KES")} />

      <Section title="the basics">
        <Text name="title" label={kind === "stay" ? "Name of the apartment" : kind === "ride" ? "Name of the car" : "Name of the tour"} required wide defaultValue={val("title")} />
        <Text name="tagline" label="One line tagline" wide defaultValue={val("tagline")} placeholder="A short, inviting line shown under the name" />

        {locations.length === 0 ? (
          <p className="text-sm sm:col-span-2">
            There are no locations yet.{" "}
            <Link href="/admin/locations" className="underline decoration-accent underline-offset-4">
              Add one on the Locations page
            </Link>{" "}
            first.
          </p>
        ) : (
          <Pick
            name="location_id" label="Location" wide defaultValue={val("location_id")}
            options={locations.map((l) => [l.id, l.name])}
            hint="Guests search by location first, so this decides where the listing appears."
          />
        )}

        {kind === "stay" && (
          <Text name="area" label="Neighbourhood or estate" wide defaultValue={val("area")} placeholder="Nyali" />
        )}
        {kind === "ride" && (
          <>
            <Text name="category" label="Type" defaultValue={val("category")} placeholder="SUV, saloon, van" />
            <Text name="year" label="Year" type="number" min={1990} max={2100} defaultValue={val("year")} />
            <Text name="make" label="Make" defaultValue={val("make")} placeholder="Toyota" />
            <Text name="model" label="Model" defaultValue={val("model")} placeholder="Land Cruiser Prado" />
          </>
        )}
        <Area name="description" label="Description" rows={7} wide defaultValue={val("description")} hint="Blank lines make new paragraphs." />
      </Section>

      {kind === "stay" && (
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
          </Section>
          <Section title="airport and SGR transfers">
            <Check
              name="transfers_enabled" label="Offer pickup and drop off from the airport or SGR"
              hint="The prices are set for each place on the Locations page."
              checked={flag("transfers_enabled", true)}
            />
          </Section>
        </>
      )}

      {kind === "ride" && (
        <>
          <Section title="the car">
            <Text name="seats" label="Seats" type="number" min={1} defaultValue={val("seats", "4")} />
            <Text name="units" label="Units" type="number" min={1} defaultValue={val("units", "1")} hint="How many identical cars you have. Use 1 for a single car." />
            <Pick name="transmission" label="Gearbox" defaultValue={val("transmission", "automatic")} options={[["automatic", "Automatic"], ["manual", "Manual"]]} />
            <Text name="fuel" label="Fuel" defaultValue={val("fuel")} placeholder="Petrol, diesel, hybrid" />
            <Check
              name="or_similar" label='Show "or similar" after the name'
              hint="Use it when you may give a similar car instead. The similar car policy is shown on this car."
              checked={flag("or_similar", false)}
            />
            <Area name="features" label="Features" rows={6} wide defaultValue={list("features")} hint="One item per line, for example: Air conditioning" />
          </Section>
          <Section title="price and rules (KES)">
            <Text name="price_per_day" label="Self-drive price per day" type="number" min={0} defaultValue={val("price_per_day")} hint="Leave empty if this car is only offered with a chauffeur." />
            <Text name="chauffeur_price_per_day" label="Chauffeured price per day" type="number" min={0} defaultValue={val("chauffeur_price_per_day")} hint="Leave empty if there is no chauffeur option. This is the full price with the driver." />
            <Text name="min_days" label="Minimum days" type="number" min={1} defaultValue={val("min_days", "1")} />
            <Text name="deposit" label="Deposit" type="number" min={0} defaultValue={val("deposit", "0")} />
            <Check
              name="delivery_enabled" label="Offer delivery and collection"
              hint="At the airport, the SGR, or a place the guest picks on the map."
              checked={flag("delivery_enabled", true)}
            />
          </Section>
        </>
      )}

      {kind === "tour" && (
        <>
          <Section title="the tour">
            <Pick
              name="tour_type" label="Type" defaultValue={val("tour_type", "fixed")}
              options={[["fixed", "Fixed tour with a set itinerary"], ["guide", "Guide hired by the day"]]}
            />
            <Text name="duration_text" label="Duration" defaultValue={val("duration_text")} placeholder="Full day, about 8 hours" />
            <Text name="meeting_point" label="Meeting point" wide defaultValue={val("meeting_point")} placeholder="Fort Jesus main gate" />
            <Text name="min_people" label="Smallest group" type="number" min={1} defaultValue={val("min_people", "1")} />
            <Text name="max_group" label="Largest group" type="number" min={1} defaultValue={val("max_group", "10")} />
            <Text name="capacity_per_day" label="Groups per day" type="number" min={1} defaultValue={val("capacity_per_day", "1")} hint="How many groups can book the same day." />
            <Area name="languages" label="Languages" rows={3} defaultValue={list("languages")} hint="One per line, for example: English" />
            <Area name="includes" label="What is included" rows={5} defaultValue={list("includes")} hint="One item per line" />
            <Area name="excludes" label="What is not included" rows={5} wide defaultValue={list("excludes")} hint="One item per line, for example: Park entry fees" />
          </Section>
          <Section title="price (KES)">
            <Text name="price" label="Price" type="number" min={0} required defaultValue={val("price")} />
            <Pick
              name="price_basis" label="Price is" defaultValue={val("price_basis", "per_person")}
              options={[["per_person", "Per person"], ["per_group", "Per group"], ["per_day", "Per day for the group"]]}
              hint="For a guide hired by the day, this is always per day."
            />
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
          name="slug" label="Web address" wide defaultValue={val("slug")} placeholder={`my-${noun}`}
          hint={editing ? "Changing this breaks links people may have saved." : "Leave blank to create it from the name."}
        />
        <Check name="featured" label="Show on the home page" checked={flag("featured", false)} />
      </Section>

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="submit" disabled={pending || locations.length === 0}
          className="bg-accent px-8 py-3.5 text-sm tracking-widest text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving..." : editing ? "Save changes" : `Create ${noun}`}
        </button>
        {state.error && <p role="alert" className="text-sm underline decoration-accent underline-offset-4">{state.error}</p>}
        {state.saved && <p role="status" className="text-sm text-muted">Saved. The website is updated.</p>}
      </div>
    </form>
  );
}
