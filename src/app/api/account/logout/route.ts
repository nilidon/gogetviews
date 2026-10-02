import { NextResponse } from "next/server";
import { createCookieClient, supabaseEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST() {
  if (supabaseEnv().configured) {
    const supabase = await createCookieClient();
    await supabase.auth.signOut();
  }
  return NextResponse.json({ ok: true });
}
