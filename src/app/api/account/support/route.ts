import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/account-auth";
import { createSupportMessage, listSupportMessagesForAccount } from "@/lib/support";

export const dynamic = "force-dynamic";

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const messages = await listSupportMessagesForAccount(account.id, account.email);
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json()) as { message?: string };
  const message = body.message?.trim() ?? "";
  if (message.length < 5 || message.length > 2000) {
    return NextResponse.json(
      { error: "Write a message between 5 and 2,000 characters." },
      { status: 400 },
    );
  }

  await createSupportMessage({
    email: account.email,
    message,
    userId: account.id,
  });
  return NextResponse.json({ ok: true });
}
