"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * A slim bar at the bottom of the phone screen with the price and a button that glides to the request form.
 * It slides away while the form or the footer is on screen.
 */
export default function StickyRequestBar({ price, unit, label }: { price: string; unit: string; label: string }) {
  const [ready, setReady] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => setReady(true), []);

  useEffect(() => {
    const form = document.getElementById("request");
    if (!form) return;
    const footer = document.querySelector("footer");
    const inView = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) inView.add(e.target);
          else inView.delete(e.target);
        }
        setShow(inView.size === 0);
      },
      { threshold: 0.05 }
    );
    io.observe(form);
    if (footer) io.observe(footer);
    return () => io.disconnect();
  }, [ready]);

  if (!ready) return null;

  return createPortal(
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 px-5 pt-3 backdrop-blur transition-transform duration-300 lg:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <p>
          <span className="text-lg">{price}</span> <span className="text-xs text-muted">{unit}</span>
        </p>
        <button
          type="button"
          tabIndex={show ? 0 : -1}
          onClick={() => document.getElementById("request")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="rounded-full bg-accent px-6 py-3 text-sm tracking-widest text-on-accent transition-opacity hover:opacity-90"
        >
          {label}
        </button>
      </div>
    </div>,
    document.body
  );
}
