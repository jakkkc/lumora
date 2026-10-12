"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Shows the public header and footer everywhere except the admin area.
export default function SiteChrome({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const admin = usePathname().startsWith("/admin");
  return (
    <>
      {!admin && header}
      <main className="flex-1">{children}</main>
      {!admin && footer}
    </>
  );
}
