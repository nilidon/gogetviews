import { createServiceClient } from "@/lib/supabase";
import type { OrderStatus, StoredOrder } from "@/types/service";

interface OrderRow {
  id: string;
  stripe_session_id: string | null;
  gogetviews_order_id: number | null;
  service_id: number;
  service_name: string;
  platform: string;
  link: string;
  email: string | null;
  user_id: string | null;
  quantity: number;
  comments: string | null;
  amount_cents: number;
  currency: string;
  status: OrderStatus;
  delivery_status: string | null;
  start_count: string | null;
  remains: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

function toStored(row: OrderRow): StoredOrder {
  return {
    id: row.id,
    stripeSessionId: row.stripe_session_id ?? undefined,
    gogetviewsOrderId: row.gogetviews_order_id ?? undefined,
    serviceId: row.service_id,
    serviceName: row.service_name,
    platform: row.platform,
    link: row.link,
    email: row.email ?? undefined,
    userId: row.user_id ?? undefined,
    quantity: row.quantity,
    comments: row.comments ?? undefined,
    amountCents: row.amount_cents,
    currency: row.currency,
    status: row.status,
    deliveryStatus: row.delivery_status ?? undefined,
    startCount: row.start_count ?? undefined,
    remains: row.remains ?? undefined,
    error: row.error ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toInsert(order: Omit<StoredOrder, "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  return {
    id: order.id,
    stripe_session_id: order.stripeSessionId ?? null,
    gogetviews_order_id: order.gogetviewsOrderId ?? null,
    service_id: order.serviceId,
    service_name: order.serviceName,
    platform: order.platform,
    link: order.link,
    email: order.email ?? null,
    user_id: order.userId ?? null,
    quantity: order.quantity,
    comments: order.comments ?? null,
    amount_cents: order.amountCents,
    currency: order.currency,
    status: order.status,
    delivery_status: order.deliveryStatus ?? null,
    start_count: order.startCount ?? null,
    remains: order.remains ?? null,
    error: order.error ?? null,
    created_at: now,
    updated_at: now,
  };
}

function toUpdate(patch: Partial<StoredOrder>) {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.stripeSessionId !== undefined) row.stripe_session_id = patch.stripeSessionId;
  if (patch.gogetviewsOrderId !== undefined) row.gogetviews_order_id = patch.gogetviewsOrderId;
  if (patch.serviceId !== undefined) row.service_id = patch.serviceId;
  if (patch.serviceName !== undefined) row.service_name = patch.serviceName;
  if (patch.platform !== undefined) row.platform = patch.platform;
  if (patch.link !== undefined) row.link = patch.link;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.userId !== undefined) row.user_id = patch.userId;
  if (patch.quantity !== undefined) row.quantity = patch.quantity;
  if (patch.comments !== undefined) row.comments = patch.comments;
  if (patch.amountCents !== undefined) row.amount_cents = patch.amountCents;
  if (patch.currency !== undefined) row.currency = patch.currency;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.deliveryStatus !== undefined) row.delivery_status = patch.deliveryStatus;
  if (patch.startCount !== undefined) row.start_count = patch.startCount;
  if (patch.remains !== undefined) row.remains = patch.remains;
  if (patch.error !== undefined) row.error = patch.error;
  return row;
}

function assertOk(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function createOrder(
  order: Omit<StoredOrder, "createdAt" | "updatedAt">,
): Promise<StoredOrder> {
  const { data, error } = await createServiceClient()
    .from("orders")
    .insert(toInsert(order))
    .select("*")
    .single();
  assertOk(error);
  return toStored(data as OrderRow);
}

export async function getOrderById(id: string): Promise<StoredOrder | null> {
  const { data, error } = await createServiceClient()
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  assertOk(error);
  return data ? toStored(data as OrderRow) : null;
}

export async function listOrdersForAccount(
  userId: string,
  email: string,
): Promise<StoredOrder[]> {
  const client = createServiceClient();
  const [byUser, byEmail] = await Promise.all([
    client.from("orders").select("*").eq("user_id", userId),
    client.from("orders").select("*").ilike("email", email),
  ]);
  assertOk(byUser.error);
  assertOk(byEmail.error);

  const rows = new Map<string, OrderRow>();
  for (const row of [...((byUser.data ?? []) as OrderRow[]), ...((byEmail.data ?? []) as OrderRow[])]) {
    rows.set(row.id, row);
  }

  return [...rows.values()]
    .map(toStored)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAllOrders(): Promise<StoredOrder[]> {
  const { data, error } = await createServiceClient()
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  assertOk(error);
  return ((data ?? []) as OrderRow[]).map(toStored);
}

export async function attachOrdersToUser(email: string, userId: string): Promise<void> {
  const { error } = await createServiceClient()
    .from("orders")
    .update({ user_id: userId, updated_at: new Date().toISOString() })
    .ilike("email", email);
  assertOk(error);
}

export async function getOrderByStripeSession(
  sessionId: string,
): Promise<StoredOrder | null> {
  const { data, error } = await createServiceClient()
    .from("orders")
    .select("*")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  assertOk(error);
  return data ? toStored(data as OrderRow) : null;
}

export async function updateOrder(
  id: string,
  patch: Partial<StoredOrder>,
): Promise<StoredOrder | null> {
  const { data, error } = await createServiceClient()
    .from("orders")
    .update(toUpdate(patch))
    .eq("id", id)
    .select("*")
    .maybeSingle();
  assertOk(error);
  return data ? toStored(data as OrderRow) : null;
}

export function mapDeliveryStatus(status?: string): OrderStatus {
  if (!status) return "processing";
  const value = status.toLowerCase();
  if (value === "completed") return "completed";
  if (value === "partial") return "partial";
  if (value === "in progress" || value === "processing") return "in_progress";
  if (value === "canceled" || value === "cancelled") return "cancelled";
  if (value === "pending") return "processing";
  return "in_progress";
}
