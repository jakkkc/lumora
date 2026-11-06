"use client";

import { useRef } from "react";
import Icon from "@/components/Icon";

/** An optional part of the form. It stays closed until the guest wants it, and opens by itself if a field inside needs attention. */
export default function Extras({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  return (
    <details
      ref={ref}
      className="group mt-7"
      onInvalidCapture={() => {
        if (ref.current) ref.current.open = true;
      }}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold text-xs text-navy-deep">{n}</span>
        <span className="text-sm tracking-wide">{title}</span>
        <Icon name="chevron" size={16} className="ml-auto text-muted transition-transform duration-200 group-open:rotate-180" />
      </summary>
      {hint && <p className="mt-1 pl-9 text-xs text-muted">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </details>
  );
}
