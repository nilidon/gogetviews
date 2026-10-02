import { attachOrdersToUser } from "@/lib/orders";
import { createCookieClient, createServiceClient, supabaseEnv } from "@/lib/supabase";
import type { Account } from "@/lib/account-auth";

type AuthResult =
  | { ok: true; account: Account }
  | { ok: false; status: number; error: string; code?: string };

function notConfigured(): AuthResult {
  return {
    ok: false,
    status: 503,
    error: "Accounts are not connected yet. Add the Supabase keys in .env.local.",
  };
}

function alreadyExists(message: string): boolean {
  return /already/i.test(message);
}

export async function signUpAccount(email: string, password: string): Promise<AuthResult> {
  if (!supabaseEnv().configured) return notConfigured();

  const admin = createServiceClient();
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (created.error || !created.data.user) {
    const message = created.error?.message ?? "Could not create an account.";
    if (alreadyExists(message)) {
      const existing = await signInAccount(email, password);
      if (existing.ok) return existing;
      return {
        ok: false,
        status: 409,
        code: "exists",
        error: "An account already exists for this email. Sign in instead.",
      };
    }
    return { ok: false, status: 400, error: message };
  }

  const supabase = await createCookieClient();
  const signedIn = await supabase.auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data.user) {
    return {
      ok: false,
      status: 500,
      error: "Your account was created, but sign-in failed. Try signing in.",
    };
  }

  try {
    await attachOrdersToUser(email, signedIn.data.user.id);
  } catch {
    // A new account does not need a past order. Linking one can wait until checkout.
  }

  return {
    ok: true,
    account: {
      id: signedIn.data.user.id,
      email,
      freeViewsClaimed: signedIn.data.user.user_metadata?.freeViewsClaimed === true,
    },
  };
}

export async function markAccountFreeViewsClaimed(userId: string): Promise<void> {
  if (!supabaseEnv().configured) return;

  const admin = createServiceClient();
  const existing = await admin.auth.admin.getUserById(userId);
  const { error } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...(existing.data.user?.user_metadata ?? {}),
      freeViewsClaimed: true,
    },
  });
  if (error) throw new Error(error.message);
}

export async function signInAccount(email: string, password: string): Promise<AuthResult> {
  if (!supabaseEnv().configured) return notConfigured();

  const supabase = await createCookieClient();
  const signedIn = await supabase.auth.signInWithPassword({ email, password });
  const accountEmail = signedIn.data.user?.email?.trim().toLowerCase();
  if (signedIn.error || !signedIn.data.user || !accountEmail) {
    return { ok: false, status: 401, error: "That email or password is wrong." };
  }

  return {
    ok: true,
    account: {
      id: signedIn.data.user.id,
      email: accountEmail,
      freeViewsClaimed: signedIn.data.user.user_metadata?.freeViewsClaimed === true,
    },
  };
}
