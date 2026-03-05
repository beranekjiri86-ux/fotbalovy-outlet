import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // pokud není přihlášený → přesměrovat na login
  if (!user) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
