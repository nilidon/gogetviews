import { NextResponse } from "next/server";
import { publicAccount } from "@/lib/account-auth";
import { normalizeEmail } from "@/lib/email";
import { getOrderById } from "@/lib/orders";
import { signUpAccount } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { orderId?: string; password?: string };
  try {
    body = (await request.json()) as { orderId?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Use at least 8 characters for your password." }, { status: 400 });
  }

  const orderId = body.orderId?.trim() ?? "";
  const password = body.password ?? "";
  if (!orderId || password.length < 8) {
    return NextResponse.json(
      { error: "Use at least 8 characters for your password." },
      { status: 400 },
    );
  }

  const order = await getOrderById(orderId);
  const email = normalizeEmail(order?.email ?? "");
  if (!order || !email) {
    return NextResponse.json({ error: "This checkout has no email to save." }, { status: 400 });
  }

  const result = await signUpAccount(email, password);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.status },
    );
  }

  return NextResponse.json({ account: publicAccount(result.account) });
}
