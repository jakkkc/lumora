"use client";

import Image from "next/image";
import { useState } from "react";
import { Mark } from "./Logo";
import { imageUrl } from "@/lib/format";

type Img = { path: string; alt: string | null };

export default function Gallery({ images, title }: { images: Img[]; title: string }) {
  const [i, setI] = useState(0);

  if (images.length === 0) {
    return (
      <div className="grid aspect-[4/3] place-items-center bg-surface" aria-hidden="true">
        <Mark className="h-32 w-32 text-accent opacity-30" />
      </div>
    );
  }

  const current = images[i];

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        <Image
          key={current.path}
          src={imageUrl(current.path)}
          alt={current.alt ?? title}
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-3">
          {images.map((im, n) => (
            <button
              key={im.path}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Show photo ${n + 1} of ${images.length}`}
              aria-current={n === i}
              className={`relative aspect-[4/3] overflow-hidden bg-surface transition-opacity ${
                n === i ? "opacity-100 ring-1 ring-accent" : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={imageUrl(im.path)} alt="" fill sizes="12vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
