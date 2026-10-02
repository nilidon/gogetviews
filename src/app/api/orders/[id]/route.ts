import { NextResponse } from "next/server";
import { rememberCheckoutEmail } from "@/lib/checkout-email";
import { getOrderStatus } from "@/lib/gogetviews";
import { getOrderById, mapDeliveryStatus, updateOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const sessionId = new URL(_request.url).searchParams.get("session_id");
    const found = await getOrderById(id);

    if (!found) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = await rememberCheckoutEmail(found, sessionId);

    if (order.gogetviewsOrderId) {
      try {
        const statusResponse = await getOrderStatus(order.gogetviewsOrderId);
        if (statusResponse.error) {
          return NextResponse.json({ order });
        }

        const status = mapDeliveryStatus(statusResponse.status);
        const updated = await updateOrder(id, {
          status,
          deliveryStatus: statusResponse.status,
          startCount: statusResponse.start_count,
          remains: statusResponse.remains,
        });

        return NextResponse.json({ order: updated ?? order });
      } catch {
        return NextResponse.json({ order });
      }
    }

    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
