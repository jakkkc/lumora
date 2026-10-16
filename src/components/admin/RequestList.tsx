import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import StatusBadge from "./StatusBadge";

export type RequestRow = {
  id: string;
  reference: string;
  kind: "stay" | "ride" | "tour";
  starts_on: string;
  ends_on: string;
  full_name: string;
  status: string;
  created_at: string;
  drive_type?: "self_drive" | "chauffeured" | null;
  property: { title: string } | null;
  vehicle: { title: string } | null;
  tour: { title: string } | null;
};

const KIND_ICON: Record<string, IconName> = { stay: "home", ride: "car", tour: "compass" };
const KIND_NAME: Record<string, string> = { stay: "Stay", ride: "Ride", tour: "Tour" };

const short = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const received = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const nameOf = (r: RequestRow) => r.property?.title ?? r.vehicle?.title ?? r.tour?.title ?? "Removed listing";
const datesOf = (r: RequestRow) =>
  r.starts_on === r.ends_on ? short(r.starts_on) : `${short(r.starts_on)} to ${short(r.ends_on)}`;

export default function RequestList({ rows, showReceived = true }: { rows: RequestRow[]; showReceived?: boolean }) {
  return (
    <>
      <ul className="space-y-3 md:hidden">
        {rows.map((r) => (
          <li key={r.id}>
            <Link
              href={`/admin/requests/${r.id}`}
              className="block border border-line p-4 transition-colors hover:border-accent active:bg-accent/10"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="tracking-widest">{r.reference}</p>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-3 text-base">{r.full_name}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                <Icon name={KIND_ICON[r.kind]} size={15} />
                <span className="min-w-0 truncate">
                  {nameOf(r)}
                  {r.drive_type === "chauffeured" ? ", chauffeured" : ""}
                </span>
              </p>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 text-xs text-muted">
                <span>
                  {datesOf(r)}
                  {showReceived ? `, received ${received(r.created_at)}` : ""}
                </span>
                <Icon name="next" size={16} />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto border-y border-line md:block">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-3 pr-4 font-normal">Reference</th>
              <th className="py-3 pr-4 font-normal">Guest</th>
              <th className="py-3 pr-4 font-normal">For</th>
              <th className="py-3 pr-4 font-normal">Dates</th>
              {showReceived && <th className="py-3 pr-4 font-normal">Received</th>}
              <th className="py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="py-3 pr-4 tracking-wider">
                  <Link
                    href={`/admin/requests/${r.id}`}
                    className="underline decoration-line underline-offset-4 hover:decoration-accent"
                  >
                    {r.reference}
                  </Link>
                </td>
                <td className="py-3 pr-4">{r.full_name}</td>
                <td className="py-3 pr-4">
                  {nameOf(r)}
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                    <Icon name={KIND_ICON[r.kind]} size={13} />
                    {KIND_NAME[r.kind]}
                    {r.drive_type === "chauffeured" ? ", chauffeured" : ""}
                  </span>
                </td>
                <td className="whitespace-nowrap py-3 pr-4">{datesOf(r)}</td>
                {showReceived && (
                  <td className="whitespace-nowrap py-3 pr-4 text-muted">{received(r.created_at)}</td>
                )}
                <td className="py-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
