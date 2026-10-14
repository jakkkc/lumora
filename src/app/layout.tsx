import type { Metadata, Viewport } from "next";
import { Jost, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SiteChrome from "@/components/SiteChrome";
import ServiceWorker from "@/components/ServiceWorker";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  weight: ["300", "400", "500"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: "Lumora | Stays and rides on the Kenyan coast", template: "%s | Lumora" },
  description:
    "Luxury apartments and cars for hire in Mombasa and along the Kenyan coast. Send a request and our team will confirm it with you.",
  applicationName: "Lumora",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Lumora", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF8F3" },
    { media: "(prefers-color-scheme: dark)", color: "#1B2A41" },
  ],
};

const themeScript = `(function(){try{var t=localStorage.getItem('lumora-theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jost.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <head>
        <script
          suppressHydrationWarning
          type={typeof window === "undefined" ? undefined : "application/json"}
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <SiteChrome header={<Header />} footer={<Footer />}>
          {children}
        </SiteChrome>
        <ServiceWorker />
      </body>
    </html>
  );
}
