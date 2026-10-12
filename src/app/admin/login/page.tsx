import type { Metadata } from "next";
import { AnimatedMark } from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-bg px-5 py-16 text-fg">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <AnimatedMark className="pointer-events-none absolute -left-32 top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 text-accent opacity-60" />
      <div className="relative w-full max-w-sm">
        <h1 className="text-3xl">team sign in</h1>
        <p className="mb-8 mt-2 text-sm text-muted">Lumora admin. Authorised access only.</p>
        <LoginForm />
      </div>
    </div>
  );
}
