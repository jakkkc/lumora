export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string) {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}

/** Every day from start up to, but not including, the end. */
export function eachDay(start: string, endExclusive: string) {
  const out: string[] = [];
  let d = start;
  while (d < endExclusive && out.length < 400) {
    out.push(d);
    d = addDays(d, 1);
  }
  return out;
}

/** Joins consecutive days into ranges. The end of a range is the first free day. */
export function toRanges(days: string[]) {
  const out: { from: string; to: string }[] = [];
  for (const d of [...days].sort()) {
    const last = out[out.length - 1];
    if (last && last.to === d) last.to = addDays(d, 1);
    else out.push({ from: d, to: addDays(d, 1) });
  }
  return out;
}

export function niceDate(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
