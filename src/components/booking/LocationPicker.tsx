"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Icon from "@/components/Icon";

export type Pin = { lat: number; lng: number; address: string };
type Place = { lat: string; lon: string; display_name: string };

const NOMINATIM = "https://nominatim.openstreetmap.org";
const MOMBASA: [number, number] = [-4.0435, 39.6682];

const pinIcon = L.divIcon({
  className: "",
  html: '<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="11" fill="#FBF8F3" stroke="#1B2A41" stroke-width="5"/><circle cx="17" cy="17" r="4" fill="#1B2A41"/></svg>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const box =
  "w-full border border-line bg-transparent px-3 py-2.5 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none";

async function reverse(lat: number, lng: number): Promise<string> {
  try {
    const r = await fetch(`${NOMINATIM}/reverse?format=jsonv2&zoom=18&accept-language=en&lat=${lat}&lon=${lng}`);
    if (!r.ok) return "";
    const j = await r.json();
    return typeof j.display_name === "string" ? j.display_name.slice(0, 250) : "";
  } catch {
    return "";
  }
}

export default function LocationPicker({
  value,
  onChange,
}: {
  value: Pin | null;
  onChange: (p: Pin | null) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const seq = useRef(0);
  const change = useRef(onChange);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    change.current = onChange;
  }, [onChange]);

  function put(lat: number, lng: number, address?: string) {
    const la = Math.round(lat * 1e6) / 1e6;
    const lo = Math.round(lng * 1e6) / 1e6;
    if (marker.current) marker.current.setLatLng([la, lo]);
    else if (map.current) {
      const m = L.marker([la, lo], { icon: pinIcon, draggable: true }).addTo(map.current);
      m.on("dragend", () => {
        const p = m.getLatLng();
        put(p.lat, p.lng);
      });
      marker.current = m;
    }
    const mine = ++seq.current;
    change.current({ lat: la, lng: lo, address: address ?? "" });
    if (address === undefined) {
      reverse(la, lo).then((a) => {
        if (a && mine === seq.current) change.current({ lat: la, lng: lo, address: a });
      });
    }
  }

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, {
      center: value ? [value.lat, value.lng] : MOMBASA,
      zoom: value ? 16 : 12,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);
    m.on("click", (e: L.LeafletMouseEvent) => put(e.latlng.lat, e.latlng.lng));
    map.current = m;
    if (value) put(value.lat, value.lng, value.address);
    return () => {
      m.remove();
      map.current = null;
      marker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search() {
    const q = query.trim();
    if (q.length < 3) return setNote("Type at least 3 letters.");
    setBusy(true);
    setNote("");
    setResults([]);
    try {
      const r = await fetch(
        `${NOMINATIM}/search?format=jsonv2&limit=5&countrycodes=ke&accept-language=en&q=${encodeURIComponent(q)}`
      );
      const j: Place[] = await r.json();
      if (j.length === 0) setNote("Nothing found. Try a landmark or estate name, or tap the map.");
      setResults(j);
    } catch {
      setNote("Search is not available right now. Tap the map to place the pin.");
    }
    setBusy(false);
  }

  function choose(p: Place) {
    const la = Number(p.lat);
    const lo = Number(p.lon);
    map.current?.setView([la, lo], 16);
    put(la, lo, p.display_name.slice(0, 250));
    setResults([]);
  }

  function clear() {
    marker.current?.remove();
    marker.current = null;
    seq.current++;
    onChange(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
          placeholder="Search a place, hotel or estate"
          aria-label="Search for a place"
          className={box}
        />
        <button
          type="button"
          onClick={search}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-2 border border-accent px-4 text-xs tracking-widest transition-colors hover:bg-accent/15 disabled:opacity-50"
        >
          <Icon name="search" size={15} />
          {busy ? "Searching" : "Find"}
        </button>
      </div>

      {note && (
        <p role="status" className="text-xs text-muted">
          {note}
        </p>
      )}

      {results.length > 0 && (
        <ul className="divide-y divide-line border border-line text-sm">
          {results.map((p) => (
            <li key={`${p.lat},${p.lon},${p.display_name}`}>
              <button
                type="button"
                onClick={() => choose(p)}
                className="block w-full px-3 py-2.5 text-left transition-colors hover:bg-accent/15"
              >
                {p.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div
        ref={el}
        className="relative z-0 h-64 w-full border border-line"
        role="application"
        aria-label="Map. Tap or click to place the pin."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span>{value ? "Drag the pin to adjust it." : "Tap the map to drop a pin."}</span>
        {value && (
          <button type="button" onClick={clear} className="underline decoration-line underline-offset-4 hover:decoration-accent">
            Remove pin
          </button>
        )}
      </div>
    </div>
  );
}
