import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AnimatedWordmark } from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { supabaseServer } from "@/lib/supabase/server";
import { signOut } from "../actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Lumora admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (profile?.role !== "owner") {
    return (
      <div className="grid min-h-screen place-items-center bg-bg px-5 text-fg">
        <div className="max-w-sm space-y-4">
          <h1 className="text-2xl">no access</h1>
          <p className="text-sm text-muted">This account is signed in but is not allowed to use the admin.</p>
          <form action={signOut}>
            <button className="border border-accent px-6 py-3 text-sm tracking-widest hover:bg-accent/15">Sign out</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-5">
            <Link href="/admin" aria-label="Admin dashboard">
              <AnimatedWordmark className="h-6 w-auto text-logo" />
            </Link>
            <span className="hidden text-sm text-muted sm:inline">admin</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" target="_blank" className="nav-link hidden tracking-widest sm:inline">View site</Link>
            <ThemeToggle />
            <form action={signOut}>
              <button className="tracking-widest transition-colors hover:text-accent-strong">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{children}</div>
    </div>
  );
}
