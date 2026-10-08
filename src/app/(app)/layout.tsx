import { getSessionUser } from "@/lib/supabase/server";
import Shell from "@/components/shell";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();

  return <Shell email={user?.email ?? null}>{children}</Shell>;
}
