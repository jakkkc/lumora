import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Mark } from "@/components/Logo";
import { imageUrl } from "@/lib/format";

type Props = {
  href: string;
  image?: { path: string; alt: string | null } | null;
  title: string;
  subtitle?: string;
  meta?: string;
  controls?: ReactNode;
  price: string;
  unit: string;
  note?: string;
  warn?: string;
  cta?: string;
};

export default function ResultShell(p: Props) {
  return (
    <article className="grid gap-5 border border-line p-5 sm:grid-cols-[1fr_13rem] sm:p-6">
      <div className="order-2 flex flex-col sm:order-1">
        <h3 className="text-xl tracking-wide">
          <Link href={p.href} className="transition-colors hover:text-accent-strong">{p.title}</Link>
        </h3>
        {p.subtitle && <p className="mt-1 text-sm text-muted">{p.subtitle}</p>}
        {p.meta && <p className="mt-1 text-sm text-muted">{p.meta}</p>}
        {p.controls && <div className="mt-5">{p.controls}</div>}

        <div className="mt-6 flex items-end justify-between gap-4 border-t border-line pt-4">
          <div>
            <p>
              <span className="text-2xl">{p.price}</span>
              <span className="text-sm text-muted">{p.unit}</span>
            </p>
            {p.note && <p className="text-xs text-muted">{p.note}</p>}
            {p.warn && <p className="mt-1 text-xs underline decoration-accent underline-offset-4">{p.warn}</p>}
          </div>
          <Link
            href={p.href}
            className="border border-accent px-5 py-2.5 text-sm tracking-widest transition-colors hover:bg-accent/15"
          >
            {p.cta ?? "View"}
          </Link>
        </div>
      </div>

      <Link
        href={p.href}
        tabIndex={-1}
        aria-hidden="true"
        className="relative order-1 block aspect-[4/3] overflow-hidden bg-surface sm:order-2 sm:aspect-auto sm:min-h-[9rem]"
      >
        {p.image ? (
          <Image
            src={imageUrl(p.image.path)}
            alt=""
            fill
            sizes="(min-width: 640px) 13rem, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center">
            <Mark className="h-16 w-16 text-accent opacity-30" title="" />
          </div>
        )}
      </Link>
    </article>
  );
}
