export default function ItemList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="grid gap-x-10 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="border-b border-line py-3 text-sm">
          {item}
        </li>
      ))}
    </ul>
  );
}
