export function money(amount: number, currency = "KES") {
  return `${currency} ${Number(amount).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

export function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function imageUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-images/${path}`;
}

export function sortImages<T extends { sort_order: number; is_cover: boolean }>(images: T[] = []) {
  return [...images].sort(
    (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order
  );
}

export const driverLabel: Record<string, string> = {
  self_drive: "Self-drive",
  with_driver: "Driver included",
  both: "Self-drive or with a driver",
};

export function longDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b + "T00:00:00") - Date.parse(a + "T00:00:00")) / 86400000);
}
