import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/account-auth";
import { listOrdersForAccount } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const orders = await listOrdersForAccount(account.id, account.email);
  return NextResponse.json({
    orders: orders.map((order) => ({
      id: order.id,
      serviceName: order.serviceName,
      platform: order.platform,
      quantity: order.quantity,
      amountCents: order.amountCents,
      status: order.status,
      createdAt: order.createdAt,
    })),
  });
}
