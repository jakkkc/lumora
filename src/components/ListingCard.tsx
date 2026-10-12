import Image from "next/image";
import Link from "next/link";
import { Mark } from "./Logo";
import { imageUrl } from "@/lib/format";

type Props = {
  href: string;
  title: string;
  meta: string;
  price: string;
  unit: string;
  image?: { path: string; alt: string | null } | null;
};

export default function ListingCard({ href, title, meta, price, unit, image }: Props) {
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-surface">
        {image ? (
          <Image
            src={imageUrl(image.path)}
            alt={image.alt ?? title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center" aria-hidden="true">
            <Mark className="h-24 w-24 text-accent opacity-30" />
          </div>
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4 border-b border-line pb-4">
        <div>
          <h3 className="text-lg tracking-wider">{title}</h3>
          <p className="text-sm text-muted">{meta}</p>
        </div>
        <p className="whitespace-nowrap text-right">
          <span className="text-base">{price}</span>
          <span className="block text-xs text-muted">{unit}</span>
        </p>
      </div>
    </Link>
  );
}
