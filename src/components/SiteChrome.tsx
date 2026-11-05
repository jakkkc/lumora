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
      <main className={admin ? "flex-1" : "flex-1 soft"}>{children}</main>
      {!admin && footer}
    </>
  );
}
