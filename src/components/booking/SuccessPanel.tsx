"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { REPLY_NOTE, whatsappLink } from "@/lib/contact";

type Step = { title: string; note: string; state: "done" | "now" | "next" };

const steps: Step[] = [
  { title: "We have it", note: "Your request is with our team.", state: "done" },
  { title: "We reply on WhatsApp", note: REPLY_NOTE, state: "now" },
  { title: "You confirm", note: "We send the payment details.", state: "next" },
];

export default function SuccessPanel({ reference, message }: { reference: string; message: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* some browsers block copying; the number is still on the screen */
    }
  }

  return (
    <div className="soft-card p-6 text-center" role="status">
      <div className="relative mx-auto grid h-28 w-28 place-items-center">
        <div className="glow absolute -inset-4 rounded-full" aria-hidden="true" />
        <svg viewBox="0 0 120 120" className="relative h-24 w-24 text-accent" aria-hidden="true">
          <circle
            className="ok-ring"
            pathLength={1}
            cx="60"
            cy="60"
            r="38"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            transform="rotate(-90 60 60)"
          />
          <circle className="ok-dot" cx="60" cy="60" r="11" fill="currentColor" />
          <g className="ok-badge">
            <circle cx="96" cy="94" r="14" fill="#C9A66B" />
            <path d="M89 94l5 5 9-9" fill="none" stroke="#1B2A41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      </div>

      <h2 className="mt-4 text-2xl">we got your request</h2>
      <p className="mt-1 text-sm text-muted">Thank you. Keep this reference handy.</p>

      <button
        type="button"
        onClick={copy}
        aria-label="Copy your reference number"
        className="mx-auto mt-5 inline-flex items-center gap-3 rounded-full bg-surface px-5 py-2.5 tracking-widest"
      >
        {reference}
        <span className="text-xs tracking-normal text-muted">{copied ? "copied" : "copy"}</span>
      </button>

      <p className="mt-8 text-left text-xs tracking-widest text-muted">WHAT HAPPENS NEXT</p>
      <ol className="relative mt-4 space-y-5 text-left">
        <span className="absolute bottom-7 left-3.5 top-7 w-px bg-line" aria-hidden="true" />
        {steps.map((s) => (
          <li key={s.title} className="relative flex items-start gap-4">
            {s.state === "done" && (
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
                <Icon name="check" size={14} />
              </span>
            )}
            {s.state === "now" && (
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-gold bg-bg">
                <span className="h-2 w-2 rounded-full bg-gold" />
              </span>
            )}
            {s.state === "next" && <span className="h-7 w-7 shrink-0 rounded-full border border-line bg-bg" />}
            <span>
              <span className="block text-sm">{s.title}</span>
              <span className="block text-xs text-muted">{s.note}</span>
            </span>
          </li>
        ))}
      </ol>

      <a
        href={whatsappLink(`Hello Lumora, I just sent request ${reference}. ${message}`)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 block bg-accent px-6 py-3.5 text-center text-sm tracking-widest text-on-accent transition-opacity hover:opacity-90"
      >
        Message us on WhatsApp
      </a>
    </div>
  );
}
