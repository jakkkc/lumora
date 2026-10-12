"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "../actions";

const field =
  "w-full border border-line bg-transparent px-3 py-3 text-sm text-fg focus:border-accent focus:outline-none";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs tracking-widest text-muted">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className={field} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs tracking-widest text-muted">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={field} />
      </div>
      {state.error && (
        <p role="alert" className="text-sm underline decoration-accent underline-offset-4">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-accent px-6 py-3.5 text-sm tracking-widest text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
