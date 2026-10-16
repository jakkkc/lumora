"use client";

import dynamic from "next/dynamic";
import ThemedSelect from "@/components/ThemedSelect";
import { money } from "@/lib/format";
import type { Pin } from "./LocationPicker";

const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="grid h-64 place-items-center border border-line text-xs text-muted">Loading map</div>
  ),
});

export type DeliveryMode = "none" | "point" | "custom";
export type DeliveryPoint = { id: string; name: string; kind: "airport" | "sgr" | "other"; fee: number };
export type DeliveryValue = { mode: DeliveryMode; pointId: string; time: string; details: string; pin: Pin | null };

const box =
  "w-full border border-line bg-transparent px-3 py-2.5 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none";
const lab = "mb-1.5 block text-xs tracking-widest text-muted";

type Props = {
  name: "pickup" | "dropoff";
  title: string;
  timeLabel: string;
  labels: Record<DeliveryMode, string>;
  points: DeliveryPoint[];
  value: DeliveryValue;
  onChange: (v: DeliveryValue) => void;
  currency: string;
};

export default function DeliveryBlock({ name, title, timeLabel, labels, points, value, onChange, currency }: Props) {
  const point = points.find((p) => p.id === value.pointId) ?? points[0];
  const modes: DeliveryMode[] = points.length > 0 ? ["none", "point", "custom"] : ["none", "custom"];
  const pin = value.pin;

  return (
    <fieldset className="border-t border-line pt-4">
      <legend className="sr-only">{title}</legend>
      <p className="mb-3 text-xs tracking-widest text-muted">{title}</p>

      <div className="space-y-2.5">
        {modes.map((m) => (
          <label key={m} className="flex items-center gap-3 text-sm">
            <input
              type="radio"
              name={`${name}_choice`}
              checked={value.mode === m}
              onChange={() => onChange({ ...value, mode: m, pointId: value.pointId || points[0]?.id || "" })}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {labels[m]}
          </label>
        ))}
      </div>

      <input type="hidden" name={`${name}_mode`} value={value.mode} />
      {value.mode === "point" && <input type="hidden" name={`${name}_point_id`} value={point?.id ?? ""} />}
      {value.mode === "custom" && pin && (
        <>
          <input type="hidden" name={`${name}_lat`} value={pin.lat} />
          <input type="hidden" name={`${name}_lng`} value={pin.lng} />
        </>
      )}

      {value.mode === "point" && point && (
        <div className="mt-4">
          <label htmlFor={`${name}-where`} className={lab}>Where</label>
          <ThemedSelect
            id={`${name}-where`}
            name={`${name}_where`}
            defaultValue={point.id}
            onChange={(v) => onChange({ ...value, pointId: v })}
            className={box}
            options={points.map((p): [string, string] => [p.id, p.name])}
          />
          <p className="mt-1 text-xs text-muted">{money(point.fee, currency)} one way</p>
        </div>
      )}

      {value.mode === "custom" && (
        <div className="mt-4 space-y-4">
          <LocationPicker value={pin} onChange={(p) => onChange({ ...value, pin: p })} />
          {pin && (
            <div>
              <label htmlFor={`${name}-address`} className={lab}>Address or landmark</label>
              <input
                id={`${name}-address`}
                name={`${name}_address`}
                type="text"
                maxLength={300}
                value={pin.address}
                onChange={(e) => onChange({ ...value, pin: { ...pin, address: e.target.value } })}
                className={box}
                placeholder="Hotel name, gate or house number"
              />
            </div>
          )}
          <p className="text-xs text-muted">
            We will confirm the delivery price with you on WhatsApp before anything is charged.
          </p>
        </div>
      )}

      {value.mode !== "none" && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${name}-time`} className={lab}>{timeLabel}</label>
            <input
              id={`${name}-time`}
              name={`${name}_time`}
              type="time"
              required
              value={value.time}
              onChange={(e) => onChange({ ...value, time: e.target.value })}
              className={box}
            />
          </div>
          <div>
            <label htmlFor={`${name}-details`} className={lab}>
              {value.mode === "point" ? "Flight or train no." : "Notes for the driver"}
            </label>
            <input
              id={`${name}-details`}
              name={`${name}_flight`}
              type="text"
              maxLength={80}
              value={value.details}
              onChange={(e) => onChange({ ...value, details: e.target.value })}
              className={box}
              placeholder={value.mode === "point" ? "KQ 612" : "Gate B, ask for Sam"}
            />
          </div>
        </div>
      )}
    </fieldset>
  );
}
