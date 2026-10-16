import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import { imageUrl } from "@/lib/format";

export type ListingRow = {
  id: string;
  title: string;
  status: string;
  featured: boolean;
  location: string;
  price: string;
  photos: number;
  cover: string | null;
};

const badge: Record<string, string> = {
  published: "bg-accent text-on-accent",
  draft: "border border-accent text-fg",
  archived: "border border-line text-muted",
};

function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 text-xs capitalize tracking-wider ${badge[status] ?? ""}`}>
      {status}
    </span>
  );
}

export default function ListingList({ rows, base }: { rows: ListingRow[]; base: string }) {
  return (
    <>
      <ul className="space-y-3 md:hidden">
        {rows.map((r) => (
          <li key={r.id}>
            <Link
              href={`${base}/${r.id}`}
              className="flex gap-4 border border-line p-3 transition-colors hover:border-accent active:bg-accent/10"
            >
              <div className="relative h-24 w-28 shrink-0 overflow-hidden bg-surface">
                {r.cover ? (
                  <Image src={imageUrl(r.cover)} alt="" fill sizes="7rem" className="object-cover" />
                ) : (
                  <span className="grid h-full place-items-center text-xs text-muted">No photo</span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-base">{r.title}</p>
                    <Icon name="next" size={16} className="mt-1 shrink-0 text-muted" />
                  </div>
                  <p className="mt-1 truncate text-sm text-muted">{r.location}</p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <Badge status={r.status} />
                  <span>{r.price}</span>
                  <span>{r.photos} {r.photos === 1 ? "photo" : "photos"}</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto border-y border-line md:block">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-3 pr-4 font-normal">Name</th>
              <th className="py-3 pr-4 font-normal">Location</th>
              <th className="py-3 pr-4 font-normal">Price</th>
              <th className="py-3 pr-4 font-normal">Photos</th>
              <th className="py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="py-3 pr-4">
                  <Link href={`${base}/${r.id}`} className="underline decoration-line underline-offset-4 hover:decoration-accent">
                    {r.title}
                  </Link>
                  {r.featured && <span className="ml-2 text-xs text-muted">on home page</span>}
                </td>
                <td className="py-3 pr-4 text-muted">{r.location}</td>
                <td className="whitespace-nowrap py-3 pr-4">{r.price}</td>
                <td className="py-3 pr-4">{r.photos}</td>
                <td className="py-3"><Badge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
