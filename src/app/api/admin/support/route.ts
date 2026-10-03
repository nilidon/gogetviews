import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { replyToSupportMessage } from "@/lib/support";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const body = (await request.json()) as { id?: string; reply?: string };
  const id = body.id?.trim() ?? "";
  const reply = body.reply?.trim() ?? "";
  if (!id) {
    return NextResponse.json({ error: "Message not found." }, { status: 400 });
  }
  if (reply.length < 1 || reply.length > 4000) {
    return NextResponse.json({ error: "Write a reply." }, { status: 400 });
  }

  const updated = await replyToSupportMessage(id, reply);
  if (!updated) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, message: updated });
}
