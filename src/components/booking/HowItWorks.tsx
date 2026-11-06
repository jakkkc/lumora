const steps = ["send a request", "we reply", "you confirm"];

export default function HowItWorks() {
  return (
    <section aria-label="How it works" className="soft-card mb-4 bg-surface px-4 py-4">
      <ol className="flex items-start justify-between text-center text-xs">
        {steps.map((label, i) => (
          <li key={label} className="relative flex flex-1 flex-col items-center gap-2">
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute left-[calc(50%+1.2rem)] right-[calc(-50%+1.2rem)] top-3.5 border-t border-dashed border-line"
              />
            )}
            <span
              className={`relative grid h-7 w-7 place-items-center rounded-full text-xs ${
                i === 0 ? "bg-accent text-on-accent" : "border border-line bg-surface text-muted"
              }`}
            >
              {i + 1}
            </span>
            <span className={i === 0 ? "text-fg" : "text-muted"}>{label}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-center text-xs text-muted">Nothing is charged until we confirm with you.</p>
    </section>
  );
}
