import type { Metadata } from "next";
import PushControls from "@/components/admin/PushControls";
import { pushConfigured, vapidPublicKey } from "@/lib/push";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Notifications" };

const alerts: [string, string][] = [
  ["New request", "As soon as a guest sends one."],
  ["A request is waiting", "A reminder when one has gone 3 hours without an answer. Only between 7 am and 9 pm."],
  ["Tomorrow", "At 5 pm, the check-ins, pick-ups and tours for the next day."],
  ["Good morning", "At 7:30 am, what is new, what starts and ends today, and balances still owed."],
];

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
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl">notifications</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Get an alert on your phone when something needs you. Turn them on for each phone you use.
        </p>
      </div>

      <section aria-labelledby="what">
        <h2 id="what" className="mb-3 text-xl">what you will get</h2>
        <ul className="divide-y divide-line border-y border-line">
          {alerts.map(([title, note]) => (
            <li key={title} className="py-3 text-sm">
              <p>{title}</p>
              <p className="text-xs text-muted">{note}</p>
            </li>
          ))}
        </ul>
      </section>

      <PushControls publicKey={vapidPublicKey()} serverReady={pushConfigured()} devices={devices} />
    </div>
  );
}
