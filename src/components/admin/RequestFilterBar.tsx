"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import ThemedSelect from "@/components/ThemedSelect";

const box =
  "w-full border border-line bg-transparent px-3 py-2.5 text-sm focus:border-accent focus:outline-none";

export default function RequestFilterBar({ status, kind, q }: { status: string; kind: string; q: string }) {
  const router = useRouter();
  const [text, setText] = useState(q);

  function go(next: { kind?: string; q?: string }) {
    const p = new URLSearchParams();
    const k = next.kind ?? kind;
    const s = (next.q ?? text).trim();
    if (status !== "all") p.set("status", status);
    if (k !== "all") p.set("kind", k);
    if (s) p.set("q", s);
    const qs = p.toString();
    router.push(qs ? `/admin/requests?${qs}` : "/admin/requests");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go({});
      }}
      className="flex flex-wrap gap-3 sm:flex-nowrap"
    >
      <div className="w-full sm:w-52">
        <ThemedSelect
          id="request-service"
          name="kind"
          defaultValue={kind}
          className={box}
          onChange={(v) => go({ kind: v })}
          options={[
            ["all", "All services"],
            ["stay", "Stays"],
            ["ride", "Rides"],
            ["tour", "Tours"],
          ]}
        />
      </div>
      <div className="relative min-w-0 flex-1">
        <Icon name="search" size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Name, phone or reference"
          aria-label="Search requests"
          maxLength={50}
          className={`${box} pl-10`}
        />
      </div>
      {q && (
        <button
          type="button"
          onClick={() => {
            setText("");
            go({ q: "" });
          }}
          className="border border-line px-4 py-2.5 text-xs tracking-widest text-muted transition-colors hover:border-accent hover:text-fg"
        >
          Clear
        </button>
      )}
    </form>
  );
}
