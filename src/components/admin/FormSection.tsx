"use client";

import { useEffect, useRef } from "react";
import Icon from "@/components/Icon";

/**
 * A form section. On a computer it is always open. On a phone it is a card that opens and closes.
 * openOnPhone keeps a section open at first, for sections with required fields.
 */
export default function FormSection({
  title,
  openOnPhone = false,
  children,
}: {
  title: string;
  openOnPhone?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const wide = window.matchMedia("(min-width: 768px)");
    if (!wide.matches && !openOnPhone) el.open = false;
    // if the screen becomes wide later, make sure nothing stays hidden
    const sync = () => {
      if (wide.matches) el.open = true;
    };
    wide.addEventListener("change", sync);
    return () => wide.removeEventListener("change", sync);
  }, [openOnPhone]);

  return (
    <details ref={ref} open className="group border border-line md:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 md:pointer-events-none md:cursor-default md:border-b md:border-line md:p-0 md:pb-2 [&::-webkit-details-marker]:hidden">
        <h2 className="text-xl">{title}</h2>
        <Icon name="chevron" size={18} className="shrink-0 transition-transform duration-200 group-open:rotate-180 md:hidden" />
      </summary>
      <div className="grid gap-5 border-t border-line p-4 sm:grid-cols-2 md:border-0 md:p-0 md:pt-5">{children}</div>
    </details>
  );
}
