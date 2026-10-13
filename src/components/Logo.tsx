import type { CSSProperties } from "react";

type Props = { className?: string; title?: string };

const step = (i: number) => ({ "--i": i }) as CSSProperties;

/** Static wordmark */
export function Wordmark({ className, title = "Lumora" }: Props) {
  return (
    <svg
      viewBox="236 456 608 124"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      stroke="currentColor"
      strokeWidth="10"
    >
      <path d="M247 462V573" />
      <path d="M317 506V545.75A22.25 22.25 0 0 0 361.5 545.75M361.5 506V573" />
      <path d="M429 506V573M429 532.5A21.5 21.5 0 0 1 472 532.5V573M472 532.5A19.75 19.75 0 0 1 511.5 532.5V573" />
      <circle cx="603.5" cy="540" r="29" />
      <circle cx="603.5" cy="540" r="8" fill="currentColor" stroke="none" />
      <path d="M697.5 573V535Q697.5 511 725 511" />
      <circle cx="803" cy="540" r="29" />
      <circle cx="803" cy="540" r="8" fill="currentColor" stroke="none" />
      <path d="M832 506V574" />
    </svg>
  );
}

/** Wordmark that traces on, holds, traces off, and repeats */
export function AnimatedWordmark({ className, title = "Lumora" }: Props) {
  return (
    <svg
      viewBox="236 456 608 124"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      stroke="currentColor"
      strokeWidth="10"
    >
      <path className="lw-s" pathLength={1} style={step(0)} d="M247 462V573" />
      <path className="lw-s" pathLength={1} style={step(1)} d="M317 506V545.75A22.25 22.25 0 0 0 361.5 545.75M361.5 506V573" />
      <path className="lw-s" pathLength={1} style={step(2)} d="M429 506V573M429 532.5A21.5 21.5 0 0 1 472 532.5V573M472 532.5A19.75 19.75 0 0 1 511.5 532.5V573" />
      <circle className="lw-s" pathLength={1} style={step(3)} transform="rotate(-90 603.5 540)" cx="603.5" cy="540" r="29" />
      <circle className="lw-d" style={step(3)} cx="603.5" cy="540" r="8" fill="currentColor" stroke="none" />
      <path className="lw-s" pathLength={1} style={step(4)} d="M697.5 573V535Q697.5 511 725 511" />
      <circle className="lw-s" pathLength={1} style={step(5)} transform="rotate(-90 803 540)" cx="803" cy="540" r="29" />
      <circle className="lw-d" style={step(5)} cx="803" cy="540" r="8" fill="currentColor" stroke="none" />
      <path className="lw-s" pathLength={1} style={step(6)} d="M832 506V574" />
    </svg>
  );
}

/** Static ring-and-dot icon */
export function Mark({ className, title = "Lumora" }: Props) {
  return (
    <svg viewBox="295 295 490 490" className={className} role="img" aria-label={title}>
      <circle cx="540" cy="540" r="208" fill="none" stroke="currentColor" strokeWidth="74" />
      <circle cx="540" cy="540" r="62" fill="currentColor" />
    </svg>
  );
}

/** Ring traces on and off while the dot pulses */
export function AnimatedMark({ className, title = "", style }: Props & { style?: CSSProperties }) {
  return (
    <svg viewBox="295 295 490 490" className={className} style={style} role={title ? "img" : "presentation"} aria-label={title || undefined} aria-hidden={title ? undefined : true}>
      <circle
        className="mk-ring"
        pathLength={1}
        transform="rotate(-90 540 540)"
        cx="540" cy="540" r="208"
        fill="none" stroke="currentColor" strokeWidth="74"
      />
      <circle className="mk-dot" cx="540" cy="540" r="62" fill="currentColor" />
    </svg>
  );
}
