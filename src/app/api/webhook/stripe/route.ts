import { NextResponse } from "next/server";
import Stripe from "stripe";
import { addOrder } from "@/lib/gogetviews";
import { config } from "@/lib/config";
import { normalizeEmail } from "@/lib/email";
import { getOrderById, updateOrder } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !config.stripeWebhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      config.stripeWebhookSecret,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ received: true });
    }

    const email = normalizeEmail(session.customer_details?.email ?? session.customer_email ?? "");
    if (email && order.email !== email) {
      await updateOrder(orderId, { email, stripeSessionId: session.id });
    }

    if (order.gogetviewsOrderId) {
      return NextResponse.json({ received: true });
    }

    try {
      const serviceId = Number(session.metadata?.serviceId);
      const link = session.metadata?.link ?? order.link;
      const quantity = Number(session.metadata?.quantity ?? order.quantity);
      const comments = session.metadata?.comments || order.comments;

      const result = await addOrder({
        service: serviceId,
        link,
        quantity: comments ? undefined : quantity,
        comments: comments || undefined,
      });

      await updateOrder(orderId, {
        gogetviewsOrderId: result.order,
        status: "processing",
        stripeSessionId: session.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Fulfillment failed";
      await updateOrder(orderId, {
        status: "failed",
        error: message,
      });
    }
  }

  return NextResponse.json({ received: true });
}
