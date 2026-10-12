export default function Facts({ items }: { items: [string, string][] }) {
  return (
    <dl className="mt-6 divide-y divide-line border-y border-line text-sm">
      {items.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-6 py-3">
          <dt className="text-muted">{label}</dt>
          <dd className="text-right">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
