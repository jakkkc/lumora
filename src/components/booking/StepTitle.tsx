export default function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <div className="mb-3 mt-7 flex items-center gap-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold text-xs text-navy-deep">{n}</span>
      <span className="text-sm tracking-wide">{title}</span>
    </div>
  );
}
