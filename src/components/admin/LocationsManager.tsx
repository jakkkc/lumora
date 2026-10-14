"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import Icon, { type IconName } from "@/components/Icon";
import ThemedSelect from "@/components/ThemedSelect";
import {
  deleteLocation,
  deletePoint,
  saveLocation,
  savePoint,
  type FormState,
} from "@/app/admin/(panel)/locations/actions";

type Point = {
  id: string;
  location_id: string;
  name: string;
  kind: "airport" | "sgr" | "other";
  stay_fee: number | null;
  ride_fee: number | null;
  sort_order: number;
  active: boolean;
};
type Loc = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  active: boolean;
  transfer_points: Point[];
};

const box = "w-full border border-line bg-transparent px-3 py-2 text-sm focus:border-accent focus:outline-none";
const lab = "mb-1 block text-xs tracking-widest text-muted";
const primary =
  "bg-accent px-5 py-2.5 text-xs tracking-widest text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50";
const quiet =
  "inline-flex items-center gap-2 border border-line px-4 py-2.5 text-xs tracking-widest text-muted transition-colors hover:border-accent hover:text-fg disabled:opacity-50";

const KINDS: [string, string][] = [
  ["airport", "Airport"],
  ["sgr", "SGR train station"],
  ["other", "Other"],
];
const kindIcon: Record<string, IconName> = { airport: "plane", sgr: "train", other: "pin" };

function Status({ state }: { state: FormState }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm underline decoration-accent underline-offset-4">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p role="status" className="inline-flex items-center gap-1.5 text-sm text-muted">
        <Icon name="check" size={14} /> Saved
      </p>
    );
  return null;
}

function LocationForm({ loc }: { loc?: Loc }) {
  const uid = useId();
  const [state, action, pending] = useActionState<FormState, FormData>(saveLocation, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && !loc) ref.current?.reset();
  }, [state, loc]);

  return (
    <form ref={ref} action={action} className="flex flex-wrap items-end gap-4">
      {loc && <input type="hidden" name="id" value={loc.id} />}
      <div className="w-full sm:w-64">
        <label htmlFor={`${uid}-n`} className={lab}>Name</label>
        <input id={`${uid}-n`} name="name" required defaultValue={loc?.name} className={box} />
      </div>
      <div className="w-24">
        <label htmlFor={`${uid}-o`} className={lab}>Order</label>
        <input id={`${uid}-o`} name="sort_order" type="number" defaultValue={loc?.sort_order ?? 0} className={box} />
      </div>
      {loc && (
        <label className="flex items-center gap-2 pb-2.5 text-sm">
          <input type="checkbox" name="active" defaultChecked={loc.active} className="h-4 w-4 accent-[var(--accent)]" />
          Shown on the website
        </label>
      )}
      <button disabled={pending} className={primary}>
        {pending ? "Saving..." : loc ? "Save" : "Add location"}
      </button>
      <div className="w-full">
        <Status state={state} />
      </div>
    </form>
  );
}

function PointForm({ locationId, point }: { locationId: string; point?: Point }) {
  const uid = useId();
  const [state, action, pending] = useActionState<FormState, FormData>(savePoint, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && !point) ref.current?.reset();
  }, [state, point]);

  return (
    <form ref={ref} action={action} className="space-y-4">
      {point && <input type="hidden" name="id" value={point.id} />}
      <input type="hidden" name="location_id" value={locationId} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.6fr_1.2fr_1fr_1fr_5rem]">
        <div>
          <label htmlFor={`${uid}-n`} className={lab}>Name</label>
          <input id={`${uid}-n`} name="name" required defaultValue={point?.name} className={box} placeholder="Moi International Airport" />
        </div>
        <div>
          <label htmlFor={`${uid}-k`} className={lab}>Type</label>
          <ThemedSelect id={`${uid}-k`} name="kind" defaultValue={point?.kind ?? "airport"} options={KINDS} className={box} />
        </div>
        <div>
          <label htmlFor={`${uid}-s`} className={lab}>Stay transfer fee</label>
          <input id={`${uid}-s`} name="stay_fee" type="number" min={0} step="1" defaultValue={point?.stay_fee ?? ""} className={box} placeholder="Not offered" />
        </div>
        <div>
          <label htmlFor={`${uid}-r`} className={lab}>Car delivery fee</label>
          <input id={`${uid}-r`} name="ride_fee" type="number" min={0} step="1" defaultValue={point?.ride_fee ?? ""} className={box} placeholder="Not offered" />
        </div>
        <div>
          <label htmlFor={`${uid}-o`} className={lab}>Order</label>
          <input id={`${uid}-o`} name="sort_order" type="number" defaultValue={point?.sort_order ?? 0} className={box} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {point && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={point.active} className="h-4 w-4 accent-[var(--accent)]" />
            Shown to guests
          </label>
        )}
        <button disabled={pending} className={primary}>
          {pending ? "Saving..." : point ? "Save" : "Add pickup point"}
        </button>
        <Status state={state} />
      </div>
    </form>
  );
}

function RemoveForm({
  action,
  id,
  label,
  confirmText,
}: {
  action: (p: FormState, fd: FormData) => Promise<FormState>;
  id: string;
  label: string;
  confirmText: string;
}) {
  const [state, run, pending] = useActionState<FormState, FormData>(action, {});
  return (
    <form
      action={run}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
      className="flex flex-wrap items-center gap-3"
    >
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className={quiet}>
        <Icon name="trash" size={14} /> {label}
      </button>
      {state.error && (
        <p role="alert" className="text-sm underline decoration-accent underline-offset-4">
          {state.error}
        </p>
      )}
    </form>
  );
}

export default function LocationsManager({ locations }: { locations: Loc[] }) {
  return (
    <div className="space-y-14">
      <section aria-labelledby="add-loc" className="space-y-4">
        <h2 id="add-loc" className="text-xl">add a location</h2>
        <LocationForm />
      </section>

      {locations.map((loc) => (
        <section key={loc.id} className="space-y-6 border-t border-line pt-8" aria-labelledby={`loc-${loc.id}`}>
          <div className="flex items-center gap-3">
            <Icon name="pin" size={22} />
            <h2 id={`loc-${loc.id}`} className="text-2xl">{loc.name}</h2>
            {!loc.active && <span className="text-xs tracking-wider text-muted">hidden</span>}
          </div>

          <LocationForm loc={loc} />

          <div>
            <h3 className="text-lg">pickup points</h3>
            <p className="mb-4 mt-1 max-w-xl text-xs text-muted">
              Airports and train stations where guests can be met. Fees are per trip, one way, in KES. Leave a fee
              empty if that service is not offered at that point.
            </p>

            {loc.transfer_points.length === 0 ? (
              <p className="text-sm text-muted">No pickup points yet.</p>
            ) : (
              <div className="divide-y divide-line border-y border-line">
                {loc.transfer_points.map((p) => (
                  <div key={p.id} className="space-y-4 py-5">
                    <p className="flex items-center gap-2 text-sm">
                      <Icon name={kindIcon[p.kind]} size={18} />
                      {p.name}
                    </p>
                    <PointForm locationId={loc.id} point={p} />
                    <RemoveForm
                      action={deletePoint}
                      id={p.id}
                      label="Remove this point"
                      confirmText={`Remove "${p.name}"?`}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 space-y-4">
              <h4 className="text-base">add a pickup point</h4>
              <PointForm locationId={loc.id} />
            </div>
          </div>

          <RemoveForm
            action={deleteLocation}
            id={loc.id}
            label="Delete this location"
            confirmText={`Delete "${loc.name}" and its pickup points?`}
          />
        </section>
      ))}
    </div>
  );
}
