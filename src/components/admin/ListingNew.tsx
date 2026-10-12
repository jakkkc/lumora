import Link from "next/link";
import ListingForm from "./ListingForm";

export default function ListingNew({ kind }: { kind: "stay" | "ride" }) {
  const isStay = kind === "stay";
  return (
    <div className="space-y-8">
      <div>
        <Link href={isStay ? "/admin/stays" : "/admin/rides"} className="nav-link text-sm tracking-widest">
          {isStay ? "All stays" : "All rides"}
        </Link>
        <h1 className="mt-5 text-3xl">{isStay ? "add a stay" : "add a car"}</h1>
        <p className="mt-2 text-sm text-muted">Fill in the details, save, then add photos on the next screen.</p>
      </div>
      <ListingForm kind={kind} />
    </div>
  );
}
