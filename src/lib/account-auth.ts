import { accountHasClaimedFreeViews } from "@/lib/free-views";
import { createCookieClient, supabaseEnv } from "@/lib/supabase";

export interface Account {
  id: string;
  email: string;
  freeViewsClaimed: boolean;
}

export function publicAccount(account: Account): Account {
  return { id: account.id, email: account.email, freeViewsClaimed: account.freeViewsClaimed };
}

export async function getCurrentAccount(): Promise<Account | null> {
  if (!supabaseEnv().configured) return null;

  try {
    const supabase = await createCookieClient();
    const { data, error } = await supabase.auth.getUser();
    const email = data.user?.email?.trim().toLowerCase();
    if (error || !data.user || !email) return null;
    const freeViewsClaimed =
      data.user.user_metadata?.freeViewsClaimed === true ||
      (await accountHasClaimedFreeViews(data.user.id));
    return { id: data.user.id, email, freeViewsClaimed };
  } catch {
    return null;
  }
}
