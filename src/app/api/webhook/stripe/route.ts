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

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const paid =
      session.payment_status === "paid" || session.payment_status === "no_payment_required";
    if (paid) {
      const missing = await fulfillCheckout(session);
      if (missing) {
        return NextResponse.json({ error: "Order not found" }, { status: 500 });
      }
    }
  }

  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      const order = await getOrderById(orderId);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 500 });
      }
      if (!order.gogetviewsOrderId) {
        await updateOrder(orderId, {
          status: "failed",
          error: "Payment failed",
          stripeSessionId: session.id,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}

async function fulfillCheckout(session: Stripe.Checkout.Session): Promise<boolean> {
  const orderId = session.metadata?.orderId;
  if (!orderId) return false;

  const order = await getOrderById(orderId);
  if (!order) return true;

  const email = normalizeEmail(session.customer_details?.email ?? session.customer_email ?? "");
  if (email && order.email !== email) {
    await updateOrder(orderId, { email, stripeSessionId: session.id });
  }

  if (order.gogetviewsOrderId) return false;

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

  return false;
}
