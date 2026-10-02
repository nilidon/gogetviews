import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "@/lib/supabase-env";

export { supabaseEnv };

export function createServiceClient(): SupabaseClient {
  const env = supabaseEnv();
  if (!env.configured) {
    throw new Error("Supabase is not configured.");
  }

  return createClient(env.url, env.service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function createCookieClient() {
  const env = supabaseEnv();
  if (!env.configured) {
    throw new Error("Supabase is not configured.");
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies. The proxy refreshes the session.
        }
      },
    },
  });
}
