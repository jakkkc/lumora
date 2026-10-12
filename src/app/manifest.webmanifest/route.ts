export const dynamic = "force-static";

export function GET() {
  const manifest = {
    id: "/",
    name: "Lumora",
    short_name: "Lumora",
    description: "Luxury stays and rides on the Kenyan coast.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1B2A41",
    theme_color: "#1B2A41",
    lang: "en",
    categories: ["travel", "lifestyle"],
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Browse stays", url: "/stays" },
      { name: "Browse rides", url: "/rides" },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
}
