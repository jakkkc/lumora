import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side client that knows who is logged in (reads the login cookie).
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // Called from a page: the proxy refreshes the cookie instead.
          }
        },
      },
    }
  );
}
