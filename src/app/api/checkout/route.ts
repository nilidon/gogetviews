import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCatalogService } from "@/lib/catalog";
import { config } from "@/lib/config";
import { createOrder, updateOrder } from "@/lib/orders";
import { retailPriceCentsFromRate } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      serviceId?: number;
      link?: string;
      quantity?: number;
      comments?: string;
    };

    const { serviceId, link, quantity, comments } = body;

    if (!serviceId || !link?.trim()) {
      return NextResponse.json(
        { error: "Service and link are required" },
        { status: 400 },
      );
    }

    const catalogItem = await getCatalogService(serviceId);
    if (!catalogItem) {
      return NextResponse.json({ error: "Service not available" }, { status: 404 });
    }

    const { service, platform, displayName, retailRate } = catalogItem;

    const min = Number.parseInt(service.min, 10);
    const max = Number.parseInt(service.max, 10);
    const isComments = service.type.toLowerCase().includes("custom comments");

    let resolvedQuantity = quantity ?? 0;

    if (isComments) {
      if (!comments?.trim()) {
        return NextResponse.json(
          { error: "Comments are required for this service" },
          { status: 400 },
        );
      }
      resolvedQuantity = comments.trim().split("\n").filter(Boolean).length;
    } else {
      if (!resolvedQuantity || resolvedQuantity < min || resolvedQuantity > max) {
        return NextResponse.json(
          { error: `Quantity must be between ${min.toLocaleString()} and ${max.toLocaleString()}` },
          { status: 400 },
        );
      }
    }

    const amountCents = retailPriceCentsFromRate(retailRate, resolvedQuantity);
    const orderId = randomUUID();

    await createOrder({
      id: orderId,
      serviceId,
      serviceName: displayName,
      platform,
      link: link.trim(),
      quantity: resolvedQuantity,
      comments: comments?.trim(),
      amountCents,
      currency: "usd",
      status: "pending_payment",
    });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${config.appUrl}/success?order=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.appUrl}/?cancelled=1`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: `${platform} — ${displayName}`,
              description: `${resolvedQuantity.toLocaleString()} units · ${link.trim()}`,
            },
          },
        },
      ],
      metadata: {
        orderId,
        serviceId: String(serviceId),
        link: link.trim(),
        quantity: String(resolvedQuantity),
        comments: comments?.trim() ?? "",
      },
    });

    await updateOrder(orderId, { stripeSessionId: session.id });

    return NextResponse.json({ url: session.url, orderId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
