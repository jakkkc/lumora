"use client";

import Icon from "@/components/Icon";
import ThemedSelect from "@/components/ThemedSelect";
import { money } from "@/lib/format";

export type TransferPoint = { id: string; name: string; kind: "airport" | "sgr" | "other"; fee: number };
export type TransferValue = { on: boolean; pointId: string; time: string; flight: string };

const box =
  "w-full border border-line bg-transparent px-3 py-2.5 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none";
const lab = "mb-1.5 block text-xs tracking-widest text-muted";

export default function TransferBlock({
  name,
  title,
  timeLabel,
  points,
  value,
  onChange,
  currency,
}: {
  name: "pickup" | "dropoff";
  title: string;
  timeLabel: string;
  points: TransferPoint[];
  value: TransferValue;
  onChange: (v: TransferValue) => void;
  currency: string;
}) {
  const point = points.find((p) => p.id === value.pointId) ?? points[0];
  const icon = point?.kind === "sgr" ? "train" : point?.kind === "other" ? "pin" : "plane";

  return (
    <div className="border-t border-line pt-4">
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={value.on}
          onChange={(e) => onChange({ ...value, on: e.target.checked })}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        <Icon name={icon} size={18} />
        {title}
      </label>

      <input type="hidden" name={`${name}_mode`} value={value.on ? "point" : "none"} />
      <input type="hidden" name={`${name}_point_id`} value={value.on ? value.pointId : ""} />

      {value.on && point && (
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor={`${name}-point`} className={lab}>Where</label>
            <ThemedSelect
              id={`${name}-point`}
              name={`${name}_choice`}
              defaultValue={value.pointId}
              onChange={(v) => onChange({ ...value, pointId: v })}
              className={box}
              options={points.map((p): [string, string] => [p.id, p.name])}
            />
            <p className="mt-1 text-xs text-muted">{money(point.fee, currency)} one way</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${name}-time`} className={lab}>{timeLabel}</label>
              <input
                id={`${name}-time`} name={`${name}_time`} type="time" value={value.time}
                onChange={(e) => onChange({ ...value, time: e.target.value })} className={box}
              />
            </div>
            <div>
              <label htmlFor={`${name}-flight`} className={lab}>Flight or train no.</label>
              <input
                id={`${name}-flight`} name={`${name}_flight`} type="text" maxLength={80} value={value.flight}
                onChange={(e) => onChange({ ...value, flight: e.target.value })} className={box} placeholder="KQ 612"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
