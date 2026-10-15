import Icon from "@/components/Icon";
import { whatsappLink } from "@/lib/contact";

export default function SuccessPanel({ reference, message }: { reference: string; message: string }) {
  return (
    <div className="border border-line p-6" role="status">
      <p className="flex items-center gap-2 text-sm text-muted">
        <Icon name="check" size={16} /> Request sent
      </p>
      <p className="mt-2 text-3xl tracking-widest">{reference}</p>
      <p className="mt-4 text-sm text-muted">
        Thank you. Our team will contact you shortly to confirm availability and the final price. Keep this
        reference handy.
      </p>
      <a
        href={whatsappLink(`Hello Lumora, I just sent request ${reference}. ${message}`)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 block bg-accent px-6 py-3.5 text-center text-sm tracking-widest text-on-accent transition-opacity hover:opacity-90"
      >
        Message us on WhatsApp
      </a>
    </div>
  );
}
