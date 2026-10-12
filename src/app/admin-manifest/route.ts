export const dynamic = "force-static";

export function GET() {
  const manifest = {
    id: "/admin",
    name: "Lumora Admin",
    short_name: "Lumora Admin",
    description: "Manage Lumora requests, stays and rides.",
    start_url: "/admin",
    scope: "/admin/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1B2A41",
    theme_color: "#1B2A41",
    lang: "en",
    icons: [
      { src: "/pwa-icon/admin-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/admin-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/admin-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Requests", url: "/admin/requests" },
      { name: "Stays", url: "/admin/stays" },
      { name: "Rides", url: "/admin/rides" },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
}
