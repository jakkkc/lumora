"use client";

import { useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { imageUrl } from "@/lib/format";
import { refreshPublic } from "@/app/admin/(panel)/listing-actions";

type Img = { id: string; path: string; alt: string | null; sort_order: number; is_cover: boolean };

// Shrinks big phone photos before upload so pages stay fast.
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2200 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob: Blob | null = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}

const btn =
  "border border-line px-3 py-1.5 text-xs tracking-wider text-muted transition-colors hover:border-accent hover:text-fg disabled:opacity-40";

export default function PhotoManager({
  kind,
  listingId,
  initial,
}: {
  kind: "stay" | "ride" | "tour";
  listingId: string;
  initial: Img[];
}) {
  const [images, setImages] = useState<Img[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const col = kind === "stay" ? "property_id" : kind === "ride" ? "vehicle_id" : "tour_id";
  const folder = kind === "stay" ? "properties" : kind === "ride" ? "vehicles" : "tours";
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError("");
    const sb = supabaseBrowser();
    let list = [...images];
    let order = Math.max(-1, ...list.map((i) => i.sort_order)) + 1;

    for (const f of Array.from(files)) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) {
        setError(`${f.name}: please use a JPG, PNG or WebP photo.`);
        continue;
      }
      const blob = await shrink(f);
      if (blob.size > 8 * 1024 * 1024) {
        setError(`${f.name} is too large (maximum 8 MB).`);
        continue;
      }
      const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
      const path = `${folder}/${listingId}/${crypto.randomUUID()}.${ext}`;
      const up = await sb.storage
        .from("listing-images")
        .upload(path, blob, { contentType: blob.type || f.type, cacheControl: "31536000" });
      if (up.error) {
        setError(`Could not upload ${f.name}. Please try again.`);
        continue;
      }
      const ins = await sb
        .from("listing_images")
        .insert({ [col]: listingId, path, alt: null, sort_order: order++, is_cover: list.length === 0 })
        .select("id, path, alt, sort_order, is_cover")
        .single();
      if (ins.error || !ins.data) {
        await sb.storage.from("listing-images").remove([path]);
        setError(`Could not save ${f.name}. Please try again.`);
        continue;
      }
      list = [...list, ins.data as Img];
      setImages(list);
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    await refreshPublic();
  }

  async function makeCover(id: string) {
    const sb = supabaseBrowser();
    await sb.from("listing_images").update({ is_cover: false }).eq(col, listingId);
    const { error: e } = await sb.from("listing_images").update({ is_cover: true }).eq("id", id);
    if (e) return setError("Could not change the cover photo.");
    setImages((p) => p.map((i) => ({ ...i, is_cover: i.id === id })));
    await refreshPublic();
  }

  async function move(id: string, dir: -1 | 1) {
    const i = sorted.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sorted.length) return;
    const a = sorted[i];
    const b = sorted[j];
    const sb = supabaseBrowser();
    const [r1, r2] = await Promise.all([
      sb.from("listing_images").update({ sort_order: b.sort_order }).eq("id", a.id),
      sb.from("listing_images").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    if (r1.error || r2.error) return setError("Could not reorder the photos.");
    setImages((p) =>
      p.map((x) => (x.id === a.id ? { ...x, sort_order: b.sort_order } : x.id === b.id ? { ...x, sort_order: a.sort_order } : x))
    );
    await refreshPublic();
  }

  async function saveAlt(id: string, text: string) {
    const value = text.trim() || null;
    const current = images.find((i) => i.id === id);
    if (!current || (current.alt ?? null) === value) return;
    const { error: e } = await supabaseBrowser().from("listing_images").update({ alt: value }).eq("id", id);
    if (e) return setError("Could not save the description.");
    setImages((p) => p.map((i) => (i.id === id ? { ...i, alt: value } : i)));
    await refreshPublic();
  }

  async function remove(img: Img) {
    if (!confirm("Remove this photo?")) return;
    const sb = supabaseBrowser();
    await sb.storage.from("listing-images").remove([img.path]);
    const { error: e } = await sb.from("listing_images").delete().eq("id", img.id);
    if (e) return setError("Could not remove the photo.");
    const rest = images.filter((i) => i.id !== img.id);
    setImages(rest);
    if (img.is_cover && rest.length > 0) {
      const first = [...rest].sort((a, b) => a.sort_order - b.sort_order)[0];
      await makeCover(first.id);
    }
    await refreshPublic();
  }

  return (
    <section className="space-y-5" aria-labelledby="photos">
      <h2 id="photos" className="border-b border-line pb-2 text-xl">photos</h2>
      <p className="text-sm text-muted">
        The cover photo is shown first on the website. Use JPG, PNG or WebP. Large photos are shrunk for you.
      </p>

      <div>
        <input
          ref={input} id="photo-input" type="file" multiple accept="image/jpeg,image/png,image/webp"
          className="sr-only" disabled={busy} onChange={(e) => onFiles(e.target.files)}
        />
        <label
          htmlFor="photo-input"
          className={`inline-block cursor-pointer bg-accent px-6 py-3 text-sm tracking-widest text-on-accent transition-opacity hover:opacity-90 ${busy ? "pointer-events-none opacity-50" : ""}`}
        >
          {busy ? "Uploading..." : "Add photos"}
        </label>
      </div>

      {error && <p role="alert" className="text-sm underline decoration-accent underline-offset-4">{error}</p>}

      {sorted.length === 0 ? (
        <p className="text-sm text-muted">No photos yet. Add the best one first; it becomes the cover.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((img, n) => (
            <li key={img.id} className="border border-line">
              <div className="relative aspect-[4/3] bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl(img.path)} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                {img.is_cover && (
                  <span className="absolute left-2 top-2 bg-accent px-2 py-0.5 text-xs tracking-wider text-on-accent">Cover</span>
                )}
              </div>
              <div className="space-y-3 p-3">
                <input
                  type="text" defaultValue={img.alt ?? ""} maxLength={200}
                  aria-label="Photo description"
                  placeholder="Describe the photo (helps accessibility)"
                  onBlur={(e) => saveAlt(img.id, e.target.value)}
                  className="w-full border border-line bg-transparent px-2.5 py-2 text-xs focus:border-accent focus:outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  {!img.is_cover && <button type="button" className={btn} onClick={() => makeCover(img.id)}>Make cover</button>}
                  <button type="button" className={btn} disabled={n === 0} onClick={() => move(img.id, -1)}>Earlier</button>
                  <button type="button" className={btn} disabled={n === sorted.length - 1} onClick={() => move(img.id, 1)}>Later</button>
                  <button type="button" className={btn} onClick={() => remove(img)}>Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
