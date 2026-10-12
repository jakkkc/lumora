import { ImageResponse } from "next/og";
import { BrandIcon } from "@/lib/brand-icon";

// /pwa-icon/192, /pwa-icon/512 and /pwa-icon/maskable (extra padding so phones can crop it to any shape)
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const options: Record<string, { px: number; ratio: number }> = {
    "192": { px: 192, ratio: 0.62 },
    "512": { px: 512, ratio: 0.62 },
    maskable: { px: 512, ratio: 0.5 },
  };
  const o = options[size];
  if (!o) return new Response("Not found", { status: 404 });

  return new ImageResponse(<BrandIcon size={o.px} ratio={o.ratio} />, {
    width: o.px,
    height: o.px,
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
