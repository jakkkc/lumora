"use client";

const box =
  "w-full border border-line bg-transparent px-3 py-2.5 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none";
const lab = "mb-1.5 block text-xs tracking-widest text-muted";

export default function ContactFields({
  pending,
  error,
  label,
  disabled,
  hasPolicies,
}: {
  pending: boolean;
  error?: string;
  label: string;
  disabled?: boolean;
  hasPolicies: boolean;
}) {
  return (
    <>
      {/* spam trap: real people never see or fill this */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="full_name" className={lab}>Full name</label>
          <input id="full_name" name="full_name" type="text" required minLength={2} maxLength={100} autoComplete="name" className={box} />
        </div>
        <div>
          <label htmlFor="email" className={lab}>Email</label>
          <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" className={box} />
        </div>
        <div>
          <label htmlFor="phone" className={lab}>Phone or WhatsApp</label>
          <input id="phone" name="phone" type="tel" required maxLength={30} autoComplete="tel" className={box} placeholder="+254 ..." />
        </div>
        <div>
          <label htmlFor="message" className={lab}>Message (optional)</label>
          <textarea id="message" name="message" rows={3} maxLength={2000} className={box} placeholder="Special requests or questions" />
        </div>
      </div>

      <label className="mt-5 flex items-start gap-3 text-sm">
        <input type="checkbox" name="accepted" required className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]" />
        <span>
          I have read and accept the{" "}
          {hasPolicies ? (
            <a href="#policies" className="underline decoration-accent underline-offset-4">policies and terms</a>
          ) : (
            "policies and terms"
          )}
          .
        </span>
      </label>

      {error && (
        <p role="alert" className="mt-4 text-sm underline decoration-accent underline-offset-4">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending || disabled}
        className="mt-6 w-full bg-accent px-6 py-3.5 text-sm tracking-widest text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Sending..." : label}
      </button>
      <p className="mt-3 text-xs text-muted">
        This is a request, not a booking. Nothing is charged until our team confirms it with you.
      </p>
    </>
  );
}
