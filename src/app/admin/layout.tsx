import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/admin-manifest",
  appleWebApp: { capable: true, title: "Lumora Admin", statusBarStyle: "default" },
  icons: { apple: "/pwa-icon/admin-180" },
  robots: { index: false, follow: false },
};

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
