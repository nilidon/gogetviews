import { NextResponse } from "next/server";
import { getCurrentAccount, publicAccount } from "@/lib/account-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) {
    return NextResponse.json({ account: null });
  }
  return NextResponse.json({ account: publicAccount(account) });
}
