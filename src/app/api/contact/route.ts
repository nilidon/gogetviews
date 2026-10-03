import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/account-auth";
import { normalizeEmail } from "@/lib/email";
import { createSupportMessage } from "@/lib/support";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { name?: string; email?: string; message?: string };
  try {
    body = (await request.json()) as { name?: string; email?: string; message?: string };
  } catch {
    return NextResponse.json({ error: "Enter your name, email, and message." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = normalizeEmail(body.email ?? "");
  const message = body.message?.trim() ?? "";

  if (name.length < 2) {
    return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (message.length < 5 || message.length > 2000) {
    return NextResponse.json(
      { error: "Write a message between 5 and 2,000 characters." },
      { status: 400 },
    );
  }

  const account = await getCurrentAccount();
  await createSupportMessage({
    name,
    email: account?.email ?? email,
    message,
    userId: account?.id,
  });

  return NextResponse.json({ ok: true });
}
