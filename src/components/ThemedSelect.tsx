"use client";

import { useEffect, useId, useRef, useState } from "react";

type Props = {
  id: string;
  name: string;
  options: [string, string][];
  defaultValue?: string;
  className?: string;
  onChange?: (value: string) => void;
};

export default function ThemedSelect({ id, name, options, defaultValue, className = "", onChange }: Props) {
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const first = options[0]?.[0] ?? "";
  const [value, setValue] = useState(
    defaultValue && options.some(([v]) => v === defaultValue) ? defaultValue : first
  );
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const selectedIndex = Math.max(0, options.findIndex(([v]) => v === value));
  const label = options[selectedIndex]?.[1] ?? "";

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);

  function openList() {
    setActive(selectedIndex);
    setOpen(true);
  }

  function choose(i: number) {
    const v = options[i][0];
    setValue(v);
    setOpen(false);
    onChange?.(v);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openList();
        else setActive((a) => Math.min(a + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openList();
        else setActive((a) => Math.max(a - 1, 0));
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setActive(0);
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setActive(options.length - 1);
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open) choose(active);
        else openList();
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={root} className="relative">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        onKeyUp={(e) => {
          if (e.key === " ") e.preventDefault();
        }}
        className={`${className} flex items-center justify-between gap-3 text-left`}
      >
        <span>{label}</span>
        <svg
          width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          className={`shrink-0 text-accent-strong transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 1.5l5 5 5-5" />
        </svg>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-60 w-full overflow-auto border border-accent bg-bg py-1 text-sm text-fg shadow-lg"
        >
          {options.map(([v, l], i) => (
            <li
              key={v}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={v === value}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(i);
              }}
              className={`cursor-pointer px-3 py-2.5 ${
                i === active ? "bg-accent text-on-accent" : ""
              } ${v === value ? "tracking-wide" : ""}`}
            >
              {l}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
