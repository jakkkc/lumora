import { ImageResponse } from "next/og";
import { BrandIcon } from "@/lib/brand-icon";

// Guest app: /pwa-icon/192, /512, /maskable
// Admin app: /pwa-icon/admin-180, /admin-192, /admin-512, /admin-maskable
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const options: Record<string, { px: number; ratio: number; admin?: boolean }> = {
    "192": { px: 192, ratio: 0.62 },
    "512": { px: 512, ratio: 0.62 },
    maskable: { px: 512, ratio: 0.5 },
    "admin-180": { px: 180, ratio: 0.62, admin: true },
    "admin-192": { px: 192, ratio: 0.62, admin: true },
    "admin-512": { px: 512, ratio: 0.62, admin: true },
    "admin-maskable": { px: 512, ratio: 0.5, admin: true },
  };
  const o = options[size];
  if (!o) return new Response("Not found", { status: 404 });

  return new ImageResponse(<BrandIcon size={o.px} ratio={o.ratio} admin={o.admin} />, {
    width: o.px,
    height: o.px,
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
