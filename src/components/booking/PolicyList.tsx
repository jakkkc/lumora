import Icon from "@/components/Icon";

export default function PolicyList({
  policies,
  title = "policies and terms",
}: {
  policies: { id: string; title: string; body: string }[];
  title?: string;
}) {
  if (policies.length === 0) return null;
  return (
    <section id="policies" aria-labelledby="policies-title" className="scroll-mt-24">
      <h2 id="policies-title" className="mb-4 text-xl">{title}</h2>
      <div className="divide-y divide-line border-y border-line">
        {policies.map((p) => (
          <details key={p.id} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm tracking-wide [&::-webkit-details-marker]:hidden">
              {p.title}
              <Icon name="chevron" size={18} className="shrink-0 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <p className="max-w-prose whitespace-pre-line pb-5 text-sm text-muted">{p.body}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
