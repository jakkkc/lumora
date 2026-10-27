import type { Metadata } from "next";
import PushControls from "@/components/admin/PushControls";
import { pushConfigured, vapidPublicKey } from "@/lib/push";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Notifications" };

function seen(v?: string) {
  if (!v || !v.trim()) return "MISSING";
  const bare = v.replace(/\s+/g, "").length;
  return v.length === bare ? `found, ${bare} characters` : `found, ${v.length} characters (${bare} without spaces)`;
}

export default async function NotificationsPage() {
  const sb = await supabaseServer();
  const { data } = await sb.from("push_subscriptions").select("endpoint, label, created_at").order("created_at");

  const devices = ((data ?? []) as { endpoint: string; label: string | null; created_at: string }[]).map((d) => ({
    endpoint: d.endpoint,
    label: d.label,
    added: new Date(d.created_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Africa/Nairobi",
    }),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl">notifications</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Get an alert on your phone when something needs you. Turn them on for each phone you use. Automatic alerts
          for new requests come in the next steps. For now, turn them on and send a test.
        </p>
      </div>

      <p className="text-xs text-muted">
        Server check: public key {seen(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)} (should be 87), private key{" "}
        {seen(process.env.VAPID_PRIVATE_KEY)} (should be 43), contact email {seen(process.env.VAPID_SUBJECT)}.
      </p>

      <PushControls publicKey={vapidPublicKey()} serverReady={pushConfigured()} devices={devices} />
    </div>
  );
}
