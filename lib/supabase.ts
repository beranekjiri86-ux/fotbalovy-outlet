import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase"; // pokud nemáš, můžeš dát `any`

export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  export const getSupabaseServerClient = createSupabaseServerClient;
export const getSupabaseBrowserClient = createSupabaseBrowserClient;

  const cookieStore = cookies();

  return createServerClient<Database>(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // v server components se set cookie nesmí vždycky, ale v route handlers/server actions ano
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
