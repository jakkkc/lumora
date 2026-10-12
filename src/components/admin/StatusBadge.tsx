const styles: Record<string, string> = {
  new: "bg-accent text-on-accent",
  contacted: "border border-accent text-fg",
  confirmed: "border border-accent bg-accent/15 text-fg",
  declined: "border border-line text-muted",
  cancelled: "border border-line text-muted",
  completed: "border border-line text-muted",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 text-xs capitalize tracking-wider ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}
