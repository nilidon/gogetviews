import { normalizeEmail } from "@/lib/email";
import { updateOrder } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";
import type { StoredOrder } from "@/types/service";

export async function rememberCheckoutEmail(
  order: StoredOrder,
  sessionId?: string | null,
): Promise<StoredOrder> {
  const stripeSessionId = sessionId || order.stripeSessionId;
  if (order.email || !stripeSessionId) return order;

  try {
    const session = await getStripe().checkout.sessions.retrieve(stripeSessionId);
    const email = normalizeEmail(session.customer_details?.email ?? session.customer_email ?? "");
    if (!email) return order;
    return (await updateOrder(order.id, { email, stripeSessionId })) ?? { ...order, email, stripeSessionId };
  } catch {
    return order;
  }
}
